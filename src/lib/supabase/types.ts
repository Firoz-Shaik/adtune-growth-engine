export type AppRole = "admin" | "editor";
export type BlogPostStatus = "draft" | "review" | "scheduled" | "published" | "archived";

export function isStaffRole(role: string | null | undefined): role is AppRole {
  return role === "admin" || role === "editor";
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Media {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string;
  bucket_name: string;
  created_at: string;
  deleted_at: string | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_media_id: string | null;
  author_id: string;
  category_id: string;
  status: BlogPostStatus;
  published_at: string | null;
  scheduled_at: string | null;
  archived_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type BlogPostInput = Pick<
  BlogPost,
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "featured_media_id"
  | "category_id"
  | "status"
  | "published_at"
  | "archived_at"
  | "meta_title"
  | "meta_description"
  | "focus_keyword"
>;

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        { id: string; full_name?: string | null; role?: AppRole },
        { full_name?: string | null; role?: AppRole; deleted_at?: string | null }
      >;
      categories: Table<
        Category,
        { id?: string; name: string; slug: string; description?: string | null },
        { name?: string; slug?: string; description?: string | null; deleted_at?: string | null }
      >;
      tags: Table<
        Tag,
        { id?: string; name: string; slug: string },
        { name?: string; slug?: string; deleted_at?: string | null }
      >;
      blog_post_tags: Table<
        { blog_post_id: string; tag_id: string },
        { blog_post_id: string; tag_id: string },
        { blog_post_id?: string; tag_id?: string }
      >;
      media: Table<
        Media,
        {
          id?: string;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          width?: number | null;
          height?: number | null;
          alt_text?: string | null;
          uploaded_by: string;
          bucket_name?: string;
        },
        { alt_text?: string | null; deleted_at?: string | null }
      >;
      blog_posts: Table<
        BlogPost,
        Partial<BlogPost> & { title: string; slug: string; author_id: string },
        Partial<BlogPostInput> & { deleted_at?: string | null }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { app_role: AppRole; blog_post_status: BlogPostStatus };
    CompositeTypes: Record<string, never>;
  };
}
