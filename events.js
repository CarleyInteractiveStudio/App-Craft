document.addEventListener('DOMContentLoaded', () => {
    let lastClickedFileTarget = null;
    render();

    // --- Context Menu Logic ---
    const fileContextMenu = document.createElement('div');
    fileContextMenu.id = 'file-context-menu';
    fileContextMenu.className = 'context-menu';
    fileContextMenu.innerHTML = `
        <ul>
            <li id="create-window"><i class="fas fa-desktop"></i> Crear Ventana</li>
            <li id="create-folder"><i class="fas fa-folder-plus"></i> Crear Carpeta</li>
            <li id="create-script"><i class="fas fa-file-alt"></i> Crear Script (.acs)</li>
        </ul>
    `;
    document.body.appendChild(fileContextMenu);

    const hierarchyContextMenu = document.createElement('div');
    hierarchyContextMenu.id = 'hierarchy-context-menu';
    hierarchyContextMenu.className = 'context-menu';
    hierarchyContextMenu.innerHTML = `
        <ul>
            <li id="create-panel"><i class="fas fa-square"></i> Crear Panel</li>
            <li id="create-button"><i class="fas fa-mouse-pointer-square"></i> Crear Botón</li>
            <li id="create-text"><i class="fas fa-font"></i> Crear Texto</li>
            <li id="create-image"><i class="fas fa-image"></i> Crear Imagen</li>
        </ul>
    `;
    document.body.appendChild(hierarchyContextMenu);

    fileBrowserContent.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hideAllContextMenus();
        lastClickedFileTarget = e.target.closest('.file-item');
        fileContextMenu.style.top = `${e.clientY}px`;
        fileContextMenu.style.left = `${e.clientX}px`;
        fileContextMenu.style.display = 'block';
    });

    hierarchyContent.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        hideAllContextMenus();
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;
        hierarchyContextMenu.style.top = `${e.clientY}px`;
        hierarchyContextMenu.style.left = `${e.clientX}px`;
        hierarchyContextMenu.style.display = 'block';
    });

    function hideAllContextMenus() {
        fileContextMenu.style.display = 'none';
        hierarchyContextMenu.style.display = 'none';
    }

    window.addEventListener('click', () => hideAllContextMenus());

    // --- File Creation ---
    document.getElementById('create-window').addEventListener('click', () => {
        const name = prompt("Enter window name:", "Nueva Ventana");
        if (!name) return;
        const newFile = { id: nextFileId++, name, type: 'window', content: [], nextHierarchyId: 1 };
        addItemToFolder(newFile);
    });

    document.getElementById('create-folder').addEventListener('click', () => {
        const name = prompt("Enter folder name:", "New Folder");
        if (!name) return;
        const newFile = { id: nextFileId++, name, type: 'folder', expanded: true, children: [] };
        addItemToFolder(newFile);
    });

    document.getElementById('create-script').addEventListener('click', () => {
        const name = prompt("Enter script name:", "NewScript.acs");
        if (!name) return;
        const newFile = { id: nextFileId++, name: name.endsWith('.acs') ? name : `${name}.acs`, type: 'script' };
        addItemToFolder(newFile);
    });

    function addItemToFolder(item) {
        let parentFolder = fileSystem.find(i => i.type === 'folder');
        if (lastClickedFileTarget) {
            const parentId = parseInt(lastClickedFileTarget.dataset.id, 10);
            const parentItem = findItemById(fileSystem, parentId);
            if (parentItem && parentItem.type === 'folder') {
                parentFolder = parentItem;
            }
        }
        parentFolder.children.push(item);
        parentFolder.expanded = true; // Ensure folder is expanded when item is added
        render();
    }

    // --- Hierarchy Object Creation ---
    function createHierarchyObject(type, name) {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;
        const newItem = {
            id: activeWindow.nextHierarchyId++,
            name: name,
            type: type,
            active: true,
            transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
            },
            children: []
        };
        activeWindow.content.push(newItem);
        render();
    }

    document.getElementById('create-panel').addEventListener('click', () => createHierarchyObject('panel', 'Nuevo Panel'));
    document.getElementById('create-button').addEventListener('click', () => createHierarchyObject('button', 'Nuevo Botón'));
    document.getElementById('create-text').addEventListener('click', () => createHierarchyObject('text', 'Nuevo Texto'));
    document.getElementById('create-image').addEventListener('click', () => createHierarchyObject('image', 'Nueva Imagen'));

    // --- Hierarchy Selection ---
    hierarchyContent.addEventListener('click', (e) => {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;

        const nameContainer = e.target.closest('.hierarchy-item .name-container');
        if (!nameContainer) return;

        const listItem = nameContainer.closest('.hierarchy-item');
        const itemId = parseInt(listItem.dataset.id, 10);

        // Check if the clicked item is the window itself or an element within the window
        if (itemId === activeWindow.id) {
            selectedObject = activeWindow;
        } else {
            const clickedItem = findItemById(activeWindow.content, itemId);
            if (e.target.classList.contains('eye-icon')) {
                clickedItem.active = !clickedItem.active;
            } else {
                selectedObject = clickedItem;
            }
        }
        render();
    });

    // --- View Selection ---
    viewContent.addEventListener('click', (e) => {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;

        if (e.target === viewContent) {
            selectedObject = null;
            render();
            return;
        }
        const viewObject = e.target.closest('.view-object');
        if (viewObject) {
            const objectId = parseInt(viewObject.dataset.id, 10);
            selectedObject = findItemById(activeWindow.content, objectId);
            render();
        }
    });

    // --- File Browser Interactions ---
    fileBrowserContent.addEventListener('click', (e) => {
        const nameContainer = e.target.closest('.name-container');
        if (!nameContainer) return;
        const fileId = parseInt(nameContainer.closest('.file-item').dataset.id, 10);
        const fileItem = findItemById(fileSystem, fileId);

        if (fileItem && fileItem.type === 'folder') {
            fileItem.expanded = !fileItem.expanded;
            render();
        }
    });

    fileBrowserContent.addEventListener('dblclick', (e) => {
        const nameContainer = e.target.closest('.name-container');
        if (!nameContainer) return;
        const fileId = parseInt(nameContainer.closest('.file-item').dataset.id, 10);
        const fileItem = findItemById(fileSystem, fileId);

        if (fileItem && fileItem.type === 'window') {
            activeWindowId = fileId;
            selectedObject = null;
            render();
        }
    });
});
