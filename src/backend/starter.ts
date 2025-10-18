import dotenv from "dotenv";
import { promises as fs } from "fs";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AutoSSLSetup } from "./utils/auto-ssl-setup.js";
import { AuthManager } from "./utils/auth-manager.js";
import { DataCrypto } from "./utils/data-crypto.js";
import { SystemCrypto } from "./utils/system-crypto.js";
import { systemLogger, versionLogger } from "./utils/logger.js";

(async () => {
  try {
    dotenv.config({ quiet: true });

    const dataDir = process.env.DATA_DIR || "./db/data";
    const envPath = path.join(dataDir, ".env");
    try {
      await fs.access(envPath);
      const persistentConfig = dotenv.config({ path: envPath, quiet: true });
      if (persistentConfig.parsed) {
        Object.assign(process.env, persistentConfig.parsed);
      }
    } catch {}

    let version = "unknown";

    const versionSources = [
      () => process.env.VERSION,
      () => {
        try {
          const packageJsonPath = path.join(process.cwd(), "package.json");
          const packageJson = JSON.parse(
            readFileSync(packageJsonPath, "utf-8"),
          );
          return packageJson.version;
        } catch {
          return null;
        }
      },
      () => {
        try {
          const __filename = fileURLToPath(import.meta.url);
          const packageJsonPath = path.join(
            path.dirname(__filename),
            "../../../package.json",
          );
          const packageJson = JSON.parse(
            readFileSync(packageJsonPath, "utf-8"),
          );
          return packageJson.version;
        } catch {
          return null;
        }
      },
      () => {
        try {
          const packageJsonPath = path.join("/app", "package.json");
          const packageJson = JSON.parse(
            readFileSync(packageJsonPath, "utf-8"),
          );
          return packageJson.version;
        } catch {
          return null;
        }
      },
    ];

    for (const getVersion of versionSources) {
      try {
        const foundVersion = getVersion();
        if (foundVersion && foundVersion !== "unknown") {
          version = foundVersion;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    versionLogger.info(`Terminus Backend starting - Version: ${version}`, {
      operation: "startup",
      version: version,
    });

    const systemCrypto = SystemCrypto.getInstance();
    await systemCrypto.initializeJWTSecret();
    await systemCrypto.initializeDatabaseKey();
    await systemCrypto.initializeInternalAuthToken();

    await AutoSSLSetup.initialize();

    const dbModule = await import("./database/db/index.js");
    await dbModule.initializeDatabase();

    const authManager = AuthManager.getInstance();
    await authManager.initialize();
    DataCrypto.initialize();

    await import("./database/database.js");

    await import("./ssh/terminal.js");
    await import("./ssh/tunnel.js");
    await import("./ssh/file-manager.js");
    await import("./ssh/server-stats.js");
    const localPtyModule = await import("./terminal/local-pty-manager.js");

    // Import and start local file manager server
    const localFileModule = await import("./local/local-file-manager.js");
    await localFileModule.startLocalFileServer();

    // Graceful shutdown handler
    async function gracefulShutdown(signal: string) {
      systemLogger.info(
        `Received ${signal} signal, initiating graceful shutdown...`,
        { operation: "shutdown", signal },
      );

      try {
        // Shutdown local terminal WebSocket server
        if (
          localPtyModule &&
          typeof localPtyModule.shutdownLocalTerminalServer === "function"
        ) {
          systemLogger.info("Shutting down local terminal server...", {
            operation: "shutdown_local_terminal",
          });
          await localPtyModule.shutdownLocalTerminalServer();
        }

        systemLogger.info("Graceful shutdown complete", {
          operation: "shutdown_complete",
        });
        process.exit(0);
      } catch (error) {
        systemLogger.error("Error during graceful shutdown", error, {
          operation: "shutdown_error",
        });
        process.exit(1);
      }
    }

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    process.on("uncaughtException", (error) => {
      systemLogger.error("Uncaught exception occurred", error, {
        operation: "error_handling",
      });
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      systemLogger.error("Unhandled promise rejection", reason, {
        operation: "error_handling",
      });
      process.exit(1);
    });
  } catch (error) {
    systemLogger.error("Failed to initialize backend services", error, {
      operation: "startup_failed",
    });
    process.exit(1);
  }
})();
