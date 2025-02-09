import { Location } from "../../game/location.js"
import { Item } from "../../game/item.js"
import { Character, BaseStats, Buff, DamageTypes, damageTypesList } from "../../game/character.js"
import { A2dCharacter } from "./characters.js"
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js"
import { GameState } from "../../game/game.js";
import { caps, plural, printCharacters, randomChoice, singular, splitFirst, lineBreak, highRandom } from "../../game/utils.js";
import { spells, abilityLevels } from "./spells.js";
import { getBuff } from "./buffs.js"
import { scenario } from "./map.js"
import { assistant } from "./assistant.js"
import { isValidItemKey } from "./items.js"

type EquipmentSlot = 'right hand' | 'left hand' | 'bow' | 'armor' | 'ring';
const equipmentSlots = ['right hand', 'left hand', 'bow', 'armor', 'ring'] as const;
type StatKey = BaseStats | `${DamageTypes}_damage` | `${DamageTypes}_defense`;

class Player extends A2dCharacter {
    actions: Map<string, (...args: any[]) => Promise<void>> = new Map();
    class_name: string = '';
    alignment: string = 'neutral';
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
    pets: Character[] = [];
    max_pets: number = 4;
    flags: {
        assistant: boolean,
        enemy_of_ierdale: boolean,
        enemy_of_orcs: boolean,
        murders: number,
        forest_pass: boolean,
        orc_pass: boolean,
        earplugs: boolean,
        hungry: boolean,
        path: string[],
    } = {
        assistant: false,
        enemy_of_ierdale: false,
        enemy_of_orcs: true,
        murders: 0,
        forest_pass: false,
        orc_pass: false,
        earplugs: false,
        hungry: false,
        path: [],
    } as const
    assistantHintsUsed: { [key: string]: number } = {}
    lastCommand: string[] = [];
    justMoved = false;

    constructor(characterName: string, className: string, game: GameState) {
        super({ key: 'player', name: characterName, game: game });
        this.size = -5;
        this.game.addItem({ name: "banana", container: this.inventory })
        this.game.addItem({ name: "side of meat", container: this.inventory })
        this.game.addItem({ name: "club", container: this.inventory })
        this.class_name = className.toLowerCase();
        this.unique_id = this.name;
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
                this.game.addItem({ name: "short bow", container: this.inventory })
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

        this.addAction('save', 0, this.saveGame);
        this.addAction('load', 0, this.loadGame);
        this.addAction('', 10, async () => { if (this.flags.path?.length ?? 0 > 0) this.go('') });
        this.addAction(['n', 'north'], 10, async () => await this.go('north'));
        this.addAction(['s', 'south'], 10, async () => await this.go('south'));
        this.addAction(['e', 'east'], 10, async () => await this.go('east'));
        this.addAction(['w', 'west'], 10, async () => await this.go('west'));
        this.addAction(['ne', 'northeast'], 10, async () => await this.go('northeast'));
        this.addAction(['se', 'southeast'], 10, async () => await this.go('southeast'));
        this.addAction(['sw', 'soutwest'], 10, async () => await this.go('southwest'));
        this.addAction(['nw', 'northwest'], 10, async () => await this.go('northwest'));
        this.addAction('down', 10, async () => await this.go('down'));
        this.addAction('up', 10, async () => await this.go('up'));
        this.addAction('go', 10, this.go);
        this.addAction('flee', 10, async () => { if (this.backDirection) await this.go(this.backDirection); else { this.color(black); this.print('you are cornered!') } });
        this.addAction('i', 0, async () => this.checkInventory());
        this.addAction('look', 5, this.look);
        this.addAction('read', 20, this.read);
        this.addAction('eat', 20, async (itemName) => { await this.consume(itemName, 'eat') });
        this.addAction('drink', 20, async (itemName) => { await this.consume(itemName, 'drink') });
        this.addAction('use', 10, async (itemName) => { await this.consume(itemName, 'use') });
        this.addAction('wield', 10, async (weapon: string) => await this.equip(weapon, 'right hand'));
        this.addAction(['wield2', 'left wield'], 10, async (weapon: string) => await this.equip(weapon, 'left hand'));
        this.addAction('wear', 30, async (item: string) => await this.equip(item, this.item(item)?.equipment_slot as keyof Player['equipment']));
        this.addAction('ready', 10, async (weapon: string) => await this.equip(weapon, 'bow'));
        this.addAction('pets', 0, this.checkPets);
        this.addAction('drop', 10, this.drop);
        this.addAction('get', 10, this.get);
        this.addAction('get all', 10, this.getAll);
        this.addAction('hp', 0, async () => { this.checkHP(); this.checkHunger(); this.checkXP() });
        this.addAction('stats', 0, this.checkStats);
        this.addAction('equipment', 0, this.checkEquipment);
        this.addAction('heal', 10, this.heal);
        this.addAction(['talk', 'talk to'], 10, this.talkTo);
        this.addAction(['attack', 'repel'], 10, async (name: string) => await this.target(name));
        this.addAction('\\', 1, async (name: string) => { await this.left_attack(name); this.action({ command: '', time: 9 }) });
        this.addAction('shoot', 0, async (name: string) => await this.bow_attack(name));
        this.addAction('cast', 0, async (spell: string) => {
            if (!this.abilities[spell]) {
                this.print("You don't know that spell.")
            } else {
                this.action({ command: spell })
            }
        })
        this.addAction('newbie', 10, async () => { await this.spell('newbie') });
        this.addAction('bolt', 1, async () => { await this.spell('bolt'); this.action({ command: '', time: 9 }) });
        this.addAction('fire', 10, async () => { await this.spell('fire') });
        this.addAction('blades', 15, async () => { await this.spell('blades') });
        this.addAction('powermaxout', 10, async () => {
            this.print("<red>You gather your energy, feeling the magic strobe in your fingertips...");
            await this.pause(1);
            this.action({ command: 'charge up', time: 10 })
        });
        this.addAction('charge up', 10, async () => { await this.pause(0.5); await this.spell('powermaxout') });
        this.addAction('cast bloodlust', 10, async () => { await this.spell('bloodlust') });
        this.addAction('cast shield', 5, async () => { await this.spell('shield') });
        this.addAction('cheatmode xfish9', 0, async () => { this.cheatMode = true; this.color(magenta); this.print('Cheat mode activated.') });
        this.addAction('cheat', 0, this.cheat);
        this.addAction('buffs', 0, this.checkBuffs);
        this.addAction('goto', 0, this.goto);
        this.addAction(['exit', 'quit'], 0, async () => { this.hp = -1 })
        this.addAction('help', 0, this.help);

        console.log('loaded player actions.')
        console.log(this.actionTiming)

        // start with full health
        this.recoverStats({ hp: 100, sp: 100, mp: 100 });
        this.autoheal();
        this.onAttack(async (attacker) => {
            if (attacker != this.attackTarget) {
                this.print(`<red>${attacker.name}<black> takes the initiative to attack you!`);
            }
            if (this.activeEquipment['bow'] && this.equipment['bow'] && this.has('arrow')) {
                await this.bow_attack(attacker);
                this.useWeapon('right hand')
            }
            this.action({ command: 'attack', time: 10 });
            this.pets.forEach(pet => pet.action({ command: `attack ${attacker.unique_id}`, time: 1 }));
        })
    }

