-- Point applications.resume_id at the active resumes table.
--
-- The profile-centric migration renamed the original resumes table to
-- resumes_v1_archived, so PostgreSQL kept this foreign key attached to the
-- archived table. Application creation now selects resumes from public.resumes.

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_resume_id_fkey;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_resume_id_fkey
  FOREIGN KEY (resume_id)
  REFERENCES public.resumes(id)
  ON DELETE SET NULL;
