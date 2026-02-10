import { state } from './state.js';
import { updateHierarchy, saveCurrentScene } from './editor.js';

export function setupGizmos() {
    const viewContent = document.getElementById('view-content');

    const gizmoLayer = document.createElement('div');
    gizmoLayer.id = 'gizmo-layer';
    gizmoLayer.style.position = 'absolute';
    gizmoLayer.style.top = '0';
    gizmoLayer.style.left = '0';
    gizmoLayer.style.width = '100%';
    gizmoLayer.style.height = '100%';
    gizmoLayer.style.pointerEvents = 'none';
    viewContent.appendChild(gizmoLayer);

    window.addEventListener('objectSelected', () => updateGizmoPosition());
}

export function updateGizmoPosition() {
    const layer = document.getElementById('gizmo-layer');
    layer.innerHTML = '';

    if (!state.selectedObjectId) return;

    const canvas = document.getElementById('canvas-container');
    const el = canvas.querySelector(`#${state.selectedObjectId}`);

    if (!el || el.classList.contains('ventana-principal')) return;

    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const gizmo = document.createElement('div');
    gizmo.className = 'gizmo-box';
    gizmo.style.left = `${rect.left - canvasRect.left}px`;
    gizmo.style.top = `${rect.top - canvasRect.top}px`;
    gizmo.style.width = `${rect.width}px`;
    gizmo.style.height = `${rect.height}px`;
    gizmo.style.pointerEvents = 'auto';

    // Move handle
    const moveHandle = document.createElement('div');
    moveHandle.className = 'gizmo-move';
    moveHandle.innerHTML = '<i class="fas fa-arrows-alt"></i>';
    gizmo.appendChild(moveHandle);

    setupMoveLogic(moveHandle, el, canvas);

    // Resize handles (Bottom-Right)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gizmo-resize';
    gizmo.appendChild(resizeHandle);

    setupResizeLogic(resizeHandle, el, canvas);

    layer.appendChild(gizmo);
}

function setupMoveLogic(handle, el, canvas) {
    handle.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startDataX = parseFloat(el.getAttribute('data-x') || 0);
        const startDataY = parseFloat(el.getAttribute('data-y') || 0);

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            el.setAttribute('data-x', startDataX + dx);
            el.setAttribute('data-y', startDataY + dy);

            window.editor.applyTransforms(el);
            updateGizmoPosition();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveCurrentScene(canvas.firstChild);
            // Update Inspector if it's open
            import('./inspector.js').then(mod => mod.updateInspector(el.id));
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
}

function setupResizeLogic(handle, el, canvas) {
    handle.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = el.offsetWidth;
        const startHeight = el.offsetHeight;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.width = `${startWidth + dx}px`;
            el.style.height = `${startHeight + dy}px`;
            updateGizmoPosition();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            saveCurrentScene(canvas.firstChild);
            // Update Inspector if it's open
            import('./inspector.js').then(mod => mod.updateInspector(el.id));
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
}
