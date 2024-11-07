import { Location } from "../../game/location.js"
import { Item } from "../../game/item.js"
import { Character, BonusKeys } from "../../game/character.js"
import { A2dCharacter } from "./characters.js"
import { getItem, isValidItemKey, ItemKey } from "./items.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "./colors.js"
import { GameState } from "../../game/game.js";
import { caps, plural, randomChoice } from "../../game/utils.js";
import { spells, abilityLevels } from "./spells.js";
import { getBuff } from "./buffs.js"
import { getLandmark } from "./landmarks.js"
import { GameMap } from "./map.js"

class Player extends A2dCharacter {
    class_name: string = '';
    max_pets: number = 0;
    offhand: number = 0;
    healed: boolean = false;
    isPlayer: boolean = true;
    cheatMode: boolean = false;
    pronouns = { subject: 'you', object: 'you', possessive: 'your' };
    disabledCommands: { [key: string]: string } = {};
    equipment: {
        'right hand': Item | null,
        'left hand': Item | null,
        'bow': Item | null,
        'armor': Item | null,
        'ring': Item | null,
    } = {
            'right hand': getItem('fist', { name: 'fist' }),
            'left hand': getItem('fist', { name: 'fist' }),
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
        hungry: boolean
    } = {
        assistant: false,
        enemy_of_ierdale: false,
        murders: 0,
        forest_pass: false,
        orc_pass: false,
        earplugs: false,
        hungry: false
    } as const
    assistantHintsUsed: string[] = []

