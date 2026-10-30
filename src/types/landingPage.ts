export interface LandingPageData {
  title: string;
  slug: string;
  html: string;
  css: string;
  project_data: Record<string, unknown> | null;
  show_header_footer: boolean;
  is_active: boolean;
  updated_at: string | null;
}
