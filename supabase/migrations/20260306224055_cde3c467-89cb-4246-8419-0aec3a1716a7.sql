-- Add lesson_request_id to students for deduplication
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS lesson_request_id uuid REFERENCES public.lesson_requests(id) ON DELETE SET NULL;

-- Unique constraint: one student per lesson request (allows NULL for manually-added students)
CREATE UNIQUE INDEX IF NOT EXISTS students_lesson_request_id_unique 
  ON public.students (lesson_request_id) 
  WHERE lesson_request_id IS NOT NULL;
