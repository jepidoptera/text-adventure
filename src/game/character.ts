import { Container, Item } from "./item.ts";
import { Location } from "./location.ts";
import { GameState } from "./game.ts";
import { WeaponTypes, weapon_conversions } from "./item.ts";

const pronouns = {
    'male': { subject: "he", object: "him", possessive: "his" },
    'female': { subject: "she", object: "her", possessive: "her" },
    'neutral': { subject: "they", object: "them", possessive: "their" },
    'inhuman': { subject: "it", object: "it", possessive: "its" }
}

type Action = (this: Character, ...args: any[]) => Promise<void>;
type BonusKeys = (
    'hp' | 'mp' | 'sp' | 'strength' | 'coordination' | 'agility' | 'magic_level' | 'healing' |
    'blunt_damage' | 'sharp_damage' | 'magic_damage' | 'blunt_armor' | 'sharp_armor' | 'magic_armor' |
    'archery' | 'hp_recharge' | 'mp_recharge' | 'sp_recharge'
)
type DamageTypes = 'blunt' | 'sharp' | 'magic' | 'fire' | 'electric' | 'cold' | 'sonic'
class Buff {
    private _onApply: ((this: Buff) => Promise<void>) | null = null;
    private _onExpire: ((this: Buff) => Promise<void>) | null = null;
    private _onTurn: ((this: Buff) => Promise<void>) | null = null;
    private _save: ((this: Buff) => object) | null = null;
    public character!: Character;
    public name: string;
    public power: number;
    public duration: number;
    public bonuses: { [key in BonusKeys]?: number };
    public damage_modifier: { [key in DamageTypes]?: (damage: number) => number } = {};
    constructor({ name, duration, power, bonuses = {}, damage_modifier = {} }: {
        name: string,
        duration: number,
        power: number,
        bonuses?: { [key in BonusKeys]?: number }
        damage_modifier?: { [key in DamageTypes]?: (damage: number) => number }
    }) {
        this.name = name;
        this.duration = duration;
        this.power = power;
        this.bonuses = bonuses;
        this.damage_modifier = damage_modifier;
    }
    onApply(action: (this: Buff) => Promise<void>) {
        this._onApply = action.bind(this);
        return this;
    }
    apply(character: Character) {
        this.character = character;
        this._onApply?.();
    }
    onExpire(action: (this: Buff) => Promise<void>) {
        this._onExpire = action.bind(this);
        return this;
    }
    async expire() {
        this._onExpire?.();
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
    save(): object {
        return {
            name: this.name,
            duration: this.duration,
            power: this.power,
            bonuses: this.bonuses
        }
    }
}

interface CharacterParams {
    name: string;
    game?: GameState;
    class_name?: string;
    description?: string;
    aliases?: string[];
    alignment?: string;
    pronouns?: { subject: string, object: string, possessive: string };
    items?: Item[];
    exp?: number;
    hp?: number;
    hp_recharge?: number;
    mp?: number;
    mp_recharge?: number;
    sp?: number;
    sp_recharge?: number;
    strength?: number;
    coordination?: number;
    agility?: number;
    magic_level?: number;
    healing?: number;
    isPlayer?: boolean;
    enemies?: Character[];
    friends?: Character[];
    powers?: { [key: string]: number };
    weapons?: { [key: string]: Item };
    weapon?: Item | { name: string, type: WeaponTypes, damage_type?: DamageTypes };
    weaponType?: WeaponTypes;
    weaponName?: string;
    armor?: { [key: string]: Item };
    blunt_damage?: number;
    sharp_damage?: number;
    magic_damage?: number;
    blunt_armor?: number;
    sharp_armor?: number;
    magic_armor?: number;
    damage_modifier?: { [key in DamageTypes]?: (damage: number) => number };
    attackPlayer?: boolean;
    flags?: { [key: string]: any };
    respawn_time?: number;
}

class Character {
    name: string;
    class_name: string = "";
    game!: GameState;
    description: string;
    aliases: string[] = [];
    alignment: string = "";
    pronouns: { subject: string, object: string, possessive: string } = { subject: "they", object: "them", possessive: "their" };
    isPlayer: boolean;
    dead: boolean = false;
    private inventory: Container;
    _hp: number;
    _max_hp: number;
    _hp_recharge: number = 0;
    _mp: number;
    _max_mp: number;
    _mp_recharge: number = 0;
    _sp: number;
    _max_sp: number;
    _sp_recharge: number = 0;
    experience: number = 0;
    exp_value: number = 0;
    hunger: number = 0;
    _strength: number;
    _coordination: number;
    _agility: number;
    _magic_level: number = 0;
    _healing: number = 0;
    _archery: number = 0;
    invisible: number = 0;
    enemies: Character[] = [];
    friends: Character[] = [];
    weaponName: string = "";
    weaponType: WeaponTypes = 'club';
    damageType: DamageTypes = 'blunt';
    armor: { [key: string]: Item } = {};
    _blunt_damage: number = 0;
    _sharp_damage: number = 0;
    _magic_damage: number = 0;
    _blunt_armor: number = 0;
    _sharp_armor: number = 0;
    _magic_armor: number = 0;
    _damage_modifier: { [key in DamageTypes]?: (damage: number) => number } = {};
    _buffs: { [key: string]: Buff } = {};
    location: Location | null = null;
    abilities: { [key: string]: number };
    actions: Map<string, (...args: any[]) => Promise<void>> = new Map()
    flags: { [key: string]: any } = {};
    private _attackTarget: Character | null = null;
    private _onEncounter: ((character: Character) => Promise<void>) | undefined;
    private _onDeparture: ((character: Character, direction: string) => Promise<boolean>) | undefined;
    private _onEnter: Action | undefined;
    private _onLeave: Action | undefined;
    private _onSlay: Action | undefined;
    private _onDeath: Action | undefined;
    private _onAttack: Action | undefined;
    private _onTurn: Action | undefined;
    private _fightMove: Action | undefined;
    private _onRespawn: Action | undefined;
    attackPlayer: boolean = false;
    respawnTime: number = 0;
    respawnCountdown: number = 0;
    respawnLocationKey: string | number | undefined;

