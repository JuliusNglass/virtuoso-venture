import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  age: number;
  level: string;
  currentPiece: string;
  lessonDay: string;
  lessonTime: string;
  parentName: string;
  parentEmail: string;
  status: "active" | "waiting" | "paused";
}

interface AddStudentDialogProps {
  onAdd: (student: Student) => void;
  nextId: number;
}

const levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Waiting List"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AddStudentDialog = ({ onAdd, nextId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [level, setLevel] = useState("Grade 1");
  const [currentPiece, setCurrentPiece] = useState("");
  const [lessonDay, setLessonDay] = useState("Monday");
  const [lessonTime, setLessonTime] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age) return;

    const isWaiting = level === "Waiting List";
    onAdd({
      id: nextId,
      name: name.trim(),
      age: parseInt(age),
      level,
      currentPiece: isWaiting ? "—" : currentPiece || "—",
      lessonDay: isWaiting ? "—" : lessonDay,
      lessonTime: isWaiting ? "—" : lessonTime || "—",
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim(),
      status: isWaiting ? "waiting" : "active",
    });

    toast({ title: "Student added", description: `${name} has been added successfully.` });
    setOpen(false);
    setName(""); setAge(""); setLevel("Grade 1"); setCurrentPiece(""); setLessonDay("Monday"); setLessonTime(""); setParentName(""); setParentEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-medium">
          <Plus size={18} className="mr-2" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input type="number" value={age} onChange={e => setAge(e.target.value)} required min={3} max={99} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {level !== "Waiting List" && (
            <>
              <div className="space-y-2">
                <Label>Current Piece</Label>
                <Input value={currentPiece} onChange={e => setCurrentPiece(e.target.value)} maxLength={200} placeholder="e.g. Für Elise" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lesson Day</Label>
                  <Select value={lessonDay} onValueChange={setLessonDay}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lesson Time</Label>
                  <Input value={lessonTime} onChange={e => setLessonTime(e.target.value)} maxLength={20} placeholder="e.g. 10:00 AM" />
                </div>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parent Name</Label>
              <Input value={parentName} onChange={e => setParentName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Parent Email</Label>
              <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} maxLength={255} />
            </div>
          </div>
          <Button type="submit" className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
            Add Student
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
