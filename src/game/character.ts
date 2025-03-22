import { Container, Item } from "./item.js";
import { Location, findPath } from "./location.js";
import { GameState, withGameState } from "./game.js";
import { AttackDescriptors } from "./item.js";
import { highRandom, randomChoice, splitFirst } from "./utils.js";

const pronouns = {
    'male': { subject: "he", object: "him", possessive: "his" },
    'female': { subject: "she", object: "her", possessive: "her" },
    'neutral': { subject: "they", object: "them", possessive: "their" },
    'inhuman': { subject: "it", object: "it", possessive: "its" }
}

type Action = (this: Character, ...args: any[]) => Promise<void>;

const timeCost: Record<string, number> = {
    'go': 10,
    'attack': 10,
    'repel': 5,
}
type BaseStats =
    'max_hp' | 'max_mp' | 'max_sp' | 'strength' | 'speed' | 'coordination' |
    'agility' | 'magic_level' | 'healing' | 'archery' | 'hp_recharge' |
    'mp_recharge' | 'sp_recharge' | 'offhand';

const damageTypesList = ['blunt', 'sharp', 'magic', 'fire', 'electric', 'cold', 'sonic', 'poison', 'acid', 'sickness'] as const;
type DamageTypes = typeof damageTypesList[number];

type DamageModifiers = Partial<Record<DamageTypes, number>>;
type DefenseModifiers = Partial<Record<DamageTypes, number>>;

type BuffModifiers = {
    [key in BaseStats]?: number;
} & {
    damage?: DamageModifiers;
    defense?: DefenseModifiers;
}

class Buff {
    private _onCreate: ((this: Buff) => Promise<void>) | null = null;
    private _onExpire: ((this: Buff) => Promise<void>) | null = null;
    private _onTurn: ((this: Buff) => Promise<void>) | null = null;
    private _display: ((this: Buff) => string) | null = null;
    private _onCombine: ((this: Buff, other: Buff) => Buff) | null = null;
    public character!: Character;
    public name: string;
    public power: number;
    public duration: number;
    public plus: BuffModifiers;
    public times: BuffModifiers;

    constructor({
        name,
        duration = -1,
        power = 1,
        plus = {},
        times = {},
    }: {
        name: string;
        duration?: number;
        power?: number;
        times?: BuffModifiers;
        plus?: BuffModifiers;
    }) {
        this.name = name;
        this.duration = duration;
        this.power = power;
        this.times = times;
        this.plus = plus;
    }
    onCreate(action: (this: Buff) => Promise<void>) {
        this._onCreate = action.bind(this);
        return this;
    }
    async apply(character: Character) {
        this.character = character;
        await this._onCreate?.();
    }
    onExpire(action: (this: Buff) => Promise<void>) {
        this._onExpire = action.bind(this);
        return this;
    }
    async expire() {
        console.log(`buff ${this.name} expires.`)
        await this._onExpire?.();
        this.character.removeBuff(this);
    }
    onTurn(action: (this: Buff) => Promise<void>) {
        this._onTurn = action.bind(this);
        return this;
    }
    async turn() {
        await this._onTurn?.();
        this.duration -= 1;
        if (this.duration === 0) {
            await this.expire();
            this.character.removeBuff(this);
        }
    }
    onDisplay(action: (this: Buff) => string) {
        this._display = action.bind(this);
        return this;
    }
    display() {
        return this._display?.();
    }
    onCombine(action: (this: Buff, other: Buff) => Buff) {
        this._onCombine = action.bind(this);
        return this;
    }
    combine(other: Buff) {
        return this._onCombine?.(other) || this;
    }
    get game() {
        return this.character.game;
    }
    save(): object {
        return {
            name: this.name,
            duration: this.duration,
            power: this.power,
            multipliers: this.times,
            additives: this.plus,
        }
    }
}

interface CharacterParams {
    key: string;
    game: GameState;
    class_name?: string;
    fight_description?: string;
    name?: string;
    aliases?: string[];
    alignment?: string;
    pronouns?: { subject: string, object: string, possessive: string };
    items?: (string | { name: string, quantity: number })[];
    exp?: number;
    max_hp?: number;
    hp_recharge?: number;
    max_mp?: number;
    mp_recharge?: number;
    max_sp?: number;
    sp_recharge?: number;
    strength?: number;
    speed?: number;
    coordination?: number;
    agility?: number;
    magic_level?: number;
    healing?: number;
    archery?: number;
    offhand?: number;
    isPlayer?: boolean;
    enemies?: string[];
    friends?: string[];
    powers?: { [key: string]: number };
    weapons?: { [key: string]: Item };
    weapon?: Item | { name: string, type: AttackDescriptors, damage_type?: DamageTypes };
    attackVerb?: AttackDescriptors;
    weaponName?: string;
    damage?: Partial<{ [key in DamageTypes]: number }>;
    armor?: Partial<{ [key in DamageTypes]: number }>;
    hostile?: boolean;
    pacifist?: boolean;
    chase?: boolean;
    flags?: { [key: string]: any };
    respawn_time?: number;
    respawns?: boolean;
    respawnLocationKey?: string | number | undefined;
    lastLocation?: Location;
    persist?: boolean;
    following?: string;
    buff?: { plus?: BuffModifiers, times?: BuffModifiers };
    size?: number;
}

