import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    extractChannelVideos,
    filterPlayableVideos,
    dedupeByContentId,
    interleaveRoundRobin,
    videoNavigationCommand
} from '../utils/categoryFeed.js';

const tileVideo = id => ({
    tileRenderer: {
        contentId: id,
        onSelectCommand: { watchEndpoint: { videoId: id } }
    }
});

const lockupVideo = id => ({
    lockupViewModel: {
        contentId: id,
        rendererContext: {
            commandContext: {
                onTap: { innertubeCommand: { watchEndpoint: { videoId: id } } }
            }
        }
    }
});

test('extractChannelVideos collects shelf and grid items', () => {
    const response = {
        contents: {
            tvBrowseRenderer: {
                content: {
                    tvSurfaceContentRenderer: {
                        content: {
                            sectionListRenderer: {
                                contents: [
                                    { shelfRenderer: { content: { horizontalListRenderer: { items: [tileVideo('a')] } } } },
                                    { shelfRenderer: { content: { horizontalListRenderer: { items: [tileVideo('b')] } } } },
                                    { notAShelf: true }
                                ]
                            },
                            gridRenderer: { items: [tileVideo('c')] }
                        }
                    }
                }
            }
        }
    };
    assert.equal(extractChannelVideos(response).length, 3);
});

test('extractChannelVideos returns empty for unknown shapes', () => {
    assert.deepEqual(extractChannelVideos({}), []);
    assert.deepEqual(extractChannelVideos(null), []);
});

test('filterPlayableVideos drops shorts and non-videos', () => {
    const items = [
        tileVideo('keep1'),
        lockupVideo('keep2'),
        { tileRenderer: { contentId: 'short1', onSelectCommand: { reelWatchEndpoint: {} } } },
        { tileRenderer: { contentId: 'short2', tvhtml5ShelfRendererType: 'TVHTML5_TILE_RENDERER_TYPE_SHORTS', onSelectCommand: { watchEndpoint: {} } } },
        { lockupViewModel: { contentId: 'short3', contentType: 'LOCKUP_CONTENT_TYPE_SHORT' } },
        { somethingElse: true },
        { tileRenderer: { contentId: 'navig' } }
    ];
    const result = filterPlayableVideos(items);
    assert.deepEqual(result.map(i => i.tileRenderer?.contentId || i.lockupViewModel?.contentId), ['keep1', 'keep2']);
});

test('dedupeByContentId removes repeats, keeps unknowns', () => {
    const items = [tileVideo('a'), tileVideo('b'), tileVideo('a'), { unknown: true }];
    const result = dedupeByContentId(items);
    assert.equal(result.length, 3);
    assert.equal(result[0].tileRenderer.contentId, 'a');
    assert.equal(result[1].tileRenderer.contentId, 'b');
    assert.deepEqual(result[2], { unknown: true });
});

test('interleaveRoundRobin round-robins and drains all queues', () => {
    const result = interleaveRoundRobin([
        ['a1', 'a2', 'a3'],
        ['b1'],
        []
    ]);
    assert.deepEqual(result, ['a1', 'b1', 'a2', 'a3']);
    assert.deepEqual(interleaveRoundRobin([]), []);
});

test('videoNavigationCommand reads both renderer shapes', () => {
    assert.deepEqual(videoNavigationCommand(tileVideo('x')), { watchEndpoint: { videoId: 'x' } });
    assert.deepEqual(videoNavigationCommand(lockupVideo('y')), { watchEndpoint: { videoId: 'y' } });
    assert.equal(videoNavigationCommand({}), undefined);
});
