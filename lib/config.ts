// Set to true for 1-minute testing, false for 12-hour production
export const IS_TEST_MODE = false

// Entry lock duration based on test mode
export const ENTRY_LOCK_DURATION = IS_TEST_MODE
  ? 1 * 60 * 1000 // 1 minute (testing)
  : 12 * 60 * 60 * 1000 // 12 hours (production)
