import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_STUDIO_ID = "11111111-2222-4333-8444-555555555501";
const S = {
  emma: "22222222-0001-4000-8000-000000000001", lucas: "22222222-0001-4000-8000-000000000002",
  sophia: "22222222-0001-4000-8000-000000000003", oliver: "22222222-0001-4000-8000-000000000004",
  aisha: "22222222-0001-4000-8000-000000000005", waitlist: "22222222-0001-4000-8000-000000000006",
  overdue: "22222222-0001-4000-8000-000000000007",
};
const CLS = { ensemble: "33333333-0001-4000-8000-000000000001", theory: "33333333-0001-4000-8000-000000000002" };
const CS = {
  ep1: "44444444-0001-4000-8000-000000000001", ep2: "44444444-0001-4000-8000-000000000002",
  eu:  "44444444-0001-4000-8000-000000000003", tp1: "44444444-0001-4000-8000-000000000004",
  tu:  "44444444-0001-4000-8000-000000000005",
};
const L = {
  et: "55555555-0001-4000-8000-000000000001", lt: "55555555-0001-4000-8000-000000000002",
  st: "55555555-0001-4000-8000-000000000003", em1: "55555555-0001-4000-8000-000000000004",
  em2: "55555555-0001-4000-8000-000000000005", em3: "55555555-0001-4000-8000-000000000006",
  lm1: "55555555-0001-4000-8000-000000000007", lm2: "55555555-0001-4000-8000-000000000008",
  sm1: "55555555-0001-4000-8000-000000000009", sm2: "55555555-0001-4000-8000-000000000010",
  om1: "55555555-0001-4000-8000-000000000011", om2: "55555555-0001-4000-8000-000000000012",
  am1: "55555555-0001-4000-8000-000000000013", am2: "55555555-0001-4000-8000-000000000014",
  eu1: "55555555-0001-4000-8000-000000000015", lu1: "55555555-0001-4000-8000-000000000016",
  su1: "55555555-0001-4000-8000-000000000017", ou1: "55555555-0001-4000-8000-000000000018",
  au1: "55555555-0001-4000-8000-000000000019",
};
const HW = {
  e1: "66666666-0001-4000-8000-000000000001", e2: "66666666-0001-4000-8000-000000000002",
  l1: "66666666-0001-4000-8000-000000000003", s1: "66666666-0001-4000-8000-000000000004",
  o1: "66666666-0001-4000-8000-000000000005", a1: "66666666-0001-4000-8000-000000000006",
};
const RC = {
  e1: "77777777-0001-4000-8000-000000000001", e2: "77777777-0001-4000-8000-000000000002",
  e3: "77777777-0001-4000-8000-000000000003", l1: "77777777-0001-4000-8000-000000000004",
  s1: "77777777-0001-4000-8000-000000000005", o1: "77777777-0001-4000-8000-000000000006",
  a1: "77777777-0001-4000-8000-000000000007",
};
const TH = { emma: "88888888-0001-4000-8000-000000000001", lucas: "88888888-0001-4000-8000-000000000002", sophia: "88888888-0001-4000-8000-000000000003" };
const CHW = { en1: "99999999-0001-4000-8000-000000000001", en2: "99999999-0001-4000-8000-000000000002", th1: "99999999-0001-4000-8000-000000000003" };
const LR = {
  p1: "aaaaaaaa-0001-4000-8000-000000000001", p2: "aaaaaaaa-0001-4000-8000-000000000002",
  ac: "aaaaaaaa-0001-4000-8000-000000000003", de: "aaaaaaaa-0001-4000-8000-000000000004",
};

const TEACHER_EMAIL = "demo-teacher@conservo.app";
const PARENT_EMAIL  = "demo-parent@conservo.app";
const DEMO_PASSWORD = "demo1234";

