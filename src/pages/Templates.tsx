import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Clock, Tag, Crown } from "lucide-react";

interface Template {
  id: string;
  name: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  category: string | null;
}

interface UsageData {
  tier: string;
  limits: { ai_requests: number; templates: number };
  usage: { ai_requests_this_month: number; templates_count: number };
}

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    duration_minutes: 30,
    category: "general",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-usage");
      if (!error && data) {
        setUsageData(data);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("event_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const canCreateTemplate = () => {
    if (!usageData) return true;
    if (usageData.limits.templates === 0) return true; // Unlimited
    return usageData.usage.templates_count < usageData.limits.templates;
  };

  const getTemplateUsageText = () => {
    if (!usageData) return "";
    if (usageData.limits.templates === 0) return "Unlimited templates";
    return `${usageData.usage.templates_count}/${usageData.limits.templates} templates used`;
  };

  const handleCreate = async () => {
    // Check template limit before creating
    if (!canCreateTemplate()) {
      toast({
        title: "Template Limit Reached",
        description: `You've reached your limit of ${usageData?.limits.templates} templates. Upgrade to Pro for more!`,
        variant: "destructive",
      });
      setDialogOpen(false);
      navigate("/pricing");
      return;
    }

    const { error } = await supabase.from("event_templates").insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Template Created! 🎉",
        description: "Your event template is ready to use",
      });
      setDialogOpen(false);
      setFormData({ name: "", title: "", description: "", duration_minutes: 30, category: "general" });
      fetchTemplates();
      fetchUsage(); // Refresh usage data
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("event_templates").delete().eq("id", id);

    if (!error) {
      toast({
        title: "Template Deleted",
        description: "The template has been removed",
      });
      fetchTemplates();
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      meeting: "text-blue-500",
      reminder: "text-amber-500",
      task: "text-green-500",
      personal: "text-purple-500",
      general: "text-muted-foreground",
    };
    return colors[category || "general"] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Event Templates
            </h1>
            <p className="text-muted-foreground mt-2">
              Create reusable templates for quick scheduling ⚡
            </p>
            {usageData && (
              <p className="text-sm text-muted-foreground mt-1">
                {getTemplateUsageText()}
                {usageData.tier !== "lifetime" && usageData.limits.templates > 0 && !canCreateTemplate() && (
                  <Button variant="link" className="px-2 h-auto text-primary" onClick={() => navigate("/pricing")}>
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </p>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!canCreateTemplate()}>
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Weekly Team Sync"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Team Sync Meeting"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!formData.name || !formData.title}>
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first template to speed up scheduling!
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{template.title}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {template.duration_minutes} min
                    </span>
                    <span className={`flex items-center gap-1 ${getCategoryColor(template.category)}`}>
                      <Tag className="h-4 w-4" />
                      {template.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Templates;
