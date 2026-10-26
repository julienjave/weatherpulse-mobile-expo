// Enable React 19's async act() support as early as possible in the Jest
// lifecycle, before React or the test renderer are imported.
globalThis.IS_REACT_ACT_ENVIRONMENT = true
