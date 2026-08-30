const COLUMN_LABELS: Record<string, string> = {
  category_id: "category",
  title: "title",
  slug: "slug",
  content: "body",
  excerpt: "excerpt",
  author_id: "author",
  featured_media_id: "featured image",
};

function asRecord(error: unknown): { message?: string; code?: string; details?: string; hint?: string } {
  if (error instanceof Error) {
    const extra = error as Error & { code?: string; details?: string; hint?: string };
    return { message: extra.message, code: extra.code, details: extra.details, hint: extra.hint };
  }
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    return {
      message: typeof value.message === "string" ? value.message : undefined,
      code: typeof value.code === "string" ? value.code : undefined,
      details: typeof value.details === "string" ? value.details : undefined,
      hint: typeof value.hint === "string" ? value.hint : undefined,
    };
  }
  return { message: typeof error === "string" ? error : undefined };
}

function columnFrom(text: string) {
  return text.match(/column "([^"]+)"/i)?.[1] || text.match(/Key \(([^)]+)\)/i)?.[1] || null;
}

export function formatSaveError(error: unknown) {
  const raw = asRecord(error);
  const combined = [raw.message, raw.details, raw.hint].filter(Boolean).join(" ");
  const column = columnFrom(combined);
  const label = column ? COLUMN_LABELS[column] || column.replace(/_/g, " ") : null;

  if (raw.code === "23502" || /null value in column/i.test(combined)) {
    return label ? `Add a ${label} before saving.` : "A required field is missing.";
  }
  if (raw.code === "23505" || /duplicate key/i.test(combined)) {
    return column === "slug" || /slug/i.test(combined) ? "This slug is already used." : "A post with these details already exists.";
  }
  if (raw.code === "23503" || /foreign key/i.test(combined)) {
    return label === "category" ? "Select a valid category." : "A related record is missing. Check the category or featured image.";
  }
  if (raw.message) return raw.message;
  return "Try again.";
}
