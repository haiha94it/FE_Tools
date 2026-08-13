/** Catalog public types — khớp serializer BE */

export type Profession = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  tool_count?: number;
};

export type ToolListItem = {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  profession_slug: string;
  profession_name: string;
  is_public: boolean;
  require_login: boolean;
  is_featured: boolean;
  compute_mode: string;
  usage_count: number;
  view_count: number;
  tags: { id: number; slug: string; name: string }[];
  version: string;
};

export type ToolDetail = ToolListItem & {
  long_description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
