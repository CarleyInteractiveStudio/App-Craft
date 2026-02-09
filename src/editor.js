import { listProjectFiles } from './fileSystem.js';

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
    list.style.listStyle = 'none';
    list.style.padding = '10px';

    files.forEach(file => {
        const item = document.createElement('li');
        item.style.padding = '5px 0';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '8px';
        item.style.fontSize = '0.9rem';
        item.style.color = 'var(--text-main)';

        const icon = document.createElement('i');
        icon.className = file.kind === 'directory' ? 'fas fa-folder' : 'fas fa-file';
        icon.style.color = file.kind === 'directory' ? '#f1c40f' : 'var(--text-dim)';

        item.appendChild(icon);
        item.appendChild(document.createTextNode(file.name));
        list.appendChild(item);
    });

    filesContent.appendChild(list);
}

function setupViewModes() {
    const tabs = document.querySelectorAll('.view-tab');
    const viewContent = document.getElementById('view-content');
    const viewport = viewContent.querySelector('.view-viewport');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const mode = tab.dataset.mode;
            console.log("Cambiando a modo:", mode);

            if (mode === 'preview') {
                viewContent.parentElement.classList.add('preview-mode');
                viewport.innerHTML = '<div style="color: #333; font-size: 1.2rem;">Vista Previa (Simulación de Sitio Web)</div>';
            } else {
                viewContent.parentElement.classList.remove('preview-mode');
                viewport.innerHTML = '<div id="canvas-container" style="border: 1px dashed var(--accent); width: 80%; height: 80%; display: flex; align-items: center; justify-content: center; color: var(--text-dim);">Lienzo de Edición</div>';
            }
        });
    });

    // Initial content
    viewport.innerHTML = '<div id="canvas-container" style="border: 1px dashed var(--accent); width: 80%; height: 80%; display: flex; align-items: center; justify-content: center; color: var(--text-dim);">Lienzo de Edición</div>';
}
