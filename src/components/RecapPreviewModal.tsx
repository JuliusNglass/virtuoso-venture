import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Send, X, Mail, MessageCircle, ListChecks, Music, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  student: { id: string; name: string; level: string; parent_email?: string | null };
  lessonId: string;
  notes: string;
  pieces: string[];
  homeworkItems: string[];
  attendance: string;
  studioId?: string;
  userId?: string;
}

const RecapPreviewModal = ({ open, onClose, student, lessonId, notes, pieces, homeworkItems, attendance, studioId, userId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const dateStr = format(new Date(), "EEEE, d MMMM yyyy");
  const [emailStub, setEmailStub] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const subject = `Lesson Recap – ${student.name} – ${dateStr}`;
      const bodyHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #b8860b;">Lesson Recap — ${student.name}</h2>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Attendance:</strong> ${attendance === "present" ? "✅ Present" : attendance === "absent" ? "❌ No-Show" : "⏸ Cancelled"}</p>
          ${notes ? `<h3>📝 Lesson Notes</h3><p style="white-space:pre-wrap">${notes}</p>` : ""}
          ${pieces.length > 0 ? `<h3>🎵 Pieces Covered</h3><ul>${pieces.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}
          ${homeworkItems.length > 0 ? `<h3>📋 Homework</h3><ul>${homeworkItems.map(h => `<li>${h}</li>`).join("")}</ul>` : ""}
          <hr style="margin:24px 0; border:none; border-top:1px solid #eee;"/>
          <p style="font-size:12px;color:#888;">Sent via Conservo · Music Studio Management</p>
        </div>
      `;

      // 1. Save recap to DB
      const { error } = await supabase.from("recap_messages").insert({
        studio_id: studioId ?? null,
        lesson_id: lessonId,
        student_id: student.id,
        sent_by_user_id: userId ?? null,
        subject,
        body_html: bodyHtml,
        email_to: student.parent_email ?? null,
        status: "sent",
      });
      if (error) throw error;

      // 2. Save homework assignments
      if (homeworkItems.length > 0) {
        await supabase.from("homework_assignments").insert({
          studio_id: studioId ?? null,
          lesson_id: lessonId,
          student_id: student.id,
          title: `Homework – ${dateStr}`,
          items: homeworkItems.map(item => ({ text: item, done: false })),
          status: "active",
        });
      }

      // 3. Send email via edge function
      const { data: emailResult, error: fnError } = await supabase.functions.invoke("send-recap-email", {
        body: { to: student.parent_email, subject, bodyHtml, studentName: student.name },
      });

      if (fnError) throw fnError;

      if (emailResult?.stub) {
        setEmailStub(emailResult.message ?? "Email provider not configured — recap saved.");
      }

      return emailResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["recap_messages"] });
      qc.invalidateQueries({ queryKey: ["homework"] });
      qc.invalidateQueries({ queryKey: ["today-lessons"] });
      qc.invalidateQueries({ queryKey: ["dashboard-needs-recap"] });

      if (result?.stub) {
        toast({
          title: "Recap saved ✓",
          description: result.message,
        });
      } else {
        toast({
          title: "Recap sent! ✓",
          description: student.parent_email
            ? `Email sent to ${student.parent_email}`
            : "Recap saved (no parent email on file)",
        });
      }
      onClose();
    },
    onError: (e: any) => toast({ title: "Error sending recap", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border/60 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recap Preview</p>
            <h2 className="font-heading text-lg font-bold mt-0.5">Ready to Send</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Recap card */}
        <div className="px-5 py-5 space-y-4">
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading font-bold text-base">{student.name}</p>
                <p className="text-xs text-muted-foreground">{dateStr}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                attendance === "present" ? "bg-emerald-100 text-emerald-700"
                : attendance === "absent" ? "bg-red-100 text-red-600"
                : "bg-muted text-muted-foreground"
              }`}>
                {attendance === "present" ? "✓ Present" : attendance === "absent" ? "✗ No-Show" : "Cancelled"}
              </span>
            </div>

            {notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm leading-relaxed">{notes}</p>
              </div>
            )}

            {pieces.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pieces Covered</p>
                <div className="flex flex-wrap gap-1.5">
                  {pieces.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent/15 text-accent-foreground font-medium">
                      <Music size={10} /> {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {homeworkItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Homework</p>
                <div className="space-y-1.5">
                  {homeworkItems.map((hw, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <ListChecks size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                      {hw}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send to */}
          <div className="rounded-xl border border-border/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail size={13} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">Email</p>
                <p className="text-xs text-muted-foreground">{student.parent_email ?? "No parent email on file"}</p>
              </div>
              <CheckCircle2 size={16} className={student.parent_email ? "text-emerald-500" : "text-muted-foreground/40"} />
            </div>
            <div className="flex items-center gap-2.5 opacity-50">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <MessageCircle size={13} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Stub notice */}
          {emailStub && (
            <div className="rounded-xl border border-amber-300/60 bg-amber-50/40 p-3.5 flex gap-2.5">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{emailStub} Configure an email provider in Settings to send real emails.</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border/60 px-5 py-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold"
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
          >
            <Send size={15} className="mr-2" />
            {sendMutation.isPending ? "Sending..." : "Confirm & Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecapPreviewModal;
