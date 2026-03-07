import { useState } from "react";
import { GuidedTour } from "@/components/GuidedTour";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  CheckCircle2, Music, BookOpen, Users, Calendar, FileText, Bell,
  LayoutDashboard, ClipboardList, UserCircle, FolderOpen, ChevronRight,
  Clock, CheckCheck, TrendingUp, MessageSquare, Download, Search,
  PenLine, Paperclip, ChevronDown, BarChart2, Award, ArrowUp, Send
} from "lucide-react";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

type LeadForm = z.infer<typeof leadSchema>;

const features = [
  { icon: BookOpen, title: "Every lesson captured before it slips away", description: "Notes, homework, and pieces covered — all logged while the lesson is still fresh." },
  { icon: Users, title: "Parents stay informed without chasing you", description: "A parent portal keeps them updated on what was covered and what to practise, without extra back-and-forth." },
  { icon: FileText, title: "Sheet music and files, where you can actually find them", description: "Store scores and lesson resources in one place so nothing gets buried between sessions." },
  { icon: Calendar, title: "Student progress, visible at a glance", description: "Track repertoire, attendance, and development over time so each student's journey is easy to follow." },
  { icon: Bell, title: "New lesson requests, handled cleanly", description: "Give new students a smoother, more organised start without messy email chains." },
  { icon: Music, title: "Built by a musician who lived the problem", description: "Conservo was created by a classically trained musician and teacher who got tired of sticky notes, spreadsheets, and scattered studio admin." },
];

const painPoints = [
  "Chasing parent replies late in the evening",
  "Forgetting what you covered last week",
  "Losing track of repertoire across multiple students",
  "Spending evenings on admin instead of music",
  "Parents feeling out of the loop between lessons",
];

// ─── Mockup screens ───────────────────────────────────────────────────────────

