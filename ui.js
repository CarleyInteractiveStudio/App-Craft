const hierarchyContent = document.querySelector('#hierarchy-panel .window-content');
const fileBrowserContent = document.querySelector('#files-panel .window-content');
const viewContent = document.querySelector('#view-panel .window-content');

const hierarchyIconMap = {
    window: 'fa-desktop',
    panel: 'fa-square',
    canvas: 'fa-border-all',
    button: 'fa-mouse-pointer-square',
    text: 'fa-font',
    default: 'fa-cube'
};

const fileBrowserIconMap = {
    folder: 'fa-folder',
    script: 'fa-scroll',
    window: 'fa-desktop',
    default: 'fa-file'
};

function buildTree(list, parentId) {
    const children = list.filter(item => item.parentId === parentId);
    if (children.length === 0) return null;

    return children.map(child => ({
        ...child,
        children: buildTree(list, child.id)
    }));
}

function renderHierarchy(rootElement, activeWindow) {
    rootElement.innerHTML = '';
    if (!activeWindow) return;

    const topLevelUl = document.createElement('ul');
    topLevelUl.className = 'hierarchy-tree';

    const tree = buildTree(activeWindow.content, activeWindow.id);

    populateHierarchy(topLevelUl, [{ ...activeWindow, children: tree }]);
    rootElement.appendChild(topLevelUl);
}

function populateHierarchy(parentElement, items) {
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'hierarchy-item';
        li.dataset.id = item.id;

        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';
        if (item.id === selectedObjectId) {
            nameContainer.classList.add('selected');
        }

        const icon = document.createElement('i');
        icon.className = `fas ${hierarchyIconMap[item.type] || hierarchyIconMap.default}`;
        nameContainer.appendChild(icon);

        const span = document.createElement('span');
        span.textContent = item.name;
        nameContainer.appendChild(span);

        if (item.type !== 'window') {
            const eyeIcon = document.createElement('i');
            eyeIcon.className = `fas ${item.active ? 'fa-eye' : 'fa-eye-slash'} eye-icon`;
            nameContainer.appendChild(eyeIcon);
        }

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

function renderFileSystem(rootElement, fileSystemData) {
    rootElement.innerHTML = '';
    const topLevelUl = document.createElement('ul');
    topLevelUl.className = 'file-tree';
    populateTree(topLevelUl, fileSystemData);
    rootElement.appendChild(topLevelUl);
}

function populateTree(parentElement, items) {
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'file-item';
        if (item.id === activeWindowId) {
            li.classList.add('selected');
        }
        li.dataset.id = item.id;
        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';
        const icon = document.createElement('i');
        let iconName = fileBrowserIconMap[item.type] || fileBrowserIconMap.default;
        if (item.type === 'folder' && item.expanded) {
            iconName = 'fa-folder-open';
        }
        icon.className = `fas ${iconName}`;
        nameContainer.appendChild(icon);
        const span = document.createElement('span');
        span.textContent = item.name;
        nameContainer.appendChild(span);
        li.appendChild(nameContainer);
        if (item.type === 'folder') {
            li.classList.add('folder-item');
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'children-container';
            childrenContainer.style.display = item.expanded ? 'block' : 'none';
            if (item.children && item.children.length > 0) {
                populateTree(childrenContainer, item.children);
            }
            li.appendChild(childrenContainer);
        }
        parentElement.appendChild(li);
    });
}

function renderView(viewElement, activeWindow) {
    viewElement.innerHTML = '';
    if (!activeWindow || !activeWindow.content) return;

    const elementsMap = new Map();

    // First pass: create all elements and map them by ID
    activeWindow.content.forEach(item => {
        if (!item.active) return;
        let element;
        switch (item.type) {
            case 'button':
                element = document.createElement('button');
                element.textContent = item.name;
                break;
            case 'text':
                element = document.createElement('div');
                element.textContent = item.name;
                break;
            case 'panel':
            case 'canvas':
                element = document.createElement('div');
                element.style.position = 'relative'; // Crucial for nesting
                break;
            default:
                element = document.createElement('div');
                break;
        }
        element.className = 'view-object';
        element.dataset.id = item.id;
        elementsMap.set(item.id, element);
    });

    // Second pass: apply styles and append to correct parent
    activeWindow.content.forEach(item => {
        if (!item.active) return;

        const element = elementsMap.get(item.id);
        if (!element) return;

        // Apply styles based on type
        if (item.type === 'canvas') {
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.position = 'absolute';
            element.style.top = '0';
            element.style.left = '0';
            element.style.transform = ''; // No transform
        } else {
             const { position, rotation, scale } = item.transform;
            element.style.position = 'absolute';
            element.style.left = `calc(50% + ${position.x}px)`;
            element.style.top = `calc(50% + ${position.y}px)`;
            element.style.transform = `translateX(-50%) translateY(-50%) translateZ(${position.z}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) scale(${scale.x}, ${scale.y})`;
        }

        if (item.type === 'panel') {
            element.style.width = `${item.size.width}px`;
            element.style.height = `${item.size.height}px`;
            element.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            element.style.border = '1px solid #555';
        }

        if (item.id === selectedObjectId) {
            element.classList.add('selected');
        }

        // Append to the correct parent
        const parentElement = item.parentId === activeWindowId ? viewElement : elementsMap.get(item.parentId);
        if (parentElement) {
            parentElement.appendChild(element);
        }
    });
}

function render() {
    const activeWindow = findItemById(fileSystem, activeWindowId);

    renderHierarchy(hierarchyContent, activeWindow);
    renderFileSystem(fileBrowserContent, fileSystem);
    renderView(viewContent, activeWindow);

    const selectedObject = activeWindow ? (findItemById(activeWindow.content, selectedObjectId) || (selectedObjectId === activeWindowId ? activeWindow : null)) : null;
    renderInspector(selectedObject);
}
