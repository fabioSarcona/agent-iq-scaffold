// Server-side knowledge base utility

import knowledgeBase from '@/kb'

/**
 * Get the complete knowledge base as a frozen object
 * @returns Frozen knowledge base object
 */
export function getKB() {
  return Object.freeze(knowledgeBase)
}

export default getKB