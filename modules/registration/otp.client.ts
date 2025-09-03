import { supabase } from "@/integrations/supabase/client"
import { logger } from '@/lib/logger'

interface OtpRequestResponse {
  ok?: boolean
  error?: string
  cooldownSeconds?: number
  expiresInMinutes?: number
}

interface OtpVerifyResponse {
  verified: boolean
  error?: string
}

export async function requestOtp(email: string): Promise<OtpRequestResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('otp_request', {
      body: { email }
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return data
  } catch (err) {
    logger.error('OTP request error', { error: err.message })
    return { error: 'Failed to send verification code' }
  }
}

export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('otp_verify', {
      body: { email, code }
    })
    
    if (error) {
      return { verified: false, error: error.message }
    }
    
    return data
  } catch (err) {
    logger.error('OTP verify error', { error: err.message })
    return { verified: false, error: 'Failed to verify code' }
  }
}