import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Github, MessageCircle, BookOpen, User2 } from "lucide-react";
import { getSetting, saveSetting, logoutUser, deleteAccount, isElectron } from "@/ui/main-axios.ts";
import { useTranslation } from "react-i18next";
import { useTabs } from "@/ui/Desktop/Navigation/Tabs/TabContext.tsx";
import { PasswordInput } from "@/components/ui/password-input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert.tsx";

interface ApplicationSettingsProps {
  username?: string | null;
  isAdmin?: boolean;
}

export function ApplicationSettings({ username, isAdmin }: ApplicationSettingsProps) {
  const { t } = useTranslation();
  const { addTab, setCurrentTab, tabs } = useTabs() as any;
  const [autoUpdateCheck, setAutoUpdateCheck] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tabWidth, setTabWidth] = useState<string>("dynamic");
  const [hideCloseButton, setHideCloseButton] = useState<boolean>(false);
  const [hideOptionsButton, setHideOptionsButton] = useState<boolean>(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const appVersion = "1.0.0";

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      const [autoUpdate, tabWidthSetting, hideClose, hideOptions] = await Promise.all([
        getSetting("auto_update_check").catch(() => ({ value: "true" })),
        getSetting("tab_width").catch(() => ({ value: "dynamic" })),
        getSetting("hide_close_button").catch(() => ({ value: "false" })),
        getSetting("hide_options_button").catch(() => ({ value: "false" })),
      ]);
      setAutoUpdateCheck(autoUpdate.value === "true");
      setTabWidth(tabWidthSetting.value || "dynamic");
      setHideCloseButton(hideClose.value === "true");
      setHideOptionsButton(hideOptions.value === "true");
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoUpdateCheckChange = async (checked: boolean) => {
    setAutoUpdateCheck(checked);
    try {
      await saveSetting("auto_update_check", checked);
    } catch (error) {
      console.error("Failed to save auto update check setting:", error);
      setAutoUpdateCheck(!checked);
    }
  };

  const handleTabWidthChange = async (value: string) => {
    setTabWidth(value);
    try {
      await saveSetting("tab_width", value);
    } catch (error) {
      console.error("Failed to save tab width setting:", error);
    }
  };

  const handleHideCloseButtonChange = async (checked: boolean) => {
    setHideCloseButton(checked);
    try {
      await saveSetting("hide_close_button", checked);
    } catch (error) {
      console.error("Failed to save hide close button setting:", error);
      setHideCloseButton(!checked);
    }
  };

  const handleHideOptionsButtonChange = async (checked: boolean) => {
    setHideOptionsButton(checked);
    try {
      await saveSetting("hide_options_button", checked);
    } catch (error) {
      console.error("Failed to save hide options button setting:", error);
      setHideOptionsButton(!checked);
    }
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
    if (userProfileTab) {
      setCurrentTab(userProfileTab.id);
      return;
    }
    const id = addTab({ type: "user_profile" } as any);
    setCurrentTab(id);
  };

  const adminTab = tabs.find((t: any) => t.type === "admin");
  const openAdminTab = () => {
    if (adminTab) {
      setCurrentTab(adminTab.id);
      return;
    }
    const id = addTab({ type: "admin" } as any);
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

  const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {/* Header Section with User Info */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/icon.svg"
              alt="Terminus Logo"
              className="w-16 h-16"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">Terminus</h1>
              <p className="text-sm text-gray-400">Version {appVersion}</p>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
              <User2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-white">
                {username || t("common.account")}
              </span>
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
            onClick={() => openExternalLink("https://github.com/Snenjih/Terminus")}
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
            onClick={() => openExternalLink("https://discord.gg/f46gXT69Fd")}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Discord</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
            onClick={() => openExternalLink("https://snenjih.de/docs/terminus")}
          >
            <BookOpen className="w-4 h-4" />
            <span>Docs</span>
          </Button>
        </div>
      </div>

      {/* User Actions Section */}
      <div className="border-t border-[var(--color-dark-border)] pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">User Actions</h2>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
            onClick={openUserProfileTab}
          >
            {t("profile.title")}
          </Button>
          {isAdmin && !isElectron() && (
            <Button
              variant="outline"
              className="w-full justify-start bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
              onClick={openAdminTab}
            >
              {t("admin.title")}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
            onClick={handleLogout}
          >
            {t("common.logout")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)] text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setDeleteAccountOpen(true)}
          >
            {t("leftSidebar.deleteAccount")}
          </Button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="border-t border-[var(--color-dark-border)] pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">General Settings</h2>

        <div className="space-y-4">
          {/* Automatic Update Check Setting */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                Automatic Update Check
              </label>
              <p className="text-xs text-gray-400">
                Automatically check for new versions on startup
              </p>
            </div>
            <Switch
              checked={autoUpdateCheck}
              onCheckedChange={handleAutoUpdateCheckChange}
              disabled={isLoading}
              className="data-[state=checked]:bg-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Header Settings Section */}
      <div className="border-t border-[var(--color-dark-border)] pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Header Settings</h2>

        <div className="space-y-4">
          {/* Tab Width Setting */}
          <div className="p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
            <div className="space-y-3">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-white">
                  Tab Width
                </label>
                <p className="text-xs text-gray-400">
                  Set tab width to dynamic (based on content) or fixed (200px)
                </p>
              </div>
              <Select value={tabWidth} onValueChange={handleTabWidthChange} disabled={isLoading}>
                <SelectTrigger className="bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300">
                  <SelectValue placeholder="Select tab width" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)]">
                  <SelectItem value="dynamic" className="text-gray-300 hover:bg-[var(--color-sidebar-accent)]">
                    Dynamic
                  </SelectItem>
                  <SelectItem value="fixed" className="text-gray-300 hover:bg-[var(--color-sidebar-accent)]">
                    Fixed (200px)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hide Close Button Setting */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                Hide Close Button
              </label>
              <p className="text-xs text-gray-400">
                Hide the close button on tabs
              </p>
            </div>
            <Switch
              checked={hideCloseButton}
              onCheckedChange={handleHideCloseButtonChange}
              disabled={isLoading}
              className="data-[state=checked]:bg-[var(--color-primary)]"
            />
          </div>

          {/* Hide Options Button Setting */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                Hide Options Button
              </label>
              <p className="text-xs text-gray-400">
                Hide the options button on tabs
              </p>
            </div>
            <Switch
              checked={hideOptionsButton}
              onCheckedChange={handleHideOptionsButtonChange}
              disabled={isLoading}
              className="data-[state=checked]:bg-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteAccountOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 z-[999999] pointer-events-auto isolate flex items-center justify-center"
          style={{
            transform: "translateZ(0)",
            background: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => {
            setDeleteAccountOpen(false);
            setDeletePassword("");
            setDeleteError(null);
          }}
        >
          <div
            className="w-[400px] bg-dark-bg border-2 border-dark-border rounded-lg shadow-2xl relative isolate"
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
                className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-colors"
              >
                <span className="text-lg font-bold">×</span>
              </Button>
            </div>

            <div className="p-4 space-y-4">
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
      )}
    </div>
  );
}
