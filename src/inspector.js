/**
 * InspectorManager handles editing of attributes and styles for the
 * currently selected HTML element.
 */
export class InspectorManager {
    constructor(engine) {
        this.engine = engine;
        this.inspectorContent = document.getElementById('inspector-content');
        this.selectedElement = null;
    }

    /**
     * Loads the attributes and current styles of the selected element
     * into the inspector panel for editing.
     * @param {HTMLElement} element
     */
    loadElement(element) {
        this.selectedElement = element;
        this.inspectorContent.innerHTML = ''; // Clear previous fields

        if (!element) {
            this.inspectorContent.innerHTML = '<div class="no-selection">Selecciona un elemento para editar</div>';
            return;
        }

        const html = `
            <div class="field">
                <label>ID:</label>
                <input type="text" id="inspector-id" value="${element.id || ''}" placeholder="Sin ID">
            </div>
            <div class="field">
                <label>Clases:</label>
                <input type="text" id="inspector-classes" value="${Array.from(element.classList).join(' ')}" placeholder="Clase1 clase2...">
            </div>

            <div class="field">
                <label>Texto Contenido:</label>
                <input type="text" id="inspector-inner-text" value="${element.innerText || ''}" placeholder="...">
            </div>

            <div class="field-group">
                <div class="group-header">Posicionamiento & Layout</div>
                <div class="field">
                    <label>Display:</label>
                    <select id="inspector-display">
                        <option value="block" ${window.getComputedStyle(element).display === 'block' ? 'selected' : ''}>Block</option>
                        <option value="flex" ${window.getComputedStyle(element).display === 'flex' ? 'selected' : ''}>Flex</option>
                        <option value="grid" ${window.getComputedStyle(element).display === 'grid' ? 'selected' : ''}>Grid</option>
                        <option value="inline-block" ${window.getComputedStyle(element).display === 'inline-block' ? 'selected' : ''}>Inline-Block</option>
                        <option value="none" ${window.getComputedStyle(element).display === 'none' ? 'selected' : ''}>None</option>
                    </select>
                </div>
                <div class="field">
                    <label>Position:</label>
                    <select id="inspector-position">
                        <option value="static" ${window.getComputedStyle(element).position === 'static' ? 'selected' : ''}>Static</option>
                        <option value="relative" ${window.getComputedStyle(element).position === 'relative' ? 'selected' : ''}>Relative</option>
                        <option value="absolute" ${window.getComputedStyle(element).position === 'absolute' ? 'selected' : ''}>Absolute</option>
                        <option value="fixed" ${window.getComputedStyle(element).position === 'fixed' ? 'selected' : ''}>Fixed</option>
                    </select>
                </div>
            </div>

            <div class="field-group">
                <div class="group-header">Estilos / Reglas</div>
                <div class="field">
                    <label>Fondo:</label>
                    <input type="color" id="inspector-bgcolor" value="${this.rgbToHex(window.getComputedStyle(element).backgroundColor)}">
                </div>
                <div class="field">
                    <label>Color Texto:</label>
                    <input type="color" id="inspector-color" value="${this.rgbToHex(window.getComputedStyle(element).color)}">
                </div>
                <div class="field">
                    <label>Tamaño Fuente:</label>
                    <input type="text" id="inspector-font-size" value="${window.getComputedStyle(element).fontSize}" placeholder="16px">
                </div>
                <div class="field">
                    <label>Padding:</label>
                    <input type="text" id="inspector-padding" value="${window.getComputedStyle(element).padding}">
                </div>
                <div class="field">
                    <label>Border:</label>
                    <input type="text" id="inspector-border" value="${window.getComputedStyle(element).border}">
                </div>
                <div class="field">
                    <label>Border Radius:</label>
                    <input type="text" id="inspector-border-radius" value="${window.getComputedStyle(element).borderRadius}">
                </div>
            </div>
        `;
        this.inspectorContent.innerHTML = html;

        // Add event listeners for editing styles and attributes
        this.inspectorContent.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', (e) => this.handleStyleChange(e));
        });
    }

    /**
     * Updates the element's style or attribute in real-time.
     * @param {Event} e
     */
    handleStyleChange(e) {
        if (!this.selectedElement) return;

        const id = e.target.id;
        const value = e.target.value;

        switch (id) {
            case 'inspector-id':
                this.selectedElement.id = value;
                this.engine.hierarchy.refresh(); // Refresh names if ID changes
                break;
            case 'inspector-classes':
                this.selectedElement.className = value;
                break;
            case 'inspector-inner-text':
                this.selectedElement.innerText = value;
                break;
            case 'inspector-display':
                this.selectedElement.style.display = value;
                break;
            case 'inspector-position':
                this.selectedElement.style.position = value;
                break;
            case 'inspector-bgcolor':
                this.selectedElement.style.backgroundColor = value;
                break;
            case 'inspector-color':
                this.selectedElement.style.color = value;
                break;
            case 'inspector-font-size':
                this.selectedElement.style.fontSize = value;
                break;
            case 'inspector-padding':
                this.selectedElement.style.padding = value;
                break;
            case 'inspector-border':
                this.selectedElement.style.border = value;
                break;
            case 'inspector-border-radius':
                this.selectedElement.style.borderRadius = value;
                break;
        }

        // Refresh Gizmos if position or size changes
        this.engine.gizmos.attach(this.selectedElement);
    }

    /**
     * Helper to convert RGB style to Hex for color inputs.
     * @param {string} rgb
     * @returns {string}
     */
    rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff';
        const result = rgb.match(/\d+/g);
        if (!result) return '#ffffff';
        return "#" + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }
}
