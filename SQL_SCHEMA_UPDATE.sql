-- Add 'badges' column to posts table if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';

-- Add Onboarding columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS relationship_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS relationship_note text,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS first_memory_id uuid REFERENCES posts(id),
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Policy Update (Optional but recommended)
-- Ensure users can update their own profile columns
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
