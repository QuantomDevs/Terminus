import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input.tsx";
import { getSetting, saveSetting } from "@/ui/main-axios.ts";

interface TerminalSettingsProps {}

export function TerminalSettings({}: TerminalSettingsProps) {
  const [fontSize, setFontSize] = useState<string>("14");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadFontSizeSetting();
  }, []);

  const loadFontSizeSetting = async () => {
    try {
      setIsLoading(true);
      const response = await getSetting("terminal_font_size");
      setFontSize(response.value || "14");
    } catch (error) {
      console.error("Failed to load terminal font size setting:", error);
      // Default to 14 if setting doesn't exist
      setFontSize("14");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setFontSize(value);
    }
  };

  const handleFontSizeBlur = async () => {
    // Validate and constrain the value
    let numericValue = parseInt(fontSize, 10);

    if (isNaN(numericValue) || fontSize === "") {
      numericValue = 14;
    } else if (numericValue < 8) {
      numericValue = 8;
    } else if (numericValue > 32) {
      numericValue = 32;
    }

    const finalValue = numericValue.toString();
    setFontSize(finalValue);

    try {
      setIsSaving(true);
      await saveSetting("terminal_font_size", finalValue);
    } catch (error) {
      console.error("Failed to save terminal font size setting:", error);
      // Revert on error
      await loadFontSizeSetting();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Terminal Settings</h2>
        <p className="text-sm text-gray-400">
          Configure terminal behavior and appearance
        </p>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        {/* Font Size Setting */}
        <div className="p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
          <div className="space-y-3">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                Font Size
              </label>
              <p className="text-xs text-gray-400">
                Set the terminal font size in pixels (8-32)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                value={fontSize}
                onChange={handleFontSizeChange}
                onBlur={handleFontSizeBlur}
                disabled={isLoading || isSaving}
                className="w-24 bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300"
                placeholder="14"
              />
              <span className="text-sm text-gray-400">px</span>
            </div>
            <p className="text-xs text-gray-500 italic">
              This setting will be applied to all new terminal sessions. Existing terminals will use their current font size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
