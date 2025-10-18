import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { TabContextTab } from "../../../../types/index.js";
import {
  getSessionState,
  saveSessionState,
  deleteSessionState,
} from "../../../main-axios.js";

export type Tab = TabContextTab;

interface TabContextType {
  tabs: Tab[];
  currentTab: number | null;
  allSplitScreenTab: number[];
  addTab: (tab: Omit<Tab, "id">) => number;
  removeTab: (tabId: number) => void;
  setCurrentTab: (tabId: number) => void;
  setSplitScreenTab: (tabId: number) => void;
  getTab: (tabId: number) => Tab | undefined;
  updateHostConfig: (hostId: number, newHostConfig: any) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function useTabs() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTabs must be used within a TabProvider");
  }
  return context;
}

interface TabProviderProps {
  children: ReactNode;
}

export function TabProvider({ children }: TabProviderProps) {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, type: "ssh_manager", title: t("nav.hostManager") },
  ]);
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [allSplitScreenTab, setAllSplitScreenTab] = useState<number[]>([]);
  const nextTabId = useRef(2);
  const [sessionRestored, setSessionRestored] = useState(false);

  function computeUniqueTitle(
    tabType: Tab["type"],
    desiredTitle: string | undefined,
  ): string {
    const defaultTitle =
      tabType === "server"
        ? t("nav.serverStats")
        : tabType === "file_manager"
          ? t("nav.fileManager")
          : tabType === "remote_editor"
            ? "File"
            : t("nav.terminal");
    const baseTitle = (desiredTitle || defaultTitle).trim();
    const match = baseTitle.match(/^(.*) \((\d+)\)$/);
    const root = match ? match[1] : baseTitle;

    const usedNumbers = new Set<number>();
    let rootUsed = false;
    tabs.forEach((t) => {
      if (!t.title) return;
      if (t.title === root) {
        rootUsed = true;
        return;
      }
      const m = t.title.match(
        new RegExp(
          `^${root.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")} \\((\\d+)\\)$`,
        ),
      );
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) usedNumbers.add(n);
      }
    });

    if (!rootUsed) return root;
    let n = 2;
    while (usedNumbers.has(n)) n += 1;
    return `${root} (${n})`;
  }

  const addTab = (tabData: Omit<Tab, "id">): number => {
    const id = nextTabId.current++;
    const needsUniqueTitle =
      tabData.type === "terminal" ||
      tabData.type === "local_terminal" ||
      tabData.type === "server" ||
      tabData.type === "file_manager" ||
      tabData.type === "remote_editor";
    const effectiveTitle = needsUniqueTitle
      ? computeUniqueTitle(tabData.type, tabData.title)
      : tabData.title || "";
    const newTab: Tab = {
      ...tabData,
      id,
      title: effectiveTitle,
      terminalRef:
        tabData.type === "terminal" || tabData.type === "local_terminal"
          ? React.createRef<any>()
          : undefined,
    };
    setTabs((prev) => [...prev, newTab]);
    setCurrentTab(id);
    setAllSplitScreenTab((prev) => prev.filter((tid) => tid !== id));
    return id;
  };

  const removeTab = (tabId: number) => {
    const tab = tabs.find((t) => t.id === tabId);

    // Prevent closing ssh_manager tab if it's the only tab
    if (tab?.type === "ssh_manager" && tabs.length === 1) {
      return;
    }

    if (
      tab &&
      tab.terminalRef?.current &&
      typeof tab.terminalRef.current.disconnect === "function"
    ) {
      tab.terminalRef.current.disconnect();
    }

    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    setAllSplitScreenTab((prev) => prev.filter((id) => id !== tabId));

    if (currentTab === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setCurrentTab(remainingTabs[0].id);
      } else {
        // If no tabs remain, ensure we have the ssh_manager tab
        setCurrentTab(1);
      }
    }
  };

  const setSplitScreenTab = (tabId: number) => {
    setAllSplitScreenTab((prev) => {
      if (prev.includes(tabId)) {
        return prev.filter((id) => id !== tabId);
      } else if (prev.length < 3) {
        return [...prev, tabId];
      }
      return prev;
    });
  };

  const getTab = (tabId: number) => {
    return tabs.find((tab) => tab.id === tabId);
  };

  const updateHostConfig = (hostId: number, newHostConfig: any) => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.hostConfig && tab.hostConfig.id === hostId) {
          return {
            ...tab,
            hostConfig: newHostConfig,
            title: newHostConfig.name?.trim()
              ? newHostConfig.name
              : `${newHostConfig.username}@${newHostConfig.ip}:${newHostConfig.port}`,
          };
        }
        return tab;
      }),
    );
  };

  // Restore session state on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionData = await getSessionState();

        if (sessionData && sessionData.sessionData && sessionData.sessionData.length > 0) {
          // Filter out ssh_manager tab from restored tabs (we already have it)
          const restoredTabs = sessionData.sessionData.filter(
            (tab: any) => tab.type !== "ssh_manager"
          );

          if (restoredTabs.length > 0) {
            // Find max ID to set nextTabId correctly
            const maxId = Math.max(
              1,
              ...restoredTabs.map((tab: any) => tab.id)
            );
            nextTabId.current = maxId + 1;

            // Restore tabs with terminalRef for terminal/local_terminal types
            const tabsWithRefs = restoredTabs.map((tab: any) => ({
              ...tab,
              terminalRef:
                tab.type === "terminal" || tab.type === "local_terminal"
                  ? React.createRef<any>()
                  : undefined,
            }));

            setTabs([
              { id: 1, type: "ssh_manager", title: t("nav.hostManager") },
              ...tabsWithRefs,
            ]);

            // Set the first restored tab as current if available
            if (tabsWithRefs.length > 0) {
              setCurrentTab(tabsWithRefs[0].id);
            }

            // Clear the saved state after successful restoration
            await deleteSessionState();
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setSessionRestored(true);
      }
    };

    restoreSession();
  }, [t]);

  // Save session state when tabs change (but only after session has been restored)
  useEffect(() => {
    if (!sessionRestored) return;

    const saveSession = async () => {
      try {
        // Serialize tabs, excluding terminalRef and ssh_manager tab
        const serializableTabs = tabs
          .filter((tab) => tab.type !== "ssh_manager")
          .map((tab) => {
            const { terminalRef, ...rest } = tab;
            return rest;
          });

        // Only save if we have tabs to save
        if (serializableTabs.length > 0) {
          await saveSessionState(serializableTabs);
        } else {
          // Delete session if no tabs to save
          await deleteSessionState();
        }
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveSession, 500);
    return () => clearTimeout(timeoutId);
  }, [tabs, sessionRestored]);

  // Save session on window/app close
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Serialize tabs, excluding terminalRef and ssh_manager tab
        const serializableTabs = tabs
          .filter((tab) => tab.type !== "ssh_manager")
          .map((tab) => {
            const { terminalRef, ...rest } = tab;
            return rest;
          });

        // Use synchronous storage for beforeunload to ensure it completes
        if (serializableTabs.length > 0) {
          // Send a synchronous beacon request to save the session
          const data = JSON.stringify({ sessionData: serializableTabs });
          const blob = new Blob([data], { type: "application/json" });

          if (navigator.sendBeacon) {
            // Use sendBeacon for reliable data transmission during page unload
            const token = localStorage.getItem("jwt");
            const url = `/session?token=${encodeURIComponent(token || "")}`;
            navigator.sendBeacon(url, blob);
          }
        }
      } catch (error) {
        console.error("Failed to save session on beforeunload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [tabs]);

  const value: TabContextType = {
    tabs,
    currentTab,
    allSplitScreenTab,
    addTab,
    removeTab,
    setCurrentTab,
    setSplitScreenTab,
    getTab,
    updateHostConfig,
  };

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
