
-- 1. Update get_my_studio_id() to also check user_roles
CREATE OR REPLACE FUNCTION public.get_my_studio_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT id FROM public.studios WHERE owner_user_id = auth.uid() LIMIT 1),
    (SELECT studio_id FROM public.user_roles WHERE user_id = auth.uid() AND studio_id IS NOT NULL LIMIT 1)
  );
$$;

-- 2. Fix classes RLS — add has_role fallback
DROP POLICY IF EXISTS "Studio owners manage classes" ON public.classes;
CREATE POLICY "Studio owners manage classes"
  ON public.classes FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix class_sessions RLS
DROP POLICY IF EXISTS "Studio owners manage class sessions" ON public.class_sessions;
CREATE POLICY "Studio owners manage class sessions"
  ON public.class_sessions FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix class_attendance RLS
DROP POLICY IF EXISTS "Studio owners manage class attendance" ON public.class_attendance;
CREATE POLICY "Studio owners manage class attendance"
  ON public.class_attendance FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Fix class_members RLS
DROP POLICY IF EXISTS "Studio owners manage class members" ON public.class_members;
CREATE POLICY "Studio owners manage class members"
  ON public.class_members FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix class_session_notes RLS
DROP POLICY IF EXISTS "Studio owners manage session notes" ON public.class_session_notes;
CREATE POLICY "Studio owners manage session notes"
  ON public.class_session_notes FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 7. Fix class_homework RLS
DROP POLICY IF EXISTS "Studio owners manage class homework" ON public.class_homework;
CREATE POLICY "Studio owners manage class homework"
  ON public.class_homework FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 8. Fix studio_email_templates RLS
DROP POLICY IF EXISTS "Studio owners manage their email templates" ON public.studio_email_templates;
CREATE POLICY "Studio owners manage their email templates"
  ON public.studio_email_templates FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 9. Allow users to insert their own role row (needed for onboarding self-signup)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());
