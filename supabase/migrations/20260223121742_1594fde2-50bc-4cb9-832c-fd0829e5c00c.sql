
-- Add parent_phone to lesson_requests
ALTER TABLE public.lesson_requests ADD COLUMN IF NOT EXISTS parent_phone text;

-- Add parent_phone to students  
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone text;
