import { Item } from '../../game elements/game_elements.ts';
import { black, blue, green, cyan, red, magenta, darkyellow, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts';

class A2D_items {
    gold(quantity: number): Item {
        return new Item({
            name: 'gold',
            quantity: quantity,
            value: 1
        })
    }
    sign(text?: string | string[]): Item {
        if (Array.isArray(text)) {
            text = text.join('\n')
        }
        return new Item({
            name: 'sign',
            description: 'A Sign',
            immovable: true,
            read: () => {
                color(gray)
                print(text)
            }
        })
    }
    get towering_tree(): Item {
        return new Item({
            name: 'tree',
            description: '"A Monstrous, Sky-Touching Tree"',
            immovable: true
        })
    }
    get mixing_pot(): Item {
        return new Item({
            name: 'A Mixing Pot',
            immovable: true
        })
    }
    get scarecrow(): Item {
        return new Item({
            name: 'A Scarecrow',
            immovable: true
        })
    }
    get locked_gate(): Item {
        return new Item({
            name: 'Locked Gates',
            immovable: true
        })
    }
    unknown(n: number): Item {
        return new Item({
            name: `Unknown Landscape Item ${n},`,
            immovable: true
        })
    }
    get short_bow(): Item {
        return new Item({
            name: 'short bow',
            description: 'A simple short bow',
            weapons_stats: {
                damage: 10,
                range: 10,
            },
            value: 10,
            size: 2
        })
    }
    arrows(quantity: number): Item {
        return new Item({
            name: 'arrows',
            quantity: quantity,
            value: 1
        })
    }
    get shortsword(): Item {
        return new Item({
            name: 'shortsword',
            description: '',
            weapons_stats: {
                damage: 10,
                pierceing_damage: 5,
                range: 1,
            },
            value: 10,
            size: 2,
        })
    }
    get flask_of_wine(): Item {
        return new Item({
            name: 'flask of wine',
            value: 5
        })
    }
    get healing_potion(): Item {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 5,
            drink: (player) => {
                player.hp += 10;
            },
            size: 1,
        })
    }
}
const items = new A2D_items();
export { items };
