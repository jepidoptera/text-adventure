import { Player } from "./player.ts";
import { magenta } from "./colors.ts";
type hintParameters = {
    name: string,
    text: string[],
    condition: (player: Player) => boolean,
    appearances?: number
}
class Hint {
    text: string[];
    condition: (player: Player) => boolean;
    name: string;
    appearances: number = 1;
    constructor({ name, text, condition, appearances }: hintParameters) {
        this.name = name;
        this.text = text;
        this.condition = condition;
        if (appearances) this.appearances = appearances;
    }
    async print() {
        color(magenta);
        for (let line of this.text) {
            print('Assistant --', line);
        }
    }
}

const hintParams: hintParameters[] = [
    {
        name: 'read sign',
        text: ['type "read sign" to read the sign.'],
        condition: (player: Player) => player.location?.landmarks?.some(landmark => landmark.name === 'sign') || false,
    }, {
        name: 'move',
        text: ['type "n", "s", "e", or "w" to move.'],
        condition: (player: Player) => true,
    }, {
        name: 'inventory',
        text: ['type "i" to see your inventory.'],
        condition: (player: Player) => true,
    }, {
        name: 'look',
        text: ['type "look" to look around.'],
        condition: (player: Player) => true,
    }, {
        name: 'flee',
        text: ['type "flee" to run away.'],
        condition: (player: Player) => player.fighting && player.hp < 10,
        appearances: 5
    }, {
        name: 'fight',
        text: ['type "attack clubman" to attack.'],
        condition: (player: Player) => player.location?.characters.some(character => character.name === 'clubman') || false,
    }
]
let hints = hintParams.map(hint => new Hint(hint));

function assistant(player: Player) {
    const hint = hints.find(
        hint => (player.assistantHintsUsed[hint.name] || 0) < hint.appearances && hint.condition(player)
    );
    if (hint) {
        color(magenta);
        for (let line of hint.text) {
            print(`Assistant -- ${line}`);
        }
        if (!player.assistantHintsUsed[hint.name])
            player.assistantHintsUsed[hint.name] = 1;
        else
            player.assistantHintsUsed[hint.name]++;
    }
}

export { assistant }