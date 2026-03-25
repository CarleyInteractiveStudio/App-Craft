/**
 * HierarchyManager manages the visual tree of the HTML document
 * being edited, showing tags and allowing selection.
 */
export class HierarchyManager {
    constructor(engine) {
        this.engine = engine;
        this.listElement = document.getElementById('hierarchy-list');
        this.elements = [];
    }

    /**
     * Reads the current project's HTML structure and displays it in the panel.
     */
    refresh() {
        if (!this.listElement) return;

        const previewFrame = document.getElementById('project-view');
        if (!previewFrame) return;

        const doc = previewFrame.contentWindow.document;
        this.listElement.innerHTML = ''; // Clear current list

        // Traverse the <body> element for child elements
        const body = doc.body;
        if (!body) return;

        this.traverse(body, this.listElement);
    }

    /**
     * Recursively traverses DOM elements and creates corresponding list items.
     * @param {HTMLElement} element
     * @param {HTMLElement} parentList
     */
    traverse(element, parentList, level = 0) {
        const children = Array.from(element.children);

        children.forEach(child => {
            // Skip App Craft injected styles or scripts
            if (child.id === 'app-craft-styles') return;

            const li = document.createElement('li');

            // Determine the icon based on the tag type
            let icon = 'fa-code';
            const tag = child.tagName.toLowerCase();
            if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p') icon = 'fa-font';
            if (tag === 'img') icon = 'fa-image';
            if (tag === 'div' || tag === 'section') icon = 'fa-square';
            if (tag === 'button') icon = 'fa-mouse-pointer';

            li.innerHTML = `
                <span class="icon"><i class="fas ${icon}"></i></span>
                <span class="tag-name">${tag}</span>
                <span class="element-info">${child.id ? '#' + child.id : (child.className ? '.' + child.className.split(' ')[0] : '')}</span>
            `;

            // Set style for indentation
            li.style.paddingLeft = `${level * 15 + 12}px`;

            li.addEventListener('click', (e) => {
                e.stopPropagation();
                this.engine.selectElement(child);
            });

            // Hover effects on the actual project element
            li.addEventListener('mouseenter', () => {
                child.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
            });
            li.addEventListener('mouseleave', () => {
                if (this.engine.selectedElement !== child) {
                    child.style.outline = '';
                } else {
                    child.style.outline = '2px solid #3b82f6';
                }
            });

            parentList.appendChild(li);

            // Map the DOM element to the list item for bi-directional highlighting
            child._hierarchyLi = li;

            if (child.children.length > 0) {
                this.traverse(child, parentList, level + 1);
            }
        });
    }

    /**
     * Highlights a selected element in the hierarchy panel.
     * @param {HTMLElement} element
     */
    highlight(element) {
        // Remove 'selected' class from all list items
        const allItems = this.listElement.querySelectorAll('li');
        allItems.forEach(li => li.classList.remove('selected'));

        // Add 'selected' class to the correct list item
        if (element && element._hierarchyLi) {
            element._hierarchyLi.classList.add('selected');
            // Scroll into view if needed
            element._hierarchyLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
