-- ROI Brain Cache Table for L2 Caching System
CREATE TABLE public.roi_brain_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(32) NOT NULL UNIQUE,
  business_context JSONB NOT NULL,
  kb_payload JSONB NOT NULL,  
  ai_response JSONB NOT NULL,
  processing_time INTEGER NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes for performance
CREATE INDEX idx_roi_brain_cache_key ON public.roi_brain_cache(cache_key);
CREATE INDEX idx_roi_brain_cache_expires ON public.roi_brain_cache(expires_at);
CREATE INDEX idx_roi_brain_cache_created ON public.roi_brain_cache(created_at);

-- RLS Policies for security
ALTER TABLE public.roi_brain_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ROI brain cache" 
ON public.roi_brain_cache 
FOR ALL 
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION public.cleanup_roi_brain_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.roi_brain_cache 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Auto-cleanup trigger (commented out for manual control)
-- CREATE OR REPLACE FUNCTION public.trigger_cleanup_roi_brain_cache()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Cleanup every 100 inserts
--   IF (TG_OP = 'INSERT' AND NEW.id::text ~ '00$') THEN
--     PERFORM public.cleanup_roi_brain_cache();
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER auto_cleanup_roi_brain_cache
--   AFTER INSERT ON public.roi_brain_cache
--   FOR EACH ROW
--   EXECUTE FUNCTION public.trigger_cleanup_roi_brain_cache();