class Character {
    key: string;
    unique_id: string = '';
    class_name: string = "";
    game: GameState;
    fight_description: string;
    name: string;
    aliases: string[] = [];
    alignment: string = "";
    pronouns: { subject: string, object: string, possessive: string } = { subject: "they", object: "them", possessive: "their" };
    isPlayer: boolean;
    readonly inventory: Container;
    base_stats: { [key in BaseStats]: number };
    hp: number;
    mp: number;
    sp: number;
    experience: number = 0;
    exp_value: number = 0;
    _hunger: number = 0;
    action_speed: number = 1; // speed modifier for last action
    invisible: number = 0;
    enemies: string[] = [];
    friends: string[] = [];
    leader: string | Character = '';
    weaponName: string = "";
    attackVerb: AttackDescriptors = 'club';
    armor: { [key: string]: Item } = {};
    base_damage: Partial<{ [key in DamageTypes]: number }> = {};
    readonly buffs: { [key: string]: Buff } = {};
    location: Location | null = null;
    backDirection: string = '';
    lastLocation: Location | null = null;
    abilities: { [key: string]: number };
    size: number;
    flags: { [key: string]: any } = {};
    attackTarget: Character | null = null;
    private _onEncounter: ((character: Character) => Promise<void>) | undefined;
    private _onDeparture: ((character: Character, direction: string) => Promise<void>) | undefined;
    private _allowDeparture: ((character: Character, direction: string) => Promise<boolean>) | undefined;
    private _onEnter: Action | undefined;
    private _onLeave: Action | undefined;
    private _onSlay: Action | undefined;
    private _onDeath: Action | undefined;
    private _onAttack: Action[];
    private _onIdle: Action | null = null;
    private _fightMove: Action | undefined;
    private _onRespawn: Action | undefined;
    private _onDialog: Action | undefined = async () => { this.game.print("They don't want to talk") };
    private _onDealDamage: Action | undefined;
    interactions: Map<string, (...args: any[]) => Promise<void>> = new Map()
    hostile: boolean = false;
    pacifist: boolean = false;
    chase: boolean = false;
    respawnTime: number = 0;
    respawnCountdown: number = 0;
    respawnLocation: string | number | undefined;
    respawns: boolean;
    persist: boolean = true;
    time: number = 0;
    following: string = '';
    actionQueue: { command: string, time: number }[] = [];
    actionTiming: Record<string, number>;
    reactionQueue: { command: string, time: number, repeat?: number }[] = [];
    // fighting: boolean = false;

    color: Function;
    print: Function;
    input: Function;
    clear: Function;
    locate: Function;
    pause: Function;
    getKey: Function;

    constructor({
        key,
        game,
        fight_description = key,
        name = key,
        aliases = [],
        alignment = "",
        pronouns = { subject: "they", object: "them", possessive: "their" },
        items = [],
        exp = 0,
        max_hp: hp = 1,
        hp_recharge = 0.05, // 5% per turn by default
        max_mp: mp = 1,
        mp_recharge = 0,
        max_sp: sp = 1,
        sp_recharge = 0,
        strength = 1,
        speed = 1,
        coordination = 1,
        agility = 1,
        magic_level = 0,
        healing = 0,
        archery = 0,
        offhand = 0,
        isPlayer = false,
        enemies = [],
        friends = [],
        powers = {},
        weaponName,
        attackVerb: weaponType,
        damage,
        armor,
        hostile = false,
        pacifist = false,
        chase = false,
        respawns = true,
        respawnLocationKey,
        flags = {},
        persist = true,
        following = '',
        buff,
        size = 1,
    }: CharacterParams) {
        this.key = key;
        this.game = game;
        // console.log(`Creating ${this.name}`)
        this.fight_description = fight_description;
        this.name = name;
        this.aliases = aliases;
        this.alignment = alignment;
        this.pronouns = pronouns;
        this.alignment = alignment;
        this.inventory = new Container(
            items.map(item => (this.game.addItem(
                (typeof (item) == 'string' ? { name: item } : item)
            ))).filter(item => item !== undefined) || []
        );
        this.exp_value = exp;
        this.hp = hp;
        this.mp = mp;
        this.sp = sp;

        this.base_stats = {
            max_hp: hp,
            hp_recharge,
            max_mp: mp,
            mp_recharge,
            max_sp: sp,
            sp_recharge,
            strength,
            speed,
            coordination,
            agility,
            magic_level,
            healing,
            archery,
            offhand
        }
        this.isPlayer = isPlayer;
        this.enemies = enemies;
        this.friends = friends;
        this.abilities = powers;
        this.respawns = respawns;
        console.log(`${this.name} ${this.respawns ? 'will' : "won't"} respawn.`)
        this.respawnLocation = respawnLocationKey || this.location?.key;
        this.persist = persist;
        this.weaponName = weaponName || 'fist';
        this.attackVerb = weaponType || 'club';
        if (damage) {
            for (let damageType of Object.keys(damage)) {
                this.base_damage[damageType as DamageTypes] = damage[damageType as DamageTypes] || 0;
            }
        }
        this.hostile = hostile;
        this.pacifist = pacifist
        this.chase = chase;
        this.following = following;
        this.flags = flags;
        if (buff) { this.addBuff(new Buff({ name: 'innate', plus: { defense: armor }, ...buff })); }
        this.size = size;
        this.actionTiming = Object.keys(timeCost).reduce((acc, key) => { acc[key] = 0; return acc }, {} as Record<string, number>);
        this._onAttack = [
            async function (enemy: Character) {
                this.addEnemy(enemy);
                if (!this.attackTarget) {
                    console.log(`${this.unique_id} reacts to an attack from ${enemy.unique_id}.`)
                    this.action({ command: `repel ${enemy.unique_id}`, time: 5 });
                }
            }
        ];
        if (this.alignment) {
            this.on('attack', async (enemy: Character) => {
                for (let char of this.location?.characters ?? []) {
                    if (char != this && char.alignment && char.alignment === this.alignment) {
                        console.log(`${char.unique_id} defends ${this.unique_id}!`)
                        char.addEnemy(enemy);
                    }
                }
            })
        }
        this.onTimer({ command: 'recover', time: 10, repeat: true })

        this.color = this.game.color.bind(this.game);
        this.print = this.game.print.bind(this.game);
        this.input = this.game.input.bind(this.game);
        this.clear = this.game.clear.bind(this.game);
        this.locate = this.game.locate.bind(this.game);
        this.pause = this.game.pause.bind(this.game);
        this.getKey = this.game.getKey.bind(this.game);
    }