    constructor(characterName: string, className: string, game: GameState) {
        super({ name: characterName, game: game });
        this.giveItem(getItem("banana"))
        this.giveItem(getItem("side_of_meat"))
        this.giveItem(getItem("club"))
        this.class_name = className.toLowerCase();
        switch (this.class_name) {
            case ('thief'):
                this.max_hp = 35
                this.max_sp = 50
                this.max_mp = 25
                this.hp_recharge = 1 / 15
                this.sp_recharge = 1 / 5
                this.mp_recharge = 1 / 25
                this.strength = 9
                this.agility = 4
                this.coordination = 4
                this.offhand = 0.8
                this.healing = 4
                this.magic_level = 3
                this.abilities = {}
                this.archery = 24
                this.max_pets = 4
                this.giveItem(getItem("short_bow"))
                this.giveItem(getItem('arrows', 25))
                this.giveItem(getItem('gold', 155))
                break;

            case ('fighter'):
                this.max_hp = 50
                this.max_sp = 45
                this.max_mp = 10
                this.hp_recharge = 1 / 8
                this.sp_recharge = 1 / 3
                this.mp_recharge = 1 / 34
                this.strength = 10
                this.agility = 2
                this.coordination = 4
                this.offhand = 0.6
                this.healing = 3
                this.magic_level = 2
                this.abilities = {}
                this.archery = 10
                this.max_pets = 3
                this.abilities = {
                    bloodlust: 2,
                }
                this.giveItem(getItem('shortsword'))
                this.giveItem(getItem('gold', 30))
                break;

            case ('spellcaster'):
                this.max_hp = 30
                this.max_sp = 30
                this.max_mp = 70
                this.hp_recharge = 1 / 20
                this.sp_recharge = 1 / 7
                this.mp_recharge = 1 / 7
                this.strength = 6
                this.agility = 2
                this.coordination = 2
                this.offhand = 0.4
                this.healing = 4
                this.magic_level = 7
                this.abilities = {
                    'bolt': 2,
                    'newbie': 4,
                }
                this.archery = 6
                this.max_pets = 4
                this.giveItem(getItem("flask_of_wine", 2))
                this.giveItem(getItem('gold', 50))
                break;

            case ('cleric'):
                this.max_hp = 35
                this.max_sp = 35
                this.max_mp = 40
                this.hp_recharge = 0.10
                this.sp_recharge = 0.20
                this.mp_recharge = 0.10
                this.strength = 8
                this.agility = 3
                this.coordination = 3
                this.offhand = 0.65
                this.healing = 5
                this.magic_level = 4
                this.abilities = {
                    'newbie': 3,
                }
                this.archery = 22
                this.max_pets = 5
                this.giveItem(getItem('gold', 0))
                this.giveItem(getItem("healing_potion"))
                break;
        }

        this.addAction('save', this.saveGame);
        this.addAction('load', this.loadGame);
        this.addAction('', async () => { });
        this.addAction('n', async () => this.go('north'));
        this.addAction('s', async () => this.go('south'));
        this.addAction('e', async () => this.go('east'));
        this.addAction('w', async () => this.go('west'));
        this.addAction('ne', async () => this.go('northeast'));
        this.addAction('se', async () => this.go('southeast'));
        this.addAction('sw', async () => this.go('southwest'));
        this.addAction('nw', async () => this.go('northwest'));
        this.addAction('down', async () => this.go('down'));
        this.addAction('up', async () => this.go('up'));
        this.addAction('go', this.go);
        this.addAction('flee', async () => { if (this.backDirection) await this.go(this.backDirection); else { color(black); print('you are cornered!') } });
        this.addAction('i', async () => this.listInventory());
        this.addAction('look', this.look);
        this.addAction('read', this.read);
        this.addAction('eat', this.eat);
        this.addAction('drink', this.drink);
        this.addAction('use', this.use);
        this.addAction('wield', async (weapon: string) => this.equip(weapon, 'right hand'));
        this.addAction('wield2', async (weapon: string) => this.equip(weapon, 'left hand'));
        this.addAction('wear', async (item: string) => this.equip(item, this.item(item)?.equipment_slot as keyof Player['equipment']));
        this.addAction('ready', async (weapon: string) => this.equip(weapon, 'bow'));
        this.addAction('drop', this.drop);
        this.addAction('get', this.get);
        this.addAction('hp', async () => { this.checkHP(); this.checkHunger(); this.checkXP() });
        this.addAction('stats', this.checkStats);
        this.addAction('equipment', this.checkEquipment);
        this.addAction('heal', this.heal);
        this.addAction('talk', this.talkTo);
        this.addAction('attack', async (name: string) => this.target(this.location?.character?.(name)));
        this.addAction('\\', async (name: string) => this.attack(this.location?.character?.(name) || this.attackTarget, this.equipment['left hand']));
        this.addAction('cast', this.spell);
        this.addAction('cheatmode xfish9', async () => { this.cheatMode = true; color(magenta); print('Cheat mode activated.') });
        this.addAction('cheat', this.cheat);

        console.log('loaded player actions.')

        // start with full health
        this.recoverStats({ hp: 100, sp: 100, mp: 100 });
        this.autoheal();
        this.onTurn(async () => { this.onSlay(this.checkHP) });
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
        return (this.hunger > this._max_sp / 4)
            ? ((this.hunger * 4 - this._max_sp) / 3 / this._max_sp)
            : 0
    }

    get max_sp() {
        return Math.max(this._max_sp * (1 - this.hungerPenalty), 1)
    }

    set max_sp(value) {
        // if we don't account for it in this way, and they train stamina while hungry, they will lose max sp permanently
        this._max_sp = Math.round(this._max_sp + value - this.max_sp)
    }

    get max_carry() {
        return this.strength * 2
    }

