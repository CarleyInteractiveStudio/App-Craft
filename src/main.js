import { openProjectFolder, initProjectStructure } from './fileSystem.js';
import { initEditor, updateFileBrowser, renameObject, toggleObjectState, saveCurrentScene } from './editor.js';
import { state } from './state.js';
import { updateInspector } from './inspector.js';
import { updateGizmoPosition } from './gizmos.js';

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
        },
        updateObjectAttribute: (id, attr, value) => {
            const el = document.getElementById('canvas-container').querySelector(`#${id}`);
            if (el) {
                el.setAttribute(attr, value);
                window.editor.applyTransforms(el);
                updateInspector(id);
                updateGizmoPosition();
                saveCurrentScene(document.getElementById('canvas-container').firstChild);
            }
        },
        applyTransforms: (el) => {
            const x = parseFloat(el.getAttribute('data-x') || 0);
            const y = parseFloat(el.getAttribute('data-y') || 0);
            const rot = parseFloat(el.getAttribute('data-rotation') || 0);
            let scale = parseFloat(el.getAttribute('data-scale') || 1);
            const anchor = parseInt(el.getAttribute('data-anchor') || 1);
            const isAnchored = el.getAttribute('data-anchored') === 'true';
            const scaleUI = el.getAttribute('data-scale-ui') === 'true';

            if (scaleUI) {
                const canvas = document.getElementById('canvas-container');
                if (canvas) {
                    const referenceWidth = 1280;
                    const currentWidth = canvas.offsetWidth;
                    const uiScaleFactor = currentWidth / referenceWidth;
                    scale *= uiScaleFactor;
                }
            }

            if (!isAnchored) {
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.transform = `rotate(${rot}deg) scale(${scale})`;
                return;
            }

            let left = '0px';
            let top = '0px';
            let translate = '';

            switch (anchor) {
                case 1: // TL
                    left = `${x}px`; top = `${y}px`; translate = '';
                    break;
                case 2: // TC
                    left = `calc(50% + ${x}px)`; top = `${y}px`; translate = 'translateX(-50%)';
                    break;
                case 3: // TR
                    left = `calc(100% + ${x}px)`; top = `${y}px`; translate = 'translateX(-100%)';
                    break;
                case 4: // ML
                    left = `${x}px`; top = `calc(50% + ${y}px)`; translate = 'translateY(-50%)';
                    break;
                case 5: // MC
                    left = `calc(50% + ${x}px)`; top = `calc(50% + ${y}px)`; translate = 'translate(-50%, -50%)';
                    break;
                case 6: // MR
                    left = `calc(100% + ${x}px)`; top = `calc(50% + ${y}px)`; translate = 'translate(-100%, -50%)';
                    break;
                case 7: // BL
                    left = `${x}px`; top = `calc(100% + ${y}px)`; translate = 'translateY(-100%)';
                    break;
                case 8: // BC
                    left = `calc(50% + ${x}px)`; top = `calc(100% + ${y}px)`; translate = 'translate(-50%, -100%)';
                    break;
                case 9: // BR
                    left = `calc(100% + ${x}px)`; top = `calc(100% + ${y}px)`; translate = 'translate(-100%, -100%)';
                    break;
            }

            el.style.left = left;
            el.style.top = top;
            el.style.transform = `${translate} rotate(${rot}deg) scale(${scale})`;
        }
    };

    initEditor(editor, projectHandle);
    await updateFileBrowser(projectHandle);
}
