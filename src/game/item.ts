import { GameState, withGameState } from "./game.js";
import { Character, DamageTypes, Buff, BonusKeys } from "./character.js";
import { plural } from "./utils.js";

type ItemParams = {
    name: string;
    game?: GameState;
    description?: string;
    value?: number;
    size?: number;
    quantity?: number;
    weapon_stats?: {
        blunt_damage?: number,
        sharp_damage?: number,
        magic_damage?: number,
        type: WeaponTypes,
        strength_required?: number,
        damage_type?: DamageTypes
    }
    equipment_slot?: string;
    forSale?: boolean;
    fungible?: boolean;
    immovable?: boolean;
}
type WeaponTypes = 'club' | 'axe' | 'slice' | 'stab' | 'sword' | 'fire' | 'bow' | 'magic' | 'electric' | 'blades' | 'sonic' | 'teeth'

const weapon_conversions: { [key in WeaponTypes]: DamageTypes } = {
    'club': 'blunt',
    'slice': 'sharp',
    'stab': 'sharp',
    'sword': 'sharp',
    'axe': 'sharp',
    'fire': 'fire',
    'bow': 'sharp',
    'magic': 'magic',
    'electric': 'electric',
    'blades': 'sharp',
    'sonic': 'sharp',
    'teeth': 'sharp'
}

class Item {
    key: string = '';
    name: string;
    game!: GameState;
    display_name: string = '';
    description: string;
    value: number = 0;
    size: number = 1;
    private _quantity: number = 1;
    weapon_stats: {
        blunt_damage: number,
        sharp_damage: number,
        magic_damage: number,
        type: WeaponTypes,
        damage_type: DamageTypes,
        strength_required: number,
    } | undefined;
    equipment_slot?: string;
    _buff?: Buff;
    private _drink: ((this: Item, character: Character) => Promise<void>) | undefined = undefined;
    private _eat: ((character: Character) => Promise<void>) | undefined = undefined;
    private _use: ((character: Character) => Promise<void>) | undefined = undefined;
    private _read: ((character?: Character) => Promise<void>) | undefined = undefined;
    private _acquire: ((this: Item, character: Character) => Promise<void>) | undefined = undefined;
    private _equip: ((this: Item, character: Character) => Promise<void>) | undefined = undefined;
    private _unequip: ((this: Item, character: Character) => Promise<void>) | undefined = undefined;
    private _displayName: ((this: Item) => string) | undefined = undefined;
    private _actions: Map<string, (...args: any[]) => Promise<void>> = new Map();

    constructor({
        name,
        game,
        description = "",
        value = 0,
        size = 1,
        quantity = 1,
        weapon_stats,
        equipment_slot,
    }: ItemParams) {
        this.name = name;
        if (game) this.game = game;
        this.description = description;
        this.value = value;
        this.size = size;
        this.quantity = quantity; // Ensure quantity is an integer and at least 1
        if (weapon_stats) {
            this.weapon_stats = {
                blunt_damage: 0,
                sharp_damage: 0,
                magic_damage: 0,
                damage_type: 'blunt',
                strength_required: 0,
                ...weapon_stats // override defaults
            };
        }
        this.equipment_slot = equipment_slot;
        if (this.weapon_stats && !this.weapon_stats.damage_type) {
            this.weapon_stats.damage_type = weapon_conversions[this.weapon_stats.type] ?? 'blunt';
        }
    }

    addAction(name: string, action: (this: Item, ...args: any[]) => Promise<void>) {
        this._actions.set(name, action.bind(this));
        return this;
    }

    getAction(name: string) {
        return this._actions.get(name);
    }

    get actions() {
        return this._actions;
    }

    get quantity() {
        return this._quantity;
    }

    set quantity(value: number) {
        this._quantity = Math.max(Math.floor(value), 1);
    }

    on_drink(action: (this: Item, character: Character) => Promise<void>) {
        this._drink = action.bind(this);
        return this;
    }

    on_eat(action: (this: Item, character: Character) => Promise<void>) {
        this._eat = action.bind(this);
        return this;
    }

    on_use(action: (this: Item, character: Character) => Promise<void>) {
        this._use = action.bind(this);
        return this;
    }

    on_read(action: (this: Item, character?: Character) => Promise<void>) {
        this._read = action.bind(this);
        return this;
    }

    on_acquire(action: (this: Item, character: Character) => Promise<void>) {
        this._acquire = action.bind(this);
        return this;
    }

    on_equip(action: (this: Item, character: Character) => Promise<void>) {
        this._equip = action.bind(this);
        return this;
    }

    on_remove(action: (this: Item, character: Character) => Promise<void>) {
        this._unequip = action.bind(this);
        return this;
    }

    addBuff(buff: Buff | { [key in BonusKeys]?: number }) {
        if (buff instanceof Buff) {
            this._buff = buff;
        } else {
            this._buff = new Buff({
                duration: -1,
                power: 1,
                name: this.name,
                bonuses: buff,
            });
        }
        return this;
    }

    buff(key: BonusKeys) {
        return this._buff?.bonuses[key] ?? 0;
    }

    get buffs() {
        return this._buff?.bonuses ?? {};
    }

    displayName(action: (this: Item) => string) {
        this._displayName = action.bind(this);
        return this;
    }
    async drink(character: Character) {
        await this._drink?.(character);
    }
    async eat(character: Character) {
        await this._eat?.(character);
    }
    async use(character: Character) {
        await this._use?.(character);
    }
    async read(character?: Character) {
        await this._read?.(character);
    }
    async acquire(character: Character) {
        await this._acquire?.(character);
    }
    async equip(character: Character) {
        await this._equip?.(character);
    }
    async unequip(character: Character) {
        await this._unequip?.(character);
    }

    get is_weapon() {
        return this.weapon_stats !== undefined;
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
        if (this._displayName) {
            return this._displayName();
        } else if (this._quantity !== 1) {
            return `${this._quantity} ${plural(this.name)}`;
        }
        return this.name;
    }
    copy() {
        return Object.assign(new Item({ ...this }), this);
    }
    save() {
        return {
            key: this.key,
            name: this.name,
            quantity: this._quantity,
        }
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
        const existingItem = this.item(item.name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            item.quantity = quantity;
            this.items.push(item);
        }
    }

    remove(itemToRemove: Item | string, quantity: number = 0): void {
        let itemName: string;
        if (typeof itemToRemove === 'string') {
            itemName = itemToRemove
            quantity = quantity > 0 ? quantity : 1;
        } else {
            itemName = itemToRemove.name;
            quantity = quantity > 0 ? quantity : itemToRemove.quantity;
        }
        const item = this.item(itemName);

        if (!item) return;

        const removeQuantity = quantity ?? Math.min(item.quantity, this.count(itemName));

        if (item.quantity > removeQuantity) {
            item.quantity -= removeQuantity;
            console.log(`removing ${removeQuantity} ${itemName}. ${item.quantity} left.`)
        } else {
            this.items = this.items.filter(i => i.name !== itemName);
        }
    }

    transfer(itemToTransfer: string | Item, container: Container, quantity?: number) {
        const itemName = typeof itemToTransfer == 'string' ? itemToTransfer : itemToTransfer.name;
        if (quantity === undefined) {
            quantity = this.count(itemName);
        }
        const item = this.item(itemName);

        if (item) {
            const transferQuantity = quantity === 0 ? item.quantity : Math.min(quantity, item.quantity);
            this.remove(item, transferQuantity);
            container.add(Object.assign(item.copy(), { quantity: transferQuantity }));
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

export { Item, Container, ItemParams, WeaponTypes, weapon_conversions };
