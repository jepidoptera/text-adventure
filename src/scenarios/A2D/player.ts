import { findPath, Location } from "../../game/location.js"
import { Item } from "../../game/item.js"
import { Character, BaseStats, Buff, DamageTypes } from "../../game/character.js"
import { A2dCharacter } from "./characters.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js"
import { GameState } from "../../game/game.js";
import { caps, plural, printCharacters, randomChoice } from "../../game/utils.js";
import { spells, abilityLevels } from "./spells.js";
import { getBuff } from "./buffs.js"
import { landmarks } from "./landmarks.js"
import { scenario } from "./map.js"
import { assistant } from "./assistant.js"
import { isValidItemKey } from "./items.js"

type EquipmentSlot = 'right hand' | 'left hand' | 'bow' | 'armor' | 'ring';
type StatKey = BaseStats | `${DamageTypes}_damage` | `${DamageTypes}_defense`;

class Player extends A2dCharacter {
    class_name: string = '';
    max_pets: number = 0;
    healed: boolean = false;
    isPlayer: boolean = true;
    cheatMode: boolean = false;
    pronouns = { subject: 'you', object: 'you', possessive: 'your' };
    disabledCommands: { [key: string]: string } = {};
    right_fist = this.game.addItem({ name: 'fist' })!;
    left_fist = this.game.addItem({ name: 'fist' })!;
    activeEquipment: { [key in EquipmentSlot]: boolean } = { 'armor': true, 'bow': false, 'left hand': false, 'right hand': false, 'ring': true };

    equipment: {
        [key in EquipmentSlot]: Item | null
    } = {
            'right hand': this.right_fist,
            'left hand': this.left_fist,
            'bow': null,
            'armor': null,
            'ring': null,
        }
    flags: {
        assistant: boolean,
        enemy_of_ierdale: boolean,
        murders: number,
        forest_pass: boolean,
        orc_pass: boolean,
        earplugs: boolean,
        hungry: boolean,
        path: string[],
    } = {
        assistant: false,
        enemy_of_ierdale: false,
        murders: 0,
        forest_pass: false,
        orc_pass: false,
        earplugs: false,
        hungry: false,
        path: [],
    } as const
    assistantHintsUsed: { [key: string]: number } = {}
    lastCommand: string[] = [];

    constructor(characterName: string, className: string, game: GameState) {
        super({ name: characterName, game: game });
        this.game.addItem({ name: "banana", container: this.inventory })
        this.game.addItem({ name: "side_of_meat", container: this.inventory })
        this.game.addItem({ name: "club", container: this.inventory })
        this.class_name = className.toLowerCase();
        switch (this.class_name) {
            case ('thief'):
                this.base_stats = {
                    max_hp: 35,
                    max_sp: 50,
                    max_mp: 25,
                    hp_recharge: 1 / 15,
                    sp_recharge: 1 / 5,
                    mp_recharge: 1 / 25,
                    strength: 9,
                    agility: 4,
                    coordination: 4,
                    healing: 4,
                    magic_level: 3,
                    archery: 24,
                    offhand: 0.8,
                    speed: 1
                }
                this.abilities = {}
                this.max_pets = 4
                this.game.addItem({ name: "short_bow", container: this.inventory })
                this.game.addItem({ name: 'arrow', quantity: 25, container: this.inventory })
                this.game.addItem({ name: 'gold', quantity: 155, container: this.inventory })
                break;

            case ('fighter'):
                this.base_stats = {
                    max_hp: 50,
                    max_sp: 45,
                    max_mp: 10,
                    hp_recharge: 1 / 8,
                    sp_recharge: 1 / 3,
                    mp_recharge: 1 / 34,
                    strength: 10,
                    agility: 2,
                    coordination: 4,
                    healing: 3,
                    magic_level: 2,
                    archery: 10,
                    speed: 1,
                    offhand: 0.6
                }
                this.abilities = {}
                this.max_pets = 3
                this.abilities = {
                    bloodlust: 2,
                }
                this.game.addItem({ name: 'shortsword', container: this.inventory })
                this.game.addItem({ name: 'gold', quantity: 30, container: this.inventory })
                break;

            case ('spellcaster'):
                this.base_stats = {
                    max_hp: 30,
                    max_sp: 30,
                    max_mp: 70,
                    hp_recharge: 1 / 20,
                    sp_recharge: 1 / 7,
                    mp_recharge: 1 / 7,
                    strength: 6,
                    agility: 2,
                    coordination: 2,
                    offhand: 0.4,
                    healing: 4,
                    magic_level: 7,
                    archery: 6,
                    speed: 1
                }
                this.abilities = {
                    'bolt': 2,
                    'newbie': 4,
                }
                this.max_pets = 4
                this.game.addItem({ name: "flask_of_wine", quantity: 2, container: this.inventory })
                this.game.addItem({ name: 'gold', quantity: 50, container: this.inventory })
                break;

            case ('cleric'):
                this.base_stats = {
                    max_hp: 35,
                    max_sp: 35,
                    max_mp: 40,
                    hp_recharge: 0.10,
                    sp_recharge: 0.20,
                    mp_recharge: 0.10,
                    strength: 8,
                    agility: 3,
                    coordination: 3,
                    offhand: 0.65,
                    healing: 5,
                    magic_level: 4,
                    archery: 22,
                    speed: 1
                }
                this.abilities = {
                    'newbie': 3,
                }
                this.max_pets = 5
                this.game.addItem({ name: 'gold', quantity: 0, container: this.inventory })
                this.game.addItem({ name: "healing_potion", container: this.inventory })
                break;
        }

        this.addAction('save', this.saveGame);
        this.addAction('load', this.loadGame);
        this.addAction('', async () => { if (this.flags.path?.length ?? 0 > 0) this.go('') });
        this.addAction('n', async () => await this.go('north'));
        this.addAction('s', async () => await this.go('south'));
        this.addAction('e', async () => await this.go('east'));
        this.addAction('w', async () => await this.go('west'));
        this.addAction('ne', async () => await this.go('northeast'));
        this.addAction('se', async () => await this.go('southeast'));
        this.addAction('sw', async () => await this.go('southwest'));
        this.addAction('nw', async () => await this.go('northwest'));
        this.addAction('down', async () => await this.go('down'));
        this.addAction('up', async () => await this.go('up'));
        this.addAction('go', this.go);
        this.addAction('flee', async () => { if (this.backDirection) await this.go(this.backDirection); else { color(black); print('you are cornered!') } });
        this.addAction('i', async () => this.checkInventory());
        this.addAction('look', this.look);
        this.addAction('read', this.read);
        this.addAction('eat', this.eat);
        this.addAction('drink', this.drink);
        this.addAction('use', this.use);
        this.addAction('wield', async (weapon: string) => await this.equip(weapon, 'right hand'));
        this.addAction('wield2', async (weapon: string) => await this.equip(weapon, 'left hand'));
        this.addAction('wear', async (item: string) => await this.equip(item, this.item(item)?.equipment_slot as keyof Player['equipment']));
        this.addAction('ready', async (weapon: string) => await this.equip(weapon, 'bow'));

        this.addAction('drop', this.drop);
        this.addAction('get', this.get);
        this.addAction('hp', async () => { this.checkHP(); this.checkHunger(); this.checkXP() });
        this.addAction('stats', this.checkStats);
        this.addAction('equipment', this.checkEquipment);
        this.addAction('heal', this.heal);
        this.addAction('talk', this.talkTo);
        this.addAction('attack', async (name: string) => this.target(this.location?.character?.(name)));
        this.addAction('\\', async (name: string) => await this.left_attack(name));
        this.addAction('shoot', async (name: string) => await this.bow_attack(name));
        this.addAction('cast', this.spell);
        this.addAction('cheatmode xfish9', async () => { this.cheatMode = true; color(magenta); print('Cheat mode activated.') });
        this.addAction('cheat', this.cheat);
        this.addAction('buffs', this.checkBuffs);
        this.addAction('goto', this.goto);

        console.log('loaded player actions.')

        // start with full health
        this.recoverStats({ hp: 100, sp: 100, mp: 100 });
        this.autoheal();
        this.onTurn(async () => { this.onSlay(this.checkHP) });
    }