function DashboardMockup() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const students = [
    { name: "Sophie T.", time: "3:00 PM", level: "Grade 5", piece: "Für Elise", attendance: 98, lessons: 24 },
    { name: "Liam K.", time: "4:30 PM", level: "Grade 2", piece: "Minuet in G", attendance: 91, lessons: 12 },
    { name: "Aria M.", time: "5:30 PM", level: "Grade 7", piece: "Moonlight Sonata", attendance: 100, lessons: 36 },
    { name: "Noah P.", time: "6:00 PM", level: "Grade 4", piece: "Sonatina Op.36", attendance: 85, lessons: 18 },
  ];
  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Students", value: "14", sub: "2 new this month", icon: Users, accent: "bg-primary/10 text-primary" },
          { label: "This Week", value: "9", sub: "lessons scheduled", icon: Calendar, accent: "bg-emerald-500/10 text-emerald-600" },
          { label: "Avg. Attendance", value: "94%", sub: "↑ 3% vs last month", icon: TrendingUp, accent: "bg-violet-500/10 text-violet-600" },
          { label: "Homework Set", value: "12", sub: "6 reviewed by parents", icon: CheckCheck, accent: "bg-amber-500/10 text-amber-600" },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="rounded-lg border bg-background p-2.5 shadow-sm">
            <div className={`mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md ${accent}`}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="text-base font-bold leading-none">{value}</div>
            <div className="text-[9px] font-medium text-muted-foreground mt-0.5">{label}</div>
            <div className="text-[8px] text-muted-foreground/70 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      {/* Today's lessons */}
      <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground">TODAY'S LESSONS — Wednesday 25 Feb</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">4 lessons</span>
        </div>
        {students.map((s) => (
          <div
            key={s.name}
            onClick={() => setSelectedStudent(selectedStudent === s.name ? null : s.name)}
            className={`cursor-pointer border-b px-3 py-2 last:border-0 transition-colors ${selectedStudent === s.name ? "bg-primary/5" : "hover:bg-muted/30"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {s.name[0]}
                </div>
                <div>
                  <p className="text-[11px] font-semibold">{s.name}</p>
                  <p className="text-[9px] text-muted-foreground">{s.level} · {s.piece}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-medium">{s.time}</p>
                  <p className="text-[9px] text-muted-foreground">{s.attendance}% attendance</p>
                </div>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${selectedStudent === s.name ? "rotate-180" : ""}`} />
              </div>
            </div>
            {selectedStudent === s.name && (
              <div className="mt-2 flex gap-2 border-t pt-2">
                <button className="flex-1 rounded bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground">Log Lesson</button>
                <button className="flex-1 rounded border px-2 py-1 text-[9px] font-medium">View History ({s.lessons})</button>
                <button className="flex-1 rounded border px-2 py-1 text-[9px] font-medium">Message Parent</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonLogMockup() {
  const [saved, setSaved] = useState(false);
  const [attendance, setAttendance] = useState<"present" | "absent" | "late">("present");
  const [note, setNote] = useState("Great progress on the left hand in bars 1–8. Work on dynamics in the middle section.");
  const [homework, setHomework] = useState("Practise bars 9–16 slowly at ♩= 60, 15 mins daily.");
  const pieces = ["Für Elise", "C Major Scale", "Sight Reading Ex. 4"];
  const history = [
    { date: "18 Feb", pieces: "Für Elise (intro)", note: "Introduced piece. Good hand position." },
    { date: "11 Feb", pieces: "Minuet in G", note: "Completed — moving on next week." },
  ];
  return (
    <div className="space-y-2">
      {/* Student header */}
      <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">S</div>
          <div>
            <p className="text-[11px] font-semibold">Sophie T. · Grade 5</p>
            <p className="text-[9px] text-muted-foreground">25 Feb 2026 · Lesson #25 · 60 min</p>
          </div>
        </div>
        <div className="flex gap-1">
          {(["present", "late", "absent"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAttendance(a)}
              className={`rounded px-2 py-0.5 text-[9px] font-medium capitalize transition-colors ${
                attendance === a
                  ? a === "present" ? "bg-emerald-500 text-white" : a === "late" ? "bg-amber-500 text-white" : "bg-destructive text-destructive-foreground"
                  : "border text-muted-foreground"
              }`}
            >{a}</button>
          ))}
        </div>
      </div>

      {/* Pieces */}
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="mb-1.5 text-[9px] font-semibold uppercase text-muted-foreground">Pieces Covered</p>
        <div className="flex flex-wrap gap-1">
          {pieces.map(p => (
            <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{p}</span>
          ))}
          <span className="cursor-pointer rounded-full border border-dashed px-2 py-0.5 text-[10px] text-muted-foreground">+ Add piece</span>
        </div>
      </div>

      {/* Notes + Homework */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-background p-2.5 shadow-sm">
          <div className="mb-1 flex items-center gap-1">
            <PenLine className="h-3 w-3 text-muted-foreground" />
            <p className="text-[9px] font-semibold uppercase text-muted-foreground">Lesson Notes</p>
          </div>
          <p className="text-[9px] leading-relaxed text-foreground">{note}</p>
        </div>
        <div className="rounded-lg border bg-background p-2.5 shadow-sm">
          <div className="mb-1 flex items-center gap-1">
            <Send className="h-3 w-3 text-muted-foreground" />
            <p className="text-[9px] font-semibold uppercase text-muted-foreground">Homework</p>
          </div>
          <p className="text-[9px] leading-relaxed text-foreground">{homework}</p>
        </div>
      </div>

      {/* History preview */}
      <div className="rounded-lg border bg-background p-2.5 shadow-sm">
        <p className="mb-1.5 text-[9px] font-semibold uppercase text-muted-foreground">Previous Lessons</p>
        {history.map(h => (
          <div key={h.date} className="flex items-start gap-2 border-b py-1.5 last:border-0">
            <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[8px] font-medium">{h.date}</span>
            <div>
              <p className="text-[9px] font-medium">{h.pieces}</p>
              <p className="text-[8px] text-muted-foreground">{h.note}</p>
            </div>
          </div>
        ))}
      </div>

      <Button size="sm" className="w-full text-xs" onClick={() => setSaved(true)}>
        {saved ? <><CheckCheck className="mr-1 h-3 w-3" /> Saved & Parent Notified!</> : "Save Lesson & Notify Parent"}
      </Button>
    </div>
  );
}

function ParentPortalMockup() {
  const [tab, setTab] = useState<"progress" | "homework" | "messages">("progress");
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">S</div>
          <div>
            <p className="text-xs font-semibold">Sophie Turner</p>
            <p className="text-[9px] text-muted-foreground">Grade 5 · Active student · Since Jan 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span className="text-[9px] font-medium text-emerald-600">Up to date</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Lessons", value: "25", icon: Calendar },
          { label: "Pieces Learned", value: "18", icon: Music },
          { label: "Attendance", value: "98%", icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-background p-2 text-center shadow-sm">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1">
        {(["progress", "homework", "messages"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1 text-[10px] font-medium capitalize transition-colors ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "progress" && (
        <div className="rounded-lg border bg-background p-3 shadow-sm space-y-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">Latest Lesson — 25 Feb 2026</p>
          <div className="rounded bg-muted/50 p-2 text-[10px] space-y-1">
            <p><span className="font-semibold">Covered:</span> Für Elise (bars 1–16), C Major Scale</p>
            <p><span className="font-semibold">Teacher's note:</span> Great left hand progress. Focus on dynamics.</p>
            <p><span className="font-semibold">Next lesson:</span> Wed 4 Mar, 3:00 PM</p>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-emerald-600">
            <Bell className="h-3 w-3" /> You were notified 2 hours ago
          </div>
        </div>
      )}

      {tab === "homework" && (
        <div className="rounded-lg border bg-background p-3 shadow-sm space-y-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">This Week's Homework</p>
          {[
            { task: "Für Elise — bars 9–16 at ♩= 60", done: true },
            { task: "C Major scale, hands together", done: true },
            { task: "Sight reading exercise 5", done: false },
          ].map(({ task, done }) => (
            <div key={task} className="flex items-center gap-2">
              <div className={`h-3.5 w-3.5 shrink-0 rounded border-2 flex items-center justify-center ${done ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {done && <CheckCheck className="h-2 w-2 text-primary-foreground" />}
              </div>
              <p className={`text-[10px] ${done ? "line-through text-muted-foreground" : ""}`}>{task}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <div className="rounded-lg border bg-background p-3 shadow-sm space-y-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">Messages</p>
          {[
            { from: "Julius (Teacher)", msg: "Sophie did really well today! Keep up the daily practice.", time: "2h ago", isTeacher: true },
            { from: "You", msg: "Thank you! She's been practising every day 😊", time: "1h ago", isTeacher: false },
          ].map((m, i) => (
            <div key={i} className={`flex flex-col rounded-lg p-2 text-[10px] ${m.isTeacher ? "bg-muted/50" : "bg-primary/5 items-end"}`}>
              <span className="text-[8px] font-semibold text-muted-foreground mb-0.5">{m.from} · {m.time}</span>
              <p>{m.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesMockup() {
  const [opened, setOpened] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const files = [
    { name: "Für Elise – Beethoven.pdf", size: "1.2 MB", type: "Score", student: "Sophie T.", pages: 4 },
    { name: "Grade 5 Scales Reference.pdf", size: "340 KB", type: "Reference", student: "All students", pages: 2 },
    { name: "Moonlight Sonata – Beethoven.pdf", size: "3.1 MB", type: "Score", student: "Aria M.", pages: 8 },
    { name: "Sight Reading Pack A.pdf", size: "2.1 MB", type: "Exercise", student: "Sophie T.", pages: 12 },
    { name: "Minuet in G – Bach.pdf", size: "890 KB", type: "Score", student: "Liam K.", pages: 3 },
  ];
  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.student.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-2">
      {/* Search + upload */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-lg border bg-background py-1.5 pl-6 pr-2 text-[11px] outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search files or students…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[10px] font-medium text-primary-foreground">
          <Paperclip className="h-3 w-3" /> Upload
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 rounded-lg border bg-background px-3 py-2 text-center">
        {[["5", "Files stored"], ["3", "Students"], ["2", "Scores"]].map(([v, l]) => (
          <div key={l} className="flex-1">
            <p className="text-xs font-bold">{v}</p>
            <p className="text-[8px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      {/* File list */}
      <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
        {filtered.map((f) => (
          <div
            key={f.name}
            className={`flex cursor-pointer items-center justify-between border-b px-3 py-2 last:border-0 transition-colors ${opened === f.name ? "bg-primary/5" : "hover:bg-muted/30"}`}
            onClick={() => setOpened(opened === f.name ? null : f.name)}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight">{f.name}</p>
                <p className="text-[9px] text-muted-foreground">{f.student} · {f.type} · {f.pages} pages</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground">{f.size}</span>
              <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${opened === f.name ? "rotate-90" : ""}`} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[10px] text-muted-foreground">No files match your search.</p>
        )}
      </div>

      {opened && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-primary">📄 {opened}</p>
          <div className="flex gap-2">
            <button className="flex-1 rounded bg-primary px-2 py-1.5 text-[9px] font-medium text-primary-foreground">Open in Viewer</button>
            <button className="flex items-center gap-1 rounded border px-2 py-1.5 text-[9px] font-medium">
              <Download className="h-3 w-3" /> Download
            </button>
            <button className="flex items-center gap-1 rounded border px-2 py-1.5 text-[9px] font-medium">
              <Send className="h-3 w-3" /> Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RepertoireMockup() {
  const [selected, setSelected] = useState<string | null>(null);
  const pieces = [
    { title: "Für Elise", composer: "Beethoven", student: "Sophie T.", level: "Grade 5", status: "In Progress", started: "Jan 2026" },
    { title: "Moonlight Sonata", composer: "Beethoven", student: "Aria M.", level: "Grade 7", status: "In Progress", started: "Dec 2025" },
    { title: "Minuet in G", composer: "Bach", student: "Liam K.", level: "Grade 2", status: "Completed", started: "Nov 2025" },
    { title: "Sonatina Op.36", composer: "Clementi", student: "Noah P.", level: "Grade 4", status: "In Progress", started: "Feb 2026" },
    { title: "Turkish March", composer: "Mozart", student: "Aria M.", level: "Grade 7", status: "Completed", started: "Oct 2025" },
  ];
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active Pieces", value: "8", icon: Music },
          { label: "Completed", value: "23", icon: Award },
          { label: "Students", value: "14", icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-background p-2 text-center shadow-sm">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
            <p className="text-sm font-bold">{value}</p>
            <p className="text-[9px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-background shadow-sm overflow-hidden">
        <div className="border-b bg-muted/40 px-3 py-2">
          <p className="text-[10px] font-semibold text-muted-foreground">CURRENT REPERTOIRE</p>
        </div>
        {pieces.map((p) => (
          <div
            key={`${p.title}-${p.student}`}
            className={`cursor-pointer border-b px-3 py-2 last:border-0 transition-colors ${selected === `${p.title}-${p.student}` ? "bg-primary/5" : "hover:bg-muted/30"}`}
            onClick={() => setSelected(selected === `${p.title}-${p.student}` ? null : `${p.title}-${p.student}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold">{p.title} <span className="font-normal text-muted-foreground">— {p.composer}</span></p>
                <p className="text-[9px] text-muted-foreground">{p.student} · {p.level}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium ${p.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>
                {p.status}
              </span>
            </div>
            {selected === `${p.title}-${p.student}` && (
              <div className="mt-1.5 flex gap-2 border-t pt-1.5">
                <span className="text-[9px] text-muted-foreground">Started: {p.started}</span>
                <button className="ml-auto rounded bg-primary px-2 py-0.5 text-[9px] text-primary-foreground">View Full History</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, Component: DashboardMockup },
  { id: "lessons", label: "Lesson Log", icon: ClipboardList, Component: LessonLogMockup },
  { id: "parents", label: "Parent Portal", icon: UserCircle, Component: ParentPortalMockup },
  { id: "files", label: "Files & Scores", icon: FolderOpen, Component: FilesMockup },
  { id: "repertoire", label: "Repertoire", icon: Music, Component: RepertoireMockup },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [founderSubmitted, setFounderSubmitted] = useState(false);
  const [founderLoading, setFounderLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "" },
  });

  const founderForm = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = async (values: LeadForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: values.name,
        email: values.email,
        source: "sales_page",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      form.setError("email", { message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const onFounderSubmit = async (values: LeadForm) => {
    setFounderLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: values.name,
        email: values.email,
        source: "founder",
      });
      if (error) throw error;
      setFounderSubmitted(true);
    } catch {
      founderForm.setError("email", { message: "Something went wrong. Please try again." });
    } finally {
      setFounderLoading(false);
    }
  };

  const activeScreen = MOCKUP_TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/conservo-logo.png" alt="Conservo" className="w-20 h-20 rounded-2xl shadow-xl object-cover" />
          </div>
          <div className="mb-2 font-heading text-3xl font-bold tracking-tight text-gradient-gold">Conservo</div>
          <div className="mb-6 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            For independent music teachers
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Stop drowning in admin.<br />
            <span className="text-primary">Start teaching more.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            Conservo is the all-in-one studio management tool built by a classically trained musician who got tired of the chaos — works for piano, guitar, violin, voice, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-8 py-6 text-base font-semibold shadow-lg" onClick={() => window.location.href = "/auth"}>
              Start Your Free Studio →
            </Button>
            <a href="#waitlist">
              <Button size="lg" variant="outline" className="px-8 py-6 text-base">
                Join Waitlist
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Guided Tour with voiceover — moved high for visibility */}
      <GuidedTour />

      {/* Pain points */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold">Sound familiar?</h2>
          <p className="mb-8 text-muted-foreground">
            If you're running a private studio, you know the feeling. The teaching is the easy part.
          </p>
          <ul className="space-y-3 text-left">
            {painPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-lg border bg-background px-5 py-4 shadow-sm">
                <span className="mt-0.5 text-destructive font-bold">✕</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg font-medium">
            You became a teacher because you love music — not because you love spreadsheets.
          </p>
        </div>
      </section>

      {/* Interactive mockup */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold">See it in action</h2>
            <p className="text-muted-foreground">Click through the features below to explore what Conservo looks like.</p>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Tab buttons */}
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:w-48 lg:shrink-0">
              {MOCKUP_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all text-left
                    ${activeTab === id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mockup window */}
            <div className="flex-1 rounded-2xl border bg-muted/30 shadow-lg overflow-hidden">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 border-b bg-muted px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 flex-1 rounded bg-background px-3 py-1 text-[10px] text-muted-foreground">
                  studiodesk.app / {activeTab}
                </span>
              </div>
              {/* Screen content */}
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                {activeScreen && (() => { const Icon = activeScreen.icon; return <Icon className="h-4 w-4 text-primary" />; })()}
                <p className="text-sm font-semibold">{activeScreen?.label}</p>
                </div>
                {activeScreen && <activeScreen.Component />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">Everything your studio needs, in one place</h2>
            <p className="text-muted-foreground">Conservo handles the admin so you can focus on the lesson.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold">How it works</h2>
          <p className="mb-12 text-muted-foreground">Three steps. That's really it.</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", icon: PenLine, title: "Teacher logs the lesson", desc: "Notes, homework, pieces, and attendance in under a minute — right after the session." },
              { step: "2", icon: Bell, title: "Parent gets notified", desc: "An instant recap lands in their inbox. They see exactly what was covered and what to practise." },
              { step: "3", icon: ArrowUp, title: "Student sees progress", desc: "Every lesson builds a history. Students and parents watch the journey unfold over time." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step}
                  </div>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-left">{title}</h3>
                <p className="text-sm text-muted-foreground text-left">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder's Rate */}
      <section id="founder" className="px-6 py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border-2 border-primary/30 bg-card shadow-xl overflow-hidden">
            {/* Badge header */}
            <div className="bg-primary px-8 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80 mb-1">Limited spots available</p>
              <h2 className="text-2xl font-bold text-primary-foreground">🔒 Become a Founding Member</h2>
            </div>
            <div className="px-8 py-8">
              <p className="text-center text-muted-foreground mb-8">
                I'm sharing Conservo with a small group of trusted teachers for honest feedback. If you join now and love it, you'll be locked in at a <span className="font-semibold text-foreground">Founder's Rate — discounted for life</span> — before we open to the public.
              </p>

              {/* 3-step deal */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: "🎯", label: "Try it free", desc: "No credit card. Get full access and explore everything." },
                  { icon: "💬", label: "Share feedback", desc: "Tell me what works, what doesn't, what you'd love to see." },
                  { icon: "🔒", label: "Lock in your rate", desc: "A founder's discount — yours for life, before public pricing kicks in." },
                ].map(({ icon, label, desc }) => (
                  <div key={label} className="rounded-xl border bg-muted/30 p-4 text-center">
                    <div className="text-2xl mb-2">{icon}</div>
                    <p className="text-sm font-semibold mb-1">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              {founderSubmitted ? (
                <div className="rounded-xl border bg-primary/5 p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <h3 className="mb-1 text-lg font-bold">Welcome aboard, Founding Member! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    You're in. I'll be in touch soon with your early access details and Founder's Rate information.
                  </p>
                </div>
              ) : (
                <Form {...founderForm}>
                  <form onSubmit={founderForm.handleSubmit(onFounderSubmit)} className="space-y-4">
                    <FormField
                      control={founderForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={founderForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full py-5 text-base font-semibold shadow-md" disabled={founderLoading}>
                      {founderLoading ? "Submitting…" : "Claim My Founder's Rate →"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      No credit card. No commitment. Your rate is locked in when you start.
                    </p>
                  </form>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="bg-primary/5 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 text-4xl">🎹</div>
          <blockquote className="text-lg font-medium leading-relaxed">
            "I built this because I was spending my evenings on admin instead of music. After years of teaching, I finally created the tool I always needed — and now I want to make it available to every teacher who feels the same way."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Julius Nglass, classically trained musician & music teacher</p>
        </div>
      </section>

      {/* Lead capture */}
      <section id="waitlist" className="px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          {submitted ? (
            <div className="rounded-2xl border bg-card p-10 shadow-md">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-2xl font-bold">You're on the list!</h2>
              <p className="text-muted-foreground">
                Thank you — we'll be in touch soon with early access details. Keep an eye on your inbox.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-8 shadow-md sm:p-10">
              <h2 className="mb-2 text-2xl font-bold">Get early access</h2>
              <p className="mb-8 text-muted-foreground">
                Join the waitlist and be first to know when Conservo opens its doors. No spam, ever.
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="email" placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full py-5 text-base font-semibold" disabled={loading}>
                    {loading ? "Submitting…" : "Yes, I want early access →"}
                  </Button>
                </form>
              </Form>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card. No commitment. Just early access.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>Conservo · Built by a musician, for musicians · Julius Nglass</p>
      </footer>
    </div>
  );
}
