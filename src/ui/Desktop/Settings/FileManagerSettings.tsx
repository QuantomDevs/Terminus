import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { getSetting, saveSetting } from "@/ui/main-axios.ts";

interface FileManagerSettingsProps {}

export function FileManagerSettings({}: FileManagerSettingsProps) {
  const [fileManagerDesign, setFileManagerDesign] = useState<string>("explorer");
  const [editorType, setEditorType] = useState<string>("internal");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFileManagerDesignSetting();
    loadEditorTypeSetting();
  }, []);

  const loadFileManagerDesignSetting = async () => {
    try {
      setIsLoading(true);
      const response = await getSetting("file_manager_design");
      setFileManagerDesign(response.value || "explorer");
    } catch (error) {
      console.error("Failed to load file manager design setting:", error);
      // Default to explorer if setting doesn't exist
      setFileManagerDesign("explorer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileManagerDesignChange = async (value: string) => {
    setFileManagerDesign(value);
    try {
      await saveSetting("file_manager_design", value);
    } catch (error) {
      console.error("Failed to save file manager design setting:", error);
      // Revert on error
      await loadFileManagerDesignSetting();
    }
  };

  const loadEditorTypeSetting = async () => {
    try {
      const response = await getSetting("file_editor_type");
      setEditorType(response.value || "internal");
    } catch (error) {
      console.error("Failed to load file editor type setting:", error);
      // Default to internal if setting doesn't exist
      setEditorType("internal");
    }
  };

  const handleEditorTypeChange = async (value: string) => {
    setEditorType(value);
    try {
      await saveSetting("file_editor_type", value);
    } catch (error) {
      console.error("Failed to save file editor type setting:", error);
      // Revert on error
      await loadEditorTypeSetting();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">File Manager Settings</h2>
        <p className="text-sm text-gray-400">
          Configure file manager layout and behavior
        </p>
      </div>

      {/* Settings Section */}
      <div className="space-y-4">
        {/* File Manager Design Setting */}
        <div className="p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
          <div className="space-y-3">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                File Manager Design
              </label>
              <p className="text-xs text-gray-400">
                Choose between single-panel Explorer or dual-panel Commander layout
              </p>
            </div>
            <Select
              value={fileManagerDesign}
              onValueChange={handleFileManagerDesignChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full max-w-xs bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-dark-bg)] border-[var(--color-dark-border)]">
                <SelectItem
                  value="explorer"
                  className="text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white focus:bg-[var(--color-sidebar-accent)] focus:text-white"
                >
                  Explorer (Single Panel)
                </SelectItem>
                <SelectItem
                  value="commander"
                  className="text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white focus:bg-[var(--color-sidebar-accent)] focus:text-white"
                >
                  Commander (Dual Panel)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 italic">
              {fileManagerDesign === "explorer"
                ? "Explorer: Traditional single-panel file browser with sidebar navigation"
                : "Commander: Orthodox dual-panel layout for efficient cross-panel file operations"}
            </p>
          </div>
        </div>

        {/* File Editor Type Setting */}
        <div className="p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
          <div className="space-y-3">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-white">
                File Editor
              </label>
              <p className="text-xs text-gray-400">
                Choose how to edit remote text files
              </p>
            </div>
            <Select
              value={editorType}
              onValueChange={handleEditorTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full max-w-xs bg-[var(--color-dark-bg)] border-[var(--color-dark-border)] text-gray-300">
                <SelectValue placeholder="Select editor type" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--color-dark-bg)] border-[var(--color-dark-border)]">
                <SelectItem
                  value="internal"
                  className="text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white focus:bg-[var(--color-sidebar-accent)] focus:text-white"
                >
                  Internal Monaco Editor
                </SelectItem>
                <SelectItem
                  value="external"
                  className="text-gray-300 hover:bg-[var(--color-sidebar-accent)] hover:text-white focus:bg-[var(--color-sidebar-accent)] focus:text-white"
                >
                  External Application
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 italic">
              {editorType === "internal"
                ? "Internal: Edit files directly in Terminus using the built-in Monaco code editor (VS Code's editor)"
                : "External: Download files and open them in your preferred external text editor (feature coming soon)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
