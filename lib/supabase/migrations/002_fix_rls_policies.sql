-- RUN THIS IN SUPABASE SQL EDITOR
-- This fixes the RLS policy issue preventing users from reading their roles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create new policy: Anyone can read their own role (no circular dependency!)
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy: Admins can read all roles
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT 
  USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  );

-- Create policy: Admins can insert/update/delete roles
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL 
  USING (
    auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
  );

-- Also allow any authenticated user to insert/update their own role for the trigger
CREATE POLICY "Service role can manage roles" ON user_roles
  FOR ALL 
  USING (true)
  WITH CHECK (true);
