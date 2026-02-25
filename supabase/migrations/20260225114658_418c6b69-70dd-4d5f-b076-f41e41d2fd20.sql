
-- Table to store per-page annotations on score files
CREATE TABLE public.score_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 1,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, page_number, created_by)
);

ALTER TABLE public.score_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all annotations"
ON public.score_annotations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parents can view annotations for their children files"
ON public.score_annotations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM files f
  JOIN students s ON s.id = f.student_id
  WHERE f.id = score_annotations.file_id
  AND s.parent_user_id = auth.uid()
));

CREATE TRIGGER update_score_annotations_updated_at
BEFORE UPDATE ON public.score_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
