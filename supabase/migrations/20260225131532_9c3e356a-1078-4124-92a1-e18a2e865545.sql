
-- ============================================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- ============================================================

-- 1. Create studios table
CREATE TABLE public.studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

-- Studio owners can manage their own studio
CREATE POLICY "Owners can manage their studio"
  ON public.studios
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Anyone authenticated can read studio info (needed for parent portal to show studio name)
CREATE POLICY "Authenticated users can view studios"
  ON public.studios
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON public.studios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add studio_id to students (nullable for backward compat with existing data)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;

-- 3. Add studio_id to lesson_requests (nullable for backward compat)
ALTER TABLE public.lesson_requests
  ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;

-- 4. Add studio_id to user_roles so parent roles are scoped per studio
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE CASCADE;

-- 5. Helper function: get the studio owned by the current user
CREATE OR REPLACE FUNCTION public.get_my_studio_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.studios WHERE owner_user_id = auth.uid() LIMIT 1;
$$;

-- 6. Helper function: check if current user owns a specific studio
CREATE OR REPLACE FUNCTION public.owns_studio(_studio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.studios
    WHERE id = _studio_id AND owner_user_id = auth.uid()
  );
$$;

-- ============================================================
-- UPDATE RLS POLICIES ON STUDENTS
-- Drop old policies and replace with studio-aware ones
-- ============================================================

DROP POLICY IF EXISTS "Admins can do everything with students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;

-- Studio owners can manage all students in their studio
CREATE POLICY "Studio owners manage their students"
  ON public.students
  FOR ALL
  USING (
    (studio_id IS NOT NULL AND owns_studio(studio_id))
    OR (studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  )
  WITH CHECK (
    (studio_id IS NOT NULL AND owns_studio(studio_id))
    OR (studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  );

-- Parents can view their own children
CREATE POLICY "Parents can view their children"
  ON public.students
  FOR SELECT
  USING (parent_user_id = auth.uid());

-- ============================================================
-- UPDATE RLS POLICIES ON LESSONS
-- ============================================================

DROP POLICY IF EXISTS "Admins can do everything with lessons" ON public.lessons;
DROP POLICY IF EXISTS "Parents can view their child lessons" ON public.lessons;

-- Studio owners manage all lessons via their students
CREATE POLICY "Studio owners manage their lessons"
  ON public.lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = lessons.student_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = lessons.student_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );

-- Parents can view lessons for their children
CREATE POLICY "Parents can view their child lessons"
  ON public.lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = lessons.student_id AND s.parent_user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATE RLS POLICIES ON FILES
-- ============================================================

DROP POLICY IF EXISTS "Admins can do everything with files" ON public.files;
DROP POLICY IF EXISTS "Parents can view files for their children" ON public.files;

CREATE POLICY "Studio owners manage their files"
  ON public.files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = files.student_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
    OR (
      files.student_id IS NULL AND (
        (get_my_studio_id() IS NOT NULL)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = files.student_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
    OR (
      files.student_id IS NULL AND (
        (get_my_studio_id() IS NOT NULL)
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Parents can view files for their children
CREATE POLICY "Parents can view files for their children"
  ON public.files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = files.student_id AND s.parent_user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATE RLS POLICIES ON LESSON_REQUESTS
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all requests" ON public.lesson_requests;
DROP POLICY IF EXISTS "Parents can insert own requests" ON public.lesson_requests;
DROP POLICY IF EXISTS "Parents can view own requests" ON public.lesson_requests;

-- Studio owners manage requests for their studio
CREATE POLICY "Studio owners manage their requests"
  ON public.lesson_requests
  FOR ALL
  USING (
    (studio_id IS NOT NULL AND owns_studio(studio_id))
    OR (studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  )
  WITH CHECK (
    (studio_id IS NOT NULL AND owns_studio(studio_id))
    OR (studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  );

-- Parents can insert requests
CREATE POLICY "Parents can insert own requests"
  ON public.lesson_requests
  FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

-- Parents can view their own requests
CREATE POLICY "Parents can view own requests"
  ON public.lesson_requests
  FOR SELECT
  USING (parent_user_id = auth.uid());

-- ============================================================
-- UPDATE RLS POLICIES ON SCORE_ANNOTATIONS
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all annotations" ON public.score_annotations;

CREATE POLICY "Studio owners manage their annotations"
  ON public.score_annotations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.students s ON s.id = f.student_id
      WHERE f.id = score_annotations.file_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.files f
        WHERE f.id = score_annotations.file_id AND f.student_id IS NULL
        AND (get_my_studio_id() IS NOT NULL OR has_role(auth.uid(), 'admin'::app_role))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.students s ON s.id = f.student_id
      WHERE f.id = score_annotations.file_id
      AND (
        (s.studio_id IS NOT NULL AND owns_studio(s.studio_id))
        OR (s.studio_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.files f
        WHERE f.id = score_annotations.file_id AND f.student_id IS NULL
        AND (get_my_studio_id() IS NOT NULL OR has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );
