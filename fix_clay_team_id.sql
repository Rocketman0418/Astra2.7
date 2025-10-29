/*
  Fix team_id for clay@rockethub.ai

  This script will:
  1. Check current state of public.users for clay@rockethub.ai
  2. Update team_id to correct value: e2174edc-4291-4509-81e6-7293a769c41f
  3. The trigger will automatically sync this to auth.users.raw_user_meta_data
*/

-- First, check what's currently in public.users
SELECT
  id,
  email,
  name,
  team_id,
  role,
  view_financial
FROM public.users
WHERE email = 'clay@rockethub.ai';

-- Update clay@rockethub.ai to have the correct team_id
-- Replace 'YOUR_USER_ID_HERE' with clay's actual user ID from auth.users
UPDATE public.users
SET
  team_id = 'e2174edc-4291-4509-81e6-7293a769c41f',
  role = 'admin',  -- Set appropriate role
  view_financial = true  -- Set appropriate permission
WHERE email = 'clay@rockethub.ai';

-- If the user doesn't exist in public.users, you need to insert them
-- Get the user ID from auth.users first, then run:
/*
INSERT INTO public.users (id, email, name, team_id, role, view_financial)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'e2174edc-4291-4509-81e6-7293a769c41f',
  'admin',
  true
FROM auth.users
WHERE email = 'clay@rockethub.ai'
ON CONFLICT (id) DO UPDATE
SET
  team_id = 'e2174edc-4291-4509-81e6-7293a769c41f',
  role = 'admin',
  view_financial = true;
*/

-- Verify the update worked
SELECT
  id,
  email,
  name,
  team_id,
  role,
  view_financial
FROM public.users
WHERE email = 'clay@rockethub.ai';

-- Verify it synced to auth.users (requires service role)
SELECT
  email,
  raw_user_meta_data->>'team_id' as metadata_team_id,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data->>'view_financial' as metadata_view_financial
FROM auth.users
WHERE email = 'clay@rockethub.ai';
