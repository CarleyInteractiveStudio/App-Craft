document.addEventListener('DOMContentLoaded', () => {
    let lastClickedFileTarget = null;
    let lastClickedHierarchyId = null;
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
            <li id="create-canvas"><i class="fas fa-border-all"></i> Crear Canvas</li>
            <li id="create-button"><i class="fas fa-mouse-pointer-square"></i> Crear Botón</li>
            <li id="create-text"><i class="fas fa-font"></i> Crear Texto</li>
            <li id="create-media"><i class="fas fa-photo-video"></i> Crear Media</li>
            <hr/>
            <li id="delete-object" class="danger"><i class="fas fa-trash-alt"></i> Borrar</li>
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

        const listItem = e.target.closest('.hierarchy-item');
        lastClickedHierarchyId = listItem ? parseInt(listItem.dataset.id, 10) : activeWindowId;

        // Prevent deleting the root window object from the hierarchy view
        document.getElementById('delete-object').style.display = lastClickedHierarchyId === activeWindowId ? 'none' : 'block';

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
        const newFile = { id: nextFileId++, name, type: 'window', content: [], nextHierarchyId: 101 };
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
        parentFolder.expanded = true;
        render();
    }

    // --- Hierarchy Object Creation & Deletion ---
    function createHierarchyObject(type) {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;
        const parentId = lastClickedHierarchyId || activeWindowId;

        const baseItem = {
            id: activeWindow.nextHierarchyId++,
            parentId: parentId,
            active: true,
            transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            background: {
                type: 'solid', // 'solid' or 'gradient'
                color: '#555555',
                gradient: ['#FF0000', '#0000FF'],
                opacity: 1
            }
        };

        if (type === 'button') {
            const buttonItem = { ...baseItem, name: 'Nuevo Botón', type: 'button', size: { width: 120, height: 40 } };
            // Child text for a button should not have a visible background by default
            const textItem = {
                id: activeWindow.nextHierarchyId++,
                parentId: buttonItem.id,
                name: 'Texto',
                type: 'text',
                active: true,
                transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
                text: 'Botón', fontSize: 16, color: '#FFFFFF',
                background: { type: 'solid', color: '#555555', gradient: [], opacity: 0 }
            };
            activeWindow.content.push(buttonItem, textItem);
        } else {
            switch (type) {
                case 'panel':
                    baseItem.name = 'Nuevo Panel'; baseItem.type = 'panel'; baseItem.size = { width: 200, height: 150 };
                    break;
                case 'canvas':
                    baseItem.name = 'Nuevo Canvas'; baseItem.type = 'canvas';
                    break;
                case 'text':
                    baseItem.name = 'Nuevo Texto'; baseItem.type = 'text'; baseItem.text = 'Texto de ejemplo'; baseItem.fontSize = 16; baseItem.color = '#FFFFFF';
                    baseItem.background.opacity = 0; // Standalone text is transparent by default
                    break;
                case 'media':
                    baseItem.name = 'Nuevo Media';
                    baseItem.type = 'media';
                    baseItem.size = { width: 192, height: 108 }; // Default 16:9 ratio
                    baseItem.background.color = '#FFFFFF';
                    baseItem.background.opacity = 1;
                    baseItem.media = {
                        type: 'image', // 'image' or 'video'
                        source: null
                    };
                    break;
            }
            activeWindow.content.push(baseItem);
        }
        render();
    }

    function deleteObjectAndChildren(objectId) {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;

        const children = activeWindow.content.filter(obj => obj.parentId === objectId);
        for (const child of children) {
            deleteObjectAndChildren(child.id);
        }

        const index = activeWindow.content.findIndex(obj => obj.id === objectId);
        if (index > -1) {
            activeWindow.content.splice(index, 1);
        }
    }

    document.getElementById('create-panel').addEventListener('click', () => createHierarchyObject('panel'));
    document.getElementById('create-canvas').addEventListener('click', () => createHierarchyObject('canvas'));
    document.getElementById('create-button').addEventListener('click', () => createHierarchyObject('button'));
    document.getElementById('create-text').addEventListener('click', () => createHierarchyObject('text'));
    document.getElementById('create-media').addEventListener('click', () => createHierarchyObject('media'));
    document.getElementById('delete-object').addEventListener('click', () => {
        if (lastClickedHierarchyId && lastClickedHierarchyId !== activeWindowId) {
            deleteObjectAndChildren(lastClickedHierarchyId);
            if (selectedObjectId === lastClickedHierarchyId) {
                selectedObjectId = null;
            }
            render();
        }
    });

    // --- Hierarchy Selection ---
    hierarchyContent.addEventListener('click', (e) => {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;
        const nameContainer = e.target.closest('.hierarchy-item .name-container');
        if (!nameContainer) return;
        const listItem = nameContainer.closest('.hierarchy-item');
        const itemId = parseInt(listItem.dataset.id, 10);
        const clickedItem = findItemById(activeWindow.content, itemId) || (itemId === activeWindowId ? activeWindow : null);

        if (e.target.classList.contains('eye-icon') && clickedItem && clickedItem.type !== 'window') {
            clickedItem.active = !clickedItem.active;
        } else {
            selectedObjectId = itemId;
        }
        render();
    });

    // --- View Selection ---
    viewContent.addEventListener('click', (e) => {
        const activeWindow = findItemById(fileSystem, activeWindowId);
        if (!activeWindow) return;

        if (e.target === viewContent) {
            selectedObjectId = null;
            render();
            return;
        }
        const viewObject = e.target.closest('.view-object');
        if (viewObject) {
            selectedObjectId = parseInt(viewObject.dataset.id, 10);
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
            selectedObjectId = null;
            render();
        }
    });
});
