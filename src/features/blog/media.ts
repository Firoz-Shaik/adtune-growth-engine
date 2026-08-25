import { supabase } from "@/lib/supabase/client";

const bucket = "blog-media";
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

function imageSize(file: File) {
  return new Promise<{ width: number; height: number } | { width: null; height: null }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    image.src = url;
  });
}

export async function uploadFeaturedMedia(file: File, userId: string, postId: string, altText = "") {
  if (!allowedTypes.includes(file.type)) throw new Error("Use a JPEG, PNG, or WebP image.");
  if (file.size > 4 * 1024 * 1024) throw new Error("Images must be smaller than 4 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${userId}/${postId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const size = await imageSize(file);
  const { data, error } = await supabase
    .from("media")
    .insert({
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      width: size.width,
      height: size.height,
      alt_text: altText || file.name,
      uploaded_by: userId,
      bucket_name: bucket,
    })
    .select("id, storage_path, alt_text, bucket_name")
    .single();
  if (error) throw error;
  return data;
}
