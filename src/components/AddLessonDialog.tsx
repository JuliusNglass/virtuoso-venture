import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonNote {
  id: number;
  student: string;
  date: string;
  notes: string;
  pieces: string[];
  homework: string;
  attendance: "present" | "absent" | "cancelled";
}

interface AddLessonDialogProps {
  onAdd: (lesson: LessonNote) => void;
  nextId: number;
  students: string[];
}

const AddLessonDialog = ({ onAdd, nextId, students }: AddLessonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [student, setStudent] = useState(students[0] || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [pieces, setPieces] = useState("");
  const [homework, setHomework] = useState("");
  const [attendance, setAttendance] = useState<"present" | "absent" | "cancelled">("present");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !date) return;

    onAdd({
      id: nextId,
      student,
      date,
      notes: notes.trim(),
      pieces: pieces ? pieces.split(",").map(p => p.trim()).filter(Boolean) : [],
      homework: homework.trim(),
      attendance,
    });

    toast({ title: "Lesson note added", description: `Lesson for ${student} recorded.` });
    setOpen(false);
    setNotes(""); setPieces(""); setHomework(""); setAttendance("present");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-medium">
          <Plus size={18} className="mr-2" /> New Lesson Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">New Lesson Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={student} onValueChange={setStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Attendance</Label>
            <Select value={attendance} onValueChange={(v) => setAttendance(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lesson Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} placeholder="What was covered..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Pieces Worked On</Label>
            <Input value={pieces} onChange={e => setPieces(e.target.value)} maxLength={500} placeholder="Für Elise, Clair de Lune (comma-separated)" />
          </div>
          <div className="space-y-2">
            <Label>Homework</Label>
            <Textarea value={homework} onChange={e => setHomework(e.target.value)} maxLength={500} placeholder="Practice assignments..." rows={2} />
          </div>
          <Button type="submit" className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
            Save Lesson Note
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonDialog;
