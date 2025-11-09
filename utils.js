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
