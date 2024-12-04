import { Player } from "./player";
import { magenta } from "./colors";
class Hint {
    constructor(public text: string[], public condition: (player: Player) => boolean) {
        this.text = text;
        this.condition = condition;
    }
    async print() {
        color(magenta);
        for (let line of this.text) {
            print('Assistant --', line);
        }
    }
}

const hints = {
    'sign': new Hint(
        ['type "read sign" to read the sign.'],
        (player) => player.location?.landmarks?.some(landmark => landmark.name === 'sign') || false
    ),
    'basic_directions': new Hint(
        ['type "n", "s", "e", or "w" to move.'],
        (player) => true
    ),
}

function assistant(player: Player) {
    const hint = Object.values(hints).find(hint => hint.condition(player));
    if (hint) {
        hint.print();
    }
}