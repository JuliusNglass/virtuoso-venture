import { useState } from "react";
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
  Clock, Star, TrendingUp, CheckCheck
} from "lucide-react";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

type LeadForm = z.infer<typeof leadSchema>;

const features = [
  { icon: BookOpen, title: "Every lesson logged in seconds", description: "Notes, homework, pieces covered — all in one place. No more scrambling before the next session." },
  { icon: Users, title: "Parents stay in the loop", description: "A live portal so parents always know what was covered and what to practise. Zero extra work for you." },
  { icon: FileText, title: "Sheet music, organised", description: "Upload and store scores so nothing gets lost between lessons. Access from anywhere." },
  { icon: Calendar, title: "Student progress at a glance", description: "Track repertoire and progress over time. See exactly where each student is in their journey." },
  { icon: Bell, title: "Lesson requests, handled", description: "New students come to you already organised. No more back-and-forth emails just to get started." },
  { icon: Music, title: "Built by a musician, for musicians", description: "Not a tech company. A classically trained teacher who lived these exact problems." },
];

const painPoints = [
  "Chasing parents for updates at 10pm",
  "Forgetting what you covered last week",
  "Losing track of repertoire across 20+ students",
  "Spending evenings on admin instead of music",
  "Parents who feel disconnected from their child's progress",
];

// ─── Mockup screens ───────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Active Students", value: "14", icon: Users, color: "text-blue-500" },
          { label: "Lessons This Week", value: "9", icon: Calendar, color: "text-green-500" },
          { label: "Pending Homework", value: "6", icon: ClipboardList, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border bg-background p-3 text-center shadow-sm">
            <Icon className={`mx-auto mb-1 h-4 w-4 ${color}`} />
            <div className="text-lg font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">UPCOMING LESSONS TODAY</p>
        {[
          { name: "Sophie T.", time: "3:00 PM", level: "Grade 5", piece: "Für Elise" },
          { name: "Liam K.", time: "4:30 PM", level: "Grade 2", piece: "Minuet in G" },
          { name: "Aria M.", time: "5:30 PM", level: "Grade 7", piece: "Moonlight Sonata" },
        ].map((s) => (
          <div key={s.name} className="flex items-center justify-between border-b py-2 last:border-0">
            <div>
              <p className="text-xs font-medium">{s.name}</p>
              <p className="text-[10px] text-muted-foreground">{s.level} · {s.piece}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium">{s.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonLogMockup() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Sophie T. — Lesson Log</p>
            <p className="text-[10px] text-muted-foreground">25 Feb 2026 · Grade 5</p>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Present</span>
        </div>
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-muted-foreground">PIECES COVERED</p>
            <div className="flex flex-wrap gap-1">
              {["Für Elise", "C Major Scale", "Sight Reading Ex. 4"].map(p => (
                <span key={p} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{p}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-muted-foreground">LESSON NOTES</p>
            <p className="rounded bg-muted px-2 py-1.5 text-[10px]">Great progress on the left hand in bars 1–8. Work on dynamics in the middle section.</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-muted-foreground">HOMEWORK</p>
            <p className="rounded bg-muted px-2 py-1.5 text-[10px]">Practise bars 9–16 slowly with a metronome at ♩= 60. 15 mins daily.</p>
          </div>
        </div>
        <Button
          size="sm"
          className="mt-3 w-full text-xs"
          onClick={() => setSaved(true)}
        >
          {saved ? <><CheckCheck className="mr-1 h-3 w-3" /> Saved!</> : "Save Lesson"}
        </Button>
      </div>
    </div>
  );
}

function ParentPortalMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">S</div>
          <div>
            <p className="text-xs font-semibold">Sophie's Progress</p>
            <p className="text-[10px] text-muted-foreground">Parent portal · Live updates</p>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-base font-bold">24</p>
            <p className="text-[10px] text-muted-foreground">Lessons completed</p>
          </div>
          <div className="rounded-lg bg-muted p-2 text-center">
            <p className="text-base font-bold">Grade 5</p>
            <p className="text-[10px] text-muted-foreground">Current level</p>
          </div>
        </div>
        <p className="mb-1 text-[10px] font-semibold text-muted-foreground">LAST LESSON</p>
        <div className="rounded border bg-muted/40 p-2 text-[10px] space-y-1">
          <p><span className="font-medium">Piece:</span> Für Elise — great progress on left hand</p>
          <p><span className="font-medium">Homework:</span> Bars 9–16, ♩= 60, 15 mins daily</p>
          <p><span className="font-medium">Next lesson:</span> Wednesday 4 Mar, 3:00 PM</p>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-600">
          <CheckCircle2 className="h-3 w-3" /> Parent notified automatically
        </div>
      </div>
    </div>
  );
}

function FilesMockup() {
  const [opened, setOpened] = useState<string | null>(null);
  const files = [
    { name: "Für Elise – Beethoven.pdf", size: "1.2 MB", type: "Score" },
    { name: "Grade 5 Scales Reference.pdf", size: "340 KB", type: "Reference" },
    { name: "Sight Reading Pack A.pdf", size: "2.1 MB", type: "Exercise" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground">SOPHIE'S FILES</p>
      {files.map((f) => (
        <div
          key={f.name}
          className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${opened === f.name ? "border-primary bg-primary/5" : "bg-background"}`}
          onClick={() => setOpened(f.name)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[11px] font-medium">{f.name}</p>
              <p className="text-[10px] text-muted-foreground">{f.type} · {f.size}</p>
            </div>
          </div>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>
      ))}
      {opened && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-[10px] text-primary">
          📄 Opening <span className="font-semibold">{opened}</span> in the score viewer…
        </div>
      )}
    </div>
  );
}

const mockupTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: <DashboardMockup /> },
  { id: "lessons", label: "Lesson Log", icon: ClipboardList, component: <LessonLogMockup /> },
  { id: "parents", label: "Parent Portal", icon: UserCircle, component: <ParentPortalMockup /> },
  { id: "files", label: "Files", icon: FolderOpen, component: <FilesMockup /> },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const form = useForm<LeadForm>({
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

  const activeScreen = mockupTabs.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            For independent piano teachers
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Stop drowning in admin.<br />
            <span className="text-primary">Start teaching more.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            StudioDesk is the all-in-one studio management tool built by a classically trained musician who got tired of the chaos — and built the tool they always wished existed.
          </p>
          <a href="#waitlist">
            <Button size="lg" className="px-8 py-6 text-base font-semibold shadow-lg">
              Join the Early Access List →
            </Button>
          </a>
        </div>
      </section>

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
            <p className="text-muted-foreground">Click through the features below to explore what StudioDesk looks like.</p>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Tab buttons */}
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:w-48 lg:shrink-0">
              {mockupTabs.map(({ id, label, icon: Icon }) => (
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
                {activeScreen?.component}
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
            <p className="text-muted-foreground">StudioDesk handles the admin so you can focus on the lesson.</p>
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

      {/* Founder story */}
      <section className="bg-primary/5 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 text-4xl">🎹</div>
          <blockquote className="text-lg font-medium leading-relaxed">
            "I built this because I was spending my evenings on admin instead of music. After years of teaching, I finally created the tool I always needed — and now I want to make it available to every teacher who feels the same way."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Julius Nglass, classically trained musician & piano teacher</p>
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
                Join the waitlist and be first to know when StudioDesk opens its doors. No spam, ever.
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
        <p>StudioDesk · Built by a musician, for musicians · Julius Nglass</p>
      </footer>
    </div>
  );
}
