class Container {
    items: Item[] = [];

    constructor(items: Item[] = []) {
        this.items = items
    }

    item(item_name: string): Item | undefined {
        return this.items.find(item => item.name === item_name);
    }

    add(item: Item, quantity?: number) {
        if (quantity === undefined) quantity = item.quantity;
        if (item.fungible) {
            if (this.has(item.name)) {
                const existing_item = this.item(item.name);
                if(existing_item) existing_item.quantity++;
            }
            else {
                item.quantity = quantity;
                this.items.push(item);
            }
        }
        else {
            this.items.push(item);
        }
    }

    remove(item?: Item, item_name?: string, quantity?: number) {
        if (!item && item_name) {
            item = this.item(item_name);
        }
        if (!item) {
            return;
        }   
        if (quantity === undefined) {
            quantity = Math.max(item.quantity, this.count(item.name));
        }
        if (item.fungible) {
            if (item.quantity > quantity) {
                item.quantity -= quantity;
                return
            } else {
                this.items = this.items.filter(item => item.name !== item_name);
            }
        }
        else {
            for (let i = 0; i < quantity; i++) {
                this.items = this.items.filter(i => i !== item);
                item = this.items.find(item => item.name === item_name);
            }
        }
    }

    count(item_name: string): number {
        return this.items.reduce((sum: number, item) => (item.name === item_name ? item.quantity : 0), 0);
    }

    has(item_name: string, quantity?: number): boolean {
        if (quantity === undefined || quantity === 1) {
            return this.items.map(item => item.name).includes(item_name);
        }
        else {
            return this.count(item_name) >= quantity;
        }
    }

    give(item: Item, container: Container, quantity?: number) {

        this.remove(item);
        container.add(item);
    }

    give_all(container: Container) {
        this.items.forEach(item => {
            container.items.push(item);
        });
        this.clear();
    }

    clear() {
        this.items = [];
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
}

class Location extends Container {
    unique_id!: string | number;
    name: string;
    adjacent: Map<string, Location> | undefined;
    _adjacent: { [key: string]: string | number } = {};
    description: string | undefined;
    characters: Character[] = [];
    constructor({
        name,
        description = "",
    }: {
        name: string;
        description?: string;
    }) {
        super();
        this.name = name;
        this.description = description;
        this.adjacent = new Map();
    }
    addCharacter(character: Character) {
        this.characters.push(character);
    }
    enter(character: Character) {
        this.addCharacter(character);
    }
    exit(character: Character) {
        this.characters = this.characters.filter(c => c !== character);
    }
}

function newLocation({
    name, 
    description = "",
    adjacent = {},
    items = [],
    characters = []
}: {
    name: string;
    description?: string;
    adjacent?: { [key: string]: string | number };
    items?: Item[];
    characters?: Character[];
}): Location {
    const area = new Location({ 
        name: name, 
        description: description
    });
    area._adjacent = adjacent;
    area.items = items;
    area.characters = characters;
    characters.forEach(character => {
        character.location = area;
    });
    return area;
}

class Character {
    name: string;
    description: string;
    isPlayer: boolean;
    inventory: Container;
    hp: number;
    max_hp: number;
    mp: number;
    max_mp: number;
    sp: number;
    max_sp: number;
    strength: number;
    coordination: number;
    agility: number;
    magic_level: number = 0;
    enemies: Character[] = [];
    friends: Character[] = [];
    weapons: Item[] = [];
    armor: Item[] = [];
    location: Location | undefined;
    abilities: { [key: string]: any };
    actions: { [key: string] : (...args: any[]) => void};
    flags: { [key: string]: any } = {};
    act: Function | null = null;

    constructor({
        name,
        description = "",
        items = [],
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
        weapons = [],
        armor = [],
    }: {
        name: string;
        description?: string;
        items?: Item[];
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
        weapons?: Item[];
        armor?: Item[];
    }) {
        this.name = name;
        this.description = description;
        this.inventory = new Container(items);
        this.hp = hp;
        this.max_hp = hp;
        this.mp = mp;
        this.max_mp = mp;
        this.sp = sp;
        this.max_sp = sp;
        this.strength = strength;
        this.coordination = coordination;
        this.agility = agility;
        this.isPlayer = isPlayer;
        this.enemies = enemies;
        this.friends = friends;
        this.abilities = powers;
        this.weapons = weapons;
        this.armor = armor;
        this.actions = {};
    }

    has = (item_name: string, quantity?: number) => this.inventory.has(item_name, quantity);

    getItem (item: Item, location?: Container) {
        if (!location) location = this.location;
        if (!location) return;
        location.remove(item);
        this.inventory.add(item);
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

    relocate(newLocation: Location) {
        this.location?.exit(this);
        this.location = newLocation;
        newLocation.enter(this);
        newLocation.characters.forEach(character => {
            if (character !== this) {
                this.encounter(character);
                character.encounter(this);
            }
        })
    }

    attack(target: Character) {
        console.log(`${this.name} attacks ${target.name}`);
        // Implement attack logic here
    }

    addAction(name: string, action: (this: Character, ...args: any[]) => void) {
        this.actions.set(name, action.bind(this));
    }

    encounter(character: Character) {
        if (this.enemies.includes(character)) {
            this.attack(character);
        }
    }
}

class Item {
    name: string;
    description: string;
    value: number = 0;
    size: number = 1;
    quantity: number = 1;
    weapons_stats: any;
    armor_stats: any;
    drink: ((character: Character) => void) | undefined = undefined;
    eat: ((character: Character) => void) | undefined = undefined;
    use: ((character: Character) => void) | undefined = undefined;
    read: ((character?: Character) => void) | undefined = undefined;
    fungible: boolean = true;
    immovable: boolean = false;

    constructor({
        name,
        description = "",
        value = 0,
        size = 1,
        quantity = 1,
        weapons_stats,
        armor_stats,
        drink,
        eat,
        use,
        read,
        fungible = true,
        immovable = false,
    }: {
        name: string;
        description?: string;
        value?: number;
        size?: number;
        quantity?: number;
        weapons_stats?: any;
        armor_stats?: any;
        drink?: (character: Character) => void;
        eat?: (character: Character) => void;
        use?: (character: Character) => void;
        read?: (character?: Character) => void;
        fungible?: boolean;
        immovable?: boolean;
    }) {
        this.name = name;
        this.description = description;
        this.value = value;
        this.size = size;
        this.quantity = quantity;
        this.weapons_stats = weapons_stats;
        this.armor_stats = armor_stats;
        if (drink) this.drink = drink;
        if (eat) this.eat = eat;
        if (use) this.use = use;
        if (read) this.read = read;
        this.fungible = fungible;
        this.immovable = immovable;
    }

    get is_weapon() {
        return this.weapons_stats !== undefined;
    }
    get is_armor() {
        return this.armor_stats !== undefined;
    }
    get drinkable() {
        return this.drink !== undefined;
    }
    get edible() {
        return this.eat !== undefined;
    }
    get usable() {
        return this.use !== undefined;
    }
    get readable() {
        return this.read !== undefined;
    }
}

export { Character, Item, Location, Container, newLocation };