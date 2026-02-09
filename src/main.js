import { openProjectFolder, initProjectStructure } from './fileSystem.js';
import { initEditor, updateFileBrowser, renameObject, toggleObjectState } from './editor.js';
import { state } from './state.js';

const launcher = document.getElementById('launcher');
const editor = document.getElementById('editor');
const btnNewProject = document.getElementById('btn-new-project');
const btnOpenProject = document.getElementById('btn-open-project');

btnOpenProject.addEventListener('click', async () => {
    const projectHandle = await openProjectFolder();
    if (projectHandle) {
        const success = await initProjectStructure(projectHandle);
        if (success) {
            startEditor(projectHandle);
        }
    }
});

btnNewProject.addEventListener('click', async () => {
    // For now, same as opening, but maybe in the future we'll have a template
    const projectHandle = await openProjectFolder();
    if (projectHandle) {
        const success = await initProjectStructure(projectHandle);
        if (success) {
            startEditor(projectHandle);
        }
    }
});

async function startEditor(projectHandle) {
    state.projectHandle = projectHandle;
    launcher.classList.add('hidden');
    editor.classList.remove('hidden');

    window.editor = {
        renameObject: (id, newName) => {
            const el = document.getElementById('canvas-container').querySelector(`#${id}`);
            if (el) renameObject(el, document.getElementById('canvas-container').firstChild, newName);
        },
        toggleObjectState: (id) => {
            const el = document.getElementById('canvas-container').querySelector(`#${id}`);
            if (el) toggleObjectState(el, document.getElementById('canvas-container').firstChild);
        }
    };

    initEditor(editor, projectHandle);
    await updateFileBrowser(projectHandle);
}
