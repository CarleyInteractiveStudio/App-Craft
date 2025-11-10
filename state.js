// The file system structure will be loaded from a user-selected directory.
const fileSystem = [];

// --- State Management ---
let nextFileId = 1; // Will be determined by the loaded project
let selectedObjectId = null;
let activeWindowId = null;
