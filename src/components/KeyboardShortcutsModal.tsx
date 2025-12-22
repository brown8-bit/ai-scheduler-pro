import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "C"], description: "Go to Calendar" },
      { keys: ["G", "T"], description: "Go to Tasks" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ],
  },
  {
    category: "Actions",
    items: [
      { keys: ["N"], description: "New event" },
      { keys: ["⌘/Ctrl", "K"], description: "Quick search" },
      { keys: ["⌘/Ctrl", "S"], description: "Save changes" },
      { keys: ["Esc"], description: "Close modal / Cancel" },
    ],
  },
  {
    category: "Calendar",
    items: [
      { keys: ["←"], description: "Previous week/month" },
      { keys: ["→"], description: "Next week/month" },
      { keys: ["T"], description: "Go to today" },
    ],
  },
  {
    category: "General",
    items: [
      { keys: ["?"], description: "Show this guide" },
      { keys: ["⌘/Ctrl", "/"], description: "Toggle sidebar" },
    ],
  },
];

const KeyboardShortcutsModal = ({ open, onOpenChange }: KeyboardShortcutsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium bg-background border border-border rounded shadow-sm">
                            {key === "⌘/Ctrl" ? (
                              <span className="flex items-center gap-0.5">
                                <Command className="w-3 h-3" />
                                <span className="text-muted-foreground">/</span>
                                <span>Ctrl</span>
                              </span>
                            ) : (
                              key
                            )}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">?</kbd> anywhere to open this guide
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsModal;
