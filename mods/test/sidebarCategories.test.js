import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    nextFreeCategoryName,
    deleteCategory,
    clearCategoryFromChannels,
    setChannelCategory,
    sidebarEntryTitle
} from '../utils/sidebarCategories.js';

test('nextFreeCategoryName returns Category 1 for empty list', () => {
    assert.equal(nextFreeCategoryName([]), 'Category 1');
});

test('nextFreeCategoryName skips taken names', () => {
    assert.equal(nextFreeCategoryName(['Category 1']), 'Category 2');
    assert.equal(nextFreeCategoryName(['Category 1', 'Category 2']), 'Category 3');
});

test('nextFreeCategoryName fills gaps', () => {
    assert.equal(nextFreeCategoryName(['Category 1', 'Category 3']), 'Category 2');
});

test('nextFreeCategoryName is not confused by substrings', () => {
    assert.equal(nextFreeCategoryName(['Category 10']), 'Category 1');
});

test('deleteCategory removes only the named category', () => {
    assert.deepEqual(
        deleteCategory(['News', 'Music', 'Sports'], 'Music').categories,
        ['News', 'Sports']
    );
    assert.deepEqual(deleteCategory([], 'News').categories, []);
});

test('clearCategoryFromChannels strips the category from matching entries only', () => {
    const order = [
        'FEsubscriptions',
        { browseId: 'UC1', title: 'BBC', category: 'News' },
        { browseId: 'UC2', title: 'Sky', category: 'News' },
        { browseId: 'UC3', title: 'Nebula', category: 'Music' },
        { browseId: 'UC4', title: 'Plain' }
    ];
    const result = clearCategoryFromChannels(order, 'News');
    assert.deepEqual(result[0], 'FEsubscriptions');
    assert.deepEqual(result[1], { browseId: 'UC1', title: 'BBC' });
    assert.deepEqual(result[2], { browseId: 'UC2', title: 'Sky' });
    assert.deepEqual(result[3], { browseId: 'UC3', title: 'Nebula', category: 'Music' });
    assert.deepEqual(result[4], { browseId: 'UC4', title: 'Plain' });
    // original untouched
    assert.equal(order[1].category, 'News');
});

test('setChannelCategory assigns a category', () => {
    const order = [{ browseId: 'UC1', title: 'BBC' }];
    assert.deepEqual(
        setChannelCategory(order, 'UC1', 'News'),
        [{ browseId: 'UC1', title: 'BBC', category: 'News' }]
    );
});

test('setChannelCategory clears with null', () => {
    const order = [{ browseId: 'UC1', title: 'BBC', category: 'News' }];
    assert.deepEqual(
        setChannelCategory(order, 'UC1', null),
        [{ browseId: 'UC1', title: 'BBC' }]
    );
});

test('setChannelCategory ignores strings and other channels', () => {
    const order = ['FEsubscriptions', { browseId: 'UC1', title: 'BBC' }];
    assert.deepEqual(
        setChannelCategory(order, 'UC9', 'News'),
        order
    );
});

test('sidebarEntryTitle prefixes the category', () => {
    assert.equal(sidebarEntryTitle({ title: 'BBC', category: 'News' }), 'News · BBC');
    assert.equal(sidebarEntryTitle({ title: 'BBC' }), 'BBC');
    assert.equal(sidebarEntryTitle({ title: 'BBC', category: null }), 'BBC');
    assert.equal(sidebarEntryTitle('FEsubscriptions'), 'FEsubscriptions');
});
