-- OTP codes (hashed), one active row per email
CREATE TABLE IF NOT EXISTS public.email_otp (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

-- Request logs for rate-limiting (per IP + email)
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  ip text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service role (edge functions) can read/write
ALTER TABLE public.email_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edge-only-email_otp"
  ON public.email_otp
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "edge-only-otp_requests"
  ON public.otp_requests
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');