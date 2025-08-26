/**
 * Calculate typing delay based on message length
 * ≤20 chars: 100+20ms/char
 * 21–60 chars: 300+15ms/char  
 * >60 chars: 500+10ms/char
 */
export function calculateTypingDelay(message: string): number {
  const length = message.length
  
  if (length <= 20) {
    return 100 + (20 * length)
  } else if (length <= 60) {
    return 300 + (15 * length)
  } else {
    return 500 + (10 * length)
  }
}