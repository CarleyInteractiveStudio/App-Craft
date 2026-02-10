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
            if (componentName === 'Posición') return; // Cannot deactivate Position

            const el = document.getElementById('canvas-container').querySelector(`#${objId}`);
            if (el) {
                let attr;
                if (componentName === 'Inicio') attr = 'data-inicio-active';
                else if (componentName === 'Texto') attr = 'data-text-active';
                else if (componentName === 'Filtro') attr = 'data-filter-active';

                const current = el.getAttribute(attr) !== 'false';
                el.setAttribute(attr, !current);
                window.editor.applyTransforms(el);
                updateInspector(objId);
                saveCurrentScene(document.getElementById('canvas-container').firstChild);
            }
        },
        showAddComponentMenu: (e, objId) => {
            const el = document.getElementById('canvas-container').querySelector(`#${objId}`);
            if (!el || el.classList.contains('ventana-principal')) return;

            const items = [];
            if (!el.hasAttribute('data-text-content')) {
                items.push({ icon: 'fas fa-font', label: 'Texto', action: () => {
                    el.setAttribute('data-text-active', 'true');
                    el.setAttribute('data-text-content', el.id);
                    el.setAttribute('data-text-color', '#ffffff');
                    el.setAttribute('data-text-transform', 'none');
                    el.setAttribute('data-text-align', 'left');
                    el.setAttribute('data-font-family', 'inherit');
                    window.editor.applyTransforms(el);
                    updateInspector(objId);
                    saveCurrentScene(document.getElementById('canvas-container').firstChild);
                }});
            }
            if (!el.hasAttribute('data-filter-color')) {
                items.push({ icon: 'fas fa-magic', label: 'Filtro', action: () => {
                    el.setAttribute('data-filter-active', 'true');
                    el.setAttribute('data-filter-color', 'transparent');
                    el.setAttribute('data-filter-blur', '0');
                    el.setAttribute('data-filter-opacity', '1');
                    window.editor.applyTransforms(el);
                    updateInspector(objId);
                    saveCurrentScene(document.getElementById('canvas-container').firstChild);
                }});
            }

            if (items.length === 0) {
                alert("Este objeto ya tiene todos los componentes disponibles.");
                return;
            }

            import('./contextMenu.js').then(mod => mod.createContextMenu(e, items));
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
                    } else if (componentName === 'Texto') {
                        ['data-text-content', 'data-text-color', 'data-text-transform', 'data-text-align', 'data-font-family'].forEach(attr => {
                            state.copiedComponent.attributes[attr] = el.getAttribute(attr);
                        });
                    } else if (componentName === 'Filtro') {
                        ['data-filter-color', 'data-filter-blur', 'data-filter-opacity'].forEach(attr => {
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
                    } else if (componentName === 'Texto') {
                        el.setAttribute('data-text-content', el.id);
                        el.setAttribute('data-text-color', '#ffffff');
                        el.setAttribute('data-text-transform', 'none');
                        el.setAttribute('data-text-align', 'left');
                        el.setAttribute('data-font-family', 'inherit');
                    } else if (componentName === 'Filtro') {
                        el.setAttribute('data-filter-color', 'transparent');
                        el.setAttribute('data-filter-blur', '0');
                        el.setAttribute('data-filter-opacity', '1');
                    }
                    updateInspector(objId);
                    saveCurrentScene(document.getElementById('canvas-container').firstChild);
                }},
                { icon: 'fas fa-trash', label: 'Eliminar', action: () => {
                    if (componentName === 'Texto') {
                        ['data-text-active', 'data-text-content', 'data-text-color', 'data-text-transform', 'data-text-align', 'data-font-family'].forEach(a => el.removeAttribute(a));
                    } else if (componentName === 'Filtro') {
                        ['data-filter-active', 'data-filter-color', 'data-filter-blur', 'data-filter-opacity'].forEach(a => el.removeAttribute(a));
                    } else {
                        alert("Este componente no se puede eliminar ya que es esencial.");
                        return;
                    }
                    window.editor.applyTransforms(el);
                    updateInspector(objId);
                    saveCurrentScene(document.getElementById('canvas-container').firstChild);
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
            const isRoot = el.classList.contains('ventana-principal');

            // Apply Position Transforms
            if (!isRoot) {
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

                let left = `${x}px`;
                let top = `${y}px`;
                let translate = '';

                if (isAnchored) {
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
                }

                el.style.left = left;
                el.style.top = top;
                el.style.transform = `${translate} rotate(${rot}deg) scale(${scale})`;
            }

            // Apply Text Styles
            const textActive = el.hasAttribute('data-text-content') && el.getAttribute('data-text-active') !== 'false';
            const filterActive = el.hasAttribute('data-filter-color') && el.getAttribute('data-filter-active') !== 'false';
            const filterColor = el.getAttribute('data-filter-color') || 'transparent';

            if (textActive) {
                el.textContent = el.getAttribute('data-text-content') || '';
                el.style.textAlign = el.getAttribute('data-text-align') || 'left';
                el.style.textTransform = el.getAttribute('data-text-transform') || 'none';
                el.style.fontFamily = el.getAttribute('data-font-family') || 'inherit';
                el.style.color = el.getAttribute('data-text-color') || 'white';
            } else if (el.hasAttribute('data-text-active')) {
                el.textContent = '';
            }

            // Inicio Component (Global settings like Background)
            if (isRoot) {
                const inicioActive = el.getAttribute('data-inicio-active') !== 'false';
                if (inicioActive) {
                    const bgColor = el.getAttribute('data-inicio-bg');
                    el.style.backgroundColor = bgColor || '#ffffff';
                }
            }

            // Filter Component (Background, Blur, Opacity)
            if (filterActive) {
                const blur = el.getAttribute('data-filter-blur');
                const opacity = el.getAttribute('data-filter-opacity');

                el.style.backgroundColor = filterColor;

                el.style.filter = `blur(${blur !== null ? blur : 0}px)`;
                el.style.opacity = (opacity !== null && opacity !== '') ? opacity : 1;
            } else if (el.hasAttribute('data-filter-active')) {
                if (!isRoot) el.style.backgroundColor = 'transparent';
                el.style.filter = 'none';
                el.style.opacity = 1;
            }
        }
    };

    initEditor(editor, projectHandle);
    await updateFileBrowser(projectHandle);
}
