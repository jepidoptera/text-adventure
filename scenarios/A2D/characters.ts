import { Location } from '../../game/location.ts';
import { Character } from '../../game/character.ts';
import { Item } from '../../game/item.ts';
import { plural, cap } from '../../game/utils.ts';
import { items } from './items.ts';
import { landmarks } from './landmarks.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'

class A2dCharacter extends Character {
    weapons: {[key: string]: Item} = {'main': items.fist()} // default, should be overridden
    attackTarget: A2dCharacter | undefined = undefined
    
    encounter(character: Character) {
        this.onEncounter?.(character);
        if (this.enemies.includes(character) || this.attackPlayer && character.isPlayer) {
            if (character.isPlayer) {
                print(`${this.name} takes the initiative to attack you!`);
            } else if (this.location?.playerPresent) {
                print(`${this.name} attacks ${character.name}!`);
            }
            this.attackTarget = character;
        }
    }

    describeAttack(target: Character, weapon: Item = this.weapons['main'], damage: number) {
        console.log(`attacking ${target.name} with ${weapon.name}: ${damage} damage`)
        const DT = (damage / target.max_hp) * 100
        const enemyName = target.isPlayer ? 'you' : target.name
        const s = ['you', 'they'].includes(this.pronouns.subject) ? (str: string) => str : plural
        const t_s = ['you', 'they'].includes(target.pronouns.subject) ? (str: string) => str : plural
        const t_be = ['you', 'they'].includes(target.pronouns.subject) ? 'are' : 'is'

        if (DT === 0) {
            if (this.location?.playerPresent) {
                color(gray)
                print(`${this.pronouns.subject} ${s('miss')} ${target.pronouns.object} with ${weapon.name}!`)
                return
            }
        }

        let does = `${cap(this.pronouns.subject)} ${s('graze')} ${target.pronouns.object} with ${weapon.name}, doing little to no damage.`;
        let weaponType = weapon.weapon_stats?.weapon_type
        if (weaponType === 'sword') weaponType = Math.random() > 0.5 ? 'spear' : 'axe'
        switch (weaponType) {
            case ("club"):
                if (DT >= 5) {does = `${cap(this.pronouns.subject)} ${s('knock')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.`};
                if (DT >= 12) {does = `${cap(this.pronouns.subject)} ${s('whack')} ${target.pronouns.object} with ${weapon.name}, making a jagged cut.`};
                if (DT >= 25) {does = `${cap(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, knocking ${target.pronouns.object} backwards.`};
                if (DT >= 40) {does = `${cap(this.pronouns.subject)} ${s('smash')} ${target.pronouns.object} with ${weapon.name}, and you hear a bone break.`};
                if (DT >= 60) {does = `${cap(this.pronouns.subject)} ${s('crush')} ${target.pronouns.object} with ${weapon.name}, damaging organs.`};
                if (DT >= 100) {does = `${cap(this.pronouns.subject)} ${s('pulverise')} ${target.pronouns.object} with ${weapon.name}, splintering bones.`};
                if (DT >= 500) {does = `${cap(this.pronouns.subject)} ${s('send')} ${target.pronouns.object} FLYING backwards with ${weapon.name}, and severed body parts fly in all directions!`};
                break;
            case ("axe"):
                if (DT >= 5) {does = `${cap(this.pronouns.subject)} ${s('scratch')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.`};
                if (DT >= 12) {does = `${cap(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, making a deep gash.`};
                if (DT >= 25) {does = `${cap(this.pronouns.subject)} ${s('slash')} ${target.pronouns.object} with ${weapon.name}, inflicting a major wound.`};
                if (DT >= 40) {does = `${cap(this.pronouns.subject)} ${s('hack')} ${target.pronouns.object} with ${weapon.name}, and you hear a bone break.`};
                if (DT >= 60) {does = `${cap(this.pronouns.subject)} ${s('lacerate')} ${target.pronouns.object} with ${weapon.name}, inflicting a mortal wound.`};
                if (DT >= 100) {does = `${cap(this.pronouns.subject)} ${s('hew')} ${target.pronouns.object} with ${weapon.name}, severing limbs.`};
                if (DT >= 200) {does = `${cap(this.pronouns.subject)} ${s('cleave')} ${target.pronouns.object} with ${weapon.name}, slicing ${target.pronouns.object} in half.`};
                break;
            case ("spear"):
                if (DT >= 8) {does = `${cap(this.pronouns.subject)} ${s('nick')} ${target.pronouns.object} with ${weapon.name}, drawing blood.`};
                if (DT >= 17) {does = `${cap(this.pronouns.subject)} ${s('jab')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.`};
                if (DT >= 35) {does = `${cap(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, inflicting a major wound.`};
                if (DT >= 55) {does = `${cap(this.pronouns.subject)} ${s('stab')} ${target.pronouns.object} with ${weapon.name}, damaging organs.`};
                if (DT >= 100) {does = `${cap(this.pronouns.subject)} ${s('impale')} ${target.pronouns.object} with ${weapon.name}, making vital fluids gush.`};
                if (DT >= 200) {does = `${cap(this.pronouns.subject)} ${s('eviscerate')} ${target.pronouns.object} with ${weapon.name}, and blood splatters everywhere.`};
                break;
            case ("burn"):
                if (DT >= 5) {does = `${cap(this.pronouns.subject)} ${s('graze')} ${target.pronouns.object} with ${weapon.name}, singeing ${target.pronouns.possessive} hair.`};
                if (DT >= 12) {does = `${cap(this.pronouns.subject)} ${s('scorch')} ${target.pronouns.object} with ${weapon.name}, inflicting first-degree burns.`};
                if (DT >= 25) {does = `${cap(this.pronouns.subject)} ${s('scald')} ${target.pronouns.object} with ${weapon.name}, inflicting second-degree burns.`};
                if (DT >= 40) {does = `${cap(this.pronouns.subject)} ${s('ignite')} ${target.pronouns.object} with ${weapon.name}, instantly blistering skin.`};
                if (DT >= 60) {does = `${cap(this.pronouns.subject)} ${s('roast')} ${target.pronouns.object} with ${weapon.name}, making charred flesh sizzle.`};
                if (DT >= 100) {does = `${cap(this.pronouns.subject)} ${s('torch')} ${target.pronouns.object} with ${weapon.name}, boiling the blood inside ${target.pronouns.possessive} veins.`};
                if (DT >= 200) {does = `${cap(this.pronouns.subject)} ${s('incinerate')} ${target.pronouns.object} with ${weapon.name}, setting fire to ${target.pronouns.possessive} skeleton.`};
                if (DT >= 500) {does = `${cap(this.pronouns.subject)} ${s('cremate')} ${target.pronouns.object} with ${weapon.name}, burning ${target.pronouns.object} to ash.`};
                break;
            case ("arrow"):
                does = `${target.name} barely ${t_s('notices')} ${this.pronouns.possessive} arrow striking ${target.pronouns.object}.`;
                if (DT >= 5) {does = `${cap(target.pronouns.subject)} ${s('take')} minimal damage.`};
                if (DT >= 12) {does = `${cap(target.pronouns.subject)} ${t_be} minorly wounded.`};
                if (DT >= 25) {does = `${cap(target.pronouns.subject)} ${s('sustain')} a major injury.`};
                if (DT >= 50) {does = `${cap(target.pronouns.subject)} ${s('suffer')} damage to vital organs.`};
                if (DT >= 100) {does = `${cap(target.pronouns.subject)} ${t_be} slain instantly.`};
                if (DT >= 400) {does = `${cap(target.pronouns.subject)} ${t_be} ripped messily in half.`};
                if (DT >= 1000) {does = `Tiny pieces of ${cap(target.pronouns.subject)} fly in all directions.`};
                if (DT >= 2500) {does = `${cap(target.pronouns.subject)} ${t_be} VAPORIZED.`};
                break;
            case ("newbie" || "powermaxout"):
                does = `${cap(target.pronouns.subject)} ${s('wince')} slightly, perhaps at ${this.pronouns.possessive} incompetence.`;
                if (DT >= 10) {does = `${cap(target.pronouns.subject)} ${t_be} knocked back a step.`};
                if (DT >= 25) {does = `${cap(target.pronouns.subject)} ${s('stagger')} under the force.`};
                if (DT >= 50) {does = `${cap(target.pronouns.subject)} ${s('reel')} backwards, almost knocked off ${target.pronouns.possessive} feet.`};
                if (DT >= 100) {does = `${cap(target.pronouns.subject)} ${t_be} snuffed out like a candle.`};
                if (DT >= 500) {does = `${cap(target.pronouns.subject)} ${t_be} swept off ${target.pronouns.possessive} feet and out of the time/space continuum!`};
                break;
            case ("bolt"):
                does = `${cap(target.pronouns.subject)} ${t_s('twitch')} irritably as the bolt strikes.`;
                if (DT >= 10) {does = `${cap(target.pronouns.subject)} ${t_be} struck with a sizzle.`};
                if (DT >= 25) {does = `${cap(target.pronouns.subject)} ${t_be} badly zapped.`};
                if (DT >= 50) {does = `${cap(target.pronouns.subject)} ${t_s('howl')}, and ${t_be} rendered briefly transparent.`};
                if (DT >= 100) {does = `${cap(target.pronouns.subject)} ${t_s('fall')}, smoking, to the ground and ${t_s('twitch')} a couple of times.`};
                if (DT >= 500) {does = `${cap(target.pronouns.subject)} ${t_s('explode')} like a knot of pine sap.`};
                break;
            case ("fire"):
                does = `${cap(target.pronouns.subject)} ${t_be} burned slightly.`;
                if (DT >= 10) {does = `${cap(target.pronouns.subject)} stops, drops, and rolls.`};
                if (DT >= 25) {does = `${cap(target.pronouns.subject)} ${t_be} scorched blisteringly.`};
                if (DT >= 50) {does = `${cap(target.pronouns.subject)} ${t_be} very seriously torched.`};
                if (DT >= 100) {does = `${cap(target.pronouns.subject)} ${t_be} blasted off ${target.pronouns.possessive} feet and ${t_s('land')} in a smoking heap.`};
                if (DT >= 500) {does = `${cap(target.pronouns.possessive)} family is saved the cost of a cremation as ${target.pronouns.possessive} ashes scatter in a puff.`};
                break;
            case ("blades"):
                does = `${cap(target.pronouns.subject)} ${t_be} only scratched.`;
                if (DT >= 10) {does = `${cap(target.pronouns.subject)} ${t_s('suffer')} some nicks and cuts.`};
                if (DT >= 25) {does = `${cap(target.pronouns.subject)} ${t_be} slashed rather badly.`};
                if (DT >= 50) {does = `${cap(target.pronouns.subject)} ${t_s('scream')} as magical knives stab through ${target.pronouns.object}.`};
                if (DT >= 100) {does = `${cap(target.pronouns.subject)} ${t_be} sliced to ribbons.`};
                break;
        }
        if (this.location?.playerPresent) {
            color(black)
            if (!this.isPlayer && !target.isPlayer) {
                print(`${this.name} attacks ${target.name} with ${weapon.name}!`)
            }
            print(does)
        }
    }
}

