import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

const levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LessonRequest = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    child_name: "",
    child_age: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    preferred_level: "Grade 1",
    preferred_day: "",
    preferred_time: "",
    notes: "",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.child_name.trim() || !form.parent_name.trim() || !form.parent_email.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("lesson_requests").insert({
      parent_user_id: user.id,
      child_name: form.child_name.trim(),
      child_age: form.child_age ? parseInt(form.child_age) : null,
      parent_name: form.parent_name.trim(),
      parent_email: form.parent_email.trim(),
      parent_phone: form.parent_phone.trim() || null,
      preferred_level: form.preferred_level,
      preferred_day: form.preferred_day || null,
      preferred_time: form.preferred_time || null,
      notes: form.notes.trim() || null,
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "We'll review your request and get back to you soon." });
      navigate("/parent");
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold">
              <span className="text-gradient-gold">Shanika</span> Lesson Request
            </h1>
            <p className="text-xs text-muted-foreground">Submit a request for piano lessons</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Request Piano Lessons</CardTitle>
            <CardDescription>
              Fill in the details below. We'll review your request based on availability and contact you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="child_name">Child's Name *</Label>
                  <Input id="child_name" value={form.child_name} onChange={e => update("child_name", e.target.value)} required maxLength={100} placeholder="e.g. Emma Thompson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child_age">Child's Age</Label>
                  <Input id="child_age" type="number" min={3} max={99} value={form.child_age} onChange={e => update("child_age", e.target.value)} placeholder="e.g. 10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_name">Parent/Guardian Name *</Label>
                  <Input id="parent_name" value={form.parent_name} onChange={e => update("parent_name", e.target.value)} required maxLength={100} placeholder="e.g. Sarah Thompson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_email">Contact Email *</Label>
                  <Input id="parent_email" type="email" value={form.parent_email} onChange={e => update("parent_email", e.target.value)} required maxLength={255} placeholder="e.g. sarah@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">WhatsApp / Phone</Label>
                  <Input id="parent_phone" type="tel" value={form.parent_phone} onChange={e => update("parent_phone", e.target.value)} maxLength={20} placeholder="e.g. +44 7700 900000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Level</Label>
                <Select value={form.preferred_level} onValueChange={v => update("preferred_level", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Day</Label>
                  <Select value={form.preferred_day} onValueChange={v => update("preferred_day", v)}>
                    <SelectTrigger><SelectValue placeholder="Select a day" /></SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_time">Preferred Time</Label>
                  <Input id="preferred_time" value={form.preferred_time} onChange={e => update("preferred_time", e.target.value)} maxLength={20} placeholder="e.g. 3:00 PM" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={e => update("notes", e.target.value)} maxLength={500} placeholder="Any previous experience, musical goals, or other information..." rows={3} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
                <Send size={16} className="mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LessonRequest;
