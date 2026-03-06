
-- Fix lesson_requests RLS: allow studio owners (without user_roles entry) to manage their requests
DROP POLICY IF EXISTS "Studio owners manage their requests" ON public.lesson_requests;

CREATE POLICY "Studio owners manage their requests"
ON public.lesson_requests
FOR ALL
USING (
  (studio_id IS NOT NULL AND owns_studio(studio_id))
  OR (studio_id IS NULL AND (has_role(auth.uid(), 'admin'::app_role) OR get_my_studio_id() IS NOT NULL))
)
WITH CHECK (
  (studio_id IS NOT NULL AND owns_studio(studio_id))
  OR (studio_id IS NULL AND (has_role(auth.uid(), 'admin'::app_role) OR get_my_studio_id() IS NOT NULL))
);
