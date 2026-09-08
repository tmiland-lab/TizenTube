// Pure helpers for the merged category feed ("open category -> play latest
// videos from all its channels"). No DOM/window access: unit-testable.

/**
 * Extracts video renderer items (tileRenderer / lockupViewModel) from a
 * channel browse response (both shelf and grid layouts).
 * @param {object} response InnerTube /youtubei/v1/browse response
 * @returns {object[]}
 */
export function extractChannelVideos(response) {
    const out = [];
    const content = response?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content;
    if (content?.sectionListRenderer?.contents) {
        for (const shelve of content.sectionListRenderer.contents) {
            const items = shelve.shelfRenderer?.content?.horizontalListRenderer?.items;
            if (items) out.push(...items);
        }
    }
    if (content?.gridRenderer?.items) out.push(...content.gridRenderer.items);
    return out;
}

/**
 * Keeps only playable regular videos (drops shorts, reels and junk items).
 * @param {object[]} items
 * @returns {object[]}
 */
export function filterPlayableVideos(items) {
    return (items || []).filter(item => {
        if (item.tileRenderer) {
            if (item.tileRenderer.onSelectCommand?.reelWatchEndpoint) return false;
            if (
                item.tileRenderer.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORTS' ||
                item.tileRenderer.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORT'
            ) return false;
            return !!item.tileRenderer.onSelectCommand?.watchEndpoint;
        }
        if (item.lockupViewModel) {
            if (item.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_SHORT') return false;
            return !!item.lockupViewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint;
        }
        return false;
    });
}

/**
 * Removes duplicate videos by renderer contentId (channels repeat pinned
 * videos across shelves).
 * @param {object[]} items
 * @returns {object[]}
 */
export function dedupeByContentId(items) {
    const seen = new Set();
    const out = [];
    for (const item of items || []) {
        const id = item?.tileRenderer?.contentId || item?.lockupViewModel?.contentId;
        if (id === undefined) {
            out.push(item);
            continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(item);
    }
    return out;
}

/**
 * Round-robin interleaves per-channel video arrays so every channel
 * contributes early (closest available proxy for "newest across channels"
 * without parseable timestamps).
 * @param {object[][]} itemArrays
 * @returns {object[]}
 */
export function interleaveRoundRobin(itemArrays) {
    const out = [];
    const queues = (itemArrays || []).map(a => [...a]);
    for (;;) {
        let added = false;
        for (const q of queues) {
            if (q.length) {
                out.push(q.shift());
                added = true;
            }
        }
        if (!added) return out;
    }
}

/**
 * The command that plays a video renderer item (either renderer shape).
 * @param {object} item
 * @returns {object|undefined}
 */
export function videoNavigationCommand(item) {
    return item?.tileRenderer
        ? item.tileRenderer.onSelectCommand
        : item?.lockupViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand;
}
