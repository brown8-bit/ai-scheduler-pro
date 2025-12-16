-- Drop and recreate add_user_xp function with max level of 350
DROP FUNCTION IF EXISTS public.add_user_xp(uuid, integer);

CREATE FUNCTION public.add_user_xp(p_user_id UUID, p_xp_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN := false;
  v_max_level INTEGER := 350;
BEGIN
  -- Insert or update user points
  INSERT INTO public.user_points (user_id, total_xp, current_level)
  VALUES (p_user_id, p_xp_amount, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_xp = user_points.total_xp + p_xp_amount,
    updated_at = now()
  RETURNING total_xp INTO v_new_xp;
  
  -- Calculate new level (every 100 XP = 1 level), capped at max level 350
  v_new_level := LEAST(v_max_level, GREATEST(1, (v_new_xp / 100) + 1));
  
  -- Check if leveled up
  SELECT (v_new_level > current_level) INTO v_level_up
  FROM public.user_points WHERE user_id = p_user_id;
  
  -- Update level if changed
  UPDATE public.user_points SET current_level = v_new_level WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'total_xp', v_new_xp,
    'current_level', v_new_level,
    'level_up', v_level_up,
    'max_level', v_max_level
  );
END;
$$;