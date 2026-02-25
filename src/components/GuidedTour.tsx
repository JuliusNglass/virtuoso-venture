import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Users, BookOpen, CalendarCheck, Music, FolderOpen, UserCircle,
  CheckCircle2, Clock, TrendingUp, CheckCheck, Bell, Award,
  PenLine, Send, ChevronRight, BarChart2, Loader2, Video, Download,
  ScreenShare, Clapperboard, StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

// ─── Slide data ─────────────────────────────────────────────────────────────

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  voiceover: string;
  accent: string;
  visual: React.FC;
}

function ProblemVisual() {
  return (
    <div className="space-y-2.5">
      {[
        { icon: "📝", text: "Lesson notes on sticky notes… somewhere", bad: true },
        { icon: "📊", text: "Student progress in 3 different spreadsheets", bad: true },
        { icon: "📱", text: "Parent updates via WhatsApp at 10pm", bad: true },
        { icon: "📁", text: "Sheet music scattered across Downloads folder", bad: true },
        { icon: "😩", text: "Sunday evenings lost to admin instead of music", bad: true },
      ].map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm animate-fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span className="text-base">{item.icon}</span>
          <span className="text-foreground/80">{item.text}</span>
          <span className="ml-auto text-destructive font-bold text-xs">✕</span>
        </div>
      ))}
    </div>
  );
}

function MeetStudioFlowVisual() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
        <div className="flex justify-center mb-2">
          <img src="/conservo-logo.png" alt="Conservo" className="w-12 h-12 rounded-xl object-cover" />
        </div>
        <p className="text-xl font-bold text-primary">Conservo</p>
        <p className="text-sm text-muted-foreground mt-1">The all-in-one studio management platform</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Users, label: "Students" },
          { icon: BookOpen, label: "Lessons" },
          { icon: CalendarCheck, label: "Calendar" },
          { icon: Music, label: "Repertoire" },
          { icon: FolderOpen, label: "Files" },
          { icon: UserCircle, label: "Parents" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border bg-background p-3 shadow-sm">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-sm font-semibold text-primary">
        <CheckCircle2 className="h-4 w-4" />
        Everything in one place. No more chaos.
      </div>
    </div>
  );
}

function StudentProfilesVisual() {
  const [selected, setSelected] = useState(0);
  const students = [
    { name: "Sophie Turner", level: "Grade 5", piece: "Für Elise", attendance: "98%", lessons: 25 },
    { name: "Liam Khan", level: "Grade 2", piece: "Minuet in G", attendance: "91%", lessons: 12 },
    { name: "Aria Müller", level: "Grade 7", piece: "Moonlight Sonata", attendance: "100%", lessons: 36 },
  ];
  const s = students[selected];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {students.map((st, i) => (
          <button
            key={st.name}
            onClick={() => setSelected(i)}
            className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all border ${selected === i ? "bg-primary text-primary-foreground border-primary shadow" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {st.name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border bg-background p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {s.name[0]}
          </div>
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.level}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Lessons", value: String(s.lessons) },
            { label: "Attendance", value: s.attendance },
            { label: "Current Piece", value: s.piece.split(" ")[0] },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-muted/50 px-2 py-2">
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span>Parent notified after every lesson</span>
        </div>
      </div>
    </div>
  );
}

function LessonNotesVisual() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">S</div>
        <div>
          <p className="text-sm font-semibold">Sophie T. · Lesson #25</p>
          <p className="text-xs text-muted-foreground">25 Feb 2026 · Grade 5 · 60 min</p>
        </div>
        <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Present</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-background p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <PenLine className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Notes</p>
          </div>
          <p className="text-[11px] leading-relaxed">Great left hand in bars 1–8. Focus on dynamics in middle section.</p>
        </div>
        <div className="rounded-xl border bg-background p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Send className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Homework</p>
          </div>
          <p className="text-[11px] leading-relaxed">Practise bars 9–16 slowly at ♩= 60, 15 mins daily.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["Für Elise", "C Major Scale", "Sight Reading Ex. 4"].map(p => (
          <span key={p} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">{p}</span>
        ))}
      </div>
      <button
        onClick={() => setSaved(true)}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
      >
        {saved ? "✓ Saved & Parent Notified!" : "Save Lesson & Notify Parent"}
      </button>
    </div>
  );
}

