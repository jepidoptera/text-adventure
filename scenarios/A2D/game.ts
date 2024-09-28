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
}

class A2D extends GameState {
    
    player: Player = new Player({name: 'you'});

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
        this.look();
        while (!(command in ['exit', 'quit'])) {
            color(blue)
            print(this.player.name, 1)
            color(black)
            command = await input('>')
            // shortcuts
            if (command == 'n') this.go('north');
            else if (command == 's') this.go('south');
            else if (command == 'e') this.go('east');
            else if (command == 'w') this.go('west');
            else {
                const words = command.split(' ')
                const verb = words[0]
                switch (verb) {
                    case 'look':
                        this.look();
                        break;
                    case 'read':
                        const item_name = words.slice(1).join(' ')
                        const item = this.player.location?.item(item_name) || this.player.inventory.item(item_name)
                        if (!item) {
                            print("You don't have that.")
                        }
                        else if (item.read) {
                            item.read()
                        }
                        else {
                            print("You can't read that.")
                        }
                        break;
                }
            }
        }
    }

    look() {
        color(black)
        print()
        print(this.player.location?.name)
        color(gray)
        this.player.location?.items.filter(item => {
            return item.immovable
        }).forEach(item => {
            print('    *' + item.description)
        })
        color(red)
        this.player.location?.characters.forEach(character => {
            if (character != this.player) {
                print('    ' + character.name)
            }
        })
        color(gray)
        this.player.location?.items.filter(item => {
            return !item.immovable
        }).forEach(item => {
            print('    ' + item.name)
        })
        color(black)
        print()
        print('You can go: ', 1)
        print(Array.from(this.player.location?.adjacent?.keys() ?? []).join(', '))
    }

    go(direction: string) {
        if (this.player.location?.adjacent?.has(direction)) {
            this.player.go(direction);
            this.look();
        }
        else {
            print('You can\'t go that way.')
        }
    }

    newCharacter(): Promise<Player> {
        return new Promise(async (resolve, reject) => {
            this.clear();
            const new_player = new Player({name: await input('\n\nType a name for yourself:')})
            const classes = ['Thief', 'Fighter', 'Spellcaster', 'Cleric']
            const className = classes[await this.optionBox({
                title: "     Choose One          ", 
                options: classes, 
                default_option: 1
            })];
            new_player.class_name = className.toLowerCase();
            switch (new_player.class_name) {
                case ('thief') :
                    new_player.max_hp = 35
                    new_player.max_sp = 50
                    new_player.max_mp = 20
                    new_player.strength = 9
                    new_player.agility = 4
                    new_player.coordination = 4
                    new_player.offHand = 0.8
                    new_player.healing = 4
                    new_player.magic_level = 1
                    new_player.abilities = {}
                    new_player.archery = 24
                    new_player.max_pets = 4
                    new_player.inventory.add(items.short_bow)
                    new_player.inventory.add(items.arrows(25))
                    new_player.inventory.add(items.gold(45))
                    break;
    
                case ('fighter') :
                    new_player.max_hp = 50
                    new_player.max_sp = 45
                    new_player.max_mp = 5
                    new_player.strength = 10
                    new_player.agility = 2
                    new_player.coordination = 3
                    new_player.offHand = 0.6
                    new_player.healing = 3
                    new_player.magic_level = 0
                    new_player.abilities = {}
                    new_player.archery = 10
                    new_player.max_pets = 3
                    new_player.inventory.add(items.shortsword)
                    new_player.inventory.add(items.gold(30))
                    break;
    
                case ('spellcaster') :
                    new_player.max_hp = 30
                    new_player.max_sp = 30
                    new_player.max_mp = 50
                    new_player.strength = 6
                    new_player.agility = 2
                    new_player.coordination = 2
                    new_player.offHand = 0.4
                    new_player.healing = 4
                    new_player.magic_level = 5
                    new_player.abilities = {
                        'bolt': 2,
                        'newbie': 4,
                    }
                    new_player.archery = 6
                    new_player.max_pets = 4
                    new_player.inventory.add(items.flask_of_wine)
                    new_player.inventory.add(items.gold(20))
                    break;
    
                case ('cleric') :
                    new_player.max_hp = 35
                    new_player.max_sp = 35
                    new_player.max_mp = 40
                    new_player.strength = 8
                    new_player.agility = 3
                    new_player.coordination = 3
                    new_player.offHand = 0.65
                    new_player.healing = 5
                    new_player.magic_level = 2
                    new_player.abilities = {
                        'newbie': 3,
                    }
                    new_player.archery = 22
                    new_player.max_pets = 5
                    new_player.inventory.add(items.gold(30))
                    new_player.inventory.add(items.healing_potion)
                    break;
            }
            new_player.location = this.find_location('Cottage of the Young');

            color('yellow')
            print("-- ", 1)
            color('red')
            print("You have declared ", 1)
            color('blue')
            print(className, 1)
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