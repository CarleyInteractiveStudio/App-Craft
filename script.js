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
    let nextId = 3; // Start IDs from 3 since 1 and 2 are used
    let lastClickedTarget = null; // To track where the context menu was opened

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
     * Finds an item in the file system by its ID.
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

    // Initial render
    renderFileSystem(fileBrowserContent, fileSystem);

    // --- Context Menu Logic ---
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.innerHTML = `
        <ul>
            <li id="create-folder">
                <i class="fas fa-folder-plus"></i> Crear Carpeta
            </li>
            <li id="create-script">
                <i class="fas fa-file-alt"></i> Crear Script (.acs)
            </li>
        </ul>
    `;
    document.body.appendChild(contextMenu);

    fileBrowserContent.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        lastClickedTarget = e.target.closest('.file-item'); // Get the li element
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.display = 'block';
    });

    // Hide context menu on left-click
    window.addEventListener('click', () => {
        if (contextMenu.style.display === 'block') {
            contextMenu.style.display = 'none';
        }
    });

    document.getElementById('create-folder').addEventListener('click', () => {
        const folderName = prompt("Enter folder name:", "New Folder");
        if (!folderName) return;

        const newFolder = {
            id: nextId++,
            name: folderName,
            type: 'folder',
            children: []
        };

        let parentFolder = fileSystem; // Default to root
        if (lastClickedTarget) {
            const parentId = parseInt(lastClickedTarget.dataset.id, 10);
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
            id: nextId++,
            name: scriptName.endsWith('.acs') ? scriptName : `${scriptName}.acs`,
            type: 'script',
            children: []
        };

        let parentFolder = fileSystem; // Default to root
        if (lastClickedTarget) {
            const parentId = parseInt(lastClickedTarget.dataset.id, 10);
            const parentItem = findItemById(fileSystem, parentId);
             if (parentItem && parentItem.type === 'folder') {
                parentFolder = parentItem.children;
            }
        }

        parentFolder.push(newScript);
        renderFileSystem(fileBrowserContent, fileSystem);
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
