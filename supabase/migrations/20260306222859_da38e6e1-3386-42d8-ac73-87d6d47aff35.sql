ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE public.students ADD CONSTRAINT students_status_check 
  CHECK (status = ANY (ARRAY['active'::text, 'waiting'::text, 'paused'::text, 'pending_payment'::text]));