    autoheal() {
        console.log('autohealing')
        const prevstats = { hp: this.hp, sp: this.sp, mp: this.mp }
        this.recoverStats({ hp: this.hp_recharge * this.max_hp, sp: this.sp_recharge * this.max_sp, mp: this.mp_recharge * this.max_mp });
        const diff = - prevstats.hp + this.hp - prevstats.sp + this.sp - prevstats.mp + this.mp
        console.log(`healed ${diff} points`)
        this.hunger += diff / 10
        color(magenta)
        if (this.hungerPenalty >= 1) {
            this.hurt(this.hunger - this._max_sp, null, 'hunger')
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

    async encounter(character: Character) {
        await super.encounter(character);
        console.log(`player encountered "${character.name}", "${character.description}"`)
    }

    async relocate(location: Location | null) {
        await super.relocate(location);
        if (location && this.flags.assistant) {
            color(magenta)
            switch (location.key) {
                case 0:
                    if (!this.game.flags.cleric)
                        print("   --ASSISTANT:--  Go east to learn about the plot.")
                    break;
                case 1:
            }
        }
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
        color(black)
        if (this.sp <= 0) {
            print("You are too weak!");
            return false;
        }
        if (await super.go(direction)) {
            this.recoverStats({ sp: -0.5 });
            return true;
        }
        else {
            print('You can\'t go that way.')
            return false
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
        const listItems = this.items.sort((a, b) => (a.name < b.name ? -1 : 1)).filter(item => !(['gold', 'arrows'].includes(item.name)))
        listItems.forEach((item, i) => {
            if (i % 2 == 0) {
                print('    ' + item.display, 1)
            } else {
                locate(40)
                print(item.display)
            }
        })
        if (listItems.length % 2 == 1) print()
        color(gray)
        print(`Total Object Weight: ${this.inventoryWeight}/${this.max_carry}`)
        color(green, white)
        print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        color(black, darkwhite)
        print()
        color(black)
        print("Wielded:         ", 1)
        color(gray)
        print(this.equipment['right hand']?.name ?? 'fist')
        color(black)
        print("Left Wielded:    ", 1)
        color(gray)
        print(this.equipment['left hand']?.name ?? 'fist')
        if (this.equipment['bow']) {
            color(blue)
            print("Bow:             " + this.equipment['bow'].name)
        }
        color(black)
        print("Armor:           ", 1)
        color(gray)
        print((this.equipment['armor'] ? this.equipment['armor'].name : 'none'))
        if (this.equipment['ring']) {
            color(blue)
            print("Ring:            " + this.equipment['ring'].name)
        }
        if (this.item('arrows')?.quantity) {
            color(orange)
            print("Arrows:          " + this.item('arrows')?.quantity)
        }
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

    equip(item: string | Item | undefined, slot: keyof Player['equipment']) {
        color(black)
        if (item == 'fist') {
            item = getItem('fist', { name: 'fist' })
        } else if (typeof item === 'string') {
            item = this.item(item);
        }
        if (!item) {
            print("You don't have that.")
            return;
        } else if (slot == 'right hand' || slot == 'left hand' || slot == 'bow') {
            if (item.weapon_stats) {
                if (item.weapon_stats.strength_required ?? 0 > this.strength) {
                    print(`You are not strong enough to wield that(${this.strength}/${item.weapon_stats.strength_required}).`)
                    return;
                }
                if (slot === 'bow') {
                    if (item.weapon_stats.type === 'bow') {
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
                    if (item.weapon_stats.type === 'bow') {
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
            this.giveItem(this.equipment[slot]);
            this.equipment[slot].unequip(this);
        }
        this.removeItem(item, 1)
        this.equipment[slot] = item
        if (item.equip) {
            item.equip(this);
        }
    }

    async checkEquipment() {
        color(black)
        print("  Wielded: ", 1)
        color(blue)
        print(this.equipment['right hand']?.name ?? 'fist', 1)
        locate(40)
        color(black)
        print('Left Wielded: ', 1)
        color(blue)
        print(this.equipment['left hand']?.name ?? 'fist')
        color(black)
        print()
        if (this.equipment['right hand']?.description || this.equipment['left hand']?.description) {
            print(this.equipment['right hand']?.description ?? '', 1)
            locate(40)
            print(this.equipment['left hand']?.description ?? '')
            print()
        }
        print(`  blunt damage: ${this.equipment['right hand']?.weapon_stats?.blunt_damage || 0}`, 1)
        locate(40)
        print(`blunt damage: ${this.equipment['left hand']?.weapon_stats?.blunt_damage || 0}`)
        print(`  sharp damage: ${this.equipment['right hand']?.weapon_stats?.sharp_damage || 0}`, 1)
        locate(40)
        print(`sharp damage: ${this.equipment['left hand']?.weapon_stats?.sharp_damage || 0}`)
        print(`  magic damage: ${this.equipment['right hand']?.weapon_stats?.magic_damage || 0}`, 1)
        locate(40)
        print(`magic damage: ${this.equipment['left hand']?.weapon_stats?.magic_damage || 0}`)
        print()
        print("  Armor: ", 1)
        color(blue)
        print(this.equipment['armor']?.name ?? 'none', 1)
        if (this.equipment['ring']) {
            locate(40)
            color(black)
            print("Ring: ", 1)
            color(blue)
            print(this.equipment['ring']?.name)
        } else print()
        color(black)
        print()

        const equipment_stats = []
        let i = 0;
        const ringBonus = Object.keys(this.equipment['ring']?.buffs || {}) as BonusKeys[]
        for (let i = 0; i < Math.max(ringBonus.length, 3); i++) {
            color(black)
            if (!this.equipment['armor'] && !ringBonus[i]) break;
            if (this.equipment['armor']) {
                const armorType = ['blunt', 'sharp', 'magic'][i]
                const armorKey = `${armorType}_armor` as BonusKeys
                if (i < 3) {
                    const extraBuff = this.buff(armorKey) - this.equipment['armor'].buff(armorKey)
                    print(`  ${caps(armorType)} Damage AC: `, 1)
                    if (extraBuff) color(blue)
                    print(`${this.buff(armorKey)}`, 1)
                    if (extraBuff) print(` (+${extraBuff})`, 1)
                    color(black)
                } else print('', 1)
            }
            if (ringBonus[i]) {
                locate(40)
                color(blue)
                print(`+${this.statValue(ringBonus[i], this.equipment['ring']?.buff(ringBonus[i]) || 0)} `, 1)
                color(black)
                print(`${this.statName(ringBonus[i])}`)
            } else print()
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
        if (this.buff('max_hp') > 0) color(blue); else color(black);
        print(`${Math.ceil(this.max_hp)}`, 1);
        color(black);
        print("  SP: ", 1);
        if (this.hungerPenalty * this.max_sp > 1) color(brightred);
        print(`${Math.ceil(this.sp)}/`, 1);
        if (this.buff('max_sp') > 0) color(blue); else if (this.buff('max_sp') < 0) color(brightred);
        print(`${Math.ceil(this.max_sp)}`, 1);
        color(black);
        print(`  BP: ${Math.ceil(this.mp)}/`, 1)
        if (this.buff('max_mp') > 0) color(blue); else color(black);
        print(`${Math.ceil(this.max_mp)} ]`)
        color(black)
    }

    set hunger(value: number) {
        // allow hunger to go somewhat negative
        this._hunger = Math.max(value, -this.max_sp / 4);
    }

    get hunger() {
        return this._hunger
    }

    checkHunger() {
        print(`[ Hunger: `, 1)
        const barLength = 26;
        const barColor = red; // this.hunger / this.max_sp > 1 / 4 ? (this.hunger > this.max_sp / 2 ? brightred : red) : green
        for (let i = 0; i < barLength; i++) {
            if (this.hunger / this.max_sp * barLength > i) color(darkwhite, barColor)
            else color(darkwhite, black)
            print('▂', 1)
        }
        color(black, darkwhite)
        print(' ]')
        // print(this.hunger.toString())
    }

    statName(key: BonusKeys) {
        switch (key) {
            case ('max_hp'): return 'Max HP';
            case ('max_mp'): return 'Max MP';
            case ('max_sp'): return 'Max SP';
            case ('strength'): return 'Strength';
            case ('coordination'): return 'Coordination';
            case ('agility'): return 'Agility';
            case ('magic_level'): return 'Magic Level';
            case ('healing'): return 'Healing';
            case ('blunt_damage'): return 'Blunt Damage';
            case ('sharp_damage'): return 'Sharp Damage';
            case ('magic_damage'): return 'Magic Damage';
            case ('blunt_armor'): return 'Blunt Armor';
            case ('sharp_armor'): return 'Sharp Armor';
            case ('magic_armor'): return 'Magic Armor';
            case ('archery'): return 'Archery';
            case ('hp_recharge'): return 'HP Recharge';
            case ('mp_recharge'): return 'MP Recharge';
            case ('sp_recharge'): return 'SP Recharge';
            default: return key;
        }
    }
    statValue(key: BonusKeys, value: number) {
        switch (key) {
            case ('hp_recharge'): return `${Math.round(value * 100)}%`;
            case ('mp_recharge'): return `${Math.round(value * 100)}%`;
            case ('sp_recharge'): return `${Math.round(value * 100)}%`;
            default: return `${Math.round(value)}`;
        }
    }

    async checkStats() {
        const printStat = (buffName: BonusKeys) => {
            if (this.buff(buffName) > 0) {
                color(blue)
            } else if (this.buff(buffName) < 0) {
                color(brightred)
            } else { color(black) }
            print(this.statValue(buffName, (this[buffName] as number)), 1)
            if (this.buff(buffName) > 0) print(`(+${this.statValue(buffName, this.buff(buffName))})`)
            else if (this.buff(buffName) < 0) print(`(${this.statValue(buffName, this.buff(buffName))})`)
            else print('')
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
        print(`OffHand: ${Math.floor(this.offhand * 100)}%`)
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
            character.talk(this);
        }
    }

    async die(cause: any) {
        this.hp = Math.min(this.hp, 0);
        color(brightred, gray)
        if (cause instanceof Character) {
            print(`You go limply unconscious as ${cause.name} stands triumphantly over you.                      `)
            if (this.flags.assistant) print("   -ASSISTANT-  Next time be careful when you choose your fights, though")
            if (this.flags.assistant) print("   -ASSISTANT-  sometimes its good to be darring and explore new areas where")
            if (this.flags.assistant) print("   -ASSISTANT-  creatures may not be so friendly")
        } else {
            print(`You have died from ${cause}.`)
        }
    }

    async slay(character: Character) {
        await super.slay(character);
        print()
        color(yellow)
        print(`You defeat ${character.name}!`)
        color(green)
        this.experience += character.exp_value;
        print(` you gain ${character.exp_value} exp.`)
        if (character.has('gold')) {
            print(` you gain ${character.itemCount('gold')} gold.`)
            this.getItem('gold', this.location || undefined, character.itemCount('gold'));
        }
        color(black)
        for (let item of character.items) {
            if (item.name !== 'gold') print(`${character.name} drops ${item.display}`)
        }
        this.fight(null);
        // see who's left
        const enemies_remaining = this.location?.characters.filter(char => char !== this && char.attackTarget === this);
        if (enemies_remaining?.length) {
            // group them by name and list them
            const enemy_numbers = enemies_remaining?.reduce((acc, char) => {
                if (acc[char.name]) acc[char.name]++;
                else acc[char.name] = 1;
                return acc;
            }, {} as { [key: string]: number });
            const enemy_names = Object.keys(enemy_numbers);
            const enemy_list = enemy_names.map(name => enemy_numbers[name] > 1 ? plural(name) : name)
            color(black)
            for (let i = 0; i < enemy_list.length; i++) {
                if (enemy_numbers[enemy_names[i]] > 1) print(`${enemy_numbers[enemy_names[i]]} `, 1)
                color(red)
                print(i == 0 ? caps(enemy_list[i]) : enemy_list[i], 1)
                color(black)
                if (i < enemy_list.length - 2) print(', ', 1)
                else if (i < enemy_list.length - 1) print(' and ', 1)
            }
            print(` ${enemies_remaining.length > 1 ? 'continue' : 'continues'} the attack!`)
        }

        for (let enemy in this.enemies) {
            if (this.enemies[enemy] === character) {
                delete this.enemies[enemy];
            } else if (this.enemies[enemy].location === this.location) {
                this.fight(this.enemies[enemy]);
            }
        }
    }

    async turn() {
        this.enemies = this.enemies.filter(enemy => enemy);
        if (this.fighting) {
            await this.attack(this.attackTarget, this.equipment['right hand']);
            this.sp -= 1;
            if (this.sp < 0) {
                this.hp -= 1;
                this.sp = 0;
            }
        }
    }

    buff(key: BonusKeys): number {
        const buff = Object.values(this.equipment || {}).reduce(
            (total, item) => {
                return (item?.buff(key) || 0) + total
            },
            super.buff(key)
        );
        return buff;
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
                    this._max_hp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_sp'):
                    this._max_sp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_mp'):
                    this._max_mp += parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('strength'):
                    this.strength += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('agility'):
                    this.agility += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('coordination'):
                    this.coordination += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('healing'):
                    this.healing += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('magic_level'):
                    this.magic_level += parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('xp'):
                    this.experience += parseInt(value) || 0;
                    this.checkXP();
                    break;
                case ('gold'):
                    this.giveItem(getItem('gold', parseInt(value) || 0));
                    color(yellow)
                    print(`ka-ching! +${value} = ${this.itemCount('gold')}`)
                    break;
                case ('item'):
                    if (isValidItemKey(value)) {
                        this.giveItem(getItem(value));
                        print(`${value} created ;)`)
                    }
                    break;
                case ('delete'):
                    this.removeItem(this.item(value), 1);
                    print(`deleted ${value}`)
                    break;
                case ('regen'):
                    this.game.loadScenario(new GameMap(this.game).locations)
                    this.relocate(this.game.locations.get(this.location?.key || '') || null);
                    print('map regenerated.')
                    break;
                case ('enable'):
                    this.enableCommands();
                    print('commands enabled.')
                    break;
                case ('landmark'):
                    this.location?.addLandmark(getLandmark(value));
                    print(`landmark ${value} added.`)
                    break;
                case ('flag'):
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
                    }
                    print(`flag ${value} set.`)
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
            _max_hp: this._max_hp,
            _hp: this._hp,
            _hp_recharge: this._hp_recharge,
            _max_sp: this._max_sp,
            _sp: this._sp,
            _sp_recharge: this._sp_recharge,
            _max_mp: this._max_mp,
            _mp: this._mp,
            _mp_recharge: this._mp_recharge,
            _strength: this._strength,
            _agility: this._agility,
            _coordination: this._coordination,
            _healing: this._healing,
            _magic_level: this._magic_level,
            _archery: this._archery,
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
                Object.entries(this._buffs).map(([key, buff]) => [key, buff.save()])
            ),
            flags: this.flags
        }
    }

    load(character: any) {
        Object.assign(this, character)
        // load items properly
        this.clearInventory()
        const items: Item[] = []
        character.items.forEach((itemData: any) => {
            if (isValidItemKey(itemData.key)) items.push(getItem(itemData.key, itemData))
        })
        this.items = items
        if (character.equipment) {
            Object.keys(character.equipment).forEach((slot) => {
                const itemData = character.equipment[slot as keyof Player['equipment']]
                if (itemData && isValidItemKey(itemData.key)) {
                    this.equipment[slot as keyof Player['equipment']] = getItem(itemData.key, itemData as any)
                }
            })
        }
        if (character.buffs) {
            Object.values(character.buffs).forEach((buff: any) => {
                this.addBuff(getBuff(buff.name)(buff))
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
