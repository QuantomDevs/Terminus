import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Github, MessageCircle, BookOpen } from "lucide-react";
import { getSetting, saveSetting, isElectron } from "@/ui/main-axios.ts";
import { useTranslation } from "react-i18next";
import { useTabs } from "@/ui/Desktop/Navigation/Tabs/TabContext.tsx";

interface ApplicationSettingsProps {
  isAdmin?: boolean;
}

export function ApplicationSettings({ isAdmin }: ApplicationSettingsProps) {
  const { t } = useTranslation();
  const { addTab, setCurrentTab, tabs } = useTabs() as any;
  const [autoUpdateCheck, setAutoUpdateCheck] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hideCloseButton, setHideCloseButton] = useState<boolean>(false);
  const [hideOptionsButton, setHideOptionsButton] = useState<boolean>(false);
  const appVersion = "1.0.0";

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      const [autoUpdate, hideClose, hideOptions] = await Promise.all([
        getSetting("auto_update_check").catch(() => ({ value: "true" })),
        getSetting("hide_close_button").catch(() => ({ value: "false" })),
        getSetting("hide_options_button").catch(() => ({ value: "false" })),
      ]);
      setAutoUpdateCheck(autoUpdate.value === "true");
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

  const handleHideCloseButtonChange = async (checked: boolean) => {
    setHideCloseButton(checked);
    try {
      await saveSetting("hide_close_button", checked);
      // Emit event to update all tabs immediately
      window.dispatchEvent(new CustomEvent("tab-settings-changed", {
        detail: { setting: "hide_close_button", value: checked }
      }));
    } catch (error) {
      console.error("Failed to save hide close button setting:", error);
      setHideCloseButton(!checked);
    }
  };

  const handleHideOptionsButtonChange = async (checked: boolean) => {
    setHideOptionsButton(checked);
    try {
      await saveSetting("hide_options_button", checked);
      // Emit event to update all tabs immediately
      window.dispatchEvent(new CustomEvent("tab-settings-changed", {
        detail: { setting: "hide_options_button", value: checked }
      }));
    } catch (error) {
      console.error("Failed to save hide options button setting:", error);
      setHideOptionsButton(!checked);
    }
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

  const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
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

      {/* Admin Actions Section */}
      {isAdmin && !isElectron() && (
        <div className="border-t border-[var(--color-dark-border)] pt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Admin Actions</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-[var(--color-sidebar-bg)] border-[var(--color-dark-border)] text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white"
              onClick={openAdminTab}
            >
              {t("admin.title")}
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
}
