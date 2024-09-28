import { Item } from './game elements.js';

const items = {
    'gold': new Item({
        name: 'gold',
        description: '',
        value: 1,
    }),
    'arrow': new Item({
        name: 'arrow',
        description: 'an arrow',
        value: 5,
        size: 1,
    }),
    'healing potion': new Item,

    'shortsword': new Item,
};

export { items };