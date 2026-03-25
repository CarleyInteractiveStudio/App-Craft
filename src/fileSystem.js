/**
 * FileSystemManager handles the interaction with the local file system using
 * the File System Access API. It's responsible for reading and writing
 * the project's HTML and CSS files.
 */
export class FileSystemManager {
    constructor() {
        this.directoryHandle = null;
        this.projectFiles = {
            html: null,
            css: null
        };
        this.content = {
            html: '',
            css: ''
        };
    }

    /**
     * Loads the project from the provided directory handle.
     * Looks for index.html and style.css as the core files.
     * @param {FileSystemDirectoryHandle} handle
     */
    async loadProject(handle) {
        this.directoryHandle = handle;

        try {
            // Find or create index.html
            try {
                this.projectFiles.html = await handle.getFileHandle('index.html');
            } catch (e) {
                this.projectFiles.html = await handle.getFileHandle('index.html', { create: true });
                const file = await this.projectFiles.html.getFile();
                if (file.size === 0) {
                    await this.writeFile(this.projectFiles.html, `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Nuevo Proyecto App Craft</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="root">
        <h1>¡Bienvenido a App Craft!</h1>
        <p>Empieza a editar este sitio web.</p>
    </div>
</body>
</html>`);
                }
            }

            // Find or create style.css
            try {
                this.projectFiles.css = await handle.getFileHandle('style.css');
            } catch (e) {
                this.projectFiles.css = await handle.getFileHandle('style.css', { create: true });
            }

            // Read contents
            this.content.html = await (await this.projectFiles.html.getFile()).text();
            this.content.css = await (await this.projectFiles.css.getFile()).text();

            this.updatePreview();
        } catch (err) {
            console.error("Failed to load project files:", err);
            throw err;
        }
    }

    /**
     * Updates the iframe preview with the current project's HTML content.
     */
    updatePreview() {
        const previewFrame = document.getElementById('project-view');
        if (!previewFrame) return;

        const doc = previewFrame.contentWindow.document;
        doc.open();
        doc.write(this.content.html);

        // Inject styles
        const styleTag = doc.createElement('style');
        styleTag.id = 'app-craft-styles';
        styleTag.textContent = this.content.css;
        doc.head.appendChild(styleTag);

        doc.close();

        // Notify hierarchy to refresh once the iframe is ready
        previewFrame.onload = () => {
            if (window.engine) {
                window.engine.hierarchy.refresh();
                this.setupDirectSelection(doc);
            }
        };
    }

    /**
     * Sets up click listeners on the project iframe for direct element selection.
     * @param {Document} doc
     */
    setupDirectSelection(doc) {
        doc.body.addEventListener('click', (e) => {
            // Prevent default behavior (like following links)
            e.preventDefault();
            e.stopPropagation();

            if (e.target !== doc.body) {
                window.engine.selectElement(e.target);
            }
        });

        // Also handle hover for highlighting
        doc.body.addEventListener('mouseover', (e) => {
            if (e.target !== doc.body) {
                e.target.dataset.appCraftHover = "true";
                e.target.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
            }
        });

        doc.body.addEventListener('mouseout', (e) => {
            if (e.target !== doc.body && e.target !== window.engine.selectedElement) {
                delete e.target.dataset.appCraftHover;
                e.target.style.outline = '';
            }
        });
    }

    /**
     * Updates the internal content from the current state of the iframe
     */
    syncFromEditor() {
        const previewFrame = document.getElementById('project-view');
        if (!previewFrame) return;

        const doc = previewFrame.contentWindow.document;

        // Clone to avoid modifying the live view during serialization
        const docClone = doc.documentElement.cloneNode(true);

        // 1. Remove our injected style tag
        const injectedStyle = docClone.querySelector('#app-craft-styles');
        if (injectedStyle) injectedStyle.remove();

        // 2. Cleanup editor-only attributes and temporary styles
        const elements = docClone.querySelectorAll('*');
        elements.forEach(el => {
            // Remove editor outlines and hover effects
            if (el.style.outline && (el.style.outline.includes('rgb(59, 130, 246)') || el.style.outline.includes('rgba(59, 130, 246'))) {
                el.style.outline = '';
            }
            // Remove temporary data attributes
            delete el.dataset.appCraftHover;
        });

        this.content.html = '<!DOCTYPE html>\n' + docClone.outerHTML;

        // CSS is handled separately through the inspector or style tag in the live doc
        const liveStyle = doc.getElementById('app-craft-styles');
        if (liveStyle) {
            this.content.css = liveStyle.textContent;
        }
    }

    /**
     * Saves the current project state back to the local file system.
     */
    async saveProject() {
        if (!this.projectFiles.html) return;

        try {
            // Sync content from the current state of the editor iframe
            this.syncFromEditor();

            await this.writeFile(this.projectFiles.html, this.content.html);
            await this.writeFile(this.projectFiles.css, this.content.css);
            console.log("Project saved successfully.");
        } catch (err) {
            console.error("Failed to save project files:", err);
            throw err;
        }
    }

    /**
     * Helper method to write content to a file handle.
     * @param {FileSystemFileHandle} fileHandle
     * @param {string} content
     */
    async writeFile(fileHandle, content) {
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }
}
