document.addEventListener('DOMContentLoaded', () => {
    // Represents the file system structure
    const fileSystem = [
        {
            id: 1,
            name: 'Assets',
            type: 'folder',
            children: [
                {
                    id: 2,
                    name: 'Main.acs',
                    type: 'script',
                    children: []
                }
            ]
        }
    ];

    const fileBrowserContent = document.querySelector('#files-panel .window-content');

    // --- State Management ---
    let nextFileId = 3; // Start IDs from 3 since 1 and 2 are used for files
    let lastClickedFileTarget = null; // To track where the file context menu was opened

    // Represents the hierarchy of objects in the scene
    const hierarchy = [
        {
            id: 1,
            name: 'Panel Principal',
            type: 'panel',
            active: true,
            children: [
                {
                    id: 2,
                    name: 'Texto de Bienvenida',
                    type: 'text',
                    active: true,
                    children: []
                }
            ]
        }
    ];
    let nextHierarchyId = 3;

    /**
     * Populates a parent UL element with list items representing files and folders.
     * This function is called recursively for nested folders.
     * @param {HTMLElement} parentElement - The UL element to populate.
     * @param {Array} items - The array of file system items.
     */
    function populateTree(parentElement, items) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.dataset.id = item.id;

            const nameContainer = document.createElement('div');
            nameContainer.className = 'name-container';

            const icon = document.createElement('i');
            icon.className = `fas ${item.type === 'folder' ? 'fa-folder' : 'fa-scroll'}`;
            nameContainer.appendChild(icon);

            const span = document.createElement('span');
            span.textContent = item.name;
            nameContainer.appendChild(span);
            li.appendChild(nameContainer);

            if (item.type === 'folder') {
                li.classList.add('folder-item');
                const childrenContainer = document.createElement('ul');
                childrenContainer.className = 'children-container';
                childrenContainer.style.display = 'none';
                if (item.children && item.children.length > 0) {
                    populateTree(childrenContainer, item.children);
                }
                li.appendChild(childrenContainer);
            }
            parentElement.appendChild(li);
        });
    }

    /**
     * Clears the file browser and renders the entire file system from scratch.
     * @param {HTMLElement} rootElement - The main container for the file browser.
     * @param {Array} fileSystemData - The root array of the file system.
     */
    function renderFileSystem(rootElement, fileSystemData) {
        rootElement.innerHTML = '';
        const topLevelUl = document.createElement('ul');
        topLevelUl.className = 'file-tree';
        populateTree(topLevelUl, fileSystemData);
        rootElement.appendChild(topLevelUl);
    }

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

    // --- Hierarchy Rendering ---
    const hierarchyContent = document.querySelector('#hierarchy-panel .window-content');
    const iconMap = {
        panel: 'fa-square',
        button: 'fa-mouse-pointer-square',
        text: 'fa-font',
        image: 'fa-image',
        default: 'fa-cube'
    };

    function renderHierarchy(rootElement, hierarchyData) {
        rootElement.innerHTML = '';
        const topLevelUl = document.createElement('ul');
        topLevelUl.className = 'hierarchy-tree';
        populateHierarchy(topLevelUl, hierarchyData);
        rootElement.appendChild(topLevelUl);
    }

    function populateHierarchy(parentElement, items) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'hierarchy-item';
            li.dataset.id = item.id;

            const nameContainer = document.createElement('div');
            nameContainer.className = 'name-container';

            const icon = document.createElement('i');
            icon.className = `fas ${iconMap[item.type] || iconMap.default}`;
            nameContainer.appendChild(icon);

            const span = document.createElement('span');
            span.textContent = item.name;
            nameContainer.appendChild(span);

            const eyeIcon = document.createElement('i');
            eyeIcon.className = `fas ${item.active ? 'fa-eye' : 'fa-eye-slash'} eye-icon`;
            nameContainer.appendChild(eyeIcon);

            li.appendChild(nameContainer);

            if (item.children && item.children.length > 0) {
                const childrenContainer = document.createElement('ul');
                childrenContainer.className = 'children-container';
                populateHierarchy(childrenContainer, item.children);
                li.appendChild(childrenContainer);
            }
            parentElement.appendChild(li);
        });
    }

    // Initial renders
    renderFileSystem(fileBrowserContent, fileSystem);
    renderHierarchy(hierarchyContent, hierarchy);

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
        // lastClickedHierarchyTarget will be set here later
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
        renderFileSystem(fileBrowserContent, fileSystem);
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
        renderFileSystem(fileBrowserContent, fileSystem);
    });

    // --- Hierarchy Object Creation ---
    function createHierarchyObject(type, name) {
        const newItem = {
            id: nextHierarchyId++,
            name: name,
            type: type,
            active: true,
            children: []
        };
        // For now, add all new items to the root level.
        // Logic to add as a child of a selected item will be added later.
        hierarchy.push(newItem);
        renderHierarchy(hierarchyContent, hierarchy);
    }

    document.getElementById('create-panel').addEventListener('click', () => createHierarchyObject('panel', 'Nuevo Panel'));
    document.getElementById('create-button').addEventListener('click', () => createHierarchyObject('button', 'Nuevo Botón'));
    document.getElementById('create-text').addEventListener('click', () => createHierarchyObject('text', 'Nuevo Texto'));
    document.getElementById('create-image').addEventListener('click', () => createHierarchyObject('image', 'Nueva Imagen'));

    // --- Inspector Logic ---
    const inspectorContent = document.querySelector('#inspector-panel .window-content');
    let selectedHierarchyItem = null;

    function renderInspector(item) {
        inspectorContent.innerHTML = ''; // Clear previous content
        if (!item) {
            inspectorContent.innerHTML = '<p>No hay nada seleccionado.</p>';
            return;
        }

        const html = `
            <h4>${item.name}</h4>
            <div class="component">
                <strong>Estado:</strong>
                <span>${item.active ? 'Activo' : 'Inactivo'}</span>
            </div>
            <div class="component">
                <strong>Tipo:</strong>
                <span>${item.type}</span>
            </div>
        `;
        inspectorContent.innerHTML = html;
    }

    // --- Hierarchy Selection & Inspector Update ---
    hierarchyContent.addEventListener('click', (e) => {
        const nameContainer = e.target.closest('.hierarchy-item .name-container');
        if (!nameContainer) return;

        const itemId = parseInt(nameContainer.closest('.hierarchy-item').dataset.id, 10);
        const clickedItem = findItemById(hierarchy, itemId);

        if (e.target.classList.contains('eye-icon')) {
            // --- Handle Active/Inactive Toggle ---
            clickedItem.active = !clickedItem.active;
            renderHierarchy(hierarchyContent, hierarchy); // Re-render to update eye icon
            // If the toggled item is the selected one, update the inspector too
            if (selectedHierarchyItem && selectedHierarchyItem.id === itemId) {
                renderInspector(clickedItem);
            }
        } else {
            // --- Handle Selection ---
            const currentlySelected = document.querySelector('.hierarchy-item .name-container.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }
            nameContainer.classList.add('selected');
            selectedHierarchyItem = clickedItem;
            renderInspector(selectedHierarchyItem);
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

            // Toggle folder icon
            if (isExpanded) {
                icon.classList.remove('fa-folder-open');
                icon.classList.add('fa-folder');
            } else {
                icon.classList.remove('fa-folder');
                icon.classList.add('fa-folder-open');
            }
        }
    });
});
