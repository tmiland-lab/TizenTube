// Channel categories: group custom sidebar channels into named categories
// (SmartTube-style). Categories are plain names in config `sidebarCategories`;
// channel entries in `sidebarContentsOrder` carry an optional `category` field.

import { configRead, configWrite } from '../config.js';
import {
    nextFreeCategoryName,
    deleteCategory,
    clearCategoryFromChannels,
    setChannelCategory
} from '../utils/sidebarCategories.js';
import { buttonItem, overlayPanelItemListRenderer, overlayMessageRenderer, showModal, showToast } from './ytUI.js';
import showTextInput from './textInputDialog.js';
import { t } from 'i18next';

function channelsInCategory(name) {
    return configRead('sidebarContentsOrder').filter(
        item => typeof item === 'object' && item !== null && item.category === name
    );
}

function customChannelEntries() {
    return configRead('sidebarContentsOrder').filter(item => typeof item === 'object' && item !== null);
}

export function showChannelCategories(update) {
    const categories = configRead('sidebarCategories');

    const buttons = [
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.newCategory.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.newCategory.subtitle')
            },
            {
                icon: 'ADD'
            },
            [
                {
                    customAction: {
                        action: 'CATEGORY_CREATE'
                    }
                }
            ]
        ),
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.newCategorySearch.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.newCategorySearch.subtitle')
            },
            {
                icon: 'SEARCH'
            },
            [
                {
                    customAction: {
                        action: 'CATEGORY_CREATE_SEARCH'
                    }
                }
            ]
        )
    ];

    for (const name of categories) {
        buttons.push(
            buttonItem(
                {
                    title: name,
                    subtitle: t('settings.options.uiSettings.options.channelCategories.channelsCount', {
                        count: channelsInCategory(name).length
                    })
                },
                {
                    icon: 'MENU'
                },
                [
                    {
                        customAction: {
                            action: 'CATEGORY_OPTIONS_SHOW',
                            parameters: {
                                name
                            }
                        }
                    }
                ]
            )
        );
    }

    const content = categories.length === 0
        ? overlayPanelItemListRenderer([overlayMessageRenderer(t('settings.options.uiSettings.options.channelCategories.empty'))])
        : overlayPanelItemListRenderer(buttons);

    showModal(
        {
            title: t('settings.options.uiSettings.options.channelCategories.title'),
            subtitle: t('settings.options.uiSettings.options.channelCategories.subtitle')
        },
        content,
        'tt-channel-categories',
        update === true
    );
}

export function showCategoryOptions(parameters) {
    const { name } = parameters;

    const buttons = [
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.openFeed.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.openFeed.subtitle')
            },
            {
                icon: 'PLAY_CIRCLE'
            },
            [
                {
                    customAction: {
                        action: 'CATEGORY_FEED_SHOW',
                        parameters: {
                            name
                        }
                    }
                }
            ]
        ),
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.assignChannels.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.assignChannels.subtitle')
            },
            {
                icon: 'PERSON'
            },
            [
                {
                    customAction: {
                        action: 'CATEGORY_ASSIGN_SHOW',
                        parameters: {
                            name
                        }
                    }
                }
            ]
        ),
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.deleteCategory.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.deleteCategory.subtitle')
            },
            {
                icon: 'REMOVE'
            },
            [
                {
                    customAction: {
                        action: 'CATEGORY_DELETE',
                        parameters: {
                            name
                        }
                    }
                }
            ]
        )
    ];

    showModal(
        {
            title: name
        },
        overlayPanelItemListRenderer(buttons),
        'tt-category-options'
    );
}

export function showCategoryAssign(parameters) {
    const { name, update } = parameters;
    const entries = customChannelEntries();

    const buttons = entries.map(entry =>
        buttonItem(
            {
                title: entry.title
            },
            {
                icon: 'PERSON',
                secondaryIcon: entry.category === name ? 'CHECK_BOX' : 'CHECK_BOX_OUTLINE_BLANK'
            },
            [
                {
                    customAction: {
                        action: 'CHANNEL_TOGGLE_CATEGORY',
                        parameters: {
                            browseId: entry.browseId,
                            name
                        }
                    }
                },
                {
                    customAction: {
                        action: 'CATEGORY_ASSIGN_SHOW',
                        parameters: {
                            name,
                            update: true
                        }
                    }
                }
            ]
        )
    );

    const content = entries.length === 0
        ? overlayPanelItemListRenderer([overlayMessageRenderer(t('settings.options.uiSettings.options.channelCategories.noChannels'))])
        : overlayPanelItemListRenderer(buttons);

    showModal(
        {
            title: t('settings.options.uiSettings.options.channelCategories.assignChannels.title'),
            subtitle: name
        },
        content,
        'tt-category-assign',
        update === true
    );
}

