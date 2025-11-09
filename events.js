document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    render();

    // --- Context Menu Logic ---
    const fileContextMenu = document.createElement('div');
    fileContextMenu.id = 'file-context-menu';
    fileContextMenu.className = 'context-menu'; // Generic class for styling
    fileContextMenu.innerHTML = `
        <ul>
            <li id="create-folder"><i class="fas fa-folder-plus"></i> Crear Carpeta</li>
            <li id="create-script"><i class="fas fa-file-alt"></i> Crear Script (.acs)</li>
        </ul>
    `;
    document.body.appendChild(fileContextMenu);

    const hierarchyContextMenu = document.createElement('div');
    hierarchyContextMenu.id = 'hierarchy-context-menu';
    hierarchyContextMenu.className = 'context-menu'; // Generic class for styling
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
        hierarchyContextMenu.style.top = `${e.clientY}px`;
        hierarchyContextMenu.style.left = `${e.clientX}px`;
        hierarchyContextMenu.style.display = 'block';
    });

    function hideAllContextMenus() {
        fileContextMenu.style.display = 'none';
        hierarchyContextMenu.style.display = 'none';
    }

    // Hide context menus on left-click
    window.addEventListener('click', () => {
        hideAllContextMenus();
    });

    document.getElementById('create-folder').addEventListener('click', () => {
        const folderName = prompt("Enter folder name:", "New Folder");
        if (!folderName) return;

        const newFolder = {
            id: nextFileId++,
            name: folderName,
            type: 'folder',
            children: []
        };

        let parentFolder = fileSystem; // Default to root
        if (lastClickedFileTarget) {
            const parentId = parseInt(lastClickedFileTarget.dataset.id, 10);
            const parentItem = findItemById(fileSystem, parentId);
            if (parentItem && parentItem.type === 'folder') {
                parentFolder = parentItem.children;
            }
        }

        parentFolder.push(newFolder);
        render();
    });

    document.getElementById('create-script').addEventListener('click', () => {
        const scriptName = prompt("Enter script name:", "NewScript.acs");
        if (!scriptName) return;

        const newScript = {
            id: nextFileId++,
            name: scriptName.endsWith('.acs') ? scriptName : `${scriptName}.acs`,
            type: 'script',
            children: []
        };

        let parentFolder = fileSystem; // Default to root
        if (lastClickedFileTarget) {
            const parentId = parseInt(lastClickedFileTarget.dataset.id, 10);
            const parentItem = findItemById(fileSystem, parentId);
             if (parentItem && parentItem.type === 'folder') {
                parentFolder = parentItem.children;
            }
        }

        parentFolder.push(newScript);
        render();
    });

    // --- Hierarchy Object Creation ---
    function createHierarchyObject(type, name) {
        const newItem = {
            id: nextHierarchyId++,
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
        hierarchy.push(newItem);
        render();
    }

    document.getElementById('create-panel').addEventListener('click', () => createHierarchyObject('panel', 'Nuevo Panel'));
    document.getElementById('create-button').addEventListener('click', () => createHierarchyObject('button', 'Nuevo Botón'));
    document.getElementById('create-text').addEventListener('click', () => createHierarchyObject('text', 'Nuevo Texto'));
    document.getElementById('create-image').addEventListener('click', () => createHierarchyObject('image', 'Nueva Imagen'));

    // --- Hierarchy Selection & Inspector Update ---
    hierarchyContent.addEventListener('click', (e) => {
        const nameContainer = e.target.closest('.hierarchy-item .name-container');
        if (!nameContainer) return;

        const itemId = parseInt(nameContainer.closest('.hierarchy-item').dataset.id, 10);
        const clickedItem = findItemById(hierarchy, itemId);

        if (e.target.classList.contains('eye-icon')) {
            clickedItem.active = !clickedItem.active;
        } else {
            selectedObject = clickedItem;
        }
        render();
    });

    // --- View Selection ---
    viewContent.addEventListener('click', (e) => {
        // Deselect if clicking the background
        if (e.target === viewContent) {
            selectedObject = null;
            render();
            return;
        }

        const viewObject = e.target.closest('.view-object');
        if (viewObject) {
            const objectId = parseInt(viewObject.dataset.id, 10);
            selectedObject = findItemById(hierarchy, objectId);
            render();
        }
    });

    // --- Folder Expansion Logic ---
    fileBrowserContent.addEventListener('click', (e) => {
        const target = e.target.closest('.name-container');
        if (!target) return;

        const parentLi = target.closest('.folder-item');
        if (!parentLi) return;

        const childrenContainer = parentLi.querySelector('.children-container');
        const icon = target.querySelector('i.fas');

        if (childrenContainer) {
            const isExpanded = childrenContainer.style.display !== 'none';
            childrenContainer.style.display = isExpanded ? 'none' : 'block';

            if (isExpanded) {
                icon.classList.remove('fa-folder-open');
                icon.classList.add('fa-folder');
            } else {
                icon.classList.remove('fa-folder');
                icon.classList.add('fa-folder-open');
            }
        }
    });

    /**
     * Finds an item by its ID in a tree-like structure.
     * @param {Array} items The array of items to search in.
     * @param {number} id The ID of the item to find.
     * @returns {Object|null} The found item or null.
     */
    function findItemById(items, id) {
        for (const item of items) {
            if (item.id === id) {
                return item;
            }
            if (item.children && item.children.length > 0) {
                const found = findItemById(item.children, id);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
});
