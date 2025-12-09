insert into storage.buckets (id, name, public)
values ('job_files', 'job_files', true);

create table public.job_attachments (
  id bigint generated always as identity primary key,
  job_id bigint references public.jobs(id) on delete cascade not null,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint,
  uploaded_by text,
  created_at timestamptz default now() not null
);