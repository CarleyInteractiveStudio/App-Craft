import { listProjectFiles, createFile, deleteFile } from './fileSystem.js';
import { createContextMenu } from './contextMenu.js';
import { state, setActiveScene, setSelectedObject } from './state.js';
import { updateInspector } from './inspector.js';
import { setupGizmos } from './gizmos.js';

export function initEditor(container, projectHandle) {
    container.innerHTML = `
        <header id="editor-top-bar" class="glass-effect">
            <div class="top-bar-left">
                <div class="engine-logo"><i class="fas fa-cube"></i> App Craft</div>
                <div class="project-name">${projectHandle.name}</div>
            </div>
            <nav class="top-bar-menu">
                <div class="menu-item" onclick="window.editor.showProjectMenu(event)">Configuración</div>
            </nav>
        </header>
        <div id="editor-main-layout">
        <div id="left-panel" class="panel">
            <div id="hierarchy-panel" class="sub-panel">
                <div class="panel-header">Jerarquía</div>
                <div class="panel-content" id="hierarchy-content"></div>
            </div>
            <div id="left-h-resizer" class="resizer-h"></div>
            <div id="files-panel" class="sub-panel">
                <div class="panel-header">Navegador de Archivos</div>
                <div class="panel-content" id="files-content"></div>
            </div>
        </div>

        <div id="left-v-resizer" class="resizer-v"></div>

        <div id="center-panel" class="panel">
            <div class="panel-header">
                <div class="view-tabs">
                    <div class="view-tab active" data-mode="edition">Edición</div>
                    <div class="view-tab" data-mode="preview">Vista Previa</div>
                </div>
            </div>
            <div class="panel-content" id="view-content">
                <div class="view-viewport">
                    <!-- Area de diseño -->
                    <div id="canvas-container"></div>
                </div>
            </div>
        </div>

        <div id="right-v-resizer" class="resizer-v"></div>

        <div id="right-panel" class="panel">
            <div class="panel-header">Inspector</div>
            <div class="panel-content" id="inspector-content">
                <div style="padding: 20px; color: var(--text-dim); font-size: 0.8rem;">
                    Selecciona un objeto para ver sus propiedades.
                </div>
            </div>
        </div>
        </div>
    `;

    setupResizers();
    setupViewModes();
    setupGizmos();

    window.addEventListener('resize', () => {
        const canvas = document.getElementById('canvas-container');
        if (!canvas) return;
        const applyAll = (el) => {
            if (el.hasAttribute && el.hasAttribute('data-x')) window.editor.applyTransforms(el);
            Array.from(el.children).forEach(applyAll);
        };
        applyAll(canvas);
    });

    console.log("Editor inicializado para:", projectHandle.name);
}

