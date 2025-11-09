const inspectorContent = document.querySelector('#inspector-panel .window-content');

function getSelectedObject() {
    const activeWindow = findItemById(fileSystem, activeWindowId);
    if (!activeWindow) return null;
    return findItemById(activeWindow.content, selectedObjectId);
}

// --- Event Delegation for Inspector ---
inspectorContent.addEventListener('input', (e) => {
    const selectedObject = getSelectedObject();
    if (!selectedObject) return;

    const target = e.target;
    let value = target.value;
    if (target.type === 'number' || target.type === 'range') {
        value = parseFloat(value);
        if (isNaN(value)) return;
    }

    if (target.classList.contains('background-input')) {
        handleBackgroundInput(target, selectedObject, value);
    } else {
        handleStandardInput(target, selectedObject, value);
    }

    render();
});

inspectorContent.addEventListener('change', (e) => {
    const selectedObject = getSelectedObject();
    if (!selectedObject) return;
    const target = e.target;

    if (target.tagName === 'SELECT' && target.classList.contains('background-input')) {
        handleBackgroundInput(target, selectedObject, target.value);
        render(); // Re-render to show/hide relevant fields
    }
});

inspectorContent.addEventListener('click', (e) => {
    const selectedObject = getSelectedObject();
    if (!selectedObject) return;
    const target = e.target;

    if (target.classList.contains('add-color-btn')) {
        selectedObject.background.gradient.push('#000000'); // Add a default color
        render();
    } else if (target.classList.contains('remove-color-btn')) {
        const index = parseInt(target.dataset.index, 10);
        if (selectedObject.background.gradient.length > 1) { // Ensure at least one color remains
            selectedObject.background.gradient.splice(index, 1);
            render();
        }
    }
});

function handleStandardInput(target, selectedObject, value) {
    const property = target.dataset.property;
    const axis = target.dataset.axis;

    if (property === 'size') {
        if (selectedObject.size) selectedObject.size[axis] = value;
    } else if (property === 'text' || property === 'fontSize' || property === 'color') {
        selectedObject[property] = value;
    } else if (selectedObject.transform && selectedObject.transform[property]) {
        selectedObject.transform[property][axis] = value;
    }
}

function handleBackgroundInput(target, selectedObject, value) {
    const subProperty = target.dataset.subProperty;

    if (subProperty === 'type') {
        selectedObject.background.type = value;
    } else if (subProperty === 'color') {
        selectedObject.background.color = value;
    } else if (subProperty === 'opacity') {
        selectedObject.background.opacity = value;
    } else if (subProperty === 'gradient') {
        const index = parseInt(target.dataset.index, 10);
        selectedObject.background.gradient[index] = value;
    }
}


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
    if ((item.type === 'panel' || item.type === 'button') && item.size) {
        sizeHTML = `
            <div class="component">
                <div class="component-header"><strong>Size</strong></div>
                <div class="component-body">
                    ${createSizeInputs(item.size)}
                </div>
            </div>
        `;
    }

    let textHTML = '';
    if (item.type === 'text') {
        textHTML = `
            <div class="component">
                <div class="component-header"><strong>Text</strong></div>
                <div class="component-body">
                    ${createTextInputs(item)}
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

    let backgroundHTML = '';
    if (item.background) {
        backgroundHTML = createBackgroundInputs(item.background);
    }

    inspectorContent.innerHTML = infoHTML + textHTML + transformHTML + sizeHTML + backgroundHTML;
}

function createBackgroundInputs(background) {
    const isSolid = background.type === 'solid';

    const typeSelectorHTML = `
        <div class="vector-input">
            <label>Tipo</label>
            <select class="background-input" data-sub-property="type">
                <option value="solid" ${isSolid ? 'selected' : ''}>Sólido</option>
                <option value="gradient" ${!isSolid ? 'selected' : ''}>Degradado</option>
            </select>
        </div>
    `;

    const solidColorHTML = `
        <div class="vector-input solid-color-container" style="display: ${isSolid ? 'grid' : 'none'}">
            <label>Color</label>
            <input type="color" class="background-input" data-sub-property="color" value="${background.color}">
        </div>
    `;

    const gradientColorsHTML = background.gradient.map((color, index) => `
        <div class="vector-input gradient-color-stop">
            <label>Color ${index + 1}</label>
            <input type="color" class="background-input" data-sub-property="gradient" data-index="${index}" value="${color}">
            <button class="remove-color-btn" data-index="${index}">-</button>
        </div>
    `).join('');

    const gradientControlsHTML = `
        <div class="gradient-controls-container" style="display: ${!isSolid ? 'block' : 'none'}">
            ${gradientColorsHTML}
            <button class="add-color-btn">+</button>
        </div>
    `;

    const opacitySliderHTML = `
        <div class="vector-input">
            <label>Opacidad</label>
            <input type="range" class="background-input" data-sub-property="opacity" min="0" max="1" step="0.01" value="${background.opacity}">
        </div>
    `;

    return `
        <div class="component">
            <div class="component-header"><strong>Fondo</strong></div>
            <div class="component-body">
                ${typeSelectorHTML}
                ${solidColorHTML}
                ${gradientControlsHTML}
                ${opacitySliderHTML}
            </div>
        </div>
    `;
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

function createTextInputs(item) {
    return `
        <div class="text-input">
            <label>Content</label>
            <input type="text" data-property="text" value="${item.text}">
        </div>
        <div class="vector-input">
            <label>Font Size</label>
            <input type="number" data-property="fontSize" value="${item.fontSize}" step="1">
        </div>
        <div class="vector-input">
            <label>Color</label>
            <input type="color" data-property="color" value="${item.color}">
        </div>
    `;
}