    async addBuff(buff: Buff) {
        if (!buff) return;
        await buff.apply(this);
        console.log(`applying buff ${buff.name} to ${this.name}`)  // (${Object.keys(buff.times).reduce((prev, curr) => `${prev} ${curr}: ${buff.times[curr as BaseStats]}`, '')})`)
        if (this.buffs[buff.name]) {
            this.buffs[buff.name] = this.buffs[buff.name].combine(buff);
        } else {
            this.buffs[buff.name] = buff;
        }
        console.log(`power ${this.buffs[buff.name].power}, duration ${this.buffs[buff.name].duration}`)
    }

    removeBuff(buff: string | Buff) {
        if (typeof buff === 'string') buff = this.buffs[buff];
        console.log(`removing buff ${buff.name} from ${this.name}`)
        delete this.buffs[buff.name];
    }

    getBuff(name: string) {
        return this.buffs[name];
    }

    buff_additive(key: BaseStats): number {
        return Object.values(this.buffs).reduce(
            (total, buff) => (buff.plus[key] || 0) + total,
            0
        );
    }

    buff_multiplier(key: BaseStats): number {
        return Object.values(this.buffs).reduce(
            (total, buff) => (buff.times[key] || 0) + total,
            1
        );
    }

    buff_damage_additive(type: DamageTypes): number {
        return Object.values(this.buffs).reduce((total, buff) => {
            const damageBonus = buff.plus.damage?.[type] || 0;
            return total + damageBonus;
        }, 0);
    }

    buff_defense_additive(type: DamageTypes): number {
        return Object.values(this.buffs).reduce((total, buff) => {
            const defenseBonus = buff.plus.defense?.[type] || 0;
            return total + defenseBonus;
        }, 0);
    }

    buff_damage_multiplier(type: DamageTypes): number {
        // return Object.values(this.buffs).reduce((total, buff) => {
        //     const damageMultiplier = buff.times.damage?.[type] || 0;
        //     return total + damageMultiplier;
        // }, 1);
        let dam = 1
        for (let buff of Object.values(this.buffs)) {
            dam += (buff.times?.damage?.[type] ?? 1) - 1;
        }
        return dam
    }

    buff_defense_multiplier(type: DamageTypes): number {
        let def = 1
        // return Object.values(this.buffs).reduce((total, buff) => {
        //     const defenseMultiplier = buff.times.defense?.[type] || 0;
        //     return total + defenseMultiplier;
        // }, 1);
        for (let buff of Object.values(this.buffs)) {
            def += (buff.times?.defense?.[type] ?? 1) - 1;
        }
        return def
    }

    get defenseBuffs(): { plus: DefenseModifiers, times: DefenseModifiers } {
        return Object.values(this.buffs).reduce((total, buff) => {
            total.plus = { ...total.plus, ...buff.plus.defense };
            total.times = { ...total.times, ...buff.times.defense };
            return total;
        }, { plus: {}, times: {} });
    }

    get damageBuffs(): { plus: DamageModifiers, times: DamageModifiers } {
        return Object.values(this.buffs).reduce((total, buff) => {
            total.plus = { ...total.plus, ...buff.plus.damage };
            total.times = { ...total.times, ...buff.times.damage };
            return total;
        }, { plus: {}, times: {} });
    }

    modify_outgoing_damage(baseAmount: number, damageType: DamageTypes): number {
        const additive = this.buff_damage_additive(damageType);
        const multiplier = this.buff_damage_multiplier(damageType);
        return (baseAmount + additive) * multiplier;
    }

    modify_incoming_damage(baseAmount: number, damageType: DamageTypes): number {
        const subtract = highRandom(this.buff_defense_additive(damageType));
        const multiplier = this.buff_defense_multiplier(damageType);
        if (subtract != 0 || multiplier != 1) {
            console.log(`${Math.round(baseAmount * 10) / 10} ${damageType} damage ${subtract ? `reduced by ${subtract} and` : ''} ${multiplier > 1 ? `divided by ${multiplier}` : `multiplied by ${1 / multiplier}`} = ${Math.round((baseAmount - subtract) / multiplier * 10) / 10}`)
        }
        return Math.max((baseAmount - subtract) / multiplier, 0);
    }

