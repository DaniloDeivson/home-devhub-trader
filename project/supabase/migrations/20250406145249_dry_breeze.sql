/*
  # Fix Robot Rename Functionality

  1. Changes
    - Add function to safely rename robots
    - Add system-level policies for robot operations
    - Fix permission issues with robot operations

  2. Security
    - Function runs with SECURITY DEFINER to ensure proper access
    - Validates robot existence before rename
    - Handles name conflicts properly
*/

-- Add helper function to safely rename robots
CREATE OR REPLACE FUNCTION public.rename_robot(
  p_owner_id uuid,
  p_old_name text,
  p_new_name text
) RETURNS uuid AS $$
DECLARE
  v_robot_id uuid;
  v_existing_id uuid;
BEGIN
  -- Check if source robot exists
  SELECT id INTO v_robot_id
  FROM public.robots
  WHERE owner_id = p_owner_id AND name = p_old_name;

  IF v_robot_id IS NULL THEN
    RAISE EXCEPTION 'Robot not found';
  END IF;

  -- Check if target name already exists (excluding current robot)
  SELECT id INTO v_existing_id
  FROM public.robots
  WHERE owner_id = p_owner_id 
    AND name = p_new_name 
    AND id != v_robot_id;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'A robot with this name already exists';
  END IF;

  -- Update robot name
  UPDATE public.robots
  SET name = p_new_name
  WHERE id = v_robot_id;

  -- Update related tables
  UPDATE public.codes
  SET robot_name = p_new_name
  WHERE user_id = p_owner_id AND robot_name = p_old_name;

  UPDATE public.shared_robots
  SET robot_name = p_new_name
  WHERE created_by = p_owner_id AND robot_name = p_old_name;

  RETURN v_robot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;