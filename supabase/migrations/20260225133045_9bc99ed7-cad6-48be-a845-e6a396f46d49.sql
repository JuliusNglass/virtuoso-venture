
-- Create Shanika's studio
INSERT INTO public.studios (id, name, slug, owner_user_id)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Shanika Piano Academy',
  'shanika-piano-academy',
  '603b1834-62d1-456b-89fb-5ca28f00bb72'
);

-- Link all orphaned students to her studio
UPDATE public.students
SET studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE studio_id IS NULL;

-- Link all orphaned lesson requests to her studio
UPDATE public.lesson_requests
SET studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE studio_id IS NULL;

-- Ensure her user_role is admin and linked to her studio
UPDATE public.user_roles
SET studio_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE user_id = '603b1834-62d1-456b-89fb-5ca28f00bb72';
