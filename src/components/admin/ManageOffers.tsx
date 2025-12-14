import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Crown, Star, Zap, Flame, Trophy, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  gradient: string;
  is_active: boolean;
  display_order: number;
  expires_at: string | null;
}

const iconOptions = [
  { value: "Gift", label: "Gift", icon: Gift },
  { value: "Crown", label: "Crown", icon: Crown },
  { value: "Star", label: "Star", icon: Star },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Flame", label: "Flame", icon: Flame },
  { value: "Trophy", label: "Trophy", icon: Trophy },
];

const gradientOptions = [
  { value: "from-red-500 to-orange-500", label: "Red → Orange" },
  { value: "from-amber-500 to-yellow-500", label: "Amber → Yellow" },
  { value: "from-purple-500 to-pink-500", label: "Purple → Pink" },
  { value: "from-blue-500 to-cyan-500", label: "Blue → Cyan" },
  { value: "from-green-500 to-emerald-500", label: "Green → Emerald" },
  { value: "from-primary to-accent", label: "Primary → Accent" },
];

const ManageOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    badge: "",
    icon: "Gift",
    gradient: "from-red-500 to-orange-500",
    is_active: true,
    display_order: 0,
    expires_at: "",
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("limited_offers")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.badge) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const offerData = {
      title: formData.title,
      description: formData.description,
      badge: formData.badge,
      icon: formData.icon,
      gradient: formData.gradient,
      is_active: formData.is_active,
      display_order: formData.display_order,
      expires_at: formData.expires_at || null,
    };

    if (editingOffer) {
      const { error } = await supabase
        .from("limited_offers")
        .update(offerData)
        .eq("id", editingOffer.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update offer",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Offer updated successfully",
        });
        setDialogOpen(false);
        fetchOffers();
      }
    } else {
      const { error } = await supabase
        .from("limited_offers")
        .insert(offerData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create offer",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Offer created successfully",
        });
        setDialogOpen(false);
        fetchOffers();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("limited_offers")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
      fetchOffers();
    }
  };

  const openCreateDialog = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      badge: "",
      icon: "Gift",
      gradient: "from-red-500 to-orange-500",
      is_active: true,
      display_order: offers.length + 1,
      expires_at: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      badge: offer.badge,
      icon: offer.icon,
      gradient: offer.gradient,
      is_active: offer.is_active,
      display_order: offer.display_order,
      expires_at: offer.expires_at ? offer.expires_at.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((i) => i.value === iconName);
    return iconOption ? iconOption.icon : Gift;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Limited Time Offers
          </h2>
          <p className="text-sm text-muted-foreground">Manage promotional offers on the home page</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingOffer ? "Edit Offer" : "Create New Offer"}</DialogTitle>
              <DialogDescription>
                {editingOffer ? "Update the offer details below." : "Fill in the details for the new offer."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Holiday Special"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Get 50% off your first 3 months"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="badge">Badge Text *</Label>
                <Input
                  id="badge"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Ends Dec 25"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Gradient</Label>
                  <Select value={formData.gradient} onValueChange={(value) => setFormData({ ...formData, gradient: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gradientOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expires">Expires At</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active (visible on home page)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingOffer ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {offers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No offers yet. Create your first offer!</p>
        ) : (
          offers.map((offer) => {
            const IconComponent = getIconComponent(offer.icon);
            return (
              <div
                key={offer.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  offer.is_active ? "border-border bg-secondary/30" : "border-border/50 bg-secondary/10 opacity-60"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${offer.gradient} flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{offer.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${offer.is_active ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{offer.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(offer)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(offer.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ManageOffers;