    get fighting(): boolean {
        if (!this.attackTarget) return false;
        if (this.actionQueue[0]?.command.startsWith('attack')) return true;
        return this.location?.characters.some(character => this.attackTarget == character) || false;
    }

    findEnemy() {
        if (this.pacifist) return null;
        // this.enemies = this.enemies.filter(enemy => enemy);
        if (this.attackTarget) return this.attackTarget;
        let enemy = this.location?.characters.find(character => this.hasEnemy(character) || this.attackTarget == character) || null;
        if (!enemy && this.hostile) {
            enemy = this.location?.characters.find(character => character.alignment !== this.alignment) || null;
        }
        return enemy;
    }

    hasEnemy(character: Character): boolean {
        if (this.pacifist || character.pacifist) return false;
        if (this.hostile && character.alignment !== this.alignment) return true;
        return this.enemies.includes(character.name) || this.enemies.includes(character.unique_id);
    }

    removeEnemy(character: Character) {
        this.enemies = this.enemies.filter(name => name !== character.name && name !== character.unique_id);
    }

    addEnemy(character: Character) {
        if (this.pacifist || character.pacifist) return;
        if (character == this) return;
        if (!this.hasEnemy(character)) this.enemies.push(character.unique_id);
    }

    async fight(enemy: Character | null = null) {
        if (this.dead) return;
        if (this.pacifist) return;
        if (enemy?.pacifist) {
            for (let action of enemy?._onAttack || []) {
                await action.call(enemy, this);
            }
            return;
        }
        if (enemy === null) {
            if (this.attackTarget) {
                this.removeEnemy(this.attackTarget);
                console.log(`${this.name} is at peace (fight(null)).`)
                this.attackTarget = null;
            }
            // this.fighting = false;
            this.offTimer('repel')
            this.offTimer('attack')
            this.remove_action('attack');
            return;
        } else {
            if (!this.hasEnemy(enemy)) this.addEnemy(enemy);
            if (enemy.location == this.location) {
                console.log(`${this.unique_id} fights ${enemy?.unique_id} at ${this.location?.key}.`)
                this.attackTarget = enemy;
                // this.fighting = true;
                if (!this.hasTimer('attack')) {
                    console.log(`${this.name} intiates attack against ${enemy.name}.`)
                    this.action({ command: 'attack', time: 0 });
                    this.onTimer({ command: 'attack', time: 10, repeat: true });
                }
                for (let action of enemy?._onAttack || []) {
                    await action.call(enemy, this);
                }
            }
        }
    }

    clearEnemies() {
        this.enemies = [];
    }

    get dead() {
        return this.hp <= 0 || this.respawnCountdown > 0 || this.location?.key == '0';
    }

    get max_hp(): number {
        return (this.base_stats.max_hp + this.buff_additive('max_hp')) * this.buff_multiplier('max_hp');
    }

    get max_mp(): number {
        return (this.base_stats.max_mp + this.buff_additive('max_mp')) * this.buff_multiplier('max_mp');
    }

    get max_sp(): number {
        return (this.base_stats.max_sp + this.buff_additive('max_sp')) * this.buff_multiplier('max_sp');
    }

    get hp_recharge(): number {
        return (this.base_stats.hp_recharge + this.buff_additive('hp_recharge')) * this.buff_multiplier('hp_recharge');
    }

    get mp_recharge(): number {
        return (this.base_stats.mp_recharge + this.buff_additive('mp_recharge')) * this.buff_multiplier('mp_recharge');
    }

    get sp_recharge(): number {
        return (this.base_stats.sp_recharge + this.buff_additive('sp_recharge')) * this.buff_multiplier('sp_recharge');
    }

    get hunger(): number {
        return this._hunger;
    }
    set hunger(value: number) {
        this._hunger = Math.max(value, 0);
    }

    get strength(): number {
        return (this.base_stats.strength + this.buff_additive('strength')) * this.buff_multiplier('strength');
    }

    get speed() {
        return (this.base_stats.speed + this.buff_additive('speed')) * this.buff_multiplier('speed');
    }

    get coordination(): number {
        return (this.base_stats.coordination + this.buff_additive('coordination')) * this.buff_multiplier('coordination');
    }

    get agility(): number {
        return (this.base_stats.agility + this.buff_additive('agility')) * this.buff_multiplier('agility');
    }

    get magic_level(): number {
        return (this.base_stats.magic_level + this.buff_additive('magic_level')) * this.buff_multiplier('magic_level');
    }

    get healing(): number {
        return (this.base_stats.healing + this.buff_additive('healing')) * this.buff_multiplier('healing');
    }

    get archery(): number {
        return (this.base_stats.archery + this.buff_additive('archery')) * this.buff_multiplier('archery');
    }

    get offhand(): number {
        return (this.base_stats.offhand + this.buff_additive('offhand')) * this.buff_multiplier('offhand');
    }

    async slay(character: Character | Character[]) {
        // gloat or whatever
        if (this.location?.playerPresent && !(character instanceof Array ? character : [character]).some(char => char.isPlayer)) {
            // don't say this if the playing is slain
            this.game.print(`${this.name} slays ${character instanceof Array ? character.map(char => char.name).join(', ') : character.name}!`)
        }
        await this._onSlay?.(character);
        const enemiesLeft = this.location?.characters.filter(character => this.hasEnemy(character)) || [];
        if (enemiesLeft.length > 0) {
            await this.fight(randomChoice(enemiesLeft));
        } else {
            await this.fight(null);
        }
    }

