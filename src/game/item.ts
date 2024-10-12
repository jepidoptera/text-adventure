import { GameState } from "./game.ts";
import { Character } from "./character.ts";
import { plural } from "./utils.ts";

class Item {
    name: string;
    description: string;
    value: number = 0;
    size: number = 1;
    quantity: number = 1;
    weapon_stats: {
        blunt_damage?: number,
        sharp_damage?: number,
        magic_damage?: number,
        weapon_type: string,
        strength_required?: number,
    } | undefined;
    armor_stats: any;
    drink: ((character: Character) => void) | undefined = undefined;
    eat: ((character: Character) => void) | undefined = undefined;
    use: ((character: Character) => void) | undefined = undefined;
    read: ((character?: Character) => void) | undefined = undefined;
    acquire: ((character: Character) => void) | undefined = undefined;
    fungible: boolean = true;
    immovable: boolean = false;
    _actions: Map<string, (...args: any[]) => Promise<void>> = new Map();

    constructor({
        name,
        description = "",
        value = 0,
        size = 1,
        quantity = 1,
        weapon_stats: weapon_stats,
        armor_stats,
        drink,
        eat,
        use,
        read,
        acquire,
        fungible = true,
        immovable = false,
    }: {
        name: string;
        description?: string;
        value?: number;
        size?: number;
        quantity?: number;
        weapon_stats?: {
            blunt_damage?: number,
            sharp_damage?: number,
            magic_damage?: number,
            weapon_type: string,
            strength_required?: number,
        };
        armor_stats?: any;
        drink?: (character: Character) => void;
        eat?: (character: Character) => void;
        use?: (character: Character) => void;
        read?: (character?: Character) => void;
        acquire?: (character: Character) => void;
        fungible?: boolean;
        immovable?: boolean;
    }) {
        this.name = name;
        this.description = description;
        this.value = value;
        this.size = size;
        this.quantity = Math.floor(quantity);
        this.weapon_stats = weapon_stats;
        this.armor_stats = armor_stats;
        if (drink) this.drink = drink;
        if (eat) this.eat = eat;
        if (use) this.use = use;
        if (read) this.read = read;
        if (acquire) this.acquire = acquire;
        this.fungible = fungible;
        this.immovable = immovable;
    }

    addAction(name: string, action: (this: Item, ...args: any[]) => Promise<void>) {
        this._actions.set(name, action.bind(this));
        return this;
    }
    getAction(name: string) {
        return this._actions.get(name);
    }

    get is_weapon() {
        return this.weapon_stats !== undefined;
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
    get display() {
        if (this.quantity > 1) {
            return `${this.quantity} ${plural(this.name)}`;
        }
        return this.name;
    }
}

class Container {
    items: Item[] = [];

    constructor(items: Item[] = []) {
        for (let item of items) {
            this.add(item);
        };
    }

    item(itemName: string): Item | undefined {
        return this.items.find(item => item.name === itemName);
    }

    add(item: Item, quantity: number = item.quantity): void {
        if (item.fungible) {
            const existingItem = this.item(item.name);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                item.quantity = quantity;
                this.items.push(item);
            }
        } else {
            this.items.push(item);
            for (let i = 1; i < quantity; i++) {
                const new_item = new Item(item);
                this.items.push(new_item);
            }
        }
    }

    remove(itemToRemove: Item | string, quantity?: number): void {
        const itemName = typeof itemToRemove === 'string' ? itemToRemove : itemToRemove.name;
        const item = this.item(itemName);

        if (!item) return;

        console.log(`drop quantity: ${quantity}`)
        const removeQuantity = quantity ?? Math.min(item.quantity, this.count(itemName));
        console.log(`dropping ${removeQuantity} ${itemName} from ${this.constructor.name}`);

        if (item.fungible) {
            if (item.quantity > removeQuantity) {
                item.quantity -= removeQuantity;
                console.log(`${item.quantity} left.`)
            } else {
                this.items = this.items.filter(i => i.name !== itemName);
            }
        } else {
            this.items = this.items.filter((i, index) =>
                i.name !== itemName || index >= this.items.findIndex(item => item.name === itemName) + removeQuantity
            );
        }
    }

    transfer(itemToTransfer: string | Item, container: Container, quantity: number = 1) {
        const itemName = typeof itemToTransfer === 'string' ? itemToTransfer : itemToTransfer.name;
        const item = this.item(itemName);

        if (item) {
            const transferQuantity = quantity === 0 ? item.quantity : Math.min(quantity, item.quantity);

            if (item.fungible) {
                // For fungible items, we can just transfer the quantity
                this.remove(item, transferQuantity);
                container.add(new Item({ ...item, quantity: transferQuantity }));
            } else {
                // For non-fungible items, we transfer individual items
                for (let i = 0; i < transferQuantity; i++) {
                    this.remove(item, 1);
                    container.add(new Item({ ...item, quantity: 1 }));
                }
            }
        }
    }

    count(itemName: string): number {
        return this.items.reduce((sum, item) => sum + (item.name === itemName ? item.quantity : 0), 0);
    }

    has(itemName: string, quantity: number = 1): boolean {
        return this.count(itemName) >= quantity;
    }

    transferAll(container: Container) {
        for (let item of this.items) {
            this.transfer(item, container);
        }
    }

    take(itemToTake: string | Item, container: Container, quantity?: number) {
        const itemName = typeof itemToTake === 'string' ? itemToTake : itemToTake.name;
        const item = container.item(itemName);

        if (item) {
            container.transfer(item, this, quantity);
        }
    }

    clear() {
        this.items = [];
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }
}

export { Item, Container };