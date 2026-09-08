// Category naming without a TV keyboard: the YouTube TV app's search screen
// is the only text input available to a userscript. "New Category" opens the
// search screen with a flag armed; when the app executes the search it sets
// #/search?q=<query> — we read the query from the hash, create the category,
// and navigate back. (Network-layer capture does not work: the app binds
// fetch/XHR references at boot, before the userscript injects.)

import { configRead, configWrite } from '../config.js';
import { getGuide } from '../utils/innerTubeCalls.js';
import resolveCommand from '../resolveCommand.js';
import { showToast } from '../ui/ytUI.js';
import { showChannelCategories, createCategory } from '../ui/channelCategories.js';
import { t } from 'i18next';

let namingMode = false;

const ARM_KEY = 'ytaf-naming-armed';
const ARM_TTL_MS = 5 * 60 * 1000;

function arm() {
    namingMode = true;
    try { window.localStorage[ARM_KEY] = String(Date.now()); } catch (e) {}
}

function isArmed() {
    if (namingMode) return true;
    try {
        const t = Number(window.localStorage[ARM_KEY]);
        if (t && Date.now() - t < ARM_TTL_MS) return true;
        if (t) delete window.localStorage[ARM_KEY];
    } catch (e) {}
    return false;
}

function disarm() {
    namingMode = false;
    try { delete window.localStorage[ARM_KEY]; } catch (e) {}
}

export function startCategoryNaming() {
    arm();
    navigateToSearch().then(ok => {
        if (!ok) {
            // No search entry available (unexpected) — fall back to auto names.
            disarm();
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

function captureFromHash() {
    const m = location.hash.match(/[?&]q=([^&]+)/);
    if (!m) return;
    disarm();
    const query = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
    if (query) createNamedCategory(query);
    resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });
}

export function initCategoryNaming() {
    const check = () => {
        if (!isArmed()) return;
        if (!location.hash.includes('/search')) return;
        captureFromHash();
    };
    window.addEventListener('hashchange', check);
    // Search may be a full document navigation — capture on the fresh boot.
    setTimeout(check, 2500);
}