    has(item_name: string, quantity?: number) { return this.inventory.has(item_name, quantity) };

    async getItem(itemName: string, location?: Container, quantity?: number) {
        const item = (location || this.location)?.item(itemName);
        if (!item) return;
        if (!location) location = this.location || undefined;
        if (!location) return;
        console.log(`${this.name} gets ${item.name} (quantity ${item.quantity})`);
        location.transfer(item, this.inventory, quantity ?? item.quantity);
        if (item.acquire) item.acquire(this);
    }

    async dropItem(itemName: string, quantity: number = 1) {
        const item = this.inventory.item(itemName);
        if (item) {
            this.inventory.transfer(item, this.location ?? this.inventory, quantity);
        }
    }

    async transferItem(item: string | Item | undefined, character: Character, quantity?: number) {
        if (typeof item === 'string') item = this.inventory.item(item);
        if (item) {
            this.inventory.transfer(item, character.inventory, quantity ?? item.quantity);
            if (item.acquire) await item.acquire(character);
        }
    }

    async transferAllItems(character: Character) {
        for (let item of this.inventory.items) {
            await this.transferItem(item, character);
        }
    }

    async giveItem(item: Item | keyof this['game']['itemTemplates'], quantity?: number) {
        if (!(item instanceof Item)) {
            const tempitem = this.game.addItem(
                item instanceof Item ? item : { name: item as string, quantity: quantity ?? 1 }
            );
            if (!tempitem) return;
            item = tempitem;
        }
        const finalitem = item as Item;
        this.inventory.add(finalitem, quantity);
        if (finalitem.acquire) await finalitem.acquire(this);
    }

    async removeItem(item: string | Item | undefined, quantity: number = 1) {
        if (typeof item === 'string') item = this.inventory.item(item);
        if (item) {
            this.inventory.remove(item, quantity);
        }
    }

    get items() {
        return this.inventory.items;
    }

    set items(items: Item[]) {
        this.inventory.items = items;
    }

    clearInventory() {
        this.inventory.clear();
    }

    itemCount(itemName: string) {
        return this.inventory.count(itemName);
    }

    item(itemName: string) {
        return this.inventory.item(itemName);
    }

    async can_go(direction: string, from: Location | null = null): Promise<boolean> {
        if (!from) from = this.location;
        if (!from) return false;
        const newLocation = from.adjacent.get(direction);
        if (!from.adjacent?.has(direction)) {
            console.log(`Can't go ${direction} from ${from.name}.`)
            return false;
        } else if (!newLocation) {
            console.log(`Unexpected error: ${direction} exists but location is undefined.`);
            return false;
        } else if (
            newLocation.characters.reduce((sum, character) => sum + character.size, 0) + this.size > (newLocation.size || 5)
        ) {
            // console.log(`Can't go ${direction} from ${from.name} because it's too crowded.`)
            return false;
        }
        for (let character of from.characters) {
            if (character !== this && !await character.allowDepart(this, direction)) {
                // console.log(`${this.name} blocked from going ${direction} by ${character.name}`);
                return false;
            }
        }
        return true;
    }

    async go(direction: string): Promise<void> {
        // no check is performed here, so can_go should be called first
        if (!this.location) return
        console.log(`${this.unique_id} goes ${direction}`)
        const newLocation = this.location.adjacent.get(direction);
        if (newLocation) {
            this.backDirection = Array.from(newLocation.adjacent?.keys()).find(key => newLocation.adjacent?.get(key) === this.location) || '';
            for (let character of this.location.characters) {
                if (character !== this) {
                    await character.depart(this, direction);
                }
            }
            await this.relocate(newLocation);
        }
    }

    async goto(location: string | Location | null) {
        if (location == null) {
            console.log(`${this.name} goes nowhere.`)
            this.actionQueue = [];
            return;
        }
        if (typeof location === 'string') {
            const loc = this.game.find_location(location);
            if (loc) { location = loc }
            else { console.log(`${location} not found.`); return this }
        }
        console.log(`${this.name} goes to ${location.name} from ${this.location?.name}`)
        if (this.location) this.actionQueue = this.findPath(location).map(direction => ({ command: `go ${direction}`, time: 10 }));
        // console.log(`path is ${this.actionQueue}`)
        return this;
    }

    async relocate(newLocation: Location | null, direction?: string) {
        if (!this.respawnLocation) {
            this.respawnLocation = newLocation?.key;
            // console.log(`${this.name} will respawn respawn at ${this.respawnLocationKey}.`)
        }
        this.lastLocation = this.location;
        // console.log(`${this.name} relocates to ${newLocation?.name} from ${this.location?.name}`)
        await this.location?.exit(this, direction);
        if (this.location) this.exit(this.location);
        this.location = newLocation;
        await newLocation?.enter(this);
        if (newLocation) this.enter(newLocation);
        for (let character of newLocation?.characters ?? []) {
            if (character !== this) {
                await character.encounter(this);
                await this.encounter(character);
            }
        }
    }

