
-- Add internal_label to students for disambiguation
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS internal_label text;

-- Create studio_email_templates table to persist recap email templates and billing mode
CREATE TABLE IF NOT EXISTS public.studio_email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'Lesson Recap – {{student_name}} – {{lesson_date}}',
  body text NOT NULL DEFAULT E'Hi there,\n\nHere is the recap for {{student_name}}''s lesson on {{lesson_date}}.\n\n**Notes:**\n{{notes}}\n\n**Homework:**\n{{homework}}\n\nSee you next time!\n',
  billing_mode text NOT NULL DEFAULT 'per_lesson',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (studio_id)
);

ALTER TABLE public.studio_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners manage their email templates"
  ON public.studio_email_templates
  FOR ALL
  USING (owns_studio(studio_id))
  WITH CHECK (owns_studio(studio_id));

CREATE TRIGGER update_studio_email_templates_updated_at
  BEFORE UPDATE ON public.studio_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
