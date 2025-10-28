/*
  # Fix Admin Update Policy to Use Public Users Table

  1. Purpose
    - Fix RLS policy to check admin status and team_id from public.users table
    - Previous policy relied on JWT metadata which may not be populated

  2. Changes
    - Drop old policy that checks auth.jwt() user_metadata
    - Create new policy that queries public.users table directly
    - Admins can update team members on their same team

  3. Security
    - Admins verified by checking public.users.role = 'admin'
    - Team membership verified by matching public.users.team_id
    - Prevents cross-team updates
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can update team members" ON public.users;

-- Create new policy that checks public.users table
CREATE POLICY "Admins can update team members"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if current user is an admin with matching team_id
    EXISTS (
      SELECT 1 FROM public.users current_user
      WHERE current_user.id = auth.uid()
        AND current_user.role = 'admin'
        AND current_user.team_id IS NOT NULL
        AND current_user.team_id = public.users.team_id
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK - ensure target user stays on same team
    EXISTS (
      SELECT 1 FROM public.users current_user
      WHERE current_user.id = auth.uid()
        AND current_user.role = 'admin'
        AND current_user.team_id IS NOT NULL
        AND current_user.team_id = public.users.team_id
    )
  );
