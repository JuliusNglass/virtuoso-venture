import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

const studentsData: Student[] = [
  { id: 1, name: "Emma Thompson", age: 12, level: "Grade 5", currentPiece: "Für Elise", lessonDay: "Monday", lessonTime: "10:00 AM", parentName: "Sarah Thompson", parentEmail: "sarah@email.com", status: "active" },
  { id: 2, name: "Oliver Chen", age: 9, level: "Grade 3", currentPiece: "Prelude in C Major", lessonDay: "Monday", lessonTime: "11:00 AM", parentName: "Li Chen", parentEmail: "li@email.com", status: "active" },
  { id: 3, name: "Sophie Williams", age: 15, level: "Grade 7", currentPiece: "Clair de Lune", lessonDay: "Tuesday", lessonTime: "2:00 PM", parentName: "Mark Williams", parentEmail: "mark@email.com", status: "active" },
  { id: 4, name: "James Patel", age: 10, level: "Grade 4", currentPiece: "Nocturne Op.9 No.2", lessonDay: "Tuesday", lessonTime: "3:30 PM", parentName: "Priya Patel", parentEmail: "priya@email.com", status: "active" },
  { id: 5, name: "Amelia Roberts", age: 7, level: "Grade 1", currentPiece: "Twinkle Twinkle", lessonDay: "Wednesday", lessonTime: "4:00 PM", parentName: "David Roberts", parentEmail: "david@email.com", status: "active" },
  { id: 6, name: "Lucas Brown", age: 14, level: "Grade 6", currentPiece: "Moonlight Sonata Mvt.1", lessonDay: "Thursday", lessonTime: "5:00 PM", parentName: "Karen Brown", parentEmail: "karen@email.com", status: "active" },
  { id: 7, name: "Isla Martinez", age: 8, level: "Waiting List", currentPiece: "—", lessonDay: "—", lessonTime: "—", parentName: "Carlos Martinez", parentEmail: "carlos@email.com", status: "waiting" },
];

const levelColors: Record<string, string> = {
  "Grade 1": "bg-green-100 text-green-700",
  "Grade 2": "bg-green-100 text-green-700",
  "Grade 3": "bg-blue-100 text-blue-700",
  "Grade 4": "bg-blue-100 text-blue-700",
  "Grade 5": "bg-purple-100 text-purple-700",
  "Grade 6": "bg-purple-100 text-purple-700",
  "Grade 7": "bg-amber-100 text-amber-700",
  "Grade 8": "bg-amber-100 text-amber-700",
  "Waiting List": "bg-muted text-muted-foreground",
};

const Students = () => {
  const [search, setSearch] = useState("");
  const filtered = studentsData.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.level.toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(s => s.status === "active");
  const waiting = filtered.filter(s => s.status === "waiting");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">{studentsData.filter(s => s.status === 'active').length} active · {studentsData.filter(s => s.status === 'waiting').length} on waiting list</p>
        </div>
        <Button className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-medium">
          <Plus size={18} className="mr-2" /> Add Student
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students or levels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Active Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {active.map((student) => (
          <Card key={student.id} className="border-border/50 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-gold transition-colors">{student.name}</p>
                    <p className="text-xs text-muted-foreground">Age {student.age}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelColors[student.level] || 'bg-muted text-muted-foreground'}`}>
                  {student.level}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current piece</span>
                  <span className="font-medium">{student.currentPiece}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lesson</span>
                  <span>{student.lessonDay} · {student.lessonTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent</span>
                  <span>{student.parentName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Waiting List */}
      {waiting.length > 0 && (
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">Waiting List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {waiting.map((student) => (
              <Card key={student.id} className="border-dashed border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">Age {student.age} · Parent: {student.parentName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
