export async function sendReportEmail(_to: string, _subject: string, _html: string, _pdf?: Uint8Array) {
  // TODO: integrate with Resend (or another provider)
  return { ok: true };
}