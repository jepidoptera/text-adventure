import { Container, Item } from "./item.js";
import { Location, findPath } from "./location.js";
import { GameState, withGameState } from "./game.js";
import { WeaponTypes } from "./item.js";
import { highRandom, randomChoice } from "./utils.js";

const pronouns = {
    'male': { subject: "he", object: "him", possessive: "his" },
    'female': { subject: "she", object: "her", possessive: "her" },
    'neutral': { subject: "they", object: "them", possessive: "their" },
    'inhuman': { subject: "it", object: "it", possessive: "its" }
}

type Action = (this: Character, ...args: any[]) => Promise<void>;
type BaseStats =
    'max_hp' | 'max_mp' | 'max_sp' | 'strength' | 'speed' | 'coordination' |
    'agility' | 'magic_level' | 'healing' | 'archery' | 'hp_recharge' |
    'mp_recharge' | 'sp_recharge' | 'offhand';

const damageTypesList = ['blunt', 'sharp', 'magic', 'fire', 'electric', 'cold', 'sonic', 'poison'] as const;
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
    private _onApply: ((this: Buff) => Promise<void>) | null = null;
    private _onExpire: ((this: Buff) => Promise<void>) | null = null;
    private _onTurn: ((this: Buff) => Promise<void>) | null = null;
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
    onApply(action: (this: Buff) => Promise<void>) {
        this._onApply = action.bind(this);
        return this;
    }
    async apply(character: Character) {
        this.character = character;
        await this._onApply?.();
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
        this.duration -= 1;
        await this._onTurn?.();
        if (this.duration === 0) {
            await this.expire();
            this.character.removeBuff(this);
        }
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
    name: string;
    game: GameState;
    class_name?: string;
    description?: string;
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
    weapon?: Item | { name: string, type: WeaponTypes, damage_type?: DamageTypes };
    attackVerb?: WeaponTypes;
    weaponName?: string;
    damage?: Partial<{ [key in DamageTypes]: number }>;
    armor?: Partial<{ [key in DamageTypes]: number }>;
    attackPlayer?: boolean;
    chase?: boolean;
    flags?: { [key: string]: any };
    respawn_time?: number;
    respawns?: boolean;
    respawnLocationKey?: string | number | undefined;
    persist?: boolean;
    following?: string;
    buff?: { plus?: BuffModifiers, times?: BuffModifiers };
}

class Character {
    key: string = '';
    name: string;
    class_name: string = "";
    game: GameState;
    description: string;
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
    weaponName: string = "";
    attackVerb: WeaponTypes = 'club';
    armor: { [key: string]: Item } = {};
    base_damage: { [key in DamageTypes]: number } = { blunt: 0, sharp: 0, magic: 0, fire: 0, electric: 0, cold: 0, sonic: 0, poison: 0 };
    base_defense: { [key in DamageTypes]: number } = { blunt: 0, sharp: 0, magic: 0, fire: 0, electric: 0, cold: 0, sonic: 0, poison: 0 };
    readonly buffs: { [key: string]: Buff } = {};
    location: Location | null = null;
    backDirection: string = '';
    abilities: { [key: string]: number };
    flags: { [key: string]: any } = {};
    private _attackTarget: Character | null = null;
    private _onEncounter: ((character: Character) => Promise<void>) | undefined;
    private _onDeparture: ((character: Character, direction: string) => Promise<boolean>) | undefined;
    private _onEnter: Action | undefined;
    private _onLeave: Action | undefined;
    private _onSlay: Action | undefined;
    private _onDeath: Action | undefined;
    private _onAttack: Action | undefined;
    private _onTurn: Action | null = null;
    private _fightMove: Action | undefined;
    private _onRespawn: Action | undefined;
    private _onDialog: Action | undefined = async () => { print("They don't want to talk") };
    private _actions: Map<string, (...args: any[]) => Promise<void>> = new Map()
    attackPlayer: boolean = false;
    chase: boolean = false;
    respawnTime: number = 0;
    respawnCountdown: number = 0;
    respawnLocation: string | number | undefined;
    respawns: boolean;
    persist: boolean = true;
    timeCounter: number = 0;
    following: string = '';
    actionQueue: string[] = [];

