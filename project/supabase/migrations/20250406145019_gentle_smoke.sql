-- Drop and recreate the trigger with SECURITY DEFINER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add INSERT policy for profiles
DROP POLICY IF EXISTS "System can create user profiles" ON public.profiles;
CREATE POLICY "System can create user profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for profiles for the postgres role
DROP POLICY IF EXISTS "Postgres can create user profiles" ON public.profiles;
CREATE POLICY "Postgres can create user profiles"
  ON public.profiles
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Add policy for robots table to allow system to create robots
DROP POLICY IF EXISTS "System can create robots" ON public.robots;
CREATE POLICY "System can create robots"
  ON public.robots
  FOR INSERT
  TO postgres
  WITH CHECK (true);