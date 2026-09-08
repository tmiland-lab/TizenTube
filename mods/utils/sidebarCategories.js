// Pure helpers for channel category management.
// No DOM/window access so this stays unit-testable in plain Node.

/**
 * Returns the first free auto-generated category name ("Category 1", ...).
 * @param {string[]} categories
 * @returns {string}
 */
export function nextFreeCategoryName(categories) {
    let n = 1;
    while (categories.includes(`Category ${n}`)) n++;
    return `Category ${n}`;
}

/**
 * Removes a category. Channels assigned to it become uncategorized
 * (their object entries keep existing, minus the category field).
 * @param {string[]} categories
 * @param {string} name
 * @returns {{categories: string[]}}
 */
export function deleteCategory(categories, name) {
    return { categories: categories.filter(c => c !== name) };
}

/**
 * Strips a category assignment from all channel entries.
 * @param {Array<{browseId: string, title: string, category?: string}>} order
 * @param {string} name
 * @returns {Array} new order array (object entries without the category field)
 */
export function clearCategoryFromChannels(order, name) {
    return order.map(item =>
        (typeof item === 'object' && item !== null && item.category === name)
            ? ({ browseId: item.browseId, title: item.title })
            : item
    );
}

/**
 * Sets (or clears) the category on a channel's object entry.
 * @param {Array} order sidebarContentsOrder
 * @param {string} browseId
 * @param {string|null} category null/undefined clears the assignment
 * @returns {Array} new order array
 */
export function setChannelCategory(order, browseId, category) {
    return order.map(item => {
        if (typeof item !== 'object' || item === null || item.browseId !== browseId) return item;
        return category
            ? ({ browseId: item.browseId, title: item.title, category })
            : ({ browseId: item.browseId, title: item.title });
    });
}

/**
 * Sidebar title for a custom channel entry, category-prefixed when assigned.
 * @param {{title: string, category?: string}} entry
 * @returns {string}
 */
export function sidebarEntryTitle(entry) {
    if (!entry || typeof entry !== 'object') return entry;
    return entry.category ? `${entry.category} · ${entry.title}` : entry.title;
}
