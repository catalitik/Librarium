-- Ejecutar en el SQL Editor del proyecto Supabase. Solo consulta metadatos.
-- Todas las filas deben indicar ok = true. No prueba el flujo de usuario ni modifica datos.
WITH expected_columns(table_name, column_name, data_type) AS (
 VALUES
 ('books', 'publisher', 'text'),
 ('books', 'language', 'text'),
 ('books', 'sessions', 'jsonb'),
 ('books', 'pages_read', 'integer'),
 ('reading_goals', 'user_id', 'uuid'),
 ('reading_goals', 'year', 'integer'),
 ('reading_goals', 'goal', 'integer')
), checks AS (
 SELECT 'Columna ' || e.table_name || '.' || e.column_name AS check_name,
 EXISTS (SELECT 1 FROM information_schema.columns c
 WHERE c.table_schema = 'public' AND c.table_name = e.table_name
 AND c.column_name = e.column_name AND c.data_type = e.data_type) AS ok
 FROM expected_columns e
 UNION ALL
 SELECT 'RLS ' || name, EXISTS (
 SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relname = name AND c.relrowsecurity)
 FROM (VALUES ('books'), ('reading_goals')) AS tables(name)
 UNION ALL
 SELECT 'RPC replace_my_library(jsonb), invoker', EXISTS (
 SELECT 1 FROM pg_proc p
 WHERE p.oid = to_regprocedure('public.replace_my_library(jsonb)')
 AND NOT p.prosecdef AND p.prorettype = 'void'::regtype)
 UNION ALL
 SELECT 'RPC ejecutable por authenticated', COALESCE(
 has_function_privilege('authenticated', to_regprocedure('public.replace_my_library(jsonb)'), 'EXECUTE'), false)
 UNION ALL
 SELECT 'RPC no ejecutable por anon', NOT COALESCE(
 has_function_privilege('anon', to_regprocedure('public.replace_my_library(jsonb)'), 'EXECUTE'), true)
 UNION ALL
 SELECT 'RPC rechaza payload SQL NULL', EXISTS (
 SELECT 1 FROM pg_proc p WHERE p.oid = to_regprocedure('public.replace_my_library(jsonb)')
 AND p.prosrc ~* 'payload\s+IS\s+NULL')
)
SELECT * FROM checks ORDER BY check_name;

-- Revisar las expresiones: deben limitar las operaciones a auth.uid() = user_id.
-- Inspeccionar también políticas adicionales, pues pueden ampliar el acceso.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('books', 'reading_goals')
ORDER BY tablename, policyname;

-- Las tablas necesitan permisos además de RLS.
SELECT t AS table_name, privilege,
 COALESCE(has_table_privilege('authenticated', to_regclass('public.' || t), privilege), false) AS ok
FROM (VALUES ('books'), ('reading_goals')) AS tables(t)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS privileges(privilege);
