// === TIME ZONE PINNING FOR TESTS ==========================================================

// Node re-reads process.env.TZ whenever it changes, so tests can pin the machine time zone
// (Vitest had `vi.stubEnv` for this; Jest has no equivalent). Pair with restoreTimeZone().

const ORIGINAL_TZ = process.env.TZ

export function pinTimeZone(timeZone: string) {
  process.env.TZ = timeZone
}

export function restoreTimeZone() {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
}
