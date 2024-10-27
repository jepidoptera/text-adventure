import { Location } from '../../game/location.ts'
import { Item } from '../../game/item.ts'
import { Character, BonusKeys } from '../../game/character.ts'
import { A2dCharacter } from './characters.ts'
import { getItem, isValidItemKey, ItemKey } from './items.ts'
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'
import { GameState } from '../../game/game.ts';
import { caps, plural, randomChoice } from '../../game/utils.ts';
import { spells, abilityLevels } from './spells.ts';
import { getBuff } from './buffs.ts'
import { getLandmark } from './landmarks.ts'
import { GameMap } from './map.ts'

class Player extends A2dCharacter {
    class_name: string = '';
    max_pets: number = 0;
    offhand: number = 0;
    healed: boolean = false;
    poison: number = 0;
    isPlayer: boolean = true;
    cheatMode: boolean = false;
    pronouns = { subject: 'you', object: 'you', possessive: 'your' };
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
        earplugs: boolean
    } = {
            assistant: false,
            enemy_of_ierdale: false,
            murders: 0,
            forest_pass: false,
            orc_pass: false,
            earplugs: false
        }
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
        this.addAction('i', async () => this.listInventory());
        this.addAction('go', this.go);
        this.addAction('look', this.look);
        this.addAction('read', this.read);
        this.addAction('eat', this.eat);
        this.addAction('drink', this.drink);
        this.addAction('wield', async (weapon: string) => this.equip(weapon, 'right hand'));
        this.addAction('wield2', async (weapon: string) => this.equip(weapon, 'left hand'));
        this.addAction('ready', async (weapon: string) => this.equip(weapon, 'bow'));
        this.addAction('drop', this.drop);
        this.addAction('get', this.get);
        this.addAction('hp', async () => { this.checkHP(); this.checkXP() });
        this.addAction('stats', this.checkStats);
        this.addAction('equipment', this.checkEquipment);
        this.addAction('heal', this.heal);
        this.addAction('talk', this.talk);
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
            this.checkHP();
            this.onSlay(async () => { });
            color(black)
            print(")===|[>>>>>>>>>>>>>>>>>>")
            command = await input()
        } else {
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
        // first see if the entire command can be executed
        if (this.location?.actions.has(command)) {
            await this.location?.actions.get(command)?.(this);
        } else if (this.actions.has(command)) {
            await this.useAction(command);
        } else {
            for (let character of this.location?.characters ?? []) {
                if (character.actions.has(command)) {
                    await character.actions.get(command)?.(this);
                    return
                }
            }
            for (let item of this.items) {
                await item.getAction(command)?.(this);
            }

            // if not, try to parse the command
            const words = command.split(' ')
            const verb = words[0]
            const args = words.slice(1).join(' ')
            if (this.location?.actions.has(verb)) {
                await this.location?.actions.get(verb)?.(this, args);
            } else if (this.actions.has(verb)) {
                await this.actions.get(verb)?.(args);
            } else {
                // see if any characters in the room can handle the command
                for (let character of this.location?.characters ?? []) {
                    if (character.actions.has(verb)) {
                        await character.actions.get(verb)?.(this, args);
                        return
                    }
                }
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
        return this._max_sp * (1 - this.hungerPenalty)
    }

    set max_sp(value) {
        this._max_sp = value
    }

    get max_carry() {
        return this.strength * 2
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

    autoheal() {
        console.log('autohealing')
        this.recoverStats({ hp: this.hp_recharge * this.max_hp, sp: this.sp_recharge * this.max_sp, mp: this.mp_recharge * this.max_mp });
        this.healed = true;
        setTimeout(() => {
            this.healed = false;
            console.log('time to heal again!')
        }, 25000);
    }

    async look(target?: string) {
        color(black)
        print()
        print(this.location?.name)
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
        const healed = Math.min(this.healing, this.max_hp - this.hp, this.sp - 3);
        if (this._sp < 3) {
            print("You are too weak!");
            return;
        }
        this.recoverStats({ hp: healed, sp: -healed });
        print("You pull yourself together and heal some!");
    }

    async go(direction: string) {
        color(black)
        if (await super.go(direction)) {
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
        color(gray)
        print("Armor:           " + (this.equipment['armor'] ? this.equipment['armor'].name : 'none'))
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
        }
        else {
            color(gray)
            print("You can't drink that.")
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
        } else if (slot === 'armor') {
        }
        if (this.equipment[slot] && this.equipment[slot].name != 'fist') {
            // put their previous weapon in their inventory
            this.giveItem(this.equipment[slot]);
        }
        this.removeItem(item, 1)
        this.equipment[slot] = item
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
        print(this.equipment['armor']?.name ?? 'none')
        color(black)
        print(this.equipment['armor']?.description ?? '')
        print(`  Blunt Damage AC: ${this.equipment['armor']?.buff('blunt_armor') || 0}`)
        print(`  Sharp Damage AC: ${this.equipment['armor']?.buff('sharp_armor') || 0}`)
        print(`  Magic Damage AC: ${this.equipment['armor']?.buff('magic_armor') || 0}`)
    }

    async spell(spellName: string) {
        color(black)
        if (this.abilities[spellName]) {
            await spells[spellName].call(this, this.attackTarget ?? this);
        } else {
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
        color(black)
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
        }
    }

    async checkHP() {
        color(black)
        print(` [HP:  ${Math.ceil(this.hp)}/${Math.ceil(this._max_hp)}`, 1)
        print("  SP: ", 1)
        if (this.hungerPenalty) color(brightred)
        print(`${Math.ceil(this.sp)}/${Math.ceil(this.max_sp)}`, 1)
        color(black)
        print(`  BP: ${Math.ceil(this.mp)}/${Math.ceil(this._max_mp)}]`)
    }

    async checkStats() {
        color(black)
        print(`Class: ${this.class_name}`)
        print(`Archery: `, 1)
        if (this.buff('archery')) color(brightblue)
        print(`${Math.floor(this.archery)}`)
        print(`Coordination: `, 1)
        if (this.buff('coordination')) color(brightblue)
        print(`${Math.floor(this.coordination)}`)
        print(`Agility: `, 1)
        if (this.buff('agility')) color(brightblue)
        print(`${Math.floor(this.agility)}`)
        print(`Strength: `, 1)
        if (this.buff('strength')) color(brightblue)
        print(`${Math.floor(this.strength)}`)
        print(`Max HP: `, 1)
        if (this.buff('hp')) color(brightblue)
        print(`${Math.floor(this.max_hp)}`)
        print(`Max SP: `, 1)
        if (this.buff('sp')) color(brightblue)
        print(`${Math.floor(this.max_sp)}`)
        print(`Max BP: `, 1)
        if (this.buff('mp')) color(brightblue)
        print(`${Math.floor(this.max_mp)}`)
        print(`Healing: `, 1)
        if (this.buff('healing')) color(brightblue)
        print(`${Math.floor(this.healing)}`)
        print(`HP recovery: `, 1)
        if (this.buff('hp_recharge')) color(brightblue)
        print(`${Math.round(this.hp_recharge * 100)}%`)
        print(`SP recovery: `, 1)
        if (this.buff('sp_recharge')) color(brightblue)
        print(`${Math.round(this.sp_recharge * 100)}%`)
        print(`BP recovery: `, 1)
        if (this.buff('mp_recharge')) color(brightblue)
        print(`${Math.round(this.mp_recharge * 100)}%`)
        print(`OffHand: ${Math.floor(this.offhand * 100)}%`)
        print(`Magic Level: `, 1)
        if (this.buff('magic_level')) color(brightblue)
        print(`${Math.floor(this.magic_level)}`)
        for (let ability in this.abilities) {
            print(`--${caps(ability)} skill: ${abilityLevels[Math.floor(this.abilities[ability])]}`)
        }
    }

    checkXP() {
        color(black)
        print(`EXP: ${this.experience}`)
    }

    async talk(characterName: string) {
        const character = this.location?.character(characterName);
        color(black)
        if (!character) {
            print("They're not here.")
        }
        else {
            if (character.actions.has('talk')) {
                console.log(character.getAction('talk'));
                await character.getAction('talk')?.(this);
            } else {
                print("They don't want to talk.")
            }
        }
    }

    async die(cause: any) {
        this.dead = true;
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
        if (this.attackTarget?.location === this.location) {
            // console.log(`${this.name} attacks ${this.attackTarget.name}!`)
            await this.attack(this.attackTarget, this.equipment['right hand']);
        }
    }

    buff(key: BonusKeys): number {
        const buff = Object.values(this.equipment || {}).reduce(
            (total, item) => {
                // console.log(`item: ${item?.name}, ${total}`)
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
            const code = command.split(' ')[0];
            const value = command.split(' ').slice(1).join(' ');
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
                    this.game.loadScenario(new GameMap().locations)
                    this.relocate(this.game.find_location(this.location?.name || 'start'))
                    print('map regenerated.')
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
            offHand: this.offhand,
            abilities: this.abilities,
            max_pets: this.max_pets,
            experience: this.experience,
            cheatMode: this.cheatMode,
            items: this.items.map(item => item.save()),
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