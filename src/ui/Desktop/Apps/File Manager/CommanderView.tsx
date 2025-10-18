import React, { useState, useCallback } from "react";
import { FileManagerGrid } from "./FileManagerGrid";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useFileSelection } from "./hooks/useFileSelection";
import type { FileItem } from "../../../types/index.js";
import {
  moveSSHItem,
  copySSHItem,
  copyLocalItem,
  downloadSSHFile,
  uploadSSHFile,
  listLocalFiles,
  uploadLocalFile,
} from "@/ui/main-axios.ts";

interface CreateIntent {
  id: string;
  type: "file" | "directory";
  defaultName: string;
  currentName: string;
}

interface CommanderViewProps {
  // Panel Types
  leftPanelType?: "local" | "remote";
  rightPanelType?: "local" | "remote";

  // Left Panel Props
  leftFiles: FileItem[];
  leftPath: string;
  leftLoading: boolean;
  onLeftPathChange: (path: string) => void;
  onLeftRefresh: () => void;
  onLeftFileOpen: (file: FileItem) => void;

  // Right Panel Props
  rightFiles: FileItem[];
  rightPath: string;
  rightLoading: boolean;
  onRightPathChange: (path: string) => void;
  onRightRefresh: () => void;
  onRightFileOpen: (file: FileItem) => void;

  // Common Props
  sshSessionId: string | null;
  currentHost: any;
  viewMode?: "grid" | "list";
  onContextMenu?: (event: React.MouseEvent, file?: FileItem) => void;
  onRename?: (file: FileItem, newName: string) => void;
  editingFile?: FileItem | null;
  onStartEdit?: (file: FileItem) => void;
  onCancelEdit?: () => void;
  onDelete?: (files: FileItem[]) => void;
  onCopy?: (files: FileItem[]) => void;
  onCut?: (files: FileItem[]) => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onFileDiff?: (file1: FileItem, file2: FileItem) => void;
  onSystemDragStart?: (files: FileItem[]) => void;
  onSystemDragEnd?: (e: DragEvent, files: FileItem[]) => void;
  hasClipboard?: boolean;
  leftCreateIntent?: CreateIntent | null;
  rightCreateIntent?: CreateIntent | null;
  onLeftConfirmCreate?: (name: string) => void;
  onLeftCancelCreate?: () => void;
  onRightConfirmCreate?: (name: string) => void;
  onRightCancelCreate?: () => void;
}