    addAction(name: string | string[], timeNeeded: number, action: (this: Player, ...args: any[]) => Promise<any>) {
        if (!Array.isArray(name)) name = [name];
        for (let n of name) {
            this.actions.set(n, action.bind(this));
            this.actionTiming[n] = timeNeeded;
            // console.log(`added action ${n} with time ${timeNeeded}`)
        }
        return this;
    }

    async goto(locationName: string) {
        const location = this.game.find_location(locationName);
        if (!location) { return this }
        if (location && this.location) {
            console.log('looking for a path to location', location.key)
            this.flags.path = this.findPath(location);
            this.print(this.flags.path.join(', '))
        }
        return this;
    }

    async idle() {
        // this.fighting = this.location?.characters.some(character => character.enemies.includes(this.name) || this.enemies.includes(character.name)) || false;
        if (!this.attackTarget || this.attackTarget.location !== this.location) {
            await this.fight(this.findEnemy())
        }
        if (this.fighting && this.attackTarget) {
            await this.right_attack(this.attackTarget.unique_id)
            this.sp -= 1;
            if (this.sp < 0) {
                this.hp -= 1;
                this.sp = 0;
            }
        } else {
            // ready bow when not fighting
            this.clearEnemies();
            this.useWeapon('bow');
        }
        for (let buff of Object.values(this.buffs)) {
            this.print(buff.display());
        }
        await this.getinput();
    }

    async getinput() {
        let command = '';
        this.color(black, darkwhite)
        // this.fighting = this.location?.characters.some(character => character.hasEnemy(this) || this.hasEnemy(character)) || false;
        // console.log('player input')
        if (this.fighting) {
            console.log(`player is fighting ${this.attackTarget?.name}`)
            const dirs = ['north', 'south', 'east', 'west']
            this.disableCommands(dirs.map(dir => `go ${dir}`), `${this.attackTarget?.name} blocks your way!`);
            this.disableCommands(dirs.map(dir => dir.slice(0, 1)), `${this.attackTarget?.name} blocks your way!`);
            this.checkHP();
            this.color(black)
            this.print(")===|[>>>>>>>>>>>>>>>>>>")
            command = await this.input()
        } else {
            const dirs = ['north', 'south', 'east', 'west']
            this.enableCommands(dirs.map(dir => `go ${dir}`));
            this.enableCommands(dirs.map(dir => dir.slice(0, 1)));
            this.color(blue)
            this.print(this.name, 1)
            this.color(black)
            command = await this.input('>')
            if (!this.healed) {
                this.autoheal();
                this.color(brightblue)
                this.print("<A@+-/~2~\-+@D>")
            }
        }
        this.color(black, darkwhite)
        command = command.toLowerCase().trim();
        this.lastCommand.unshift(command);
        console.log(`player command log: ${this.lastCommand.slice(0, 5)}`)
        this.action({ command: command });
    }

    action({ command, time }: { command: string, time?: number }) {
        if (this.disabledCommands[command]) {
            this.color(gray)
            this.print(this.disabledCommands[command])
            return;
        }
        const timingIndex = Object.keys(this.actionTiming).filter(key => command.startsWith(key)).sort((a, b) => b.length - a.length)[0] ?? command
        const timing = time ?? this.actionTiming[timingIndex] ?? 10;
        // console.log(`player action ${command} ${timingIndex}, ${timing}`)
        this.actionQueue = [{ command, time: timing }];
    }