    constructor({
        name,
        game,
        description = "",
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
        attackPlayer = false,
        chase = false,
        respawns = true,
        respawnLocationKey,
        flags = {},
        persist = true,
        following = '',
        buff,
    }: CharacterParams) {
        this.name = name;
        this.game = game;
        // console.log(`Creating ${this.name}`)
        this.description = description;
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
        this.respawnLocation = respawnLocationKey || this.location?.key;
        this.persist = persist;
        this.weaponName = weaponName || 'fist';
        this.attackVerb = weaponType || 'club';
        if (armor) {
            for (let defenseType of Object.keys(armor)) {
                this.base_defense[defenseType as DamageTypes] += armor[defenseType as DamageTypes] || 0;
            }
        }
        if (damage) {
            for (let damageType of Object.keys(damage)) {
                this.base_damage[damageType as DamageTypes] += damage[damageType as DamageTypes] || 0;
            }
        }
        this.attackPlayer = attackPlayer;
        this.chase = chase;
        this.following = following;
        this.flags = flags;
        if (buff) { this.addBuff(new Buff({ name: 'innate', ...buff })); }
    }

    initialize(game: GameState) {
        this.game = game;
    }

    async addBuff(buff: Buff) {
        if (!buff) return;
        await buff.apply(this);
        // console.log(`applying buff ${buff.name} to ${this.name} (${Object.keys(buff.times).reduce((prev, curr) => `${prev} ${curr}: ${buff.times[curr as BaseStats]}`, '')})`)
        this.buffs[buff.name] = buff;
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
        return Object.values(this.buffs).reduce((total, buff) => {
            const damageMultiplier = buff.times.damage?.[type] || 0;
            return total + damageMultiplier;
        }, 1);
    }

