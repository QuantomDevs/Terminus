import React, { useState, useEffect } from "react";
import { ColorPickerModal } from "../../../components/ui/ColorPickerModal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Save, RefreshCw, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  getThemes,
  createTheme,
  deleteTheme,
  activateTheme,
  type ColorTheme,
} from "../../main-axios";

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
];

export const ColorSchemeSettings = () => {
  const [colors, setColors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<{
    name: string;
    value: string;
  } | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [themes, setThemes] = useState<ColorTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [newThemeName, setNewThemeName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Load current colors from CSS variables
  useEffect(() => {
    loadCurrentColors();
    loadThemes();
  }, []);

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
  };

  const loadThemes = async () => {
    try {
      const fetchedThemes = await getThemes();
      setThemes(fetchedThemes);

      // Find and set the active theme
      const activeTheme = fetchedThemes.find((t) => t.isActive);
      if (activeTheme) {
        setSelectedThemeId(activeTheme.id.toString());
      }
    } catch (error) {
      console.error("Failed to load themes:", error);
    }
  };

  const handleColorClick = (colorName: string, colorValue: string) => {
    setSelectedColor({ name: colorName, value: colorValue });
    setIsPickerOpen(true);
  };

  const handleColorChange = (newColor: string) => {
    if (selectedColor) {
      // Update the color in state
      setColors((prev) => ({
        ...prev,
        [selectedColor.name]: newColor,
      }));

      // Apply the color change to the root element immediately for live preview
      document.documentElement.style.setProperty(selectedColor.name, newColor);
    }
  };

  const handleSaveTheme = async () => {
    if (!newThemeName.trim()) {
      toast.error("Please enter a theme name");
      return;
    }

    try {
      await createTheme(newThemeName, colors);
      toast.success(`Theme "${newThemeName}" saved successfully`);
      setNewThemeName("");
      setIsSaveDialogOpen(false);
      loadThemes();
    } catch (error) {
      toast.error("Failed to save theme");
      console.error(error);
    }
  };

  const handleLoadTheme = async (themeId: string) => {
    try {
      const theme = themes.find((t) => t.id.toString() === themeId);
      if (!theme) return;

      const themeColors = JSON.parse(theme.colors);

      // Update colors state
      setColors(themeColors);

      // Apply all colors to the root element
      Object.entries(themeColors).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value as string);
      });

      // Activate the theme
      await activateTheme(theme.id);
      setSelectedThemeId(themeId);
      toast.success(`Theme "${theme.name}" applied successfully`);
    } catch (error) {
      toast.error("Failed to load theme");
      console.error(error);
    }
  };

  const handleDeleteTheme = async () => {
    if (!selectedThemeId) {
      toast.error("Please select a theme to delete");
      return;
    }

    try {
      await deleteTheme(parseInt(selectedThemeId));
      toast.success("Theme deleted successfully");
      setSelectedThemeId("");
      loadThemes();
    } catch (error) {
      toast.error("Failed to delete theme");
      console.error(error);
    }
  };

  const handleResetToDefault = () => {
    // Remove all custom color properties from root element
    COLOR_VARIABLES.forEach((variable) => {
      document.documentElement.style.removeProperty(variable.name);
    });

    // Reload colors from CSS
    loadCurrentColors();
    setSelectedThemeId("");
    toast.success("Colors reset to default");
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Color Scheme</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Customize the application's color palette. Changes are previewed in real-time.
        </p>
      </div>

      {/* Theme Management */}
      <div className="space-y-4 rounded-lg border border-[var(--color-dark-border)] bg-[var(--color-dark-bg-input)] p-4">
        <h3 className="text-sm font-medium">Theme Management</h3>

        <div className="flex gap-2">
          <Select value={selectedThemeId} onValueChange={handleLoadTheme}>
            <SelectTrigger className="flex-1 bg-[var(--color-dark-bg-button)]">
              <SelectValue placeholder="Select a theme to load" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id.toString()}>
                  {theme.name} {theme.isActive && "(Active)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleDeleteTheme}
            disabled={!selectedThemeId}
            className="border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
            title="Delete selected theme"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter theme name..."
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            className="flex-1 border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)]"
          />
          <Button
            onClick={handleSaveTheme}
            disabled={!newThemeName.trim()}
            className="gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            Save Current
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleResetToDefault}
          className="w-full gap-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
        >
          <RefreshCw className="h-4 w-4" />
          Reset to Default
        </Button>
      </div>

      {/* Color List */}
      <div className="space-y-6">
        {Object.entries(groupedColors).map(([category, variables]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-muted-foreground)]">
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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

      {/* Color Picker Modal */}
      {selectedColor && (
        <ColorPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          color={selectedColor.value}
          colorName={selectedColor.name}
          onColorChange={handleColorChange}
        />
      )}
    </div>
  );
};
