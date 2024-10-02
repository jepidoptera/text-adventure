import { Container, Item } from "./item.ts";
import { Character } from "./character.ts";

class Landmark {
    name: string;
    description: string;
    location?: Location;
    onAssign?: (location: Location) => void;
    constructor({name, description, onAssign}: {name: string, description: string, onAssign?: (location: Location) => void}) {
        this.name = name;
        this.description = description;
        this.onAssign = onAssign;
    }
    assign(location: Location) {
        this.location = location
        this.onAssign?.(location);
    }
}

class Location extends Container {
    unique_id!: string | number;
    name: string;
    adjacent: Map<string, Location> | undefined;
    _adjacent: { [key: string]: string | number } = {};
    description: string | undefined;
    characters: Character[] = [];
    Landmarks: Landmark[] = [];
    actions: Map<string, (...args: any[]) => void> = new Map();
    constructor({
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
    }) {
        super(items);
        this.name = name;
        this.description = description;
        this._adjacent = adjacent;
        for (let character of characters) {
            this.addCharacter(character);
        };
    }
    addCharacter(character: Character) {
        this.characters.push(character);
        character.location = this;
        return this;
    }
    removeCharacter(character: Character) {
        this.characters = this.characters.filter(c => c !== character);
        return this;
    } 
    addLandmark(Landmark: Landmark) {
        Landmark.assign(this);
        this.Landmarks.push(Landmark);
        return this;
    }
    enter(character: Character) {
        this.addCharacter(character);
    }
    exit(character: Character, direction?: string) {
        this.characters = this.characters.filter(c => c !== character);
    }
    character(name: string): Character | undefined {
        const char = (
            this.characters.find(character => character.name === name)
            || this.characters.find(character => character.description === name)
        )
        console.log(`found ${char?.name}`)
        return char;
    }
    get playerPresent(): boolean {
        return this.characters.some(character => character.isPlayer);
    }
}


export { Character, Item, Location, Landmark, Container };