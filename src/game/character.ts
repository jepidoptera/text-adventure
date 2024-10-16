import { Container, Item } from "./item.ts";
import { Location } from "./location.ts";
import { GameState } from "./game.ts";

const pronouns = {
    'male': { subject: "he", object: "him", possessive: "his" },
    'female': { subject: "she", object: "her", possessive: "her" },
    'neutral': { subject: "they", object: "them", possessive: "their" },
    'inhuman': { subject: "it", object: "it", possessive: "its" }
}

type Action = (this: Character, ...args: any[]) => Promise<void>;

interface CharacterParams {
    name: string;
    class_name?: string;
    description?: string;
    aliases?: string[];
    alignment?: string;
    pronouns?: { subject: string, object: string, possessive: string };
    items?: Item[];
    exp?: number;
    hp?: number;
    mp?: number;
    sp?: number;
    strength?: number;
    coordination?: number;
    agility?: number;
    magic_level?: number;
    isPlayer?: boolean;
    enemies?: Character[];
    friends?: Character[];
    powers?: { [key: string]: number };
    weapons?: { [key: string]: Item };
    weapon?: Item;
    armor?: { [key: string]: Item };
    blunt_damage?: number;
    sharp_damage?: number;
    magic_damage?: number;
    blunt_armor?: number;
    sharp_armor?: number;
    magic_armor?: number;
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
    inventory: Container;
    _hp: number;
    _max_hp: number;
    _mp: number;
    _max_mp: number;
    _sp: number;
    _max_sp: number;
    experience: number = 0;
    exp_value: number = 0;
    hunger: number = 0;
    strength: number;
    coordination: number;
    agility: number;
    magic_level: number = 0;
    invisible: number = 0;
    enemies: Character[] = [];
    friends: Character[] = [];
    weapons: { [key: string]: Item } = {};
    armor: { [key: string]: Item } = {};
    _blunt_damage: number = 0;
    _sharp_damage: number = 0;
    _magic_damage: number = 0;
    _blunt_armor: number = 0;
    _sharp_armor: number = 0;
    _magic_armor: number = 0;
    _damage_modifier: ((damage: number, type: string) => number) | undefined;
    location: Location | undefined;
    respawnLocation: Location | undefined;
    abilities: { [key: string]: number };
    actions: Map<string, (...args: any[]) => Promise<void>> = new Map()
    flags: { [key: string]: any } = {};
    attackTarget: Character | undefined;
    _onEncounter: ((character: Character) => Promise<void>) | undefined;
    _onDeparture: ((character: Character, direction: string) => Promise<boolean>) | undefined;
    _onEnter: Action | undefined;
    _onLeave: Action | undefined;
    _onSlay: Action | undefined;
    _onDeath: Action | undefined;
    _onAttack: Action | undefined;
    _onTurn: Action | undefined;
    _fightMove: Action | undefined;
    _onRespawn: Action | undefined;
    attackPlayer: boolean = false;
    respawnTime: number = 500
    respawnCountdown: number = 0

    constructor({
        name,
        description = "",
        aliases = [],
        alignment = "",
        pronouns = { subject: "they", object: "them", possessive: "their" },
        items = [],
        exp = 0,
        hp = 1,
        mp = 1,
        sp = 1,
        strength = 1,
        coordination = 1,
        agility = 1,
        magic_level = 0,
        isPlayer = false,
        enemies = [],
        friends = [],
        powers = {},
        weapons = {},
        weapon = undefined,
        blunt_damage = 0,
        sharp_damage = 0,
        magic_damage = 0,
        blunt_armor = 0,
        sharp_armor = 0,
        magic_armor = 0,
        armor = {},
        attackPlayer = false,
        flags = {}
    }: CharacterParams) {
        this.name = name;
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
        this._mp = mp;
        this._max_mp = mp;
        this._sp = sp;
        this._max_sp = sp;
        this.strength = strength;
        this.coordination = coordination;
        this.agility = agility;
        this.magic_level = magic_level;
        this.isPlayer = isPlayer;
        this.enemies = enemies;
        this.friends = friends;
        this.abilities = powers;
        this.weapons = weapons;
        if (weapon) {
            this.weapons['main'] = weapon;
            // console.log(`Equipped ${this.weapons['main'].name} as main weapon.`)
        }
        this.armor = armor;
        this._blunt_armor = blunt_armor;
        this._sharp_armor = sharp_armor;
        this._magic_armor = magic_armor;
        this._blunt_damage = blunt_damage;
        this._sharp_damage = sharp_damage;
        this._magic_damage = magic_damage;
        this.attackPlayer = attackPlayer;
        this.flags = flags;
    }

    initialize(game: GameState) {
        this.game = game;
    }

    get max_hp(): number {
        return Math.floor(this._max_hp);
    }
    set max_hp(value: number) {
        this._max_hp = value;
    }
    get max_mp(): number {
        return Math.floor(this._max_mp);
    }
    set max_mp(value: number) {
        this._max_mp = value;
    }
    get max_sp(): number {
        return Math.floor(this._max_sp);
    }
    set max_sp(value: number) {
        this._max_sp = value;
    }
    get hp(): number {
        return Math.floor(this._hp);
    }
    set hp(value: number) {
        this._hp = Math.min(value, this.max_hp);
    }
    get mp(): number {
        return Math.floor(this._mp);
    }
    set mp(value: number) {
        this._mp = Math.min(value, this.max_mp);
    }
    get sp(): number {
        return Math.floor(this._sp);
    }
    set sp(value: number) {
        this._sp = Math.min(value, this.max_sp);
    }
    blunt_damage(weapon: Item = this.weapons.main) {
        return this._blunt_damage || this.strength * (weapon?.weapon_stats?.blunt_damage || 0);
    }
    sharp_damage(weapon: Item = this.weapons.main) {
        return this._sharp_damage || this.strength * (weapon?.weapon_stats?.sharp_damage || 0);
    }
    magic_damage(weapon: Item = this.weapons.main) {
        return this._magic_damage || this.magic_level * (weapon?.weapon_stats?.magic_damage || 0);
    }
    get blunt_armor(): number {
        return this._blunt_armor;
    }
    set blunt_armor(value: number) {
        this._blunt_armor = value;
    }
    get sharp_armor(): number {
        return this._sharp_armor;
    }
    set sharp_armor(value: number) {
        this._sharp_armor = value;
    }
    get magic_armor(): number {
        return this._magic_armor;
    }
    set magic_armor(value: number) {
        this._magic_armor = value;
    }