    async execute(command: string) {
        // see if the location can process this action
        let verb = Array.from(this.location?.actions.keys() || []).filter(
            key => command == key || command.startsWith(`${key} `)
        ).sort((a, b) => b.length - a.length)[0] ?? command;

        if (this.location?.actions.has(verb)) {
            let args = command.slice(verb.length).trim();
            await this.location?.actions.get(verb)?.(this, args);
        } else {
            // see if any characters in the room can handle the command
            for (let character of this.location?.characters ?? []) {
                verb = Array.from(character.interactions.keys() || []).filter(
                    key => command == key || command.startsWith(`${key} `)
                ).sort((a, b) => b.length - a.length)[0] ?? command;
                if (character != this && character.interactions.has(verb)) {
                    let args = command.slice(verb.length).trim();
                    await character.interactions.get(verb)?.(this, args);
                    return
                }
            }
            // see if any items can handle the command
            verb = Array.from(this.items.map(item => Array.from(item.actions.keys())).flat() || []).filter(
                key => command == key || command.startsWith(`${key} `)
            ).sort((a, b) => b.length - a.length)[0] ?? command;
            for (let item of this.items) {
                // verb = Array.from(item.actions.keys() || []).filter(key => command.startsWith(key)).sort((a, b) => b.length - a.length)[0] ?? command;
                if (item.actions.has(verb)) {
                    let args = command.slice(verb.length).trim();
                    await item.getAction(verb)?.(this, args);
                    return
                }
            }
            // see if the player can handle the command
            verb = Array.from(this.actions.keys() || []).filter(
                key => command == key || command.startsWith(`${key} `)
            ).sort((a, b) => b.length - a.length)[0] ?? command;
            if (this.actions.has(verb)) {
                let args = command.slice(verb.length).trim();
                console.log(`player action ${verb} ${args}`)
                await this.actions.get(verb)?.(args);
                return;
            }
            this.color(gray)
            this.print('What?');
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
        this.color(magenta)
        if (this.hungerPenalty >= 1) {
            this.hurt(this.hunger - this.base_stats.max_sp, 'hunger')
            this.print('You are starving!')
        } else if (this.hungerPenalty && this.flags.hungry) {
            this.print('You are hungry.')
        } else if (this.hungerPenalty * this.max_sp > 1 && !this.flags.hungry) {
            this.print('Your stomach begins to grumble.')
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

    async depart(character: Character, direction: string) {
        this.color(green);
        this.print(`${caps(character.name)} leaves ${direction}.`);
    }

    async target(targetName?: string) {
        let target: Character | null;
        if (targetName) {
            target = this.location?.character(targetName) || null;
            if (!target) {
                this.print('They are not here.')
            }
        } else {
            target = this.findEnemy();
        }
        console.log(`player targets ${target?.name}`)
        await this.fight(target);
    }

    async fight(target: Character | null) {
        super.fight(target);
        this.offTimer('attack');
        this.clear_actions();
    }

    useWeapon(weapon: 'left hand' | 'right hand' | 'bow' | 'none') {
        this.activeEquipment['right hand'] = weapon == 'right hand';
        this.activeEquipment['left hand'] = weapon == 'left hand';
        this.activeEquipment['bow'] = weapon == 'bow';
        console.log(`player using: ${weapon}`)
    }

    async right_attack(targetName?: string) {
        const target = this.location?.character(targetName) || this.attackTarget;
        if (target != this.attackTarget) {
            await this.fight(target);
        }
        this.useWeapon('right hand');
        await this.attack(
            this.attackTarget,
            this.equipment['right hand'],
            this.weaponDamage('right hand')
        );
    }

    async left_attack(targetName: string) {
        const target = this.location?.character(targetName) || this.attackTarget;
        if (target != this.attackTarget) {
            await this.fight(target);
        }
        this.useWeapon('left hand');
        await this.attack(
            this.attackTarget,
            this.equipment['left hand'],
            this.weaponDamage('left hand')
        );
    }

    async bow_attack(enemy: Character | string) {
        if (typeof enemy === 'string') {
            let target = this.location?.character(enemy);
            if (!target) {
                // broaden the search to characters who have just left the room
                target = this.game.find_all_characters(enemy).filter(character => character.lastLocation == this.location)[0];
                if (!target) {
                    this.print("They're not here.");
                    return;
                }
            }
            enemy = target;
        }
        if (this.equipment['bow'] && this.has('arrow')) {
            await this.fight(enemy);
            if (this.attackTarget != enemy) { return; }
            this.removeItem('arrow', 1);
            this.useWeapon('bow');
            let hitted = 0;
            for (let a = 0; a < 50; a++) {
                if (highRandom() * this.archery <= enemy.evasion) {
                    break;
                }
                hitted += 1
            }
            let dam = 0;
            let does = "Your shot";
            if (hitted == 0) {
                this.print("Your shot misses " + enemy.pronouns.object + ".")
                return;
            } else if (hitted >= 50) {
                does += " is perfectly sighted and imbeds its deadly shaft in " + enemy.name + "."
            } else if (hitted >= 35) {
                does += " is almost perfect, as it strikes with a hiss."
            } else if (hitted >= 10) {
                does += " is a decent one, and " + enemy.pronouns.subject + " winces."
            } else if (hitted >= 4) {
                does += " scrapes " + enemy.pronouns.object + "."
            } else {
                does += " grazes " + enemy.pronouns.object + "."
            }
            dam = Math.min(1.5, hitted / 33.3)
            this.print(lineBreak(does))
            await this.game.pause(0.5)
            const actual_coordination = this.base_stats.coordination
            this.base_stats.coordination = Infinity  // we already did the coordination check
            await this.attack(enemy, this.equipment['bow'], this.weaponDamage('bow', dam));
            this.base_stats.coordination = actual_coordination
        } else if (this.equipment['bow'] && !this.has('arrow')) {
            this.print("You're out of arrows.")
        } else {
            this.print("You don't have a bow.")
        }
    }

    async repel(attacker: Character) {
        if (this.attackTarget?.location !== this.location) {
            // if (this.equipment['bow']) { await this.bow_attack(attacker); }
            await this.fight(attacker);
        }
    }

    async relocate(newLocation: Location | null, direction?: string) {
        this.justMoved = true;
        await this.location?.exit(this, direction);
        if (this.location) this.exit(this.location);
        this.location = newLocation;
        await newLocation?.enter(this);
        if (newLocation) this.enter(newLocation);
        for (let character of newLocation?.characters ?? []) {
            if (character !== this) {
                await this.encounter(character);
                await character.encounter(this);
            }
        }
        for (let pet of this.pets) {
            pet.relocate(newLocation);
        }
        this.justMoved = false;
    }

    async encounter(character: Character) {
        if (!this.justMoved && !this.pets.includes(character)) {
            console.log(`player encountered "${character.name}", "${character.fight_description}"`)
            this.color(green);
            this.print(`${caps(character.name)} enters from ${character.backDirection ? `the ${character.backDirection}` : 'nowhere'}.`);
        }
    }

    async look(target?: string) {
        this.color(black)
        this.print()
        this.print(this.location?.name)
        if (this.location?.description) {
            console.log('location description', this.location?.description)
            this.color(magenta)
            let lineLength = 0;
            let words = this.location?.description.split(' ')
            let lastWord = words[words.length - 1]
            for (let word of words) {
                if (lineLength + word.length + 1 > 80) {
                    if (word != lastWord) this.print()
                    lineLength = 0;
                } else if (lineLength > 0) {
                    this.print(' ', 1)
                    lineLength += 1;
                }
                this.print(word, 1)
                lineLength += word.length;
            }
            this.print()
        }
        this.color(gray)
        this.location?.landmarks.forEach(item => {
            this.print('    *' + item.description)
        })
        this.color(red)
        this.location?.characters.forEach(character => {
            if (character != this && !this.pets.includes(character)) {
                this.print('    ' + (character.name))
            }
        })
        this.color(gray)
        this.location?.items.forEach(item => {
            this.print('    ' + item.display)
        })
        this.color(black)
        this.print()
        this.print('You can go: ', 1)
        this.print(Array.from(this.location?.adjacent?.keys() ?? []).join(', '))
    }

    async heal() {
        this.color(black)
        const healed = Math.min(this.healing, this.max_hp - this.hp, this.sp);
        if (healed == 0) {
            if (this.sp == 0) this.print("You are too weak!");
            else this.print("You are already at full health.");
            return;
        }
        this.recoverStats({ hp: healed, sp: -healed });
        this.print("You pull yourself together and heal some!");
        if (!this.fighting) this.checkHP();
    }

    async go(direction: string) {
        console.log('go!', direction)
        this.color(black)
        if (!this.location?.adjacent.has(direction)) {
            this.print('You can\'t go that way.')
            return;
        } else if (!await this.can_go(direction)) {
            return;
        } else if (this.sp <= 0) {
            this.print("You are too weak!");
        } else {
            const prevLocation = this.location?.key;
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
            this.print("You don't have that.")
        }
        else if (item.read) {
            await item.read();
        }
        else {
            this.print("You can't read that.")
        }
    }

    get inventoryWeight() {
        return Math.round(this.items.reduce((acc, item) => acc + item.size * item.quantity, 0) * 10) / 10
    }

    async checkBuffs() {
        this.color(black)
        for (let buff of Object.values(this.buffs)) {
            const buffKeys = Array.from(new Set(Object.keys(buff.times).concat(Object.keys(buff.plus))))
            this.print(
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

    async addPet(pet?: Character) {
        if (!pet) {
            console.log('fake pet??')
            return
        } else if (this.pets.length >= this.max_pets) {
            this.color(gray)
            this.print('You have too many pets.')
            return;
        } else {
            this.pets.push(pet);
            pet.leader = this;
            pet.onIdle(async function () {
                this.leader = this.leader instanceof Character ? this.leader : this.location?.character(this.leader) || this;
                console.log('pet turn', this.name, this.leader.name)
                if (this.leader.fighting) {
                    this.fight(this.leader.attackTarget);
                } else {
                    this.fight(null);
                    this.clearEnemies();
                }
            }).onDeath(async () => {
                this.pets = this.pets.filter(p => p !== pet);
                this.print(`<red>${pet.name} was slaughtered--`)
            }).onSlay(async (victim) => {
                // player gets credit for pet's kills
                await this.slay(victim);
            }).onAttack(async (attacker) => {
                this.print(`<red>${attacker.name}<black> takes the initiative to attack you!`);
            }).base_stats.hp_recharge = 0.001;
            pet.persist = false; // pets don't save (not in the regular way)
        }
    }

    async checkPets() {
        for (let pet of this.pets) {
            this.color(green)
            this.print(`${caps(pet.name)}:`)
            this.print(`  HP: ${pet.hp}/${pet.max_hp}`)
            this.print(`  agility: ${pet.agility}`)
            this.print(`  coordination: ${pet.coordination}`)
            for (let dam of damageTypesList) {
                if (pet.base_damage[dam]) {
                    this.print(`  ${dam} damage: ${pet.base_damage[dam]}`)
                }
            }
        }
    }

    async checkInventory() {
        let lines = 3;
        const nextLine = async () => {
            lines += 1;
            if (lines > 23) {
                this.color(black)
                this.print('more, press a key...')
                await this.getKey();
                lines = 0;
                this.game.locate(0, 24);
            }
        }
        this.color(green, black)
        this.print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        this.color(black, darkwhite)
        this.print()
        this.print(`         The Exquisite Inventory of ${this.name}, ${this.class_name}`)
        this.color(green, white)
        this.print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        this.color(black, darkwhite)
        this.print()
        const listItems = this.items.sort((a, b) => (a.name < b.name ? -1 : 1)).filter(item => !(['gold', 'arrows'].includes(item.name)))
        let i = 0
        for (let item of listItems) {
            if (i % 2 == 0) {
                this.print('    ' + item.display, 1)
            } else {
                this.game.locate(40)
                this.print(item.display)
                await nextLine();
            }
            i++;
        }
        if (listItems.length % 2 == 1) {
            this.print();
            await nextLine();
        }
        this.color(gray)
        this.print(`Total Object Weight: ${this.inventoryWeight}/${this.max_carry}`)
        await nextLine();
        this.color(green, white)
        this.print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        this.color(black, darkwhite)
        this.print()
        await nextLine();
        this.color(black)
        this.print("Wielded:         ", 1)
        this.color(gray)
        this.print(this.equipment['right hand']?.name ?? 'fist')
        await nextLine();
        this.color(black)
        this.print("Left Wielded:    ", 1)
        this.color(gray)
        this.print(this.equipment['left hand']?.name ?? 'fist')
        await nextLine();
        if (this.equipment['bow']) {
            this.color(blue)
            this.print("Bow:             " + this.equipment['bow'].name)
            await nextLine();
        }
        this.color(black)
        this.print("Armor:           ", 1)
        this.color(gray)
        this.print((this.equipment['armor'] ? this.equipment['armor'].name : 'none'))
        await nextLine();
        if (this.equipment['ring']) {
            this.color(blue)
            this.print("Ring:            " + this.equipment['ring'].name)
            await nextLine();
        }
        if (this.item('arrows')?.quantity) {
            this.color(orange)
            this.print("Arrows:          " + this.item('arrows')?.quantity)
            await nextLine();
        }
        this.color(yellow)
        this.print(`${this.item('gold')?.quantity ?? 0} GP`)
        this.color(green, black)
        this.print("<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>", 1)
        this.color(black, darkwhite)
        this.print()
        if (this.flags.assistant) {
            this.color(magenta)
            if (this.item('club') && !this.equipment['right hand']) {
                this.print("Assistant -- Type \"wield club\" to set it as your wielded weapon.")
            }
            if (this.item('short bow') && !this.equipment['bow']) {
                this.print("Assistant -- Type \"ready short bow\" to set it as your wielded bow.")
            }
        }
    }

    async consume(itemName: string, verb: 'eat' | 'drink' | 'use') {
        let item = this.item(itemName);
        let howmany = 1;
        if (!item) {
            // see if they included a number
            howmany = parseInt(itemName.split(' ')[0]);
            if (howmany) {
                item = this.item(singular(itemName.split(' ').slice(1).join(' ')));
                if (!item) { item = this.item(itemName.split(' ').slice(1).join(' ')) }
            } else {
                item = this.item(singular(itemName));
                if (item) {
                    this.print("How many?")
                    howmany = parseInt(await this.input())
                    if (isNaN(+howmany)) {
                        this.print("That's not a number.")
                        return;
                    }
                }
            }
        }
        if (!item) {
            this.color(gray)
            this.print("You don't have that.")
            return;
        } else if (item[verb]) {
            for (let i = 0; i < howmany; i++) {
                if (i > 0) await this.game.pause(0.1);
                await item[verb](this);
                this.removeItem(item, 1);
                if (this.dead) return;
                this.color(orange)
                this.print(`${item.name} was consumed.`)
            }
            this.checkHP();
            this.checkHunger();
        }
        else {
            this.color(gray)
            this.print("You can't eat that.")
        }
    }

    async removeItem(itemName: string | Item | undefined, quantity: number = 1) {
        /**
        * Removes an item from the player's inventory or equipment.
        * @param {string | Item} itemName - The name of the item to remove.
        * @param {number} quantity - The quantity of the item to remove. Default is 1.
        */
        const item: Item | undefined = typeof itemName === 'string' ? this.inventory.item(itemName) : itemName;
        if (item) {
            this.inventory.remove(item, quantity);
        } else if (itemName) {
            for (let slot of equipmentSlots) {
                if (this.equipment[slot]?.name === itemName) {
                    const item = this.equipment[slot];
                    this.equipment[slot] = null;
                    item.unequip(this);
                    return;
                }
            }
        }
    }

    async equip(item: string | Item | undefined, slot: keyof Player['equipment']) {
        this.color(black)
        if (item == 'fist') {
            item = slot == 'right hand' ? this.right_fist : this.left_fist;
        } else if (typeof item === 'string') {
            item = this.item(item);
        }
        if (!item) {
            this.print("You don't have that.")
            return;
        } else if (slot == 'right hand' || slot == 'left hand' || slot == 'bow') {
            if (item.requirements) {
                for (let key of Object.keys(item.requirements)) {
                    if (item.requirements && this.base_stats[key as BaseStats] < (item.requirements[key as BaseStats] || 0)) {
                        this.print(`Your ${key} is too low to use that ${item.requirements[key as BaseStats]} required.`)
                        return;
                    }
                }
                if (slot === 'bow') {
                    if (item.equipment_slot === 'bow') {
                        this.print(`Successfully readied ${item.name} for shooting.`)
                    } else {
                        this.print("That's not a bow.")
                        if (this.flags.assistant) {
                            this.color(magenta)
                            this.print(`Assistant -- Type \"wield ${item.name}\" instead.`)
                        }
                        return;
                    }
                } else if (slot === 'right hand' || slot === 'left hand') {
                    if ((item as Item)?.equipment_slot === 'bow') {
                        this.print("That's a bow, not a melee weapon.")
                        if (this.flags.assistant) {
                            this.color(magenta)
                            this.print(`Assistant -- Type \"ready ${item.name}\" instead.`)
                        }
                        return;
                    } else {
                        this.print(`${item.name} was successfully ${slot === 'left hand' ? 'left-' : ''}wielded.`)
                    }
                }
            } else {
                this.print("That object has no militaristic properties.")
                return;
            }
        } else {
            this.print(`${item.name} equipped.`)
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
                    this.color(black, darkwhite)
                    this.print(`${slot_titles[slot]}: `, 1)
                    this.color(black, white)
                    this.print(item?.name ?? 'none', 1)
                    this.color(black, darkwhite)
                },
            ];
            if (!item) return lines.concat(() => this.print('', 1));
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
                                    this.color(black)
                                    this.print(`${slot == 'left hand' ? `${Math.ceil(this.offhand * 100)}% of ` : ''}`, 1)
                                    this.color(blue)
                                    this.print(`${amount}x `, 1)
                                    this.color(black)
                                    this.print(`${damageType} damage`, 1)
                                    this.print(` = `, 1)
                                    this.color(red)
                                    this.print(`${typeDamage}`, 1)
                                })
                            } else if (buffType == 'plus') {
                                if (key == 'damage' && item.is_weapon)
                                    totalDamage += amount;
                                lines.push(() => {
                                    this.color(blue)
                                    this.print(`+${amount} `, 1)
                                    this.color(black)
                                    this.print(`${damageType} ${key}`, 1)
                                })
                            } else if (key == 'defense') {
                                amount = (1 - 1 / amount)
                                lines.push(() => {
                                    this.color(blue)
                                    this.print(`-${Math.ceil(amount * 100)}% `, 1)
                                    this.color(black)
                                    this.print(`${damageType} damage`, 1)
                                })
                            }
                        }
                    }
                }
            }

            if (item?.is_weapon && (slot == 'right hand' || slot == 'left hand')) {

                lines.push(() => {
                    this.color(black)
                    this.print('total: ', 1)
                    this.color(red)
                    this.print(`${totalDamage}`, 1)
                })
            }
            lines.push(() => this.print('', 1))
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
                this.print("  ", 1)
                leftSide[i]()
            } else this.print('', 1)
            if (i < rightSide.length) {
                this.game.locate(40)
                rightSide[i]()
            }
            this.print()
        }
    }

    async spell(spellName: string) {
        this.color(black)
        if (this.abilities[spellName]) {
            await spells[spellName].call(this, this.attackTarget || this);
        } else {
            console.log(`${spellName} failed.`)
            console.log(this.abilities)
            this.print("You don't know that spell.")
        }
    }

    async drop(itemName: string) {
        this.color(black)
        const item = this.item(itemName);
        if (!item) {
            this.print("You don't have that.")
        }
        else {
            this.dropItem(item.name);
            this.print(`Dropped ${item.name}`)
        }
    }

    async get(itemName: string) {
        const item = this.location?.item(itemName);
        if (!item) {
            this.print("That's not here.")
        }
        else {
            let displayName = item.display
            this.getItem(itemName);
            if (this.has(itemName)) {
                this.print(`Got ${displayName}.`)
            }
            if (item.equipment_slot && this.flags.assistant) {
                this.color(magenta)
                this.print(`Assistant -- Type \"wear ${item.name}\" to equip it.`)
            }
        }
    }

    async getAll() {
        for (let item of this.location?.items ?? []) {
            this.get(item.name);
        }
        this.print("Got everything.")
    }

    has = (item_name: string, quantity: number = 1) => {
        // count both inventory and equipment
        return this.itemCount(item_name) + equipmentSlots.filter(slot => this.equipment[slot]?.name == item_name).length >= quantity;
    }

    async checkHP() {
        this.color(black);
        this.print(`[ HP:  ${Math.ceil(this.hp)}/`, 1);
        if (this.buff_additive('max_hp') > 0 || this.buff_multiplier('max_hp') > 1) this.color(blue);
        else if (this.buff_additive('max_hp') < 0 || this.buff_multiplier('max_hp') < 1) this.color(brightred);
        this.print(`${Math.ceil(this.max_hp)}`, 1);
        this.color(black);
        this.print("  SP: ", 1);
        if (this.hungerPenalty * this.max_sp > 1) this.color(brightred);
        this.print(`${Math.ceil(this.sp)}/`, 1);
        if (this.buff_additive('max_sp') > 0 || this.buff_multiplier('max_sp') > 1) this.color(blue);
        else if (this.buff_additive('max_sp') < 0 || this.buff_multiplier('max_sp') < 1) this.color(brightred);
        this.print(`${Math.ceil(this.max_sp)}`, 1);
        this.color(black);
        this.print(`  BP: ${Math.ceil(this.mp)}/`, 1)
        if (this.buff_additive('max_mp') > 0 || this.buff_multiplier('max_mp') > 1) this.color(blue);
        else if (this.buff_additive('max_mp') < 0 || this.buff_multiplier('max_mp') < 1) this.color(brightred);
        this.print(`${Math.ceil(this.max_mp)} ]`)
        this.color(black)
    }

    checkHunger() {
        this.print(`[ Hunger: `, 1)
        const barLength = 12 + [this.max_hp, this.hp, this.max_sp, this.sp, this.max_mp, this.mp].reduce(
            (sum, stat) => sum + Math.ceil(stat).toString().length, 0
        );
        const barColor = red; // this.hunger / this.max_sp > 1 / 4 ? (this.hunger > this.max_sp / 2 ? brightred : red) : green
        for (let i = 0; i < barLength; i++) {
            if (this.hunger / super.max_sp * barLength > i) this.color(darkwhite, barColor)
            else this.color(darkwhite, black)
            this.print('▂', 1)
        }
        this.color(black, darkwhite)
        this.print(' ]')
        // this.print(this.hunger.toString())
    }

    async help() {
        const print = this.print;
        print("Here are some basic commands used in this game:")
        print(" n, s, e, w (for north, south, east, west): go in the specified direction.")
        print(" at times, you may also go northeast (ne), etc.")
        print(" look: see what's around you.")
        print(" get [item]: pick up an item.")
        print(" drop [item]: drop an item.")
        print(" eat (or drink) [item]: consume an item.")
        print(" talk [character]: speak to a character.")
        print(" fight [character]: attack a character.")
        print(" flee: run away from a fight.")
        print(" heal: heal yourself. Costs SP, gains HP.")
        print(" wield [item]: equip an item to fight.")
        print(" left wield [item]: equip an item in your left hand.")
        print(" cast [spell]: use a spell.")
        print(" i (or inventory): check your inventory.")
        print(" stats: check your stats.")
        print(" hp: check your health, stamina, magic and hunger levels.")
        print(" equipment: examine your equipped items.")
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
        this.color(value > defaultValue ? blue : brightred)
        switch (statName) {
            case 'hp_recharge':
            case 'sp_recharge':
            case 'mp_recharge':
            case 'offhand':
                if (buffType == 'plus') this.print(`${value > defaultValue ? '+' : ''}${value * 100}% `, 1)
                break;
            case 'offhand':
                if (buffType == 'plus') this.print(`${value > defaultValue ? '+' : ''}${value * 100}% `, 1)
                break;
            default:
                if (buffType == 'times') {
                    if (value > defaultValue) this.print(`+${Math.ceil(value * 100 - 100)}% `, 1)
                    else if (value < defaultValue) this.print(`-${Math.ceil(value * 100 - 100)}% `, 1)
                } else if (buffType == 'plus') {
                    if (value > defaultValue) this.print(`+${Math.ceil(value)} `, 1)
                    else if (value < defaultValue) this.print(`${Math.ceil(value)} `, 1)
                }
        }
        this.color(black);
        this.print(this.statName(statName), 1)
    }

    async checkStats() {
        const printStat = (statName: BaseStats) => {
            const plus = this.buff_additive(statName);
            const times = this.buff_multiplier(statName);
            if (this.base_stats[statName] < this[statName]) {
                this.color(blue)
            } else if (this.base_stats[statName] > this[statName]) {
                this.color(brightred)
            } else {
                this.color(black)
            }
            this.print(this.statValue(statName, (this[statName] as number)), 1)
            if (plus > 0) this.print(` (+${this.statValue(statName, plus)})`, 1)
            else if (plus < 0) this.print(` (${this.statValue(statName, plus)})`, 1)
            if (times !== 1) this.print(` (x${this.statValue(statName, times)})`, 1)
            this.print()
            this.color(black)
        }
        this.color(black)
        this.print(`Class: ${this.class_name}`)
        this.print(`Archery: `, 1)
        printStat('archery')
        this.print(`Coordination: `, 1)
        printStat('coordination')
        this.print(`Agility: `, 1)
        printStat('agility')
        this.print(`Strength: `, 1)
        printStat('strength')
        this.print(`Max HP: `, 1)
        printStat('max_hp')
        this.print(`Max SP: `, 1)
        printStat('max_sp')
        this.print(`Max BP: `, 1)
        printStat('max_mp')
        this.print(`Healing: `, 1)
        printStat('healing')
        this.print(`HP recovery: `, 1)
        printStat('hp_recharge')
        this.print(`SP recovery: `, 1)
        printStat('sp_recharge')
        this.print(`BP recovery: `, 1)
        printStat('mp_recharge')
        this.print(`OffHand: `, 1)
        printStat('offhand')
        this.print(`Magic Level: `, 1)
        printStat('magic_level')
        for (let ability in this.abilities) {
            this.print(`--${caps(ability)} skill: ${abilityLevels[Math.floor(this.abilities[ability])]}`)
        }
    }

    checkXP() {
        this.color(black)
        this.print(`EXP: ${this.experience}`)
    }

    async talkTo(characterName: string) {
        const character = this.location?.character(characterName);
        this.color(black)
        if (!character) {
            this.print("They're not here.")
        }
        else {
            await character.talk(this);
        }
    }

    async die(cause: any) {
        this.hp = Math.min(this.hp, 0);
        this.color(brightred, gray)
        if (cause instanceof Character) {
            this.print(`You go limply unconscious as ${cause.name} stands triumphantly over you.`)
        } else {
            this.print(`You have died from ${cause}.`)
        }
    }

    get fighting(): boolean {
        return this.location?.characters.some(character => this.attackTarget == character || character.attackTarget == this || character.attackTarget && this.pets.includes(character.attackTarget)) || false;
    }

    async slay(character: Character | Character[]) {
        const enemies_remaining = this.location?.characters.filter(char => char !== this && (char.attackTarget === this || char.enemies.includes(this.name)));
        if (enemies_remaining) this.checkHP();

        if (character instanceof Character) {
            character = [character];
        }
        let exp_gained = 0;
        let gold_gained = 0;
        this.print()
        this.color(yellow)
        this.print(`You defeat `, 1)
        this.print(printCharacters({
            characters: character,
            basecolor: 'yellow',
            charcolor: 'yellow'
        }), 1);
        this.print('!')
        this.color(black)
        for (let char of character) {
            exp_gained += char.exp_value;
            if (char.has('gold')) {
                gold_gained += char.itemCount('gold');
            }
            for (let item of char.items) {
                if (item.name !== 'gold') this.print(`${char.name} drops ${item.display}`)
            }
        }
        // sum up gold and exp all together
        this.color(green)
        if (gold_gained) this.print(`you gain ${gold_gained} gold.`)
        this.getItem('gold', this.location || undefined, gold_gained);
        this.color(green)
        this.print(`you gain ${exp_gained} exp.`)
        this.experience += exp_gained;
        console.log(this.name, 'slays', character.map(char => char.name).join(', '), 'for', gold_gained, 'gold and', exp_gained, 'exp')

        // who else wants some??
        console.log('enemies remaining', enemies_remaining?.map(char => char.name))
        if (enemies_remaining?.length) {
            await this.getKey();
            // group them by name and list them
            this.print(printCharacters({ characters: enemies_remaining, capitalize: true }), 1);
            console.log('-----------------', this.name, 'continutes to fight', printCharacters({ characters: enemies_remaining, capitalize: true }))
            this.print(`<black> ${enemies_remaining.length > 1 ? 'continue' : 'continues'} the attack!`)
            await this.fight(enemies_remaining[0]);
        } else {
            await this.fight(null)
        }
    }

    async turn() {
        await this.execute(this.actionQueue.shift()?.command || '');
        if (this.flags.assistant)
            assistant(this);
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
        if (this.activeEquipment['left hand'] && key == 'coordination') { buff *= this.offhand; }
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

    weaponDamage(weapon: 'right hand' | 'left hand' | 'bow', multiplier: number = 1) {
        // this.useWeapon(weapon);
        if (weapon == 'left hand') {
            multiplier *= this.offhand;
            // console.log('offhand multiplier', multiplier)
        }
        const dam: { [key in DamageTypes]: number } = {
            'blunt': (this.strength * this.buff_damage_multiplier('blunt') + this.buff_damage_additive('blunt')) * multiplier,
            'sharp': (this.strength * this.buff_damage_multiplier('sharp') + this.buff_damage_additive('sharp')) * multiplier,
            'magic': ((this.strength + this.magic_level) * this.buff_damage_multiplier('magic') + this.buff_damage_additive('magic')) * multiplier,
            'poison': this.buff_damage_additive('poison') * multiplier,
            'fire': this.buff_damage_additive('fire') * multiplier,
            'cold': this.buff_damage_additive('cold') * multiplier,
            'electric': this.buff_damage_additive('electric') * multiplier,
            'sonic': this.buff_damage_additive('sonic') * multiplier,
            'acid': this.buff_damage_additive('acid') * multiplier,
        }
        console.log(`weapon damage: ${JSON.stringify(dam)}`)
        return dam;
    }

    async cheat(command: string) {
        if (!this.cheatMode) {
            this.print("what?")
            return;
        } else {
            const code = command.includes(' ') ? command.split(' ')[0] : command;
            const value = command.includes(' ') ? command.split(' ').slice(1).join(' ') : command;
            const quantity = parseInt(value.slice(0, value.indexOf(' '))) || 0;
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
                    this.base_stats.max_hp = parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_sp'):
                    this.base_stats.max_sp = parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('max_mp'):
                    this.base_stats.max_mp = parseInt(value) || 0;
                    await this.checkHP();
                    break;
                case ('strength'):
                    this.base_stats.strength = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('agility'):
                    this.base_stats.agility = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('coordination'):
                    this.base_stats.coordination = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('healing'):
                    this.base_stats.healing = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('magic_level'):
                    this.base_stats.magic_level = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('newbie'):
                    this.abilities.newbie = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('bolt'):
                    this.abilities.bolt = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('fire'):
                    this.abilities.fire = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('blades'):
                    this.abilities.blades = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('powermaxout'):
                    this.abilities.powermaxout = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('archery'):
                    this.base_stats.archery = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('speed'):
                    this.base_stats.speed = parseInt(value) || 0;
                    await this.checkStats();
                    break;
                case ('xp'):
                    this.experience += parseInt(value) || 0;
                    this.checkXP();
                    break;
                case ('gold'):
                    this.game.addItem({ name: 'gold', quantity: parseInt(value) || 0, container: this.inventory });
                    this.color(yellow)
                    this.print(`ka-ching! +${value} = ${this.itemCount('gold')}`)
                    break;
                case ('item'):
                    if (isValidItemKey(value)) {
                        this.game.addItem({ name: value, quantity: 1, container: this.inventory });
                        this.print(`${value} created ;)`)
                    }
                    break;
                case ('delete'):

                    this.removeItem(this.item(value), quantity);
                    this.print(`deleted ${quantity} ${value}`)
                    break;
                case ('regen'):
                    this.game.loadScenario(scenario)
                    this.relocate(this.game.find_location(this.location?.key || '') || null);
                    this.print('map regenerated.')
                    break;
                case ('enable'):
                    this.enableCommands();
                    this.print('commands enabled.')
                    break;
                case ('landmark'):
                    this.game.addLandmark(value, this.location!);
                    this.print(`landmark ${value} added.`)
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
                            for (let char of this.game.characters.filter(char => char.enemies.includes(this.name))) {
                                char.enemies = char.enemies.filter(name => name !== this.name)
                            }
                            break;
                        case ('biadon'):
                            this.game.flags.biadon = !this.game.flags.biadon;
                        case ('ierdale_mission'):
                            this.game.flags.ierdale_mission = '';
                        case ('pass'):
                            this.flags.forest_pass = !this.flags.forest_pass;
                            break;
                        default:
                            this.print('flag not recognized.')
                            return;
                    }
                    this.print(`flag ${value} set.`)
                    break;
                case ('assistant'):
                    this.assistantHintsUsed = {};
                    this.print('assistant hints reset.')
                    break;
                case ('void'):
                    // delete any previous void
                    const voidLocations = this.game.find_all_locations('the void')
                    for (const location of voidLocations) {
                        this.game.removeLocation(location)
                    }
                    this.game.enter_the_void();
                    break;
                case ('kill'):
                    const target = this.location?.character(value);
                    if (target) {
                        target.die(this);
                        await this.slay(target);
                    } else {
                        this.print('target not found.')
                    }
                    break;
                case ('spawn'):
                    const location = this.location!;
                    this.game.addCharacter({ key: value as keyof typeof this.game.characterTemplates, location });
                    this.print(`${value} spawned.`)
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
            activeEquipment: this.activeEquipment,
            buffs: Object.fromEntries(
                Object.entries(this.buffs).map(([key, buff]) => [key, buff.save()])
            ),
            pets: this.pets.map(pet => pet.save()),
            flags: this.flags,
            assistantHintsUsed: this.assistantHintsUsed
        }
    }

    async load(character: any) {
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
            hp: Math.max(1, character._hp || character.hp),
            sp: character._sp || character.sp,
            mp: character._mp || character.mp,
            actionQueue: [],
            reactionQueue: [],
        })
        if (character.activeEquipment) { this.activeEquipment = character.activeEquipment }
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
        await this.relocate(character.location)
        if (character.pets) {
            for (let pet of character.pets) {
                this.addPet(this.game.addCharacter({ location: this.location, name: pet.key, ...pet }))
                console.log(`pet ${pet.key} loaded at ${this.location}.`)
            }
        }
        return this;
    }

    async loadGame() {
        this.color(black)
        let success = false;
        while (!success) {
            let saveName = ''
            while (!saveName) {
                saveName = await this.input('Enter the name of your character to load: ');
            }
            this.print("Loading now...")
            success = await this.game.load(saveName);
        }
    }

    async saveGame() {
        this.color(black)
        await this.game.save();
        this.print('Game saved.')
    }
}

export { Player }
