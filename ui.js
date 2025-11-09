const hierarchyContent = document.querySelector('#hierarchy-panel .window-content');
const fileBrowserContent = document.querySelector('#files-panel .window-content');
const viewContent = document.querySelector('#view-panel .window-content');

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
        if (selectedObject && selectedObject.id === item.id) {
            nameContainer.classList.add('selected');
        }

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

function renderView(viewElement, hierarchyData) {
    viewElement.innerHTML = ''; // Clear the view

    hierarchyData.forEach(item => {
        if (!item.active) return; // Skip inactive items

        let element;
        // Create the element based on its type
        switch (item.type) {
            case 'button':
                element = document.createElement('button');
                element.textContent = item.name;
                break;
            case 'text':
                element = document.createElement('div');
                element.textContent = item.name;
                element.style.textAlign = 'center';
                break;
            case 'panel':
            default:
                element = document.createElement('div');
                element.style.border = '1px solid #555';
                element.style.boxSizing = 'border-box';
                element.innerHTML = `<span style="color: #aaa; font-size: 12px; padding: 4px; pointer-events: none;">${item.name}</span>`;
                break;
        }

        element.className = 'view-object';
        element.dataset.id = item.id;

        // Apply transform styles
        const { position, rotation, scale } = item.transform;
        element.style.position = 'absolute';
        // Use left/top for positioning and transform for other effects
        element.style.left = `calc(50% + ${position.x}px)`;
        element.style.top = `calc(50% + ${position.y}px)`;
        element.style.transform = `
            translateX(-50%) translateY(-50%)
            translateZ(${position.z}px)
            rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)
            scaleX(${scale.x}) scaleY(${scale.y}) scaleZ(${scale.z})
        `;

        // Add a visual indicator if the item is selected
        if (selectedObject && selectedObject.id === item.id) {
            element.classList.add('selected');
        }

        viewElement.appendChild(element);
    });
}

/**
 * A master render function that updates the entire UI based on the current state.
 */
function render() {
    renderHierarchy(hierarchyContent, hierarchy);
    renderFileSystem(fileBrowserContent, fileSystem);
    renderView(viewContent, hierarchy);
    renderInspector(selectedObject);
}
