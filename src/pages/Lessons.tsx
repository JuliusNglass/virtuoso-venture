import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddLessonDialog from "@/components/AddLessonDialog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LessonNote {
  id: number;
  student: string;
  date: string;
  notes: string;
  pieces: string[];
  homework: string;
  attendance: "present" | "absent" | "cancelled";
}

const initialLessons: LessonNote[] = [
  { id: 1, student: "Emma Thompson", date: "2026-02-23", notes: "Excellent progress on dynamics. Worked on phrasing in bars 24-32. Ready to move to section B.", pieces: ["Für Elise"], homework: "Practice bars 24-40 with metronome at 72 BPM", attendance: "present" },
  { id: 2, student: "Oliver Chen", date: "2026-02-23", notes: "Struggled with left hand coordination. Need to revisit fingering in opening passage.", pieces: ["Prelude in C Major"], homework: "Hands separate practice, 15 mins each hand daily", attendance: "present" },
  { id: 3, student: "Sophie Williams", date: "2026-02-22", notes: "Beautiful tone quality improving. Pedalling much cleaner. Started sight-reading Grade 7 pieces.", pieces: ["Clair de Lune", "Sight-reading exercises"], homework: "Record yourself playing mm.1-16 and send video", attendance: "present" },
  { id: 4, student: "James Patel", date: "2026-02-22", notes: "Absent — rescheduled to next Thursday.", pieces: [], homework: "Continue previous homework", attendance: "absent" },
  { id: 5, student: "Amelia Roberts", date: "2026-02-21", notes: "Great enthusiasm! Completed Twinkle Twinkle with both hands. Introduced reading middle C position.", pieces: ["Twinkle Twinkle"], homework: "New piece: Mary Had a Little Lamb", attendance: "present" },
  { id: 6, student: "Lucas Brown", date: "2026-02-21", notes: "Parent requested cancellation due to school event.", pieces: [], homework: "Work on Moonlight Sonata Mvt.1 bars 1-14", attendance: "cancelled" },
];

const studentNames = ["Emma Thompson", "Oliver Chen", "Sophie Williams", "James Patel", "Amelia Roberts", "Lucas Brown"];

const attendanceIcon = {
  present: <CheckCircle size={16} className="text-green-600" />,
  absent: <XCircle size={16} className="text-destructive" />,
  cancelled: <Clock size={16} className="text-muted-foreground" />,
};

const Lessons = () => {
  const [lessons, setLessons] = useState<LessonNote[]>(initialLessons);
  const [editLesson, setEditLesson] = useState<LessonNote | null>(null);
  const { toast } = useToast();

  const handleAdd = (lesson: LessonNote) => {
    setLessons(prev => [lesson, ...prev]);
  };

  const handleDelete = (id: number) => {
    const lesson = lessons.find(l => l.id === id);
    setLessons(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lesson removed", description: `Lesson for ${lesson?.student} removed.` });
  };

  const handleEditSave = () => {
    if (!editLesson) return;
    setLessons(prev => prev.map(l => l.id === editLesson.id ? editLesson : l));
    toast({ title: "Lesson updated", description: "Lesson note has been updated." });
    setEditLesson(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Lesson Notes</h1>
          <p className="text-muted-foreground mt-1">Track progress and assignments for each student.</p>
        </div>
        <AddLessonDialog onAdd={handleAdd} nextId={Math.max(...lessons.map(l => l.id)) + 1} students={studentNames} />
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-xs">
                    {lesson.student.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{lesson.student}</p>
                    <p className="text-xs text-muted-foreground">{new Date(lesson.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {attendanceIcon[lesson.attendance]}
                  <span className="capitalize text-muted-foreground">{lesson.attendance}</span>
                </div>
              </div>

              <p className="text-sm mb-3">{lesson.notes}</p>

              {lesson.pieces.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {lesson.pieces.map((piece) => (
                    <span key={piece} className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium">
                      🎵 {piece}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm bg-muted/50 rounded-lg p-3 mb-3">
                <span className="text-muted-foreground font-medium">Homework: </span>
                {lesson.homework}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" onClick={() => setEditLesson(lesson)}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(lesson.id)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editLesson} onOpenChange={() => setEditLesson(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Lesson Note</DialogTitle>
          </DialogHeader>
          {editLesson && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Attendance</Label>
                <Select value={editLesson.attendance} onValueChange={v => setEditLesson({ ...editLesson, attendance: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editLesson.notes} onChange={e => setEditLesson({ ...editLesson, notes: e.target.value })} maxLength={1000} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Pieces (comma-separated)</Label>
                <Input value={editLesson.pieces.join(", ")} onChange={e => setEditLesson({ ...editLesson, pieces: e.target.value.split(",").map(p => p.trim()).filter(Boolean) })} maxLength={500} />
              </div>
              <div className="space-y-2">
                <Label>Homework</Label>
                <Textarea value={editLesson.homework} onChange={e => setEditLesson({ ...editLesson, homework: e.target.value })} maxLength={500} rows={2} />
              </div>
              <Button onClick={handleEditSave} className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lessons;
