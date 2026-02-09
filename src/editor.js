import { listProjectFiles, createFile, deleteFile } from './fileSystem.js';
import { createContextMenu } from './contextMenu.js';
import { state, setActiveScene, setSelectedObject } from './state.js';
import { updateInspector } from './inspector.js';
import { setupGizmos } from './gizmos.js';

export function initEditor(container, projectHandle) {
    container.innerHTML = `
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
                    <i class="fas fa-check-circle" style="color: #2ecc71;"></i> Proyecto guardado localmente
                </div>
            </div>
        </div>
    `;

    setupResizers();
    setupViewModes();
    setupGizmos();

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

export async function updateFileBrowser(projectHandle) {
    const filesContent = document.getElementById('files-content');
    const files = await listProjectFiles(projectHandle);

    filesContent.innerHTML = '';
    const list = document.createElement('ul');
    list.className = 'file-list';

    files.forEach(file => {
        const item = document.createElement('li');
        item.className = 'file-item';

        const icon = document.createElement('i');
        icon.className = file.kind === 'directory' ? 'fas fa-folder' : 'fas fa-file-code';
        icon.style.color = file.kind === 'directory' ? '#f1c40f' : '#3498db';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = file.name;

        item.appendChild(icon);
        item.appendChild(nameSpan);

        item.onclick = async () => {
            if (file.name.endsWith('.html')) {
                const handle = await projectHandle.getFileHandle(file.name);
                openScene(handle);
            }
        };

        item.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            createContextMenu(e, [
                { icon: 'fas fa-trash', label: 'Eliminar', action: async () => {
                    if (confirm(`¿Eliminar ${file.name}?`)) {
                        await deleteFile(projectHandle, file.name);
                        updateFileBrowser(projectHandle);
                    }
                }}
            ]);
        };

        list.appendChild(item);
    });

    filesContent.appendChild(list);

    filesContent.oncontextmenu = (e) => {
        if (e.target === filesContent || e.target === list) {
            e.preventDefault();
            createContextMenu(e, [
                { icon: 'fas fa-plus', label: 'Nueva Escena (HTML)', action: () => createNewScene() }
            ]);
        }
    };
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
    <div id="root" class="ventana-principal active" data-component="Inicio">
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
        // We also need to update hierarchy
        updateHierarchy(clonedRoot);
    }
}

function updateHierarchy(rootElement) {
    const hierarchyContent = document.getElementById('hierarchy-content');
    hierarchyContent.innerHTML = '';

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
                { icon: 'fas fa-plus', label: 'Crear Hijo', action: () => createChildObject(el, rootElement) },
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

async function saveCurrentScene(rootElement) {
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
