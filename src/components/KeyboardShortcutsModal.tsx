import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard, Command } from "lucide-react";
import shortcutNavigation from "@/assets/shortcut-navigation.png";
import shortcutCalendar from "@/assets/shortcut-calendar.png";
import shortcutSearch from "@/assets/shortcut-search.png";

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

const demoImages = [
  {
    src: shortcutNavigation,
    alt: "Navigation shortcuts demo",
    caption: "Quick navigation with G+D, G+C, G+T",
  },
  {
    src: shortcutCalendar,
    alt: "Calendar navigation demo",
    caption: "Navigate calendar with arrow keys",
  },
  {
    src: shortcutSearch,
    alt: "Quick search demo",
    caption: "Command palette with ⌘/Ctrl+K",
  },
];

const KeyboardShortcutsModal = ({ open, onOpenChange }: KeyboardShortcutsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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

          {/* Demo Screenshots */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Visual Guide
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {demoImages.map((image, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                    <img 
                      src={image.src} 
                      alt={image.alt}
                      className="w-full h-auto object-cover aspect-video"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">
                    {image.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>

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
