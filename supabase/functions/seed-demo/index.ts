import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Fixed deterministic UUIDs ───────────────────────────────────────────────
const DEMO_STUDIO_ID    = "11111111-2222-4333-8444-555555555501";
const DEMO_CLASS_ID     = "11111111-2222-4333-8444-555555555502";

const STUDENT_IDS = {
  emma:   "22222222-3333-4444-8555-666666666601",
  lucas:  "22222222-3333-4444-8555-666666666602",
  sophia: "22222222-3333-4444-8555-666666666603",
  oliver: "22222222-3333-4444-8555-666666666604",
  waitlist: "22222222-3333-4444-8555-666666666605",
};

const SESSION_IDS = {
  past1:    "33333333-4444-5555-8666-777777777701",
  past2:    "33333333-4444-5555-8666-777777777702",
  past3:    "33333333-4444-5555-8666-777777777703",
  upcoming1: "33333333-4444-5555-8666-777777777704",
  upcoming2: "33333333-4444-5555-8666-777777777705",
  upcoming3: "33333333-4444-5555-8666-777777777706",
};

const CLASS_SESSION_IDS = {
  completed: "44444444-5555-6666-8777-888888888801",
  upcoming:  "44444444-5555-6666-8777-888888888802",
};

const LESSON_IDS = {
  emma1:   "55555555-6666-7777-8888-999999999901",
  emma2:   "55555555-6666-7777-8888-999999999902",
  lucas1:  "55555555-6666-7777-8888-999999999903",
  sophia1: "55555555-6666-7777-8888-999999999904",
  oliver1: "55555555-6666-7777-8888-999999999905",
};

const HOMEWORK_IDS = {
  emma:   "66666666-7777-8888-8999-aaaaaaaaaaа1",
  lucas:  "66666666-7777-8888-8999-aaaaaaaaaaа2",
};

const RECAP_IDS = {
  emma1: "77777777-8888-9999-8aaa-bbbbbbbbbb01",
  emma2: "77777777-8888-9999-8aaa-bbbbbbbbbb02",
};

const THREAD_ID = "88888888-9999-aaaa-8bbb-cccccccccc01";
const CLASS_HW_ID = "99999999-aaaa-bbbb-8ccc-dddddddddd01";

