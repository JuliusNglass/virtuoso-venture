
-- Recap messages table
CREATE TABLE public.recap_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  sent_by_user_id UUID,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  email_to TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.recap_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners manage recaps" ON public.recap_messages FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view their child recaps" ON public.recap_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = recap_messages.student_id AND s.parent_user_id = auth.uid()
  ));

-- Homework assignments table
CREATE TABLE public.homework_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners manage homework" ON public.homework_assignments FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view their child homework" ON public.homework_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = homework_assignments.student_id AND s.parent_user_id = auth.uid()
  ));
CREATE POLICY "Parents update homework status" ON public.homework_assignments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = homework_assignments.student_id AND s.parent_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = homework_assignments.student_id AND s.parent_user_id = auth.uid()
  ));

-- Practice logs table
CREATE TABLE public.practice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  logged_by UUID,
  practice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners view practice logs" ON public.practice_logs FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents manage their child practice logs" ON public.practice_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = practice_logs.student_id AND s.parent_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = practice_logs.student_id AND s.parent_user_id = auth.uid()
  ));

-- Message threads
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners access threads" ON public.message_threads FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view their threads" ON public.message_threads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = message_threads.student_id AND s.parent_user_id = auth.uid()
  ));

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studio owners manage messages" ON public.messages FOR ALL
  USING (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owns_studio(studio_id) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents view messages in their threads" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.message_threads mt
    JOIN public.students s ON s.id = mt.student_id
    WHERE mt.id = messages.thread_id AND s.parent_user_id = auth.uid()
  ));
CREATE POLICY "Parents insert messages" ON public.messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.message_threads mt
      JOIN public.students s ON s.id = mt.student_id
      WHERE mt.id = messages.thread_id AND s.parent_user_id = auth.uid()
    )
  );

-- Timestamps trigger for homework
CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
