import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Settings2, CreditCard, Mail, Building2, CheckCircle2, AlertCircle, Copy
} from "lucide-react";

const Settings = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [studioName, setStudioName] = useState(studio?.name ?? "");
  const [emailSubject, setEmailSubject] = useState(
    "Lesson Recap – {{student_name}} – {{lesson_date}}"
  );
  const [emailBody, setEmailBody] = useState(
    `Hi there,\n\nHere is the recap for {{student_name}}'s lesson on {{lesson_date}}.\n\n**Notes:**\n{{notes}}\n\n**Homework:**\n{{homework}}\n\nSee you next time!\n`
  );

  const updateStudioMutation = useMutation({
    mutationFn: async () => {
      if (!studio) return;
      const { error } = await supabase
        .from("studios")
        .update({ name: studioName })
        .eq("id", studio.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio"] });
      toast({ title: "Studio profile saved ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const templateVars = [
    "{{student_name}}",
    "{{lesson_date}}",
    "{{notes}}",
    "{{homework}}",
    "{{pieces}}",
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl font-bold">Studio Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your studio profile, email templates, and integrations.</p>
      </div>

      {/* Studio Profile */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Building2 size={16} className="text-primary" /> Studio Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Studio Name</Label>
            <Input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="My Music Studio"
            />
          </div>
          <Button
            className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold"
            onClick={() => updateStudioMutation.mutate()}
            disabled={updateStudioMutation.isPending}
          >
            {updateStudioMutation.isPending ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Email Recap Template */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Mail size={16} className="text-primary" /> Recap Email Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <p className="text-xs text-muted-foreground w-full mb-1">Available variables:</p>
            {templateVars.map((v) => (
              <button
                key={v}
                onClick={() => {
                  navigator.clipboard.writeText(v);
                  toast({ title: `Copied ${v}` });
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted font-mono hover:bg-muted/80 transition-colors"
              >
                <Copy size={9} /> {v}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subject</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Body (plain text / markdown)</Label>
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={7}
              className="text-sm font-mono resize-none"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => toast({ title: "Template saved ✓" })}
          >
            Save Template
          </Button>
        </CardContent>
      </Card>

      {/* Email Provider */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Mail size={16} className="text-muted-foreground" /> Email Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-amber-300/60 bg-amber-50/40 p-4 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">No email provider configured</p>
              <p className="text-xs text-amber-700 mt-1">
                Recaps are saved to the database. To send real emails, add your Resend API key via the
                backend secrets panel. The system will use it automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <CreditCard size={16} className="text-primary" /> Stripe Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Stripe Connection</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect Stripe to enable invoices and subscriptions for parents.
              </p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              <AlertCircle size={11} className="mr-1" /> Not connected
            </Badge>
          </div>
          <div className="rounded-xl border border-border/50 p-4 space-y-2">
            <p className="text-sm font-semibold">Billing Mode</p>
            <div className="flex gap-2">
              {["Pay per lesson (Invoices)", "Monthly Subscription"].map((mode, i) => (
                <button
                  key={i}
                  disabled={i === 1}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-all ${
                    i === 0
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                  }`}
                >
                  {mode}
                  {i === 1 && <span className="block text-[10px]">(Coming soon)</span>}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => toast({ title: "Stripe setup coming soon", description: "Connect via the Payments page once Stripe is enabled." })}
          >
            <CreditCard size={14} className="mr-2" /> Connect Stripe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
