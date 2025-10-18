import React, { useState, useEffect } from "react";
import { SketchPicker } from "react-color";
import { Button } from "./button";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  color: string;
  colorName: string;
  onColorChange: (color: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  color,
  colorName,
  onColorChange,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(color);

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  const handleChangeComplete = (color: any) => {
    const hex = color.hex;
    setSelectedColor(hex);
  };

  const handleSave = () => {
    onColorChange(selectedColor);
    onClose();
  };

  const handleCancel = () => {
    setSelectedColor(color);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
      onClick={handleCancel}
    >
      <div
        className="flex flex-col gap-4 rounded-lg border-2 border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-white">
            Choose Color
          </h3>
          <p className="text-sm text-gray-400">
            {colorName.replace(/--/g, "").replace(/-/g, " ")}
          </p>
        </div>

        {/* Color Picker */}
        <div className="flex flex-col items-center gap-4">
          <SketchPicker
            color={selectedColor}
            onChangeComplete={handleChangeComplete}
            disableAlpha={false}
            presetColors={[
              "#ffffff",
              "#f5f5f5",
              "#e5e5e5",
              "#d4d4d4",
              "#a3a3a3",
              "#737373",
              "#525252",
              "#404040",
              "#262626",
              "#171717",
              "#0a0a0a",
              "#000000",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
              "#ef4444",
              "#f97316",
              "#f59e0b",
              "#eab308",
              "#84cc16",
              "#22c55e",
              "#10b981",
              "#14b8a6",
              "#06b6d4",
            ]}
          />

          <div className="flex w-full items-center gap-3 rounded-md border border-[var(--color-dark-border)] bg-[var(--color-dark-bg-input)] p-3">
            <div
              className="h-12 w-12 flex-shrink-0 rounded-md border border-[var(--color-dark-border)]"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">
                Current Color
              </span>
              <span className="font-mono text-sm text-white">{selectedColor}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--color-dark-border)] pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-[var(--color-dark-border)] bg-[var(--color-dark-bg-button)] hover:bg-[var(--color-dark-hover)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};