export function showCategoryPicker(parameters) {
    const { browseId, title } = parameters;
    const categories = configRead('sidebarCategories');

    const buttons = [
        buttonItem(
            {
                title: t('settings.options.uiSettings.options.channelCategories.noCategory.title'),
                subtitle: t('settings.options.uiSettings.options.channelCategories.noCategory.subtitle')
            },
            {
                icon: 'PERSON'
            },
            [
                {
                    customAction: {
                        action: 'ADD_CHANNEL_TO_CATEGORY',
                        parameters: {
                            browseId,
                            title,
                            category: null
                        }
                    }
                }
            ]
        )
    ];

    for (const name of categories) {
        buttons.push(
            buttonItem(
                {
                    title: name
                },
                {
                    icon: 'MENU'
                },
                [
                    {
                        customAction: {
                            action: 'ADD_CHANNEL_TO_CATEGORY',
                            parameters: {
                                browseId,
                                title,
                                category: name
                            }
                        }
                    }
                ]
            )
        );
    }

    showModal(
        {
            title: t('settings.options.uiSettings.options.channelCategories.addToCategory.title'),
            subtitle: t('settings.options.uiSettings.options.channelCategories.addToCategory.subtitle', {
                channel: title
            })
        },
        overlayPanelItemListRenderer(buttons),
        'tt-category-picker'
    );
}

export function createCategory() {
    const categories = configRead('sidebarCategories');
    const name = nextFreeCategoryName(categories);
    configWrite('sidebarCategories', [...categories, name]);
    showToast(
        t('toasts.categoryCreated.title'),
        t('toasts.categoryCreated.subtitle', {
            name
        })
    );
    return name;
}

export function createCategoryViaDialog() {
    showTextInput({
        title: t('settings.options.uiSettings.options.channelCategories.newCategory.title'),
        placeholder: t('settings.options.uiSettings.options.channelCategories.newCategory.placeholder'),
        onSubmit: (name) => {
            const categories = configRead('sidebarCategories');
            if (!categories.includes(name)) {
                configWrite('sidebarCategories', [...categories, name]);
            }
            showToast(
                t('toasts.categoryCreated.title'),
                t('toasts.categoryCreated.subtitle', { name })
            );
            setTimeout(() => showChannelCategories(true), 300);
        }
    });
}

export function deleteCategoryAndCleanup(name) {
    const categories = configRead('sidebarCategories');
    configWrite('sidebarCategories', deleteCategory(categories, name).categories);
    configWrite('sidebarContentsOrder', clearCategoryFromChannels(configRead('sidebarContentsOrder'), name));
    showToast(
        t('toasts.categoryDeleted.title'),
        t('toasts.categoryDeleted.subtitle', {
            name
        })
    );
}

export function toggleChannelCategory(browseId, name) {
    const entry = customChannelEntries().find(item => item.browseId === browseId);
    const target = entry && entry.category === name ? null : name;
    configWrite('sidebarContentsOrder', setChannelCategory(configRead('sidebarContentsOrder'), browseId, target));
    showToast(
        t('toasts.channelAssigned.title'),
        t('toasts.channelAssigned.subtitle', {
            channel: entry ? entry.title : '',
            category: target || t('settings.options.uiSettings.options.channelCategories.noCategory.title')
        })
    );
}

export function addChannelToCategory(parameters) {
    const { browseId, title, category } = parameters;
    const order = configRead('sidebarContentsOrder');

    if (order.some(item => typeof item === 'object' && item !== null && item.browseId === browseId)) {
        configWrite('sidebarContentsOrder', setChannelCategory(order, browseId, category));
    } else {
        const entry = {
            browseId,
            title
        };
        if (category) entry.category = category;
        configWrite('sidebarContentsOrder', [...order, entry]);
    }

    showToast(
        t('toasts.sidebarContentsUpdated.title'),
        t('toasts.sidebarContentsUpdated.subtitle')
    );
}