    findPath(end: Location): string[] {
        if (!this.location) return [];
        return findPath(this.location, end, this);
    }

    async die(cause?: any) {
        this.hp = Math.min(this.hp, 0);
        await this._onDeath?.(cause);
        if (!this.dead) return;
        console.log(`${this.name} dies from ${cause?.name ?? 'no reason'}.`)
        this.actionQueue = [];
        this.reactionQueue = [];
        await this.fight(null);
        if (this.location) {
            for (let item of this.inventory) {
                // copy items so they will still have the stuff when they respawn
                const dropItem = Object.assign(new Item({ name: item.name, game: this.game }), item);
                this.location?.add(dropItem)
            }
        }
        if (this.respawns) {
            this.respawnCountdown = this.respawnTime;
            console.log(`${this.name} respawning in ${this.respawnCountdown} seconds from ${this.location?.name}`);
        }
        this.location?.removeCharacter(this);
        this.location = null;
    }

    async respawn() {
        if (!this.respawns) return;
        this.actionQueue = [];
        this.reactionQueue = [];
        await this._onRespawn?.()
        this.time = 0;
        const location = randomChoice(this.game.find_all_locations(this.respawnLocation?.toString() ?? '0'))
        if (location) {
            console.log(`${this.name} respawns at ${location.name}`)
            await this.relocate(location);
            this.hp = this.max_hp;
            this.mp = this.max_mp;
            this.sp = this.max_sp;
        } else {
            console.log(`${this.name} is lost forever.`)
        }
    }

    autoheal() {
        if (this.hp < this.max_hp && !this.fighting) {
            this.recoverStats({ hp: this.hp_recharge * this.max_hp, mp: this.mp_recharge * this.max_mp, sp: this.sp_recharge * this.max_sp });
            console.log(`${this.name} heals to ${this.hp} hp`)
        }
    }

    recoverStats({ hp = 0, sp = 0, mp = 0 }: { hp?: number, sp?: number, mp?: number }) {
        this.hp = Math.min(this.max_hp, this.hp + hp);
        this.sp = Math.min(this.max_sp, this.sp + sp);
        this.mp = Math.min(this.max_mp, this.mp + mp);
    }

    onDialog(action: Action) {
        this._onDialog = action.bind(this);
        return this
    }

    onAttack(action: (this: Character, character: Character) => Promise<void>) {
        this._onAttack.push(action.bind(this));
        return this;
    }

    onEncounter(action: (this: Character, character: Character) => Promise<void>) {
        this._onEncounter = action.bind(this);
        return this;
    }

    onDeparture(action: (this: Character, character: Character, direction: string) => Promise<void>) {
        this._onDeparture = action.bind(this);
        return this;
    }

    allowDeparture(action: (this: Character, character: Character, direction: string) => Promise<boolean>) {
        this._allowDeparture = action.bind(this);
        return this;
    }

    onEnter(action: (this: Character, location: Location) => Promise<void>) {
        this._onEnter = action.bind(this);
        return this;
    }

    onLeave(action: (this: Character, location: Location) => Promise<void>) {
        this._onLeave = action.bind(this);
        return this;
    }

    onSlay(action: (this: Character, character: Character | Character[]) => Promise<void>) {
        this._onSlay = action.bind(this);
        return this;
    }

    onDeath(action: (this: Character, cause: any) => Promise<void>) {
        this._onDeath = action.bind(this);
        return this;
    }

    onIdle(action: ((this: Character) => Promise<void>) | null) {
        this._onIdle = action ? action.bind(this) : null;
        return this;
    }

    fightMove(action: (this: Character) => Promise<void>) {
        this._fightMove = action.bind(this);
        return this;
    }

    onRespawn(action: (this: Character) => Promise<void>) {
        this._onRespawn = action.bind(this);
        return this;
    }

    onDealDamage(action: (this: Character, target: Character, damage: Partial<{ [key in DamageTypes]: number }>) => Promise<void>) {
        this._onDealDamage = action.bind(this);
        return this;
    }

    on(
        event: 'dialog' | 'encounter' | 'departure' | 'enter' | 'leave' | 'slay' | 'death' | 'idle' | 'respawn' | 'fight' | 'attack' | 'deal damage',
        action: (args?: any) => Promise<void>) {
        switch (event) {
            case 'dialog': this._onDialog = action.bind(this); break;
            case 'encounter': this._onEncounter = action.bind(this); break;
            case 'departure': this._onDeparture = action.bind(this); break;
            case 'enter': this._onEnter = action.bind(this); break;
            case 'leave': this._onLeave = action.bind(this); break;
            case 'slay': this._onSlay = action.bind(this); break;
            case 'death': this._onDeath = action.bind(this); break;
            case 'idle': this._onIdle = action.bind(this); break;
            case 'respawn': this._onRespawn = action.bind(this); break;
            case 'fight': this._fightMove = action.bind(this); break;
            case 'attack': this._onAttack.push(action.bind(this)); break;
            case 'deal damage': this._onDealDamage = action.bind(this); break;
        }
        return this;
    }