    async goto(locationName: string) {
        const location = this.game.find_location(locationName);
        if (!location) { return this }
        if (location && this.location) {
            console.log('looking for a path to location', location.key)
            this.flags.path = findPath(this.location, location);
            print(this.flags.path.join(', '))
        }
        return this;
    }

    async getInput() {
        let command = '';
        color(black, darkwhite)
        // console.log('player input')
        if (this.fighting) {
            console.log(`player is fighting ${this.attackTarget?.name}`)
            const dirs = ['north', 'south', 'east', 'west']
            this.disableCommands(dirs.map(dir => `go ${dir}`), `${this.attackTarget?.name} blocks your way!`);
            this.disableCommands(dirs.map(dir => dir.slice(0, 1)), `${this.attackTarget?.name} blocks your way!`);
            this.checkHP();
            this.onSlay(async () => { });
            color(black)
            print(")===|[>>>>>>>>>>>>>>>>>>")
            command = await input()
        } else {
            const dirs = ['north', 'south', 'east', 'west']
            this.enableCommands(dirs.map(dir => `go ${dir}`));
            this.enableCommands(dirs.map(dir => dir.slice(0, 1)));
            color(blue)
            print(this.name, 1)
            color(black)
            command = await input('>')
            if (!this.healed) {
                this.autoheal();
                color(brightblue)
                print("<A@+-/~2~\-+@D>")
            }
        }
        color(black, darkwhite)
        command = command.toLowerCase().trim();
        this.lastCommand.unshift(command);
        console.log(`player command log: ${this.lastCommand.slice(0, 5)}`)
        // block disabled commands
        if (this.disabledCommands[command]) {
            color(gray)
            print(this.disabledCommands[command])
            return;
        }
        // first see if the entire command can be executed
        // the order in which these are checked is important and should not change.
        if (this.location?.actions.has(command)) {
            // get location actions first
            await this.location?.actions.get(command)?.(this);
        } else {
            for (let character of this.location?.characters ?? []) {
                if (character != this && character.actions.has(command)) {
                    // get character actions next
                    await character.actions.get(command)?.(this);
                    return
                }
            }
            for (let item of this.items) {
                // then item actions
                if (item.actions.has(command)) {
                    await item.getAction(command)?.(this);
                    return
                }
            }
            if (this.actions.has(command)) {
                // player's own actions last, which means they can be overridden by locations, characters, or items
                console.log(`player action ${command}`)
                await this.useAction(command);
                return
            }

            // if not, try to parse the command
            const words = command.split(' ')
            const verb = words[0]
            const args = words.slice(1).join(' ')
            if (this.location?.actions.has(verb)) {
                await this.location?.actions.get(verb)?.(this, args);
            } else {
                // see if any characters in the room can handle the command
                for (let character of this.location?.characters ?? []) {
                    if (character != this && character.actions.has(verb)) {
                        await character.actions.get(verb)?.(this, args);
                        return
                    }
                }
                // see if any items can handle the command
                for (let item of this.items) {
                    if (item.actions.has(verb)) {
                        await item.getAction(verb)?.(this, args);
                        return
                    }
                }
                if (this.actions.has(verb)) {
                    console.log(`player action ${verb} ${args}`)
                    await this.actions.get(verb)?.(args);
                    return;
                }
                color(gray)
                print('What?');
            }
        }
    }

    disableCommands(commands: string[], message: string) {
        commands.forEach(command => {
            this.disabledCommands[command] = message
        })
        console.log(`disabled commands: ${Object.keys(this.disabledCommands)}`)
    }

    enableCommands(commands?: string[]) {
        if (!commands) {
            this.disabledCommands = {}
            return;
        }
        commands.forEach(command => {
            delete this.disabledCommands[command]
        })
    }

    get hungerPenalty(): number {
        return (this.hunger > super.max_sp / 4)
            ? ((this.hunger * 4 - super.max_sp) / 3 / super.max_sp)
            : 0
    }