    constructor({
        name,
        game,
        description = "",
        aliases = [],
        alignment = "",
        pronouns = { subject: "they", object: "them", possessive: "their" },
        items = [],
        exp = 0,
        hp = 1,
        hp_recharge = 0,
        mp = 1,
        mp_recharge = 0,
        sp = 1,
        sp_recharge = 0,
        strength = 1,
        coordination = 1,
        agility = 1,
        magic_level = 0,
        healing = 0,
        isPlayer = false,
        enemies = [],
        friends = [],
        powers = {},
        weapon = { name: 'fist', type: 'club' },
        weaponName,
        weaponType,
        blunt_damage = 0,
        sharp_damage = 0,
        magic_damage = 0,
        blunt_armor = 0,
        sharp_armor = 0,
        magic_armor = 0,
        damage_modifier = {},
        armor = {},
        attackPlayer = false,
        flags = {}
    }: CharacterParams) {
        this.name = name;
        if (game) this.game = game;
        // console.log(`Creating ${this.name}`)
        this.description = description;
        this.aliases = aliases;
        this.alignment = alignment;
        this.pronouns = pronouns;
        this.alignment = alignment;
        this.inventory = new Container(items);
        this.exp_value = exp;
        this._hp = hp;
        this._max_hp = hp;
        this._hp_recharge = hp_recharge;
        this._mp = mp;
        this._max_mp = mp;
        this._mp_recharge = mp_recharge;
        this._sp = sp;
        this._max_sp = sp;
        this._sp_recharge = sp_recharge;
        this._strength = strength;
        this._coordination = coordination;
        this._agility = agility;
        this._magic_level = magic_level;
        this._healing = healing;
        this.isPlayer = isPlayer;
        this.enemies = enemies;
        this.friends = friends;
        this.abilities = powers;
        if (weapon instanceof Item) {
            this.weaponName = weapon.name;
            this.weaponType = (weapon as Item).weapon_stats?.type || 'club';
            this.damageType = (weapon as Item).weapon_stats?.damage_type || 'blunt';
        } else if (weaponName) {
            this.weaponName = weaponName;
            this.weaponType = weaponType || 'club';
            this.damageType = weapon_conversions[this.weaponType] || 'blunt';
        } else {
            weapon = weapon as { name: string, type: WeaponTypes, damage_type?: DamageTypes }
            this.weaponName = weapon.name;
            this.weaponType = weapon.type;
            this.damageType = weapon.damage_type || weapon_conversions[weapon.type];
        }
        this.armor = armor;
        this._blunt_armor = blunt_armor;
        this._sharp_armor = sharp_armor;
        this._magic_armor = magic_armor;
        this._damage_modifier = damage_modifier;
        this._blunt_damage = blunt_damage;
        this._sharp_damage = sharp_damage;
        this._magic_damage = magic_damage;
        this.attackPlayer = attackPlayer;
        this.flags = flags;
    }

