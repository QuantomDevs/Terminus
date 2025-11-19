import React, { useState } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Check, Pencil, Copy, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export interface ColorTheme {
  id: number;
  name: string;
  colors: Record<string, string> | string;
  isActive: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

interface ThemeCardProps {
  theme: ColorTheme;
  isActive: boolean;
  onActivate: (themeId: number) => void;
  onEdit: (themeId: number) => void;
  onDuplicate: (themeId: number) => void;
  onExport: (themeId: number) => void;
  onDelete: (themeId: number) => void;
}

export function ThemeCard({
  theme,
  isActive,
  onActivate,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
}: ThemeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse colors if stored as JSON string
  const colors =
    typeof theme.colors === "string"
      ? JSON.parse(theme.colors)
      : theme.colors;

  // Extract key colors for swatches (first 8)
  const keyColors = [
    colors["--background"] || colors.background,
    colors["--foreground"] || colors.foreground,
    colors["--primary"] || colors.primary,
    colors["--secondary"] || colors.secondary,
    colors["--accent"] || colors.accent,
    colors["--destructive"] || colors.destructive,
    colors["--muted"] || colors.muted,
    colors["--border"] || colors.border,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 transition-all duration-200 cursor-pointer group",
        "bg-[var(--color-sidebar-bg)] hover:shadow-lg",
        isActive
          ? "border-[var(--color-primary)] shadow-md"
          : "border-[var(--color-dark-border)] hover:border-[var(--color-primary)]/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isActive && onActivate(theme.id)}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-[var(--color-primary)] text-white flex items-center gap-1">
            <Check className="w-3 h-3" />
            Active
          </Badge>
        </div>
      )}

      {/* Action Buttons Overlay */}
      {isHovered && !isActive && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center gap-2 z-10">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(theme.id);
            }}
            title="Edit theme"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(theme.id);
            }}
            title="Duplicate theme"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onExport(theme.id);
            }}
            title="Export theme"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(theme.id);
            }}
            title="Delete theme"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Theme Name */}
        <h3 className="text-lg font-semibold text-white truncate pr-20">
          {theme.name}
        </h3>

        {/* Color Swatches */}
        <div className="flex gap-1.5">
          {keyColors.slice(0, 8).map((color, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded border-2 border-[var(--color-dark-border)] flex-shrink-0"
              style={{
                backgroundColor: color,
              }}
              title={color}
            />
          ))}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{Object.keys(colors).length} colors</span>
          <span>
            {new Date(theme.updatedAt || theme.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Active Theme Actions (shown when active) */}
      {isActive && (
        <div className="border-t border-[var(--color-dark-border)] p-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(theme.id);
            }}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(theme.id);
            }}
          >
            <Copy className="w-3 h-3 mr-1" />
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onExport(theme.id);
            }}
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      )}
    </div>
  );
}