    async slay(character: Character) {
        // gloat or whatever
        await this._onSlay?.(character);
        if (this.attackTarget == character) {
            this.attackTarget = undefined;
        }
    }

    has = (item_name: string, quantity?: number) => this.inventory.has(item_name, quantity);

    async getItem(item: Item, location?: Container, quantity?: number) {
        if (!location) location = this.location;
        if (!location) return;
        location.transfer(item, this.inventory, quantity ?? item.quantity);
        if (item.acquire) item.acquire(this);
    }

    async dropItem(itemName: string) {
        const item = this.inventory.item(itemName);
        if (item) {
            this.inventory.transfer(item, this.location ?? this.inventory);
        }
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

    async relocate(newLocation?: Location, direction?: string) {
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
        this.location = undefined;
    }

    async respawn() {
        await this._onRespawn?.()
        if (this.respawnLocation) {
            await this.relocate(this.respawnLocation);
            this.hp = this.max_hp;
            this.mp = this.max_mp;
            this.sp = this.max_sp;
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
            if (this.location?.playerPresent) {
                print(`${this.name} attacks ${character.name}!`);
            }
            this.attackTarget = character;
        } else if (this.attackPlayer && character.isPlayer) {
            print(`${this.name} attacks you!`);
            this.attackTarget = character;
        }
    }

    async enter(location: Location) {
        await this._onEnter?.(location);
    }

    async exit(location: Location) {
        await this._onLeave?.(location);
    }

    get toHit() {
        return this.agility * Math.random();
    }

    get accuracy() {
        return this.coordination * Math.random()
    }

    async attack(target?: Character, weapon: Item = this.weapons.main) {
        if (!target) target = this.attackTarget;
        this.attackTarget = target;
        await target?.defend(this)
        if (!target || !this.attackTarget) return;

        // hit or not
        if (this.accuracy < target.toHit || target.invisible > 0 && Math.random() * 4 > 1) {
            console.log(`${this.name} misses ${target.name}!`);
            this.describeAttack(target, weapon, -1);
            return;
        }

        //Normal damage
        let dam = Math.floor(Math.sqrt(Math.random()) * this.blunt_damage(weapon))
        console.log(`dam: ${dam}`)
        dam -= Math.floor(Math.random() * (target.blunt_armor))
        dam = dam < 0 ? 0 : dam

        //Piercing damage
        let pdam = Math.floor(Math.sqrt(Math.random()) * this.sharp_damage(weapon))
        console.log(`pdam: ${pdam}`)
        pdam -= Math.floor(Math.sqrt(Math.random()) * target.sharp_armor)
        pdam = pdam < 0 ? 0 : pdam

        //Magic damage
        let mdam = Math.floor(Math.sqrt(Math.random()) * this.magic_damage(weapon))
        mdam -= Math.floor(Math.sqrt(Math.random()) * target.magic_armor)
        mdam = mdam < 0 ? 0 : mdam

        //Damage total
        let tdam = dam + pdam + mdam

        //Output screen
        await this.describeAttack(target, weapon, tdam)

        target.hurt(tdam, weapon.weapon_stats?.weapon_type || 'blunt')
        if (target.hp <= 0) {
            await this.slay(target);
            await target.die(this);
        }
        else {
            //special moves
            await this._fightMove?.()
        }
    }

    damage_modifier(modifier: (damage: number, type: string) => number) {
        this._damage_modifier = modifier;
        return this;
    }

    async hurt(damage: number, type: string) {
        if (this._damage_modifier) {
            damage = this._damage_modifier(damage, type);
        }
        this.hp -= damage;
    }

    async describeAttack(target: Character, weapon: Item, damage: number) {
        if (damage < 0) {
            print(`${this.name} misses ${target.name}!`);
            return;
        }
        print(`${this.name} attacks ${target.name} with ${weapon.name} for ${damage}% damage!`)
        if (damage > 100) {
            print(` ${target.name} is slain!`)
        }
    }

    async defend(character: Character) {
        if (!this.enemies.includes(character)) {
            this.enemies.push(character);
        }
        if (this.attackTarget?.location != this.location) {
            this.attackTarget = character;
        }
        if (this._onAttack) {
            await this._onAttack(character);
        }
    }

    async act(game: GameState) {
        await this._onTurn?.(game);
        if (this.attackTarget?.location === this.location) {
            console.log('target qcquired')
            await this.attack(this.attackTarget);
        }
    }

    save(): object {
        // save only stuff that might change
        return {
            hp: this.hp,
            enemies: this.enemies.map(enemy => enemy.name),
            attackPlayer: this.attackPlayer,
            respawnCountdown: this.respawnCountdown,
            flags: this.flags
        }
    }
}

export { Character, CharacterParams, pronouns };