    get max_sp() {
        return Math.max(super.max_sp * (1 - this.hungerPenalty), 1)
    }

    get max_carry() {
        return this.strength * 2
    }

    autoheal() {
        console.log('autohealing')
        const prevstats = { hp: this.hp, sp: this.sp, mp: this.mp }
        this.recoverStats({ hp: this.hp_recharge * this.max_hp, sp: this.sp_recharge * this.max_sp, mp: this.mp_recharge * this.max_mp });
        const diff = - prevstats.hp + this.hp - prevstats.sp + this.sp - prevstats.mp + this.mp + this.strength;
        console.log(`healed ${diff} points`)
        this.hunger = Math.max(this.hunger + diff / 10, -this.max_sp / 4)
        color(magenta)
        if (this.hungerPenalty >= 1) {
            this.hurt(this.hunger - this.base_stats.max_sp, 'hunger')
            print('You are starving!')
        } else if (this.hungerPenalty && this.flags.hungry) {
            print('You are hungry.')
        } else if (this.hungerPenalty * this.max_sp > 1 && !this.flags.hungry) {
            print('Your stomach begins to grumble.')
            this.flags.hungry = true;
        } else {
            this.flags.hungry = false;
        }
        this.healed = true;
        setTimeout(() => {
            this.healed = false;
            console.log('time to heal again!')
        }, 25000);
    }

    target(target?: Character) {
        console.log(`player targets ${target?.name}`)
        if (!target) {
            print('They are not here.')
        }
        this.fight(target || this.attackTarget);
    }

    useWeapon(weapon: 'left hand' | 'right hand' | 'bow' | 'none') {
        this.activeEquipment['right hand'] = weapon == 'right hand';
        this.activeEquipment['left hand'] = weapon == 'left hand';
        this.activeEquipment['bow'] = weapon == 'bow';
    }

    async left_attack(targetName: string) {
        if (targetName) {
            this.fight(this.location?.character?.(targetName) || this.attackTarget);
        }
        this.useWeapon('left hand');
        await this.attack(this.attackTarget, this.equipment['left hand'], this.weaponDamage('left hand'));
    }

    async bow_attack(enemy: Character | string) {
        if (typeof enemy === 'string') {
            const target = this.location?.character(enemy);
            if (!target) {
                print("They're not here.");
                return;
            }
            enemy = target;
        }
        if (this.equipment['bow'] && this.has('arrow') && !this.fighting) {
            this.removeItem('arrow', 1);
            this.useWeapon('bow');
            this.fight(enemy);
            await this.attack(enemy, this.equipment['bow'], this.weaponDamage('bow'));
        } else if (this.equipment['bow'] && !this.has('arrow')) {
            print("You're out of arrows.")
        } else if (this.equipment['bow'] && this.fighting) {
            print("There's no time!")
        } else {
            print("You don't have a bow.")
        }
    }

    async defend(attacker: Character) {
        if (!this.fighting) await this.bow_attack(attacker);
        await super.defend(attacker);
    }

    async encounter(character: Character) {
        await super.encounter(character);
        console.log(`player encountered "${character.name}", "${character.description}"`)
    }

