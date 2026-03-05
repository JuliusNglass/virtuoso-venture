import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, CreditCard, Download, MessageCircle, DollarSign, Users, TrendingUp, Settings2
} from "lucide-react";

const Payments = () => {
  const navigate = useNavigate();

  const { data: students } = useQuery({
    queryKey: ["payments-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, status, parent_email, parent_name, parent_phone")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const overdue = students?.filter((s) => s.status === "awaiting_payment") ?? [];
  const active = students?.filter((s) => s.status === "active") ?? [];

  const openWhatsApp = (phone: string | null | undefined, name: string) => {
    if (!phone) return;
    const msg = encodeURIComponent(
      `Hi! This is a friendly reminder that your payment for ${name}'s lessons is overdue. Please let me know if you have any questions.`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track overdue balances and manage invoices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
            <Settings2 size={14} className="mr-1.5" /> Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const csv = ["Name,Status,Email,Phone", ...overdue.map(s => `${s.name},Overdue,${s.parent_email ?? ""},${s.parent_phone ?? ""}`)].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "overdue-payments.csv";
            a.click();
          }}>
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center mb-2">
              <AlertCircle size={17} className="text-red-500" />
            </div>
            <p className="text-2xl font-heading font-bold">{overdue.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
              <Users size={17} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-heading font-bold">{active.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center mb-2">
              <TrendingUp size={17} className="text-gold" />
            </div>
            <p className="text-2xl font-heading font-bold">—</p>
            <p className="text-xs text-muted-foreground">Monthly Rev</p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe notice */}
      <Card className="border-amber-300/50 bg-amber-50/30">
        <CardContent className="p-4 flex gap-3">
          <CreditCard size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Stripe not connected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Connect Stripe in Settings to enable real invoices, subscriptions, and online payment links for parents.
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => navigate("/settings")}>
            Connect
          </Button>
        </CardContent>
      </Card>

      {/* Money Risk list */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500" />
            Money Risk — Overdue Payments
            {overdue.length > 0 && (
              <Badge className="ml-auto bg-red-100 text-red-700 border-0">{overdue.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdue.length === 0 ? (
            <div className="py-10 text-center">
              <DollarSign size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-heading font-semibold">All payments up to date ✓</p>
              <p className="text-sm text-muted-foreground mt-1">No outstanding balances right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdue.map((student) => {
                const initials = student.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-red-200/60 bg-red-50/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.parent_name ?? "Parent"} · {student.parent_email ?? "No email"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-300 shrink-0">
                      Overdue
                    </Badge>
                    <div className="flex gap-1.5 shrink-0">
                      {student.parent_phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => openWhatsApp(student.parent_phone, student.name)}
                          title="Send WhatsApp reminder"
                        >
                          <MessageCircle size={13} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => window.location.href = `mailto:${student.parent_email}?subject=Payment reminder&body=Hi, this is a reminder that payment for ${student.name}'s lessons is overdue.`}
                      >
                        Email
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All students billing */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students?.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-xs shrink-0">
                  {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.parent_email ?? "No email"}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    student.status === "active"
                      ? "text-emerald-600 border-emerald-300"
                      : student.status === "awaiting_payment"
                      ? "text-red-600 border-red-300"
                      : "text-muted-foreground"
                  }
                >
                  {student.status === "active" ? "Active" : student.status === "awaiting_payment" ? "Overdue" : student.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
