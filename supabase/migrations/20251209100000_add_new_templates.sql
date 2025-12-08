-- Phase 2: Add new resume templates
-- 添加新的简历模板配置

-- Creative Gradient - 双栏渐变创意风格
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'creative-gradient',
  'Creative Gradient',
  'Modern two-column layout with gradient accent colors. Perfect for creative and design positions.',
  'creative',
  '{
    "colors": {
      "primary": "#8B5CF6",
      "secondary": "#EC4899",
      "text": "#1F2937",
      "textLight": "#6B7280",
      "background": "#FFFFFF",
      "accent": "#F5F3FF"
    },
    "fonts": {
      "heading": "Helvetica-Bold",
      "body": "Helvetica",
      "headingSize": 14,
      "bodySize": 10
    },
    "layout": "two-column",
    "sections_order": ["header", "summary", "skills", "experience", "projects", "education", "certifications"],
    "spacing": {
      "sectionGap": 15,
      "itemGap": 10,
      "lineHeight": 1.4
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Executive Minimal - 极简高管风格
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'executive-minimal',
  'Executive Minimal',
  'Clean minimalist design with generous whitespace. Ideal for senior and executive positions.',
  'classic',
  '{
    "colors": {
      "primary": "#111827",
      "secondary": "#374151",
      "text": "#111827",
      "textLight": "#6B7280",
      "background": "#FFFFFF",
      "accent": "#F9FAFB"
    },
    "fonts": {
      "heading": "Times-Bold",
      "body": "Times-Roman",
      "headingSize": 16,
      "bodySize": 11
    },
    "layout": "single-column",
    "sections_order": ["header", "summary", "experience", "education", "skills", "certifications"],
    "spacing": {
      "sectionGap": 20,
      "itemGap": 14,
      "lineHeight": 1.6
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Technical Dark - 深色技术风格
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'technical-dark',
  'Technical Dark',
  'Dark theme with monospace accents. Perfect for software engineers and tech professionals.',
  'modern',
  '{
    "colors": {
      "primary": "#10B981",
      "secondary": "#34D399",
      "text": "#1F2937",
      "textLight": "#6B7280",
      "background": "#FFFFFF",
      "accent": "#D1FAE5"
    },
    "fonts": {
      "heading": "Helvetica-Bold",
      "body": "Courier",
      "headingSize": 14,
      "bodySize": 10
    },
    "layout": "single-column",
    "sections_order": ["header", "summary", "skills", "experience", "projects", "education", "certifications"],
    "spacing": {
      "sectionGap": 14,
      "itemGap": 10,
      "lineHeight": 1.4
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Industry-specific templates

-- Tech Engineer - 技术工程师专用
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'tech-engineer',
  'Software Engineer',
  'Optimized layout for software engineering roles. Emphasizes technical skills and projects.',
  'industry',
  '{
    "colors": {
      "primary": "#0EA5E9",
      "secondary": "#38BDF8",
      "text": "#0F172A",
      "textLight": "#64748B",
      "background": "#FFFFFF",
      "accent": "#E0F2FE"
    },
    "fonts": {
      "heading": "Helvetica-Bold",
      "body": "Helvetica",
      "headingSize": 14,
      "bodySize": 10
    },
    "layout": "single-column",
    "sections_order": ["header", "summary", "skills", "experience", "projects", "education", "certifications"],
    "spacing": {
      "sectionGap": 14,
      "itemGap": 10,
      "lineHeight": 1.4
    },
    "default_emphasis": {
      "skills": 95,
      "projects": 90,
      "experience": 85,
      "education": 60
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Finance Analyst - 金融分析师专用
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'finance-analyst',
  'Financial Analyst',
  'Professional formal design for finance industry. Conservative colors and serif fonts.',
  'industry',
  '{
    "colors": {
      "primary": "#1E40AF",
      "secondary": "#3B82F6",
      "text": "#1E293B",
      "textLight": "#64748B",
      "background": "#FFFFFF",
      "accent": "#DBEAFE"
    },
    "fonts": {
      "heading": "Times-Bold",
      "body": "Times-Roman",
      "headingSize": 14,
      "bodySize": 10
    },
    "layout": "single-column",
    "sections_order": ["header", "summary", "experience", "education", "certifications", "skills"],
    "spacing": {
      "sectionGap": 16,
      "itemGap": 12,
      "lineHeight": 1.5
    },
    "default_emphasis": {
      "experience": 95,
      "education": 85,
      "certifications": 80,
      "skills": 70
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Creative Designer - 创意设计师专用
INSERT INTO public.resume_templates (id, name, description, category, config, preview_url, supports_pdf, supports_html, is_active)
VALUES (
  'creative-designer',
  'Creative Designer',
  'Bold visual-first design for creative professionals. Two-column layout with vibrant colors.',
  'industry',
  '{
    "colors": {
      "primary": "#EC4899",
      "secondary": "#8B5CF6",
      "text": "#18181B",
      "textLight": "#71717A",
      "background": "#FFFFFF",
      "accent": "#FDF2F8"
    },
    "fonts": {
      "heading": "Helvetica-Bold",
      "body": "Helvetica",
      "headingSize": 15,
      "bodySize": 10
    },
    "layout": "two-column",
    "sections_order": ["header", "summary", "projects", "skills", "experience", "education"],
    "spacing": {
      "sectionGap": 15,
      "itemGap": 10,
      "lineHeight": 1.4
    },
    "default_emphasis": {
      "projects": 95,
      "skills": 90,
      "experience": 75,
      "education": 50
    }
  }'::jsonb,
  NULL,
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Comment on new templates
COMMENT ON TABLE public.resume_templates IS 'Resume templates with 7 total options: 2 original (modern-blue, classic-serif) + 3 new styles (creative-gradient, executive-minimal, technical-dark) + 3 industry-specific (tech-engineer, finance-analyst, creative-designer)';
