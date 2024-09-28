import { GameState } from '../../game.ts'
import {Character, Item, Location} from '../../game elements/game_elements.ts'
import { items } from './items.ts'
import { gameMap } from './map.ts'
import { black, blue, green, cyan, red, magenta, darkyellow, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'

class Player extends Character {
    class_name: string = '';
    max_pets: number = 0;
    offHand: number = 0;
    healing: number = 0;
    archery: number = 0;
    isPlayer: boolean = true;
    constructor(characterName: string, className: string) {
        super({name: characterName});
        this.class_name = className.toLowerCase();
        switch (this.class_name) {
            case ('thief') :
                this.max_hp = 35
                this.max_sp = 50
                this.max_mp = 20
                this.strength = 9
                this.agility = 4
                this.coordination = 4
                this.offHand = 0.8
                this.healing = 4
                this.magic_level = 1
                this.abilities = {}
                this.archery = 24
                this.max_pets = 4
                this.inventory.add(items.short_bow)
                this.inventory.add(items.arrows(25))
                this.inventory.add(items.gold(45))
                break;

            case ('fighter') :
                this.max_hp = 50
                this.max_sp = 45
                this.max_mp = 5
                this.strength = 10
                this.agility = 2
                this.coordination = 3
                this.offHand = 0.6
                this.healing = 3
                this.magic_level = 0
                this.abilities = {}
                this.archery = 10
                this.max_pets = 3
                this.inventory.add(items.shortsword)
                this.inventory.add(items.gold(30))
                break;

            case ('spellcaster') :
                this.max_hp = 30
                this.max_sp = 30
                this.max_mp = 50
                this.strength = 6
                this.agility = 2
                this.coordination = 2
                this.offHand = 0.4
                this.healing = 4
                this.magic_level = 5
                this.abilities = {
                    'bolt': 2,
                    'newbie': 4,
                }
                this.archery = 6
                this.max_pets = 4
                this.inventory.add(items.flask_of_wine)
                this.inventory.add(items.gold(20))
                break;

            case ('cleric') :
                this.max_hp = 35
                this.max_sp = 35
                this.max_mp = 40
                this.strength = 8
                this.agility = 3
                this.coordination = 3
                this.offHand = 0.65
                this.healing = 5
                this.magic_level = 2
                this.abilities = {
                    'newbie': 3,
                }
                this.archery = 22
                this.max_pets = 5
                this.inventory.add(items.gold(30))
                this.inventory.add(items.healing_potion)
                break;
        }
        this.addAction('n', () => this.go('north'));
        this.addAction('s', () => this.go('south'));
        this.addAction('e', () => this.go('east'));
        this.addAction('w', () => this.go('west'));
        this.addAction('go', this.go);
        this.addAction('look', this.look);
        this.addAction('read', this.read);
    }

    look(target?: string) {
        color(black)
        print()
        print(this.location?.name)
        color(gray)
        this.location?.items.filter(item => {
            return item.immovable
        }).forEach(item => {
            print('    *' + item.description)
        })
        color(red)
        this.location?.characters.forEach(character => {
            if (character != this) {
                print('    ' + character.name)
            }
        })
        color(gray)
        this.location?.items.filter(item => {
            return !item.immovable
        }).forEach(item => {
            print('    ' + item.name)
        })
        color(black)
        print()
        print('You can go: ', 1)
        print(Array.from(this.location?.adjacent?.keys() ?? []).join(', '))
    }

    go(direction: string) {
        if (super.go(direction)) {
            this.look();
            return true;
        }
        else {
            print('You can\'t go that way.')
            return false
        }
    }

    read(itemName: string) {
        const item = this.location?.item(itemName) || this.inventory.item(itemName);
        if (!item) {
            print("You don't have that.")
        }
        else if (item.read) {
            item.read();
        }
        else {
            print("You can't read that.")
        }
    }
}

class A2D extends GameState {
    
    player!: Player;

    intro() {
        color(red, darkwhite);
        this.clear();
        this.center("Redstaff Software Presents...")

        for (let f = 0; f < 16; f++) {
            color(qbColors[f], darkwhite)
            this.center ("A  D  V  E  N  T  U  R  E   I I")
        }
        color('black')
        print()
        this.center("DELUX")
        color('gray')
        this.center(">Special Edition<")
    }

    async start() {
        this.loadScenario(gameMap);
        this.intro();
        await getKey();
        this.clear();
        const opt = await this.optionBox({
            title: 'Adventure 2 Setup', 
            options: ['Start New', 'Load Game', 'Exit']
        })
        this.clear();
        if (opt === 0) {
            this.player = await this.newCharacter();
        }
        else if (opt === 1) {
            // todo: load game
        }
        this.main();
    }

    async main() {
        let command = '';
        this.player.look();
        while (!(command in ['exit', 'quit'])) {
            color(blue)
            print(this.player.name, 1)
            color(black)
            command = await input('>')
            const words = command.split(' ')
            const verb = words[0]
            const args = words.slice(1).join(' ')
            if (this.player.actions.has(verb)) {
                this.player.actions.get(verb)?.(args);
            } else {
                color(gray)
                print('What?');
            }
        }
    }

    newCharacter(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            this.clear();
            const classes = ['Thief', 'Fighter', 'Spellcaster', 'Cleric']
            const new_player = new Player(
                await input('\n\nType a name for yourself:'),
                classes[await this.optionBox({
                    title: "     Choose One          ", 
                    options: classes, 
                    default_option: 1
                })]
            )
            new_player.location = this.find_location('Cottage of the Young');

            color('yellow')
            print("-- ", 1)
            color('red')
            print("You have declared ", 1)
            color('blue')
            print(new_player.class_name, 1)
            color('red')
            print(" Status ", 1)
            color('yellow')
            print("--")
            color('black')
                 
            print(`Archery: ${new_player.archery}`)
            print(`Coordination: ${new_player.coordination}`)
            print(`Agility: ${new_player.agility}`)
            print(`Attack: ${new_player.strength}`)
            print(`Max HP: ${new_player.max_hp}`)
            print(`Max SP: ${new_player.max_sp}`)
            print(`Max MP: ${new_player.max_mp}`)
            print(`Healing: ${new_player.healing}`)
            print(`OffHand: ${Math.floor(new_player.offHand * 100)}%`)
            print(`Magic Level: ${new_player.magic_level}`)

            await getKey();
            this.clear();

            resolve(new_player);
        })
    }
    center(text: string) {
        const x = Math.floor((80 - text.length) / 2);
        print(' '.repeat(x) + text);
    }
}

export { A2D };