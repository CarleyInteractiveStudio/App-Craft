import { openProjectFolder, initProjectStructure, restoreIcons } from './fileSystem.js';
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
        showProjectMenu: (e) => {
            const items = [
                { icon: 'fas fa-sync', label: 'Restaurar Iconos', action: async () => {
                    if (confirm("¿Restaurar carpeta de iconos predeterminados? Esto puede tardar unos segundos.")) {
                        const success = await restoreIcons(state.projectHandle);
                        if (success) {
                            await updateFileBrowser(state.projectHandle);
                            alert("Biblioteca de iconos restaurada correctamente en assets/icons/");
                        } else {
                            alert("Hubo un error al restaurar los iconos.");
                        }
                    }
                }}
            ];
            import('./contextMenu.js').then(mod => mod.createContextMenu(e, items));
        },
        renameObject: (id, newName) => {
            const el = document.getElementById('canvas-container').querySelector(`#${id}`);
            if (el) renameObject(el, document.getElementById('canvas-container').firstChild, newName);
        },
        toggleObjectState: (id) => {
            const el = document.getElementById('canvas-container').querySelector(`#${id}`);
            if (el) toggleObjectState(el, document.getElementById('canvas-container').firstChild);
        },
        toggleComponent: (objId, componentName) => {
            const el = document.getElementById('canvas-container').querySelector(`#${objId}`);
            if (el) {
                const attr = componentName === 'Posición' ? 'data-pos-active' : 'data-inicio-active';
                const current = el.getAttribute(attr) !== 'false';
                el.setAttribute(attr, !current);
                updateInspector(objId);
                saveCurrentScene(document.getElementById('canvas-container').firstChild);
            }
        },
        showComponentMenu: (e, objId, componentName) => {
            e.preventDefault();
            const el = document.getElementById('canvas-container').querySelector(`#${objId}`);
            if (!el) return;

            const items = [
                { icon: 'fas fa-copy', label: 'Copiar', action: () => {
                    state.copiedComponent = {
                        name: componentName,
                        attributes: {}
                    };
                    if (componentName === 'Posición') {
                        ['data-x', 'data-y', 'data-rotation', 'data-scale', 'data-anchor', 'data-anchored', 'data-scale-ui'].forEach(attr => {
                            state.copiedComponent.attributes[attr] = el.getAttribute(attr);
                        });
                    }
                    console.log("Componente copiado:", componentName);
                }},
                { icon: 'fas fa-paste', label: 'Pegar', action: () => {
                    if (state.copiedComponent && state.copiedComponent.name === componentName) {
                        Object.entries(state.copiedComponent.attributes).forEach(([attr, val]) => {
                            el.setAttribute(attr, val);
                        });
                        window.editor.applyTransforms(el);
                        updateInspector(objId);
                        saveCurrentScene(document.getElementById('canvas-container').firstChild);
                    }
                }},
                { separator: true },
                { icon: 'fas fa-undo', label: 'Restablecer', action: () => {
                    if (componentName === 'Posición') {
                        el.setAttribute('data-x', '0');
                        el.setAttribute('data-y', '0');
                        el.setAttribute('data-rotation', '0');
                        el.setAttribute('data-scale', '1');
                        el.setAttribute('data-anchor', '1');
                        el.setAttribute('data-anchored', 'false');
                        el.setAttribute('data-scale-ui', 'false');
                        window.editor.applyTransforms(el);
                    }
                    updateInspector(objId);
                    saveCurrentScene(document.getElementById('canvas-container').firstChild);
                }},
                { icon: 'fas fa-trash', label: 'Eliminar', action: () => {
                    if (componentName !== 'Inicio') {
                        // Logic to remove component attributes if we had multiple components
                        // For now, Posición and Inicio are standard
                        alert("Este componente no se puede eliminar ya que es esencial.");
                    }
                }}
            ];

            import('./contextMenu.js').then(mod => mod.createContextMenu(e, items));
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
