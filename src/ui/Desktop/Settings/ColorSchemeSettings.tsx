import React, { useState, useEffect } from "react";
import { ColorPickerModal } from "../../../components/ui/ColorPickerModal";
import { ThemeCard } from "../../../components/ui/ThemeCard";
import { ThemeCardSkeleton } from "../../../components/ui/ThemeCardSkeleton";
import { ErrorDisplay } from "../../../components/ui/ErrorDisplay";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Plus,
  Upload,
  RefreshCw,
  Edit,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  getThemes,
  createTheme,
  deleteTheme,
  activateTheme,
  updateTheme,
  importTheme,
  exportTheme,
  type ColorTheme,
  type ThemeExportData,
} from "../../main-axios";
import { cn } from "@/lib/utils.ts";

// Define all customizable CSS variables
const COLOR_VARIABLES = [
  { name: "--background", label: "Background", category: "Base" },
  { name: "--foreground", label: "Foreground", category: "Base" },
  { name: "--card", label: "Card Background", category: "Base" },
  { name: "--card-foreground", label: "Card Text", category: "Base" },
  { name: "--popover", label: "Popover Background", category: "Base" },
  { name: "--popover-foreground", label: "Popover Text", category: "Base" },

  { name: "--primary", label: "Primary", category: "Interactive" },
  { name: "--primary-foreground", label: "Primary Text", category: "Interactive" },
  { name: "--secondary", label: "Secondary", category: "Interactive" },
  { name: "--secondary-foreground", label: "Secondary Text", category: "Interactive" },
  { name: "--muted", label: "Muted", category: "Interactive" },
  { name: "--muted-foreground", label: "Muted Text", category: "Interactive" },
  { name: "--accent", label: "Accent", category: "Interactive" },
  { name: "--accent-foreground", label: "Accent Text", category: "Interactive" },

  { name: "--destructive", label: "Destructive", category: "Status" },
  { name: "--border", label: "Border", category: "Status" },
  { name: "--input", label: "Input Background", category: "Status" },
  { name: "--ring", label: "Focus Ring", category: "Status" },

  { name: "--color-dark-bg", label: "Dark Background", category: "Custom" },
  { name: "--color-dark-bg-darker", label: "Darker Background", category: "Custom" },
  { name: "--color-dark-bg-darkest", label: "Darkest Background", category: "Custom" },
  { name: "--color-dark-bg-input", label: "Input Background", category: "Custom" },
  { name: "--color-dark-bg-button", label: "Button Background", category: "Custom" },
  { name: "--color-dark-bg-active", label: "Active Background", category: "Custom" },
  { name: "--color-dark-bg-header", label: "Header Background", category: "Custom" },

  { name: "--color-dark-border", label: "Border", category: "Custom Borders" },
  { name: "--color-dark-border-active", label: "Active Border", category: "Custom Borders" },
  { name: "--color-dark-border-hover", label: "Hover Border", category: "Custom Borders" },
  { name: "--color-dark-hover", label: "Hover Background", category: "Custom Borders" },
  { name: "--color-dark-active", label: "Active State", category: "Custom Borders" },
  { name: "--color-dark-pressed", label: "Pressed State", category: "Custom Borders" },

  { name: "--accent-color", label: "Accent Color", category: "Accent" },
  { name: "--accent-color-hover", label: "Accent Hover", category: "Accent" },
  { name: "--accent-color-light", label: "Accent Light", category: "Accent" },
  { name: "--accent-color-dark", label: "Accent Dark", category: "Accent" },
];

