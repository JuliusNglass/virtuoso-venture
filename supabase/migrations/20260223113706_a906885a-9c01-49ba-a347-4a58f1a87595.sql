
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'parent');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INT,
  level TEXT NOT NULL DEFAULT 'Grade 1',
  current_piece TEXT,
  lesson_day TEXT,
  lesson_time TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their children" ON public.students FOR SELECT USING (parent_user_id = auth.uid());

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  pieces TEXT[] DEFAULT '{}',
  homework TEXT,
  attendance TEXT NOT NULL DEFAULT 'present' CHECK (attendance IN ('present', 'absent', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view their child lessons" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = lessons.student_id AND students.parent_user_id = auth.uid())
);

-- Files table (music sheets, scores, photos)
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document' CHECK (file_type IN ('music_sheet', 'score', 'photo', 'document')),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything with files" ON public.files FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view files for their children" ON public.files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = files.student_id AND students.parent_user_id = auth.uid())
);

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-files', 'studio-files', true);

CREATE POLICY "Admins can upload files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'studio-files' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'studio-files' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete files" ON storage.objects FOR DELETE USING (
  bucket_id = 'studio-files' AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone authenticated can view studio files" ON storage.objects FOR SELECT USING (
  bucket_id = 'studio-files'
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
