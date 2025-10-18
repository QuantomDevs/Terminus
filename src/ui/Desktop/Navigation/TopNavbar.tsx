import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Hammer, User2, ChevronDown, Search, HardDrive, Cog } from "lucide-react";
import { Tab } from "@/ui/Desktop/Navigation/Tabs/Tab.tsx";
import { useTabs } from "@/ui/Desktop/Navigation/Tabs/TabContext.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useTranslation } from "react-i18next";
import { TabDropdown } from "@/ui/Desktop/Navigation/Tabs/TabDropdown.tsx";
import {
  getCookie,
  setCookie,
  logoutUser,
  isElectron,
  deleteAccount,
} from "@/ui/main-axios.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert.tsx";
import { WindowControls } from "@/ui/Desktop/Navigation/WindowControls.tsx";

interface TopNavbarProps {
  isTopbarOpen: boolean;
  setIsTopbarOpen: (open: boolean) => void;
  isAdmin?: boolean;
  username?: string | null;
  onOpenQuickConnect?: () => void;
}

export function TopNavbar({
  isTopbarOpen,
  setIsTopbarOpen,
  isAdmin,
  username,
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

  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleTabActivate = (tabId: number) => {
    setCurrentTab(tabId);
  };

  const handleTabSplit = (tabId: number) => {
    setSplitScreenTab(tabId);
  };

  const handleTabClose = (tabId: number) => {
    removeTab(tabId);
  };

  const handleTabToggle = (tabId: number) => {
    setSelectedTabIds((prev) =>
      prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId],
    );
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      const input = document.getElementById(
        "ssh-tools-input",
      ) as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setSelectedTabIds([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedTabIds.length === 0) return;

    let commandToSend = "";

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "c") {
        commandToSend = "\x03"; // Ctrl+C (SIGINT)
        e.preventDefault();
      } else if (e.key === "d") {
        commandToSend = "\x04"; // Ctrl+D (EOF)
        e.preventDefault();
      } else if (e.key === "l") {
        commandToSend = "\x0c"; // Ctrl+L (clear screen)
        e.preventDefault();
      } else if (e.key === "u") {
        commandToSend = "\x15"; // Ctrl+U (clear line)
        e.preventDefault();
      } else if (e.key === "k") {
        commandToSend = "\x0b"; // Ctrl+K (clear from cursor to end)
        e.preventDefault();
      } else if (e.key === "a") {
        commandToSend = "\x01"; // Ctrl+A (move to beginning of line)
        e.preventDefault();
      } else if (e.key === "e") {
        commandToSend = "\x05"; // Ctrl+E (move to end of line)
        e.preventDefault();
      } else if (e.key === "w") {
        commandToSend = "\x17"; // Ctrl+W (delete word before cursor)
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      commandToSend = "\n";
      e.preventDefault();
    } else if (e.key === "Backspace") {
      commandToSend = "\x08"; // Backspace
      e.preventDefault();
    } else if (e.key === "Delete") {
      commandToSend = "\x7f"; // Delete
      e.preventDefault();
    } else if (e.key === "Tab") {
      commandToSend = "\x09"; // Tab
      e.preventDefault();
    } else if (e.key === "Escape") {
      commandToSend = "\x1b"; // Escape
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      commandToSend = "\x1b[A"; // Up arrow
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      commandToSend = "\x1b[B"; // Down arrow
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      commandToSend = "\x1b[D"; // Left arrow
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      commandToSend = "\x1b[C"; // Right arrow
      e.preventDefault();
    } else if (e.key === "Home") {
      commandToSend = "\x1b[H"; // Home
      e.preventDefault();
    } else if (e.key === "End") {
      commandToSend = "\x1b[F"; // End
      e.preventDefault();
    } else if (e.key === "PageUp") {
      commandToSend = "\x1b[5~"; // Page Up
      e.preventDefault();
    } else if (e.key === "PageDown") {
      commandToSend = "\x1b[6~"; // Page Down
      e.preventDefault();
    } else if (e.key === "Insert") {
      commandToSend = "\x1b[2~"; // Insert
      e.preventDefault();
    } else if (e.key === "F1") {
      commandToSend = "\x1bOP"; // F1
      e.preventDefault();
    } else if (e.key === "F2") {
      commandToSend = "\x1bOQ"; // F2
      e.preventDefault();
    } else if (e.key === "F3") {
      commandToSend = "\x1bOR"; // F3
      e.preventDefault();
    } else if (e.key === "F4") {
      commandToSend = "\x1bOS"; // F4
      e.preventDefault();
    } else if (e.key === "F5") {
      commandToSend = "\x1b[15~"; // F5
      e.preventDefault();
    } else if (e.key === "F6") {
      commandToSend = "\x1b[17~"; // F6
      e.preventDefault();
    } else if (e.key === "F7") {
      commandToSend = "\x1b[18~"; // F7
      e.preventDefault();
    } else if (e.key === "F8") {
      commandToSend = "\x1b[19~"; // F8
      e.preventDefault();
    } else if (e.key === "F9") {
      commandToSend = "\x1b[20~"; // F9
      e.preventDefault();
    } else if (e.key === "F10") {
      commandToSend = "\x1b[21~"; // F10
      e.preventDefault();
    } else if (e.key === "F11") {
      commandToSend = "\x1b[23~"; // F11
      e.preventDefault();
    } else if (e.key === "F12") {
      commandToSend = "\x1b[24~"; // F12
      e.preventDefault();
    }

    if (commandToSend) {
      selectedTabIds.forEach((tabId) => {
        const tab = tabs.find((t: any) => t.id === tabId);
        if (tab?.terminalRef?.current?.sendInput) {
          tab.terminalRef.current.sendInput(commandToSend);
        }
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedTabIds.length === 0) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const char = e.key;
      selectedTabIds.forEach((tabId) => {
        const tab = tabs.find((t: any) => t.id === tabId);
        if (tab?.terminalRef?.current?.sendInput) {
          tab.terminalRef.current.sendInput(char);
        }
      });
    }
  };

  const isSplitScreenActive =
    Array.isArray(allSplitScreenTab) && allSplitScreenTab.length > 0;
  const currentTabObj = tabs.find((t: any) => t.id === currentTab);
  const currentTabIsHome = currentTabObj?.type === "home";
  const currentTabIsSshManager = currentTabObj?.type === "ssh_manager";
  const currentTabIsAdmin = currentTabObj?.type === "admin";
  const currentTabIsUserProfile = currentTabObj?.type === "user_profile";
  const currentTabIsSettings = currentTabObj?.type === "settings";

  const terminalTabs = tabs.filter((tab: any) => tab.type === "terminal");

  const updateRightClickCopyPaste = (checked: boolean) => {
    setCookie("rightClickCopyPaste", checked.toString());
  };

  const handleLogout = async () => {
    try {
      await logoutUser();

      if (isElectron()) {
        localStorage.removeItem("jwt");
      }

      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.reload();
    }
  };

  const userProfileTab = tabs.find((t: any) => t.type === "user_profile");
  const openUserProfileTab = () => {
    if (isSplitScreenActive) return;
    if (userProfileTab) {
      setCurrentTab(userProfileTab.id);
      return;
    }
    const id = addTab({ type: "user_profile" } as any);
    setCurrentTab(id);
  };

  const adminTab = tabs.find((t: any) => t.type === "admin");
  const openAdminTab = () => {
    if (isSplitScreenActive) return;
    if (adminTab) {
      setCurrentTab(adminTab.id);
      return;
    }
    const id = addTab({ type: "admin" } as any);
    setCurrentTab(id);
  };

  const sshManagerTab = tabs.find((t: any) => t.type === "ssh_manager");
  const openHostManagerTab = () => {
    if (isSplitScreenActive) return;
    if (sshManagerTab) {
      setCurrentTab(sshManagerTab.id);
      return;
    }
    // The ssh_manager tab should always exist as the default tab
    // But if for some reason it doesn't, we can create it
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

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError(null);

    if (!deletePassword.trim()) {
      setDeleteError(t("leftSidebar.passwordRequired"));
      setDeleteLoading(false);
      return;
    }

    try {
      await deleteAccount(deletePassword);
      handleLogout();
    } catch (err: any) {
      setDeleteError(
        err?.response?.data?.error || t("leftSidebar.failedToDeleteAccount"),
      );
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div
        className="fixed z-10 h-[32px] bg-dark-bg border-2 border-dark-border rounded-lg transition-all duration-200 ease-linear flex flex-row transform-none m-0 p-0"
        style={{
          top: "0.5rem",
          left: isElectron() ? "0.5rem" : "26px",
          right: isElectron() ? "0.5rem" : "17px",
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
          className="h-full p-1 pr-2 border-r-2 border-dark-border flex-1 flex items-center overflow-x-auto overflow-y-hidden gap-2 thin-scrollbar"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {tabs.map((tab: any) => {
            const isActive = tab.id === currentTab;
            const isSplit =
              Array.isArray(allSplitScreenTab) &&
              allSplitScreenTab.includes(tab.id);
            const isTerminal = tab.type === "terminal";
            const isServer = tab.type === "server";
            const isFileManager = tab.type === "file_manager";
            const isSshManager = tab.type === "ssh_manager";
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
              currentTabIsSshManager ||
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
            return (
              <Tab
                key={tab.id}
                tabType={tab.type}
                title={tab.title}
                isActive={isActive}
                onActivate={() => handleTabActivate(tab.id)}
                onClose={
                  isTerminal ||
                  isServer ||
                  isFileManager ||
                  isAdmin ||
                  isUserProfile ||
                  isSettings
                    ? () => handleTabClose(tab.id)
                    : undefined
                }
                onSplit={
                  isSplittable ? () => handleTabSplit(tab.id) : undefined
                }
                canSplit={isSplittable}
                canClose={
                  isTerminal ||
                  isServer ||
                  isFileManager ||
                  isAdmin ||
                  isUserProfile ||
                  isSettings
                }
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
          <Button
            variant="outline"
            className="w-[24px] h-[24px] p-0"
            title={t("nav.quickConnect")}
            onClick={onOpenQuickConnect}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            className="w-[24px] h-[24px] p-0"
            title={t("nav.hostManager")}
            onClick={openHostManagerTab}
            disabled={isSplitScreenActive}
          >
            <HardDrive className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            className="w-[24px] h-[24px] p-0"
            title="Settings"
            onClick={openSettingsTab}
            disabled={isSplitScreenActive}
          >
            <Cog className="h-3.5 w-3.5" />
          </Button>

          <TabDropdown />

          <Button
            variant="outline"
            className="w-[24px] h-[24px] p-0"
            title={t("nav.tools")}
            onClick={() => setToolsSheetOpen(true)}
          >
            <Hammer className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-[24px] px-2 flex items-center gap-1.5"
              >
                <User2 className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {username || t("common.account")}
                </span>
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="end"
              sideOffset={6}
              className="min-w-[200px] bg-sidebar-accent text-sidebar-accent-foreground border border-border rounded-md shadow-2xl p-1"
            >
              <DropdownMenuItem
                className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                onClick={openUserProfileTab}
              >
                <span>{t("profile.title")}</span>
              </DropdownMenuItem>
              {isAdmin && !isElectron() && (
                <DropdownMenuItem
                  className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                  onClick={openAdminTab}
                >
                  <span>{t("admin.title")}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                onClick={handleLogout}
              >
                <span>{t("common.logout")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded px-2 py-1.5 hover:bg-white/15 hover:text-accent-foreground focus:bg-white/20 focus:text-accent-foreground cursor-pointer focus:outline-none"
                onClick={() => setDeleteAccountOpen(true)}
              >
                <span className="text-red-400">
                  {t("leftSidebar.deleteAccount")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Windows Controls integrated in header */}
        {isElectron() && platform === "win32" && <WindowControls />}
      </div>

      {toolsSheetOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[999999] flex justify-end pointer-events-auto isolate"
          style={{
            transform: "translateZ(0)",
          }}
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setToolsSheetOpen(false)}
          />

          <div
            className="w-[400px] h-full bg-dark-bg border-l-2 border-dark-border flex flex-col shadow-2xl relative isolate z-[999999]"
            style={{
              boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.5)",
              transform: "translateZ(0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <h2 className="text-lg font-semibold text-white">
                {t("sshTools.title")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setToolsSheetOpen(false)}
                className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                title={t("sshTools.closeTools")}
              >
                <span className="text-lg font-bold leading-none">×</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <h1 className="font-semibold">{t("sshTools.keyRecording")}</h1>

                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <Button
                          onClick={handleStartRecording}
                          className="flex-1"
                          variant="outline"
                        >
                          {t("sshTools.startKeyRecording")}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleStopRecording}
                          className="flex-1"
                          variant="destructive"
                        >
                          {t("sshTools.stopKeyRecording")}
                        </Button>
                      )}
                    </div>

                    {isRecording && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">
                            {t("sshTools.selectTerminals")}
                          </label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto mt-2">
                            {terminalTabs.map((tab) => (
                              <Button
                                key={tab.id}
                                type="button"
                                variant="outline"
                                size="sm"
                                className={`rounded-full px-3 py-1 text-xs flex items-center gap-1 ${
                                  selectedTabIds.includes(tab.id)
                                    ? "text-white bg-gray-700"
                                    : "text-gray-500"
                                }`}
                                onClick={() => handleTabToggle(tab.id)}
                              >
                                {tab.title}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">
                            {t("sshTools.typeCommands")}
                          </label>
                          <Input
                            id="ssh-tools-input"
                            placeholder={t("placeholders.typeHere")}
                            onKeyDown={handleKeyDown}
                            onKeyPress={handleKeyPress}
                            className="font-mono mt-2"
                            disabled={selectedTabIds.length === 0}
                            readOnly
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("sshTools.commandsWillBeSent", {
                              count: selectedTabIds.length,
                            })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <h1 className="font-semibold">{t("sshTools.settings")}</h1>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-copy-paste"
                    onCheckedChange={updateRightClickCopyPaste}
                    defaultChecked={getCookie("rightClickCopyPaste") === "true"}
                  />
                  <label
                    htmlFor="enable-copy-paste"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                  >
                    {t("sshTools.enableRightClickCopyPaste")}
                  </label>
                </div>

                <Separator className="my-4" />

                <p className="pt-2 pb-2 text-sm text-gray-500">
                  {t("sshTools.shareIdeas")}{" "}
                  <a
                    href="https://github.com/Snenjih/Terminus/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    GitHub
                  </a>
                  !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteAccountOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[999999] pointer-events-auto isolate"
          style={{
            transform: "translateZ(0)",
            willChange: "z-index",
          }}
        >
          <div
            className="w-[400px] h-full bg-dark-bg border-r-2 border-dark-border flex flex-col shadow-2xl relative isolate z-[9999999]"
            style={{
              boxShadow: "4px 0 20px rgba(0, 0, 0, 0.5)",
              transform: "translateZ(0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <h2 className="text-lg font-semibold text-white">
                {t("leftSidebar.deleteAccount")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                title={t("leftSidebar.closeDeleteAccount")}
              >
                <span className="text-lg font-bold leading-none">×</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="text-sm text-gray-300">
                  {t("leftSidebar.deleteAccountWarning")}
                </div>

                <Alert variant="destructive">
                  <AlertTitle>{t("common.warning")}</AlertTitle>
                  <AlertDescription>
                    {t("leftSidebar.deleteAccountWarningDetails")}
                  </AlertDescription>
                </Alert>

                {deleteError && (
                  <Alert variant="destructive">
                    <AlertTitle>{t("common.error")}</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">
                      {t("leftSidebar.confirmPassword")}
                    </Label>
                    <PasswordInput
                      id="delete-password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder={t("placeholders.confirmPassword")}
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      className="flex-1"
                      disabled={deleteLoading || !deletePassword.trim()}
                    >
                      {deleteLoading
                        ? t("leftSidebar.deleting")
                        : t("leftSidebar.deleteAccount")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDeleteAccountOpen(false);
                        setDeletePassword("");
                        setDeleteError(null);
                      }}
                    >
                      {t("leftSidebar.cancel")}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => {
              setDeleteAccountOpen(false);
              setDeletePassword("");
              setDeleteError(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
