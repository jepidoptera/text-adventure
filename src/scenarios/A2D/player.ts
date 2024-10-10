import {Character, Item, Location} from '../../game/location.ts'
import { A2dCharacter } from './characters.ts'
import { items } from './items.ts'
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'
import { GameState } from '../../game/game.ts';

class Player extends A2dCharacter {
    class_name: string = '';
    max_pets: number = 0;
    offHand: number = 0;
    healing: number = 0;
    healed: boolean = false;
    poison: number = 0;
    archery: number = 0;
    isPlayer: boolean = true;
    assistant: boolean = false;
    pronouns = {subject: 'you', object: 'you', possessive: 'your'};
    weapons: {[key: string]: Item} = {'main': items.fist(), 'left': items.fist()}
    flags: {
        enemy_of_ierdale: boolean,
        murders: number,
        forest_pass: boolean,
        orc_pass: boolean,
        earplugs: boolean
    } = {
        enemy_of_ierdale: false,
        murders: 0,
        forest_pass: false,
        orc_pass: false,
        earplugs: false
    }
    constructor(characterName: string, className: string) {
        super({name: characterName});
        this.inventory.add(items.banana())
        this.inventory.add(items.side_of_meat())
        this.inventory.add(items.club())
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
                this.inventory.add(items.short_bow())
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
                this.inventory.add(items.shortsword(1))
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
                this.inventory.add(items.flask_of_wine())
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
                this.inventory.add(items.healing_potion())
                break;
        }
        this.addAction('', () => {});
        this.addAction('n', () => this.go('north'));
        this.addAction('s', () => this.go('south'));
        this.addAction('e', () => this.go('east'));
        this.addAction('w', () => this.go('west'));
        this.addAction('i', () => this.listInventory());
        this.addAction('go', this.go);
        this.addAction('look', this.look);
        this.addAction('read', this.read);
        this.addAction('eat', this.eat);
        this.addAction('drink', this.drink);
        this.addAction('wield', (weapon: string) => this.wield(weapon, 'main'));
        this.addAction('wield2', (weapon: string) => this.wield(weapon, 'left'));
        this.addAction('ready', (weapon: string) => this.wield(weapon, 'bow'));
        this.addAction('drop', this.drop);
        this.addAction('get', this.get);
        this.addAction('hp', () => {this.checkHP(); this.checkXP()});
        this.addAction('heal', this.heal);
        this.addAction('talk', this.talk);
        this.addAction('attack', (name: string) => this.acquireTarget(this.location?.character?.(name)||this.attackTarget));
        this.addAction('\\', (name: string) => this.attack(this.location?.character?.(name)||this.attackTarget, this.weapons['left']));

