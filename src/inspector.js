import { state } from './state.js';

export function updateInspector(objectId) {
    const inspectorContent = document.getElementById('inspector-content');
    if (!objectId) {
        inspectorContent.innerHTML = '<div style="padding: 20px; color: var(--text-dim);">Selecciona un objeto para ver sus propiedades</div>';
        return;
    }

    const canvas = document.getElementById('canvas-container');
    const el = canvas.querySelector(`#${objectId}`) || canvas.querySelector('.ventana-principal');

    if (!el) {
        inspectorContent.innerHTML = '<div style="padding: 20px; color: var(--text-dim);">Objeto no encontrado</div>';
        return;
    }

    const isActive = el.classList.contains('active');
    const isRoot = el.classList.contains('ventana-principal');

    let html = `
        <div class="inspector-section">
            <div class="inspector-row">
                <label>Nombre</label>
                <input type="text" value="${el.id}" onchange="window.editor.renameObject('${el.id}', this.value)">
            </div>
            <div class="inspector-row">
                <label>Activo</label>
                <input type="checkbox" ${isActive ? 'checked' : ''} onchange="window.editor.toggleObjectState('${el.id}')">
            </div>
        </div>
    `;

    // Components
    if (isRoot) {
        html += `
            <div class="inspector-section">
                <div class="section-header">Componente: Inicio</div>
                <div style="padding: 10px; font-size: 0.8rem; color: var(--text-dim);">
                    Este es el componente raíz que inicia la escena.
                </div>
            </div>
        `;
    }

    inspectorContent.innerHTML = html;
}
