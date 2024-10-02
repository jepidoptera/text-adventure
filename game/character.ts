import { Container, Item } from "./item.ts";
import { Location } from "./location.ts";
import { GameState } from "./game.ts";

class Character {
    name: string;
    description: string;
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
    location: Location | undefined;
    respawnLocation: Location | undefined;
    abilities: { [key: string]: any };
    actions: Map<string, (...args: any[]) => void>;
    flags: { [key: string]: any } = {};
    attackTarget: Character | undefined;
    onEncounter: ((character: Character) => void) | undefined;
    attackPlayer: boolean = false;

    constructor({
        name,
        description = "",
        pronouns = {subject: "they", object: "them", possessive: "their"},
        items = [],
        exp = 1,
        hp = 1,
        mp = 1,
        sp = 1,
        strength = 1,
        coordination = 1,
        agility = 1,
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
        onEncounter = undefined,
        attackPlayer = false
    }: {
        name: string;
        description?: string;
        pronouns?: { subject: string, object: string, possessive: string };
        items?: Item[];
        exp?: number;
        hp?: number;
        mp?: number;
        sp?: number;
        strength?: number;
        coordination?: number;
        agility?: number;
        isPlayer?: boolean;
        enemies?: Character[];
        friends?: Character[];
        powers?: { [key: string]: any };
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
        onEncounter?: (character: Character) => void | undefined;
        attackPlayer?: boolean;
    }) {
        this.name = name;
        console.log(`Creating ${this.name}`)
        this.description = description;
        this.pronouns = pronouns;
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
        this.onEncounter = onEncounter;
        this.attackPlayer = attackPlayer;
        for (let action in actions) {
            this.addAction(action, actions[action]);
        }
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
        this.location = newLocation;
        newLocation.enter(this);
        newLocation.characters.forEach(character => {
            if (character !== this) {
                this.encounter(character);
                character.encounter(this);
            }
        })
    }

    die(cause?: any) {
        if (this.location) this.inventory.transferAll(this.location);
        this.location?.removeCharacter(this);
        this.respawnLocation = this.location;
        this.location = undefined;
        this.dead = true;
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

    addAction(name: string, action: (this: Character, ...args: any[]) => void) {
        this.actions.set(name, action.bind(this));
        return this;
    }

    removeAction(name: string) {
        this.actions.delete(name);
        return this;
    }

    encounter(character: Character) {
        this.onEncounter?.(character);
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
        if (!target) return;

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
        
        target.onAttack(this)
        target.hp -= tdam
        if (target.hp <= 0) {
            this.slay(target);
            target.die(this);
        }
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

    onAttack(character: Character) {
        if (!this.enemies.includes(character)) {
            this.enemies.push(character);
        }
        if (this.attackTarget?.location != this.location) {
            this.attackTarget = character;
        }
    }

    act(state: GameState) {
        if (this.attackTarget && this.attackTarget.location == this.location) {
            for (let weapon in this.weapons) {
                console.log(`Attacking with ${weapon}: ${this.weapons[weapon].name}`)
                this.attack(this.attackTarget, this.weapons[weapon]);
            }
        }
    }
}

export { Character };