-- HARVIE AI AGENT — SUPABASE DATABASE SCHEMA
-- Product Photography Director
-- Architecture: Product Identity Preserved, Photography Directed

-- 1. Profiles Table (Optional Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'footwear',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Product Sources (Raw authoritative images)
CREATE TABLE IF NOT EXISTS public.product_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  tag TEXT DEFAULT 'general',
  width INT,
  height INT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Product Blueprints (Structured Internal Source of Truth)
CREATE TABLE IF NOT EXISTS public.product_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  blueprint_json JSONB NOT NULL,
  confidence NUMERIC(4,3) DEFAULT 0.95,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Reference Images (Optional Photography Direction Only)
CREATE TABLE IF NOT EXISTS public.references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  analysis_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Generations (Runs)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'generating', 'completed', 'failed'
  settings_json JSONB NOT NULL,
  locks_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Generation Outputs (Individual images)
CREATE TABLE IF NOT EXISTS public.generation_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  prompt TEXT NOT NULL,
  angle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'passed', -- 'passed', 'rejected', 'regenerated'
  consistency_score INT NOT NULL,
  validation_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Validation Results (Audit logs)
CREATE TABLE IF NOT EXISTS public.validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_id UUID REFERENCES public.generation_outputs(id) ON DELETE CASCADE NOT NULL,
  score INT NOT NULL,
  checks_json JSONB NOT NULL,
  status TEXT NOT NULL, -- 'pass', 'needs_regeneration'
  notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Storage Buckets (Execute in Supabase Storage SQL editor if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-sources', 'product-sources', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('references', 'references', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated', 'generated', true);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;

-- Allow public access for demo / anon MVP usage
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public insert projects" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read sources" ON public.product_sources FOR SELECT USING (true);
CREATE POLICY "Public insert sources" ON public.product_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read blueprints" ON public.product_blueprints FOR SELECT USING (true);
CREATE POLICY "Public insert blueprints" ON public.product_blueprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read generations" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Public insert generations" ON public.generations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read outputs" ON public.generation_outputs FOR SELECT USING (true);
CREATE POLICY "Public insert outputs" ON public.generation_outputs FOR INSERT WITH CHECK (true);