    initialize(game: GameState) {
        this.game = game;
    }

    addBuff(buff: Buff) {
        buff.apply(this);
        this._buffs[buff.name] = buff;
    }

    removeBuff(buff: Buff) {
        delete this._buffs[buff.name];
    }

    getBuff(name: string) {
        return this._buffs[name];
    }

    get buffs() {
        return this._buffs;
    }

    set buffs(buffs: { [key: string]: Buff }) {
        this._buffs = buffs;
    }

    buff(key: BonusKeys): number {
        const buff = Object.values(this._buffs).reduce(
            (total, buff) => (buff.bonuses[key] || 0) + total,
            0
        );
        if (buff > 0) console.log(`${this.name} has ${key} + ${buff}.`)
        return buff;
    }

    defense_buff(damage: number, type: DamageTypes): number {
        if (damage <= 0) return 0;
        const original_damage = damage
        Object.values(this._buffs).sort().forEach(buff => {
            damage = buff.damage_modifier[type]?.(damage) || damage
        })
        return damage
    }

    get respawnLocation() {
        if (!this.respawnLocationKey) return null;
        return this.game.locations.get(this.respawnLocationKey) || null;
    }

    set respawnLocation(location: Location | null) {
        this.respawnLocationKey = location?.key;
    }

    get fighting(): boolean {
        return this.attackTarget !== null && this.attackTarget.location === this.location;
    }

    fight(character: Character | null = null) {
        console.log(`${this.name} fights ${character?.name || 'nobody'}.`)
        if (character === null) {
            this._attackTarget = null;
            this.enemies = [];
            console.log(`${this.name} stops fighting.`)
        } else if (character != this.attackTarget) {
            if (character.location == this.location) {
                this._attackTarget = character;
                if (!character.enemies.includes(this)) {
                    character.enemies.push(this);
                }
            } else if (!this.enemies.includes(character)) {
                this.enemies.push(character);
            }
        }
    }

    get attackTarget() {
        return this._attackTarget;
    }