        // start with full health
        this.recoverStats({hp: 100, sp: 100, mp: 100});
        this.autoheal();
        this.onTurn(() => {this._onSlay = this.checkHP});
    }

    async getInput() {
        let fighting = this.attackTarget?.location === this.location;
        let command = '';
        if (!fighting) {
            color(blue)
            print(this.name, 1)
            color(black)
            command = await input('>')
            if (!this.healed) {
                this.autoheal();
                color(brightblue)
                print("<A@+-/~2~\-+@D>")
            }
        } else {
            this.checkHP();
            this._onSlay = undefined;
            color(black)
            print(")===|[>>>>>>>>>>>>>>>>>>")
            command = await input()
        }
        // first see if the entire command can be executed
        if (this.location?.actions.has(command)) {
            this.location?.actions.get(command)?.();
        } else if (this.actions.has(command)) {
            this.actions.get(command)?.();
        } else {
            this.location?.characters.forEach(character => {
                if (character.actions.has(command)) {
                    character.actions.get(command)?.(this);
                }
            })

            // if not, try to parse the command
            const words = command.split(' ')
            const verb = words[0]
            const args = words.slice(1).join(' ')
            if (this.actions.has(verb)) {
                this.actions.get(verb)?.(args);
            } else if (this.location?.actions.has(verb)) {
                this.location?.actions.get(verb)?.(args);
            } else {
                color(gray)
                print('What?');
            }
        }
    }

    get hungerPenalty(): number {
        return (this.hunger > this._max_sp / 4) 
        ? ((this.hunger * 4 - this._max_sp) / 3 / this._max_sp)
        : 0
    }

    get max_sp() {
        return Math.floor(this._max_sp * (1 - this.hungerPenalty))
    }

    set max_sp(value) {
        this._max_sp = value
    }

    acquireTarget(target: Character | undefined) {
        console.log(`player targets ${target?.name}`)
        if(!target) {
            print('They are not here.')
        }
        this.attackTarget = target;
    }

    encounter(character: Character) {
        super.encounter(character);
        console.log(`player encountered "${character.name}", "${character.description}"`)
    }

    autoheal() {
        console.log('autohealing')
        this.recoverStats({hp: this.max_hp / 20, sp: this.max_sp / 5, mp: this.max_mp / 34});
        this.healed = true;
        setTimeout(() => {
            this.healed = false;
            console.log('time to heal again!')
        }, 25000);
    }

    look(target?: string) {
        color(black)
        print()
        print(this.location?.name)
        color(gray)
        this.location?.Landmarks.forEach(item => {
            print('    *' + item.description)
        })
        color(red)
        this.location?.characters.forEach(character => {
            if (character != this) {
                print('    ' + (character.description || character.name))
            }
        })
        color(gray)
        this.location?.items.forEach(item => {
            print('    ' + item.display)
        })
        color(black)
        print()
        print('You can go: ', 1)
        print(Array.from(this.location?.adjacent?.keys() ?? []).join(', '))
    }

    heal() {
        if (this._sp < 3 || this._sp < 5 && this.poison > 0) {
            print("You are too weak!");
            return;
        }
        this.recoverStats({hp: this.healing, sp: -3});
        print("You pull yourself together and heal some!");
    }

    go(direction: string) {
        if (super.go(direction)) {
            return true;
        }
        else {
            color(black)
            print('You can\'t go that way.')
            return false
        }
    }

    enter(location: Location): void {
        this.look();
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
    
    get inventoryWeight() {
        return Math.round(this.inventory.items.reduce((acc, item) => acc + item.size * item.quantity, 0) * 10) / 10
    }

    listInventory() {
        color(green, black)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite) 
        print()
        print(`         The Exquisite Inventory of ${this.name}, ${this.class_name}`)
        color(green, white)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        const listItems = this.inventory.items.sort((a, b) => (a.name < b.name ? -1 : 1)).filter(item => !(['gold', 'arrows'].includes(item.name)))
        listItems.forEach((item, i) => {
            if (i % 2 == 0) {
                print('    ' + item.display, 1)
            } else {
                locate(40)
                print(item.display)
                print()
            }
        })
        if (listItems.length % 2 == 1) print()
        color(gray)
        print(`Total Object Weight: ${this.inventoryWeight}/${this._max_sp /  3}`)
        color(green, white)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        color(black)
        print("Wielded:         ", 1)
        color(gray) 
        print(this.weapons['main']?.name ?? 'fist')
        color(black)
        print("Left Wielded:    ", 1)
        color(gray) 
        print(this.weapons['left']?.name ?? 'fist')
        if (this.weapons['bow']) {
            color(blue)
            print("Bow:             " + this.weapons['bow'].name)
        }
        color(gray)
        print("Armor:           " + this.armor['body']?.name ?? 'none')
        if (this.inventory.item('arrows')?.quantity) {
            color(orange)
            print("Arrows:          " + this.inventory.item('arrows')?.quantity)
        }
        color(yellow)
        print(`${this.inventory.item('gold')?.quantity ?? 0} GP`)
        color(green, black)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        if(this.assistant) {
            color(magenta)
            if (this.inventory.item('club') &&! this.weapons['main']) {
                print("Assistant -- Type \"wield club\" to set it as your wielded weapon.")
            }
            if (this.inventory.item('short bow') &&! this.weapons['bow']) {
                print("Assistant -- Type \"ready short bow\" to set it as your wielded bow.")
            }
        }
        
    }

    eat(itemName: string) {
        const item = this.inventory.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.eat) {
            item.eat(this);
            this.inventory.remove(item);
            color(orange)
            print(`${item.name} was consumed.`)
        }
        else {
            color(gray)
            print("You can't eat that.")
        }
    }

    drink(itemName: string) {
        const item = this.inventory.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.drink) {
            item.drink(this);
            this.inventory.remove(item);
            color(orange)
            print(`${item.name} was consumed.`)
        }
        else {
            color(gray)
            print("You can't drink that.")
        }
    }

    wield(itemName: string, hand: string) {
        const item = itemName == 'fist' ? items.fist() : this.inventory.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.is_weapon) {
            if (item.weapon_stats?.weapon_type === 'bow') {
                if (hand === 'bow') {
                    if (item.weapon_stats.strength_required??0 > this.strength) {
                        print(`You are not strong enough to wield that(${this.strength}/${item.weapon_stats.strength_required}).`)
                    } else {
                        print(`Successfully readied ${item.name} for shooting.`)
                    }
                }
                else {
                    print("That's a bow, not a melee weapon.")
                    if (this.assistant) {
                       color(magenta)
                       print(`Assistant -- Type \"ready ${itemName}\" instead.`)
                    }
                }
            }
            else {
                if (hand === 'bow') {
                    print("That's not a bow.")
                    if (this.assistant) {
                        color(magenta)
                        print(`Assistant -- Type \"wield ${itemName}\" instead.`)
                    }
                } else if (itemName === 'fist') {
                    print("Fist was successfully wielded.")
                } else if (item.weapon_stats?.strength_required??0 > this.strength) {
                    print(`You are not strong enough to wield that(${this.strength}/${item.weapon_stats?.strength_required}).`)
                } else {
                    const otherHand = hand === 'main' ? 'left' : 'main';
                    const numberRequired = this.weapons[otherHand]?.name === itemName ? 2 : 1;
                    if (!this.inventory.has(itemName, numberRequired)) {
                        print("You only have one.")
                    } else {
                        this.weapons[hand] = item;
                        if (hand === 'main') {
                            print(`${item.name} was successfully wielded.`)
                        }
                        else if (hand === 'left') {
                            print(`${item.name} was successfully left-wielded.`)
                        }
                    }
                }
            }
        }
        else {
            print("That object has no militaristic properties.")
        }
    }

    drop(itemName: string) {
        const item = this.inventory.item(itemName);
        if (!item) {
            print("You don't have that.")
        }
        else {
            this.inventory.transfer(item, this.location??this.inventory);
            print(`Dropped ${item.name}`)
        }
    }

    get(itemName: string) {
        const item = this.location?.item(itemName);
        if (!item) {
            color(black)
            print("That's not here.")
        }
        else {
            let displayName = item.display
            this.getItem(item);
            if (this.inventory.has(itemName)) {
                color(black)
                print(`Got ${displayName}.`)
            }
        }
    }

    checkHP() {
        color(black)
        print(` [HP:  ${this.hp}/${this._max_hp}`, 1)
        print("  SP: ", 1)
        if (this.hungerPenalty) color(brightred)
        print(`${this.sp}/${this.max_sp}`, 1)
        color(black)
        print(`  BP: ${this.mp}/${this._max_mp}]`)
    }

    checkXP() {
        color(black)
        print(`EXP: ${this.experience}`)
    }

    talk(characterName: string) {
        const character = this.location?.character(characterName);
        if (!character) {
            color(black)
            print("They're not here.")
        }
        else {
            if (character.actions.has('talk')) {
                character.actions.get('talk')?.(this);
            } else {
                color(black)
                print("They don't want to talk.")
            }
        }
    }

    die(cause: any) {
        if (typeof cause === typeof Character) {
            color(brightred, gray)
            print(`You go limply unconscious as ${cause.name} stands triumphantly over you.                      `)
            if (this.assistant) print("   -ASSISTANT-  Next time be careful when you choose your fights, though")
            if (this.assistant) print("   -ASSISTANT-  sometimes its good to be darring and explore new areas where")
            if (this.assistant) print("   -ASSISTANT-  creatures may not be so friendly")
        } else if (cause.hasownproperty('name')) {
            print(`You have died from ${cause.name}.`)
        } else {
            print(`You have died from ${cause}.`)
        }
    }

    slay(character: Character) {
        this._onSlay?.(character);
        print()
        color(yellow)
        print(`You defeat ${character.name}!`)
        color(green)
        this.experience += character.exp_value;
        print(` you gain ${character.exp_value} exp.`)
        if (character.has('gold')) {
            print(` you gain ${character.inventory.count('gold')} gold.`)
            character.inventory.transfer('gold', this.inventory);
        }
        color(black)
        for (let item of character.inventory.items) {
            print(`${character.name} drops ${item.display}`)
        }
        this.attackTarget = undefined;
        for (let enemy in this.enemies) {
            if (this.enemies[enemy] === character) {
                delete this.enemies[enemy];
            } else if (this.enemies[enemy].location === this.location) {
                this.attackTarget = this.enemies[enemy];
            }
        }
    }

    act(game: GameState) {
        console.log(`player action:`)
        if (this.attackTarget?.location === this.location) {
            console.log('target qcquired')
            this.attack(this.attackTarget);
        }
    }
}

export { Player }