function setupResizers() {
    const leftPanel = document.getElementById('left-panel');
    const centerPanel = document.getElementById('center-panel');
    const rightPanel = document.getElementById('right-panel');

    const leftVResizer = document.getElementById('left-v-resizer');
    const rightVResizer = document.getElementById('right-v-resizer');

    const hierarchyPanel = document.getElementById('hierarchy-panel');
    const filesPanel = document.getElementById('files-panel');
    const leftHResizer = document.getElementById('left-h-resizer');

    // Vertical Resizing (Left Panel)
    leftVResizer.addEventListener('mousedown', (e) => {
        leftVResizer.classList.add('dragging');
        const startX = e.clientX;
        const startWidth = leftPanel.offsetWidth;

        const onMouseMove = (e) => {
            const newWidth = startWidth + (e.clientX - startX);
            if (newWidth > 150 && newWidth < 600) {
                leftPanel.style.width = `${newWidth}px`;
            }
        };

        const onMouseUp = () => {
            leftVResizer.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Vertical Resizing (Right Panel)
    rightVResizer.addEventListener('mousedown', (e) => {
        rightVResizer.classList.add('dragging');
        const startX = e.clientX;
        const startWidth = rightPanel.offsetWidth;

        const onMouseMove = (e) => {
            const newWidth = startWidth - (e.clientX - startX);
            if (newWidth > 150 && newWidth < 600) {
                rightPanel.style.width = `${newWidth}px`;
            }
        };

        const onMouseUp = () => {
            rightVResizer.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Horizontal Resizing (Left Inner Panels)
    leftHResizer.addEventListener('mousedown', (e) => {
        leftHResizer.classList.add('dragging');
        const startY = e.clientY;
        const startHeight = hierarchyPanel.offsetHeight;
        const totalHeight = leftPanel.offsetHeight;

        const onMouseMove = (e) => {
            const newHeight = startHeight + (e.clientY - startY);
            const percentage = (newHeight / totalHeight) * 100;
            if (percentage > 10 && percentage < 90) {
                hierarchyPanel.style.height = `${percentage}%`;
                filesPanel.style.height = `${100 - percentage}%`;
            }
        };

        const onMouseUp = () => {
            leftHResizer.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

const expandedFolders = new Set(['root']);

export async function updateFileBrowser(projectHandle) {
    const filesContent = document.getElementById('files-content');
    filesContent.innerHTML = '';

    const renderDirectory = async (directoryHandle, container, level = 0, path = 'root') => {
        const files = await listProjectFiles(directoryHandle);
        const list = document.createElement('ul');
        list.className = 'file-list';
        list.style.paddingLeft = level > 0 ? '12px' : '0px';

        for (const file of files) {
            if (file.name.endsWith('.css')) continue;

            const item = document.createElement('li');
            item.className = 'file-item';
            const currentPath = `${path}/${file.name}`;

            const icon = document.createElement('i');
            if (file.kind === 'directory') {
                const isExpanded = expandedFolders.has(currentPath);
                icon.className = isExpanded ? 'fas fa-folder-open' : 'fas fa-folder';
                icon.style.color = '#f1c40f';

                item.onclick = (e) => {
                    e.stopPropagation();
                    if (isExpanded) expandedFolders.delete(currentPath);
                    else expandedFolders.add(currentPath);
                    updateFileBrowser(projectHandle);
                    selectDirectory(file.handle);
                };
            } else if (file.name.endsWith('.js')) {
                icon.className = 'fab fa-js-square';
                icon.style.color = '#f7df1e';
            } else if (file.name.endsWith('.svg')) {
                icon.className = 'fas fa-file-image';
                icon.style.color = '#e67e22';
            } else if (file.name.endsWith('.ttf') || file.name.endsWith('.woff') || file.name.endsWith('.woff2')) {
                icon.className = 'fas fa-font';
                icon.style.color = '#9b59b6';
            } else {
                icon.className = 'fas fa-file-code';
                icon.style.color = '#3498db';
            }

            const nameSpan = document.createElement('span');
            nameSpan.textContent = file.name;

            item.appendChild(icon);
            item.appendChild(nameSpan);

            if (file.kind !== 'directory') {
                item.onclick = (e) => {
                    e.stopPropagation();
                    if (file.name.endsWith('.html')) openScene(file.handle);
                    else if (file.name.endsWith('.svg')) selectAsset(file.handle);
                    else if (file.name.endsWith('.ttf') || file.name.endsWith('.woff') || file.name.endsWith('.woff2')) selectAsset(file.handle);
                };
            }

            item.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                createContextMenu(e, [
                    { icon: 'fas fa-trash', label: 'Eliminar', action: async () => {
                        if (confirm(`¿Eliminar ${file.name}?`)) {
                            if (file.kind === 'directory') {
                                await directoryHandle.removeEntry(file.name, { recursive: true });
                            } else {
                                await deleteFile(directoryHandle, file.name);
                            }
                            updateFileBrowser(projectHandle);
                        }
                    }}
                ]);
            };

            list.appendChild(item);

            if (file.kind === 'directory' && expandedFolders.has(currentPath)) {
                const subContainer = document.createElement('div');
                await renderDirectory(file.handle, subContainer, level + 1, currentPath);
                list.appendChild(subContainer);
            }
        }
        container.appendChild(list);
    };

    await renderDirectory(projectHandle, filesContent);

    filesContent.oncontextmenu = (e) => {
        if (e.target === filesContent) {
            e.preventDefault();
            createContextMenu(e, [
                { icon: 'fas fa-plus', label: 'Nueva Escena (HTML)', action: () => createNewScene() },
                { icon: 'fab fa-js', label: 'Nuevo Script (JS)', action: () => createNewScript() }
            ]);
        }
    };
}

async function createNewScript() {
    const name = prompt("Nombre del script:", "NuevoScript");
    if (!name) return;

    const fileName = `${name}.js`;
    const content = `// Lógica para ${name}\nconsole.log("${name} cargado");`;

    await createFile(state.projectHandle, fileName, content);
    updateFileBrowser(state.projectHandle);
}

async function createNewScene() {
    const name = prompt("Nombre de la escena:", "NuevaEscena");
    if (!name) return;

    const htmlName = `${name}.html`;
    const cssName = `${name}.css`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="${cssName}">
</head>
<body>
    <div id="root" class="ventana-principal active" data-component="Inicio"
         data-x="0" data-y="0" data-rotation="0" data-scale="1"
         data-anchor="1" data-anchored="false" data-scale-ui="false"
         data-text-content="" data-text-transform="none" data-text-align="left" data-font-family="inherit"
         data-filter-color="transparent" data-filter-blur="0" data-filter-opacity="1">
        <!-- Contenido de la escena -->
    </div>
</body>
</html>`;

    const cssContent = `/* Estilos para ${name} */
.ventana-principal {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
}`;

    await createFile(state.projectHandle, htmlName, htmlContent);
    await createFile(state.projectHandle, cssName, cssContent);
    updateFileBrowser(state.projectHandle);
}

async function selectDirectory(handle) {
    setSelectedObject(null);
    import('./inspector.js').then(mod => mod.updateInspector(null, {
        type: 'directory',
        name: handle.name
    }));
}

async function selectAsset(handle) {
    setSelectedObject(null); // Deselect objects
    const file = await handle.getFile();
    const content = await file.text();

    import('./inspector.js').then(mod => mod.updateInspector(null, {
        type: 'asset',
        name: handle.name,
        content: content,
        size: file.size,
        lastModified: new Date(file.lastModified).toLocaleString()
    }));
}

async function openScene(handle) {
    setActiveScene(handle);
    const file = await handle.getFile();
    const content = await file.text();
    state.activeSceneContent = content;

    // Logic to render in View and Hierarchy will follow
    renderSceneInView(content);
}

function renderSceneInView(content) {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) return;

    // We use a shadow root or iframe for the scene to avoid style pollution?
    // User wants it as divs with IDs. Let's start with an iframe or just inject it.
    // If we inject it, we need to be careful with global CSS.
    // Given it's a "motor", an iframe is safer for "Preview", but for "Edition"
    // we might want direct manipulation.

    // For now, let's just parse it and show it.
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const root = doc.querySelector('.ventana-principal');

    canvas.innerHTML = '';
    if (root) {
        const clonedRoot = root.cloneNode(true);
        canvas.appendChild(clonedRoot);

        // Apply transforms to all objects
        const applyAll = (el) => {
            if (el.hasAttribute('data-x')) window.editor.applyTransforms(el);
            Array.from(el.children).forEach(applyAll);
        };
        applyAll(clonedRoot);

        // We also need to update hierarchy
        updateHierarchy(clonedRoot);
    }
}

export function updateHierarchy(rootElement) {
    const hierarchyContent = document.getElementById('hierarchy-content');
    hierarchyContent.innerHTML = '';

    hierarchyContent.oncontextmenu = (e) => {
        e.preventDefault();
        createContextMenu(e, [
            { icon: 'fas fa-plus', label: 'Crear Objeto', action: () => createChildObject(rootElement, rootElement) }
        ]);
    };

    const renderNode = (el, container) => {
        const item = document.createElement('div');
        item.className = 'hierarchy-item';
        const isActive = el.classList.contains('active');
        item.innerHTML = `
            <i class="fas fa-cube"></i>
            <span class="${isActive ? '' : 'inactive-text'}">${el.id || el.tagName}</span>
        `;

        item.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.hierarchy-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            setSelectedObject(el.id);
            updateInspector(el.id);
        };

        item.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isRoot = el.classList.contains('ventana-principal');
            createContextMenu(e, [
                { icon: 'fas fa-plus', label: 'Crear Objeto', action: () => createChildObject(rootElement, rootElement) },
                { icon: 'fas fa-edit', label: 'Renombrar', action: () => renameObject(el, rootElement) },
                { icon: 'fas fa-power-off', label: isActive ? 'Desactivar' : 'Activar', action: () => toggleObjectState(el, rootElement) },
                { separator: true },
                { icon: 'fas fa-trash', label: 'Eliminar', action: async () => {
                    if (isRoot) {
                        if (confirm(`Borrar la ventana principal eliminará el archivo de la escena (${state.activeSceneHandle.name}). ¿Continuar?`)) {
                            await deleteFile(state.projectHandle, state.activeSceneHandle.name);
                            await deleteFile(state.projectHandle, state.activeSceneHandle.name.replace('.html', '.css'));
                            state.activeSceneHandle = null;
                            document.getElementById('canvas-container').innerHTML = '';
                            document.getElementById('hierarchy-content').innerHTML = '';
                            updateFileBrowser(state.projectHandle);
                        }
                    } else {
                        el.remove();
                        updateHierarchy(rootElement);
                        saveCurrentScene(rootElement);
                    }
                }}
            ]);
        };

        container.appendChild(item);

        if (el.children.length > 0) {
            const childContainer = document.createElement('div');
            childContainer.style.paddingLeft = '15px';
            Array.from(el.children).forEach(child => renderNode(child, childContainer));
            container.appendChild(childContainer);
        }
    };

    renderNode(rootElement, hierarchyContent);
}

function createChildObject(parentEl, rootElement) {
    const name = prompt("Nombre del objeto:", "NuevoObjeto");
    if (!name) return;

    const newObj = document.createElement('div');
    newObj.id = name.replace(/\s+/g, '-').toLowerCase();
    newObj.className = 'scene-object active';
    newObj.textContent = name;

    // Component Defaults
    newObj.setAttribute('data-x', '0');
    newObj.setAttribute('data-y', '0');
    newObj.setAttribute('data-rotation', '0');
    newObj.setAttribute('data-scale', '1');
    newObj.setAttribute('data-anchor', '1');
    newObj.setAttribute('data-anchored', 'false');
    newObj.setAttribute('data-scale-ui', 'false');

    // Text Component
    newObj.setAttribute('data-text-content', name);
    newObj.setAttribute('data-text-transform', 'none');
    newObj.setAttribute('data-text-align', 'left');
    newObj.setAttribute('data-font-family', 'inherit');

    // Filter Component
    newObj.setAttribute('data-filter-color', 'transparent');
    newObj.setAttribute('data-filter-blur', '0');
    newObj.setAttribute('data-filter-opacity', '1');

    parentEl.appendChild(newObj);
    updateHierarchy(rootElement);
    saveCurrentScene(rootElement);
}

export function renameObject(el, rootElement, newName = null) {
    if (newName === null) {
        newName = prompt("Nuevo nombre:", el.id || el.tagName);
    }
    if (!newName) return;
    el.id = newName.replace(/\s+/g, '-').toLowerCase();
    updateHierarchy(rootElement);
    saveCurrentScene(rootElement);
}

export function toggleObjectState(el, rootElement) {
    el.classList.toggle('active');
    updateHierarchy(rootElement);
    saveCurrentScene(rootElement);
}

export async function saveCurrentScene(rootElement) {
    if (!state.activeSceneHandle) return;

    // We need to rebuild the full HTML document
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="${state.activeSceneHandle.name.replace('.html', '.css')}">
</head>
<body>
    ${rootElement.outerHTML}
</body>
</html>`;

    const writable = await state.activeSceneHandle.createWritable();
    await writable.write(htmlContent);
    await writable.close();
}

function setupViewModes() {
    const tabs = document.querySelectorAll('.view-tab');
    const viewContent = document.getElementById('view-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const mode = tab.dataset.mode;
            console.log("Cambiando a modo:", mode);

            if (mode === 'preview') {
                viewContent.parentElement.classList.add('preview-mode');
            } else {
                viewContent.parentElement.classList.remove('preview-mode');
            }

            // Gizmos should only be visible in edition mode
            const gizmoLayer = document.getElementById('gizmo-layer');
            if (gizmoLayer) {
                gizmoLayer.style.display = mode === 'preview' ? 'none' : 'block';
            }
        });
    });
}