    get max_hp(): number {
        return this._max_hp + this.buff('hp');
    }
    set max_hp(value: number) {
        this._max_hp = value - this.buff('hp');
    }
    get max_mp(): number {
        return this._max_mp + this.buff('mp');
    }
    set max_mp(value: number) {
        this._max_mp = value - this.buff('mp');
    }
    get max_sp(): number {
        return this._max_sp + this.buff('sp');
    }
    set max_sp(value: number) {
        this._max_sp = value - this.buff('sp');
    }
    get hp(): number {
        return this._hp;
    }
    set hp(value: number) {
        this._hp = Math.min(value, this.max_hp);
    }
    get hp_recharge(): number {
        return this._hp_recharge + this.buff('hp_recharge');
    }
    set hp_recharge(value: number) {
        this._hp_recharge = value - this.buff('hp_recharge');
    }
    get mp(): number {
        return this._mp;
    }
    set mp(value: number) {
        this._mp = Math.min(value, this.max_mp);
    }
    get mp_recharge(): number {
        return this._mp_recharge + this.buff('mp_recharge');
    }
    set mp_recharge(value: number) {
        this._mp_recharge = value - this.buff('mp_recharge');
    }
    get sp(): number {
        return this._sp;
    }
    set sp(value: number) {
        this._sp = Math.min(value, this.max_sp);
    }
    get sp_recharge(): number {
        return this._sp_recharge + this.buff('sp_recharge');
    }
    set sp_recharge(value: number) {
        this._sp_recharge = value - this.buff('sp_recharge');
    }
    blunt_damage(weapon: Item | null = null) {
        return (this._blunt_damage || this.strength * (weapon?.weapon_stats?.blunt_damage || 0)) + this.buff('blunt_damage');
    }
    sharp_damage(weapon: Item | null = null) {
        return (this._sharp_damage || this.strength * (weapon?.weapon_stats?.sharp_damage || 0)) + this.buff('sharp_damage');
    }
    magic_damage(weapon: Item | null = null) {
        return (this._magic_damage || this.magic_level * (weapon?.weapon_stats?.magic_damage || 0)) + this.buff('magic_damage');
    }
    get blunt_armor(): number {
        return this._blunt_armor + this.buff('blunt_armor');
    }
    set blunt_armor(value: number) {
        this._blunt_armor = value - this.buff('blunt_armor');
    }
    get sharp_armor(): number {
        return this._sharp_armor + this.buff('sharp_armor');
    }
    set sharp_armor(value: number) {
        this._sharp_armor = value - this.buff('sharp_armor');
    }
    get magic_armor(): number {
        return this._magic_armor + this.buff('magic_armor');
    }
    set magic_armor(value: number) {
        this._magic_armor = value - this.buff('magic_armor');
    }
    get strength(): number {
        return this._strength + this.buff('strength');
    }
    set strength(value: number) {
        this._strength = value - this.buff('strength');
    }
    get coordination(): number {
        return this._coordination + this.buff('coordination');
    }
    set coordination(value: number) {
        this._coordination = value - this.buff('coordination');
    }
    get agility(): number {
        return this._agility + this.buff('agility');
    }
    set agility(value: number) {
        this._agility = value - this.buff('agility');
    }
    get magic_level(): number {
        return this._magic_level + this.buff('magic_level');
    }
    set magic_level(value: number) {
        this._magic_level = value - this.buff('magic_level');
    }
    get healing(): number {
        return this._healing + this.buff('healing');
    }
    set healing(value: number) {
        this._healing = value - this.buff('healing');
    }
    get archery(): number {
        return this._archery + this.buff('archery');
    }
    set archery(value: number) {
        this._archery = value - this.buff('archery');
    }
    damage_modifier(damage: number, type: DamageTypes): number {
        const original_damage = damage;
        damage = this._damage_modifier[type] ? this._damage_modifier[type](damage) : damage;
        damage = this.defense_buff(damage, type);
        if (damage < original_damage) console.log(`Damage reduced from ${original_damage} to ${damage}`)
        return damage;
    }

    async slay(character: Character) {
        // gloat or whatever
        await this._onSlay?.(character);
        if (this.attackTarget == character) {
            this.fight(null);
        }
    }

    has = (item_name: string, quantity?: number) => this.inventory.has(item_name, quantity);

    async getItem(itemName: string, location?: Container, quantity?: number) {
        const item = (location || this.location)?.item(itemName);
        if (!item) return;
        if (!location) location = this.location || undefined;
        if (!location) return;
        console.log(`${this.name} gets ${item.name} (quantity ${item.quantity}) from ${location}`);
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
            this.transferItem(item, character);
        }
    }