const characters: {[key: string]: (...args: any) => A2dCharacter} = {
    Ieadon(args: {[key: string]: any}) {
        return new A2dCharacter({
            name: 'Ieadon',
            items: [items.gold(1000)]
        })
    },
    sick_old_cleric(args: {[key: string]: any}) {
        return new A2dCharacter({
            name: 'cleric',
            description: 'A sick old cleric, lying in bed',
            items: [items.clear_liquid(), items.blue_liquid(), items.red_liquid()],
        }).addAction('talk', function(player: Character) {
            print("A young fresh piece of meat... how nice.  I am leaving this world, I can feal")
            print("it.  Please, I have something to ask of you.  My father's father was alive in")
            print("the year of 1200, during that year there was rumored to be a strange")
            print("wizard living in this town, in this room.  It was rumored he died putting all")
            print("his life into 5 rings.  Rings of Time, Stone, Nature, Dreams, and")
            print("the ring of Ultimate Power.  Please... recover these jewels for the good of ")
            print("life as whole.  They were taken from this wizard on his death bed, before the")
            print("kings guards could come and take them to the stronghold.  It was heard that  ")
            print("goblins had raided and plundered them.  This world will never survive with ")
            print("them in the power of Evil...")
            print("Before I go- take these, they will help you:")
            color(red)
            print("<recieved blue liquid>")
            print("<recieved red liquid>")
            print("<recieved clear liquid>")
            print("Good lu -----")
            this.location?.removeCharacter(this)
            this.location?.addLandmark(landmarks.dead_cleric)
            this.inventory.transferAll(player.inventory)
        })
    },
    clubman(args: {[key: string]: any}) {
        return new A2dCharacter({
            name: 'clubman',
            pronouns: {subject: 'he', object: 'him', possessive: 'his'},
            hp: 21,
            blunt_damage: 7,
            coordination: 2,
            agility: 1,
            weapon: items.club(),
            items: [items.club()],
            exp: 25,
            ...args
        })
    },
    swordsman(args: {[key: string]: any}) {
        return new A2dCharacter({
            name: 'swordsman',
            hp: 37,
            sharp_damage: 17,
            coordination: 3,
            agility: 2,
            weapons: {main: items.shortsword()},
            items: [items.shortsword()],
            ...args
        })
    }
}

const he = characters.clubman().pronouns.subject

export { A2dCharacter, characters };