    off(event: 'dialog' | 'encounter' | 'departure' | 'enter' | 'leave' | 'slay' | 'death' | 'idle' | 'respawn' | 'fight' | 'attack') {
        switch (event) {
            case 'dialog': this._onDialog = undefined; break;
            case 'encounter': this._onEncounter = undefined; break;
            case 'departure': this._onDeparture = undefined; break;
            case 'enter': this._onEnter = undefined; break;
            case 'leave': this._onLeave = undefined; break;
            case 'slay': this._onSlay = undefined; break;
            case 'death': this._onDeath = undefined; break;
            case 'idle': this._onIdle = null; break;
            case 'respawn': this._onRespawn = undefined; break;
            case 'fight': this._fightMove = undefined; break;
            case 'attack': this._onAttack.pop(); break;
        }
        return this;
    }

    interaction(name: string, action: (args?: string) => Promise<void>) {
        this.interactions.set(name, action.bind(this));
        return this;
    }

    async talk(character: Character) {
        await this._onDialog?.(character);
    }

    async encounter(character: Character) {
        if (this.dead) return;
        await this._onEncounter?.(character);
        if (!this.fighting && this.hasEnemy(character)) {
            await this.fight(character);
        }
    }

    private async allowDepart(character: Character, direction: string): Promise<boolean> {
        const allow = this._allowDeparture ? await this._allowDeparture?.(character, direction) : true;
        if (allow && this.attackTarget == character && this.chase) {
            // give chase
            console.log(`${this.name} chases ${character.name} ${direction}!`)
            this.action({ command: `go ${direction}` });
        } else if (allow && this.following == character.name) {
            console.log(`${this.name} follows ${character.name} ${direction}!`)
            this.push_action({ command: `go ${direction}` });
        }
        return allow;
    }

    async depart(character: Character, direction: string) {
        if (this.attackTarget == character) {
            // this.fighting = false;
            this.attackTarget = null;
            console.log(`${this.name} stops fighting ${character.name} because they left the area.`)
        }
        await this._onDeparture?.(character, direction);
    }

    async enter(location: Location) {
        await this._onEnter?.(location);
    }

    async exit(location: Location) {
        await this._onLeave?.(location);
    }

    get evasion() {
        return this.agility * Math.random();
    }

    get accuracy() {
        return this.coordination * Math.random()
    }

    action({ command, time = 10 }: { command: string, time?: number }) {
        this.actionQueue = [{ command, time }];
        // this.time = 0;
        console.log(`${this.unique_id} actions ${command} in ${time} deci-seconds.`)
    }

    push_action({ command, time = 10 }: { command: string, time?: number }) {
        this.actionQueue.unshift({ command, time });
    }

    queue_action({ command, time = 10 }: { command: string, time?: number }) {
        this.actionQueue.push({ command, time });
    }

    remove_action(command: string) {
        this.actionQueue = this.actionQueue.filter(action => !action.command.startsWith(command));
    }

    clear_actions() {
        this.actionQueue = [];
    }

    onTimer({ command, time, repeat = false }: { command: string, time: number, repeat?: boolean }) {
        this.reactionQueue.push({ command, time, repeat: repeat ? time : undefined });
    }

    offTimer(command?: string) {
        if (command) {
            // console.log(`${this.unique_id} offTimer ${command} removed ${this.reactionQueue.filter(reaction => reaction.command.startsWith(command))}.`)
            this.reactionQueue = this.reactionQueue.filter(reaction => !reaction.command.startsWith(command));
        } else {
            this.reactionQueue = [];
        }
    }

    hasTimer(command: string) {
        return this.reactionQueue.find(reaction => reaction.command.startsWith(command));
    }

    async execute({ command, time }: { command: string, time: number }) {
        this.time -= time;
        let [verb, args] = splitFirst(command);
        // console.log(`${this.name} action ${verb}: ${args}`)
        if (verb == 'go') verb = args;
        if (this.location?.adjacent.has(verb)) {
            if (await this.can_go(verb)) {
                await this.go(verb);
            } else {
                // try again next turn
                this.push_action({ command: command });
            }
        } else if (verb == 'attack') {
            if (this.attackTarget && this.attackTarget.location === this.location) {
                await this.attack(this.attackTarget, this.weaponName, this.base_damage);
                if (!this.attackTarget?.dead) await this._fightMove?.();
            } else {
                this.attackTarget = null;
                // this.fighting = false;
            }
        } else if (verb == 'repel') {
            console.log(`${this.name} repels ${args}`)
            const attacker = args ? this.game.find_character(args) : this.attackTarget;
            if (attacker) await this.repel(attacker);
        } else if (verb == 'recover') {
            // console.log('recover')
            this.autoheal();
        } else if (verb == 'wait' || verb == 'wait') {
            return;
        }
    }

