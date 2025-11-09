const inspectorContent = document.querySelector('#inspector-panel .window-content');

function renderInspector(item) {
    inspectorContent.innerHTML = ''; // Clear previous content
    if (!item) {
        inspectorContent.innerHTML = '<p>No hay nada seleccionado.</p>';
        return;
    }

    // --- General Info ---
    const infoComponent = document.createElement('div');
    infoComponent.className = 'component';
    infoComponent.innerHTML = `
        <div class="component-header"><strong>${item.name}</strong></div>
        <div class="component-body">
            <div><strong>ID:</strong> ${item.id}</div>
            <div><strong>Tipo:</strong> ${item.type}</div>
        </div>
    `;

    // --- Transform Component ---
    const transformComponent = document.createElement('div');
    transformComponent.className = 'component';
    transformComponent.innerHTML = `
        <div class="component-header"><strong>Transform</strong></div>
        <div class="component-body">
            ${createVectorInputs('Position', item.transform.position)}
            ${createVectorInputs('Rotation', item.transform.rotation)}
            ${createVectorInputs('Scale', item.transform.scale)}
        </div>
    `;

    inspectorContent.appendChild(infoComponent);
    inspectorContent.appendChild(transformComponent);

    // --- Event Listeners ---
    addTransformInputListeners(item);
}

function createVectorInputs(label, vector) {
    return `
        <div class="vector-input">
            <label>${label}</label>
            <div class="fields">
                <span>X</span><input type="number" data-property="${label.toLowerCase()}" data-axis="x" value="${vector.x}" step="0.1">
                <span>Y</span><input type="number" data-property="${label.toLowerCase()}" data-axis="y" value="${vector.y}" step="0.1">
                <span>Z</span><input type="number" data-property="${label.toLowerCase()}" data-axis="z" value="${vector.z}" step="0.1">
            </div>
        </div>
    `;
}

function addTransformInputListeners(item) {
    const inputs = inspectorContent.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const property = e.target.dataset.property; // "position", "rotation", or "scale"
            const axis = e.target.dataset.axis; // "x", "y", or "z"
            const value = parseFloat(e.target.value);

            if (!isNaN(value)) {
                item.transform[property][axis] = value;
                render(); // Re-render the entire UI to reflect the change
            }
        });
    });
}
