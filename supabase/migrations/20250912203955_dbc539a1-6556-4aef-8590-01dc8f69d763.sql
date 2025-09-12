-- Fix function search path security issue for cleanup_roi_brain_cache
CREATE OR REPLACE FUNCTION public.cleanup_roi_brain_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.roi_brain_cache 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$;