function AttendanceVisual() {
  const weeks = ["Jan W1", "Jan W2", "Jan W3", "Jan W4", "Feb W1", "Feb W2", "Feb W3", "Feb W4"];
  const data = [
    { name: "Sophie T.", records: [true, true, true, true, true, false, true, true] },
    { name: "Liam K.", records: [true, true, false, true, true, true, true, true] },
    { name: "Aria M.", records: [true, true, true, true, true, true, true, true] },
    { name: "Noah P.", records: [true, false, true, true, false, true, true, true] },
  ];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["94%", "Avg. Attendance"], ["32", "Lessons This Month"], ["3", "Absences"]].map(([v, l]) => (
          <div key={l} className="rounded-xl border bg-background p-2.5 shadow-sm">
            <p className="text-base font-bold">{v}</p>
            <p className="text-[9px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="grid border-b" style={{ gridTemplateColumns: "80px repeat(8, 1fr)" }}>
          <div className="px-2 py-1.5 text-[9px] font-semibold text-muted-foreground">Student</div>
          {weeks.map(w => (
            <div key={w} className="text-center px-1 py-1.5 text-[8px] text-muted-foreground font-medium">{w.split(" ")[1]}</div>
          ))}
        </div>
        {data.map(({ name, records }) => (
          <div key={name} className="grid border-b last:border-0 items-center" style={{ gridTemplateColumns: "80px repeat(8, 1fr)" }}>
            <div className="px-2 py-2 text-[10px] font-medium truncate">{name.split(" ")[0]}</div>
            {records.map((present, i) => (
              <div key={i} className="flex justify-center py-2">
                <div className={`h-4 w-4 rounded-full ${present ? "bg-emerald-500" : "bg-destructive/50"} flex items-center justify-center`}>
                  {present ? <CheckCheck className="h-2.5 w-2.5 text-white" /> : <span className="text-white text-[8px] font-bold">✕</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const slots: Record<string, { name: string; level: string; time: string } | null> = {
    "Mon-3": { name: "Liam K.", level: "Gr.2", time: "3:00" },
    "Mon-4": { name: "Noah P.", level: "Gr.4", time: "4:30" },
    "Tue-3": { name: "Aria M.", level: "Gr.7", time: "3:30" },
    "Wed-3": { name: "Sophie T.", level: "Gr.5", time: "3:00" },
    "Wed-4": { name: "Liam K.", level: "Gr.2", time: "4:00" },
    "Thu-5": { name: "Noah P.", level: "Gr.4", time: "5:00" },
    "Fri-4": { name: "Sophie T.", level: "Gr.5", time: "4:30" },
    "Fri-5": { name: "Aria M.", level: "Gr.7", time: "5:30" },
  };
  const hours = [3, 4, 5];
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-2.5">
        <span className="text-sm font-semibold">Week of 23 Feb 2026</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">9 lessons</span>
      </div>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <div className="grid border-b" style={{ gridTemplateColumns: "40px repeat(5, 1fr)" }}>
          <div />
          {days.map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        {hours.map(h => (
          <div key={h} className="grid border-b last:border-0" style={{ gridTemplateColumns: "40px repeat(5, 1fr)" }}>
            <div className="flex items-center justify-center text-[9px] text-muted-foreground py-2">{h}pm</div>
            {days.map(d => {
              const slot = slots[`${d}-${h}`];
              return (
                <div key={d} className="p-1">
                  {slot ? (
                    <div className="rounded-lg bg-primary/10 px-1.5 py-1">
                      <p className="text-[10px] font-semibold text-primary leading-tight">{slot.name}</p>
                      <p className="text-[8px] text-muted-foreground">{slot.level} · {slot.time}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function RepertoireVisual() {
  const pieces = [
    { title: "Für Elise", composer: "Beethoven", student: "Sophie T.", level: "Gr.5", status: "In Progress" },
    { title: "Moonlight Sonata", composer: "Beethoven", student: "Aria M.", level: "Gr.7", status: "In Progress" },
    { title: "Minuet in G", composer: "Bach", student: "Liam K.", level: "Gr.2", status: "Completed" },
    { title: "Sonatina Op.36", composer: "Clementi", student: "Noah P.", level: "Gr.4", status: "In Progress" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["8", "Active Pieces"], ["23", "Completed"], ["5", "Genres"]].map(([v, l]) => (
          <div key={l} className="rounded-xl border bg-background p-2.5 shadow-sm">
            <p className="text-base font-bold">{v}</p>
            <p className="text-[9px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        {pieces.map((p, i) => (
          <div key={i} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-muted/30 transition-colors">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate">{p.title} <span className="font-normal text-muted-foreground">— {p.composer}</span></p>
              <p className="text-[9px] text-muted-foreground">{p.student} · {p.level}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[8px] font-medium shrink-0 ${p.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilesVisual() {
  const files = [
    { name: "Für Elise – Beethoven.pdf", student: "Sophie T.", pages: 4, size: "1.2 MB" },
    { name: "Grade 5 Scales Reference.pdf", student: "All students", pages: 2, size: "340 KB" },
    { name: "Moonlight Sonata.pdf", student: "Aria M.", pages: 8, size: "3.1 MB" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
          <input className="w-full rounded-xl border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="Search scores or students…" readOnly />
        </div>
        <button className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Upload</button>
      </div>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{f.name}</p>
              <p className="text-[9px] text-muted-foreground">{f.student} · {f.pages} pages · {f.size}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
        <span>📌</span>
        <span>Click any file to open, annotate, or share with the student</span>
      </div>
    </div>
  );
}

function ParentPortalVisual() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">S</div>
          <div>
            <p className="text-sm font-semibold">Sophie Turner</p>
            <p className="text-xs text-muted-foreground">Parent of Sophie · Active since Jan 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span className="text-[9px] font-medium text-emerald-600">Up to date</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["25", "Lessons", Award], ["18", "Pieces Learned", Music], ["98%", "Attendance", TrendingUp]].map(([v, l, Icon]: any) => (
          <div key={l} className="rounded-xl border bg-background p-2.5 shadow-sm">
            <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
            <p className="text-sm font-bold">{v}</p>
            <p className="text-[9px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-background p-3.5 shadow-sm space-y-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Latest Lesson — 25 Feb 2026</p>
        <div className="rounded-lg bg-muted/50 p-2.5 text-[11px] space-y-1">
          <p><span className="font-semibold">Covered:</span> Für Elise (bars 1–16), C Major Scale</p>
          <p><span className="font-semibold">Teacher's note:</span> Great left hand progress. Focus on dynamics.</p>
          <p><span className="font-semibold">Homework:</span> Practise bars 9–16 at ♩= 60 daily.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
          <Bell className="h-3 w-3" /> You were notified automatically, 2 hours ago
        </div>
      </div>
    </div>
  );
}

function PayoffVisual() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-5 text-center space-y-2">
        <div className="text-4xl">🎶</div>
        <p className="text-lg font-bold">Your studio, finally under control.</p>
        <p className="text-sm text-muted-foreground">Everything you've just seen — students, lessons, parents, files, repertoire — all in one place, built for teachers like you.</p>
      </div>
      <div className="space-y-2">
        {[
          { before: "Sticky notes & spreadsheets", after: "One organised dashboard", icon: "✓" },
          { before: "Chasing parents at 10pm", after: "Auto-notifications after every lesson", icon: "✓" },
          { before: "Sunday admin sessions", after: "Lesson logged in under 60 seconds", icon: "✓" },
          { before: "No idea who's where", after: "Progress tracked for every student", icon: "✓" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 shadow-sm">
            <span className="text-emerald-500 font-bold">{row.icon}</span>
            <span className="text-xs text-muted-foreground line-through flex-1">{row.before}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-foreground">{row.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "The Problem",
    subtitle: "Sound familiar?",
    voiceover: "Sticky notes, WhatsApp messages, three different spreadsheets — and it's Sunday evening again. The teaching is the easy part. The admin is where your evenings disappear.",
    accent: "from-destructive/20 to-destructive/5",
    visual: ProblemVisual,
  },
  {
    id: 2,
    title: "Meet Conservo",
    subtitle: "The solution you've been waiting for",
    voiceover: "Conservo brings your students, lessons, calendar, files, and parent communication into one place — built specifically for independent music teachers like you.",
    accent: "from-primary/20 to-primary/5",
    visual: MeetStudioFlowVisual,
  },
  {
    id: 3,
    title: "Student Profiles",
    subtitle: "Every student at your fingertips",
    voiceover: "Every student gets a full profile — level, pieces, attendance, and lesson history. Click a name and everything is right there. No more digging through notebooks.",
    accent: "from-violet-500/20 to-violet-500/5",
    visual: StudentProfilesVisual,
  },
  {
    id: 4,
    title: "Lesson Notes & Homework",
    subtitle: "Log every session in under 60 seconds",
    voiceover: "Add what you covered, set homework, mark attendance — and Conservo automatically notifies the parent. One tap. Done.",
    accent: "from-amber-500/20 to-amber-500/5",
    visual: LessonNotesVisual,
  },
  {
    id: 5,
    title: "Attendance Tracking",
    subtitle: "Never lose track of who showed up",
    voiceover: "Attendance is tracked automatically across your whole studio. See who's consistent, who's falling behind — no more tallying absences by hand.",
    accent: "from-emerald-500/20 to-emerald-500/5",
    visual: AttendanceVisual,
  },
  {
    id: 6,
    title: "Calendar & Scheduling",
    subtitle: "Your whole week at a glance",
    voiceover: "See every lesson in a clean weekly view — student name, level, and time. Export to Google Calendar in one click.",
    accent: "from-sky-500/20 to-sky-500/5",
    visual: CalendarVisual,
  },
  {
    id: 7,
    title: "Repertoire Library",
    subtitle: "Track every piece, every student",
    voiceover: "A living repertoire record for your whole studio — what each student is working on, what they've completed, all in one searchable list.",
    accent: "from-rose-500/20 to-rose-500/5",
    visual: RepertoireVisual,
  },
  {
    id: 8,
    title: "Files & Scores",
    subtitle: "Never lose a piece of sheet music again",
    voiceover: "Upload PDFs, attach them to students or lessons, and open them in the built-in score viewer — from any device, no printer needed.",
    accent: "from-teal-500/20 to-teal-500/5",
    visual: FilesVisual,
  },
  {
    id: 9,
    title: "Parent Portal",
    subtitle: "Parents stay informed, you stay focused",
    voiceover: "Every parent gets a private portal with lesson notes, homework, and progress. No more late-night messages. Parents feel connected — you get your evenings back.",
    accent: "from-indigo-500/20 to-indigo-500/5",
    visual: ParentPortalVisual,
  },
  {
    id: 10,
    title: "The Payoff",
    subtitle: "More music. Less admin. Finally.",
    voiceover: "From chaos to clarity — students, lessons, parents, and files all in one place. You became a teacher because you love music. Conservo keeps it that way.",
    accent: "from-primary/20 to-primary/5",
    visual: PayoffVisual,
  },
];

// ─── Video Export Hook ────────────────────────────────────────────────────────

function useVideoExport(cardRef: React.RefObject<HTMLDivElement>) {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0); // 0-100
  const [exportStep, setExportStep] = useState("");

  const fetchAudioBlob = async (slideIndex: number, retries = 3): Promise<Blob> => {
    const s = SLIDES[slideIndex];
    for (let attempt = 0; attempt < retries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 2s, 4s
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tour-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: s.voiceover }),
        }
      );
      if (response.ok) return response.blob();
      console.warn(`TTS attempt ${attempt + 1} failed for slide ${slideIndex + 1}, status: ${response.status}`);
    }
    throw new Error(`TTS fetch failed for slide ${slideIndex + 1} after ${retries} attempts`);
  };

  const getAudioDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
        URL.revokeObjectURL(url);
      });
      audio.addEventListener("error", () => {
        resolve(15); // fallback 15s
        URL.revokeObjectURL(url);
      });
    });
  };

  const exportVideo = async (
    onSlideChange: (index: number) => void,
  ) => {
    if (!cardRef.current) return;
    setExporting(true);
    setExportProgress(0);

    try {
      // Phase 1: Fetch all audio blobs
      setExportStep("Fetching narration (1/10)…");
      const audioBlobs: Blob[] = [];
      for (let i = 0; i < SLIDES.length; i++) {
        setExportStep(`Fetching narration (${i + 1}/${SLIDES.length})…`);
        setExportProgress(Math.round((i / SLIDES.length) * 40));
        const blob = await fetchAudioBlob(i);
        audioBlobs.push(blob);
        // Brief pause between requests to avoid rate limiting
        if (i < SLIDES.length - 1) await new Promise(r => setTimeout(r, 800));
      }

      // Phase 2: Get durations
      setExportStep("Measuring timing…");
      const durations: number[] = [];
      for (let i = 0; i < audioBlobs.length; i++) {
        const dur = await getAudioDuration(audioBlobs[i]);
        durations.push(dur + 0.5); // slight pause between slides
      }

      // Phase 3: Record using canvas + MediaRecorder
      setExportStep("Recording video…");
      setExportProgress(45);

      // Output canvas — 780x1688 (9:16 mobile @ 2x for crisp text)
      const W = 780;
      const H = 1688;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Audio context for mixing
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      // MediaRecorder — combine canvas stream + audio
      const videoStream = canvas.captureStream(30);
      const audioTracks = dest.stream.getAudioTracks();
      audioTracks.forEach(t => videoStream.addTrack(t));

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(videoStream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      let frameHandle: number;
      let currentSlideCanvas: HTMLCanvasElement | null = null;

      const drawFrame = () => {
        ctx.fillStyle = "#f5f5f0";
        ctx.fillRect(0, 0, W, H);
        if (currentSlideCanvas) {
          // Scale slide canvas to fit width, center vertically
          const scale = W / currentSlideCanvas.width;
          const scaledH = currentSlideCanvas.height * scale;
          const offsetY = Math.max(0, (H - scaledH) / 2);
          ctx.drawImage(currentSlideCanvas, 0, offsetY, W, scaledH);
        }
        frameHandle = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Play each slide
      for (let i = 0; i < SLIDES.length; i++) {
        // Switch UI to this slide
        onSlideChange(i);
        setExportProgress(45 + Math.round((i / SLIDES.length) * 50));
        setExportStep(`Recording slide ${i + 1}/${SLIDES.length}…`);

        // Wait for DOM to update, then capture
        await new Promise(r => setTimeout(r, 300));

        if (cardRef.current) {
          const snap = await html2canvas(cardRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            logging: false,
          });
          currentSlideCanvas = snap;
        }

        // Play audio for this slide
        const blob = audioBlobs[i];
        const url = URL.createObjectURL(blob);
        const audioBuffer = await audioCtx.decodeAudioData(await blob.arrayBuffer());
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = 1.25;
        source.connect(dest);
        source.start();

        // Wait for audio to finish + short gap
        await new Promise<void>(resolve => {
          source.onended = () => setTimeout(resolve, 500);
        });

        URL.revokeObjectURL(url);
      }

      // Stop recording
      cancelAnimationFrame(frameHandle!);
      recorder.stop();
      audioCtx.close();

      // Wait for recorder to finish
      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

      // Download
      setExportStep("Saving video…");
      setExportProgress(98);
      const videoBlob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(videoBlob);
      a.download = "conservo-tour.webm";
      a.click();
      setExportProgress(100);
      setExportStep("Done!");

      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportStep("");
      }, 2000);
    } catch (err) {
      console.error("Video export error:", err);
      setExporting(false);
      setExportProgress(0);
      setExportStep("Export failed. Please try again.");
      setTimeout(() => setExportStep(""), 3000);
    }
  };

  return { exporting, exportProgress, exportStep, exportVideo };
}

// ─── Hook: Tab Capture (getDisplayMedia) ────────────────────────────────────

function useTabCapture() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      setStatus("Requesting screen share…");
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30, displaySurface: "browser" },
        audio: { echoCancellation: false, noiseSuppression: false },
        preferCurrentTab: true,
      });

      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "conservo-screen-recording.webm";
        a.click();
        setRecording(false);
        setStatus("Saved!");
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        setTimeout(() => setStatus(""), 3000);
      };

      // Auto-stop when user ends share
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      recorder.start(100);
      setRecording(true);
      setStatus("Recording… Navigate the app, then click Stop");
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") console.error(err);
      setStatus("Cancelled");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setStatus("Saving…");
  };

  return { recording, status, startRecording, stopRecording };
}

// ─── Hook: Scripted App Demo (html2canvas tour of real app pages) ─────────────

const APP_PAGES = [
  { label: "Dashboard", path: "/dashboard", narration: "Here's the Dashboard — your studio at a glance. See upcoming lessons, student activity, and key stats the moment you log in." },
  { label: "Students", path: "/students", narration: "The Students page keeps every profile in one place — level, lesson day, contact details, and progress history." },
  { label: "Lessons", path: "/lessons", narration: "Log lesson notes, homework, and the pieces covered. Parents get notified automatically after every session." },
  { label: "Calendar", path: "/calendar", narration: "The Calendar view shows your full week at a glance. No more double-booking or missed lessons." },
  { label: "Repertoire", path: "/repertoire", narration: "Track every piece each student is learning or has completed. Build a rich musical history over time." },
  { label: "Files", path: "/files", narration: "Store and share sheet music, backing tracks, and resources — all linked directly to students and lessons." },
];

// Fetch TTS audio blob from the existing tour-tts edge function
async function fetchNarrationBlob(text: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tour-tts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text }),
      }
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function useAppDemoRecorder() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0);

  const recordAppDemo = async () => {
    setRunning(true);
    setProgress(0);

    const W = 1280;
    const H = 720;
    const SCALE = 2;

    try {
      // ── AudioContext for mixing TTS into the recording ──
      const audioCtx = new AudioContext();
      const audioDestination = audioCtx.createMediaStreamDestination();

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { alpha: false })!;

      // Merge video + audio tracks into one stream
      const videoStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 128_000,
      });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      // ── Helpers ──
      const drawTransition = (label: string) => {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, W / 2, H / 2 - 10);
        ctx.font = "18px system-ui, sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Conservo", W / 2, H / 2 + 30);
      };

      const drawSnap = (snap: HTMLCanvasElement) => {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, W, H);
        const srcW = snap.width;
        const srcH = snap.height;
        const fitScale = Math.min(W / (srcW / SCALE), H / (srcH / SCALE));
        const dw = (srcW / SCALE) * fitScale;
        const dh = (srcH / SCALE) * fitScale;
        ctx.drawImage(snap, 0, 0, srcW, srcH, (W - dw) / 2, (H - dh) / 2, dw, dh);
      };

      // Play an ArrayBuffer through AudioContext (routed to recorder)
      const playAudioBuffer = async (buf: ArrayBuffer): Promise<void> => {
        return new Promise(async (resolve) => {
          try {
            const decoded = await audioCtx.decodeAudioData(buf);
            const source = audioCtx.createBufferSource();
            source.buffer = decoded;
            source.connect(audioDestination);
            source.onended = () => resolve();
            source.start();
          } catch {
            resolve();
          }
        });
      };

      // Pre-fetch all narrations in parallel to minimise wait time
      setStep("Preparing narrations…");
      const narrationBuffers = await Promise.all(
        APP_PAGES.map(p => fetchNarrationBlob(p.narration))
      );

      const iframe = document.createElement("iframe");
      iframe.style.cssText = `
        position: fixed; top: 0; left: 0;
        width: ${W}px; height: ${H}px;
        border: none; z-index: -1;
        opacity: 0; pointer-events: none;
      `;
      document.body.appendChild(iframe);

      for (let i = 0; i < APP_PAGES.length; i++) {
        const page = APP_PAGES[i];
        setStep(`Capturing ${page.label} (${i + 1}/${APP_PAGES.length})…`);
        setProgress(Math.round(10 + (i / APP_PAGES.length) * 75));

        // Transition frame
        drawTransition(page.label);
        await new Promise(r => setTimeout(r, 500));

        // Navigate iframe
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 5000);
          iframe.onload = () => { clearTimeout(timer); resolve(); };
          iframe.src = window.location.origin + page.path;
        });

        // Wait for React render + data
        await new Promise(r => setTimeout(r, 2500));

        // Capture screenshot
        let snap: HTMLCanvasElement | null = null;
        try {
          snap = await html2canvas(iframe.contentDocument!.body, {
            scale: SCALE,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
            width: W,
            height: H,
            windowWidth: W,
            windowHeight: H,
            scrollX: 0,
            scrollY: 0,
            imageTimeout: 8000,
          });
        } catch (e) {
          console.warn("html2canvas failed for", page.label, e);
        }

        if (snap) drawSnap(snap);

        // Play narration audio (routed into the recording) while holding the frame
        const buf = narrationBuffers[i];
        if (buf) {
          await playAudioBuffer(buf.slice(0)); // slice to clone — decodeAudioData detaches
        } else {
          // No audio: hold frame for 4s
          await new Promise(r => setTimeout(r, 4000));
        }

        // Brief pause between pages
        await new Promise(r => setTimeout(r, 600));
      }

      document.body.removeChild(iframe);

      // Closing frame
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Conservo", W / 2, H / 2 - 10);
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("The all-in-one studio management platform", W / 2, H / 2 + 35);
      await new Promise(r => setTimeout(r, 1500));

      setStep("Saving video…");
      setProgress(95);
      recorder.stop();
      await new Promise<void>(r => { recorder.onstop = () => r(); });
      audioCtx.close();

      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "conservo-app-demo.webm";
      a.click();

      setProgress(100);
      setStep("Done! Check your downloads.");
      setTimeout(() => { setRunning(false); setStep(""); setProgress(0); }, 3000);
    } catch (err) {
      console.error("App demo error:", err);
      setRunning(false);
      setStep("Failed. Are you logged in?");
      setTimeout(() => setStep(""), 4000);
    }
  };

  return { running, step, progress, recordAppDemo };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GuidedTour() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<number, string>>({});
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { exporting, exportProgress, exportStep, exportVideo } = useVideoExport(cardRef);
  const { recording, status: tabStatus, startRecording, stopRecording } = useTabCapture();
  const { running: demoRunning, step: demoStep, progress: demoProgress, recordAppDemo } = useAppDemoRecorder();

  const slide = SLIDES[current];

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const fetchAndPlay = useCallback(async (slideIndex: number) => {
    const s = SLIDES[slideIndex];
    setLoadingAudio(true);
    setPlaying(false);

    try {
      let url = audioCache.current[slideIndex];

      if (!url) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tour-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: s.voiceover }),
          }
        );

        if (!response.ok) throw new Error("TTS fetch failed");

        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        audioCache.current[slideIndex] = url;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.muted = muted;
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        if (slideIndex < SLIDES.length - 1) {
          autoTimer.current = setTimeout(() => {
            const next = slideIndex + 1;
            setCurrent(next);
            fetchAndPlay(next);
          }, 300);
        }
      };

      await audio.play();
      setPlaying(true);
    } catch (e) {
      console.error("TTS error", e);
      setPlaying(false);
    } finally {
      setLoadingAudio(false);
    }
  }, [muted]);

  const handlePlayPause = () => {
    if (loadingAudio) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime > 0) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      fetchAndPlay(current);
    }
  };

  const goTo = useCallback((index: number) => {
    stopAudio();
    setCurrent(index);
  }, [stopAudio]);

  const prev = () => { if (current > 0) goTo(current - 1); };
  const next = () => { if (current < SLIDES.length - 1) goTo(current + 1); };

  const toggleMute = () => {
    setMuted(m => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      Object.values(audioCache.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, [stopAudio]);

  const Visual = slide.visual;

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-16 bg-gradient-to-b from-muted/20 to-background" id="guided-tour">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Play className="h-3.5 w-3.5" />
            Guided Tour
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">See exactly what Conservo does</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            A 2-minute walkthrough of every feature — with AI voiceover. Use the arrows or click any step to jump around.
          </p>
        </div>

        {/* Step indicator strip */}
        <div className="hidden sm:flex items-center justify-center gap-1 mb-6 overflow-x-auto pb-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              title={s.title}
              className={`group flex flex-col items-center gap-1 transition-all ${i === current ? "opacity-100" : "opacity-50 hover:opacity-80"}`}
            >
              <div className={`h-1.5 w-8 rounded-full transition-all ${i === current ? "bg-primary" : i < current ? "bg-primary/40" : "bg-muted-foreground/30"}`} />
              <span className={`text-[9px] font-medium whitespace-nowrap transition-all ${i === current ? "text-primary" : "text-muted-foreground"}`}>
                {s.title}
              </span>
            </button>
          ))}
        </div>

        {/* Mobile progress bar */}
        <div className="flex gap-1 mb-4 sm:hidden">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`h-1.5 rounded-full flex-1 transition-all ${i === current ? "bg-primary" : i < current ? "bg-primary/40" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Main card */}
        <div ref={cardRef} className={`rounded-2xl border-2 bg-gradient-to-br ${slide.accent} shadow-2xl overflow-hidden transition-all duration-300`}>

          {/* Browser chrome bar */}
          <div className="flex items-center gap-1.5 border-b bg-background/90 backdrop-blur-sm px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 flex-1 rounded-md bg-muted/60 px-3 py-1 text-[10px] text-muted-foreground truncate border border-border/40 font-mono">
              app.conservo.net/{slide.title.toLowerCase().replace(/\s+/g, '-')}
            </span>
            <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
              {current + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Slide header — full width, prominent */}
          <div className="px-5 pt-5 pb-3 bg-background/40 backdrop-blur-sm border-b border-border/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Step {slide.id} of {SLIDES.length}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">{slide.title}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{slide.subtitle}</p>
              </div>

              {/* Big play button — primary CTA */}
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <button
                  onClick={handlePlayPause}
                  disabled={loadingAudio}
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all disabled:opacity-60
                    ${playing
                      ? "bg-primary text-primary-foreground scale-105 shadow-primary/30"
                      : "bg-primary text-primary-foreground hover:scale-110 hover:shadow-primary/40"
                    }`}
                >
                  {/* Pulse ring when playing */}
                  {playing && (
                    <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  )}
                  {loadingAudio ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : playing ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </button>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide text-center">
                  {loadingAudio ? "Loading…" : playing ? "Playing" : "Play narration"}
                </p>
              </div>
            </div>

            {/* Narration text + audio wave */}
            <div className={`mt-3 flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${playing ? "bg-primary/8 border border-primary/20" : "bg-background/50 border border-border/30"}`}>
              {/* Animated audio bars */}
              <div className="shrink-0 flex items-end gap-[2px] h-4 mt-0.5">
                {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all ${playing ? "bg-primary" : "bg-muted-foreground/30"}`}
                    style={{
                      height: playing ? `${h * 2}px` : "4px",
                      animation: playing ? `audioBar ${0.6 + i * 0.1}s ease-in-out infinite alternate` : "none",
                    }}
                  />
                ))}
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed flex-1 transition-colors ${playing ? "text-foreground" : "text-muted-foreground"}`}>
                "{slide.voiceover}"
              </p>
              <button
                onClick={toggleMute}
                className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background/80 hover:bg-muted transition-colors mt-0.5"
              >
                {muted ? <VolumeX className="h-3 w-3 text-muted-foreground" /> : <Volume2 className="h-3 w-3 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Visual mockup area */}
          <div className="p-4 sm:p-6 overflow-auto max-h-[380px] sm:max-h-[440px] bg-background/20">
            <div
              className=""
            >
              <Visual />
            </div>
          </div>
        </div>

        {/* Export progress bar */}
        {exporting && (
          <div className="mt-3 rounded-xl border bg-background/80 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-primary animate-pulse" />
                {exportStep}
              </span>
              <span className="text-xs font-bold text-primary">{exportProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tab capture status bar */}
        {(recording || tabStatus) && (
          <div className="mt-3 rounded-xl border bg-background/80 px-4 py-3 flex items-center gap-3">
            {recording && <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
            <span className="text-xs font-medium text-foreground flex-1">{tabStatus || "Recording…"}</span>
            {recording && (
              <button onClick={stopRecording} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <StopCircle className="h-3.5 w-3.5" /> Stop
              </button>
            )}
          </div>
        )}

        {/* App demo progress bar */}
        {demoRunning && (
          <div className="mt-3 rounded-xl border bg-background/80 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground flex items-center gap-2">
                <Clapperboard className="h-3.5 w-3.5 text-primary animate-pulse" />
                {demoStep}
              </span>
              <span className="text-xs font-bold text-primary">{demoProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${demoProgress}%` }} />
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            onClick={prev}
            disabled={current === 0 || exporting}
            className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-sm"
          >
            <SkipBack className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/30">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Auto-play on
            </span>
            <button
              onClick={() => exportVideo((idx) => { stopAudio(); setCurrent(idx); })}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {exporting ? "Exporting…" : "Export Video"}
            </button>

            {/* Option A: Tab Capture */}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={exporting || demoRunning}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm ${
                recording
                  ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {recording ? <StopCircle className="h-3.5 w-3.5" /> : <ScreenShare className="h-3.5 w-3.5" />}
              {recording ? "Stop Recording" : "A: Record Screen"}
            </button>

            {/* Option B: Scripted App Tour */}
            <button
              onClick={recordAppDemo}
              disabled={exporting || demoRunning || recording}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              {demoRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clapperboard className="h-3.5 w-3.5" />}
              {demoRunning ? "Recording…" : "B: App Demo Video"}
            </button>
          </div>

          {current < SLIDES.length - 1 ? (
            <button
              onClick={next}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              <span className="hidden sm:inline">Next</span>
              <SkipForward className="h-4 w-4" />
            </button>
          ) : (
            <a href="#waitlist">
              <Button size="sm" className="px-5 font-semibold shadow">
                Get Early Access →
              </Button>
            </a>
          )}
        </div>

        {/* Mobile chapter chips */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 sm:hidden scrollbar-none">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
                i === current
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              {s.id}. {s.title}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