    async giveItem(item: Item, quantity?: number) {
        this.inventory.add(item, quantity);
        if (item.acquire) await item.acquire(this);
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

    async go(direction: string): Promise<boolean> {
        if (!this.location?.adjacent?.has(direction)) {
            return false;
        }
        for (let character of this.location.characters) {
            if (character._onDeparture && !await character._onDeparture(this, direction)) {
                return false;
            }
        }
        const newLocation = this.location.adjacent.get(direction);
        if (newLocation) {
            this.relocate(newLocation);
            return true;
        } else {
            console.log(`Unexpected error: ${direction} exists but location is undefined.`);
            return false;
        }
    }

    async relocate(newLocation: Location | null, direction?: string) {
        this.location?.exit(this, direction);
        if (this.location) this.exit(this.location);
        this.location = newLocation;
        newLocation?.enter(this);
        if (newLocation) this.enter(newLocation);
        for (let character of newLocation?.characters ?? []) {
            if (character !== this) {
                await this.encounter(character);
                await character.encounter(this);
            }
        }
    }

    async die(cause?: any) {
        this.dead = true;
        await this._onDeath?.(this.game);
        if (!this.dead) return;
        // if (this.location) this.inventory.transferAll(this.location);
        if (this.location) {
            for (let item of this.inventory) {
                // copy items so they will still have the stuff when they respawn
                const dropItem = Object.assign(new Item({ name: item.name }), item);
                this.location?.add(dropItem)
            }
        }
        this.location?.removeCharacter(this);
        this.respawnLocation = this.location;
        this.location = null;
    }

    async respawn() {
        await this._onRespawn?.()
        if (this.respawnLocationKey) {
            this.respawnLocation = this.game.locations.get(this.respawnLocationKey) || null
        }
        if (this.respawnLocation) {
            console.log(`${this.name} respawns at ${this.respawnLocation.name}`)
            await this.relocate(this.respawnLocation);
            this.hp = this.max_hp;
            this.mp = this.max_mp;
            this.sp = this.max_sp;
            this.dead = false;
        }
        else {
            console.log(`${this.name} is lost forever.`)
        }
    }

    recoverStats({ hp = 0, sp = 0, mp = 0 }: { hp?: number, sp?: number, mp?: number }) {
        this.hp = Math.min(this.max_hp, this.hp + hp);
        this.sp = Math.min(this.max_sp, this.sp + sp);
        this.mp = Math.min(this.max_mp, this.mp + mp);
    }

    dialog(action: Action) {
        this.addAction('talk', action.bind(this));
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

    onSlay(action: (this: Character, character: Character) => Promise<void>) {
        this._onSlay = action.bind(this);
        return this;
    }

    onDeath(action: (this: Character, gameState?: GameState) => Promise<void>) {
        this._onDeath = action.bind(this);
        return this;
    }

    onTurn(action: (this: Character, gameState: GameState) => Promise<void>) {
        this._onTurn = action.bind(this);
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

    addAction(name: string, action: (this: Character, ...args: any[]) => Promise<void>) {
        this.actions.set(name, action.bind(this));
        return this;
    }

    getAction(name: string) {
        const action = this.actions.get(name);
        if (!action) {
            throw new Error(`Action "${name}" not found.`);
        }
        return action;
    }

    useAction(name: string, args?: string): Promise<void> {
        const action = this.getAction(name);
        return action.call(this, args);
    }

    removeAction(name: string) {
        this.actions.delete(name);
        return this;
    }

    async encounter(character: Character) {
        await this._onEncounter?.(character);
        if (this.enemies.includes(character)) {
            this.fight(character);
        } else if (this.attackPlayer && character.isPlayer) {
            this.fight(character);
        }
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

    async attack(target: Character | null = null, weapon: Item | null = null) {
        if (!target) target = this.attackTarget;
        if (!target) return;
        await target?.defend(this)
        if (!target || this.attackTarget != target) return;

        const weaponName = weapon?.name || this.weaponName;
        const weaponType = weapon?.weapon_stats?.type || this.weaponType;
        const damageType = weapon?.weapon_stats?.damage_type || this.damageType;

        // hit or not
        const accuracy = this.accuracy;
        const evasion = target.evasion;
        console.log(`${this.name} coordination ${this.coordination} attempts to hit ${target.name} agility ${target.agility}`)
        if (accuracy < evasion || (target.invisible > 0 && Math.random() * 4 > 1)) {
            console.log(`${this.name} misses ${target.name} (${accuracy} < ${evasion})!`);
            print(this.describeAttack(target, weaponName, weaponType, -1));
            return;
        }
        console.log(`${this.name} hits ${target.name} (${accuracy} > ${evasion})!`);

        //Normal damage
        let dam = Math.sqrt(Math.random()) * this.blunt_damage(weapon)
        dam -= Math.random() * (target.blunt_armor)
        dam = dam < 0 ? 0 : dam

        //Piercing damage
        let pdam = Math.sqrt(Math.random()) * this.sharp_damage(weapon)
        pdam -= Math.sqrt(Math.random()) * target.sharp_armor
        pdam = pdam < 0 ? 0 : pdam

        //Magic damage
        let mdam = Math.sqrt(Math.random()) * this.magic_damage(weapon)
        mdam -= Math.sqrt(Math.random()) * target.magic_armor
        mdam = mdam < 0 ? 0 : mdam

        //Damage total
        let tdam = dam + pdam + mdam
        tdam = Math.max(this.damage_modifier(tdam, damageType), 0)

        //Output screen
        print(this.describeAttack(target, weaponName, weaponType, tdam))
        await target.hurt(tdam, null, this)

        if (target.dead) {
            await this.slay(target);
        } else {
            //special moves
            await this._fightMove?.()
        }
    }

    async hurt(damage: number, type: DamageTypes | null = null, cause: any): Promise<number> {
        if (type) damage = Math.max(this.damage_modifier(damage, type), 0)
        this.hp -= damage;
        if (this.hp <= 0) {
            await this.die(cause);
        }
        return damage;
    }

    describeAttack(target: Character, weaponName: string, weaponType: string, damage: number): string {
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
        if (!this.enemies.includes(attacker)) {
            this.enemies.push(attacker);
        }
        if (!this.fighting) {
            this.fight(attacker);
        }
        for (let character of this.location?.characters ?? []) {
            if (character != this && character.alignment && character.alignment === this.alignment) {
                console.log(`${character.name} defends ${this.name}!`)
                if (!character.enemies.includes(attacker)) character.enemies.push(attacker);
            }
        }
        if (this._onAttack) {
            await this._onAttack(attacker);
            console.log(this.name, 'decides to attack', this.attackTarget?.name)
        }
    }

    async turn(game: GameState) {
        await this._onTurn?.(game);
        if (this.hp < this.max_hp && !this.fighting) {
            this.recoverStats({ hp: this.hp_recharge * this.max_hp, mp: this.mp_recharge * this.max_mp, sp: this.sp_recharge * this.max_sp });
            console.log(`${this.name} heals to ${this.hp} hp`)
        }
        this.enemies = this.enemies.filter(enemy => enemy);
        if (!this.fighting) {
            for (let enemy of this.enemies) {
                if (enemy.location === this.location) {
                    this.fight(enemy);
                    break;
                }
            }
        }
        if (this.attackTarget?.location === this.location) {
            // console.log(`${this.name} attacks ${this.attackTarget.name}!`)
            await this.attack(this.attackTarget);
        }
    }

    save(): object {
        // save only stuff that might change
        return {
            name: this.name,
            hp: this.hp,
            hp_recharge: this.hp_recharge,
            enemies: this.enemies.map(enemy => enemy?.name).filter(name => name),
            attackPlayer: this.attackPlayer || this.enemies.some(enemy => enemy.isPlayer),
            respawnTime: this.respawnTime,
            respawnCountdown: this.respawnCountdown,
            respawnLocationKey: this.respawnLocationKey,
            items: this.items.filter(item => item).map(item => item.save()),
            flags: this.flags
        }
    }
}

export { Character, CharacterParams, pronouns, Buff, BonusKeys, DamageTypes };