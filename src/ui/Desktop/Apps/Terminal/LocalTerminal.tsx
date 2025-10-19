import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useXTerm } from "react-xtermjs";
import { FitAddon } from "@xterm/addon-fit";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getCookie, isElectron } from "@/ui/main-axios.ts";

interface LocalTerminalProps {
  isVisible: boolean;
  title?: string;
  showTitle?: boolean;
  splitScreen?: boolean;
  onClose?: () => void;
  cwd?: string; // Current working directory to start in
}

export const LocalTerminal = forwardRef<any, LocalTerminalProps>(
  function LocalTerminal(
    { isVisible, splitScreen = false, onClose, cwd },
    ref,
  ) {
    const { t } = useTranslation();
    const { instance: terminal, ref: xtermRef } = useXTerm({
      options: {
        allowProposedApi: true,
      },
    });
    const fitAddonRef = useRef<FitAddon | null>(null);
    const webSocketRef = useRef<WebSocket | null>(null);
    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [visible, setVisible] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const isVisibleRef = useRef<boolean>(false);
    const isUnmountingRef = useRef(false);
    const shouldNotReconnectRef = useRef(false);
    const isConnectingRef = useRef(false);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const lastSentSizeRef = useRef<{ cols: number; rows: number } | null>(null);
    const pendingSizeRef = useRef<{ cols: number; rows: number } | null>(null);
    const notifyTimerRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_MS = 140;

    useEffect(() => {
      isVisibleRef.current = isVisible;
    }, [isVisible]);

    useEffect(() => {
      const checkAuth = () => {
        const jwtToken = getCookie("jwt");
        const isAuth = !!(jwtToken && jwtToken.trim() !== "");

        setIsAuthenticated((prev) => {
          if (prev !== isAuth) {
            return isAuth;
          }
          return prev;
        });
      };

      checkAuth();

      const authCheckInterval = setInterval(checkAuth, 5000);

      return () => clearInterval(authCheckInterval);
    }, []);

    function hardRefresh() {
      try {
        if (terminal && typeof (terminal as any).refresh === "function") {
          (terminal as any).refresh(0, terminal.rows - 1);
        }
      } catch (_) {}
    }

    function scheduleNotify(cols: number, rows: number) {
      if (!(cols > 0 && rows > 0)) return;
      pendingSizeRef.current = { cols, rows };
      if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current);
      notifyTimerRef.current = setTimeout(() => {
        const next = pendingSizeRef.current;
        const last = lastSentSizeRef.current;
        if (!next) return;
        if (last && last.cols === next.cols && last.rows === next.rows) return;
        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(
            JSON.stringify({ type: "resize", data: next }),
          );
          lastSentSizeRef.current = next;
        }
      }, DEBOUNCE_MS);
    }

    useImperativeHandle(
      ref,
      () => ({
        disconnect: () => {
          isUnmountingRef.current = true;
          shouldNotReconnectRef.current = true;
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          webSocketRef.current?.close();
          setIsConnected(false);
          setIsConnecting(false);
        },
        fit: () => {
          fitAddonRef.current?.fit();
          if (terminal) scheduleNotify(terminal.cols, terminal.rows);
          hardRefresh();
        },
        sendInput: (data: string) => {
          if (webSocketRef.current?.readyState === 1) {
            webSocketRef.current.send(JSON.stringify({ type: "input", data }));
          }
        },
        notifyResize: () => {
          try {
            const cols = terminal?.cols ?? undefined;
            const rows = terminal?.rows ?? undefined;
            if (typeof cols === "number" && typeof rows === "number") {
              scheduleNotify(cols, rows);
              hardRefresh();
            }
          } catch (_) {}
        },
        refresh: () => hardRefresh(),
      }),
      [terminal],
    );

    function handleWindowResize() {
      if (!isVisibleRef.current) return;
      fitAddonRef.current?.fit();
      if (terminal) scheduleNotify(terminal.cols, terminal.rows);
      hardRefresh();
    }

    function getUseRightClickCopyPaste() {
      return getCookie("rightClickCopyPaste") === "true";
    }

    function connectToLocalTerminal(cols: number, rows: number) {
      if (isConnectingRef.current) {
        return;
      }

      isConnectingRef.current = true;

      const isDev =
        process.env.NODE_ENV === "development" &&
        (window.location.port === "3000" ||
          window.location.port === "5173" ||
          window.location.port === "");

      const jwtToken = getCookie("jwt");

      if (!jwtToken || jwtToken.trim() === "") {
        console.error(
          "No JWT token available for local terminal WebSocket connection",
        );
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError("Authentication required");
        isConnectingRef.current = false;
        return;
      }

      // Local terminal WebSocket is on port 30003
      const baseWsUrl = isDev
        ? `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:30003`
        : isElectron()
          ? (() => {
              const baseUrl =
                (window as any).configuredServerUrl || "http://127.0.0.1:30001";
              const wsProtocol = baseUrl.startsWith("https://")
                ? "wss://"
                : "ws://";
              const wsHost = baseUrl.replace(/^https?:\/\//, "");
              return `${wsProtocol}${wsHost}/local/websocket/`;
            })()
          : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/local/websocket/`;

      if (
        webSocketRef.current &&
        webSocketRef.current.readyState !== WebSocket.CLOSED
      ) {
        webSocketRef.current.close();
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      const wsUrl = `${baseWsUrl}?token=${encodeURIComponent(jwtToken)}`;

      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;
      setConnectionError(null);
      shouldNotReconnectRef.current = false;
      setIsConnecting(true);

      setupWebSocketListeners(ws, cols, rows);
    }

    function setupWebSocketListeners(
      ws: WebSocket,
      cols: number,
      rows: number,
    ) {
      ws.addEventListener("open", () => {
        connectionTimeoutRef.current = setTimeout(() => {
          if (!isConnected) {
            if (terminal) {
              terminal.clear();
            }
            toast.error(t("terminal.connectionTimeout"));
            if (webSocketRef.current) {
              webSocketRef.current.close();
            }
          }
        }, 10000);

        // Send connect message to spawn local PTY
        ws.send(
          JSON.stringify({
            type: "connect",
            data: { cols, rows, cwd },
          }),
        );

        // Set up terminal input handler
        terminal.onData((data) => {
          ws.send(JSON.stringify({ type: "input", data }));
        });

        // Set up ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      });

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "output") {
            // Write terminal output
            if (typeof msg.data === "string") {
              terminal.write(msg.data);
            } else {
              terminal.write(String(msg.data));
            }
          } else if (msg.type === "connected") {
            // Connection successful
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            setIsConnected(true);
            setIsConnecting(false);
            isConnectingRef.current = false;
            toast.success(t("terminal.connected") || "Local terminal connected");
          } else if (msg.type === "error") {
            const errorMessage = msg.message || t("terminal.unknownError");
            toast.error(errorMessage);
            setConnectionError(errorMessage);
            setIsConnected(false);
            setIsConnecting(false);
            isConnectingRef.current = false;

            if (onClose) {
              onClose();
            }
          } else if (msg.type === "exit") {
            // PTY process exited
            toast.info(
              t("terminal.processExited") ||
                `Terminal process exited (code: ${msg.exitCode})`,
            );
            setIsConnected(false);
            if (onClose) {
              onClose();
            }
          } else if (msg.type === "pong") {
            // Ping response
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      ws.addEventListener("close", (event) => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;

        if (!isUnmountingRef.current && !shouldNotReconnectRef.current) {
          toast.error(
            t("terminal.disconnected") || "Local terminal disconnected",
          );
        }
      });

      ws.addEventListener("error", (error) => {
        console.error("Local terminal WebSocket error:", error);
        setConnectionError("WebSocket connection error");
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;

        toast.error(
          t("terminal.connectionError") || "Failed to connect to local terminal",
        );
      });
    }

    useEffect(() => {
      if (terminal && isAuthenticated && !isConnected && !isConnecting) {
        const cols = terminal.cols || 80;
        const rows = terminal.rows || 24;
        connectToLocalTerminal(cols, rows);
      }

      return () => {
        isUnmountingRef.current = true;
        if (webSocketRef.current) {
          webSocketRef.current.close();
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
        }
      };
    }, [terminal, isAuthenticated]);

    useEffect(() => {
      if (terminal && xtermRef.current) {
        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(new ClipboardAddon());
        terminal.loadAddon(new Unicode11Addon());
        terminal.unicode.activeVersion = "11";
        terminal.loadAddon(new WebLinksAddon());

        terminal.options = {
          ...terminal.options,
          fontFamily:
            '"Cascadia Code", "Fira Code", "Consolas", "Courier New", monospace',
          fontSize: 14,
          cursorBlink: true,
          cursorStyle: "bar",
          theme: {
            background: "#0f0f0f",
            foreground: "#ffffff",
            cursor: "#ffffff",
            selectionBackground: "rgba(255, 255, 255, 0.3)",
            black: "#000000",
            red: "#e06c75",
            green: "#98c379",
            yellow: "#d19a66",
            blue: "#61afef",
            magenta: "#c678dd",
            cyan: "#56b6c2",
            white: "#abb2bf",
            brightBlack: "#5c6370",
            brightRed: "#e06c75",
            brightGreen: "#98c379",
            brightYellow: "#d19a66",
            brightBlue: "#61afef",
            brightMagenta: "#c678dd",
            brightCyan: "#56b6c2",
            brightWhite: "#ffffff",
          },
          rightClickSelectsWord: !getUseRightClickCopyPaste(),
          scrollback: 10000,
        };

        setTimeout(() => {
          fitAddon.fit();
          if (terminal) scheduleNotify(terminal.cols, terminal.rows);
          setVisible(true);
        }, 10);

        terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
          if (e.ctrlKey && e.shiftKey && e.key === "C") {
            return false;
          }
          if (e.ctrlKey && e.shiftKey && e.key === "V") {
            return false;
          }
          return true;
        });

        window.addEventListener("resize", handleWindowResize);

        return () => {
          window.removeEventListener("resize", handleWindowResize);
        };
      }
    }, [terminal, xtermRef]);

    return (
      <div
        className="w-full h-full"
        style={{
          visibility: visible ? "visible" : "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div ref={xtermRef} className="w-full h-full" />
      </div>
    );
  },
);
