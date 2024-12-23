import { Player } from "./player.ts";
import { magenta } from "./colors.ts";
type hintParameters = {
    name: string,
    text: string[],
    condition: (player: Player) => boolean,
    repeats?: number
}
class Hint {
    text: string[];
    condition: (player: Player) => boolean;
    name: string;
    repeats: number = 1;
    constructor({ name, text, condition, repeats: repeats }: hintParameters) {
        this.name = name;
        this.text = text;
        this.condition = condition;
        if (repeats) this.repeats = repeats;
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
        name: 'go east',
        text: ["Go east to learn about the plot."],
        condition: (player: Player) => player.location?.key == '1' && !player.game.flags.cleric
    }, {
        name: 'talk cleric',
        text: ["talk to this cleric.  He is very wise."],
        condition: (player: Player) => player.location?.key == '14' && !player.game.flags.cleric
    }, {
        name: 'move',
        text: ['type "n", "s", "e", or "w" to move.'],
        condition: (player: Player) => true,
    }, {
        name: 'read sign',
        text: ['type "read sign" to read the sign.'],
        condition: (player: Player) => player.location?.landmarks?.some(landmark => landmark.name === 'sign') || false,
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
        repeats: 5
    }, {
        name: 'fight',
        text: ['type "attack clubman" to attack.'],
        condition: (player: Player) => player.location?.characters.some(character => character.name === 'clubman') || false,
    }, {
        name: 'wield',
        text: [
            'fighting empty-handed is not ideal.',
            'type "wield club" to equip a weapon.'
        ],
        condition: (player: Player) => player.fighting && player.equipment['right hand']?.name == 'fist',
    }, {
        name: 'cast spell',
        text: [`type "cast bolt" to cast a spell.`],
        condition: (player: Player) => player.abilities['bolt'] > 0 && player.fighting,
    }, {
        name: 'cast newbie',
        text: ['type "cast newbie" to cast a spell.'],
        condition: (player: Player) => player.abilities['bolt'] == 0 && player.abilities['newbie'] > 0 && player.fighting,
    }, {
        name: 'heal',
        text: ['type "heal" to heal yourself.'],
        condition: (player: Player) => player.max_hp - player.hp > player.healing && !player.lastCommand.slice(0, 5).includes('heal'),
        repeats: 3
    }, {
        name: 'die',
        text: [
            "Next time be careful when you choose your fights, though",
            "sometimes its good to be darring and explore new areas where",
            "creatures may not be so friendly",
        ],
        condition: (player: Player) => player.dead,
    }, {
        name: 'mythin',
        text: [
            "the ultimate thief, Mythin!",
            "type \"list\" to see what he can teach you."
        ],
        condition: (player: Player) => player.location?.key == '78'
    }, {
        name: 'ieadon',
        text: [
            "the legendary fighter, Ieadon!",
            "type \"list\" to see what you can learn here."
        ],
        condition: (player: Player) => player.location?.key == '24'
    }, {
        name: 'eldfarl',
        text: ["the world'd greatest cleric, Eldfarl! Go south for classes."],
        condition: (player: Player) => player.location?.key == '311'
    }, {
        name: 'eldfarl classes',
        text: ['type "list" to see classes offered here.'],
        condition: (player: Player) => player.location?.key == '316'
    }, {
        name: 'eldin',
        text: [
            "the great spellcaster, Eldin!",
            "type \"list\" to see classes offered here."
        ],
        condition: (player: Player) => player.location?.key == '109'
    }, {
        name: 'arach1',
        text: [
            "talk to this colonel.",
        ],
        condition: (player: Player) => player.location?.name == "Center of Town",
    }, {
        name: 'arach2',
        text: [
            "talk to the colonel again.",
        ],
        condition: (player: Player) => player.location?.name == "Center of Town" && player.has('bug repellent'),
    }
]
let hints = hintParams.map(hint => new Hint(hint));

function assistant(player: Player) {
    const hint = hints.filter(
        hint => (player.assistantHintsUsed[hint.name] || 0) < hint.repeats
    ).find(
        hint => hint.condition(player)
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