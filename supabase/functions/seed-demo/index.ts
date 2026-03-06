import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Deterministic Fixed UUIDs ────────────────────────────────────────────────
const DEMO_STUDIO_ID = "11111111-2222-4333-8444-555555555501";

// Students
const S = {
  emma:     "22222222-0001-4000-8000-000000000001",
  lucas:    "22222222-0001-4000-8000-000000000002",
  sophia:   "22222222-0001-4000-8000-000000000003",
  oliver:   "22222222-0001-4000-8000-000000000004",
  aisha:    "22222222-0001-4000-8000-000000000005",
  waitlist: "22222222-0001-4000-8000-000000000006",
  overdue:  "22222222-0001-4000-8000-000000000007",
};

// Classes
const CLS = {
  ensemble: "33333333-0001-4000-8000-000000000001",
  theory:   "33333333-0001-4000-8000-000000000002",
};

// Class sessions
const CS = {
  ensemble_past1:     "44444444-0001-4000-8000-000000000001",
  ensemble_past2:     "44444444-0001-4000-8000-000000000002",
  ensemble_upcoming:  "44444444-0001-4000-8000-000000000003",
  theory_past1:       "44444444-0001-4000-8000-000000000004",
  theory_upcoming:    "44444444-0001-4000-8000-000000000005",
};

// Lessons (1:1)
const L = {
  emma_today:    "55555555-0001-4000-8000-000000000001",
  lucas_today:   "55555555-0001-4000-8000-000000000002",
  sophia_today:  "55555555-0001-4000-8000-000000000003",
  emma_m1:       "55555555-0001-4000-8000-000000000004",
  emma_m2:       "55555555-0001-4000-8000-000000000005",
  emma_m3:       "55555555-0001-4000-8000-000000000006",
  lucas_m1:      "55555555-0001-4000-8000-000000000007",
  lucas_m2:      "55555555-0001-4000-8000-000000000008",
  sophia_m1:     "55555555-0001-4000-8000-000000000009",
  sophia_m2:     "55555555-0001-4000-8000-000000000010",
  oliver_m1:     "55555555-0001-4000-8000-000000000011",
  oliver_m2:     "55555555-0001-4000-8000-000000000012",
  aisha_m1:      "55555555-0001-4000-8000-000000000013",
  aisha_m2:      "55555555-0001-4000-8000-000000000014",
  // upcoming (scheduled)
  emma_up1:      "55555555-0001-4000-8000-000000000015",
  lucas_up1:     "55555555-0001-4000-8000-000000000016",
  sophia_up1:    "55555555-0001-4000-8000-000000000017",
  oliver_up1:    "55555555-0001-4000-8000-000000000018",
  aisha_up1:     "55555555-0001-4000-8000-000000000019",
};

// Homework
const HW = {
  emma1:   "66666666-0001-4000-8000-000000000001",
  emma2:   "66666666-0001-4000-8000-000000000002",
  lucas1:  "66666666-0001-4000-8000-000000000003",
  sophia1: "66666666-0001-4000-8000-000000000004",
  oliver1: "66666666-0001-4000-8000-000000000005",
  aisha1:  "66666666-0001-4000-8000-000000000006",
};

// Recaps
const RC = {
  emma1:   "77777777-0001-4000-8000-000000000001",
  emma2:   "77777777-0001-4000-8000-000000000002",
  emma3:   "77777777-0001-4000-8000-000000000003",
  lucas1:  "77777777-0001-4000-8000-000000000004",
  sophia1: "77777777-0001-4000-8000-000000000005",
  oliver1: "77777777-0001-4000-8000-000000000006",
  aisha1:  "77777777-0001-4000-8000-000000000007",
};

// Threads
const TH = {
  emma:   "88888888-0001-4000-8000-000000000001",
  lucas:  "88888888-0001-4000-8000-000000000002",
  sophia: "88888888-0001-4000-8000-000000000003",
};

// Class homework
const CHW = {
  ensemble1: "99999999-0001-4000-8000-000000000001",
  ensemble2: "99999999-0001-4000-8000-000000000002",
  theory1:   "99999999-0001-4000-8000-000000000003",
};

// Lesson requests
const LR = {
  pending1: "aaaaaaaa-0001-4000-8000-000000000001",
  pending2: "aaaaaaaa-0001-4000-8000-000000000002",
  accepted: "aaaaaaaa-0001-4000-8000-000000000003",
  declined: "aaaaaaaa-0001-4000-8000-000000000004",
};

// Files
const FI = {
  emma_score1: "bbbbbbbb-0001-4000-8000-000000000001",
  emma_score2: "bbbbbbbb-0001-4000-8000-000000000002",
  lucas_sheet: "bbbbbbbb-0001-4000-8000-000000000003",
  sophia_score: "bbbbbbbb-0001-4000-8000-000000000004",
  studio_doc:  "bbbbbbbb-0001-4000-8000-000000000005",
};

