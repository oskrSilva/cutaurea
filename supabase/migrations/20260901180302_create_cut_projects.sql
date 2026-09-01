/*
# Create cut_projects table (single-tenant, no auth)

1. New Tables
- `cut_projects`
  - `id` (uuid, primary key)
  - `name` (text, not null) - project name
  - `board_width` (integer, not null) - board width in mm
  - `board_height` (integer, not null) - board height in mm
  - `kerf` (integer, not null, default 3) - saw blade kerf in mm
  - `pieces` (jsonb, not null, default '[]') - array of {id, label, width, height, quantity}
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
2. Security
- Enable RLS on `cut_projects`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen).
*/

CREATE TABLE IF NOT EXISTS cut_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Proyecto sin nombre',
  board_width integer NOT NULL DEFAULT 2440,
  board_height integer NOT NULL DEFAULT 1220,
  kerf integer NOT NULL DEFAULT 3,
  pieces jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cut_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cut_projects" ON cut_projects;
CREATE POLICY "anon_select_cut_projects" ON cut_projects FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cut_projects" ON cut_projects;
CREATE POLICY "anon_insert_cut_projects" ON cut_projects FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cut_projects" ON cut_projects;
CREATE POLICY "anon_update_cut_projects" ON cut_projects FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cut_projects" ON cut_projects;
CREATE POLICY "anon_delete_cut_projects" ON cut_projects FOR DELETE
TO anon, authenticated USING (true);
