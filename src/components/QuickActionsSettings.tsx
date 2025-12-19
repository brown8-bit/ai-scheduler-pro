import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuickActions, type QuickAction } from "@/hooks/useQuickActions";
import { RotateCcw, Edit2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const QuickActionsSettings = () => {
  const { quickActions, updateQuickAction, resetToDefaults } = useQuickActions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuickAction>>({});

  const startEditing = (action: QuickAction) => {
    setEditingId(action.id);
    setEditForm({
      label: action.label,
      prompt: action.prompt,
      icon: action.icon
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editingId || !editForm.label?.trim() || !editForm.prompt?.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in both label and prompt.",
        variant: "destructive"
      });
      return;
    }

    updateQuickAction(editingId, {
      label: editForm.label.trim(),
      prompt: editForm.prompt.trim(),
      icon: editForm.icon || "⚡"
    });

    toast({
      title: "Quick action updated",
      description: "Your changes have been saved."
    });

    cancelEditing();
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: "Reset complete",
      description: "Quick actions restored to defaults."
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Customize quick action buttons that appear below the chat input.
        </p>
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {quickActions.map((action) => (
          <div 
            key={action.id} 
            className="p-3 rounded-lg border border-border bg-secondary/30"
          >
            {editingId === action.id ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-16">
                    <Label className="text-xs">Icon</Label>
                    <Input
                      value={editForm.icon || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="text-center"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Button Label</Label>
                    <Input
                      value={editForm.label || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., Block focus time"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Prompt (what gets sent to Scheddy)</Label>
                  <Textarea
                    value={editForm.prompt || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="e.g., Block 2 hours of focus time tomorrow morning..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditing}>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{action.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.prompt}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => startEditing(action)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsSettings;
