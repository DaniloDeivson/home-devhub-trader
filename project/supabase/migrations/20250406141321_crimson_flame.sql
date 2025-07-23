/*
  # Complete Schema Setup for DevHub Trader

  This migration sets up the complete schema including:
  1. All necessary tables with proper relationships
  2. RLS policies with safe creation
  3. Functions and triggers with conflict handling
  4. Sharing and version control features
*/

-- Drop existing objects to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS public.sharing_invites CASCADE;
DROP TABLE IF EXISTS public.shared_robots CASCADE;
DROP TABLE IF EXISTS public.robot_versions CASCADE;
DROP TABLE IF EXISTS public.codes CASCADE;
DROP TABLE IF EXISTS public.robots CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create robots table
CREATE TABLE public.robots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, name)
);

-- Create codes table
CREATE TABLE public.codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  robot_name text NOT NULL,
  filename text NOT NULL,
  code_content text,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, robot_name, filename)
);

-- Create robot_versions table
CREATE TABLE public.robot_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_id uuid REFERENCES public.robots(id) ON DELETE CASCADE NOT NULL,
  version_name text NOT NULL,
  code text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_deleted boolean DEFAULT false,
  UNIQUE(robot_id, version_name)
);

-- Create sharing_invites table
CREATE TABLE public.sharing_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_name text NOT NULL,
  email text NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create shared_robots table
CREATE TABLE public.shared_robots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robot_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission text NOT NULL CHECK (permission IN ('view', 'edit')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(robot_name, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robot_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_robots ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for robots
DROP POLICY IF EXISTS "Users can read own robots" ON public.robots;
CREATE POLICY "Users can read own robots"
  ON public.robots FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own robots" ON public.robots;
CREATE POLICY "Users can insert own robots"
  ON public.robots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own robots" ON public.robots;
CREATE POLICY "Users can update own robots"
  ON public.robots FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own robots" ON public.robots;
CREATE POLICY "Users can delete own robots"
  ON public.robots FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create policies for codes
DROP POLICY IF EXISTS "Users can read own codes" ON public.codes;
CREATE POLICY "Users can read own codes"
  ON public.codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own codes" ON public.codes;
CREATE POLICY "Users can insert own codes"
  ON public.codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own codes" ON public.codes;
CREATE POLICY "Users can update own codes"
  ON public.codes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own codes" ON public.codes;
CREATE POLICY "Users can delete own codes"
  ON public.codes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for robot versions
DROP POLICY IF EXISTS "Users can read robot versions they own" ON public.robot_versions;
CREATE POLICY "Users can read robot versions they own"
  ON public.robot_versions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create versions for owned robots" ON public.robot_versions;
CREATE POLICY "Users can create versions for owned robots"
  ON public.robot_versions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update versions of owned robots" ON public.robot_versions;
CREATE POLICY "Users can update versions of owned robots"
  ON public.robot_versions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.robots
    WHERE robots.id = robot_versions.robot_id
    AND robots.owner_id = auth.uid()
  ));

-- Create policies for sharing
DROP POLICY IF EXISTS "Users can manage their sharing invites" ON public.sharing_invites;
CREATE POLICY "Users can manage their sharing invites"
  ON public.sharing_invites FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can see robots shared with them" ON public.shared_robots;
CREATE POLICY "Users can see robots shared with them"
  ON public.shared_robots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_codes_updated_at ON public.codes;
CREATE TRIGGER update_codes_updated_at
  BEFORE UPDATE ON public.codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_robots_updated_at ON public.robots;
CREATE TRIGGER update_robots_updated_at
  BEFORE UPDATE ON public.robots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();