    async attack(
        target: Character | null = null,
        weapon: Item | string | null = null,
        damage_potential: Partial<{ [key in DamageTypes]: number }>
    ) {
        if (!target) target = this.attackTarget;
        // target.action({ command: `repel ${this.unique_id}`, time: 5 });
        if (!target || target.dead || this.dead) {
            console.log(`${this.unique_id} can't attack ${target?.unique_id ?? 'nobody'}.`)
            if (target?.dead) { console.log(`${target.name} is dead.`) }
            if (this.dead) { console.log(`${this.name} is dead.`) }
            return;
        }
        // console.log(`${this.name} attacks ${target.name} with ${JSON.stringify(damage_potential)}`)

        const weaponName = weapon instanceof Item ? weapon?.name : weapon || this.weaponName;
        const weaponType = (weapon instanceof Item ? weapon.attackVerb : this.attackVerb) || 'club';

        // hit or not
        const accuracy = this.accuracy;
        const evasion = target.evasion;
        console.log(`${this.name} coordination ${this.coordination} attempts to hit ${target.name} agility ${target.agility}`)
        if (accuracy < evasion || (target.invisible > 0 && Math.random() * 4 > 1)) {
            console.log(`${this.name} misses ${target.name} (${accuracy} < ${evasion})!`);
            if (this.location?.playerPresent)
                this.game.print(this.describeAttack(target, weaponName, weaponType, -1));
            return;
        }
        console.log(`${this.name} hits ${target.name} (${accuracy} > ${evasion})!`);

        let damage: Partial<{ [key in DamageTypes]: number }> = {}
        for (let key of Object.keys(damage_potential)) {
            if (damage_potential[key as DamageTypes] === 0) continue;
            const damKey = key as DamageTypes;
            damage[damKey] = highRandom(this.modify_outgoing_damage(damage_potential[damKey] || 0, damKey));
            damage[damKey] = target.modify_incoming_damage(damage[damKey], key as DamageTypes)
            damage[damKey] = damage[damKey] < 0 ? 0 : damage[damKey]
            console.log(`${this.name} does ${damage[damKey]} ${key} damage to ${target.name}`)
        }

        console.log(`${this.name} attacks with {${Object.entries(damage).map(([key, value]) => `${key}: ${value}`).join(', ')}}`)

        //Damage total
        let tdam = Object.values(damage).reduce((prev, curr) => prev + curr, 0)

        //Output screen
        if (this.location?.playerPresent)
            this.game.print(this.describeAttack(target, weaponName, weaponType, tdam))
        await target.hurt(damage, this)

        if (target.dead) {
            await this.slay(target);
        }
    }

    async hurt(damage: Partial<{ [key in DamageTypes]: number }>, cause: any) {
        if (cause instanceof Character) {
            await cause._onDealDamage?.(this, damage);
        }
        let tdam = Object.values(damage).reduce((prev, curr) => prev + curr, 0)
        this.hp -= tdam;
        console.log(`${this.name} takes ${tdam} damage from ${cause.name || cause}, ${this.hp} hp left.`)
        if (this.hp <= 0) {
            await this.die(cause);
        }
    }

    describeAttack(target: Character, weaponName: string, weaponType: string, damage: number, call_attack = false): string {
        console.log(`${this.name} hits ${target.name} for ${damage} damage!`)
        let does = '';
        if (damage < 0) {
            return `${this.name} misses ${target.name}!`;
        }
        does = `${this.name} attacks ${target.name} with ${weaponName} for ${damage}% damage!`
        if (damage > 100) {
            does += `\n${target.name} is slain!`
        }
        return does;
    }

    async repel(attacker: Character) {
        this.addEnemy(attacker);
        if (!this.fighting) {
            console.log(`${this.unique_id} fights back against ${attacker.unique_id}!`)
            await this.fight(attacker);
        }
    }

    async idle() {
        this.time = 0;
        await this._onIdle?.();
        if (!this.attackTarget) {
            let enemy = this.findEnemy();
            if (enemy) {
                console.log(`${this.name} picks a fight with ${enemy.name}.`)
                await this.fight(enemy);
            }
        }
    }

    async turn() {
        if (this.actionQueue.length > 0) {
            const next_action = this.actionQueue.shift();
            if (next_action) await this.execute(next_action);
        } else {
            this.idle();
        }
    }

    save(): object {
        // save only stuff that might change
        const saveObject: { [key: string]: any } = {
            key: this.key,
            unique_id: this.unique_id,
            respawn: this.respawns,
            respawnLocation: this.respawnLocation,
            backDirection: this.backDirection,
            alignment: this.alignment,
        }
        if (this.name !== this.key) {
            saveObject['name'] = this.name;
        }
        if (this.time != 0) {
            saveObject['time'] = this.time;
        }
        if (this.chase) {
            saveObject['chase'] = true;
        }
        if (this.hostile) {
            saveObject['hostile'] = true;
        }
        if (this.following) {
            saveObject['following'] = this.following;
        }
        if (this.hp != this.max_hp) {
            saveObject['hp'] = this.hp;
        }
        if (this.leader) {
            saveObject['leader'] = typeof this.leader == 'string' ? this.leader : this.leader.name;
        }
        if (this.respawnCountdown != 0) {
            saveObject['respawnCountdown'] = this.respawnCountdown;
        }
        if (this.actionQueue.length > 0) {
            saveObject['actionQueue'] = this.actionQueue;
        }
        if (Object.keys(this.buffs).length > 0) {
            saveObject['buffs'] = Object.values(this.buffs).map(buff => buff.save());
        }
        if (this.enemies.length > 0) {
            saveObject['enemies'] = this.enemies;
        }
        if (Object.keys(this.items).length > 0) {
            saveObject['items'] = this.items.filter(item => item).map(item => item.save());
        }
        if (Object.keys(this.flags).length > 0) {
            saveObject['flags'] = this.flags;
        }
        if (Object.keys(this.enemies).length > 0) {
            saveObject['enemies'] = this.enemies;
        }
        return saveObject;
    }
}

export { Character, CharacterParams, pronouns, Buff, BuffModifiers, BaseStats, DamageTypes, damageTypesList };