function d(n: number) { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
function ts(n: number, h = 10) { const dt = new Date(); dt.setDate(dt.getDate() + n); dt.setHours(h, 0, 0, 0); return dt.toISOString(); }

async function up(db: any, table: string, rows: any[], conflict = "id") {
  const { error } = await db.from(table).upsert(rows, { onConflict: conflict });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const reset = url.searchParams.get("reset") === "true";

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Auth users
    async function upsertUser(email: string, name: string): Promise<string> {
      const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
      const ex = list?.users.find((u: any) => u.email === email);
      if (ex) return ex.id;
      const { data, error } = await db.auth.admin.createUser({ email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
      if (error) throw new Error(`createUser ${email}: ${error.message}`);
      return data.user.id;
    }

    const teacherId = await upsertUser(TEACHER_EMAIL, "Alex Rivera");
    const parentId  = await upsertUser(PARENT_EMAIL,  "Sarah Chen");

    // 2. Parent role
    const { error: roleErr } = await db.from("user_roles").upsert({ user_id: parentId, role: "parent", studio_id: DEMO_STUDIO_ID }, { onConflict: "user_id,role" });
    if (roleErr) console.warn("role upsert warn:", roleErr.message);

    // 3. Reset if requested
    if (reset) {
      const sid = DEMO_STUDIO_ID;
      const allS = Object.values(S);
      for (const [tbl, col, val] of [
        ["class_homework_completion", "studio_id", sid],
        ["class_homework", "studio_id", sid],
        ["class_attendance", "studio_id", sid],
        ["class_session_notes", "studio_id", sid],
        ["class_sessions", "studio_id", sid],
        ["class_members", "studio_id", sid],
        ["classes", "studio_id", sid],
        ["recap_messages", "studio_id", sid],
        ["homework_assignments", "studio_id", sid],
        ["practice_logs", "studio_id", sid],
        ["messages", "studio_id", sid],
        ["message_threads", "studio_id", sid],
        ["lesson_requests", "studio_id", sid],
      ] as [string, string, string][]) {
        const { error } = await db.from(tbl).delete().eq(col, val);
        if (error) console.warn(`delete ${tbl}:`, error.message);
      }
      const { error: filesErr } = await db.from("files").delete().in("student_id", allS);
      if (filesErr) console.warn("delete files:", filesErr.message);
      const { error: lessonsErr } = await db.from("lessons").delete().in("student_id", allS);
      if (lessonsErr) console.warn("delete lessons:", lessonsErr.message);
      const { error: studErr } = await db.from("students").delete().eq("studio_id", sid);
      if (studErr) console.warn("delete students:", studErr.message);
      const { error: studioErr } = await db.from("studios").delete().eq("id", sid);
      if (studioErr) console.warn("delete studio:", studioErr.message);
    }

    // 4. Studio
    await up(db, "studios", [{ id: DEMO_STUDIO_ID, name: "Demo Music Studio", owner_user_id: teacherId, slug: "conservo-demo", is_demo: true }]);

    // 5. Students
    await up(db, "students", [
      { id: S.emma,     name: "Emma Chen",     studio_id: DEMO_STUDIO_ID, parent_user_id: parentId, parent_name: "Sarah Chen",    parent_email: PARENT_EMAIL,                  parent_phone: "+447700900001", level: "Grade 4", age: 10, lesson_day: "Monday",    lesson_time: "10:00", current_piece: "Für Elise – Beethoven",            notes: "Very motivated, excellent ear. Focus on smooth LH arpeggios.", meeting_url: "https://meet.google.com/demo-emma", status: "active" },
      { id: S.lucas,    name: "Lucas Rivera",  studio_id: DEMO_STUDIO_ID, parent_name: "Marco Rivera",   parent_email: "marco.rivera@example.com",   parent_phone: "+447700900002", level: "Grade 2", age: 8,  lesson_day: "Tuesday",   lesson_time: "11:00", current_piece: "Twinkle Variations – Suzuki",      notes: "Great enthusiasm. Short attention span — keep sessions varied.", status: "active" },
      { id: S.sophia,   name: "Sophia Park",   studio_id: DEMO_STUDIO_ID, parent_name: "Ji-Young Park",  parent_email: "jiyoung.park@example.com",   parent_phone: "+447700900003", level: "Grade 6", age: 14, lesson_day: "Wednesday", lesson_time: "14:00", current_piece: "Moonlight Sonata Op. 27 No. 2",    notes: "High achiever, preparing for Grade 6 exam in June.", status: "active" },
      { id: S.oliver,   name: "Oliver Kim",    studio_id: DEMO_STUDIO_ID, parent_name: "David Kim",      parent_email: "david.kim@example.com",       parent_phone: "+447700900004", level: "Grade 3", age: 11, lesson_day: "Thursday",  lesson_time: "15:00", current_piece: "The Entertainer – Scott Joplin",   notes: "Loves ragtime. Works best with recordings to emulate.", status: "active" },
      { id: S.aisha,    name: "Aisha Patel",   studio_id: DEMO_STUDIO_ID, parent_name: "Priya Patel",    parent_email: "priya.patel@example.com",     parent_phone: "+447700900005", level: "Grade 5", age: 13, lesson_day: "Friday",    lesson_time: "09:00", current_piece: "Arabesque No. 1 – Debussy",        notes: "Sensitive musicality. Needs to build confidence in performance.", status: "active" },
      { id: S.waitlist, name: "Mia Thompson",  studio_id: DEMO_STUDIO_ID, parent_name: "Rachel Thompson", parent_email: "rachel.t@example.com",       level: "Grade 1", age: 7, status: "waiting" },
      { id: S.overdue,  name: "Jake Morrison", studio_id: DEMO_STUDIO_ID, parent_name: "Tom Morrison",   parent_email: "tom.morrison@example.com",   parent_phone: "+447700900006", level: "Grade 3", age: 9,  lesson_day: "Friday",    lesson_time: "11:00", current_piece: "Sonatina in C – Clementi", status: "paused" },
    ]);

    const today = d(0);

    // 6. Lessons — today
    await up(db, "lessons", [
      { id: L.et, student_id: S.emma,   date: today,  attendance: "present",   notes: "Nailed the A section at performance tempo. Pedal sustain in bars 16-24 sounding beautiful.", homework: "B section hands separate at 60 bpm. LH bass notes landing cleanly.", pieces: ["Für Elise – Beethoven"] },
      { id: L.lt, student_id: S.lucas,  date: today,  attendance: "present",   notes: "Completed all five Twinkle variations. Bowing technique has improved enormously.", homework: "D major scale daily. Variation C slow + fast.", pieces: ["Twinkle Variations – Suzuki", "D Major Scale"] },
      { id: L.st, student_id: S.sophia, date: today,  attendance: "present",   notes: null, homework: null, pieces: ["Moonlight Sonata Op. 27 No. 2"] },
    ]);

    // 7. Lessons — past + upcoming
    await up(db, "lessons", [
      { id: L.em1, student_id: S.emma,   date: d(-7),  attendance: "present",   notes: "A section solid. Introduced B section structure.", homework: "A section from memory. Start LH B section bars 25-32.", pieces: ["Für Elise – Beethoven"] },
      { id: L.em2, student_id: S.emma,   date: d(-14), attendance: "present",   notes: "First full run-through. Tempo slow but great milestone!", homework: "Full piece at slow tempo daily x2.", pieces: ["Für Elise – Beethoven"] },
      { id: L.em3, student_id: S.emma,   date: d(-21), attendance: "absent",    notes: "Student absent — illness.", homework: null, pieces: [] },
      { id: L.lm1, student_id: S.lucas,  date: d(-7),  attendance: "present",   notes: "Variations A and B polished. Introduced C variation.", homework: "A + B from memory. C slow practice x3.", pieces: ["Twinkle Variations – Suzuki"] },
      { id: L.lm2, student_id: S.lucas,  date: d(-14), attendance: "present",   notes: "Excellent bow control improving. Started theory basics.", homework: "Open strings exercise. Count rests out loud.", pieces: ["Twinkle Variations – Suzuki"] },
      { id: L.sm1, student_id: S.sophia, date: d(-7),  attendance: "present",   notes: "First movement nearly exam-ready. Dynamics contrast much improved.", homework: "First movement at performance tempo. Record yourself.", pieces: ["Moonlight Sonata Op. 27 No. 2"] },
      { id: L.sm2, student_id: S.sophia, date: d(-14), attendance: "present",   notes: "Tackled coda passage. Fingering revised.", homework: "Coda bars 145-end x5 per session with metronome.", pieces: ["Moonlight Sonata Op. 27 No. 2"] },
      { id: L.om1, student_id: S.oliver, date: d(-7),  attendance: "present",   notes: "Syncopation clicking. Listened to Joplin original recording together.", homework: "Bars 1-24 up to tempo. Count syncopations out loud.", pieces: ["The Entertainer – Scott Joplin"] },
      { id: L.om2, student_id: S.oliver, date: d(-14), attendance: "cancelled", notes: "Bank holiday — rescheduled.", homework: null, pieces: [] },
      { id: L.am1, student_id: S.aisha,  date: d(-7),  attendance: "present",   notes: "Arabesque has the right dreamy character. Discussed Debussy impressionism.", homework: "Bars 1-30 from memory. Experiment with pedal timing.", pieces: ["Arabesque No. 1 – Debussy"] },
      { id: L.am2, student_id: S.aisha,  date: d(-14), attendance: "present",   notes: "Initial read-through. Strong sight-reading!", homework: "RH alone bars 1-16. Tap LH rhythm separately.", pieces: ["Arabesque No. 1 – Debussy"] },
      { id: L.eu1, student_id: S.emma,   date: d(7),   attendance: "present",   notes: null, homework: null, pieces: ["Für Elise – Beethoven"] },
      { id: L.lu1, student_id: S.lucas,  date: d(6),   attendance: "present",   notes: null, homework: null, pieces: ["Twinkle Variations – Suzuki"] },
      { id: L.su1, student_id: S.sophia, date: d(5),   attendance: "present",   notes: null, homework: null, pieces: ["Moonlight Sonata Op. 27 No. 2"] },
      { id: L.ou1, student_id: S.oliver, date: d(4),   attendance: "present",   notes: null, homework: null, pieces: ["The Entertainer – Scott Joplin"] },
      { id: L.au1, student_id: S.aisha,  date: d(3),   attendance: "present",   notes: null, homework: null, pieces: ["Arabesque No. 1 – Debussy"] },
    ]);

    // 8. Recaps
    await up(db, "recap_messages", [
      { id: RC.e1, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   lesson_id: L.em1, sent_by_user_id: teacherId, email_to: PARENT_EMAIL,                 subject: `Lesson Recap – Emma Chen – ${d(-7)}`,    body_html: `<p>Hi Sarah,</p><p>Emma's A section is really solid — dynamics expressive and tempo holding well. Introduced B section today.</p><p><strong>Homework:</strong> A section from memory, LH of B section bars 25–32.</p>`, status: "sent" },
      { id: RC.e2, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   lesson_id: L.em2, sent_by_user_id: teacherId, email_to: PARENT_EMAIL,                 subject: `Lesson Recap – Emma Chen – ${d(-14)}`,   body_html: `<p>Hi Sarah,</p><p>First full run-through of Für Elise! Tempo is slow but that's a huge milestone. Emma should feel proud.</p><p><strong>Homework:</strong> Full piece slow tempo twice daily.</p>`, status: "sent" },
      { id: RC.e3, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   lesson_id: L.et,  sent_by_user_id: teacherId, email_to: PARENT_EMAIL,                 subject: `Lesson Recap – Emma Chen – ${today}`,    body_html: `<p>Hi Sarah,</p><p>Wonderful lesson — Emma is at near performance tempo! Pedal sustain has dramatically improved. Very proud of her progress. 🌟</p><p><strong>Homework:</strong> B section hands separate at 60 bpm. Focus on LH bass notes.</p>`, status: "sent" },
      { id: RC.l1, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  lesson_id: L.lm1, sent_by_user_id: teacherId, email_to: "marco.rivera@example.com",   subject: `Lesson Recap – Lucas Rivera – ${d(-7)}`,  body_html: `<p>Hi Marco,</p><p>Lucas polished Variations A and B — they're really coming along. Introduced C variation. Bowing improved a lot with the mirror exercise.</p><p><strong>Homework:</strong> A + B from memory; C variation slow practice x3 daily.</p>`, status: "sent" },
      { id: RC.s1, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, lesson_id: L.sm1, sent_by_user_id: teacherId, email_to: "jiyoung.park@example.com",   subject: `Lesson Recap – Sophia Park – ${d(-7)}`,   body_html: `<p>Hi Ji-Young,</p><p>Sophia's first movement is nearly exam-ready! Dynamic contrast is now much more pronounced. Exam prep is on track! 🎓</p><p><strong>Homework:</strong> First movement at performance tempo — record yourself and listen back.</p>`, status: "sent" },
      { id: RC.o1, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, lesson_id: L.om1, sent_by_user_id: teacherId, email_to: "david.kim@example.com",       subject: `Lesson Recap – Oliver Kim – ${d(-7)}`,   body_html: `<p>Hi David,</p><p>The syncopation is really clicking for Oliver! We listened to Joplin's original recording together — it really inspired him.</p><p><strong>Homework:</strong> Bars 1–24 up to tempo. Count syncopations out loud.</p>`, status: "sent" },
      { id: RC.a1, studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  lesson_id: L.am1, sent_by_user_id: teacherId, email_to: "priya.patel@example.com",     subject: `Lesson Recap – Aisha Patel – ${d(-7)}`,  body_html: `<p>Hi Priya,</p><p>Aisha's Arabesque has exactly the right impressionistic character — it really captures Debussy's style. We explored more expressive pedalling.</p><p><strong>Homework:</strong> Bars 1–30 from memory. Experiment with pedal timing.</p>`, status: "sent" },
    ]);

    // 9. Homework
    await up(db, "homework_assignments", [
      { id: HW.e1, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   lesson_id: L.et,  title: "Für Elise – B Section Focus",         status: "active", due_date: d(7), items: [{ id:1, text:"B section LH alone bars 25–32 (3×)", done:false }, { id:2, text:"B section RH alone bars 25–32 (3×)", done:false }, { id:3, text:"B section hands together slow (2×)", done:false }, { id:4, text:"Full piece run-through (1×)", done:false }] },
      { id: HW.e2, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   lesson_id: L.em1, title: "Für Elise – A Section Review",          status: "active", due_date: d(0), items: [{ id:1, text:"A section from memory RH (3×)", done:true }, { id:2, text:"A section from memory LH (3×)", done:true }, { id:3, text:"A section hands together performance tempo", done:true }, { id:4, text:"LH B section bars 25–32 slow", done:false }] },
      { id: HW.l1, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  lesson_id: L.lt,  title: "Twinkle – Variation C + Scales",        status: "active", due_date: d(6), items: [{ id:1, text:"D major scale (10 mins)", done:true }, { id:2, text:"Variation A from memory (3×)", done:true }, { id:3, text:"Variation B from memory (3×)", done:false }, { id:4, text:"Variation C slow practice (3×)", done:false }] },
      { id: HW.s1, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, lesson_id: L.sm1, title: "Moonlight Sonata – Performance Prep",   status: "active", due_date: d(5), items: [{ id:1, text:"Record self playing first movement", done:true }, { id:2, text:"Listen to recording and note issues", done:true }, { id:3, text:"Coda bars 145–end with metronome (5×)", done:false }, { id:4, text:"Full first movement at performance tempo (2×)", done:false }] },
      { id: HW.o1, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, lesson_id: L.om1, title: "The Entertainer – Syncopation Drill",   status: "active", due_date: d(4), items: [{ id:1, text:"Bars 1–12 metronome 80 bpm", done:true }, { id:2, text:"Bars 13–24 metronome 80 bpm", done:false }, { id:3, text:"Full bars 1–24 at target tempo", done:false }, { id:4, text:"Listen to Joplin original recording", done:true }] },
      { id: HW.a1, studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  lesson_id: L.am1, title: "Arabesque No. 1 – Memory + Pedal",      status: "active", due_date: d(3), items: [{ id:1, text:"Bars 1–15 from memory (3×)", done:true }, { id:2, text:"Bars 16–30 from memory (3×)", done:true }, { id:3, text:"Experiment with pedal in bars 1–15", done:false }, { id:4, text:"Full piece legato run-through (1×)", done:false }] },
    ]);

    // 10. Practice logs
    const pLogs = [];
    for (let i = 1; i <= 10; i++) pLogs.push({ id: `cccccc01-${String(i).padStart(4,"0")}-4000-8000-000000000001`, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   logged_by: parentId, practice_date: d(-i), duration_seconds: 1200 + (i % 3) * 600, notes: i===1 ? "Focused on B section — real progress!" : i===3 ? "Full piece run-through twice" : null });
    for (let i = 1; i <= 5; i++)  pLogs.push({ id: `cccccc02-${String(i).padStart(4,"0")}-4000-8000-000000000001`, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  logged_by: parentId, practice_date: d(-i), duration_seconds: 900  + (i % 2) * 300, notes: i===2 ? "Variations going well" : null });
    for (let i = 1; i <= 7; i++)  pLogs.push({ id: `cccccc03-${String(i).padStart(4,"0")}-4000-8000-000000000001`, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, logged_by: parentId, practice_date: d(-i), duration_seconds: 2400 + (i % 3) * 600, notes: i===1 ? "Recorded herself — sounds beautiful" : null });
    await up(db, "practice_logs", pLogs);

    // 11. Files
    await up(db, "files", [
      { id: "bbbbbb01-0001-4000-8000-000000000001", student_id: S.emma,   uploaded_by: teacherId, name: "Für Elise – Beethoven (IMSLP Edition).pdf",       file_path: "demo/fur-elise-beethoven.pdf",  file_type: "score",      mime_type: "application/pdf", file_size: 384512 },
      { id: "bbbbbb01-0002-4000-8000-000000000001", student_id: S.emma,   uploaded_by: teacherId, name: "Pedal Technique Exercises – Week 3.pdf",          file_path: "demo/pedal-exercises.pdf",     file_type: "document",   mime_type: "application/pdf", file_size: 128000 },
      { id: "bbbbbb01-0003-4000-8000-000000000001", student_id: S.lucas,  uploaded_by: teacherId, name: "Twinkle Variations – Suzuki Book 1.pdf",          file_path: "demo/twinkle-suzuki.pdf",      file_type: "music_sheet", mime_type: "application/pdf", file_size: 512000 },
      { id: "bbbbbb01-0004-4000-8000-000000000001", student_id: S.sophia, uploaded_by: teacherId, name: "Moonlight Sonata Op.27 No.2 – Full Score.pdf",    file_path: "demo/moonlight-sonata.pdf",    file_type: "score",      mime_type: "application/pdf", file_size: 891904 },
      { id: "bbbbbb01-0005-4000-8000-000000000001", student_id: S.aisha,  uploaded_by: teacherId, name: "Arabesque No.1 – Debussy (IMSLP).pdf",            file_path: "demo/arabesque-debussy.pdf",   file_type: "score",      mime_type: "application/pdf", file_size: 450000 },
      { id: "bbbbbb01-0006-4000-8000-000000000001", student_id: null,     uploaded_by: teacherId, name: "Studio Practice Guide 2025.pdf",                  file_path: "demo/practice-guide.pdf",      file_type: "document",   mime_type: "application/pdf", file_size: 204800 },
    ]);

    // 12. Classes
    await up(db, "classes", [
      { id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, teacher_user_id: teacherId, name: "Piano Ensemble",      duration_minutes: 60, capacity: 8, default_day: "Saturday", default_time: "10:00", status: "active" },
      { id: CLS.theory,   studio_id: DEMO_STUDIO_ID, teacher_user_id: teacherId, name: "Music Theory Circle", duration_minutes: 45, capacity: 6, default_day: "Saturday", default_time: "12:00", status: "active" },
    ]);
    await up(db, "class_members", [
      { id: "dddddd01-0001-4000-8000-000000000001", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   status: "active" },
      { id: "dddddd01-0002-4000-8000-000000000001", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  status: "active" },
      { id: "dddddd01-0003-4000-8000-000000000001", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, status: "active" },
      { id: "dddddd01-0004-4000-8000-000000000001", class_id: CLS.ensemble, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, status: "active" },
      { id: "dddddd01-0005-4000-8000-000000000001", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.emma,   status: "active" },
      { id: "dddddd01-0006-4000-8000-000000000001", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.sophia, status: "active" },
      { id: "dddddd01-0007-4000-8000-000000000001", class_id: CLS.theory,   studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  status: "active" },
    ]);
    await up(db, "class_sessions", [
      { id: CS.ep1, studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(-14,10), ends_at: ts(-14,11), status: "completed" },
      { id: CS.ep2, studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(-7,10),  ends_at: ts(-7,11),  status: "completed" },
      { id: CS.eu,  studio_id: DEMO_STUDIO_ID, class_id: CLS.ensemble, starts_at: ts(5,10),   ends_at: ts(5,11),   status: "scheduled" },
      { id: CS.tp1, studio_id: DEMO_STUDIO_ID, class_id: CLS.theory,   starts_at: ts(-7,12),  ends_at: ts(-7,13),  status: "completed" },
      { id: CS.tu,  studio_id: DEMO_STUDIO_ID, class_id: CLS.theory,   starts_at: ts(5,12),   ends_at: ts(5,13),   status: "scheduled" },
    ]);
    await up(db, "class_attendance", [
      { id: "eeeeee01-0001-4000-8000-000000000001", class_session_id: CS.ep2, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeee01-0002-4000-8000-000000000001", class_session_id: CS.ep2, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  attendance: "present" },
      { id: "eeeeee01-0003-4000-8000-000000000001", class_session_id: CS.ep2, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "absent" },
      { id: "eeeeee01-0004-4000-8000-000000000001", class_session_id: CS.ep2, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, attendance: "present" },
      { id: "eeeeee01-0005-4000-8000-000000000001", class_session_id: CS.ep1, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeee01-0006-4000-8000-000000000001", class_session_id: CS.ep1, studio_id: DEMO_STUDIO_ID, student_id: S.lucas,  attendance: "present" },
      { id: "eeeeee01-0007-4000-8000-000000000001", class_session_id: CS.ep1, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "present" },
      { id: "eeeeee01-0008-4000-8000-000000000001", class_session_id: CS.ep1, studio_id: DEMO_STUDIO_ID, student_id: S.oliver, attendance: "present" },
      { id: "eeeeee01-0009-4000-8000-000000000001", class_session_id: CS.tp1, studio_id: DEMO_STUDIO_ID, student_id: S.emma,   attendance: "present" },
      { id: "eeeeee01-0010-4000-8000-000000000001", class_session_id: CS.tp1, studio_id: DEMO_STUDIO_ID, student_id: S.sophia, attendance: "present" },
      { id: "eeeeee01-0011-4000-8000-000000000001", class_session_id: CS.tp1, studio_id: DEMO_STUDIO_ID, student_id: S.aisha,  attendance: "present" },
    ]);
    await up(db, "class_session_notes", [
      { id: "ffffff01-0001-4000-8000-000000000001", studio_id: DEMO_STUDIO_ID, class_session_id: CS.ep2, notes_text: "Worked on ensemble piece bars 1-32. Great dynamics contrast. Emma and Oliver leading well. Lucas watch tempo bar 9." },
      { id: "ffffff01-0002-4000-8000-000000000001", studio_id: DEMO_STUDIO_ID, class_session_id: CS.tp1, notes_text: "Covered intervals (major/minor 3rds). All students grasped quickly. Sophia answered bonus harmonic questions correctly!" },
    ]);
    await up(db, "class_homework", [
      { id: CHW.en1, studio_id: DEMO_STUDIO_ID, class_session_id: CS.ep2, title: "Ensemble Piece – Bars 1–32",       status: "active", body_json: [{ id:1, text:"Learn your part bars 1–16", done:false }, { id:2, text:"Learn your part bars 17–32", done:false }, { id:3, text:"Record yourself", done:false }, { id:4, text:"Listen to ensemble recording", done:false }] },
      { id: CHW.en2, studio_id: DEMO_STUDIO_ID, class_session_id: CS.ep1, title: "Ensemble – Introduction Section", status: "active", body_json: [{ id:1, text:"Opening 8 bars from memory", done:true }, { id:2, text:"Play in time with metronome at 72bpm", done:true }] },
      { id: CHW.th1, studio_id: DEMO_STUDIO_ID, class_session_id: CS.tp1, title: "Intervals Worksheet",             status: "active", body_json: [{ id:1, text:"Complete intervals worksheet (page 12)", done:false }, { id:2, text:"Identify 5 intervals in your current piece", done:false }, { id:3, text:"Practise hearing M3 vs m3 with piano", done:false }] },
    ]);

    // 13. Messages — nuke ALL messages/threads for this studio first to clear any stale/invalid-UUID rows from prior seeds
    await db.from("messages").delete().eq("studio_id", DEMO_STUDIO_ID);
    await db.from("message_threads").delete().eq("studio_id", DEMO_STUDIO_ID);
    await up(db, "message_threads", [
      { id: TH.emma,   studio_id: DEMO_STUDIO_ID, student_id: S.emma },
      { id: TH.lucas,  studio_id: DEMO_STUDIO_ID, student_id: S.lucas },
      { id: TH.sophia, studio_id: DEMO_STUDIO_ID, student_id: S.sophia },
    ]);
    // Insert messages individually to avoid any batch UUID coercion issues
    const msgs = [
      { id: "aa000001-aa01-4000-8000-000000000001", thread_id: TH.emma,   studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "Hi Sarah! Just a reminder that Emma's next lesson is Monday at 10am. She's doing brilliantly with Für Elise 🎵" },
      { id: "aa000001-aa02-4000-8000-000000000001", thread_id: TH.emma,   studio_id: DEMO_STUDIO_ID, sender_user_id: parentId,  body: "Thank you! She has been practising every day this week. Really excited for the recital." },
      { id: "aa000001-aa03-4000-8000-000000000001", thread_id: TH.emma,   studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "The extra practice really shows. I think she's very close to performance-ready." },
      { id: "aa000001-aa04-4000-8000-000000000001", thread_id: TH.emma,   studio_id: DEMO_STUDIO_ID, sender_user_id: parentId,  body: "She asked if she could learn a second piece. Would that be possible to discuss at the next lesson?" },
      { id: "aa000001-aa05-4000-8000-000000000001", thread_id: TH.emma,   studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "Absolutely! I have some great Grade 4 repertoire ideas for her. Let's talk Monday 😊" },
      { id: "aa000002-aa01-4000-8000-000000000001", thread_id: TH.lucas,  studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "Hi Marco! Lucas did really well today. The bowing has improved so much. Please make sure he uses the mirror exercise daily." },
      { id: "aa000002-aa02-4000-8000-000000000001", thread_id: TH.lucas,  studio_id: DEMO_STUDIO_ID, sender_user_id: parentId,  body: "Will do! He actually asked to practise before dinner yesterday which was a first 😄" },
      { id: "aa000002-aa03-4000-8000-000000000001", thread_id: TH.lucas,  studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "That's a brilliant sign! Self-motivation at this age makes all the difference. See you Tuesday!" },
      { id: "aa000003-aa01-4000-8000-000000000001", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "Hi Ji-Young! Sophia's Grade 6 exam prep is going very well. Considering entering her for the June session. Thoughts?" },
      { id: "aa000003-aa02-4000-8000-000000000001", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: parentId,  body: "That sounds wonderful! She would be thrilled. What does she need to prepare?" },
      { id: "aa000003-aa03-4000-8000-000000000001", thread_id: TH.sophia, studio_id: DEMO_STUDIO_ID, sender_user_id: teacherId, body: "Three contrasting pieces, scales, and sight-reading. She already has A and B sorted. I'll send the syllabus." },
    ];
    for (const msg of msgs) {
      const { error: msgErr } = await db.from("messages").upsert(msg, { onConflict: "id" });
      if (msgErr) throw new Error(`upsert messages row ${msg.id}: ${msgErr.message}`);
    }

    // 14. Lesson requests
    const now = new Date();
    await up(db, "lesson_requests", [
      { id: LR.p1, studio_id: DEMO_STUDIO_ID, parent_user_id: parentId, child_name: "Zoe Williams",  child_age: 8,  parent_name: "Claire Williams", parent_email: "claire.williams@example.com", parent_phone: "+447700900010", preferred_level: "Grade 1", preferred_day: "Wednesday", preferred_time: "16:00", notes: "Zoe has never had piano lessons but is very keen — plays by ear naturally.",       status: "pending" },
      { id: LR.p2, studio_id: DEMO_STUDIO_ID, parent_user_id: parentId, child_name: "Noah Okafor",   child_age: 12, parent_name: "Ade Okafor",      parent_email: "ade.okafor@example.com",      parent_phone: "+447700900011", preferred_level: "Grade 3", preferred_day: "Thursday",  preferred_time: "17:30", notes: "2 years self-taught. Keen to learn properly and do ABRSM exams.",              status: "pending" },
      { id: LR.ac, studio_id: DEMO_STUDIO_ID, parent_user_id: parentId, child_name: "Lily Huang",    child_age: 9,  parent_name: "Wei Huang",        parent_email: "wei.huang@example.com",       preferred_level: "Grade 2", preferred_day: "Monday",    preferred_time: "14:00", notes: "Completed Grade 1 at previous school.",                                             status: "accepted",  admin_notes: "Great candidate — starting next month.", reviewed_at: new Date(now.getTime() - 3*86400000).toISOString() },
      { id: LR.de, studio_id: DEMO_STUDIO_ID, parent_user_id: parentId, child_name: "Tom Baker",     child_age: 5,  parent_name: "John Baker",       parent_email: "john.baker@example.com",      preferred_level: "Grade 1", preferred_day: "Friday",    preferred_time: "16:00", notes: "Tom is very young but very eager.",                                                  status: "declined",  admin_notes: "Minimum age policy is 7. Please reapply next year.", reviewed_at: new Date(now.getTime() - 7*86400000).toISOString() },
    ]);

    return new Response(JSON.stringify({ ok: true, teacher_email: TEACHER_EMAIL, teacher_password: DEMO_PASSWORD, parent_email: PARENT_EMAIL, parent_password: DEMO_PASSWORD }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("seed-demo error:", err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
