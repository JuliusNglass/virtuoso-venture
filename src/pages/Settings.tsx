import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Settings2, CreditCard, Mail, Building2, CheckCircle2, AlertCircle, Copy, FlaskConical, Loader2
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const BILLING_MODES = [
  { id: "per_lesson", label: "Pay per lesson", description: "Invoice per session" },
  { id: "monthly",   label: "Monthly subscription", description: "Recurring monthly plan" },
];

const Settings = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [studioName, setStudioName] = useState(studio?.name ?? "");
  const [demoResetting, setDemoResetting] = useState(false);

  // ── Email template state ─────────────────────────────────────────────────
  const [emailSubject, setEmailSubject] = useState(
    "Lesson Recap – {{student_name}} – {{lesson_date}}"
  );
  const [emailBody, setEmailBody] = useState(
    `Hi there,\n\nHere is the recap for {{student_name}}'s lesson on {{lesson_date}}.\n\n**Notes:**\n{{notes}}\n\n**Homework:**\n{{homework}}\n\nSee you next time!\n`
  );
  const [billingMode, setBillingMode] = useState("per_lesson");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [templateDirty, setTemplateDirty] = useState(false);

  // ── Load persisted template ───────────────────────────────────────────────
  const { data: savedTemplate } = useQuery({
    queryKey: ["studio-email-template", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return null;
      const { data } = await supabase
        .from("studio_email_templates" as any)
        .select("*")
        .eq("studio_id", studio.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!studio?.id,
  });

  useEffect(() => {
    if (savedTemplate) {
      setEmailSubject(savedTemplate.subject);
      setEmailBody(savedTemplate.body);
      setBillingMode(savedTemplate.billing_mode ?? "per_lesson");
      setReplyToEmail(savedTemplate.reply_to_email ?? "");
    }
  }, [savedTemplate]);

  useEffect(() => {
    setStudioName(studio?.name ?? "");
  }, [studio?.name]);

  // ── Studio profile ────────────────────────────────────────────────────────
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

  // ── Save email template ───────────────────────────────────────────────────
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!studio?.id) return;
      const payload = {
        studio_id: studio.id,
        subject: emailSubject,
        body: emailBody,
        billing_mode: billingMode,
      };
      const { error } = await (supabase.from("studio_email_templates" as any) as any)
        .upsert(payload, { onConflict: "studio_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-email-template", studio?.id] });
      setTemplateDirty(false);
      toast({ title: "Template saved ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Demo reset ────────────────────────────────────────────────────────────
  const handleResetDemo = async () => {
    setDemoResetting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo?reset=true`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Reset failed");
      }
      toast({ title: "Demo data reset ✓", description: "All sample data has been restored." });
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setDemoResetting(false);
    }
  };

  const templateVars = [
    "{{student_name}}",
    "{{lesson_date}}",
    "{{notes}}",
    "{{homework}}",
    "{{pieces}}",
  ];

  const isDemo = (studio as any)?.is_demo === true;

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

      {/* Demo Data — only visible for demo studios */}
      {isDemo && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <FlaskConical size={16} className="text-primary" /> Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-sm font-semibold">Reset Sample Data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Restore all demo students, lessons, recap messages, practice logs, and group class data back to their original state.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetDemo}
              disabled={demoResetting}
              className="flex items-center gap-2"
            >
              {demoResetting
                ? <><Loader2 size={14} className="animate-spin" /> Resetting…</>
                : <><FlaskConical size={14} /> Reset Demo Data</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing Mode */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <CreditCard size={16} className="text-primary" /> Billing Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {BILLING_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => { setBillingMode(mode.id); setTemplateDirty(true); }}
                className={`flex-1 text-sm py-3 px-4 rounded-xl border text-left transition-all ${
                  billingMode === mode.id
                    ? "border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/30"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-xs">{mode.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{mode.description}</p>
              </button>
            ))}
          </div>
          {templateDirty && (
            <p className="text-xs text-amber-600">You have unsaved changes — save the template below to persist billing mode.</p>
          )}
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
            <p className="text-xs text-muted-foreground w-full mb-1">Click a variable to copy it:</p>
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
              onChange={(e) => { setEmailSubject(e.target.value); setTemplateDirty(true); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Body (plain text / markdown)</Label>
            <Textarea
              value={emailBody}
              onChange={(e) => { setEmailBody(e.target.value); setTemplateDirty(true); }}
              rows={7}
              className="text-sm font-mono resize-none"
            />
          </div>
          <Button
            className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold"
            onClick={() => saveTemplateMutation.mutate()}
            disabled={saveTemplateMutation.isPending}
          >
            {saveTemplateMutation.isPending ? <><Loader2 size={14} className="mr-2 animate-spin" /> Saving…</> : "Save Template"}
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
