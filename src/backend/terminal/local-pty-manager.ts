import { WebSocket, WebSocketServer } from "ws";
import os from "os";
import pty from "node-pty";
import { systemLogger } from "../utils/logger.js";

let wss: WebSocketServer | null = null;

export function startLocalTerminalServer() {
  if (wss) {
    systemLogger.info("Local terminal WebSocket server is already running.");
    return;
  }

  const port = 30003;
  wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
    const ptyProcess = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });

    ptyProcess.onData((data: string) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "data", data }));
        }
      } catch (error) {
        systemLogger.error("Failed to send data to WebSocket", error);
      }
    });

    ws.on("message", (message: string) => {
      try {
        const msg = JSON.parse(message.toString());
        if (msg.type === "input") {
          ptyProcess.write(msg.data);
        } else if (msg.type === "resize") {
          if (msg.data && typeof msg.data.cols === 'number' && typeof msg.data.rows === 'number') {
            ptyProcess.resize(msg.data.cols, msg.data.rows);
          }
        }
      } catch (error) {
        systemLogger.error("Failed to process message from WebSocket", error);
      }
    });

    ws.on("close", () => {
      ptyProcess.kill();
    });

    ws.on("error", (error) => {
        systemLogger.error("WebSocket error", error);
        ptyProcess.kill();
    });
  });

  wss.on('error', (error) => {
    systemLogger.error(`Local terminal WebSocket server error on port ${port}`, error);
    wss = null;
  });

  systemLogger.info(`Local terminal WebSocket server started on port ${port}`);
}

export async function shutdownLocalTerminalServer(): Promise<void> {
    if (wss) {
        systemLogger.info("Shutting down local terminal WebSocket server...");
        return new Promise((resolve) => {
            wss!.close(() => {
                systemLogger.info("Local terminal WebSocket server has been shut down.");
                wss = null;
                resolve();
            });
        });
    }
}
