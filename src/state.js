export const state = {
    projectHandle: null,
    activeSceneHandle: null,
    activeSceneContent: null, // The document fragment or string of the current scene
    selectedObjectId: null,
    scenes: [], // List of scene handles
    copiedComponent: null,
};

export function setSelectedObject(id) {
    state.selectedObjectId = id;
    window.dispatchEvent(new CustomEvent('objectSelected', { detail: { id } }));
}

export function setActiveScene(handle) {
    state.activeSceneHandle = handle;
    window.dispatchEvent(new CustomEvent('sceneChanged', { detail: { handle } }));
}
