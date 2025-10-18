import React, { useState } from "react";
import {
  SettingsSidebar,
  type SettingsCategory,
} from "@/ui/Desktop/Settings/SettingsSidebar.tsx";
import { ApplicationSettings } from "@/ui/Desktop/Settings/ApplicationSettings.tsx";
import { TerminalSettings } from "@/ui/Desktop/Settings/TerminalSettings.tsx";
import { FileManagerSettings } from "@/ui/Desktop/Settings/FileManagerSettings.tsx";
import { ColorSchemeSettings } from "@/ui/Desktop/Settings/ColorSchemeSettings.tsx";

interface SettingsPageProps {
  isTopbarOpen?: boolean;
}

export function SettingsPage({ isTopbarOpen }: SettingsPageProps) {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("application");

  const renderSettingsContent = () => {
    switch (activeCategory) {
      case "application":
        return <ApplicationSettings />;
      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Appearance Settings
              </h3>
              <p className="text-gray-400 text-sm">
                Customize the appearance of the application
              </p>
            </div>
            <div className="text-gray-400 text-sm">
              Appearance settings coming soon
            </div>
          </div>
        );
      case "colorScheme":
        return <ColorSchemeSettings />;
      case "terminal":
        return <TerminalSettings />;
      case "fileManager":
        return <FileManagerSettings />;
      case "hotkeys":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Hotkeys
              </h3>
              <p className="text-gray-400 text-sm">
                Configure keyboard shortcuts
              </p>
            </div>
            <div className="text-gray-400 text-sm">Hotkeys coming soon</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex h-screen w-full bg-[var(--color-dark-bg)]"
      style={{
        marginTop: isTopbarOpen ? "48px" : "0px",
      }}
    >
      {/* Left Sidebar */}
      <SettingsSidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">{renderSettingsContent()}</div>
      </div>
    </div>
  );
}
