import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { getSetting, saveSetting, getCookie, setCookie } from "@/ui/main-axios.ts";
import { useTabs } from "@/ui/Desktop/Navigation/Tabs/TabContext.tsx";
import { useTranslation } from "react-i18next";

interface TerminalSettingsProps {}

export function TerminalSettings({}: TerminalSettingsProps) {
  const { t } = useTranslation();
  const { tabs } = useTabs() as any;
  const [fontSize, setFontSize] = useState<string>("14");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<number[]>([]);

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

  const terminalTabs = tabs.filter((tab: any) => tab.type === "terminal");

  const handleTabToggle = (tabId: number) => {
    setSelectedTabIds((prev) =>
      prev.includes(tabId)
        ? prev.filter((id) => id !== tabId)
        : [...prev, tabId],
    );
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      const input = document.getElementById(
        "terminal-settings-input",
      ) as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setSelectedTabIds([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedTabIds.length === 0) return;

    let commandToSend = "";

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "c") {
        commandToSend = "\x03";
        e.preventDefault();
      } else if (e.key === "d") {
        commandToSend = "\x04";
        e.preventDefault();
      } else if (e.key === "l") {
        commandToSend = "\x0c";
        e.preventDefault();
      } else if (e.key === "u") {
        commandToSend = "\x15";
        e.preventDefault();
      } else if (e.key === "k") {
        commandToSend = "\x0b";
        e.preventDefault();
      } else if (e.key === "a") {
        commandToSend = "\x01";
        e.preventDefault();
      } else if (e.key === "e") {
        commandToSend = "\x05";
        e.preventDefault();
      } else if (e.key === "w") {
        commandToSend = "\x17";
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      commandToSend = "\n";
      e.preventDefault();
    } else if (e.key === "Backspace") {
      commandToSend = "\x08";
      e.preventDefault();
    } else if (e.key === "Delete") {
      commandToSend = "\x7f";
      e.preventDefault();
    } else if (e.key === "Tab") {
      commandToSend = "\x09";
      e.preventDefault();
    } else if (e.key === "Escape") {
      commandToSend = "\x1b";
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      commandToSend = "\x1b[A";
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      commandToSend = "\x1b[B";
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      commandToSend = "\x1b[D";
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      commandToSend = "\x1b[C";
      e.preventDefault();
    } else if (e.key === "Home") {
      commandToSend = "\x1b[H";
      e.preventDefault();
    } else if (e.key === "End") {
      commandToSend = "\x1b[F";
      e.preventDefault();
    } else if (e.key === "PageUp") {
      commandToSend = "\x1b[5~";
      e.preventDefault();
    } else if (e.key === "PageDown") {
      commandToSend = "\x1b[6~";
      e.preventDefault();
    } else if (e.key === "Insert") {
      commandToSend = "\x1b[2~";
      e.preventDefault();
    } else if (e.key === "F1") {
      commandToSend = "\x1bOP";
      e.preventDefault();
    } else if (e.key === "F2") {
      commandToSend = "\x1bOQ";
      e.preventDefault();
    } else if (e.key === "F3") {
      commandToSend = "\x1bOR";
      e.preventDefault();
    } else if (e.key === "F4") {
      commandToSend = "\x1bOS";
      e.preventDefault();
    } else if (e.key === "F5") {
      commandToSend = "\x1b[15~";
      e.preventDefault();
    } else if (e.key === "F6") {
      commandToSend = "\x1b[17~";
      e.preventDefault();
    } else if (e.key === "F7") {
      commandToSend = "\x1b[18~";
      e.preventDefault();
    } else if (e.key === "F8") {
      commandToSend = "\x1b[19~";
      e.preventDefault();
    } else if (e.key === "F9") {
      commandToSend = "\x1b[20~";
      e.preventDefault();
    } else if (e.key === "F10") {
      commandToSend = "\x1b[21~";
      e.preventDefault();
    } else if (e.key === "F11") {
      commandToSend = "\x1b[23~";
      e.preventDefault();
    } else if (e.key === "F12") {
      commandToSend = "\x1b[24~";
      e.preventDefault();
    }

    if (commandToSend) {
      selectedTabIds.forEach((tabId) => {
        const tab = tabs.find((t: any) => t.id === tabId);
        if (tab?.terminalRef?.current?.sendInput) {
          tab.terminalRef.current.sendInput(commandToSend);
        }
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectedTabIds.length === 0) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const char = e.key;
      selectedTabIds.forEach((tabId) => {
        const tab = tabs.find((t: any) => t.id === tabId);
        if (tab?.terminalRef?.current?.sendInput) {
          tab.terminalRef.current.sendInput(char);
        }
      });
    }
  };

  const updateRightClickCopyPaste = (checked: boolean) => {
    setCookie("rightClickCopyPaste", checked.toString());
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

        <Separator className="my-6" />

        {/* SSH Tools / Key Recording Section */}
        <div className="p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">
                {t("sshTools.keyRecording")}
              </h3>
              <p className="text-xs text-gray-400">
                Send commands to multiple terminal sessions simultaneously
              </p>
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={handleStartRecording}
                  className="flex-1"
                  variant="outline"
                >
                  {t("sshTools.startKeyRecording")}
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  className="flex-1"
                  variant="destructive"
                >
                  {t("sshTools.stopKeyRecording")}
                </Button>
              )}
            </div>

            {isRecording && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {t("sshTools.selectTerminals")}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {terminalTabs.map((tab) => (
                      <Button
                        key={tab.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-3 py-1 text-xs ${
                          selectedTabIds.includes(tab.id)
                            ? "text-white bg-gray-700"
                            : "text-gray-500"
                        }`}
                        onClick={() => handleTabToggle(tab.id)}
                      >
                        {tab.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    {t("sshTools.typeCommands")}
                  </label>
                  <Input
                    id="terminal-settings-input"
                    placeholder={t("placeholders.typeHere")}
                    onKeyDown={handleKeyDown}
                    onKeyPress={handleKeyPress}
                    className="font-mono"
                    disabled={selectedTabIds.length === 0}
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("sshTools.commandsWillBeSent", {
                      count: selectedTabIds.length,
                    })}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right-Click Copy/Paste Setting */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-sidebar-bg)] border border-[var(--color-dark-border)]">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-white">
              {t("sshTools.enableRightClickCopyPaste")}
            </label>
            <p className="text-xs text-gray-400">
              Enable right-click to copy/paste in terminals
            </p>
          </div>
          <Checkbox
            id="enable-copy-paste"
            onCheckedChange={updateRightClickCopyPaste}
            defaultChecked={getCookie("rightClickCopyPaste") === "true"}
          />
        </div>
      </div>
    </div>
  );
}