    buff_defense_multiplier(type: DamageTypes): number {
        return Object.values(this.buffs).reduce((total, buff) => {
            const defenseMultiplier = buff.times.defense?.[type] || 0;
            return total + defenseMultiplier;
        }, 1);
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

    damage(baseAmount: number, damageType: DamageTypes): number {
        const additive = this.buff_damage_additive(damageType);
        const multiplier = this.buff_damage_multiplier(damageType);
        return (baseAmount + additive) * multiplier;
    }

    modify_damage(baseAmount: number, damageType: DamageTypes): number {
        const subtract = highRandom(this.buff_defense_additive(damageType));
        const multiplier = this.buff_defense_multiplier(damageType);
        if (subtract != 0 || multiplier != 1) {
            console.log(`${damageType} damage reduced by ${subtract} and multiplied by ${multiplier} = ${baseAmount - subtract} * ${multiplier}`)
        }
        return Math.max((baseAmount - subtract) / multiplier, 0);
    }

    get fighting(): boolean {
        return this.attackTarget !== null && this.attackTarget.location === this.location;
    }

    fight(character: Character | null = null) {
        if (this.dead) return;
        console.log(`${this.name} fights ${character?.name || 'nobody'} at ${this.location?.key}.`)
        if (character === null) {
            this._attackTarget = null;
            this.enemies = [];
            console.log(`${this.name} stops fighting.`)
        } else if (character != this.attackTarget) {
            if (character.location == this.location) {
                this._attackTarget = character;
                if (!this.enemies.includes(character.name)) {
                    this.enemies.push(character.name);
                }
                if (!character.enemies.includes(this.name)) {
                    character.enemies.push(this.name);
                }
            } else if (!this.enemies.includes(character.name)) {
                this.enemies.push(character.name);
            }
        }
    }

    get attackTarget() {
        return this._attackTarget;
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
        await this._onSlay?.(character);
        const enemiesLeft = this.location?.characters.filter(character => this.enemies.includes(this.name)) || [];
        if (enemiesLeft.length > 0) {
            this.fight(randomChoice(enemiesLeft));
        } else {
            this.fight(null);
        }
    }

    has = (item_name: string, quantity?: number) => this.inventory.has(item_name, quantity);

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

    async giveItem(item: Item | string | { name: string, quantity: number }, quantity?: number) {
        if (!(item instanceof Item)) {
            const tempitem = this.game.addItem(
                typeof item == 'string' ? { name: item } : item
            );
            if (!tempitem) return;
            item = tempitem;
        }
        const finalitem = item as Item;
        this.inventory.add(finalitem, quantity);
        if (finalitem.acquire) await finalitem.acquire(this);
    }

    async removeItem(item: string | Item | undefined, quantity?: number) {
        if (typeof item === 'string') item = this.inventory.item(item);
        if (item) {
            this.inventory.remove(item, quantity ?? item.quantity);
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

    async can_go(direction: string): Promise<boolean> {
        if (!this.location?.adjacent?.has(direction)) {
            console.log(`Can't go ${direction} from ${this.location?.name}.`)
            return false;
        } else if (!this.location.adjacent.get(direction)) {
            console.log(`Unexpected error: ${direction} exists but location is undefined.`);
            return false;
        }
        for (let character of this.location.characters) {
            if (!await character.allowDepart(this, direction)) {
                console.log(`${this.name} blocked from going ${direction} by ${character.name}`);
                return false;
            }
        }
        return true;
    }

    async go(direction: string): Promise<void> {
        if (!this.location || !await this.can_go(direction)) { return }
        console.log(`${this.name} goes ${direction}`)
        const newLocation = this.location.adjacent.get(direction);
        const lastLocation = this.location;
        if (newLocation) {
            await this.relocate(newLocation);
            if (this.location?.adjacent?.keys) {
                this.backDirection = Array.from(this.location?.adjacent?.keys()).find(key => this.location?.adjacent?.get(key) === lastLocation) || '';
            }
        }
    }

    async goto(location: string | Location) {
        if (typeof location === 'string') {
            const loc = this.game.find_location(location);
            if (loc) { location = loc }
            else { return this }
        }
        console.log(`${this.name} goes to ${location.name} from ${this.location?.name}`)
        if (this.location) this.actionQueue = findPath(this.location, location);
        console.log(`path is ${this.actionQueue}`)
        return this;
    }

    async relocate(newLocation: Location | null, direction?: string) {
        if (!this.respawnLocation) {
            this.respawnLocation = newLocation?.key;
            // console.log(`${this.name} will respawn respawn at ${this.respawnLocationKey}.`)
        }
        // console.log(`${this.name} relocates to ${newLocation?.name} from ${this.location?.name}`)
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
    }

    async die(cause?: any) {
        this.hp = Math.min(this.hp, 0);
        await this._onDeath?.(cause);
        if (!this.dead) return;
        console.log(`${this.name} dies from ${cause?.name ?? 'no reason'}.`)
        // if (this.location) this.inventory.transferAll(this.location);
        if (this.location) {
            for (let item of this.inventory) {
                // copy items so they will still have the stuff when they respawn
                const dropItem = Object.assign(new Item({ name: item.name }), item);
                this.location?.add(dropItem)
            }
        }
        if (this.respawns) {
            this.respawnCountdown = this.respawnTime;
            console.log(`${this.name} respawning in ${this.respawnCountdown} seconds from ${this.location?.name}`);
            // this.respawnLocation = this.location;
        }
        this.location?.removeCharacter(this);
        this.location = null;
    }

    async respawn() {
        if (!this.respawns) return;
        await this._onRespawn?.()
        this.timeCounter = 0;
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
        this._onAttack = action.bind(this);
        return this;
    }

    onEncounter(action: (this: Character, character: Character) => Promise<void>) {
        this._onEncounter = action.bind(this);
        return this;
    }

    onDeparture(action: (this: Character, character: Character, direction: string) => Promise<boolean>) {
        this._onDeparture = action.bind(this);
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

    onTurn(action: ((this: Character) => Promise<void>) | null) {
        this._onTurn = action ? action.bind(this) : null;
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

    addAction(name: string, fn: (args?: string) => Promise<void>) {
        // wrap the action function to ensure correct game context
        const wrappedFn = async function (this: Character, args?: string) {
            await this.game.enterContext();
            try {
                return fn.apply(this, [args]);
            } finally {
                this.game.exitContext();
            }
        };
        this.actions.set(name, wrappedFn.bind(this));
        return this;
    }

    getAction(name: string) {
        const action = this.actions.get(name);
        if (!action) {
            throw new Error(`Action "${name}" not found.`);
        }
        return action;
    }

    get actions() {
        return this._actions;
    }

    useAction(name: string, args?: string): Promise<void> {
        const action = this.getAction(name);
        return action.call(this, args);
    }

    removeAction(name: string) {
        this.actions.delete(name);
        return this;
    }

    async talk(character: Character) {
        await this._onDialog?.(character);
    }

    async encounter(character: Character) {
        await this._onEncounter?.(character);
        if (!this.fighting) {
            if (this.enemies.includes(character.name)) {
                this.fight(character);
            } else if (this.attackPlayer && character.isPlayer) {
                this.fight(character);
            }
        }
    }

    async allowDepart(character: Character, direction: string) {
        const allow = this._onDeparture ? await this._onDeparture?.(character, direction) : true;
        if (allow && this.attackTarget == character && this.chase) {
            // give chase
            console.log(`${this.name} chases ${character.name} ${direction}!`)
            this.onTurn(async () => { await this.go(direction) });
        } else if (allow && this.following == character.name) {
            console.log(`${this.name} follows ${character.name} ${direction}!`)
            this.actionQueue.unshift(direction);
        }
        return allow;
    }

    async enter(location: Location) {
        await this._onEnter?.(location);
    }

    async exit(location: Location) {
        await this._onLeave?.(location);
    }

    get evasion() {
        return this.agility * this.speed * Math.random();
    }

    get accuracy() {
        return this.coordination * this.speed * Math.random()
    }

    async attack(
        target: Character | null = null,
        weapon: Item | string | null = null,
        damage_potential: Partial<{ [key in DamageTypes]: number }>
    ) {
        if (!target) target = this.attackTarget;
        if (!target) return;
        await target?.defend(this)
        if (!target || target.dead || this.dead) return;
        if (!damage_potential) damage_potential = this.base_damage;
        console.log(`${this.name} attacks ${target.name} with ${JSON.stringify(damage_potential)}`)

        const weaponName = weapon instanceof Item ? weapon?.name : weapon || this.weaponName;
        const weaponType = (weapon instanceof Item ? weapon.attackVerb : this.attackVerb) || 'club';

        // hit or not
        const accuracy = this.accuracy;
        const evasion = target.evasion;
        console.log(`${this.name} coordination ${this.coordination} attempts to hit ${target.name} agility ${target.agility}`)
        if (accuracy < evasion || (target.invisible > 0 && Math.random() * 4 > 1)) {
            console.log(`${this.name} misses ${target.name} (${accuracy} < ${evasion})!`);
            if (this.location?.playerPresent)
                print(this.describeAttack(target, weaponName, weaponType, -1));
            return;
        }
        console.log(`${this.name} hits ${target.name} (${accuracy} > ${evasion})!`);

        let dam: { [key: string]: number } = {}
        for (let key of Object.keys(damage_potential)) {
            if (damage_potential[key as DamageTypes] === 0) continue;
            dam[key] = highRandom(damage_potential[key as DamageTypes] || 0)
            dam[key] = target.modify_damage(dam[key], key as DamageTypes)
            dam[key] = dam[key] < 0 ? 0 : dam[key]
            console.log(`${this.name} does ${dam[key]} ${key} damage to ${target.name}`)
        }

        //Damage total
        let tdam = Object.values(dam).reduce((prev, curr) => prev + curr, 0)

        //Output screen
        if (this.location?.playerPresent)
            print(this.describeAttack(target, weaponName, weaponType, tdam))
        await target.hurt(tdam, this)

        if (target.dead) {
            await this.slay(target);
        } else {
            //special moves
            await this._fightMove?.()
        }
    }

    async hurt(damage: number, cause: any): Promise<number> {
        this.hp -= damage;
        console.log(`${this.name} takes ${damage} damage, ${this.hp} hp left.`)
        if (this.hp <= 0) {
            await this.die(cause);
        }
        return damage;
    }

    describeAttack(target: Character, weaponName: string, weaponType: string, damage: number): string {
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

    async defend(attacker: Character) {
        if (!this.enemies.includes(attacker.name)) {
            this.enemies.push(attacker.name);
        }
        if (!this.fighting) {
            this.fight(attacker);
        }
        for (let character of this.location?.characters ?? []) {
            if (character != this && character.alignment && character.alignment === this.alignment) {
                console.log(`${character.name} defends ${this.name}!`)
                if (!character.enemies.includes(attacker.name)) character.enemies.push(attacker.name);
            }
        }
        if (this._onAttack) {
            await this._onAttack(attacker);
        }
    }


    async turn() {
        // onTurn only happens if the character is not fighting.
        // if they are, fightMove will be called instead.
        if (!this.fighting) await this._onTurn?.();
        if (this.hp < this.max_hp && !this.fighting) {
            this.recoverStats({ hp: this.hp_recharge * this.max_hp, mp: this.mp_recharge * this.max_mp, sp: this.sp_recharge * this.max_sp });
            console.log(`${this.name} heals to ${this.hp} hp`)
        }
        this.enemies = this.enemies.filter(enemy => enemy);
        if (!this.fighting) {
            for (let enemy of this.game.find_all_characters(this.enemies)) {
                if (enemy.location === this.location) {
                    console.log(`${this.name} picks a fight with ${enemy.name}.`)
                    this.fight(enemy);
                    break;
                }
            }
            if (this.attackPlayer) {
                for (let character of this.location?.characters ?? []) {
                    if (character.isPlayer) {
                        this.fight(character);
                        break;
                    }
                }
            }
        }
        if (this.attackTarget?.location === this.location) {
            // console.log(`${this.name} attacks ${this.attackTarget.name}!`)
            await this.attack(this.attackTarget, this.weaponName, this.base_damage);
            return;
        } else if (this.actionQueue.length > 0) {
            const action = this.actionQueue.shift()!;
            console.log(`${this.name} next action: ${action}`)
            if (this.location?.adjacent.keys().some(key => key === action)) {
                await this.go(action);
            }
            else {
                console.log(`${this.name} can't go ${action}`)
            }
        }
    }

    save(): object {
        // save only stuff that might change
        const saveObject: { [key: string]: any } = {
            key: this.key,
            respawn: this.respawns,
            respawnLocation: this.respawnLocation,
            attackPlayer: this.attackPlayer,
        }
        if (this.timeCounter != 0) {
            saveObject['timeCounter'] = this.timeCounter;
        }
        if (this.chase) {
            saveObject['chase'] = true;
        }
        if (this.following) {
            saveObject['following'] = this.following;
        }
        if (this.hp != this.max_hp) {
            saveObject['hp'] = this.hp;
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
        return saveObject;
    }
}

export { Character, CharacterParams, pronouns, Buff, BuffModifiers, BaseStats, DamageTypes, damageTypesList };