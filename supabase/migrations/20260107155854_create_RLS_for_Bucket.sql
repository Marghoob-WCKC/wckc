



DROP POLICY IF EXISTS "Allow ALL RLS o59enp_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow ALL RLS o59enp_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow ALL RLS o59enp_2" ON storage.objects;


DROP POLICY IF EXISTS "Authenticated users can select job_files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload job_files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update job_files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete job_files" ON storage.objects;




CREATE POLICY "Authenticated users can select job_files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'job_files');


CREATE POLICY "Authenticated users can upload job_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job_files');


CREATE POLICY "Authenticated users can update job_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'job_files');


CREATE POLICY "Authenticated users can delete job_files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job_files');



--Table

ALTER TABLE "public"."job_attachments" ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Enable delete for admin only" ON "public"."job_attachments";
DROP POLICY IF EXISTS "Enable insert for all roles" ON "public"."job_attachments";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."job_attachments";
DROP POLICY IF EXISTS "Enable update for all roles" ON "public"."job_attachments";
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "public"."job_attachments";


CREATE POLICY "Enable all operations for authenticated users"
ON "public"."job_attachments"
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);