const TEACHER_EMAIL = "demo-teacher@conservo.app";
const PARENT_EMAIL  = "demo-parent@conservo.app";
const DEMO_PASSWORD = "demo1234";

// ─── Date helpers ─────────────────────────────────────────────────────────────
function d(n: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function ts(dayOffset: number, hour = 10, minute = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + dayOffset);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}

// ─── Helper: upsert and throw on error ───────────────────────────────────────
async function up(client: any, table: string, rows: any[], conflict = "id") {
  const { error } = await client.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw new Error(`upsert(${table}): ${error.message}`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url   = new URL(req.url);
    const reset = url.searchParams.get("reset") === "true";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── 1. Auth users ─────────────────────────────────────────────────────────
    async function upsertUser(email: string, fullName: string): Promise<string> {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users.find((u) => u.email === email);
      if (existing) return existing.id;
      const { data, error } = await admin.auth.admin.createUser({
        email, password: DEMO_PASSWORD, email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) throw new Error(`createUser(${email}): ${error.message}`);
      return data.user.id;
    }

    const teacherUserId = await upsertUser(TEACHER_EMAIL, "Alex Rivera");
    const parentUserId  = await upsertUser(PARENT_EMAIL,  "Sarah Chen");

    // ── 2. Parent role ────────────────────────────────────────────────────────
    await admin.from("user_roles").upsert(
      { user_id: parentUserId, role: "parent", studio_id: DEMO_STUDIO_ID },
      { onConflict: "user_id,role" }
    );

    // ── 3. Hard reset (delete in FK-safe order) ───────────────────────────────
    if (reset) {
      const sid = DEMO_STUDIO_ID;
      const allStudentIds = Object.values(S);

      await admin.from("class_homework_completion").delete().eq("studio_id", sid);
      await admin.from("class_homework").delete().eq("studio_id", sid);
      await admin.from("class_attendance").delete().eq("studio_id", sid);
      await admin.from("class_session_notes").delete().eq("studio_id", sid);
      await admin.from("class_sessions").delete().eq("studio_id", sid);
      await admin.from("class_members").delete().eq("studio_id", sid);
      await admin.from("classes").delete().eq("studio_id", sid);
      await admin.from("recap_messages").delete().eq("studio_id", sid);
      await admin.from("homework_assignments").delete().eq("studio_id", sid);
      await admin.from("practice_logs").delete().eq("studio_id", sid);
      await admin.from("messages").delete().eq("studio_id", sid);
      await admin.from("message_threads").delete().eq("studio_id", sid);
      await admin.from("files").delete().in("student_id", allStudentIds);
      await admin.from("lessons").delete().in("student_id", allStudentIds);
      await admin.from("lesson_requests").delete().eq("studio_id", sid);
      await admin.from("students").delete().eq("studio_id", sid);
      await admin.from("studios").delete().eq("id", sid);
    }

    // ── 4. Studio ─────────────────────────────────────────────────────────────
    await admin.from("studios").upsert({
      id: DEMO_STUDIO_ID,
      name: "Demo Music Studio",
      owner_user_id: teacherUserId,
      slug: "conservo-demo",
      is_demo: true,
    }, { onConflict: "id" });

    // ── 5. Students ───────────────────────────────────────────────────────────
    const { error: studentsErr } = await admin.from("students").upsert([
      {
        id: S.emma,
        name: "Emma Chen",
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        parent_name: "Sarah Chen",
        parent_email: PARENT_EMAIL,
        parent_phone: "+447700900001",
        level: "Grade 4",
        age: 10,
        lesson_day: "Monday",
        lesson_time: "10:00",
        current_piece: "Für Elise – Beethoven",
        notes: "Very motivated, excellent ear. Focus on smooth LH arpeggios.",
        meeting_url: "https://meet.google.com/demo-emma",
        status: "active",
      },
      {
        id: S.lucas,
        name: "Lucas Rivera",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "Marco Rivera",
        parent_email: "marco.rivera@example.com",
        parent_phone: "+447700900002",
        level: "Grade 2",
        age: 8,
        lesson_day: "Tuesday",
        lesson_time: "11:00",
        current_piece: "Twinkle Variations – Suzuki",
        notes: "Great enthusiasm. Short attention span — keep sessions varied.",
        status: "active",
      },
      {
        id: S.sophia,
        name: "Sophia Park",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "Ji-Young Park",
        parent_email: "jiyoung.park@example.com",
        parent_phone: "+447700900003",
        level: "Grade 6",
        age: 14,
        lesson_day: "Wednesday",
        lesson_time: "14:00",
        current_piece: "Moonlight Sonata Op. 27 No. 2 – Beethoven",
        notes: "High achiever, preparing for Grade 6 exam in June.",
        status: "active",
      },
      {
        id: S.oliver,
        name: "Oliver Kim",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "David Kim",
        parent_email: "david.kim@example.com",
        parent_phone: "+447700900004",
        level: "Grade 3",
        age: 11,
        lesson_day: "Thursday",
        lesson_time: "15:00",
        current_piece: "The Entertainer – Scott Joplin",
        notes: "Loves ragtime. Works best with recordings to emulate.",
        status: "active",
      },
      {
        id: S.aisha,
        name: "Aisha Patel",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "Priya Patel",
        parent_email: "priya.patel@example.com",
        parent_phone: "+447700900005",
        level: "Grade 5",
        age: 13,
        lesson_day: "Friday",
        lesson_time: "09:00",
        current_piece: "Arabesque No. 1 – Debussy",
        notes: "Sensitive musicality. Needs to build confidence in performance.",
        status: "active",
      },
      {
        id: S.waitlist,
        name: "Mia Thompson",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "Rachel Thompson",
        parent_email: "rachel.t@example.com",
        level: "Grade 1",
        age: 7,
        status: "waiting",
      },
      {
        id: S.overdue,
        name: "Jake Morrison",
        studio_id: DEMO_STUDIO_ID,
        parent_name: "Tom Morrison",
        parent_email: "tom.morrison@example.com",
        parent_phone: "+447700900006",
        level: "Grade 3",
        age: 9,
        lesson_day: "Friday",
        lesson_time: "11:00",
        current_piece: "Sonatina in C – Clementi",
        status: "awaiting_payment",
      },
    ], { onConflict: "id" });

    // ── 6. Lessons — today (for Today page + Dashboard) ───────────────────────
    const todayStr = d(0);
    await admin.from("lessons").upsert([
      {
        id: L.emma_today,
        student_id: S.emma,
        date: todayStr,
        attendance: "present",
        notes: "Nailed the opening A section at performance tempo. Worked on pedal sustain in bars 16-24. Right hand melody now singing beautifully.",
        homework: "Practise the B section (bars 25–40) hands separately at 60 bpm. Focus on LH bass notes landing cleanly.",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: L.lucas_today,
        student_id: S.lucas,
        date: todayStr,
        attendance: "present",
        notes: "Completed all five Twinkle variations. Bowing technique has improved noticeably since adding the mirror exercise.",
        homework: "Warm up with D major scale daily. Variation C: play slowly and then at full speed.",
        pieces: ["Twinkle Variations – Suzuki", "D Major Scale"],
      },
      {
        id: L.sophia_today,
        student_id: S.sophia,
        date: todayStr,
        attendance: "scheduled",
        pieces: ["Moonlight Sonata Op. 27 No. 2 – Beethoven"],
      },
    ], { onConflict: "id" });

    // ── 7. Lessons — past months ──────────────────────────────────────────────
    await admin.from("lessons").upsert([
      // Emma – past 6 weeks
      {
        id: L.emma_m1,
        student_id: S.emma,
        date: d(-7),
        attendance: "present",
        notes: "Good session. A section solid. Introduced the B section structure.",
        homework: "A section from memory. Start LH B section bars 25-32.",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: L.emma_m2,
        student_id: S.emma,
        date: d(-14),
        attendance: "present",
        notes: "First full run-through of the piece. Tempo still slow — that's fine.",
        homework: "Full piece at slow tempo daily x2.",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: L.emma_m3,
        student_id: S.emma,
        date: d(-21),
        attendance: "absent",
        notes: "Student absent — illness.",
        homework: null,
        pieces: [],
      },
      // Lucas – past weeks
      {
        id: L.lucas_m1,
        student_id: S.lucas,
        date: d(-7),
        attendance: "present",
        notes: "Variations A and B polished. Introduced C variation.",
        homework: "A + B from memory. C slow practice x3.",
        pieces: ["Twinkle Variations – Suzuki"],
      },
      {
        id: L.lucas_m2,
        student_id: S.lucas,
        date: d(-14),
        attendance: "present",
        notes: "Excellent bow control improving. Started discussing music theory basics.",
        homework: "Open strings exercise. Count rests out loud.",
        pieces: ["Twinkle Variations – Suzuki"],
      },
      // Sophia
      {
        id: L.sophia_m1,
        student_id: S.sophia,
        date: d(-7),
        attendance: "present",
        notes: "First movement nearly exam-ready. Dynamics contrast much improved.",
        homework: "First movement at performance tempo. Record yourself.",
        pieces: ["Moonlight Sonata Op. 27 No. 2 – Beethoven"],
      },
      {
        id: L.sophia_m2,
        student_id: S.sophia,
        date: d(-14),
        attendance: "present",
        notes: "Tackled the technically demanding coda passage. Fingering revised.",
        homework: "Coda bars 145-end x5 per session with metronome.",
        pieces: ["Moonlight Sonata Op. 27 No. 2 – Beethoven"],
      },
      // Oliver
      {
        id: L.oliver_m1,
        student_id: S.oliver,
        date: d(-7),
        attendance: "present",
        notes: "Syncopation clicking into place. Listened to Joplin original recording together.",
        homework: "Bars 1-24 up to tempo. Count syncopations out loud.",
        pieces: ["The Entertainer – Scott Joplin"],
      },
      {
        id: L.oliver_m2,
        student_id: S.oliver,
        date: d(-14),
        attendance: "cancelled",
        notes: "Bank holiday — lesson rescheduled.",
        homework: null,
        pieces: [],
      },
      // Aisha
      {
        id: L.aisha_m1,
        student_id: S.aisha,
        date: d(-7),
        attendance: "present",
        notes: "Arabesque has the right dreamy character now. Discussed Debussy's style and impressionism briefly.",
        homework: "Bars 1-30 from memory. Experiment with pedal timing.",
        pieces: ["Arabesque No. 1 – Debussy"],
      },
      {
        id: L.aisha_m2,
        student_id: S.aisha,
        date: d(-14),
        attendance: "present",
        notes: "Initial read-through of Arabesque. Strong sight-reading!",
        homework: "RH alone bars 1-16. Tap LH rhythm separately.",
        pieces: ["Arabesque No. 1 – Debussy"],
      },
      // Upcoming scheduled lessons (next 7 days)
      { id: L.emma_up1,  student_id: S.emma,   date: d(7),  attendance: "scheduled", pieces: ["Für Elise – Beethoven"] },
      { id: L.lucas_up1, student_id: S.lucas,  date: d(6),  attendance: "scheduled", pieces: ["Twinkle Variations – Suzuki"] },
      { id: L.sophia_up1,student_id: S.sophia, date: d(5),  attendance: "scheduled", pieces: ["Moonlight Sonata Op. 27 No. 2 – Beethoven"] },
      { id: L.oliver_up1,student_id: S.oliver, date: d(4),  attendance: "scheduled", pieces: ["The Entertainer – Scott Joplin"] },
      { id: L.aisha_up1, student_id: S.aisha,  date: d(3),  attendance: "scheduled", pieces: ["Arabesque No. 1 – Debussy"] },
    ], { onConflict: "id" });

    // ── 8. Recap messages ──────────────────────────────────────────────────────
    await admin.from("recap_messages").upsert([
      {
        id: RC.emma1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        lesson_id: L.emma_m1,
        sent_by_user_id: teacherUserId,
        email_to: PARENT_EMAIL,
        subject: `Lesson Recap – Emma Chen – ${d(-7)}`,
        body_html: `<p>Hi Sarah,</p><p>Great lesson! Emma's A section is really solid now — dynamics are expressive and she's holding tempo well. We introduced the B section and she picked up the structure quickly.</p><p><strong>Homework:</strong> A section from memory, and start LH of B section bars 25–32.</p><p>Keep up the great practice! 🎹</p>`,
        status: "sent",
      },
      {
        id: RC.emma2,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        lesson_id: L.emma_m2,
        sent_by_user_id: teacherUserId,
        email_to: PARENT_EMAIL,
        subject: `Lesson Recap – Emma Chen – ${d(-14)}`,
        body_html: `<p>Hi Sarah,</p><p>We did our first full run-through of Für Elise today! Tempo is slow but that's completely normal at this stage. Emma should feel proud of this milestone.</p><p><strong>Homework:</strong> Full piece at a slow, comfortable tempo twice daily.</p>`,
        status: "sent",
      },
      {
        id: RC.emma3,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        lesson_id: L.emma_today,
        sent_by_user_id: teacherUserId,
        email_to: PARENT_EMAIL,
        subject: `Lesson Recap – Emma Chen – ${todayStr}`,
        body_html: `<p>Hi Sarah,</p><p>Wonderful lesson today — Emma is performing Für Elise at near performance tempo! The pedal sustain in bars 16-24 has improved dramatically. Very proud of her progress.</p><p><strong>Homework:</strong> B section hands separate at 60 bpm. Focus on LH bass notes landing cleanly.</p><p>She's really ready to perform this! 🌟</p>`,
        status: "sent",
      },
      {
        id: RC.lucas1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.lucas,
        lesson_id: L.lucas_m1,
        sent_by_user_id: teacherUserId,
        email_to: "marco.rivera@example.com",
        subject: `Lesson Recap – Lucas Rivera – ${d(-7)}`,
        body_html: `<p>Hi Marco,</p><p>Lucas polished Variations A and B — they're really coming along. We introduced C variation today. His bowing has improved a lot with the mirror exercise at home.</p><p><strong>Homework:</strong> A + B from memory; C variation slow practice x3 daily.</p>`,
        status: "sent",
      },
      {
        id: RC.sophia1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.sophia,
        lesson_id: L.sophia_m1,
        sent_by_user_id: teacherUserId,
        email_to: "jiyoung.park@example.com",
        subject: `Lesson Recap – Sophia Park – ${d(-7)}`,
        body_html: `<p>Hi Ji-Young,</p><p>Sophia's first movement is nearly exam-ready! The dynamic contrast is now much more pronounced. We spent time refining the pp passages.</p><p><strong>Homework:</strong> First movement at performance tempo — try recording yourself on your phone and listening back.</p><p>Exam preparation is on track! 🎓</p>`,
        status: "sent",
      },
      {
        id: RC.oliver1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.oliver,
        lesson_id: L.oliver_m1,
        sent_by_user_id: teacherUserId,
        email_to: "david.kim@example.com",
        subject: `Lesson Recap – Oliver Kim – ${d(-7)}`,
        body_html: `<p>Hi David,</p><p>The syncopation is really clicking for Oliver now! We listened to Joplin's original recording together which really inspired him. He has brilliant musical instincts.</p><p><strong>Homework:</strong> Bars 1–24 up to tempo. Count the syncopations out loud.</p>`,
        status: "sent",
      },
      {
        id: RC.aisha1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.aisha,
        lesson_id: L.aisha_m1,
        sent_by_user_id: teacherUserId,
        email_to: "priya.patel@example.com",
        subject: `Lesson Recap – Aisha Patel – ${d(-7)}`,
        body_html: `<p>Hi Priya,</p><p>Aisha's Arabesque has exactly the right impressionistic character — it really captures Debussy's style. We explored using the pedal more expressively.</p><p><strong>Homework:</strong> Bars 1–30 from memory. Experiment with pedal timing in different sections.</p>`,
        status: "sent",
      },
    ], { onConflict: "id" });

    // ── 9. Homework assignments ────────────────────────────────────────────────
    await admin.from("homework_assignments").upsert([
      {
        id: HW.emma1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        lesson_id: L.emma_today,
        title: "Für Elise – B Section Focus",
        status: "active",
        due_date: d(7),
        items: [
          { id: 1, text: "B section LH alone bars 25–32 (3×)", done: false },
          { id: 2, text: "B section RH alone bars 25–32 (3×)", done: false },
          { id: 3, text: "B section hands together slow (2×)", done: false },
          { id: 4, text: "Full piece run-through (1×)", done: false },
        ],
      },
      {
        id: HW.emma2,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        lesson_id: L.emma_m1,
        title: "Für Elise – A Section Review",
        status: "active",
        due_date: d(0),
        items: [
          { id: 1, text: "A section from memory RH (3×)", done: true },
          { id: 2, text: "A section from memory LH (3×)", done: true },
          { id: 3, text: "A section hands together performance tempo", done: true },
          { id: 4, text: "LH B section bars 25–32 slow", done: false },
        ],
      },
      {
        id: HW.lucas1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.lucas,
        lesson_id: L.lucas_today,
        title: "Twinkle – Variation C + Scales",
        status: "active",
        due_date: d(6),
        items: [
          { id: 1, text: "D major scale ascending + descending (10 mins)", done: true },
          { id: 2, text: "Variation A from memory (3×)", done: true },
          { id: 3, text: "Variation B from memory (3×)", done: false },
          { id: 4, text: "Variation C slow practice (3×)", done: false },
        ],
      },
      {
        id: HW.sophia1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.sophia,
        lesson_id: L.sophia_m1,
        title: "Moonlight Sonata – Performance Prep",
        status: "active",
        due_date: d(5),
        items: [
          { id: 1, text: "Record self playing first movement", done: true },
          { id: 2, text: "Listen to recording and note any issues", done: true },
          { id: 3, text: "Coda bars 145–end with metronome (5×)", done: false },
          { id: 4, text: "Full first movement at performance tempo (2×)", done: false },
        ],
      },
      {
        id: HW.oliver1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.oliver,
        lesson_id: L.oliver_m1,
        title: "The Entertainer – Syncopation Drill",
        status: "active",
        due_date: d(4),
        items: [
          { id: 1, text: "Bars 1–12 with metronome at 80 bpm", done: true },
          { id: 2, text: "Bars 13–24 with metronome at 80 bpm", done: false },
          { id: 3, text: "Full bars 1–24 at target tempo", done: false },
          { id: 4, text: "Listen to Joplin original recording", done: true },
        ],
      },
      {
        id: HW.aisha1,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.aisha,
        lesson_id: L.aisha_m1,
        title: "Arabesque No. 1 – Memory + Pedal",
        status: "active",
        due_date: d(3),
        items: [
          { id: 1, text: "Bars 1–15 from memory (3×)", done: true },
          { id: 2, text: "Bars 16–30 from memory (3×)", done: true },
          { id: 3, text: "Experiment with pedal in bars 1–15", done: false },
          { id: 4, text: "Full piece legato run-through (1×)", done: false },
        ],
      },
    ], { onConflict: "id" });

    // ── 10. Practice logs ──────────────────────────────────────────────────────
    const practiceLogs = [];
    // Emma — 10 days of logs
    for (let i = 1; i <= 10; i++) {
      practiceLogs.push({
        id: `cccccccc-0001-4000-8000-${String(i).padStart(12, "0")}`,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.emma,
        logged_by: parentUserId,
        practice_date: d(-i),
        duration_seconds: 1200 + (i % 3) * 600,
        notes: i === 1 ? "Focused on B section today — made real progress!" :
               i === 3 ? "Full piece run-through twice" :
               i === 5 ? "25 mins before school" :
               i === 7 ? "Extra session — she asked for more practice!" : null,
      });
    }
    // Lucas — 5 days
    for (let i = 1; i <= 5; i++) {
      practiceLogs.push({
        id: `cccccccc-0002-4000-8000-${String(i).padStart(12, "0")}`,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.lucas,
        logged_by: parentUserId,
        practice_date: d(-i),
        duration_seconds: 900 + (i % 2) * 300,
        notes: i === 2 ? "Variations going well" : null,
      });
    }
    // Sophia — 7 days
    for (let i = 1; i <= 7; i++) {
      practiceLogs.push({
        id: `cccccccc-0003-4000-8000-${String(i).padStart(12, "0")}`,
        studio_id: DEMO_STUDIO_ID,
        student_id: S.sophia,
        logged_by: parentUserId,
        practice_date: d(-i),
        duration_seconds: 2400 + (i % 3) * 600,
        notes: i === 1 ? "Recorded herself — sounds beautiful" : null,
      });
    }
    await admin.from("practice_logs").upsert(practiceLogs, { onConflict: "id" });

    // ── 11. Files (DB entries — realistic names) ───────────────────────────────
    await admin.from("files").upsert([
      {
        id: FI.emma_score1,
        student_id: S.emma,
        uploaded_by: teacherUserId,
        name: "Für Elise – Beethoven (IMSLP Edition).pdf",
        file_path: "demo/fur-elise-beethoven.pdf",
        file_type: "score",
        mime_type: "application/pdf",
        file_size: 384512,
      },
      {
        id: FI.emma_score2,
        student_id: S.emma,
        uploaded_by: teacherUserId,
        name: "Pedal Technique Exercises – Week 3.pdf",
        file_path: "demo/pedal-exercises.pdf",
        file_type: "document",
        mime_type: "application/pdf",
        file_size: 128000,
      },
      {
        id: FI.lucas_sheet,
        student_id: S.lucas,
        uploaded_by: teacherUserId,
        name: "Twinkle Variations – Suzuki Book 1.pdf",
        file_path: "demo/twinkle-suzuki.pdf",
        file_type: "music_sheet",
        mime_type: "application/pdf",
        file_size: 512000,
      },
      {
        id: FI.sophia_score,
        student_id: S.sophia,
        uploaded_by: teacherUserId,
        name: "Moonlight Sonata Op.27 No.2 – Full Score.pdf",
        file_path: "demo/moonlight-sonata.pdf",
        file_type: "score",
        mime_type: "application/pdf",
        file_size: 891904,
      },
      {
        id: FI.studio_doc,
        student_id: null,
        uploaded_by: teacherUserId,
        name: "Studio Practice Guide 2025.pdf",
        file_path: "demo/practice-guide.pdf",
        file_type: "document",
        mime_type: "application/pdf",
        file_size: 204800,
      },
    ], { onConflict: "id" });

    // ── 12. Group Classes ──────────────────────────────────────────────────────
    await admin.from("classes").upsert([
      {
        id: CLS.ensemble,
        studio_id: DEMO_STUDIO_ID,
        teacher_user_id: teacherUserId,
        name: "Piano Ensemble",
        duration_minutes: 60,
        capacity: 8,
        default_day: "Saturday",
        default_time: "10:00",
        status: "active",
      },
      {
        id: CLS.theory,
        studio_id: DEMO_STUDIO_ID,
        teacher_user_id: teacherUserId,
        name: "Music Theory Circle",
        duration_minutes: 45,
        capacity: 6,
        default_day: "Saturday",
        default_time: "12:00",
        status: "active",
      },
    ], { onConflict: "id" });

    // Class members
    await admin.from("class_members").upsert([
      { id: "dddddddd-0001-4000-8000-000000000001", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000002", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000003", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000004", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000005", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.emma,   status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000006", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.sophia, status: "active" },
      { id: "dddddddd-0001-4000-8000-000000000007", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  status: "active" },
    ], { onConflict: "id" });

    // Class sessions
    await admin.from("class_sessions").upsert([
      { id: CS.ensemble_past1,    studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(-14, 10), ends_at: ts(-14, 11), status: "completed" },
      { id: CS.ensemble_past2,    studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(-7, 10),  ends_at: ts(-7, 11),  status: "completed" },
      { id: CS.ensemble_upcoming, studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(5, 10),   ends_at: ts(5, 11),   status: "scheduled" },
      { id: CS.theory_past1,      studio_id: DEMO_STUDIO_ID, class_id: CLS.theory,   starts_at: ts(-7, 12),  ends_at: ts(-7, 13),  status: "completed" },
      { id: CS.theory_upcoming,   studio_id: DEMO_STUDIO_ID, class_id: CLS.theory,   starts_at: ts(5, 12),   ends_at: ts(5, 13),   status: "scheduled" },
    ], { onConflict: "id" });

    // Class attendance
    await admin.from("class_attendance").upsert([
      { id: "eeeeeeee-0001-4000-8000-000000000001", class_session_id: CS.ensemble_past2, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000002", class_session_id: CS.ensemble_past2, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000003", class_session_id: CS.ensemble_past2, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "absent" },
      { id: "eeeeeeee-0001-4000-8000-000000000004", class_session_id: CS.ensemble_past2, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000005", class_session_id: CS.ensemble_past1, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000006", class_session_id: CS.ensemble_past1, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000007", class_session_id: CS.ensemble_past1, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000008", class_session_id: CS.ensemble_past1, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000009", class_session_id: CS.theory_past1,   studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000010", class_session_id: CS.theory_past1,   studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "present" },
      { id: "eeeeeeee-0001-4000-8000-000000000011", class_session_id: CS.theory_past1,   studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  attendance: "present" },
    ], { onConflict: "id" });

    // Class session notes
    await admin.from("class_session_notes").upsert([
      {
        id: "ffffffff-0001-4000-8000-000000000001",
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CS.ensemble_past2,
        notes_text: "Worked on ensemble piece bars 1-32. Great dynamics contrast achieved. Emma and Oliver leading well. Lucas needs to watch the tempo in bar 9.",
      },
      {
        id: "ffffffff-0001-4000-8000-000000000002",
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CS.theory_past1,
        notes_text: "Covered intervals (major/minor 3rds). All students grasped the concept quickly. Sophia answered bonus harmonic questions correctly!",
      },
    ], { onConflict: "id" });

    // Class homework
    await admin.from("class_homework").upsert([
      {
        id: CHW.ensemble1,
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CS.ensemble_past2,
        title: "Ensemble Piece – Bars 1–32",
        status: "active",
        body_json: [
          { id: 1, text: "Learn your individual part bars 1–16", done: false },
          { id: 2, text: "Learn your individual part bars 17–32", done: false },
          { id: 3, text: "Record yourself and listen back", done: false },
          { id: 4, text: "Listen to our ensemble recording from today", done: false },
        ],
      },
      {
        id: CHW.ensemble2,
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CS.ensemble_past1,
        title: "Ensemble – Introduction Section",
        status: "active",
        body_json: [
          { id: 1, text: "Opening 8 bars from memory", done: true },
          { id: 2, text: "Practice playing in time with metronome at 72bpm", done: true },
        ],
      },
      {
        id: CHW.theory1,
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CS.theory_past1,
        title: "Intervals Worksheet",
        status: "active",
        body_json: [
          { id: 1, text: "Complete intervals worksheet (page 12)", done: false },
          { id: 2, text: "Identify 5 intervals in your current piece", done: false },
          { id: 3, text: "Practise hearing M3 vs m3 with app/piano", done: false },
        ],
      },
    ], { onConflict: "id" });

    // ── 13. Message threads + messages ────────────────────────────────────────
    await admin.from("message_threads").upsert([
      { id: TH.emma,   studio_id: DEMO_STUDIO_ID, student_id: S.emma },
      { id: TH.lucas,  studio_id: DEMO_STUDIO_ID, student_id: S.lucas },
      { id: TH.sophia, studio_id: DEMO_STUDIO_ID, student_id: S.sophia },
    ], { onConflict: "id" });

    await admin.from("messages").upsert([
      // Emma thread — active conversation
      { id: "11111111-msg0-4000-8000-000000000001", thread_id: TH.emma, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "Hi Sarah! Just a reminder that Emma's next lesson is on Monday at 10am. She's doing brilliantly with Für Elise 🎵" },
      { id: "11111111-msg0-4000-8000-000000000002", thread_id: TH.emma, studio_id: DEMO_STUDIO_ID, sender_user_id: parentUserId,  body: "Thank you! She has been practising every day this week. Really excited for the recital." },
      { id: "11111111-msg0-4000-8000-000000000003", thread_id: TH.emma, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "That's wonderful to hear! The extra practice really shows. I think she's very close to performance-ready." },
      { id: "11111111-msg0-4000-8000-000000000004", thread_id: TH.emma, studio_id: DEMO_STUDIO_ID, sender_user_id: parentUserId,  body: "She asked if she could also learn a second piece. Would that be possible to discuss at the next lesson?" },
      { id: "11111111-msg0-4000-8000-000000000005", thread_id: TH.emma, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "Absolutely! I have some great Grade 4 repertoire ideas for her. Let's talk on Monday 😊" },
      // Lucas thread
      { id: "11111111-msg0-4000-8000-000000000006", thread_id: TH.lucas, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "Hi Marco! Lucas did really well today. The bowing has improved so much. Please make sure he uses the mirror exercise daily." },
      { id: "11111111-msg0-4000-8000-000000000007", thread_id: TH.lucas, studio_id: DEMO_STUDIO_ID, sender_user_id: parentUserId,  body: "Will do! He actually asked to practise before dinner yesterday which was a first 😄" },
      { id: "11111111-msg0-4000-8000-000000000008", thread_id: TH.lucas, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "That's a brilliant sign! Self-motivation at this age makes all the difference. See you Tuesday!" },
      // Sophia thread
      { id: "11111111-msg0-4000-8000-000000000009", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "Hi Ji-Young! Quick note — Sophia's Grade 6 exam prep is going very well. I'm considering entering her for the June session. Thoughts?" },
      { id: "11111111-msg0-4000-8000-000000000010", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: parentUserId,  body: "That sounds wonderful! She would be thrilled. What does she need to prepare for the exam?" },
      { id: "11111111-msg0-4000-8000-000000000011", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherUserId, body: "Three contrasting pieces, scales, and sight-reading. She already has pieces A and B sorted. I'll send over the syllabus." },
    ], { onConflict: "id" });

    // ── 14. Lesson requests (for Requests page) ────────────────────────────────
    await admin.from("lesson_requests").upsert([
      {
        id: LR.pending1,
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        child_name: "Zoe Williams",
        child_age: 8,
        parent_name: "Claire Williams",
        parent_email: "claire.williams@example.com",
        parent_phone: "+447700900010",
        preferred_level: "Grade 1",
        preferred_day: "Wednesday",
        preferred_time: "16:00",
        notes: "Zoe has never had piano lessons but is very keen. She loves playing by ear.",
        status: "pending",
      },
      {
        id: LR.pending2,
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        child_name: "Noah Okafor",
        child_age: 12,
        parent_name: "Ade Okafor",
        parent_email: "ade.okafor@example.com",
        parent_phone: "+447700900011",
        preferred_level: "Grade 3",
        preferred_day: "Thursday",
        preferred_time: "17:30",
        notes: "Noah has about 2 years of self-taught experience. Keen to learn properly and possibly do ABRSM exams.",
        status: "pending",
      },
      {
        id: LR.accepted,
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        child_name: "Lily Huang",
        child_age: 9,
        parent_name: "Wei Huang",
        parent_email: "wei.huang@example.com",
        preferred_level: "Grade 2",
        preferred_day: "Monday",
        preferred_time: "14:00",
        notes: "Completed Grade 1 at previous school.",
        status: "accepted",
        admin_notes: "Great candidate. Accepted — starting next month.",
        reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: LR.declined,
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        child_name: "Tom Baker",
        child_age: 5,
        parent_name: "John Baker",
        parent_email: "john.baker@example.com",
        preferred_level: "Grade 1",
        preferred_day: "Friday",
        preferred_time: "16:00",
        notes: "Tom is very young but very eager.",
        status: "declined",
        admin_notes: "Studio policy: minimum age 7. Recommended they reapply next year.",
        reviewed_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      },
    ], { onConflict: "id" });

    return new Response(
      JSON.stringify({
        ok: true,
        teacher_email: TEACHER_EMAIL,
        teacher_password: DEMO_PASSWORD,
        parent_email: PARENT_EMAIL,
        parent_password: DEMO_PASSWORD,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("seed-demo error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
