const inspectorContent = document.querySelector('#inspector-panel .window-content');

// Use event delegation on the main content area
inspectorContent.addEventListener('input', (e) => {
    if (e.target.tagName !== 'INPUT' || e.target.type !== 'number') return;

    const activeWindow = findItemById(fileSystem, activeWindowId);
    if (!activeWindow) return;

    const selectedObject = findItemById(activeWindow.content, selectedObjectId) || (selectedObjectId === activeWindowId ? activeWindow : null);
    if (!selectedObject) return;

    const property = e.target.dataset.property; // "position", "rotation", "scale", or "size"
    const axis = e.target.dataset.axis; // "x", "y", "z", "width", or "height"
    const value = parseFloat(e.target.value);

    if (isNaN(value)) return;

    if (property === 'size') {
        if (selectedObject.size) {
            selectedObject.size[axis] = value;
        }
    } else if (selectedObject.transform) {
        if (selectedObject.transform[property]) {
            selectedObject.transform[property][axis] = value;
        }
    }

    render();
});


function renderInspector(item) {
    inspectorContent.innerHTML = '';
    if (!item) {
        inspectorContent.innerHTML = '<p>No hay nada seleccionado.</p>';
        return;
    }

    let transformHTML = '';
    if (item.transform) {
        const isCanvas = item.type === 'canvas';
        transformHTML = `
            <div class="component">
                <div class="component-header"><strong>Transform ${isCanvas ? '(Bloqueado)' : ''}</strong></div>
                <div class="component-body">
                    ${createVectorInputs('position', item.transform.position, isCanvas)}
                    ${createVectorInputs('rotation', item.transform.rotation, isCanvas)}
                    ${createVectorInputs('scale', item.transform.scale, isCanvas)}
                </div>
            </div>
        `;
    }

    let sizeHTML = '';
    if (item.type === 'panel' && item.size) {
        sizeHTML = `
            <div class="component">
                <div class="component-header"><strong>Size</strong></div>
                <div class="component-body">
                    ${createSizeInputs(item.size)}
                </div>
            </div>
        `;
    }

    const infoHTML = `
        <div class="component">
            <div class="component-header"><strong>${item.name}</strong></div>
            <div class="component-body">
                <div><strong>ID:</strong> ${item.id}</div>
                <div><strong>Tipo:</strong> ${item.type}</div>
            </div>
        </div>
    `;

    inspectorContent.innerHTML = infoHTML + transformHTML + sizeHTML;
}

function createVectorInputs(label, vector, isDisabled = false) {
    const disabledAttr = isDisabled ? 'disabled' : '';
    return `
        <div class="vector-input">
            <label>${label}</label>
            <div class="fields">
                <span>X</span><input type="number" data-property="${label.toLowerCase()}" data-axis="x" value="${vector.x}" step="1" ${disabledAttr}>
                <span>Y</span><input type="number" data-property="${label.toLowerCase()}" data-axis="y" value="${vector.y}" step="1" ${disabledAttr}>
                <span>Z</span><input type="number" data-property="${label.toLowerCase()}" data-axis="z" value="${vector.z}" step="1" ${disabledAttr}>
            </div>
        </div>
    `;
}

function createSizeInputs(size) {
    return `
        <div class="vector-input">
            <label>Size</label>
            <div class="fields">
                <span>W</span><input type="number" data-property="size" data-axis="width" value="${size.width}" step="1">
                <span>H</span><input type="number" data-property="size" data-axis="height" value="${size.height}" step="1">
            </div>
        </div>
    `;
}
