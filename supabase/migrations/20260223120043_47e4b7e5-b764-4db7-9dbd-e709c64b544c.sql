
-- Create lesson_requests table matching student fields
CREATE TABLE public.lesson_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  parent_name TEXT,
  parent_email TEXT,
  preferred_level TEXT NOT NULL DEFAULT 'Grade 1',
  preferred_day TEXT,
  preferred_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_requests ENABLE ROW LEVEL SECURITY;

-- Parents can view their own requests
CREATE POLICY "Parents can view own requests"
ON public.lesson_requests
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

-- Parents can insert their own requests
CREATE POLICY "Parents can insert own requests"
ON public.lesson_requests
FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all requests"
ON public.lesson_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_lesson_requests_updated_at
BEFORE UPDATE ON public.lesson_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