export const ColorSchemeSettings = () => {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [initialColors, setInitialColors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    value: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [themes, setThemes] = useState<ColorTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<ColorTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  // Modal states
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameModalInput, setNameModalInput] = useState("");
  const [authorModalInput, setAuthorModalInput] = useState("");
  const [nameModalType, setNameModalType] = useState<"create" | "update">("create");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);

  // Helper function to check if error is authentication related
  const isAuthError = (error: unknown): boolean => {
    return error instanceof Error &&
      (error.message.includes("Authentication") ||
       error.message.includes("401") ||
       error.message.includes("Unauthorized"));
  };

  // Load current colors from CSS variables
  useEffect(() => {
    const initializeSettings = async () => {
      loadCurrentColors();
      await loadThemes();
      setIsLoading(false);
    };
    initializeSettings();
  }, []);

  // Cleanup: Restore initial colors on unmount if changes weren't saved
  useEffect(() => {
    return () => {
      // Only restore if there were unsaved changes
      if (hasUnsavedChanges && Object.keys(initialColors).length > 0) {
        // Restore all initial colors
        Object.entries(initialColors).forEach(([name, value]) => {
          document.documentElement.style.setProperty(name, value);
        });
      }
    };
  }, [hasUnsavedChanges, initialColors]);

  const loadCurrentColors = () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const currentColors: Record<string, string> = {};

    COLOR_VARIABLES.forEach((variable) => {
      const value = computedStyle.getPropertyValue(variable.name).trim();
      if (value) {
        currentColors[variable.name] = value;
      }
    });

    setColors(currentColors);
    // Store initial colors for cleanup on unmount
    setInitialColors(currentColors);
  };

  const loadThemes = async () => {
    try {
      const fetchedThemes = await getThemes();
      setThemes(fetchedThemes);

      // Find and set the active theme
      const active = fetchedThemes.find((t) => t.isActive);
      setActiveTheme(active || null);
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        console.error("Failed to load themes:", error);
        toast.error("Failed to load themes");
      }
    }
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModalMessage(message);
    setConfirmModalAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmModalAction) {
      confirmModalAction();
    }
    setShowConfirmModal(false);
    setConfirmModalAction(null);
  };

  const handleColorClick = (colorName: string, colorValue: string) => {
    setSelectedColor({ name: colorName, value: colorValue });
    setIsPickerOpen(true);
  };

  const handleColorChange = (newColor: string) => {
    if (selectedColor) {
      // Update the color in state only (no live preview on app)
      setColors((prev) => ({
        ...prev,
        [selectedColor.name]: newColor,
      }));
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
    }
  };

  const handleCreateTheme = () => {
    // Start with current theme colors from the document
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const defaultColors: Record<string, string> = {};

    // Get all CSS variable values from current theme
    COLOR_VARIABLES.forEach((variable) => {
      const value = computedStyle.getPropertyValue(variable.name).trim();
      if (value) {
        defaultColors[variable.name] = value;
      }
    });

    // Only update state, do NOT apply to document (no live preview on app)
    setColors(defaultColors);
    setEditingThemeId(null);
    setIsEditorOpen(true);
  };

  const handleEditCurrentTheme = () => {
    if (!activeTheme) {
      toast.error("No active theme to edit");
      return;
    }

    const themeColors = typeof activeTheme.colors === "string" ? JSON.parse(activeTheme.colors) : activeTheme.colors;

    // Only update state, do NOT apply to document (no live preview on app)
    setColors(themeColors);
    setEditingThemeId(activeTheme.id);
    setIsEditorOpen(true);
  };

  const handleEditTheme = (themeId: number) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      const themeColors = typeof theme.colors === "string" ? JSON.parse(theme.colors) : theme.colors;

      // Only update state, do NOT apply to document (no live preview on app)
      setColors(themeColors);
      setEditingThemeId(themeId);
      setIsEditorOpen(true);
    }
  };

  const handleSaveCurrentTheme = () => {
    if (editingThemeId) {
      setNameModalType("update");
      const theme = themes.find((t) => t.id === editingThemeId);
      setNameModalInput(theme?.name || "");
      setAuthorModalInput(theme?.author || "");
    } else {
      setNameModalType("create");
      setNameModalInput("");
      setAuthorModalInput("");
    }
    setShowNameModal(true);
  };

  const handleNameModalSubmit = async () => {
    if (!nameModalInput.trim()) {
      toast.error("Please enter a theme name");
      return;
    }

    try {
      if (editingThemeId) {
        // Update existing theme
        await updateTheme(editingThemeId, nameModalInput, colors, authorModalInput || undefined);
        toast.success(`Theme "${nameModalInput}" updated successfully`);
      } else {
        // Create new theme
        await createTheme(nameModalInput, colors, authorModalInput || undefined);
        toast.success(`Theme "${nameModalInput}" created successfully`);
      }

      setShowNameModal(false);
      setNameModalInput("");
      setAuthorModalInput("");
      setIsEditorOpen(false);
      setEditingThemeId(null);
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      await loadThemes();
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        toast.error("Failed to save theme");
        console.error(error);
      }
    }
  };

  const handleActivateTheme = async (themeId: number) => {
    try {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) return;

      const themeColors = typeof theme.colors === "string" ? JSON.parse(theme.colors) : theme.colors;

      // Update colors state
      setColors(themeColors);

      // Apply all colors to the root element
      Object.entries(themeColors).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value as string);
      });

      // Activate the theme
      await activateTheme(themeId);
      await loadThemes();
      setHasUnsavedChanges(false); // Clear unsaved changes flag
      toast.success(`Theme "${theme.name}" applied successfully`);
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        toast.error("Failed to activate theme");
        console.error(error);
      }
    }
  };

  const handleDuplicateTheme = async (themeId: number) => {
    try {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) return;

      const themeColors = typeof theme.colors === "string" ? JSON.parse(theme.colors) : theme.colors;
      const newName = `${theme.name} (Copy)`;

      await createTheme(newName, themeColors);
      toast.success(`Theme duplicated as "${newName}"`);
      await loadThemes();
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        toast.error("Failed to duplicate theme");
        console.error(error);
      }
    }
  };

  const handleExportTheme = async (themeId: number) => {
    try {
      const exportData: ThemeExportData = await exportTheme(themeId);

      // Create JSON file and trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportData.name.replace(/\s+/g, "_")}_theme.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Theme exported successfully");
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        toast.error("Failed to export theme");
        console.error(error);
      }
    }
  };

  const handleImportTheme = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const themeData = JSON.parse(text);

        await importTheme(themeData);
        toast.success("Theme imported successfully");
        await loadThemes();
      } catch (error) {
        // Silently ignore authentication errors (user not logged in)
        if (!isAuthError(error)) {
          toast.error("Failed to import theme. Invalid file format.");
          console.error(error);
        }
      }
    };
    input.click();
  };

  const handleDeleteTheme = async (themeId: number) => {
    try {
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) return;

      showConfirm(
        `Are you sure you want to delete "${theme.name}"?`,
        async () => {
          try {
            await deleteTheme(themeId);
            toast.success("Theme deleted successfully");
            await loadThemes();
          } catch (error) {
            // Silently ignore authentication errors (user not logged in)
            if (!isAuthError(error)) {
              toast.error("Failed to delete theme");
              console.error(error);
            }
          }
        }
      );
    } catch (error) {
      // Silently ignore authentication errors (user not logged in)
      if (!isAuthError(error)) {
        console.error(error);
      }
    }
  };

  const handleResetToDefault = () => {
    showConfirm(
      "Reset all colors to default? This will clear all custom changes.",
      () => {
        // Remove all custom color properties from root element
        COLOR_VARIABLES.forEach((variable) => {
          document.documentElement.style.removeProperty(variable.name);
        });

        // Reload colors from CSS
        loadCurrentColors();
        toast.success("Colors reset to default");
      }
    );
  };

  // Group colors by category
  const groupedColors = COLOR_VARIABLES.reduce(
    (acc, variable) => {
      if (!acc[variable.category]) {
        acc[variable.category] = [];
      }
      acc[variable.category].push(variable);
      return acc;
    },
    {} as Record<string, typeof COLOR_VARIABLES>,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading color schemes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Color Scheme</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage themes and customize your color palette. Changes are previewed in real-time.
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleCreateTheme}
          className="gap-2 bg-[var(--color-primary)] hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Create Theme
        </Button>
        <Button
          variant="outline"
          onClick={handleImportTheme}
          className="gap-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>
        <Button
          variant="outline"
          onClick={loadThemes}
          className="gap-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Theme Grid */}
      <div>
        <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-3">
          Your Themes ({themes.length})
        </h3>
        {themes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[var(--color-dark-border)] rounded-lg">
            <p className="text-gray-400 mb-2">No themes found</p>
            <p className="text-sm text-gray-500 mb-4">
              Create your first theme to get started
            </p>
            <Button onClick={handleCreateTheme} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Theme
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === activeTheme?.id}
                onActivate={handleActivateTheme}
                onEdit={handleEditTheme}
                onDuplicate={handleDuplicateTheme}
                onExport={handleExportTheme}
                onDelete={handleDeleteTheme}
              />
            ))}
          </div>
        )}
      </div>

      {/* Color Editor Panel (shown when creating/editing) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[999998] flex items-center justify-center"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            className="flex flex-col rounded-lg border-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] shadow-2xl max-h-[90vh] overflow-hidden w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-dark-border)]">
              <h3 className="text-xl font-semibold text-white">
                {editingThemeId ? "Edit Theme" : "Create New Theme"}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Click on any color to customize it. Changes preview in real-time.
              </p>
            </div>

            {/* Color Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(groupedColors).map(([category, variables]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-medium text-[var(--color-muted-foreground)]">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {variables.map((variable) => {
                        const colorValue = colors[variable.name] || "#000000";
                        return (
                          <button
                            key={variable.name}
                            onClick={() => handleColorClick(variable.name, colorValue)}
                            className="flex items-center gap-3 rounded-md border border-[var(--color-dark-border)] bg-[var(--color-dark-bg-input)] p-3 text-left transition-colors hover:bg-[var(--color-dark-hover)]"
                          >
                            <div
                              className="h-10 w-10 flex-shrink-0 rounded-md border border-[var(--color-dark-border)]"
                              style={{ backgroundColor: colorValue }}
                            />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-medium">
                                {variable.label}
                              </span>
                              <span className="truncate font-mono text-xs text-[var(--color-muted-foreground)]">
                                {variable.name}
                              </span>
                              <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                                {colorValue}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-dark-border)] flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditorOpen(false);
                  setEditingThemeId(null);
                  loadCurrentColors();
                }}
                className="border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCurrentTheme}
                className="bg-[var(--color-primary)] hover:opacity-90"
              >
                {editingThemeId ? "Update Theme" : "Save Theme"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setShowNameModal(false)}
        >
          <div
            className="flex flex-col rounded-lg border-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {nameModalType === "create" ? "Create Theme" : "Update Theme"}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Theme Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter theme name..."
                    value={nameModalInput}
                    onChange={(e) => setNameModalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameModalSubmit();
                      if (e.key === "Escape") setShowNameModal(false);
                    }}
                    className="bg-[var(--color-dark-bg-input)] border-[var(--color-dark-border)] text-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Creator/Author (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter creator name..."
                    value={authorModalInput}
                    onChange={(e) => setAuthorModalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleNameModalSubmit();
                      if (e.key === "Escape") setShowNameModal(false);
                    }}
                    className="bg-[var(--color-dark-bg-input)] border-[var(--color-dark-border)] text-white"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[var(--color-dark-border)] flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNameModal(false)}
                className="border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNameModalSubmit}
                className="bg-[var(--color-primary)] hover:opacity-90"
              >
                {nameModalType === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="flex flex-col rounded-lg border-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Action</h3>
              <p className="text-sm text-gray-400">{confirmModalMessage}</p>
            </div>
            <div className="p-4 border-t border-[var(--color-dark-border)] flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {selectedColor && (
        <ColorPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          color={selectedColor.value}
          colorName={selectedColor.name}
          onColorChange={handleColorChange}
          backgroundColor={colors["--background"] || "#0a0a0a"}
        />
      )}
    </div>
  );
};
