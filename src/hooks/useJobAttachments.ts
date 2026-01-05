import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/useSupabase";
import { notifications } from "@mantine/notifications";
import { useUser } from "@clerk/nextjs";
import { Tables } from "@/types/db";

export function useJobAttachments(jobId: number) {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: attachments, isLoading } = useQuery({
    queryKey: ["job_attachments", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_attachments")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Tables<"job_attachments">[];
    },
    enabled: !!jobId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      category,
      silent = false, // Add silent flag, default to false
    }: {
      file: File;
      category: string;
      silent?: boolean;
    }) => {
      // Fix: Add a random string and the original name to ensure uniqueness
      const fileExt = file.name.split(".").pop();
      const uniqueSuffix = Math.random().toString(36).substring(2, 10);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      const fileName = `${jobId}/${category}/${Date.now()}_${uniqueSuffix}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("job_files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("job_attachments").insert({
        job_id: jobId,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user?.username || "Staff",
        category: category,
      });

      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job_attachments", jobId] });
      
      // Only show notification if NOT silent
      if (!variables.silent) {
        notifications.show({
          title: "Success",
          message: "File uploaded successfully",
          color: "green",
        });
      }
    },
    onError: (error: any) => {
      // We generally want to know about errors, even in bulk
      notifications.show({
        title: "Upload Failed",
        message: error.message,
        color: "red",
      });
    },
  });

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("job_files").getPublicUrl(path);
    return data.publicUrl;
  };

  return {
    attachments,
    isLoading,
    uploadFile: uploadMutation.mutate,
    uploadFileAsync: uploadMutation.mutateAsync, // Expose async version for Promise.all
    isUploading: uploadMutation.isPending,
    getPublicUrl,
  };
}