
-- ============================================================
-- GROUP CLASSES SCHEMA (MVP)
-- ============================================================

-- A) classes
CREATE TABLE public.classes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name             text NOT NULL,
  teacher_user_id  uuid NOT NULL,
  capacity         int,
  default_day      text,
  default_time     text,
  duration_minutes int NOT NULL DEFAULT 60,
  status           text NOT NULL DEFAULT 'active',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage classes"
  ON public.classes FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- B) class_members
CREATE TABLE public.class_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'active',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage class members"
  ON public.class_members FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents view class memberships of their children"
  ON public.class_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = class_members.student_id AND s.parent_user_id = auth.uid()
  ));

-- C) class_sessions
CREATE TABLE public.class_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id   uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'scheduled',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage class sessions"
  ON public.class_sessions FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents view sessions for their children classes"
  ON public.class_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.students s ON s.id = cm.student_id
    WHERE cm.class_id = class_sessions.class_id
      AND s.parent_user_id = auth.uid()
      AND cm.status = 'active'
  ));

CREATE TRIGGER update_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- D) class_attendance
CREATE TABLE public.class_attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance       text NOT NULL DEFAULT 'scheduled',
  note             text,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_session_id, student_id)
);

ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage class attendance"
  ON public.class_attendance FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents view their child class attendance"
  ON public.class_attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = class_attendance.student_id AND s.parent_user_id = auth.uid()
  ));

CREATE TRIGGER update_class_attendance_updated_at
  BEFORE UPDATE ON public.class_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- E) class_session_notes
CREATE TABLE public.class_session_notes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  notes_text       text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage session notes"
  ON public.class_session_notes FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents view session notes for their children classes"
  ON public.class_session_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.class_sessions cs
    JOIN public.class_members cm ON cm.class_id = cs.class_id
    JOIN public.students s ON s.id = cm.student_id
    WHERE cs.id = class_session_notes.class_session_id
      AND s.parent_user_id = auth.uid()
      AND cm.status = 'active'
  ));

CREATE TRIGGER update_class_session_notes_updated_at
  BEFORE UPDATE ON public.class_session_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- F) class_homework
CREATE TABLE public.class_homework (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id        uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  title            text,
  body_json        jsonb NOT NULL DEFAULT '[]'::jsonb,
  status           text NOT NULL DEFAULT 'active',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage class homework"
  ON public.class_homework FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents view class homework for their children sessions"
  ON public.class_homework FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.class_sessions cs
    JOIN public.class_members cm ON cm.class_id = cs.class_id
    JOIN public.students s ON s.id = cm.student_id
    WHERE cs.id = class_homework.class_session_id
      AND s.parent_user_id = auth.uid()
      AND cm.status = 'active'
  ));

CREATE TRIGGER update_class_homework_updated_at
  BEFORE UPDATE ON public.class_homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- G) class_homework_completion
CREATE TABLE public.class_homework_completion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id         uuid REFERENCES public.studios(id) ON DELETE CASCADE,
  class_homework_id uuid NOT NULL REFERENCES public.class_homework(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  body_json         jsonb NOT NULL DEFAULT '[]'::jsonb,
  status            text NOT NULL DEFAULT 'active',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_homework_id, student_id)
);

ALTER TABLE public.class_homework_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage homework completion"
  ON public.class_homework_completion FOR ALL
  USING (public.owns_studio(studio_id))
  WITH CHECK (public.owns_studio(studio_id));

CREATE POLICY "Parents manage their child homework completion"
  ON public.class_homework_completion FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = class_homework_completion.student_id AND s.parent_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = class_homework_completion.student_id AND s.parent_user_id = auth.uid()
  ));

CREATE TRIGGER update_class_homework_completion_updated_at
  BEFORE UPDATE ON public.class_homework_completion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- H) Extend recap_messages with group session fields
ALTER TABLE public.recap_messages
  ADD COLUMN IF NOT EXISTS class_session_id uuid REFERENCES public.class_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- I) Extend files table with group session fields
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS class_session_id uuid REFERENCES public.class_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;
