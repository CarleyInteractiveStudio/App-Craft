import { state } from './state.js';

export function updateInspector(objectId, assetData = null) {
    const inspectorContent = document.getElementById('inspector-content');

    if (assetData) {
        renderAssetInspector(inspectorContent, assetData);
        return;
    }

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

    const x = el.getAttribute('data-x') || 0;
    const y = el.getAttribute('data-y') || 0;
    const rot = el.getAttribute('data-rotation') || 0;
    const scale = el.getAttribute('data-scale') || 1;
    const anchor = parseInt(el.getAttribute('data-anchor') || 1);
    const isAnchored = el.getAttribute('data-anchored') === 'true';
    const scaleUI = el.getAttribute('data-scale-ui') === 'true';

    let html = `
        <div class="inspector-section">
            <div class="inspector-header">
                <input type="text" class="object-name-input" value="${el.id}" onchange="window.editor.renameObject('${el.id}', this.value)">
                <button class="toggle-btn ${isActive ? 'active' : ''}" title="Activar/Desactivar Objeto" onclick="window.editor.toggleObjectState('${el.id}')">
                    <i class="fas fa-power-off"></i>
                </button>
            </div>
        </div>
    `;

    if (!isRoot) {
        const posActive = el.getAttribute('data-pos-active') !== 'false';
        html += `
        <div class="inspector-section ${posActive ? '' : 'component-inactive'}" oncontextmenu="window.editor.showComponentMenu(event, '${el.id}', 'Posición')">
            <div class="section-header">
                <span>Posición</span>
                <button class="comp-toggle-btn ${posActive ? 'active' : ''}" onclick="window.editor.toggleComponent('${el.id}', 'Posición')">
                    <i class="fas fa-toggle-${posActive ? 'on' : 'off'}"></i>
                </button>
            </div>

            <div class="inspector-row">
                <label>Anclaje</label>
                <div class="anchor-grid">
                    ${[1,2,3,4,5,6,7,8,9].map(i => `
                        <div class="anchor-cell ${anchor === i ? 'active' : ''}"
                             onclick="window.editor.updateObjectAttribute('${el.id}', 'data-anchor', '${i}')">
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="inspector-row">
                <label>Usar Anclaje</label>
                <input type="checkbox" ${isAnchored ? 'checked' : ''}
                       onchange="window.editor.updateObjectAttribute('${el.id}', 'data-anchored', this.checked)">
            </div>

            <div class="inspector-row multi-input">
                <div class="input-group">
                    <label>X</label>
                    <input type="number" value="${x}" onchange="window.editor.updateObjectAttribute('${el.id}', 'data-x', this.value)">
                </div>
                <div class="input-group">
                    <label>Y</label>
                    <input type="number" value="${y}" onchange="window.editor.updateObjectAttribute('${el.id}', 'data-y', this.value)">
                </div>
            </div>

            <div class="inspector-row multi-input">
                <div class="input-group">
                    <label>Rotación</label>
                    <input type="number" value="${rot}" onchange="window.editor.updateObjectAttribute('${el.id}', 'data-rotation', this.value)">
                </div>
                <div class="input-group">
                    <label>Escala</label>
                    <input type="number" step="0.1" value="${scale}" onchange="window.editor.updateObjectAttribute('${el.id}', 'data-scale', this.value)">
                </div>
            </div>

            <div class="inspector-row">
                <label>Escalar UI</label>
                <input type="checkbox" ${scaleUI ? 'checked' : ''}
                       onchange="window.editor.updateObjectAttribute('${el.id}', 'data-scale-ui', this.checked)">
            </div>
        </div>`;
    }

    // Components
    if (isRoot) {
        const inicioActive = el.getAttribute('data-inicio-active') !== 'false';
        html += `
            <div class="inspector-section ${inicioActive ? '' : 'component-inactive'}" oncontextmenu="window.editor.showComponentMenu(event, '${el.id}', 'Inicio')">
                <div class="section-header">
                    <span>Componente: Inicio</span>
                    <button class="comp-toggle-btn ${inicioActive ? 'active' : ''}" onclick="window.editor.toggleComponent('${el.id}', 'Inicio')">
                        <i class="fas fa-toggle-${inicioActive ? 'on' : 'off'}"></i>
                    </button>
                </div>
                <div style="padding: 10px; font-size: 0.8rem; color: var(--text-dim);">
                    Este es el componente raíz que inicia la escena.
                </div>
            </div>
        `;
    }

    inspectorContent.innerHTML = html;
}

function renderAssetInspector(container, data) {
    let previewHtml = '';
    if (data.type === 'directory') {
        container.innerHTML = `
            <div class="inspector-section">
                <div class="section-header">Carpeta: ${data.name}</div>
                <div style="padding: 20px; text-align: center; color: var(--text-dim);">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 10px; display: block; color: #f1c40f;"></i>
                    Información de directorio
                </div>
            </div>
        `;
        return;
    }

    if (data.name.endsWith('.svg')) {
        previewHtml = `
            <div class="asset-preview-container">
                <div class="asset-preview-svg">${data.content}</div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="inspector-section">
            <div class="section-header">Recurso: ${data.name}</div>
            ${previewHtml}
            <div class="asset-info">
                <div class="info-row"><label>Tamaño:</label><span>${(data.size / 1024).toFixed(2)} KB</span></div>
                <div class="info-row"><label>Modificado:</label><span>${data.lastModified}</span></div>
            </div>
        </div>
    `;
}
