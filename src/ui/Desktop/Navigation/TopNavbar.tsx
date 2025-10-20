import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Home, Cog } from "lucide-react";
import { Tab } from "@/ui/Desktop/Navigation/Tabs/Tab.tsx";
import { useTabs } from "@/ui/Desktop/Navigation/Tabs/TabContext.tsx";
import { useTranslation } from "react-i18next";
import { TabDropdown } from "@/ui/Desktop/Navigation/Tabs/TabDropdown.tsx";
import { isElectron } from "@/ui/main-axios.ts";
import { WindowControls } from "@/ui/Desktop/Navigation/WindowControls.tsx";

interface TopNavbarProps {
  isTopbarOpen: boolean;
  setIsTopbarOpen: (open: boolean) => void;
  onOpenQuickConnect?: () => void;
}

export function TopNavbar({
  isTopbarOpen,
  setIsTopbarOpen,
  onOpenQuickConnect,
}: TopNavbarProps): React.ReactElement {
  const {
    tabs,
    currentTab,
    setCurrentTab,
    setSplitScreenTab,
    removeTab,
    allSplitScreenTab,
    addTab,
  } = useTabs() as any;
  const { t } = useTranslation();

  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (isElectron() && window.electronAPI?.getPlatform) {
      window.electronAPI.getPlatform().then((p: string) => {
        setPlatform(p);
      });
    }
  }, []);

  // Double-click handler for maximize/restore
  const handleHeaderDoubleClick = () => {
    if (isElectron() && window.electronAPI?.windowMaximize) {
      window.electronAPI.windowMaximize();
    }
  };

  const handleTabActivate = (tabId: number) => {
    setCurrentTab(tabId);
  };

  const handleTabSplit = (tabId: number) => {
    setSplitScreenTab(tabId);
  };

  const handleTabClose = (tabId: number) => {
    removeTab(tabId);
  };

  const handleTabRename = (tabId: number, newTitle: string) => {
    const tab = tabs.find((t: any) => t.id === tabId);
    if (tab) {
      tab.title = newTitle;
    }
  };

  const handleTabDuplicate = (tabId: number) => {
    const tab = tabs.find((t: any) => t.id === tabId);
    if (tab) {
      const newTab = { ...tab, id: undefined, title: tab.title };
      const id = addTab(newTab);
      setCurrentTab(id);
    }
  };

  const handleCloseOtherTabs = (keepTabId: number) => {
    tabs.forEach((tab: any) => {
      if (
        tab.id !== keepTabId &&
        tab.type !== "ssh_manager" &&
        (tab.type === "terminal" ||
          tab.type === "local_terminal" ||
          tab.type === "server" ||
          tab.type === "file_manager" ||
          tab.type === "admin" ||
          tab.type === "user_profile" ||
          tab.type === "settings" ||
          tab.type === "remote_editor")
      ) {
        removeTab(tab.id);
      }
    });
  };

  const isSplitScreenActive =
    Array.isArray(allSplitScreenTab) && allSplitScreenTab.length > 0;
  const currentTabObj = tabs.find((t: any) => t.id === currentTab);
  const currentTabIsHome = currentTabObj?.type === "home";
  const currentTabIsAdmin = currentTabObj?.type === "admin";
  const currentTabIsUserProfile = currentTabObj?.type === "user_profile";
  const currentTabIsSettings = currentTabObj?.type === "settings";

  const sshManagerTab = tabs.find((t: any) => t.type === "ssh_manager");
  const openHostManagerTab = () => {
    if (isSplitScreenActive) return;
    if (sshManagerTab) {
      setCurrentTab(sshManagerTab.id);
      return;
    }
    const id = addTab({ type: "ssh_manager" } as any);
    setCurrentTab(id);
  };

  const settingsTab = tabs.find((t: any) => t.type === "settings");
  const openSettingsTab = () => {
    if (isSplitScreenActive) return;
    if (settingsTab) {
      setCurrentTab(settingsTab.id);
      return;
    }
    const id = addTab({ type: "settings", title: "Settings" } as any);
    setCurrentTab(id);
  };

  return (
    <div>
      <div
        className="fixed z-10 h-[38px] w-[100%] bg-background transition-all duration-200 ease-linear flex flex-row transform-none m-0 p-0"
        style={{
          top: "0rem",
          WebkitAppRegion: isElectron() ? "drag" : "none",
        } as React.CSSProperties}
        onDoubleClick={handleHeaderDoubleClick}
      >
        {/* macOS Traffic Lights Placeholder */}
        {isElectron() && platform === "darwin" && (
          <div
            className="h-full w-[70px] flex items-center justify-start pl-3"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            {/* Placeholder for macOS traffic lights - they are rendered by the OS */}
          </div>
        )}

        <div
          className="h-full pr-2 border-r-2 border-dark-border flex-1 flex items-center overflow-x-auto overflow-y-hidden gap-0 thin-scrollbar"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {tabs.map((tab: any) => {
            const isActive = tab.id === currentTab;
            const isSplit =
              Array.isArray(allSplitScreenTab) &&
              allSplitScreenTab.includes(tab.id);
            const isTerminal = tab.type === "terminal";
            const isLocalTerminal = tab.type === "local_terminal";
            const isServer = tab.type === "server";
            const isFileManager = tab.type === "file_manager";
            const isRemoteEditor = tab.type === "remote_editor";
            const isAdmin = tab.type === "admin";
            const isUserProfile = tab.type === "user_profile";
            const isSettings = tab.type === "settings";
            const isSplittable = isTerminal || isServer || isFileManager;
            const isSplitButtonDisabled =
              (isActive && !isSplitScreenActive) ||
              ((allSplitScreenTab?.length || 0) >= 3 && !isSplit);
            const disableSplit =
              !isSplittable ||
              isSplitButtonDisabled ||
              isActive ||
              currentTabIsHome ||
              currentTabIsAdmin ||
              currentTabIsUserProfile ||
              currentTabIsSettings;
            const disableActivate =
              isSplit ||
              ((tab.type === "home" ||
                tab.type === "ssh_manager" ||
                tab.type === "admin" ||
                tab.type === "user_profile" ||
                tab.type === "settings") &&
                isSplitScreenActive);
            const disableClose = (isSplitScreenActive && isActive) || isSplit;
            const canClose =
              isTerminal ||
              isLocalTerminal ||
              isServer ||
              isFileManager ||
              isRemoteEditor ||
              isAdmin ||
              isUserProfile ||
              isSettings;
            return (
              <Tab
                key={tab.id}
                tabType={tab.type}
                title={tab.title}
                isActive={isActive}
                onActivate={() => handleTabActivate(tab.id)}
                onClose={
                  canClose
                    ? () => handleTabClose(tab.id)
                    : undefined
                }
                onSplit={
                  isSplittable ? () => handleTabSplit(tab.id) : undefined
                }
                onRename={(newTitle) => handleTabRename(tab.id, newTitle)}
                onDuplicate={canClose ? () => handleTabDuplicate(tab.id) : undefined}
                onCloseOthers={() => handleCloseOtherTabs(tab.id)}
                canSplit={isSplittable}
                canClose={canClose}
                disableActivate={disableActivate}
                disableSplit={disableSplit}
                disableClose={disableClose}
              />
            );
          })}
        </div>

        <div
          className="flex items-center justify-center gap-1.5 px-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {/* Search / Quick Connect Button */}
          <Button
            variant="ghost"
            className="w-[24px] h-[24px] p-0 flex items-center justify-center hover:bg-transparent"
            title={t("nav.quickConnect")}
            onClick={onOpenQuickConnect}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 576 512"
              fill="currentColor"
            >
              <path d="M464 480H96c-35.35 0-64-28.65-64-64V112C32 103.2 24.84 96 16 96S0 103.2 0 112V416c0 53.02 42.98 96 96 96h368c8.836 0 16-7.164 16-16S472.8 480 464 480zM512 0H160C124.7 0 96 28.65 96 64v288c0 35.35 28.65 64 64 64h352c35.35 0 64-28.65 64-64V64C576 28.65 547.3 0 512 0zM128 64c0-17.67 14.33-32 32-32h64v64H128V64zM544 352c0 17.67-14.33 32-32 32H160c-17.67 0-32-14.33-32-32V128h416V352zM544 96H256V32h256c17.67 0 32 14.33 32 32V96z" />
            </svg>
          </Button>

          {/* Home / Host Manager Button */}
          <Button
            variant="ghost"
            className="w-[24px] h-[24px] p-0 flex items-center justify-center hover:bg-transparent"
            title={t("nav.hostManager")}
            onClick={openHostManagerTab}
            disabled={isSplitScreenActive}
          >
            <Home className="h-3.5 w-3.5" />
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            className="w-[24px] h-[24px] p-0 flex items-center justify-center hover:bg-transparent"
            title="Settings"
            onClick={openSettingsTab}
            disabled={isSplitScreenActive}
          >
            <Cog className="h-3.5 w-3.5" />
          </Button>

          {/* Tab Dropdown */}
          <TabDropdown />
        </div>

        {/* Windows Controls integrated in header */}
        {isElectron() && platform === "win32" && <WindowControls />}
      </div>
    </div>
  );
}
