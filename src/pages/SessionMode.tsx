import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronLeft, Save, Send, Plus, X, ListChecks, Mic,
  CheckCircle2, XCircle, Clock, Mail, AlertCircle, Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const HOMEWORK_TEMPLATES = [
  "Practice this week's material daily (20 min)",
  "Focus on ensemble balance and listening to others",
  "Review the piece hands separately then together",
];

type AttendanceValue = "present" | "absent" | "late" | "scheduled";

const AttendanceBtn = ({
  value, current, onChange,
}: {
  value: AttendanceValue;
  current: AttendanceValue;
  onChange: (v: AttendanceValue) => void;
}) => {
  const map: Record<string, { label: string; icon: any; active: string }> = {
    present:   { label: "Present", icon: CheckCircle2, active: "bg-emerald-500 text-white border-transparent shadow-sm" },
    absent:    { label: "Absent",  icon: XCircle,      active: "bg-destructive text-destructive-foreground border-transparent shadow-sm" },
    late:      { label: "Late",    icon: Clock,        active: "bg-amber-400 text-white border-transparent shadow-sm" },
  };
  const config = map[value];
  const Icon = config.icon;
  const isActive = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
        isActive ? config.active : "border-border text-muted-foreground hover:border-muted-foreground/40"
      }`}
    >
      <Icon size={12} /> {config.label}
    </button>
  );
};

const RecapSendModal = ({
  open, onClose, session, cls, members, notes, homeworkItems, studioId, userId,
}: {
  open: boolean;
  onClose: () => void;
  session: any;
  cls: any;
  members: any[];
  notes: string;
  homeworkItems: string[];
  studioId: string;
  userId: string;
}) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(members.map(m => m.student_id)));
  const [sending, setSending] = useState(false);

  const toggleAll = () => {
    if (selected.size === members.length) setSelected(new Set());
    else setSelected(new Set(members.map(m => m.student_id)));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const dateStr = format(parseISO(session.starts_at), "EEEE, d MMMM yyyy");
      const subject = `Group Class Recap – ${cls.name} – ${dateStr}`;

      for (const m of members) {
        if (!selected.has(m.student_id)) continue;
        const student = m.students;
        const bodyHtml = `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
            <h2 style="color:#b8860b;">Group Class Recap — ${cls.name}</h2>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Student:</strong> ${student.name}</p>
            ${notes ? `<h3>📝 Session Notes</h3><p style="white-space:pre-wrap">${notes}</p>` : ""}
            ${homeworkItems.length > 0 ? `<h3>📋 Homework</h3><ul>${homeworkItems.map(h => `<li>${h}</li>`).join("")}</ul>` : ""}
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
            <p style="font-size:12px;color:#888;">Sent via Conservo · Music Studio Management</p>
          </div>
        `;

        await supabase.from("recap_messages").insert({
          studio_id: studioId,
          student_id: m.student_id,
          sent_by_user_id: userId,
          subject,
          body_html: bodyHtml,
          email_to: student.parent_email ?? null,
          status: "sent",
          class_session_id: session.id,
          class_id: cls.id,
        });

        if (student.parent_email) {
          await supabase.functions.invoke("send-recap-email", {
            body: { to: student.parent_email, subject, bodyHtml, studentName: student.name },
          });
        }
      }

      // Save homework
      if (homeworkItems.length > 0) {
        await supabase.from("class_homework").upsert({
          studio_id: studioId,
          class_session_id: session.id,
          title: `Homework – ${dateStr}`,
          body_json: homeworkItems.map(item => ({ text: item, done: false })),
          status: "active",
        }, { onConflict: "class_session_id" });
      }

      // Mark session completed
      await supabase.from("class_sessions").update({ status: "completed" }).eq("id", session.id);

      qc.invalidateQueries({ queryKey: ["class-sessions"] });
      qc.invalidateQueries({ queryKey: ["calendar-class-sessions"] });
      toast({ title: `Recaps sent to ${selected.size} student${selected.size > 1 ? "s" : ""} ✓` });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border/60 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Send Recaps</p>
            <h2 className="font-heading text-lg font-bold mt-0.5">Select Recipients</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selected.size} of {members.length} selected</p>
            <button onClick={toggleAll} className="text-xs text-primary font-medium hover:underline">
              {selected.size === members.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="space-y-2">
            {members.map(m => {
              const s = m.students;
              const checked = selected.has(m.student_id);
              return (
                <div
                  key={m.student_id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 cursor-pointer"
                  onClick={() => {
                    const next = new Set(selected);
                    checked ? next.delete(m.student_id) : next.add(m.student_id);
                    setSelected(next);
                  }}
                >
                  <Checkbox checked={checked} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail size={10} />
                      {s?.parent_email ?? "No email on file"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {!homeworkItems.length && !notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 flex gap-2">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">No notes or homework added. The recap will still be sent.</p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border/60 px-5 py-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button
            className="flex-1 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold"
            onClick={handleSend}
            disabled={sending || selected.size === 0}
          >
            <Send size={14} className="mr-2" />
            {sending ? "Sending..." : `Send to ${selected.size}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SessionMode = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { studio } = useStudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceValue>>({});
  const [notes, setNotes] = useState("");
  const [homeworkItems, setHomeworkItems] = useState<string[]>([]);
  const [newHw, setNewHw] = useState("");
  const [showRecap, setShowRecap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: session } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*, classes(*)")
        .eq("id", sessionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: members } = useQuery({
    queryKey: ["session-members", sessionId],
    queryFn: async () => {
      if (!session) return [];
      const { data, error } = await supabase
        .from("class_members")
        .select("*, students(id, name, level, parent_email)")
        .eq("class_id", session.class_id)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session,
    onSuccess: (data) => {
      // Load existing attendance
      const init: Record<string, AttendanceValue> = {};
      data.forEach((m: any) => { init[m.student_id] = "scheduled"; });
      setAttendanceMap(prev => ({ ...init, ...prev }));
    },
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ["session-attendance", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_attendance")
        .select("*")
        .eq("class_session_id", sessionId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
    onSuccess: (data) => {
      const map: Record<string, AttendanceValue> = {};
      data.forEach((a: any) => { map[a.student_id] = a.attendance as AttendanceValue; });
      setAttendanceMap(prev => ({ ...prev, ...map }));
    },
  });

  const { data: existingNotes } = useQuery({
    queryKey: ["session-notes", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_session_notes")
        .select("*")
        .eq("class_session_id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
    onSuccess: (data) => {
      if (data?.notes_text) setNotes(data.notes_text);
    },
  });

  const { data: existingHomework } = useQuery({
    queryKey: ["session-homework", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_homework")
        .select("*")
        .eq("class_session_id", sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
    onSuccess: (data) => {
      if (data?.body_json) {
        const items = (data.body_json as any[]).map((i: any) => i.text ?? i);
        setHomeworkItems(items);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session || !studio) return;

      // Save attendance
      const attRows = Object.entries(attendanceMap).map(([student_id, attendance]) => ({
        studio_id: studio.id,
        class_session_id: sessionId!,
        student_id,
        attendance,
      }));
      if (attRows.length > 0) {
        const { error } = await supabase.from("class_attendance").upsert(attRows, { onConflict: "class_session_id,student_id" });
        if (error) throw error;
      }

      // Save session notes
      const { error: notesError } = await supabase.from("class_session_notes").upsert({
        studio_id: studio.id,
        class_session_id: sessionId!,
        notes_text: notes,
      }, { onConflict: "class_session_id" });
      if (notesError) throw notesError;

      // Save homework
      if (homeworkItems.length > 0) {
        await supabase.from("class_homework").upsert({
          studio_id: studio.id,
          class_session_id: sessionId!,
          body_json: homeworkItems.map(item => ({ text: item, done: false })),
          status: "active",
        }, { onConflict: "class_session_id" });
      }

      qc.invalidateQueries({ queryKey: ["class-sessions"] });
    },
    onSuccess: () => toast({ title: "Session saved ✓" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDictate = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: "Dictation not supported in this browser" }); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((res: any) => res[0].transcript).join(" ");
      setNotes(prev => prev ? prev + " " + transcript : transcript);
    };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start(); setIsListening(true);
  };

  const addHw = (text?: string) => {
    const t = text ?? newHw.trim();
    if (t) { setHomeworkItems(prev => [...prev, t]); setNewHw(""); }
  };

  const cls = (session as any)?.classes;

  if (!session) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading session…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/60 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/classes/${session.class_id}`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Users size={11} /> Session Mode
            </p>
            <h2 className="font-heading text-xl font-bold mt-0.5">{cls?.name}</h2>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(session.starts_at), "EEEE, d MMMM yyyy")} · {format(parseISO(session.starts_at), "HH:mm")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6 max-w-2xl mx-auto w-full">
        {/* Section 1: Attendance */}
        <section>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
            1 · Attendance ({(members ?? []).length} students)
          </Label>
          <div className="space-y-2">
            {(members ?? []).map((m: any) => {
              const s = m.students;
              const current = attendanceMap[m.student_id] ?? "scheduled";
              return (
                <div key={m.student_id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                    {s?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <p className="text-sm font-medium flex-1 truncate">{s?.name}</p>
                  <div className="flex gap-1.5">
                    {(["present", "absent", "late"] as AttendanceValue[]).map(v => (
                      <AttendanceBtn key={v} value={v} current={current} onChange={val => setAttendanceMap(prev => ({ ...prev, [m.student_id]: val }))} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Notes */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2 · Session Notes</Label>
            <button
              onClick={handleDictate}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isListening ? "bg-destructive/15 text-destructive animate-pulse" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Mic size={12} />{isListening ? "Stop" : "Dictate"}
            </button>
          </div>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What did the group cover? Observations, dynamics, technique tips…"
            rows={4}
            className="text-sm resize-none"
            maxLength={3000}
          />
        </section>

        {/* Section 3: Shared Homework */}
        <section>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">3 · Shared Homework</Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {HOMEWORK_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => addHw(t)}
                className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              >
                + {t.slice(0, 40)}…
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <Input
              value={newHw}
              onChange={e => setNewHw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHw())}
              placeholder="Add a homework item…"
              className="text-sm h-9"
              maxLength={200}
            />
            <Button size="sm" variant="outline" onClick={() => addHw()} className="h-9 px-3 shrink-0">
              <Plus size={14} />
            </Button>
          </div>
          {homeworkItems.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {homeworkItems.map((hw, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-sm">
                  <ListChecks size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span className="flex-1">{hw}</span>
                  <button onClick={() => setHomeworkItems(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky bottom */}
      <div className="sticky bottom-0 bg-card border-t border-border/60 px-4 py-4 flex gap-3 max-w-2xl mx-auto w-full">
        <Button variant="outline" className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save size={15} className="mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          className="flex-1 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold"
          onClick={async () => { await saveMutation.mutateAsync(); setShowRecap(true); }}
          disabled={saveMutation.isPending}
        >
          <Send size={15} className="mr-2" /> Send Recaps
        </Button>
      </div>

      {showRecap && session && cls && (
        <RecapSendModal
          open={showRecap}
          onClose={() => { setShowRecap(false); navigate(`/classes/${session.class_id}`); }}
          session={session}
          cls={cls}
          members={members ?? []}
          notes={notes}
          homeworkItems={homeworkItems}
          studioId={studio?.id ?? ""}
          userId={user?.id ?? ""}
        />
      )}
    </div>
  );
};

export default SessionMode;