export function CommanderView({
  leftPanelType = "remote",
  rightPanelType = "remote",
  leftFiles,
  leftPath,
  leftLoading,
  onLeftPathChange,
  onLeftRefresh,
  onLeftFileOpen,
  rightFiles,
  rightPath,
  rightLoading,
  onRightPathChange,
  onRightRefresh,
  onRightFileOpen,
  sshSessionId,
  currentHost,
  viewMode = "list",
  onContextMenu,
  onRename,
  editingFile,
  onStartEdit,
  onCancelEdit,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onUndo,
  onFileDiff,
  onSystemDragStart,
  onSystemDragEnd,
  hasClipboard,
  leftCreateIntent,
  rightCreateIntent,
  onLeftConfirmCreate,
  onLeftCancelCreate,
  onRightConfirmCreate,
  onRightCancelCreate,
}: CommanderViewProps) {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<"left" | "right">("left");

  // Selection management for both panels
  const leftSelection = useFileSelection();
  const rightSelection = useFileSelection();

  // Handle file drop between panels - supports all 4 scenarios
  const handleFileDrop = useCallback(
    async (
      draggedFiles: FileItem[],
      targetFolder: FileItem,
      sourcePanel: "left" | "right"
    ) => {
      if (targetFolder.type !== "directory") return;

      const sourcePanelType = sourcePanel === "left" ? leftPanelType : rightPanelType;
      const targetPanelType = sourcePanel === "left" ? rightPanelType : leftPanelType;
      const targetPath = targetFolder.path;

      try {
        let successCount = 0;

        for (const file of draggedFiles) {
          try {
            // Scenario 1: Local → Local
            if (sourcePanelType === "local" && targetPanelType === "local") {
              await copyLocalItem(file.path, targetPath);
              successCount++;
            }
            // Scenario 2: Local → Remote (Upload)
            else if (sourcePanelType === "local" && targetPanelType === "remote") {
              if (!sshSessionId) {
                toast.error(t("fileManager.noSSHConnection"));
                continue;
              }
              // Read local file content
              const localFileResponse = await listLocalFiles(file.path);
              if (file.type === "file") {
                // For files, we need to download and upload
                const response = await fetch(`http://localhost:30006/local/downloadFile?path=${encodeURIComponent(file.path)}`);
                const data = await response.json();
                if (data.success) {
                  await uploadSSHFile(
                    sshSessionId,
                    targetPath,
                    file.name,
                    data.content,
                    currentHost?.id,
                    undefined
                  );
                  successCount++;
                }
              }
            }
            // Scenario 3: Remote → Local (Download)
            else if (sourcePanelType === "remote" && targetPanelType === "local") {
              if (!sshSessionId) {
                toast.error(t("fileManager.noSSHConnection"));
                continue;
              }
              if (file.type === "file") {
                const response = await downloadSSHFile(sshSessionId, file.path);
                if (response && response.content) {
                  await uploadLocalFile(targetPath, file.name, response.content);
                  successCount++;
                }
              }
            }
            // Scenario 4: Remote → Remote (existing SSH copy)
            else if (sourcePanelType === "remote" && targetPanelType === "remote") {
              if (!sshSessionId) {
                toast.error(t("fileManager.noSSHConnection"));
                continue;
              }
              await copySSHItem(
                sshSessionId,
                file.path,
                targetPath,
                currentHost?.id,
                currentHost?.userId?.toString()
              );
              successCount++;
            }
          } catch (error: any) {
            console.error(`Failed to transfer file ${file.name}:`, error);
            toast.error(
              t("fileManager.moveFileFailed", { name: file.name }) +
                ": " +
                error.message
            );
          }
        }

        if (successCount > 0) {
          toast.success(
            t("fileManager.successfullyMovedItems", {
              count: successCount,
              target: targetFolder.name,
            })
          );

          // Refresh both panels
          onLeftRefresh();
          onRightRefresh();

          // Clear selection in source panel
          if (sourcePanel === "left") {
            leftSelection.clearSelection();
          } else {
            rightSelection.clearSelection();
          }
        }
      } catch (error: any) {
        console.error("Cross-panel transfer operation failed:", error);
        toast.error(
          t("fileManager.moveOperationFailed") + ": " + error.message
        );
      }
    },
    [
      leftPanelType,
      rightPanelType,
      sshSessionId,
      currentHost,
      onLeftRefresh,
      onRightRefresh,
      leftSelection,
      rightSelection,
      t,
    ]
  );

  const handleLeftFileDrop = useCallback(
    (draggedFiles: FileItem[], targetFolder: FileItem) => {
      handleFileDrop(draggedFiles, targetFolder, "left");
    },
    [handleFileDrop]
  );

  const handleRightFileDrop = useCallback(
    (draggedFiles: FileItem[], targetFolder: FileItem) => {
      handleFileDrop(draggedFiles, targetFolder, "right");
    },
    [handleFileDrop]
  );

  return (
    <div className="flex h-full w-full gap-1">
      {/* Left Panel */}
      <div
        className={`flex-1 border-r ${
          activePanel === "left"
            ? "border-blue-500 border-r-2"
            : "border-dark-border"
        }`}
        onClick={() => setActivePanel("left")}
      >
        <div className="h-full relative">
          <FileManagerGrid
            files={leftFiles}
            selectedFiles={leftSelection.selectedFiles}
            onFileSelect={leftSelection.selectFile}
            onFileOpen={onLeftFileOpen}
            onSelectionChange={leftSelection.setSelection}
            currentPath={leftPath}
            isLoading={leftLoading}
            onPathChange={onLeftPathChange}
            onRefresh={onLeftRefresh}
            onContextMenu={onContextMenu}
            viewMode={viewMode}
            onRename={onRename}
            editingFile={editingFile}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onDelete={onDelete}
            onCopy={onCopy}
            onCut={onCut}
            onPaste={onPaste}
            onUndo={onUndo}
            hasClipboard={hasClipboard}
            onFileDrop={handleLeftFileDrop}
            onFileDiff={onFileDiff}
            onSystemDragStart={onSystemDragStart}
            onSystemDragEnd={onSystemDragEnd}
            createIntent={leftCreateIntent}
            onConfirmCreate={onLeftConfirmCreate}
            onCancelCreate={onLeftCancelCreate}
          />
          {/* Panel Type & Active Indicator */}
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
              {leftPanelType === "local" ? "📁 Local" : "🌐 Remote"}
            </div>
            {activePanel === "left" && (
              <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                {t("fileManager.activePanel")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`flex-1 border-l ${
          activePanel === "right"
            ? "border-blue-500 border-l-2"
            : "border-dark-border"
        }`}
        onClick={() => setActivePanel("right")}
      >
        <div className="h-full relative">
          <FileManagerGrid
            files={rightFiles}
            selectedFiles={rightSelection.selectedFiles}
            onFileSelect={rightSelection.selectFile}
            onFileOpen={onRightFileOpen}
            onSelectionChange={rightSelection.setSelection}
            currentPath={rightPath}
            isLoading={rightLoading}
            onPathChange={onRightPathChange}
            onRefresh={onRightRefresh}
            onContextMenu={onContextMenu}
            viewMode={viewMode}
            onRename={onRename}
            editingFile={editingFile}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onDelete={onDelete}
            onCopy={onCopy}
            onCut={onCut}
            onPaste={onPaste}
            onUndo={onUndo}
            hasClipboard={hasClipboard}
            onFileDrop={handleRightFileDrop}
            onFileDiff={onFileDiff}
            onSystemDragStart={onSystemDragStart}
            onSystemDragEnd={onSystemDragEnd}
            createIntent={rightCreateIntent}
            onConfirmCreate={onRightConfirmCreate}
            onCancelCreate={onRightCancelCreate}
          />
          {/* Panel Type & Active Indicator */}
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
              {rightPanelType === "local" ? "📁 Local" : "🌐 Remote"}
            </div>
            {activePanel === "right" && (
              <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                {t("fileManager.activePanel")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
