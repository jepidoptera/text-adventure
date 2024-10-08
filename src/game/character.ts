import { Container, Item } from "./item.ts";
import { Location } from "./location.ts";
import { GameState } from "./game.ts";

const pronouns = {
    'male': {subject: "he", object: "him", possessive: "his"},
    'female': {subject: "she", object: "her", possessive: "her"},
    'neutral': {subject: "they", object: "them", possessive: "their"},
    'inhuman': {subject: "it", object: "it", possessive: "its"}
}

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
    actions?: { [key: string]: (...args: any[]) => void };
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
    pronouns: { subject: string, object: string, possessive: string } = {subject: "they", object: "them", possessive: "their"};
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
    exp_value: number = 1;
    hunger: number = 0;
    strength: number;
    coordination: number;
    agility: number;
    magic_level: number = 0;
    invisible: number = 0;
    tripping: number = 0;
    drunk: number = 0;
    enemies: Character[] = [];
    friends: Character[] = [];
    weapons: {[key: string]: Item} = {};
    armor: {[key: string]: Item} = {};
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
    actions: Map<string, (...args: any[]) => void>;
    flags: { [key: string]: any } = {};
    attackTarget: Character | undefined;
    _onEncounter: ((character: Character) => void) | undefined;
    _onDeparture: ((character: Character, direction: string) => boolean) | undefined;
    _onEnter: ((location: Location) => void) | undefined;
    _onLeave: ((location: Location) => void) | undefined;
    _onSlay: ((character: Character) => void) | undefined;
    _onDeath: ((gameState?: GameState) => void) | undefined;
    _onAttack: ((character: Character) => void) | undefined;
    _onTurn: ((gameState: GameState) => void) | undefined;
    _fightMove: (() => void) | undefined;
    attackPlayer: boolean = false;

    constructor({
        name,
        description = "",
        aliases = [],
        alignment = "",
        pronouns = {subject: "they", object: "them", possessive: "their"},
        items = [],
        exp = 1,
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
        actions = {},
        attackPlayer = false,
        flags = {}
    }: CharacterParams) {
        this.name = name;
        console.log(`Creating ${this.name}`)
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
            console.log(`Equipped ${this.weapons['main'].name} as main weapon.`)
        }
        this.armor = armor;
        this._blunt_armor = blunt_armor;
        this._sharp_armor = sharp_armor;
        this._magic_armor = magic_armor;
        this._blunt_damage = blunt_damage;
        this._sharp_damage = sharp_damage;
        this._magic_damage = magic_damage;
        this.actions = new Map();
        this.attackPlayer = attackPlayer;
        this.flags = flags;
        for (let action in actions) {
            this.addAction(action, actions[action]);
        }
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
    blunt_damage(weapon: Item) {
        return this._blunt_damage || this.strength * (weapon.weapon_stats?.blunt_damage || 0);
    }
    sharp_damage(weapon: Item) {
        return this._sharp_damage || this.strength * (weapon.weapon_stats?.sharp_damage || 0);
    }
    magic_damage(weapon: Item) {
        return this._magic_damage || this.magic_level * (weapon.weapon_stats?.magic_damage || 0);
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

    slay(character: Character) {
        // gloat or whatever
        this._onSlay?.(character);
        if (this.attackTarget == character) {
            this.attackTarget = undefined;
        }
    }

    has = (item_name: string, quantity?: number) => this.inventory.has(item_name, quantity);

    getItem (item: Item, location?: Container, quantity?: number) {
        if (!location) location = this.location;
        if (!location) return;
        location.transfer(item, this.inventory, quantity??item.quantity);
        if (item.acquire) item.acquire(this);
    }

    dropItem(itemName: string) {
        const item = this.inventory.item(itemName);
        if (item) {
            this.inventory.transfer(item, this.location??this.inventory);
        }
    }

    go(direction: string): boolean {
        if (!this.location?.adjacent?.has(direction)) {
            return false;
        }
        for (let character of this.location.characters) {
            if (character._onDeparture && !character._onDeparture(this, direction)) {
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

    relocate(newLocation: Location, direction?: string) {
        this.location?.exit(this, direction);
        if (this.location) this.exit(this.location);
        this.location = newLocation;
        newLocation.enter(this);
        this.enter(newLocation);
        newLocation.characters.forEach(character => {
            if (character !== this) {
                this.encounter(character);
                character.encounter(this);
            }
        })
    }

    die(cause?: any) {
        this.dead = true;
        this._onDeath?.(this.game);
        if (!this.dead) return;
        if (this.location) this.inventory.transferAll(this.location);
        this.location?.removeCharacter(this);
        this.respawnLocation = this.location;
        this.location = undefined;
    }

    respawn() {
        if (this.respawnLocation) {
            this.respawnLocation.enter(this);
            this.hp = this.max_hp;
            this.mp = this.max_mp;
            this.sp = this.max_sp;
        }
    }

    recoverStats({hp = 0, sp = 0, mp = 0}: {hp?: number, sp?: number, mp?: number}) {
        this.hp = Math.min(this.max_hp, this.hp + hp);
        this.sp = Math.min(this.max_sp, this.sp + sp);
        this.mp = Math.min(this.max_mp, this.mp + mp);
    }

    dialog(talk: (this: Character, ...args: any[]) => void) {
        this.addAction('talk', talk.bind(this));
        return this
    }

    onAttack(action: (this: Character, character: Character) => void) {
        this._onAttack = action.bind(this);
        return this;
    }

    onEncounter(action: (this: Character, character: Character) => void) {
        this._onEncounter = action.bind(this);
        return this;
    }

    onDeparture(action: (this: Character, character: Character, direction: string) => boolean) {
        this._onDeparture = action.bind(this);
        return this;
    }

    onEnter(action: (this: Character, location: Location) => void) {
        this._onEnter = action.bind(this);
        return this;
    }

    onLeave(action: (this: Character, location: Location) => void) {
        this._onLeave = action.bind(this);
        return this;
    }

    onSlay(action: (this: Character, character: Character) => void) {
        this._onSlay = action.bind(this);
        return this;
    }

    onDeath(action: (this: Character, gameState?: GameState) => void) {
        this._onDeath = action.bind(this);
        return this;
    }

    onTurn(action: (this: Character, gameState: GameState) => void) {
        this._onTurn = action.bind(this);
        return this;
    }

    fightMove(action: (this: Character) => void) {
        this._fightMove = action.bind(this);
        return this;
    }

    addAction(name: string, action: (this: Character, ...args: any[]) => void) {
        this.actions.set(name, action.bind(this));
        return this;
    }

    removeAction(name: string) {
        this.actions.delete(name);
        return this;
    }

    encounter(character: Character) {
        this._onEncounter?.(character);
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

    enter(location: Location) {
        this._onEnter?.(location);
    }

    exit(location: Location) {
        this._onLeave?.(location);
    }

    get toHit() {
        let toHit = this.agility * Math.random();
        if (this.drunk) toHit = toHit * (1 - this.drunk / (this.max_sp / 2 + 50))
        return toHit
    }

    get accuracy() {
        return this.coordination * Math.random()
    }

    attack(target?: Character, weapon: Item = this.weapons.main) {
        if (!target) target = this.attackTarget;
        this.attackTarget = target;
        target?.defend(this)
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
        this.describeAttack(target, weapon, tdam)
        
        target.hurt(tdam, weapon.weapon_stats?.weapon_type || 'blunt')
        if (target.hp <= 0) {
            this.slay(target);
            target.die(this);
        }
        else {    
            //special moves
            this._fightMove?.()
        }
    }

    damage_modifier(modifier: (damage: number, type: string) => number) {
        this._damage_modifier = modifier;
        return this;
    }

    hurt(damage: number, type: string) {
        if (this._damage_modifier) {
            damage = this._damage_modifier(damage, type);
        }
        this.hp -= damage;
    }

    describeAttack(target: Character, weapon: Item, damage: number) {
        if (damage < 0) {
            print(`${this.name} misses ${target.name}!`);
            return;
        }
        print(`${this.name} attacks ${target.name} with ${weapon.name} for ${damage}% damage!`)
        if (damage > 100) {
            print(` ${target.name} is slain!`)
        }
    }

    defend(character: Character) {
        if (!this.enemies.includes(character)) {
            this.enemies.push(character);
        }
        if (this.attackTarget?.location != this.location) {
            this.attackTarget = character;
        }
        if (this._onAttack) {
            this._onAttack(character);
        }
    }

    act(state: GameState) {
        this._onTurn?.(state);
        if (this.attackTarget && this.attackTarget.location == this.location) {
            for (let weapon in this.weapons) {
                console.log(`Attacking with ${weapon}: ${this.weapons[weapon].name}`)
                this.attack(this.attackTarget, this.weapons[weapon]);
            }
        }
    }
}

export { Character, CharacterParams, pronouns };