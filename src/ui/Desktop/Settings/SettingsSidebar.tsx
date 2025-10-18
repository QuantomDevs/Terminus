import React from "react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

export type SettingsCategory =
  | "application"
  | "appearance"
  | "colorScheme"
  | "terminal"
  | "fileManager"
  | "hotkeys";

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

export function SettingsSidebar({
  activeCategory,
  onCategoryChange,
}: SettingsSidebarProps) {
  const categories: { id: SettingsCategory; label: string }[] = [
    { id: "application", label: "Application" },
    { id: "appearance", label: "Appearance" },
    { id: "colorScheme", label: "Color Scheme" },
    { id: "terminal", label: "Terminal" },
    { id: "fileManager", label: "File Manager" },
    { id: "hotkeys", label: "Hotkeys" },
  ];

  return (
    <div className="w-56 bg-[var(--color-sidebar-bg)] border-r-2 border-[var(--color-dark-border)] h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
        <nav className="space-y-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left px-3 py-2",
                activeCategory === category.id
                  ? "bg-[var(--color-sidebar-accent)] text-white"
                  : "text-gray-400 hover:bg-[var(--color-sidebar-accent)] hover:text-white",
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
