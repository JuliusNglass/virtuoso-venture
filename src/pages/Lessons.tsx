import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";

interface LessonNote {
  id: number;
  student: string;
  date: string;
  notes: string;
  pieces: string[];
  homework: string;
  attendance: "present" | "absent" | "cancelled";
}

const lessonsData: LessonNote[] = [
  { id: 1, student: "Emma Thompson", date: "2026-02-23", notes: "Excellent progress on dynamics. Worked on phrasing in bars 24-32. Ready to move to section B.", pieces: ["Für Elise"], homework: "Practice bars 24-40 with metronome at 72 BPM", attendance: "present" },
  { id: 2, student: "Oliver Chen", date: "2026-02-23", notes: "Struggled with left hand coordination. Need to revisit fingering in opening passage.", pieces: ["Prelude in C Major"], homework: "Hands separate practice, 15 mins each hand daily", attendance: "present" },
  { id: 3, student: "Sophie Williams", date: "2026-02-22", notes: "Beautiful tone quality improving. Pedalling much cleaner. Started sight-reading Grade 7 pieces.", pieces: ["Clair de Lune", "Sight-reading exercises"], homework: "Record yourself playing mm.1-16 and send video", attendance: "present" },
  { id: 4, student: "James Patel", date: "2026-02-22", notes: "Absent — rescheduled to next Thursday.", pieces: [], homework: "Continue previous homework", attendance: "absent" },
  { id: 5, student: "Amelia Roberts", date: "2026-02-21", notes: "Great enthusiasm! Completed Twinkle Twinkle with both hands. Introduced reading middle C position.", pieces: ["Twinkle Twinkle"], homework: "New piece: Mary Had a Little Lamb", attendance: "present" },
  { id: 6, student: "Lucas Brown", date: "2026-02-21", notes: "Parent requested cancellation due to school event.", pieces: [], homework: "Work on Moonlight Sonata Mvt.1 bars 1-14", attendance: "cancelled" },
];

const attendanceIcon = {
  present: <CheckCircle size={16} className="text-green-600" />,
  absent: <XCircle size={16} className="text-destructive" />,
  cancelled: <Clock size={16} className="text-muted-foreground" />,
};

const Lessons = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Lesson Notes</h1>
          <p className="text-muted-foreground mt-1">Track progress and assignments for each student.</p>
        </div>
        <Button className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-medium">
          <Plus size={18} className="mr-2" /> New Lesson Note
        </Button>
      </div>

      <div className="space-y-4">
        {lessonsData.map((lesson) => (
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

              <div className="text-sm bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground font-medium">Homework: </span>
                {lesson.homework}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Lessons;
