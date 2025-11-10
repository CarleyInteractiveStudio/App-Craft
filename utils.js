/**
 * Finds an item by its ID in a tree-like structure.
 * Can search in both fileSystem and hierarchy arrays by checking for
 * 'children' (for folders) or 'content' (for windows).
 * @param {Array} items - The array of items to search in.
 * @param {number} id - The ID of the item to find.
 * @returns {Object|null} The found item or null.
 */
function findItemById(items, id) {
    for (const item of items) {
        if (item.id === id) {
            return item;
        }

        const children = item.children || (item.type === 'window' ? item.content : null);
        if (children && children.length > 0) {
            const found = findItemById(children, id);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

/**
 * Converts a hex color string to an RGBA string.
 * @param {string} hex - The hex color code (e.g., "#RRGGBB").
 * @param {number} alpha - The alpha transparency value (0 to 1).
 * @returns {string} The RGBA color string.
 */
function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Finds the first item of a specific type in a tree-like structure.
 * @param {Array} items - The array of items to search in.
 * @param {string} type - The type of the item to find.
 * @returns {Object|null} The found item or null.
 */
function findItemByType(items, type) {
    for (const item of items) {
        if (item.type === type) {
            return item;
        }
        if (item.children && item.children.length > 0) {
            const found = findItemByType(item.children, type);
            if (found) {
                return found;
            }
        }
    }
    return null;
}
