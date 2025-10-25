/*
  # Migrate User Profiles to Auth User Metadata

  1. Purpose
    - Consolidate user profile data into auth.users table via raw_user_meta_data
    - Eliminate redundant user_profiles table
    - Simplify data model by using built-in Supabase auth metadata

  2. Migration Steps
    - Copy full_name and avatar_url from user_profiles to auth.users.raw_user_meta_data
    - Drop user_profiles table and related functions/triggers
    - Keep avatars storage bucket for avatar images

  3. Notes
    - This is a one-way migration
    - After this, apps should read/write profile data via auth.users.raw_user_meta_data
    - Supabase provides built-in methods to update user metadata
*/

-- Migrate existing profile data to user metadata
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN
    SELECT id, full_name, avatar_url
    FROM user_profiles
  LOOP
    -- Update user metadata with profile information
    UPDATE auth.users
    SET raw_user_meta_data =
      COALESCE(raw_user_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'full_name', profile_record.full_name,
        'avatar_url', profile_record.avatar_url
      )
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Drop trigger first
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Drop function
DROP FUNCTION IF EXISTS update_user_profiles_updated_at();

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Drop the user_profiles table
DROP TABLE IF EXISTS user_profiles;

-- Add comment explaining the change
COMMENT ON TABLE auth.users IS 'User authentication and profile data. Profile information (full_name, avatar_url) stored in raw_user_meta_data field.';
