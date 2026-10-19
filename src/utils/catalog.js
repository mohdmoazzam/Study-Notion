// URL-safe slug for a category name, e.g. "Web Development" -> "web-development", "AI/ML" -> "ai-ml".
export const toCatalogSlug = (name = "") =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
