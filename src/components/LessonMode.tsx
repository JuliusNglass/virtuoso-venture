import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, XCircle, Clock, Mic, Plus, X, Send, Save,
  ChevronLeft, ChevronRight, BookOpen, ListChecks, Paperclip, Eye
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/hooks/useStudio";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import RecapPreviewModal from "./RecapPreviewModal";

interface Props {
  open: boolean;
  onClose: () => void;
  student: { id: string; name: string; level: string; parent_email?: string | null };
  existingLesson?: any;
}

const HOMEWORK_TEMPLATES = [
  "Practice the assigned piece hands separately, then hands together (20 min/day)",
  "Focus on bars 1–16 slowly with a metronome at 60 BPM",
  "Work on scales: C major, G major, D major (2 octaves each)",
  "Review note reading in treble clef flashcards",
  "Sight-read a new piece from lesson book pages",
];

const LessonMode = ({ open, onClose, student, existingLesson }: Props) => {
  const { studio } = useStudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [attendance, setAttendance] = useState<"present" | "absent" | "cancelled">(
    existingLesson?.attendance ?? "present"
  );
  const [notes, setNotes] = useState(existingLesson?.notes ?? "");
  const [pieces, setPieces] = useState<string[]>(existingLesson?.pieces ?? []);
  const [newPiece, setNewPiece] = useState("");
  const [homeworkItems, setHomeworkItems] = useState<string[]>(
    existingLesson?.homework ? existingLesson.homework.split("\n").filter(Boolean) : []
  );
  const [newHw, setNewHw] = useState("");
  const [showRecap, setShowRecap] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(existingLesson?.id ?? null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        student_id: student.id,
        date: format(new Date(), "yyyy-MM-dd"),
        attendance,
        notes: notes || null,
        pieces: pieces.length > 0 ? pieces : [],
        homework: homeworkItems.length > 0 ? homeworkItems.join("\n") : null,
      };
      if (existingLesson?.id) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", existingLesson.id);
        if (error) throw error;
        setSavedLessonId(existingLesson.id);
        return existingLesson.id;
      } else {
        const { data, error } = await supabase.from("lessons").insert(payload).select("id").single();
        if (error) throw error;
        setSavedLessonId(data.id);
        return data.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["dashboard-recent-lessons"] });
      toast({ title: "Lesson saved ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDictate = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast({ title: "Dictation not supported in this browser" }); return; }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((res: any) => res[0].transcript).join(" ");
      setNotes(prev => prev ? prev + " " + transcript : transcript);
    };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  const addPiece = () => {
    if (newPiece.trim()) { setPieces(prev => [...prev, newPiece.trim()]); setNewPiece(""); }
  };
  const addHw = (text?: string) => {
    const t = text ?? newHw.trim();
    if (t) { setHomeworkItems(prev => [...prev, t]); setNewHw(""); }
  };

  const attendanceBtns = [
    { value: "present", label: "Present", icon: CheckCircle2, color: "bg-emerald-500 text-white shadow-sm" },
    { value: "absent", label: "No-Show", icon: XCircle, color: "bg-destructive text-destructive-foreground shadow-sm" },
    { value: "cancelled", label: "Cancelled", icon: Clock, color: "bg-muted-foreground text-white shadow-sm" },
  ] as const;

  return (
    <>
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border/60 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Lesson Mode</p>
              <h2 className="font-heading text-xl font-bold mt-0.5">{student.name}</h2>
              <p className="text-xs text-muted-foreground">{student.level} · {format(new Date(), "EEEE, d MMMM yyyy")}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-5 space-y-6">
            {/* Section 1: Attendance */}
            <section>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                1 · Attendance
              </Label>
              <div className="flex gap-2">
                {attendanceBtns.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setAttendance(value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      attendance === value
                        ? `${color} border-transparent`
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Section 2: Notes */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2 · Lesson Notes
                </Label>
                <button
                  onClick={handleDictate}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isListening
                      ? "bg-destructive/15 text-destructive animate-pulse"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Mic size={12} />
                  {isListening ? "Stop" : "Dictate"}
                </button>
              </div>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What did you cover? Technique tips, observations, breakthroughs..."
                rows={4}
                className="text-sm resize-none"
                maxLength={2000}
              />
            </section>

            {/* Section 3: Repertoire */}
            <section>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                3 · Repertoire Covered
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newPiece}
                  onChange={e => setNewPiece(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addPiece())}
                  placeholder="e.g. Für Elise – Beethoven"
                  className="text-sm h-9"
                  maxLength={150}
                />
                <Button size="sm" variant="outline" onClick={addPiece} className="h-9 px-3 shrink-0">
                  <Plus size={14} />
                </Button>
              </div>
              {pieces.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieces.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-accent/15 text-accent-foreground font-medium">
                      🎵 {p}
                      <button onClick={() => setPieces(prev => prev.filter((_, j) => j !== i))} className="hover:text-destructive transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Section 4: Homework */}
            <section>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                4 · Homework
              </Label>
              {/* Quick templates */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {HOMEWORK_TEMPLATES.slice(0, 3).map((t, i) => (
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
                  placeholder="Add a homework item..."
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

          {/* Sticky bottom actions */}
          <div className="sticky bottom-0 bg-card border-t border-border/60 px-5 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save size={15} className="mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              className="flex-1 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold"
              onClick={async () => {
                await saveMutation.mutateAsync();
                setShowRecap(true);
              }}
              disabled={saveMutation.isPending}
            >
              <Send size={15} className="mr-2" />
              Send Recap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showRecap && savedLessonId && (
        <RecapPreviewModal
          open={showRecap}
          onClose={() => { setShowRecap(false); onClose(); }}
          student={student}
          lessonId={savedLessonId}
          notes={notes}
          pieces={pieces}
          homeworkItems={homeworkItems}
          attendance={attendance}
          studioId={studio?.id}
          userId={user?.id}
        />
      )}
    </>
  );
};

export default LessonMode;
