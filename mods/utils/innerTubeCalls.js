import resolveCommand from '../resolveCommand.js';

function requestNextAndNavigateChannel(params) {
    const mappings = Object.values(window._yttv).find(a => a && a.mappings);
    const CurrentIdentityService = mappings.get('CurrentIdentityService');
    const KabukiInnerTubeClient = mappings.get('KabukiInnerTubeClient');
    const videoId = params.tileRenderer ? params.tileRenderer.contentId : params.lockupViewModel.contentId;
    const paramsValue = params.tileRenderer ? params.tileRenderer.onSelectCommand.watchEndpoint.params : params.lockupViewModel.rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.params;
    const randomDelay = Math.floor(Math.random() * 2000);

    CurrentIdentityService.get().then(identity => {
        const request = {
            identity,
            isPrefetch: false,
            path: '/youtubei/v1/next',
            payload: {
                videoId,
                params: paramsValue,
                racyCheckOk: true,
                contentCheckOk: true,
                playbackContext: {
                    lactMilliseconds: randomDelay,
                    isLyricsMode: false
                },
                autonavState: 'STATE_NONE',
                mdxContext: {
                    mdxReceiverContext: {
                        mdxConnectedDevices: []
                    }
                }
            },
            clickTracking: {
                clickTrackingParams: null,
            }
        }

        KabukiInnerTubeClient.fetch(request).subscribe((response) => {
            const contents = response?.contents?.singleColumnWatchNextResults?.results?.results?.contents;
            if (contents) {
                const itemSectionRenderer = contents.find(item => item.itemSectionRenderer);
                const videoMetadataRenderer = itemSectionRenderer?.itemSectionRenderer?.contents?.find(item => item.videoMetadataRenderer);
                if (videoMetadataRenderer) {
                    const navigation = videoMetadataRenderer.videoMetadataRenderer?.owner?.videoOwnerRenderer?.navigationEndpoint;
                    if (navigation) resolveCommand(navigation);
                }
            }
        });
    });
}

function getGuide() {
    const mappings = Object.values(window._yttv).find(a => a && a.mappings);
    const KabukiInnerTubeClient = mappings.get('KabukiInnerTubeClient');

    const request = {
        path: '/youtubei/v1/guide'
    };

    return new Promise((resolve, _) => {
        KabukiInnerTubeClient.fetch(request).subscribe((response) => {
           resolve(response);
        });
    });
}

/**
 * Fetches a channel's browse page (home/videos content).
 * Resolves null on error so callers can skip failed channels.
 * @param {string} browseId channel id (UC...)
 * @returns {Promise<object|null>}
 */
function browseChannel(browseId) {
    const mappings = Object.values(window._yttv).find(a => a && a.mappings);
    const CurrentIdentityService = mappings.get('CurrentIdentityService');
    const KabukiInnerTubeClient = mappings.get('KabukiInnerTubeClient');

    return CurrentIdentityService.get().then(identity => {
        const request = {
            identity,
            isPrefetch: false,
            path: '/youtubei/v1/browse',
            payload: {
                browseId
            },
            clickTracking: {
                clickTrackingParams: null
            }
        };

        return new Promise((resolve) => {
            KabukiInnerTubeClient.fetch(request).subscribe(
                (response) => resolve(response),
                () => resolve(null)
            );
        });
    }).catch(() => null);
}


/**
 * Resolves a video's owner channel (browseId + title) via /next,
 * without navigating.
 * @param {string} videoId
 * @returns {Promise<{browseId: string, title: string}|null>}
 */
function getVideoOwner(videoId) {
    const mappings = Object.values(window._yttv).find(a => a && a.mappings);
    const CurrentIdentityService = mappings.get('CurrentIdentityService');
    const KabukiInnerTubeClient = mappings.get('KabukiInnerTubeClient');

    return CurrentIdentityService.get().then(identity => {
        const request = {
            identity,
            isPrefetch: false,
            path: '/youtubei/v1/next',
            payload: {
                videoId,
                racyCheckOk: true,
                contentCheckOk: true,
                playbackContext: {
                    lactMilliseconds: -1,
                    isLyricsMode: false
                },
                autonavState: 'STATE_NONE',
                mdxContext: {
                    mdxReceiverContext: {
                        mdxConnectedDevices: []
                    }
                }
            },
            clickTracking: {
                clickTrackingParams: null
            }
        };

        return new Promise((resolve) => {
            KabukiInnerTubeClient.fetch(request).subscribe(
                (response) => {
                    const contents = response?.contents?.singleColumnWatchNextResults?.results?.results?.contents;
                    const section = contents && contents.find(item => item.itemSectionRenderer);
                    const vmr = section && section.itemSectionRenderer.contents.find(item => item.videoMetadataRenderer);
                    const owner = vmr && vmr.videoMetadataRenderer && vmr.videoMetadataRenderer.owner && vmr.videoMetadataRenderer.owner.videoOwnerRenderer;
                    if (!owner || !owner.navigationEndpoint || !owner.navigationEndpoint.browseEndpoint) {
                        resolve(null);
                        return;
                    }
                    resolve({
                        browseId: owner.navigationEndpoint.browseEndpoint.browseId,
                        title: (owner.title && owner.title.simpleText) || ''
                    });
                },
                () => resolve(null)
            );
        });
    }).catch(() => null);
}

export {
    requestNextAndNavigateChannel,
    getGuide,
    browseChannel,
    getVideoOwner
}