const TEACHER_EMAIL = "demo-teacher@conservo.app";
const PARENT_EMAIL  = "demo-parent@conservo.app";
const DEMO_PASSWORD = "demo1234";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysFromNowISO(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── Handler ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url   = new URL(req.url);
    const reset = url.searchParams.get("reset") === "true";

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Create / reuse demo auth users ────────────────────────────────────
    async function upsertUser(email: string, fullName: string) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) return existing.id;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) throw new Error(`createUser(${email}): ${error.message}`);
      return data.user.id;
    }

    const teacherUserId = await upsertUser(TEACHER_EMAIL, "Demo Teacher");
    const parentUserId  = await upsertUser(PARENT_EMAIL,  "Demo Parent");

    // ── 2. Ensure parent role ─────────────────────────────────────────────────
    await admin.from("user_roles").upsert(
      { user_id: parentUserId, role: "parent", studio_id: DEMO_STUDIO_ID },
      { onConflict: "user_id,role" }
    );

    // ── 3. If reset=true, delete demo studio data in FK-safe order ───────────
    if (reset) {
      const sid = DEMO_STUDIO_ID;
      // child-most tables first
      await admin.from("score_annotations").delete().in(
        "file_id",
        (await admin.from("files").select("id").eq("student_id", STUDENT_IDS.emma).then(r => r.data?.map(x=>x.id) ?? []))
      );
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
      await admin.from("files").delete().in("student_id", Object.values(STUDENT_IDS));
      await admin.from("lessons").delete().in("student_id", Object.values(STUDENT_IDS));
      await admin.from("students").delete().eq("studio_id", sid);
      await admin.from("studios").delete().eq("id", sid);
    }

    // ── 4. Studio ─────────────────────────────────────────────────────────────
    await admin.from("studios").upsert(
      {
        id: DEMO_STUDIO_ID,
        name: "Conservo Demo Studio",
        owner_user_id: teacherUserId,
        slug: "conservo-demo",
        is_demo: true,
      },
      { onConflict: "id" }
    );

    // ── 5. Students ───────────────────────────────────────────────────────────
    const today = daysFromNow(0);
    await admin.from("students").upsert([
      {
        id: STUDENT_IDS.emma,
        name: "Emma Chen",
        studio_id: DEMO_STUDIO_ID,
        parent_user_id: parentUserId,
        parent_name: "Demo Parent",
        parent_email: PARENT_EMAIL,
        level: "Grade 4",
        age: 10,
        lesson_day: "Monday",
        lesson_time: "10:00",
        current_piece: "Für Elise",
        status: "active",
      },
      {
        id: STUDENT_IDS.lucas,
        name: "Lucas Rivera",
        studio_id: DEMO_STUDIO_ID,
        level: "Grade 2",
        age: 8,
        lesson_day: "Tuesday",
        lesson_time: "11:00",
        current_piece: "Twinkle Variations",
        status: "active",
      },
      {
        id: STUDENT_IDS.sophia,
        name: "Sophia Park",
        studio_id: DEMO_STUDIO_ID,
        level: "Grade 6",
        age: 14,
        lesson_day: "Wednesday",
        lesson_time: "14:00",
        current_piece: "Moonlight Sonata Op. 27",
        status: "active",
      },
      {
        id: STUDENT_IDS.oliver,
        name: "Oliver Kim",
        studio_id: DEMO_STUDIO_ID,
        level: "Grade 3",
        age: 11,
        lesson_day: "Thursday",
        lesson_time: "15:00",
        current_piece: "The Entertainer",
        status: "active",
      },
      {
        id: STUDENT_IDS.waitlist,
        name: "Mia Thompson",
        studio_id: DEMO_STUDIO_ID,
        level: "Grade 1",
        age: 7,
        status: "waitlist",
      },
    ], { onConflict: "id" });

    // ── 6. Lessons ────────────────────────────────────────────────────────────
    await admin.from("lessons").upsert([
      // past lessons
      {
        id: LESSON_IDS.emma1,
        student_id: STUDENT_IDS.emma,
        date: daysFromNow(-7),
        attendance: "present",
        notes: "Great work on dynamics in Für Elise. Focus on the A section fingering.",
        homework: "Practise bars 1–15 hands separately, 3× daily. Work on smooth pedal changes.",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: LESSON_IDS.emma2,
        student_id: STUDENT_IDS.emma,
        date: daysFromNow(-14),
        attendance: "present",
        notes: "Introduced the piece. Covered basic structure and RH melody.",
        homework: "Learn RH bars 1–8 from memory.",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: LESSON_IDS.lucas1,
        student_id: STUDENT_IDS.lucas,
        date: daysFromNow(-6),
        attendance: "present",
        notes: "Improved bow hold. Twinkle variation C is sounding great!",
        homework: "Review variations A, B, C. 10 mins scales daily.",
        pieces: ["Twinkle Variations – Suzuki"],
      },
      {
        id: LESSON_IDS.sophia1,
        student_id: STUDENT_IDS.sophia,
        date: daysFromNow(-5),
        attendance: "cancelled",
        notes: "Lesson cancelled — student sick.",
        homework: null,
        pieces: [],
      },
      {
        id: LESSON_IDS.oliver1,
        student_id: STUDENT_IDS.oliver,
        date: daysFromNow(-4),
        attendance: "present",
        notes: "Syncopation click-track exercise helped enormously.",
        homework: "The Entertainer bars 1–24 up to tempo with metronome.",
        pieces: ["The Entertainer – Joplin"],
      },
      // upcoming / scheduled lessons
      {
        id: SESSION_IDS.upcoming1,
        student_id: STUDENT_IDS.emma,
        date: daysFromNow(1),
        attendance: "scheduled",
        pieces: ["Für Elise – Beethoven"],
      },
      {
        id: SESSION_IDS.upcoming2,
        student_id: STUDENT_IDS.lucas,
        date: daysFromNow(2),
        attendance: "scheduled",
        pieces: ["Twinkle Variations – Suzuki"],
      },
      {
        id: SESSION_IDS.upcoming3,
        student_id: STUDENT_IDS.sophia,
        date: daysFromNow(3),
        attendance: "scheduled",
        pieces: ["Moonlight Sonata – Beethoven"],
      },
    ], { onConflict: "id" });

    // ── 7. Recap messages ─────────────────────────────────────────────────────
    await admin.from("recap_messages").upsert([
      {
        id: RECAP_IDS.emma1,
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        lesson_id: LESSON_IDS.emma1,
        sent_by_user_id: teacherUserId,
        email_to: PARENT_EMAIL,
        subject: `Lesson Recap – Emma Chen – ${daysFromNow(-7)}`,
        body_html: `<p>Hi there,</p><p>Great lesson today! Emma is making wonderful progress on Für Elise. The dynamics are really coming alive. Please focus on bars 1–15 hands separately this week.</p><p>See you next Monday!</p>`,
        status: "sent",
      },
      {
        id: RECAP_IDS.emma2,
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        lesson_id: LESSON_IDS.emma2,
        sent_by_user_id: teacherUserId,
        email_to: PARENT_EMAIL,
        subject: `Lesson Recap – Emma Chen – ${daysFromNow(-14)}`,
        body_html: `<p>Hi,</p><p>We started Für Elise today — Emma picked up the RH melody quickly. Homework: learn bars 1–8 from memory.</p>`,
        status: "sent",
      },
    ], { onConflict: "id" });

    // ── 8. Homework assignments ───────────────────────────────────────────────
    await admin.from("homework_assignments").upsert([
      {
        id: HOMEWORK_IDS.emma,
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        lesson_id: LESSON_IDS.emma1,
        title: "Für Elise – Week 2 Practice",
        status: "active",
        due_date: daysFromNow(7),
        items: [
          { id: 1, text: "Practise bars 1–15 RH alone (3×)", done: false },
          { id: 2, text: "Practise bars 1–15 LH alone (3×)", done: false },
          { id: 3, text: "Hands together slow tempo (2×)", done: false },
          { id: 4, text: "Smooth pedal changes practice", done: false },
        ],
      },
      {
        id: HOMEWORK_IDS.lucas,
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.lucas,
        lesson_id: LESSON_IDS.lucas1,
        title: "Twinkle – Variations Review",
        status: "active",
        due_date: daysFromNow(5),
        items: [
          { id: 1, text: "Variation A (10 mins)", done: true },
          { id: 2, text: "Variation B (10 mins)", done: true },
          { id: 3, text: "Variation C (10 mins)", done: false },
          { id: 4, text: "Scales – C major (10 mins)", done: false },
        ],
      },
    ], { onConflict: "id" });

    // ── 9. Practice logs ──────────────────────────────────────────────────────
    await admin.from("practice_logs").upsert([
      {
        id: "aaaaaaaa-bbbb-cccc-8ddd-eeeeeeeeee01",
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        logged_by: parentUserId,
        practice_date: daysFromNow(-3),
        duration_seconds: 1800,
        notes: "Worked on bars 1–8, good focus!",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-8ddd-eeeeeeeeee02",
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        logged_by: parentUserId,
        practice_date: daysFromNow(-2),
        duration_seconds: 2400,
        notes: "Both hands together today.",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-8ddd-eeeeeeeeee03",
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
        logged_by: parentUserId,
        practice_date: daysFromNow(-1),
        duration_seconds: 1500,
        notes: "Short session, 25 mins before school.",
      },
    ], { onConflict: "id" });

    // ── 10. Group class ───────────────────────────────────────────────────────
    await admin.from("classes").upsert([
      {
        id: DEMO_CLASS_ID,
        studio_id: DEMO_STUDIO_ID,
        teacher_user_id: teacherUserId,
        name: "Piano Ensemble",
        duration_minutes: 60,
        capacity: 8,
        default_day: "Saturday",
        default_time: "10:00",
        status: "active",
      },
    ], { onConflict: "id" });

    await admin.from("class_members").upsert([
      { id: "bbbbbbbb-cccc-dddd-8eee-ffffffffffff01", class_id: DEMO_CLASS_ID, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.emma,   status: "active" },
      { id: "bbbbbbbb-cccc-dddd-8eee-ffffffffffff02", class_id: DEMO_CLASS_ID, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.lucas,  status: "active" },
      { id: "bbbbbbbb-cccc-dddd-8eee-ffffffffffff03", class_id: DEMO_CLASS_ID, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.sophia, status: "active" },
      { id: "bbbbbbbb-cccc-dddd-8eee-ffffffffffff04", class_id: DEMO_CLASS_ID, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.oliver, status: "active" },
    ], { onConflict: "id" });

    // Class sessions
    await admin.from("class_sessions").upsert([
      {
        id: CLASS_SESSION_IDS.completed,
        studio_id: DEMO_STUDIO_ID,
        class_id: DEMO_CLASS_ID,
        starts_at: daysFromNowISO(-7, 10),
        ends_at: daysFromNowISO(-7, 11),
        status: "completed",
      },
      {
        id: CLASS_SESSION_IDS.upcoming,
        studio_id: DEMO_STUDIO_ID,
        class_id: DEMO_CLASS_ID,
        starts_at: daysFromNowISO(5, 10),
        ends_at: daysFromNowISO(5, 11),
        status: "scheduled",
      },
    ], { onConflict: "id" });

    // Class attendance for completed session
    await admin.from("class_attendance").upsert([
      { id: "cccccccc-dddd-eeee-8fff-000000000001", class_session_id: CLASS_SESSION_IDS.completed, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.emma,   attendance: "present" },
      { id: "cccccccc-dddd-eeee-8fff-000000000002", class_session_id: CLASS_SESSION_IDS.completed, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.lucas,  attendance: "present" },
      { id: "cccccccc-dddd-eeee-8fff-000000000003", class_session_id: CLASS_SESSION_IDS.completed, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.sophia, attendance: "absent" },
      { id: "cccccccc-dddd-eeee-8fff-000000000004", class_session_id: CLASS_SESSION_IDS.completed, studio_id: DEMO_STUDIO_ID, student_id: STUDENT_IDS.oliver, attendance: "present" },
    ], { onConflict: "id" });

    // Class homework for completed session
    await admin.from("class_homework").upsert([
      {
        id: CLASS_HW_ID,
        studio_id: DEMO_STUDIO_ID,
        class_session_id: CLASS_SESSION_IDS.completed,
        title: "Ensemble Piece – Bars 1–16",
        status: "active",
        body_json: [
          { id: 1, text: "Learn your part bars 1–8", done: false },
          { id: 2, text: "Learn your part bars 9–16", done: false },
          { id: 3, text: "Record yourself and listen back", done: false },
        ],
      },
    ], { onConflict: "id" });

    // ── 11. Message thread ────────────────────────────────────────────────────
    await admin.from("message_threads").upsert([
      {
        id: THREAD_ID,
        studio_id: DEMO_STUDIO_ID,
        student_id: STUDENT_IDS.emma,
      },
    ], { onConflict: "id" });

    await admin.from("messages").upsert([
      {
        id: "dddddddd-eeee-ffff-8000-111111111101",
        thread_id: THREAD_ID,
        studio_id: DEMO_STUDIO_ID,
        sender_user_id: teacherUserId,
        body: "Hi! Just a reminder that Emma's recital piece is due for final run-through next lesson. She's doing great! 🎵",
      },
      {
        id: "dddddddd-eeee-ffff-8000-111111111102",
        thread_id: THREAD_ID,
        studio_id: DEMO_STUDIO_ID,
        sender_user_id: parentUserId,
        body: "Thank you! She has been practising every day this week. Looking forward to the lesson!",
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
