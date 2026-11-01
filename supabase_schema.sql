-- ==============================================================================
-- LIBRARIUM - ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- ==============================================================================
-- Instrucciones:
-- 1. Inicia sesión en tu cuenta de Supabase (https://supabase.com/dashboard)
-- 2. Entra en tu proyecto y dirígete al menú "SQL Editor" en la barra lateral izquierda
-- 3. Crea una "New Query", pega todo este contenido y presiona "Run"
-- ==============================================================================

-- 1. Crear la tabla de libros
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT DEFAULT '',
  page_count INTEGER NOT NULL DEFAULT 0,
  published_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  isbn TEXT,
  categories TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'read' CHECK (status IN ('read', 'reading', 'want_to_read')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT DEFAULT '',
  pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la seguridad a nivel de fila (Row Level Security - RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad: Cada usuario solo puede ver, insertar, actualizar y borrar sus propios libros
DROP POLICY IF EXISTS "Users can view their own books" ON public.books;
CREATE POLICY "Users can view their own books"
  ON public.books FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
CREATE POLICY "Users can insert their own books"
  ON public.books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
CREATE POLICY "Users can update their own books"
  ON public.books FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
CREATE POLICY "Users can delete their own books"
  ON public.books FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Índice para optimizar consultas de lectura ordenadas por fecha
CREATE INDEX IF NOT EXISTS idx_books_user_dates ON public.books(user_id, end_date DESC);

-- Migración v2: ejecutar también en proyectos existentes.
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher TEXT DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS language TEXT DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS sessions JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS public.reading_goals (
 user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 9999),
 goal INTEGER NOT NULL CHECK (goal BETWEEN 1 AND 500),
 PRIMARY KEY(user_id, year)
);
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_goals ON public.reading_goals;
CREATE POLICY own_goals ON public.reading_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sustitución atómica: cualquier error revierte toda la importación.
CREATE OR REPLACE FUNCTION public.replace_my_library(payload JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF payload IS NULL OR jsonb_typeof(payload) <> 'array' THEN RAISE EXCEPTION 'Expected array'; END IF;
 DELETE FROM public.books WHERE user_id = auth.uid();
 INSERT INTO public.books SELECT (jsonb_populate_record(NULL::public.books, item || jsonb_build_object('user_id', auth.uid()))).* FROM jsonb_array_elements(payload) item;
END; $$;
REVOKE ALL ON FUNCTION public.replace_my_library(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_my_library(JSONB) TO authenticated;