    async look(target?: string) {
        color(black)
        print()
        print(this.location?.name)
        if (this.location?.description) {
            console.log('location description', this.location?.description)
            color(magenta)
            let lineLength = 0;
            let words = this.location?.description.split(' ')
            let lastWord = words[words.length - 1]
            for (let word of words) {
                if (lineLength + word.length + 1 > 80) {
                    if (word != lastWord) print()
                    lineLength = 0;
                } else if (lineLength > 0) {
                    print(' ', 1)
                    lineLength += 1;
                }
                print(word, 1)
                lineLength += word.length;
            }
            print()
        }
        color(gray)
        this.location?.landmarks.forEach(item => {
            print('    *' + item.description)
        })
        color(red)
        this.location?.characters.forEach(character => {
            if (character != this) {
                print('    ' + (character.name))
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

    async heal() {
        color(black)
        const healed = Math.min(this.healing, this.max_hp - this.hp, this.sp);
        if (healed == 0) {
            if (this.sp == 0) print("You are too weak!");
            else print("You are already at full health.");
            return;
        }
        this.recoverStats({ hp: healed, sp: -healed });
        print("You pull yourself together and heal some!");
    }

    async go(direction: string) {
        const prevLocation = this.location?.key;
        console.log('go!', direction)
        color(black)
        if (this.sp <= 0) {
            print("You are too weak!");
        } else if (!this.location?.adjacent.has(direction)) {
            print('You can\'t go that way.')
        } else {
            await super.go(direction)
            if (this.location?.key != prevLocation) {
                this.recoverStats({ sp: -0.5 });
            }
        }
    }

    async enter(location: Location) {
        this.look();
    }

    async read(itemName: string) {
        const item = this.location?.item(itemName) || this.item(itemName);
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
        return Math.round(this.items.reduce((acc, item) => acc + item.size * item.quantity, 0) * 10) / 10
    }

    async checkBuffs() {
        color(black)
        for (let buff of Object.values(this.buffs)) {
            const buffKeys = Array.from(new Set(Object.keys(buff.times).concat(Object.keys(buff.plus))))
            print(
                `${buff.name}: ${buffKeys.reduce(
                    (prev, curr) => (
                        prev + `\n  ${curr}: ${curr !== 'defense' && curr !== 'damage' ? (
                            `${buff.plus[curr as BaseStats] ? `x ${buff.plus[curr as BaseStats]}` : ''
                            } ${buff.times[curr as BaseStats] ? `x ${buff.times[curr as BaseStats]}` : ''
                            }`
                        ) : (`${curr}: ${Object.keys(buff.times[curr as 'defense' | 'damage'] || {}).reduce((prev, curr) => (
                            prev + `\n    ${curr}: ${buff.plus[curr as BaseStats] ? `x ${buff.plus[curr as BaseStats]}` : ''
                            } ${buff.times[curr as BaseStats] ? `x ${buff.times[curr as BaseStats]}` : ''
                            }`
                        ), '' as string)
                            }`)
                        }`
                    )
                    , '')
                }`
            )
        }
    }

    async checkInventory() {
        let lines = 4;
        async function nextLine() {
            lines += 1;
            if (lines > 25) {
                color(black)
                print('more, press a key...')
                await getKey();
                lines = 0;
            }
        }
        color(green, black)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        print(`         The Exquisite Inventory of ${this.name}, ${this.class_name}`)
        color(green, white)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        const listItems = this.items.sort((a, b) => (a.name < b.name ? -1 : 1)).filter(item => !(['gold', 'arrows'].includes(item.name)))
        let i = 0
        for (let item of listItems) {
            if (i % 2 == 0) {
                print('    ' + item.display, 1)
            } else {
                locate(40)
                print(item.display)
                await nextLine();
            }
            i++;
        }
        if (listItems.length % 2 == 1) print()
        color(gray)
        print(`Total Object Weight: ${this.inventoryWeight}/${this.max_carry}`)
        await nextLine();
        color(green, white)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        await nextLine();
        color(black, darkwhite)
        print()
        color(black)
        print("Wielded:         ", 1)
        await nextLine();
        color(gray)
        print(this.equipment['right hand']?.name ?? 'fist')
        await nextLine();
        color(black)
        print("Left Wielded:    ", 1)
        await nextLine();
        color(gray)
        print(this.equipment['left hand']?.name ?? 'fist')
        await nextLine();
        if (this.equipment['bow']) {
            color(blue)
            print("Bow:             " + this.equipment['bow'].name)
        }
        await nextLine();
        color(black)
        print("Armor:           ", 1)
        await nextLine();
        color(gray)
        print((this.equipment['armor'] ? this.equipment['armor'].name : 'none'))
        if (this.equipment['ring']) {
            await nextLine();
            color(blue)
            print("Ring:            " + this.equipment['ring'].name)
        }
        if (this.item('arrows')?.quantity) {
            await nextLine();
            color(orange)
            print("Arrows:          " + this.item('arrows')?.quantity)
        }
        await nextLine();
        color(yellow)
        print(`${this.item('gold')?.quantity ?? 0} GP`)
        color(green, black)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        if (this.flags.assistant) {
            color(magenta)
            if (this.item('club') && !this.equipment['right hand']) {
                print("Assistant -- Type \"wield club\" to set it as your wielded weapon.")
            }
            if (this.item('short bow') && !this.equipment['bow']) {
                print("Assistant -- Type \"ready short bow\" to set it as your wielded bow.")
            }
        }
    }

    async eat(itemName: string) {
        const item = this.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.eat) {
            await item.eat(this);
            this.removeItem(item, 1);
            color(orange)
            print(`${item.name} was consumed.`)
            this.checkHP();
            this.checkHunger();
        }
        else {
            color(gray)
            print("You can't eat that.")
        }
    }

    async drink(itemName: string) {
        const item = this.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.drink) {
            await item.drink(this);
            this.removeItem(item, 1);
            color(orange)
            print(`${item.name} was consumed.`)
            this.checkHP();
            this.checkHunger();
        }
        else {
            color(gray)
            print("You can't drink that.")
        }
    }

    async use(itemName: string) {
        const item = this.item(itemName);
        if (!item) {
            color(gray)
            print("You don't have that.")
        }
        else if (item.use) {
            await item.use(this);
        }
        else {
            color(gray)
            print("You can't use that.")
        }
    }

    async equip(item: string | Item | undefined, slot: keyof Player['equipment']) {
        color(black)
        if (item == 'fist') {
            item = slot == 'right hand' ? this.right_fist : this.left_fist;
        } else if (typeof item === 'string') {
            item = this.item(item);
        }
        if (!item) {
            print("You don't have that.")
            return;
        } else if (slot == 'right hand' || slot == 'left hand' || slot == 'bow') {
            if (item.requirements) {
                for (let key of Object.keys(item.requirements)) {
                    if (item.requirements && this.base_stats[key as BaseStats] < (item.requirements[key as BaseStats] || 0)) {
                        print(`Your ${key} is too low to use that ${item.requirements[key as BaseStats]} required.`)
                        return;
                    }
                }
                if (slot === 'bow') {
                    if (item.equipment_slot === 'bow') {
                        print(`Successfully readied ${item.name} for shooting.`)
                    } else {
                        print("That's not a bow.")
                        if (this.flags.assistant) {
                            color(magenta)
                            print(`Assistant -- Type \"wield ${item.name}\" instead.`)
                        }
                        return;
                    }
                } else if (slot === 'right hand' || slot === 'left hand') {
                    if ((item as Item)?.equipment_slot === 'bow') {
                        print("That's a bow, not a melee weapon.")
                        if (this.flags.assistant) {
                            color(magenta)
                            print(`Assistant -- Type \"ready ${item.name}\" instead.`)
                        }
                        return;
                    } else {
                        print(`${item.name} was successfully ${slot === 'left hand' ? 'left-' : ''}wielded.`)
                    }
                }
            } else {
                print("That object has no militaristic properties.")
                return;
            }
        }
        if (this.equipment[slot] && this.equipment[slot].name != 'fist') {
            // put their previous weapon in their inventory
            await this.giveItem(this.equipment[slot]);
            await this.equipment[slot].unequip(this);
        }
        this.removeItem(item, 1)
        this.equipment[slot] = item
        if (item.equip) {
            await item.equip(this);
        }
    }

    async checkEquipment() {
        const slot_titles = {
            'right hand': 'Wielded',
            'left hand': 'Left Wielded',
            'bow': 'Bow',
            'armor': 'Armor',
            'ring': 'Ring',
        }
        const base_damage = {
            'blunt': this.strength,
            'sharp': this.strength,
            'magic': (this.strength + this.magic_level),
        }
        const displayItem = (slot: keyof Player['equipment']) => {
            const item = this.equipment[slot];
            let totalDamage = 0;
            const lines: (() => any)[] = [
                () => {
                    color(black, darkwhite)
                    print(`${slot_titles[slot]}: `, 1)
                    color(black, white)
                    print(item?.name ?? 'none', 1)
                    color(black, darkwhite)
                },
            ];
            if (!item) return lines.concat(() => print('', 1));
            const isBaseStat = (key: string): key is BaseStats => {
                return !['damage', 'defense'].includes(key) &&
                    Object.keys(this.base_stats).includes(key);
            }

            // bonuses
            for (let buffType of ['times', 'plus'] as const) {
                for (let [key, value] of Object.entries(item.buff?.[buffType as 'times' | 'plus'] ?? {})) {
                    if (isBaseStat(key)) {
                        lines.push(() => this.printBuff(key, buffType, value as number))
                    } else {
                        for (let [damageType, amount] of Object.entries(item.buff?.[buffType as 'times' | 'plus']?.[key as 'damage' | 'defense'] || {})) {
                            if (item.is_weapon && key == 'damage' && damageType in base_damage && (slot == 'right hand' || slot == 'left hand') && buffType == 'times') {
                                const typeDamage = Math.ceil(
                                    base_damage[damageType as 'blunt' | 'sharp' | 'magic'] * amount * (slot == 'left hand' ? this.offhand : 1)
                                )
                                totalDamage += typeDamage;
                                lines.push(() => {
                                    color(black)
                                    print(`${slot == 'left hand' ? `${Math.ceil(this.offhand * 100)}% of ` : ''}`, 1)
                                    color(blue)
                                    print(`${amount}x `, 1)
                                    color(black)
                                    print(`${damageType} damage`, 1)
                                    print(` = `, 1)
                                    color(red)
                                    print(`${typeDamage}`, 1)
                                })
                            } else if (buffType == 'plus') {
                                if (key == 'damage' && item.is_weapon)
                                    totalDamage += amount;
                                lines.push(() => {
                                    color(blue)
                                    print(`+${amount} `, 1)
                                    color(black)
                                    print(`${damageType} ${key}`, 1)
                                })
                            } else if (key == 'defense') {
                                amount = (1 - 1 / amount)
                                lines.push(() => {
                                    color(blue)
                                    print(`-${Math.ceil(amount * 100)}% `, 1)
                                    color(black)
                                    print(`${damageType} damage`, 1)
                                })
                            }
                        }
                    }
                }
            }

            if (item?.is_weapon && (slot == 'right hand' || slot == 'left hand')) {

                lines.push(() => {
                    color(black)
                    print('total: ', 1)
                    color(red)
                    print(`${totalDamage}`, 1)
                })
            }
            lines.push(() => print('', 1))
            return lines
        }
        let leftSide = displayItem('right hand')
        let rightSide = displayItem('left hand')
        const remainders = [displayItem('bow'), displayItem('armor'), displayItem('ring')]

        // find the combination of lines that will be closest to two even columns
        let options = [[[0, 1], [2]], [[0, 2], [1]], [[1, 2], [0]], [[0], [1, 2]], [[1], [0, 2]], [[2], [0, 1]]]
        const parity = (option: number[][]) => {
            return Math.abs(
                leftSide.length + option[0].reduce((acc, i) => acc + remainders[i].length, 0)
                - rightSide.length - option[1].reduce((acc, i) => acc + remainders[i].length, 0)
            )
        }
        const chosen = options.sort((a, b) => parity(a) - parity(b))[0]
        leftSide = leftSide.concat(...chosen[0].map(i => remainders[i]))
        rightSide = rightSide.concat(...chosen[1].map(i => remainders[i]))

        for (let i = 0; i < Math.max(leftSide.length, rightSide.length); i++) {
            if (i < leftSide.length) {
                print("  ", 1)
                leftSide[i]()
            } else print('', 1)
            if (i < rightSide.length) {
                locate(40)
                rightSide[i]()
            }
            print()
        }
    }

    async spell(spellName: string) {
        color(black)
        if (this.abilities[spellName]) {
            await spells[spellName].call(this, this.attackTarget ?? this);
        } else {
            console.log(`${spellName} failed.`)
            console.log(this.abilities)
            print("You don't know that spell.")
        }
    }

    async drop(itemName: string) {
        color(black)
        const item = this.item(itemName);
        if (!item) {
            print("You don't have that.")
        }
        else {
            this.dropItem(item.name);
            print(`Dropped ${item.name}`)
        }
    }

    async get(itemName: string) {
        const item = this.location?.item(itemName);
        if (!item) {
            print("That's not here.")
        }
        else {
            let displayName = item.display
            this.getItem(itemName);
            if (this.has(itemName)) {
                print(`Got ${displayName}.`)
            }
            if (item.equipment_slot && this.flags.assistant) {
                color(magenta)
                print(`Assistant -- Type \"wear ${item.name}\" to equip it.`)
            }
        }
    }

    async checkHP() {
        color(black);
        print(`[ HP:  ${Math.ceil(this.hp)}/`, 1);
        if (this.buff_additive('max_hp') > 0 || this.buff_multiplier('max_hp') > 1) color(blue);
        else if (this.buff_additive('max_hp') < 0 || this.buff_multiplier('max_hp') < 1) color(brightred);
        print(`${Math.ceil(this.max_hp)}`, 1);
        color(black);
        print("  SP: ", 1);
        if (this.hungerPenalty * this.max_sp > 1) color(brightred);
        print(`${Math.ceil(this.sp)}/`, 1);
        if (this.buff_additive('max_sp') > 0 || this.buff_multiplier('max_sp') > 1) color(blue);
        else if (this.buff_additive('max_sp') < 0 || this.buff_multiplier('max_sp') < 1) color(brightred);
        print(`${Math.ceil(this.max_sp)}`, 1);
        color(black);
        print(`  BP: ${Math.ceil(this.mp)}/`, 1)
        if (this.buff_additive('max_mp') > 0 || this.buff_multiplier('max_mp') > 1) color(blue);
        else if (this.buff_additive('max_mp') < 0 || this.buff_multiplier('max_mp') < 1) color(brightred);
        print(`${Math.ceil(this.max_mp)} ]`)
        color(black)
    }

    checkHunger() {
        print(`[ Hunger: `, 1)
        const barLength = 18 + [this.max_hp, this.hp, this.max_sp, this.sp, this.max_mp, this.mp].reduce(
            (sum, stat) => sum + Math.max(Math.floor(Math.log10(stat)), 0), 0
        );
        const barColor = red; // this.hunger / this.max_sp > 1 / 4 ? (this.hunger > this.max_sp / 2 ? brightred : red) : green
        for (let i = 0; i < barLength; i++) {
            if (this.hunger / super.max_sp * barLength > i) color(darkwhite, barColor)
            else color(darkwhite, black)
            print('▂', 1)
        }
        color(black, darkwhite)
        print(' ]')
        // print(this.hunger.toString())
    }

    statName(key: StatKey): string {
        // Handle basic stats
        switch (key as BaseStats) {
            case 'max_hp': return 'Max HP';
            case 'max_mp': return 'Max MP';
            case 'max_sp': return 'Max SP';
            case 'strength': return 'Strength';
            case 'coordination': return 'Coordination';
            case 'agility': return 'Agility';
            case 'magic_level': return 'Magic Level';
            case 'healing': return 'Healing';
            case 'archery': return 'Archery';
            case 'hp_recharge': return 'HP Recharge';
            case 'mp_recharge': return 'MP Recharge';
            case 'sp_recharge': return 'SP Recharge';
            case 'speed': return 'Speed';
        }

        // Handle damage and defense types
        if (key.includes('_')) {
            const [type, category] = key.split('_') as [DamageTypes, 'damage' | 'defense'];
            // Capitalize first letter of damage type
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            return `${capitalizedType} ${category === 'damage' ? 'Damage' : 'Defense'}`;
        }

        // Default case
        return key;
    }

    statValue(key: BaseStats, value?: number) {
        if (value === undefined) value = this[key] as number;
        switch (key) {
            case ('hp_recharge'): return `${Math.min(Math.round(value * 100), 100)}%`;
            case ('mp_recharge'): return `${Math.min(Math.round(value * 100), 100)}%`;
            case ('sp_recharge'): return `${Math.min(Math.round(value * 100), 100)}%`;
            case ('speed'): return `${Math.round(value * 100)}%`;
            case ('offhand'): return `${Math.floor(this.offhand * 100)}%`;
            default: return `${Math.round(value)}`;
        }
    }

    printBuff(statName: BaseStats, buffType: 'plus' | 'times', value: number) {
        const defaultValue = buffType === 'plus' ? 0 : 1;
        if (value == defaultValue) return;
        color(value > defaultValue ? blue : brightred)
        switch (statName) {
            case 'hp_recharge':
            case 'sp_recharge':
            case 'mp_recharge':
            case 'offhand':
                if (buffType == 'plus') print(`${value > defaultValue ? '+' : ''}${value * 100}% `, 1)
                break;
            case 'offhand':
                if (buffType == 'plus') print(`${value > defaultValue ? '+' : ''}${value * 100}% `, 1)
                break;
            default:
                if (buffType == 'times') {
                    if (value > defaultValue) print(`+${Math.ceil(value * 100 - 100)}% `, 1)
                    else if (value < defaultValue) print(`-${Math.ceil(value * 100 - 100)}% `, 1)
                } else if (buffType == 'plus') {
                    if (value > defaultValue) print(`+${Math.ceil(value)} `, 1)
                    else if (value < defaultValue) print(`${Math.ceil(value)} `, 1)
                }
        }
        color(black);
        print(this.statName(statName), 1)
    }

    async checkStats() {
        const printStat = (statName: BaseStats) => {
            const plus = this.buff_additive(statName);
            const times = this.buff_multiplier(statName);
            if (this.base_stats[statName] < this[statName]) {
                color(blue)
            } else if (this.base_stats[statName] > this[statName]) {
                color(brightred)
            } else {
                color(black)
            }
            print(this.statValue(statName, (this[statName] as number)), 1)
            if (plus > 0) print(` (+${this.statValue(statName, plus)})`, 1)
            else if (plus < 0) print(` (${this.statValue(statName, plus)})`, 1)
            if (times !== 1) print(` (x${this.statValue(statName, times)})`, 1)
            print()
            color(black)
        }
        color(black)
        print(`Class: ${this.class_name}`)
        print(`Archery: `, 1)
        printStat('archery')
        print(`Coordination: `, 1)
        printStat('coordination')
        print(`Agility: `, 1)
        printStat('agility')
        print(`Strength: `, 1)
        printStat('strength')
        print(`Max HP: `, 1)
        printStat('max_hp')
        print(`Max SP: `, 1)
        printStat('max_sp')
        print(`Max BP: `, 1)
        printStat('max_mp')
        print(`Healing: `, 1)
        printStat('healing')
        print(`HP recovery: `, 1)
        printStat('hp_recharge')
        print(`SP recovery: `, 1)
        printStat('sp_recharge')
        print(`BP recovery: `, 1)
        printStat('mp_recharge')
        print(`OffHand: `, 1)
        printStat('offhand')
        print(`Magic Level: `, 1)
        printStat('magic_level')
        for (let ability in this.abilities) {
            print(`--${caps(ability)} skill: ${abilityLevels[Math.floor(this.abilities[ability])]}`)
        }
    }

    checkXP() {
        color(black)
        print(`EXP: ${this.experience}`)
    }

    async talkTo(characterName: string) {
        const character = this.location?.character(characterName);
        color(black)
        if (!character) {
            print("They're not here.")
        }
        else {
            await character.talk(this);
        }
    }

    async die(cause: any) {
        this.hp = Math.min(this.hp, 0);
        color(brightred, gray)
        if (cause instanceof Character) {
            print(`You go limply unconscious as ${cause.name} stands triumphantly over you.`)
        } else {
            print(`You have died from ${cause}.`)
        }
    }

    async slay(character: Character | Character[]) {
        if (character instanceof Character) {
            character = [character];
        }
        let exp_gained = 0;
        let gold_gained = 0;
        print()
        color(yellow)
        print(`You defeat `, 1)
        printCharacters({
            characters: character,
            basecolor: yellow,
            charcolor: yellow
        });
        print('!')
        color(black)
        for (let char of character) {
            await super.slay(char);
            exp_gained += char.exp_value;
            if (char.has('gold')) {
                gold_gained += char.itemCount('gold');
            }
            for (let item of char.items) {
                if (item.name !== 'gold') print(`${char.name} drops ${item.display}`)
            }
        }
        // sum up gold and exp all together
        color(green)
        if (gold_gained) print(`you gain ${gold_gained} gold.`)
        this.getItem('gold', this.location || undefined, gold_gained);
        color(green)
        print(`you gain ${exp_gained} exp.`)
        this.experience += exp_gained;

        // who else wants some??
        const enemies_remaining = this.location?.characters.filter(char => char !== this && char.attackTarget === this);
        if (enemies_remaining?.length) {
            // group them by name and list them
            printCharacters({ characters: enemies_remaining, capitalize: true });
            print(` ${enemies_remaining.length > 1 ? 'continue' : 'continues'} the attack!`)
            this.fight(enemies_remaining[0]);
        } else { this.fight(null) }
    }

    async turn() {
        if (this.flags.assistant)
            assistant(this);

        await this.getInput();
        this.enemies = [];
        if (this.fighting) {
            this.useWeapon('right hand');
            await this.attack(
                this.attackTarget,
                this.equipment['right hand'],
                this.weaponDamage('right hand')
            );
            this.sp -= 1;
            if (this.sp < 0) {
                this.hp -= 1;
                this.sp = 0;
            }
        }

    }

    buff_additive(key: BaseStats): number {
        // add items bonuses
        let buff = super.buff_additive(key);
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment).filter(k => this.activeEquipment[k as EquipmentSlot]) as EquipmentSlot[]) {
            buff += this.equipment?.[slot]?.buff?.plus?.[key] ?? 0;
        }
        return buff;
    }

