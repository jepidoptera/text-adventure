import { Character } from '../../game elements/game_elements.ts';
import { items } from './items.ts';

class A2D_characters {
    get Ieadon(): Character {
        return new Character({
            name: 'Ieadon',
            items: [items.gold(1000)]
        })
    }
    get sick_old_cleric(): Character {
        return new Character({
            name: 'cleric',
            description: 'A sick old cleric, lying in bed',
            items: []
        })
    }
}
const characters = new A2D_characters();
export { characters };
