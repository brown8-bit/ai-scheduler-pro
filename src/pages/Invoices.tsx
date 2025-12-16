import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, FileText, DollarSign, Calendar, Edit, Trash2, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string | null;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  client_id: string | null;
  created_at: string;
  clients?: Client | null;
}

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: "",
    amount: "",
    status: "draft",
    due_date: "",
    client_id: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchClients();
    }
  }, [user]);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, clients(id, name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch invoices", variant: "destructive" });
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name").order("name");
    setClients(data || []);
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const num = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}-${num}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const invoiceData = {
      invoice_number: formData.invoice_number || generateInvoiceNumber(),
      amount: parseFloat(formData.amount) || 0,
      status: formData.status,
      due_date: formData.due_date || null,
      client_id: formData.client_id || null,
      notes: formData.notes || null,
    };

    if (editingInvoice) {
      const { error } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", editingInvoice.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update invoice", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Invoice updated!" });
        fetchInvoices();
      }
    } else {
      const { error } = await supabase.from("invoices").insert({
        ...invoiceData,
        user_id: user.id,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Invoice created!" });
        fetchInvoices();
      }
    }

    setIsDialogOpen(false);
    setEditingInvoice(null);
    setFormData({ invoice_number: "", amount: "", status: "draft", due_date: "", client_id: "", notes: "" });
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      amount: invoice.amount.toString(),
      status: invoice.status || "draft",
      due_date: invoice.due_date || "",
      client_id: invoice.client_id || "",
      notes: invoice.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Invoice deleted!" });
      fetchInvoices();
    }
  };

  const markAsPaid = async (invoice: Invoice) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", invoice.id);

    if (!error) {
      fetchInvoices();
      toast({ title: "Success", description: "Invoice marked as paid!" });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "paid": return "bg-green-500";
      case "sent": return "bg-blue-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">Please log in to manage invoices.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Track payments and manage billing</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingInvoice(null); setFormData({ invoice_number: generateInvoiceNumber(), amount: "", status: "draft", due_date: "", client_id: "", notes: "" }); }}>
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="invoice_number">Invoice Number</Label>
                  <Input id="invoice_number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">{editingInvoice ? "Update" : "Create"} Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices yet. Create your first invoice!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${getStatusColor(invoice.status)}`} />
                    <div>
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">{invoice.clients?.name || "No client"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg">${invoice.amount.toFixed(2)}</p>
                      {invoice.due_date && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {format(new Date(invoice.due_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(invoice)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        {invoice.status !== "paid" && (
                          <DropdownMenuItem onClick={() => markAsPaid(invoice)}><DollarSign className="w-4 h-4 mr-2" /> Mark as Paid</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(invoice.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Invoices;