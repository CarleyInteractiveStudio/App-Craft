// Main Entry Point for App Craft Engine
import { FileSystemManager } from './fileSystem.js';
import { HierarchyManager } from './hierarchy.js';
import { InspectorManager } from './inspector.js';
import { GizmoManager } from './gizmos.js';

class AppCraftEngine {
    constructor() {
        this.fs = new FileSystemManager();
        this.hierarchy = new HierarchyManager(this);
        this.inspector = new InspectorManager(this);
        this.gizmos = new GizmoManager(this);

        this.currentProjectHandle = null;
        this.selectedElement = null;

        this.init();
    }

    async init() {
        console.log("App Craft Engine Initialized");

        // Event Listeners for UI
        document.getElementById('btn-open-folder').addEventListener('click', () => this.openProject());
        document.getElementById('btn-save').addEventListener('click', () => this.saveProject());
        document.getElementById('btn-add-element').addEventListener('click', () => this.showAddElementMenu());

        this.updateStatus("Listo para trabajar");
    }

    async openProject() {
        try {
            this.currentProjectHandle = await window.showDirectoryPicker();
            this.updateStatus(`Proyecto abierto: ${this.currentProjectHandle.name}`);
            document.getElementById('project-name').textContent = this.currentProjectHandle.name;

            // Load initial file (e.g., index.html)
            await this.fs.loadProject(this.currentProjectHandle);
            this.hierarchy.refresh();
        } catch (err) {
            console.error("Error opening directory:", err);
            this.updateStatus("Error al abrir la carpeta");
        }
    }

    async saveProject() {
        if (!this.currentProjectHandle) {
            this.updateStatus("No hay proyecto abierto para guardar");
            return;
        }

        await this.fs.saveProject();
        this.updateStatus("Cambios guardados localmente");
    }

    showAddElementMenu() {
        const type = prompt("¿Qué quieres añadir? (div, p, h1, button, img)", "div");
        if (!type) return;

        const previewFrame = document.getElementById('project-view');
        const doc = previewFrame.contentWindow.document;

        const newEl = doc.createElement(type);

        // Default styles for new elements to make them visible
        newEl.style.position = 'absolute';
        newEl.style.left = '50px';
        newEl.style.top = '50px';
        newEl.style.padding = '10px';
        newEl.style.backgroundColor = '#3b82f6';
        newEl.style.color = 'white';
        newEl.style.borderRadius = '4px';
        newEl.style.minWidth = '100px';
        newEl.style.minHeight = '30px';

        if (type === 'p' || type === 'h1' || type === 'button') {
            newEl.innerText = `Nuevo ${type}`;
        }

        doc.body.appendChild(newEl);

        this.hierarchy.refresh();
        this.selectElement(newEl);
        this.updateStatus(`Añadido nuevo <${type}>`);
    }

    selectElement(element) {
        this.selectedElement = element;
        this.hierarchy.highlight(element);
        this.inspector.loadElement(element);
        this.gizmos.attach(element);
    }

    updateStatus(message) {
        document.getElementById('status-text').textContent = message;
    }
}

// Initialize the engine when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.engine = new AppCraftEngine();
});
