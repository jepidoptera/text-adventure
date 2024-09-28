import { Container, items } from './items.js';

class Player {
    constructor(className) {
        this.inventory = new Container();
        switch (className) {
            case ('thief') :
                this.Class$ = "thief"
                this.max_hp = 35
                this.max_sp = 50
                this.max_bp = 20
                this.attack = 9
                this.agility = 4
                this.coor = 4
                this.offHand = 0.8
                this.healing = 4
                this.magic_level = 1
                this.spells = {}
                this.archery = 24
                this.max_pets = 4
                this.gold = 45
                this.inventory.add('short bow', 1)
                this.inventory.set('arrows', 25)
                break;

            case ('fighter') :
                this.Class$ = "fighter"
                this.max_hp = 50
                this.max_sp = 45
                this.max_bp = 5
                this.attack = 10
                this.agility = 2
                this.coor = 3
                this.offHand = 0.6
                this.healing = 3
                this.magic_level = 0
                this.spells = {}
                this.archery = 10
                this.max_pets = 3
                this.gold = 30
                this.inventory.set('shortsword', 1)
                break;

            case ('spellcaster') :
                this.Class$ = "spellcaster"
                this.max_hp = 30
                this.max_sp = 30
                this.max_bp = 50
                this.attack = 6
                this.agility = 2
                this.coor = 2
                this.offHand = 0.4
                this.healing = 4
                this.magic_level = 5
                this.spells = {
                    'bolt': 2,
                    'newbie': 4,
                }
                this.archery = 6
                this.max_pets = 4
                this.gold = 20
                this.inventory.set('flask of wine', 1)
                break;

            case ('cleric') :
                this.Class$ = "cleric"
                this.max_hp = 35
                this.max_sp = 35
                this.max_bp = 40
                this.attack = 8
                this.agility = 3
                this.coor = 3
                this.offHand = 0.65
                this.healing = 5
                this.magic_level = 2
                this.spells = {
                    'newbie': 3,
                }
                this.archery = 22
                this.max_pets = 5
                this.gold = 30
                this.inventory.set('healing potion', 1)
                break;
        }

        this.hp = this.max_hp
        this.sp = this.max_sp
        this.bp = this.max_bp
        this.inventory = [];
    }
}

export { Player };