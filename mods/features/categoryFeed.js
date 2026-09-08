// Merged category feed: plays the latest videos from every channel in a
// category, round-robin interleaved, using TizenTube's existing queue
// auto-advance (videoQueuing.js).

import { configRead } from '../config.js';
import { browseChannel } from '../utils/innerTubeCalls.js';
import {
    extractChannelVideos,
    filterPlayableVideos,
    dedupeByContentId,
    interleaveRoundRobin,
    videoNavigationCommand
} from '../utils/categoryFeed.js';
import resolveCommand from '../resolveCommand.js';
import { showToast } from '../ui/ytUI.js';
import { t } from 'i18next';

export function openCategoryFeed(name) {
    const channels = configRead('sidebarContentsOrder').filter(
        item => typeof item === 'object' && item !== null && item.category === name
    );

    if (channels.length === 0) {
        showToast(
            t('toasts.categoryFeedEmpty.title'),
            t('toasts.categoryFeedEmpty.subtitle', { name })
        );
        return;
    }

    showToast(
        t('toasts.categoryFeedLoading.title'),
        t('toasts.categoryFeedLoading.subtitle', { name, count: channels.length })
    );

    Promise.all(channels.map(channel => browseChannel(channel.browseId))).then(responses => {
        const perChannel = responses
            .filter(Boolean)
            .map(response => dedupeByContentId(filterPlayableVideos(extractChannelVideos(response))))
            .filter(videos => videos.length > 0);

        const merged = interleaveRoundRobin(perChannel);

        if (merged.length === 0) {
            showToast(
                t('toasts.categoryFeedEmpty.title'),
                t('toasts.categoryFeedEmpty.subtitle', { name })
            );
            return;
        }

        window.queuedVideos.videos = merged;
        window.queuedVideos.lastVideoId = null;

        const first = videoNavigationCommand(merged[0]);
        if (first) resolveCommand(first);

        showToast(
            t('toasts.categoryFeedStarted.title'),
            t('toasts.categoryFeedStarted.subtitle', { name, count: merged.length })
        );
    });
}