    buff_multiplier(key: BaseStats): number {
        // add items bonuses
        let buff = super.buff_multiplier(key);
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment).filter(k => this.activeEquipment[k as EquipmentSlot]) as EquipmentSlot[]) {
            buff += (this.equipment?.[slot]?.buff?.times?.[key] ?? 1) - 1;
        }
        if (this.activeEquipment['left hand'] && key !== 'offhand') { buff *= this.offhand; }
        if (this.activeEquipment['bow'] && key == 'coordination') { buff = (buff + this.archery) / 3; }
        return buff;
    }

    buff_damage_additive(type: DamageTypes): number {
        // add items bonuses
        let buff = 0;
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment).filter(k => this.activeEquipment[k as EquipmentSlot]) as EquipmentSlot[]) {
            buff += this.equipment?.[slot]?.buff?.plus?.damage?.[type] ?? 0;
        }
        return buff + super.buff_damage_additive(type);
    }

    buff_damage_multiplier(type: DamageTypes): number {
        // add items bonuses
        let buff = 0;
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment).filter(k => this.activeEquipment[k as EquipmentSlot]) as EquipmentSlot[]) {
            buff += this.equipment?.[slot]?.buff?.times?.damage?.[type] ?? 0;
        }
        // archery bonus
        if (this.activeEquipment['bow']) { buff *= Math.log10(this.archery); }
        return buff * super.buff_damage_multiplier(type);
    }

    buff_defense_additive(type: DamageTypes): number {
        // add items bonuses
        let buff = 0;
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment) as (keyof this['equipment'])[]) {
            buff += this.equipment?.[slot]?.buff?.plus?.defense?.[type] ?? 0;
        }
        return buff + super.buff_defense_additive(type);
    }

    buff_defense_multiplier(type: DamageTypes): number {
        // add items bonuses
        let buff = 1;
        if (!this.equipment) return buff;
        for (let slot of Object.keys(this.equipment) as (keyof this['equipment'])[]) {
            buff += (this.equipment?.[slot]?.buff?.times?.defense?.[type] ?? 1) - 1;
        }
        return buff * super.buff_defense_multiplier(type);
    }

    weaponDamage(weapon: 'right hand' | 'left hand' | 'bow') {
        this.useWeapon(weapon);
        const dam: { [key in DamageTypes]: number } = {
            'blunt': this.strength * this.buff_damage_multiplier('blunt') + this.buff_damage_additive('blunt'),
            'sharp': this.strength * this.buff_damage_multiplier('sharp') + this.buff_damage_additive('sharp'),
            'magic': (this.strength + this.magic_level) * this.buff_damage_multiplier('magic') + this.buff_damage_additive('magic'),
            'poison': this.buff_damage_additive('poison'),
            'fire': this.buff_damage_additive('fire'),
            'cold': this.buff_damage_additive('cold'),
            'electric': this.buff_damage_additive('electric'),
            'sonic': this.buff_damage_additive('sonic'),
        }
        console.log(`weapon damage: ${JSON.stringify(dam)}`)
        return dam;
    }

    async cheat(command: string) {
        if (!this.cheatMode) {
            print("what?")
            return;
        } else {
            const code = command.includes(' ') ? command.split(' ')[0] : command;
            const value = command.includes(' ') ? command.split(' ').slice(1).join(' ') : command;
            switch (code) {
                case ('hp'):
                    this.recoverStats({ hp: parseInt(value) || 0 });
                    await this.checkHP();
                    break;
                case ('sp'):
                    this.recoverStats({ sp: parseInt(value) || 0 });
                    await this.checkHP();
                    break;
                case ('mp'):
                    this.recoverStats({ mp: parseInt(value) || 0 });
                    await this.checkHP();
                    break;
                case ('max_hp'):
                    this.base_stats.max_hp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_sp'):
                    this.base_stats.max_sp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_mp'):
                    this.base_stats.max_mp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('strength'):
                    this.base_stats.strength += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('agility'):
                    this.base_stats.agility += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('coordination'):
                    this.base_stats.coordination += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('healing'):
                    this.base_stats.healing += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('magic_level'):
                    this.base_stats.magic_level += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('xp'):
                    this.experience += parseInt(value) || 0;
                    this.checkXP();
                    break;
                case ('gold'):
                    this.game.addItem({ name: 'gold', quantity: parseInt(value) || 0, container: this.inventory });
                    color(yellow)
                    print(`ka-ching! +${value} = ${this.itemCount('gold')}`)
                    break;
                case ('item'):
                    if (isValidItemKey(value)) {
                        this.game.addItem({ name: value, quantity: 1, container: this.inventory });
                        print(`${value} created ;)`)
                    }
                    break;
                case ('delete'):
                    this.removeItem(this.item(value), 1);
                    print(`deleted ${value}`)
                    break;
                case ('regen'):
                    this.game.loadScenario(scenario)
                    this.relocate(this.game.find_location(this.location?.key || '') || null);
                    print('map regenerated.')
                    break;
                case ('enable'):
                    this.enableCommands();
                    print('commands enabled.')
                    break;
                case ('landmark'):
                    this.game.addLandmark(value, this.location!);
                    print(`landmark ${value} added.`)
                    break;
                case ('flag'):
                case ('flags'):
                    switch (value) {
                        case ('cradel'):
                            this.game.flags.cradel = !this.game.flags.cradel;
                            break;
                        case ('cleric'):
                            this.game.flags.cleric = !this.game.flags.cleric;
                            break;
                        case ('ierdale'):
                            this.flags.enemy_of_ierdale = !this.flags.enemy_of_ierdale;
                            break;
                        case ('pass'):
                            this.flags.forest_pass = !this.flags.forest_pass;
                            break;
                        default:
                            print('flag not recognized.')
                            return;
                    }
                    print(`flag ${value} set.`)
                    break;
                case ('assistant'):
                    this.assistantHintsUsed = {};
                    print('assistant hints reset.')
                    break;
                case ('void'):
                    // delete any previous void
                    const voidLocations = this.game.find_all_locations('the void')
                    for (const location of voidLocations) {
                        this.game.removeLocation(location)
                    }
                    this.game.enter_the_void();
                    break;
            }
        }
    }

    save() {
        return {
            key: 'player',
            isPlayer: true,
            name: this.name,
            class_name: this.class_name,
            max_hp: this.base_stats.max_hp,
            hp: this.hp,
            hp_recharge: this.base_stats.hp_recharge,
            max_sp: this.base_stats.max_sp,
            sp: this.sp,
            sp_recharge: this.base_stats.sp_recharge,
            max_mp: this.base_stats.max_mp,
            mp: this.mp,
            mp_recharge: this.base_stats.mp_recharge,
            strength: this.base_stats.strength,
            speed: this.base_stats.speed,
            agility: this.base_stats.agility,
            coordination: this.base_stats.coordination,
            healing: this.base_stats.healing,
            magic_level: this.base_stats.magic_level,
            archery: this.base_stats.archery,
            hunger: this.hunger,
            offhand: this.offhand,
            abilities: this.abilities,
            max_pets: this.max_pets,
            experience: this.experience,
            cheatMode: this.cheatMode,
            items: this.items.map(item => item.save()),
            backDirection: this.backDirection,
            disabledCommands: this.disabledCommands,
            equipment: Object.fromEntries(
                Object.entries(this.equipment).map(([key, item]) => [key, item?.save() ?? null])
            ),
            buffs: Object.fromEntries(
                Object.entries(this.buffs).map(([key, buff]) => [key, buff.save()])
            ),
            flags: this.flags,
            assistantHintsUsed: this.assistantHintsUsed
        }
    }

    load(character: any) {
        Object.assign(this.base_stats, {
            max_hp: character._max_hp || character.max_hp,
            hp_recharge: character._hp_recharge || character.hp_recharge,
            max_sp: character._max_sp || character.max_sp,
            sp_recharge: character._sp_recharge || character.sp_recharge,
            max_mp: character._max_mp || character.max_mp,
            mp_recharge: character._mp_recharge || character.mp_recharge,
            strength: character._strength || character.strength,
            speed: character._speed || character.speed,
            agility: character._agility || character.agility,
            coordination: character._coordination || character.coordination,
            healing: character._healing || character.healing,
            magic_level: character._magic_level || character.magic_level,
            archery: character._archery || character.archery,
            offhand: character.offhand
        })
        Object.assign(this, {
            name: character.name,
            class_name: character.class_name,
            hunger: character.hunger,
            abilities: character.abilities,
            max_pets: character.max_pets,
            experience: character.experience,
            cheatMode: character.cheatMode,
            backDirection: character.backDirection,
            disabledCommands: character.disabledCommands,
            flags: character.flags,
            assistantHintsUsed: character.assistantHintsUsed,
            hp: character._hp || character.hp,
            sp: character._sp || character.sp,
            mp: character._mp || character.mp,
        })
        // load items properly
        this.clearInventory()
        character.items.forEach((itemData: any) => {
            if (isValidItemKey(itemData.key)) this.game.addItem({ name: itemData.key, quantity: itemData.quantity, container: this.inventory })
        })
        if (character.equipment) {
            Object.keys(character.equipment).forEach((slot) => {
                const itemData = character.equipment[slot as keyof Player['equipment']]
                if (itemData && isValidItemKey(itemData.key)) {
                    this.equipment[slot as keyof Player['equipment']] = this.game.addItem({ name: itemData.key })!
                }
            })
        }
        if (character.buffs) {
            Object.values(character.buffs).forEach((buff: any) => {
                this.addBuff(getBuff(buff.name)?.(buff))
            })
        }
        return this;
    }

    async loadGame() {
        color(black)
        let success = false;
        while (!success) {
            let saveName = ''
            while (!saveName) {
                saveName = await input('Enter the name of your character to load: ');
            }
            print("Loading now...")
            success = await this.game.load(saveName);
        }
    }

    async saveGame() {
        color(black)
        await this.game.save(this.name);
        print('Game saved.')
    }
}

export { Player }
