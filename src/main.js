import { openProjectFolder, initProjectStructure } from './fileSystem.js';
import { initEditor, updateFileBrowser } from './editor.js';

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
    launcher.classList.add('hidden');
    editor.classList.remove('hidden');

    initEditor(editor, projectHandle);
    await updateFileBrowser(projectHandle);
}
