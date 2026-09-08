// Category naming without a TV keyboard: the YouTube TV app's search screen
// is the only text input available to a userscript. "New Category" opens the
// search screen with a flag armed; the wrapped InnerTube client captures the
// submitted /search query as the category name and cancels the search.

import { configRead, configWrite } from '../config.js';
import { getGuide } from '../utils/innerTubeCalls.js';
import resolveCommand from '../resolveCommand.js';
import { showToast } from '../ui/ytUI.js';
import { showChannelCategories, createCategory } from '../ui/channelCategories.js';
import { t } from 'i18next';

let namingMode = false;

export function startCategoryNaming() {
    namingMode = true;
    navigateToSearch().then(ok => {
        if (!ok) {
            // No search entry available (unexpected) — fall back to auto names.
            namingMode = false;
            createCategory();
            showChannelCategories(true);
            return;
        }
        showToast(
            t('toasts.categoryNamingHint.title'),
            t('toasts.categoryNamingHint.subtitle')
        );
    });
}

async function navigateToSearch() {
    const guide = await getGuide();
    const items = guide?.items?.[0]?.guideSectionRenderer?.items || [];
    const searchItem = items.find(item => item.guideEntryRenderer?.navigationEndpoint?.searchEndpoint);
    if (!searchItem) return false;
    resolveCommand(searchItem.guideEntryRenderer.navigationEndpoint);
    return true;
}

function createNamedCategory(name) {
    const categories = configRead('sidebarCategories');
    if (!categories.includes(name)) {
        configWrite('sidebarCategories', [...categories, name]);
    }
    showToast(
        t('toasts.categoryCreated.title'),
        t('toasts.categoryCreated.subtitle', { name })
    );
    setTimeout(() => showChannelCategories(false), 500);
}

/**
 * Wraps the InnerTube client once. While namingMode is armed, the next
 * /youtubei/v1/search request is captured instead of executed.
 */
export function initCategoryNaming() {
    const tryWrap = (attempt = 0) => {
        const mappings = Object.values(window._yttv || {}).find(a => a && a.mappings);
        const client = mappings?.get('KabukiInnerTubeClient');
        if (!client || typeof client.fetch !== 'function') {
            if (attempt < 100) setTimeout(() => tryWrap(attempt + 1), 250);
            return;
        }
        if (client.__ttNamingPatched) return;

        const ogFetch = client.fetch.bind(client);
        client.__ttNamingPatched = true;
        client.fetch = function (request) {
            if (namingMode && request?.path === '/youtubei/v1/search') {
                namingMode = false;
                const query = (request.payload?.query || '').trim();
                if (query) createNamedCategory(query);
                resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });
                // Cancel the actual search request.
                return { subscribe() {} };
            }
            return ogFetch(request);
        };
    };
    tryWrap();
}
