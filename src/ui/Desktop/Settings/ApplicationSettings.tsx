import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Github, MessageCircle, BookOpen } from "lucide-react";
import { getSetting, saveSetting } from "@/ui/main-axios.ts";

interface ApplicationSettingsProps {}

export function ApplicationSettings({}: ApplicationSettingsProps) {
  const [autoUpdateCheck, setAutoUpdateCheck] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const appVersion = "1.0.0";

  useEffect(() => {
    loadAutoUpdateCheckSetting();
  }, []);

  const loadAutoUpdateCheckSetting = async () => {
    try {
      setIsLoading(true);
      const response = await getSetting("auto_update_check");
      setAutoUpdateCheck(response.value === "true");
    } catch (error) {
      console.error("Failed to load auto update check setting:", error);
      // Default to true if setting doesn't exist
      setAutoUpdateCheck(true);
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
      // Revert on error
      setAutoUpdateCheck(!checked);
    }
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

      {/* Settings Section */}
      <div className="border-t border-[var(--color-dark-border)] pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>

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
    </div>
  );
}
