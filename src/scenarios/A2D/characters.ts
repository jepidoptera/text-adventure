import { Location } from '../../game/location.ts';
import { Character, CharacterParams, pronouns } from '../../game/character.ts';
import { Item } from '../../game/item.ts';
import { Player } from './player.ts';
import { plural, caps, randomChoice } from '../../game/utils.ts';
import { getItem } from './items.ts';
import { getLandmark } from './landmarks.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts'
import { GameState } from '../../game/game.ts';
import { A2D } from './game.ts';

interface A2dCharacterParams extends CharacterParams {
    spellChance?: ((this: A2dCharacter) => boolean) | undefined
    respawnTime?: number,
    action?: keyof typeof actions
}

class A2dCharacter extends Character {
    key: string = ''
    class_name: string = ''
    _spellChance: ((this: A2dCharacter) => boolean) | undefined
    tripping: number = 0;
    drunk: number = 0;
    _action: string | undefined;
    declare game: A2D

    constructor({ spellChance, respawnTime, action, ...baseParams }: A2dCharacterParams) {
        super(baseParams)
        if (!this.weapons['main']) this.weapons.main = getItem('fist')
        this._spellChance = spellChance?.bind(this)
        this.respawnTime = respawnTime || this.respawnTime
        if (action == "wander") this.onTurn(actions[action])
        if (caps(this.alignment) == 'Ierdale') {
            this.onEncounter(
                async function (character: Character) {
                    if (character.flags.enemy_of_ierdale) {
                        if (!this.enemies.includes(character)) this.enemies.push(character)
                    }
                }
            )
        }
        if (!this.exp_value) {
            this.exp_value = Math.floor(
                this.max_hp / 2
                + this.sharp_damage() + this.blunt_damage() + this.magic_damage()
                + this.blunt_armor + this.sharp_armor + this.magic_armor
                + this.magic_level
                + this.coordination * 2 + this.agility * 2
                + Object.values(this.abilities).reduce((sum, value) => sum + value, 0) * 10
            )
        }
    }

    private bindMethod<T extends (this: A2dCharacter, ...args: any[]) => Promise<any>>(
        method: T
    ): (this: Character, ...args: Parameters<T>) => ReturnType<T> {
        return method.bind(this as A2dCharacter) as any;
    }

    async die(cause?: any) {
        await super.die(cause);
        // go to limbo
        await this.relocate(this.game.locations.get(0))
        this.respawnCountdown = this.respawnTime;
        console.log(`${this.name} respawning in ${this.respawnCountdown} seconds from ${this.location?.name}`);
    }

    async encounter(character: Character) {
        this._onEncounter?.(character);
        if (this.enemies.includes(character) || this.attackPlayer && character.isPlayer) {
            if (character.isPlayer) {
                color(red)
                print(this.name, 1)
                color(black)
                print(` takes the initiative to attack you!`);
            } else if (this.location?.playerPresent) {
                print(`${this.name} attacks ${character.name}!`);
            }
            this.attackTarget = character;
        }
    }

    async go(direction: string): Promise<boolean> {
        const oldLocation = this.location;
        if (await super.go(direction)) {
            if (this.location?.playerPresent && !this.isPlayer && this.location && this.location.adjacent) {
                const findEntryDirection = (currentLocation: Location, previousLocation: Location): string => {
                    if (!currentLocation.adjacent) return 'nowhere';
                    for (const [direction, location] of currentLocation.adjacent) {
                        if (location === previousLocation) {
                            return direction;
                        }
                    }
                    return 'nowhere';
                };
                color(green)
                const from_direction = oldLocation ? findEntryDirection(this.location, oldLocation) : 'nowhere';
                print(`${this.name} enters from ${from_direction}.`);
            } else if (oldLocation?.playerPresent && !this.isPlayer) {
                color(green)
                print(`${this.name} leaves ${direction}.`);
            }
            return true;
        } else {
            return false;
        }
    }

    get toHit() {
        let toHit = this.agility * Math.random();
        if (this.drunk) toHit = toHit * (1 - this.drunk / (this.max_sp / 2 + 50))
        return toHit
    }

    dialog(talk: (this: A2dCharacter, player: Character) => Promise<void>) {
        return this.addAction('talk', this.bindMethod(talk));
    }

    onAttack(action: (this: A2dCharacter, target: Character) => Promise<void>): this {
        return super.onAttack(this.bindMethod(action));
    }

    onEncounter(action: (this: A2dCharacter, character: Character) => Promise<void>) {
        return super.onEncounter(this.bindMethod(action))
    }

    onEnter(action: (this: A2dCharacter, location: Location) => Promise<void>) {
        return super.onEnter(this.bindMethod(action))
    }

    onLeave(action: (this: A2dCharacter, location: Location) => Promise<void>) {
        return super.onLeave(this.bindMethod(action));
    }

    onSlay(action: (this: A2dCharacter, character: Character) => Promise<void>) {
        return super.onSlay(this.bindMethod(action));
    }

    onDeath(action: (this: A2dCharacter, gameState?: GameState) => Promise<void>) {
        return super.onDeath(this.bindMethod(action));
    }

    onTurn(action: (this: A2dCharacter, gameState: GameState) => Promise<void>) {
        return super.onTurn(this.bindMethod(action));
    }

    fightMove(action: (this: A2dCharacter) => Promise<void>): this {
        return super.fightMove(this.bindMethod(action))
    }

    addAction(name: string, action: (this: A2dCharacter, ...args: any[]) => Promise<any>) {
        this.actions.set(name, this.bindMethod(action));
        return this;
    }

    get spellChance(): boolean {
        return this._spellChance?.() || true
    }

    async describeAttack(target: Character, weapon: Item = this.weapons['main'], damage: number) {
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

        let does = `${caps(this.pronouns.subject)} ${s('graze')} ${target.pronouns.object} with ${weapon.name}, doing little to no damage.`;
        let weaponType = weapon.weapon_stats?.weapon_type
        if (weaponType === 'sword') weaponType = Math.random() > 0.5 ? 'spear' : 'axe'
        switch (weaponType) {
            case ("club"):
                if (DT >= 5) { does = `${caps(this.pronouns.subject)} ${s('knock')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.` };
                if (DT >= 12) { does = `${caps(this.pronouns.subject)} ${s('whack')} ${target.pronouns.object} with ${weapon.name}, making a jagged cut.` };
                if (DT >= 25) { does = `${caps(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, knocking ${target.pronouns.object} backwards.` };
                if (DT >= 40) { does = `${caps(this.pronouns.subject)} ${s('smash')} ${target.pronouns.object} with ${weapon.name}, and you hear a bone break.` };
                if (DT >= 60) { does = `${caps(this.pronouns.subject)} ${s('crush')} ${target.pronouns.object} with ${weapon.name}, damaging organs.` };
                if (DT >= 100) { does = `${caps(this.pronouns.subject)} ${s('pulverise')} ${target.pronouns.object} with ${weapon.name}, splintering bones.` };
                if (DT >= 500) { does = `${caps(this.pronouns.subject)} ${s('send')} ${target.pronouns.object} FLYING backwards with ${weapon.name}, and severed body parts fly in all directions!` };
                break;
            case ("axe"):
                if (DT >= 5) { does = `${caps(this.pronouns.subject)} ${s('scratch')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.` };
                if (DT >= 12) { does = `${caps(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, making a deep gash.` };
                if (DT >= 25) { does = `${caps(this.pronouns.subject)} ${s('slash')} ${target.pronouns.object} with ${weapon.name}, inflicting a major wound.` };
                if (DT >= 40) { does = `${caps(this.pronouns.subject)} ${s('hack')} ${target.pronouns.object} with ${weapon.name}, and you hear a bone break.` };
                if (DT >= 60) { does = `${caps(this.pronouns.subject)} ${s('lacerate')} ${target.pronouns.object} with ${weapon.name}, inflicting a mortal wound.` };
                if (DT >= 100) { does = `${caps(this.pronouns.subject)} ${s('hew')} ${target.pronouns.object} with ${weapon.name}, severing limbs.` };
                if (DT >= 200) { does = `${caps(this.pronouns.subject)} ${s('cleave')} ${target.pronouns.object} with ${weapon.name}, slicing ${target.pronouns.object} in half.` };
                break;
            case ("spear"):
                if (DT >= 8) { does = `${caps(this.pronouns.subject)} ${s('nick')} ${target.pronouns.object} with ${weapon.name}, drawing blood.` };
                if (DT >= 17) { does = `${caps(this.pronouns.subject)} ${s('jab')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.` };
                if (DT >= 35) { does = `${caps(this.pronouns.subject)} ${s('hit')} ${target.pronouns.object} with ${weapon.name}, inflicting a major wound.` };
                if (DT >= 55) { does = `${caps(this.pronouns.subject)} ${s('stab')} ${target.pronouns.object} with ${weapon.name}, damaging organs.` };
                if (DT >= 100) { does = `${caps(this.pronouns.subject)} ${s('impale')} ${target.pronouns.object} with ${weapon.name}, making vital fluids gush.` };
                if (DT >= 200) { does = `${caps(this.pronouns.subject)} ${s('eviscerate')} ${target.pronouns.object} with ${weapon.name}, and blood splatters everywhere.` };
                break;
            case ("burn"):
                if (DT >= 5) { does = `${caps(this.pronouns.subject)} ${s('graze')} ${target.pronouns.object} with ${weapon.name}, singeing ${target.pronouns.possessive} hair.` };
                if (DT >= 12) { does = `${caps(this.pronouns.subject)} ${s('scorch')} ${target.pronouns.object} with ${weapon.name}, inflicting first-degree burns.` };
                if (DT >= 25) { does = `${caps(this.pronouns.subject)} ${s('scald')} ${target.pronouns.object} with ${weapon.name}, inflicting second-degree burns.` };
                if (DT >= 40) { does = `${caps(this.pronouns.subject)} ${s('ignite')} ${target.pronouns.object} with ${weapon.name}, instantly blistering skin.` };
                if (DT >= 60) { does = `${caps(this.pronouns.subject)} ${s('roast')} ${target.pronouns.object} with ${weapon.name}, making charred flesh sizzle.` };
                if (DT >= 100) { does = `${caps(this.pronouns.subject)} ${s('torch')} ${target.pronouns.object} with ${weapon.name}, boiling the blood inside ${target.pronouns.possessive} veins.` };
                if (DT >= 200) { does = `${caps(this.pronouns.subject)} ${s('incinerate')} ${target.pronouns.object} with ${weapon.name}, setting fire to ${target.pronouns.possessive} skeleton.` };
                if (DT >= 500) { does = `${caps(this.pronouns.subject)} ${s('cremate')} ${target.pronouns.object} with ${weapon.name}, burning ${target.pronouns.object} to ash.` };
                break;
            case ("arrow"):
                does = `${target.name} barely ${t_s('notices')} ${this.pronouns.possessive} arrow striking ${target.pronouns.object}.`;
                if (DT >= 5) { does = `${caps(target.pronouns.subject)} ${s('take')} minimal damage.` };
                if (DT >= 12) { does = `${caps(target.pronouns.subject)} ${t_be} minorly wounded.` };
                if (DT >= 25) { does = `${caps(target.pronouns.subject)} ${s('sustain')} a major injury.` };
                if (DT >= 50) { does = `${caps(target.pronouns.subject)} ${s('suffer')} damage to vital organs.` };
                if (DT >= 100) { does = `${caps(target.pronouns.subject)} ${t_be} slain instantly.` };
                if (DT >= 400) { does = `${caps(target.pronouns.subject)} ${t_be} ripped messily in half.` };
                if (DT >= 1000) { does = `Tiny pieces of ${caps(target.pronouns.subject)} fly in all directions.` };
                if (DT >= 2500) { does = `${caps(target.pronouns.subject)} ${t_be} VAPORIZED.` };
                break;
            case ("magic"):
                does = `${caps(target.pronouns.subject)} ${s('wince')} slightly, perhaps at ${this.pronouns.possessive} incompetence.`;
                if (DT >= 10) { does = `${caps(target.pronouns.subject)} ${t_be} knocked back a step.` };
                if (DT >= 25) { does = `${caps(target.pronouns.subject)} ${s('stagger')} under the force.` };
                if (DT >= 50) { does = `${caps(target.pronouns.subject)} ${s('reel')} backwards, almost knocked off ${target.pronouns.possessive} feet.` };
                if (DT >= 100) { does = `${caps(target.pronouns.subject)} ${t_be} snuffed out like a candle.` };
                if (DT >= 500) { does = `${caps(target.pronouns.subject)} ${t_be} swept off ${target.pronouns.possessive} feet and out of the time/space continuum!` };
                break;
            case ("electric"):
                does = `${caps(target.pronouns.subject)} ${t_s('twitch')} irritably as the bolt strikes.`;
                if (DT >= 10) { does = `${caps(target.pronouns.subject)} ${t_be} struck with a sizzle.` };
                if (DT >= 25) { does = `${caps(target.pronouns.subject)} ${t_be} badly zapped.` };
                if (DT >= 50) { does = `${caps(target.pronouns.subject)} ${t_s('howl')}, and ${t_be} rendered briefly transparent.` };
                if (DT >= 100) { does = `${caps(target.pronouns.subject)} ${t_s('fall')}, smoking, to the ground and ${t_s('twitch')} a couple of times.` };
                if (DT >= 200) { does = `${caps(this.pronouns.subject)} ${s('ignite')} ${target.pronouns.object} with ${weapon.name}, and electrical flames shoot from ${target.pronouns.possessive} blistered\neye sockets.` };
                if (DT >= 500) { does = `${caps(target.pronouns.subject)} ${t_s('explode')} like a knot of pine sap.` };
                break;
            case ("fire"):
                does = `${caps(target.pronouns.subject)} ${t_be} burned slightly.`;
                if (DT >= 10) { does = `${caps(target.pronouns.subject)} stops, drops, and rolls.` };
                if (DT >= 25) { does = `${caps(target.pronouns.subject)} ${t_be} scorched blisteringly.` };
                if (DT >= 50) { does = `${caps(target.pronouns.subject)} ${t_be} very seriously torched.` };
                if (DT >= 100) { does = `${caps(target.pronouns.subject)} ${t_be} blasted off ${target.pronouns.possessive} feet and ${t_s('land')} in a smoking heap.` };
                if (DT >= 500) { does = `${caps(target.pronouns.possessive)} family is saved the cost of a cremation as ${target.pronouns.possessive} ashes scatter in a puff.` };
                break;
            case ("blades"):
                does = `${caps(target.pronouns.subject)} ${t_be} only scratched.`;
                if (DT >= 10) { does = `${caps(target.pronouns.subject)} ${t_s('suffer')} some nicks and cuts.` };
                if (DT >= 25) { does = `${caps(target.pronouns.subject)} ${t_be} slashed rather badly.` };
                if (DT >= 50) { does = `${caps(target.pronouns.subject)} ${t_s('scream')} as magical knives stab through ${target.pronouns.object}.` };
                if (DT >= 100) { does = `${caps(target.pronouns.subject)} ${t_be} sliced to ribbons.` };
                break;
            case ("sonic"):
                if (DT >= 5) { does = `${caps(this.pronouns.possessive)} ${weapon.name} stings ${target.pronouns.object}, making ${target.pronouns.object} grit ${target.pronouns.possessive} teeth.` };
                if (DT >= 10) { does = `${caps(this.pronouns.possessive)} ${weapon.name} stabs at ${target.pronouns.possessive} ears, and ${target.pronouns.subject} ${t_s('feel')} momentarily faint.` };
                if (DT >= 20) { does = `${caps(this.pronouns.possessive)} ${weapon.name} hits ${target.pronouns.object} full in the face, making ${target.pronouns.possessive} ears ring.` };
                if (DT >= 35) { does = `${caps(this.pronouns.possessive)} ${weapon.name} strikes ${target.pronouns.object} in the gut, sucking the breath from ${target.pronouns.possessive} lungs.` };
                if (DT >= 60) { does = `${caps(this.pronouns.possessive)} ${weapon.name} rolls through ${target.pronouns.object}, siezing in ${target.pronouns.possessive} chest, and blackness\ncreeps into the corners of ${target.pronouns.possessive} vision.` };
                if (DT >= 100) { does = `${caps(this.pronouns.possessive)} ${weapon.name} sweeps ${target.pronouns.possessive} feet from under ${target.pronouns.object}, etching cold lines of\nfrost over ${target.pronouns.possessive} stilled heart.` };
                if (DT >= 200) { does = `${caps(this.pronouns.possessive)} ${weapon.name} pierces ${target.pronouns.object} like a sword, freezing the blood in ${target.pronouns.possessive} veins.` };
                if (DT >= 500) { does = `${caps(this.pronouns.possessive)} ${weapon.name} whips through ${target.pronouns.possessive} body, and ${target.pronouns.possessive} frozen limbs shatter like\nfine crystal."   ` };
                break;
            case ("teeth"):
                if (DT >= 5) { does = `${caps(this.pronouns.subject)} ${s('nip')} ${target.pronouns.object} with ${weapon.name}, inflicting a minor wound.` };
                if (DT >= 12) { does = `${caps(this.pronouns.subject)} ${s('rake')} ${target.pronouns.object} with ${weapon.name}, leaving a trail of scratches.` };
                if (DT >= 25) { does = `${caps(this.pronouns.subject)} ${s('bite')} ${target.pronouns.object} with ${weapon.name}, inflicting a major wound.` };
                if (DT >= 40) { does = `${caps(this.pronouns.subject)} ${s('chomp')} ${target.pronouns.object} with ${weapon.name}, taking a chunk from ${target.pronouns.possessive} side.` };
                if (DT >= 60) { does = `${caps(this.pronouns.subject)} ${s('rip')} ${target.pronouns.object} with ${weapon.name}, making vital fluids gush.` };
                if (DT >= 100) { does = `${caps(this.pronouns.subject)} ${s('shred')} ${target.pronouns.object} with ${weapon.name}, severing limbs.` };
                if (DT >= 200) { does = `${caps(this.pronouns.subject)} ${s('crush')} ${target.pronouns.object} with ${weapon.name}, snapping ${target.pronouns.possessive} bones like matchsticks.` };
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

const actions = {
    wander: async function (this: A2dCharacter) {
        this._action = 'wander' // this is a kind of hacky way to make sure this information is saved as a string. come up with something better later?
        if (this.attackTarget) return;
        if (randomChoice([true, false])) { this.go(randomChoice(Array.from(this.location?.adjacent?.keys() || []))) }
    },
    pish2: async function (character: Character) {
        // usage: character.onAttack(actions.pish2)
        if (character.isPlayer) print("I don't want to fight.");
        character.attackTarget = undefined;
    },
    heal: async function (this: A2dCharacter) {
        if (this.spellChance) {
            this.recoverStats({ hp: this.magic_level });
            if (this.location?.playerPresent) print(`${caps(this.name)} heals ${this.pronouns.object}self.`);
        }
    },
    max_heal: async function (this: A2dCharacter) {
        if (this.spellChance) {
            this.recoverStats({ hp: this.max_hp });
            if (this.location?.playerPresent) print(`${caps(this.name)} heals ${this.pronouns.object}self fully.`);
        }
    },
    sleep: async function (this: A2dCharacter, length: number = 1) {
        print(`TODO: sleep`)
    },
    growl: async function (this: A2dCharacter) {
        if (this.attackTarget?.isPlayer) {
            print(`TODO: growl`);
        }
    },
    howl: async function (this: A2dCharacter) {
        if (this.attackTarget?.isPlayer) {
            print(`TODO: howl`);
        }
    },
    train: async function (
        { player, skillName, requirements, classDiscount, result }:
            {
                player: Character,
                skillName: string,
                requirements: { gold: number, xp: number, magic_level?: number },
                classDiscount: { [key: string]: number },
                result: (player: Character) => void
            }
    ) {
        const discount = (classDiscount[player.class_name] ? (1 - classDiscount[player.class_name] / 100) : 1)
        requirements.gold = Math.floor(requirements.gold * discount),
            requirements.xp = Math.floor(requirements.xp * discount),
            requirements.magic_level = requirements.magic_level || 0
        if (player.isPlayer) {
            print("It will require the following attributes:");
            if (classDiscount[player.class_name]) {
                print(`Because you are of the ${player.class_name} class, "${skillName}"`)
                print(`will take ${classDiscount[player.class_name]}% less gold and experience.`);
            }
            print(`Exp: ${requirements.xp}`);
            if (requirements.magic_level) print(`Magic Level: ${requirements.magic_level} or higher.`);
            print(`Gold: ${requirements.gold}`);
        }
        if (player.has('gold', requirements.gold) && player.experience >= requirements.xp && player.magic_level >= requirements.magic_level) {
            player.inventory.remove('gold', requirements.gold);
            player.experience -= requirements.xp;
            if (player.isPlayer) {
                print("You begin your training...");
                await pause(3);
                print("You continue your training...");
                await pause(3);
                print("Your training is almost complete...");
                await pause(2);
            }
            result(player);
            return;
        }
        if (player.isPlayer) {
            if (player.experience < requirements.xp) {
                print("You do not have enough experience.");
            }
            if (!player.has('gold', requirements.gold)) {
                print("You do not have enough gold.");
            }
            if (player.magic_level < requirements.magic_level) {
                print("You are too low of a magic level.");
            }
            print("You will not be able to train at this time.");
            print("Press any key.");
            await getKey();
        }
    },
}

const characters: { [key: string]: (...args: any) => A2dCharacter } = {
    sick_old_cleric(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'A sick old cleric, lying in bed',
            aliases: ['cleric', 'old cleric', 'sick cleric', 'sick old cleric'],
            description: 'A sick old cleric, lying in bed',
            items: [getItem('clear_liquid'), getItem('blue_liquid'), getItem('red_liquid')],
        }).dialog(async function (player: Character) {
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
            this.location?.addLandmark(getLandmark('dead_cleric'))
            this.inventory.transferAll(player.inventory)
        })
    },

    ierdale_forester(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale forester',
            items: [getItem('long_dagger'), getItem('gold', 12)],
            hp: 54,
            blunt_damage: 6,
            sharp_damage: 20,
            weapon: getItem('long_dagger'),
            description: 'forester',
            blunt_armor: 0,
            agility: 4,
            coordination: 2,
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            aliases: ['forester'],
            ...args
        }).dialog(async function (player: Character) {
            if (!player.flags.forest_pass) {
                print("You need a pass to get in to this forest.");
                print("You can buy one at the police station.  South");
                print("three times, west once, north once.");
            } else {
                print("Be careful in here.  Most of these theives are dangerous.");
            }
        }).fightMove(async function () {
            if (this.attackTarget?.isPlayer) {
                color(red)
                print(`Forester blows a short blast on ${this.pronouns.possessive} horn.`);
                print("Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true;
            }
        }).onDeparture(async function (character, direction) {
            if (direction == 'north' && character.isPlayer && character.flags.forest_pass) {
                print("Cautiously you pull back your sleve to reveal your tatoo...")
                await pause(3)
                print("Yup you're fine, proceed.")
            } else if (direction == 'north' && !character.flags.forest_pass) {
                if (character.isPlayer) print("Sorry you shal have no admitance.  You need a pass.");
                return false;
            }
            return true
        });
    },

    guard_captain(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'guard captain',
            items: [getItem('gold', 25), getItem('longsword')],
            hp: 100,
            blunt_damage: 40,
            sharp_damage: 10,
            weapon: getItem('shortsword'),
            description: 'guard captain',
            coordination: 7,
            agility: 2,
            blunt_armor: 13,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            alignment: 'ierdale',
            ...args
        }).dialog(async function () {
            print("Beware... if you attack me I will call more guards to help me.");
        }).onDeath(async function () {
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            // TODO: call troops
        });
    },

    ogre(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ogre',
            pronouns: pronouns.male,
            items: [getItem('club')],
            hp: 120,
            blunt_damage: 20,
            sharp_damage: 0,
            weapon: getItem('club'),
            description: 'giant ogre',
            coordination: 2,
            agility: 1,
            blunt_armor: 2,
            ...args
        });
    },

    minotaur(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'minotaur',
            pronouns: pronouns.male,
            items: [getItem('spiked_club')],
            hp: 760,
            blunt_damage: 280,
            sharp_damage: 13,
            weapon: getItem('spiked_club'),
            description: 'labyrinth minotaur',
            coordination: 15,
            agility: 2,
            alignment: 'evil/areaw',
            ...args
        });
    },

    stone_ogre(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'stone ogre',
            pronouns: pronouns.inhuman,
            items: [getItem('gold', 5), getItem('spiked_club')],
            hp: 100,
            blunt_damage: 20,
            sharp_damage: 5,
            weapon: getItem('spiked_club'),
            description: 'stone ogre',
            blunt_armor: 2,
            coordination: 3,
            agility: 2,
            attackPlayer: true,
            ...args
        });
    },

    ierdale_soldier(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale soldier',
            pronouns: pronouns.male,
            items: [getItem('gold', 50), getItem('claymoore')],
            hp: 300,
            blunt_damage: 90,
            sharp_damage: 10,
            weapon: getItem('claymoore'),
            description: 'ierdale soldier',
            coordination: 14,
            agility: 3,
            blunt_armor: 15,
            sharp_armor: 25,
            aliases: ['soldier'],
            ...args
        }).dialog(async function (player: Character) {
            switch (this.game.flags.ieadon) {
                case false:
                    print("We are ready to attack the filthy Orcs at a moments notice!");
                    break;
                case true:
                    print("Ieadon has escaped!");
                    print("We have no idea where he fled too.  If you can find him, ALERT US!");
                    print();
                    print("We suspect that the Orcs have helped him to escape, and are preparing to take");
                    print("military action against them.");
                    break;
            }
        }).onDeath(async function () {
            this.game.flags.soldiers_remaining -= 1;
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            // TODO: heal
        });
    },

    ierdale_general(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale general',
            pronouns: pronouns.male,
            items: [getItem('gold', 200), getItem('silver_sword')],
            hp: 700,
            blunt_damage: 120,
            sharp_damage: 50,
            weapon: getItem('silver_sword'),
            description: 'ierdale general',
            coordination: 16,
            agility: 8,
            blunt_armor: 30,
            sharp_armor: 45,
            magic_armor: 10,
            aliases: ['general'],
            ...args
        }).dialog(async function (player: Character) {
            print("Back in LINE!  This is a time of seriousness.  We are planning on crushing the");
            print("Orcs for helping Ieadon break free.  All the gates where the Orcs could enter");
            print("are locked.  Once you leave through a gate you won't be able to come back!");
        }).onDeath(async function () {
            this.game.flags.soldiers_remaining -= 1;
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            // TODO: heal
        });
    },

    security_page(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'security page',
            items: [getItem('dagger'), getItem('gold', Math.random() * 300 + 500)],
            hp: 21,
            blunt_damage: 5,
            sharp_damage: 3,
            weapon: getItem('dagger'),
            description: 'Ierdale page',
            pronouns: pronouns.female,
            aliases: ['page'],
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            print("HI!  Isn't the police chief sexy!  He's my boy friend.  Would you like a pass");
            print("to the forest?  It costs 30 gp and requires 500 exp, however we don't need to");
            print("use your exp, we just need to know you have it.");
            print("Type 'pass' to get a pass.");
        }).onDeath(async function () {
            color(red);
            print("AVENGE ME!");
            this.game.player.flags.murders += 1
            this.game.player.flags.enemy_of_ierdale = true
            let chief = this.game?.find_character('police chief')
            if (chief && chief.dead) {
                print();
                pause(2);
                print("Police chief hears cry and enters.");
                print("POLICE CHIEF");
                print("Now I bring the world down on your ASS!")
                print("That was my CHICK!");
                print();
                chief.location = this.location;
            }
        }).addAction('pass', async function (player) {
            if (player.flags.forest_pass) {
                if (player.isPlayer) print("You already have a pass.")
                return;
            }
            if (player.flags.assistant) {
                color(magenta)
                print("   -ASSISTANT-  It is a good idea to eventually get a pass to the forest.")
                print("   -ASSISTANT-  I recomend that before getting a pass, you are able to")
                print("   -ASSISTANT-  travel the Mucky Swamp without worry.")
            }
            color(black)
            if (player.experience < 500 || !player.inventory.has('gold', 30)) {
                if (player.isPlayer) print("Sorry sir, you are not aplicable.")
                return;
            }
            player.inventory.remove('gold', 30)
            if (player.isPlayer) {
                print("The Page takes out a hot iron and sets it in the fire.")
                print("One moment please!  *beams*")
                print()
                await pause(3)
                print("The page removes the iron and ", 1)
                color(red)
                print("BURNS", 1)
                color(black)
                print(" something on your shoulder.")
                print("There you go, the foresters at the gate will admit")
                print("you now.  Thankyou for your business!")
            }
            player.flags.forest_pass = true
        })
    },

    toothless_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'toothless man',
            pronouns: pronouns.male,
            items: [getItem('battle_axe'), getItem('gold', 1000)],
            hp: 70,
            blunt_damage: 0,
            sharp_damage: 40,
            weapon: getItem('battle_axe'),
            coordination: 10,
            agility: 6,
            blunt_armor: 50,
            description: '',
            spellChance: () => Math.random() < 3 / 4,
            ...args
        }).dialog(async function (player: Character) {
            print("Welcome to my thop.  Here we buy and thell many an ithem.");
            print("Read my thign to learn more bucko.  Teehhehehehe.");
        }).fightMove(actions.heal);
    },

    armor_merchant(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'armor merchant',
            pronouns: pronouns.male,
            items: [getItem('gold', 100)],
            hp: 130,
            blunt_damage: 30,
            sharp_damage: 0,
            weapon: getItem('fist'),
            coordination: 2,
            agility: 1,
            blunt_armor: 30,
            aliases: ['merchant'],
            spellChance: () => Math.random() < 1 / 3,
            ...args
        }).dialog(async function (player: Character) {
            print("May I aid in assisting you?  Read the sign.  It contains all of our products.");
            print("Also: I've heard thiers a ring somewhere in the caves off the meadow.");
        }).onDeath(async function () {
            color(red);
            print("armor merchant lets out a strangled cry as he dies.  The blacksmith is pissed.");
            const blacksmith = this.game.find_character('blacksmith')
            if (!blacksmith) {
                console.log('character "blacksmith" not found.')
                return
            }
            blacksmith.attackPlayer = true
        }).fightMove(actions.heal);
    },

    blacksmith(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'blacksmith',
            items: [getItem('gold', 50), getItem('battle_axe')],
            hp: 500,
            blunt_damage: 100,
            sharp_damage: 40,
            weapon: getItem('battle_axe'),
            coordination: 10,
            agility: 6,
            blunt_armor: 50,
            description: 'blacksmith',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            spellChance: () => Math.random() < 3 / 4,
            ...args
        }).dialog(async function (player: Character) {
            print("'Ello me'lad.  Please, I am not much of a talker, talk to the other un'");
        }).fightMove(actions.heal);
    },

    bag_boy(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bag boy',
            pronouns: pronouns.male,
            items: [getItem('gold', 4), getItem('dagger')],
            description: 'worthless little bag boy',
            hp: 70,
            weapon: getItem('dagger'),
            blunt_damage: 0,
            sharp_damage: 10,
            blunt_armor: 2,
            coordination: 1,
            agility: 1,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello SIR!  How are you on this fine day!  I love life!  Isn't this a great");
            print("job I have here!  I get to bag groceries all day long!  Weeee!");
            print("Can I help you PLLLEEEASEEE?  I'd love to help you.");
            // Call Pause(10)
            print("Can I help you?");
            // Call Pause(1.5)
            print("Pretty Please may I help?");
            // Call Pause(1.5)
            print("May I be of assistance?");
            // Call Pause(1.5)
            print("GOOD DAY!  What can I help ya with?");
            // Call Pause(1.5)
            print("Here to serve you!  Just holler!");
            // Call Pause(1.5)
            print("Seriously though, if you need anything just ASK AWAY!  Weeee!");
        }).onDeath(async function () {
            color(brightblue);
            print("---Grocer");
            // Thank god you killed him, he was getting annoying."
        });
    },

    baby_spritzer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'baby spritzer',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            items: [getItem('gold', 6), getItem('spritzer_hair')],
            description: 'potent baby spritzer',
            hp: 25,
            blunt_damage: 8,
            sharp_damage: 2,
            blunt_armor: 1,
            coordination: 1,
            weapon: new Item({ name: 'spritzer power', weapon_stats: { weapon_type: 'magic' } }),
            spellChance: () => Math.random() < 1 / 4,
            ...args
        }).dialog(async function (player: Character) {
            print("Wanna play?");
        }).onDeath(async function () {
            color(brightblue);
            print(`Baby spritzer vanishes to be with ${this.pronouns.possessive} parents, ${this.pronouns.subject} is done playing.`);
        }).fightMove(actions.sleep);
    },

    colonel_arach(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'colonel arach',
            pronouns: pronouns.male,
            items: [getItem('gold', 500), getItem('longsword')],
            description: 'Arach the Terrible',
            hp: 1500,
            sharp_damage: 500,
            weapon: getItem('longsword'),
            blunt_armor: 60,
            coordination: 20,
            agility: 20,
            aliases: ['colonel', 'arach'],
            spellChance: () => true,  // always heals
            ...args
        }).dialog(async function (player: Character) {
            if (player.has("bug repelent")) {
                print("Whats that you're holding in your hand?");
                print();
                color(red);
                print("<show colonel arach your bug repelent?> [y/n]");
                if (await getKey(['y', 'n']) == "y") {
                    print("Whats that you say... bug repelent???  BUG REPELENT!");
                    pause(2);
                    print("I DIDN'T KNOW THE STUFF EXISTED!");
                    print("Wow does that mean I am bug-free!");
                    print();
                    pause(3);
                    print("This calls for a song:");
                    // Play Musicc$(3)
                    print("Bug free the way to be");
                    // Play Musicc$(6)
                    print("way up there, happy in the tree");
                    // Play Musicc$(7)
                    print("I am as happy as she and he");
                    // Play Musicc$(7)
                    print("Oh away from the big fat BEE!");
                    // Play Musicc$(7)
                    color(red);
                    print("<colonel Arach skips away happily to unlock the gates>");
                    player.inventory.remove('bug repelent')
                    this.game.flags.colonel_arach = true
                    const gates = [
                        this.game.find_location('Eastern Gatehouse'),
                        this.game.find_location('Western Gatehouse'),
                        this.game.find_location('Northern Gatehouse'),
                    ]
                    gates.forEach(gate => {
                        if (gate) gate.landmarks = [getLandmark('open_gate')]
                        else console.log('gate not found.')
                    })
                } else {
                    print("Alright, looks curious though.");
                    print();
                }
            } else if (!this.flags['talked']) {
                this.flags['talked'] = 1;
                color(black);
                print("I am terrified of anything on more than 4 legs.");
                print("Have you be warned though, that mockerey of this is stricktly forbidden.");
                print("Mark my words, my terror of spiders and the like will not take a chunk");
                print("from my courage.  I am as brave as ever.");
                print("I am the military leader of Ieardale.");
                print();
                print("Would you like me to tell you about our town. [y/n]");
                print();
                if (await getKey(['y', 'n']) == "y") {
                    print("The areas around our town are scattered like a drop of water.");
                    print("To learn more about specific areas, read the sign.");
                    print("I would recomend some clubman for beginners.  They are a pesky bunch of denizens");
                    print("we could stand to loose a few of.  They lay dormant west and recently some have");
                    print("been spotted wandering... Why won't they just rot in their houses?");
                    print();
                    print("Anyway, I wouldn't risk opening the gates right now.  The entire town is under");
                    print("risk of invasion from nasty little bugs.  The rest of the town thinks I'm crazy");
                    print("and is on the verge of my impeachement.  *Sniffle* *Sniffle*");
                    print("Which brings me to my next topic... my personal matters.");
                }
                print();
                print("Open your heart to my personal troubles? [y/n]");
                print();
                if (await getKey(['y', 'n']) == "y") {
                    print("I was not cursed with arachnafobia until after I was elected to office about 6");
                    print("months ago.  Back then I had nothing to fear and the town had reason to elect");
                    print("me.  Until about 3 months ago when my mother was eaten by a spider.");
                    print("You see I come from very unique genes.  My mother was a thumb fairy and my");
                    print("father a local legend by the name of Mino.");
                    pause(4);
                    print("Shortly after my birth my father left town down the path of Nod, never to be");
                    print("seen again.  I wish I could meet him.");
                    print("I will continue...");
                    print("After my mother - and only family member - was killed, my fear began and has");
                    print("contiued perpetually.  The cut of trade has practically broken our little town.");
                    pause(4);
                    print("After all, the gates have been closed for a good 2 months now.  Even though");
                    print("the town loves me, I fear for their saftey and refuse to open the gates.");
                    print("Oh how I dread Impeachement!");
                }
                print();
                print("Would you like to tell", 1);
                color(red);
                print(" colonel arach ", 1);
                color(black);
                print("about yourself? [y/n]");
                if (await getKey(['y', 'n']) == "y") {
                    print();
                    color(red);
                    print(`${caps(player.name)}: I am headed out of town in search of adventure.`);
                    color(black);
                    print();
                    print("So you want to leave huh?  Well I sure won't have you going out there.  I let");
                    print("no one out the gates.  I myself, admittedly, am afraid to leave.  I am sorry.");
                    print();
                }
            } else {
                print("I'm sorry, no one will be allowed to leave as long as the menace persists.");
            }
        }).fightMove(actions.heal);
    },

    sift(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'sift',
            pronouns: pronouns.inhuman,
            items: [getItem('gold', 200), getItem('ring_of_dreams')],
            hp: 580,
            blunt_damage: 10,
            sharp_damage: 50,
            weapon: getItem('claws'),
            description: 'Sift',
            coordination: 25,
            agility: 15,
            blunt_armor: 25,
            ...args
        }).onDeath(async function () {
            this.game.flags.sift = true;
        }).fightMove(async function () {
            print('TODO: dream')
        });
    },

    cradel(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cradel',
            pronouns: pronouns.male,
            items: [getItem('gold', 100), getItem('spiked_club')],
            description: 'Cradel the troll',
            hp: 1000,
            blunt_damage: 250,
            sharp_damage: 150,
            weapon: getItem('spiked_club'),
            blunt_armor: 26,
            coordination: 5,
            agility: 5,
            spellChance: () => Math.random() < 5 / 7,
            ...args
        }).dialog(async function (player: Character) {
            if (this.game.flags.cradel) {
                print("mumble mumble");
                print("Oh to be able to sleep.");
                print("I lay long hours at trying to sleep.");
                print("To anyone who could make me fall asleep... I");
                print("would grant any wish in my power.");
            } else {
                print("Cradel grins at you sleepily");
                print("'Thankyou once again friend.'");
            }
        }).fightMove(actions.growl);
    },

    mino(args: { [key: string]: any }) {
        function musicc$(n: number) {
            return Array.from(
                { length: n },
                () => [
                    randomChoice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
                    randomChoice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
                ]
            )
        }
        function play(music: number[][]) {
            for (let i = 0; i < music.length; i++) {
                color(qbColors[music[i][0]], qbColors[music[i][1]]);
                // print music note
                print("♫", 1);
                // Play music[i]
            }
            return music
        }
        return new A2dCharacter({
            name: 'Mino',
            pronouns: pronouns.male,
            items: [getItem('gold', 15), getItem('long_dagger'), getItem('lute_de_lumonate')],
            description: 'musical Mino',
            hp: 250,
            blunt_damage: 0,
            sharp_damage: 40,
            weapon: getItem('long_dagger'),
            blunt_armor: 20,
            agility: 40,
            coordination: 12,
            ...args
        }).dialog(async function (player: Character) {
            if (this.flags.won) {
                print("You have already won the lute de lumonate.");
                return
            }
            play(musicc$(3))
            print("Welcome to my humble abode.");
            print();
            print("I am a Traveler who has come to make my rest in these caves, away from");
            print("civilization...");
            print("In fact, you're the only person I've seen in YEARS!");
            pause(5);
            print("Want to play a little game with me?");
            print("Its called 'Name That Tune'");
            print("[y/n]");
            switch (await getKey(['y', 'n'])) {
                case "y":
                    print("Good choice!");
                    print("Heres the rules:");
                    print("  ");
                    print("1) I will play you 6 tunes, and tell you who composed them");
                    print("2) I will play (1) of them once more and you must identify it");
                    print();
                    print("   IF YOU WIN!:");
                    print("        I give you a special prize - TO BE REVEALED");
                    print("   IF YOU LOOSE :-(:");
                    print("        You can just play me again!");
                    print();
                    print("Still wanna play?");
                    print("[y/n]");
                    if (await getKey(['y', 'n']) == "n") return
                    print("Ok, here I go.");
                    // Dim tune$(1 To 6)
                    this.flags.tune = {
                        'grogrin': [],
                        'mino': [],
                        'turlin': [],
                        'cat woman': [],
                        'doo-dad man': [],
                        'ieadon': [],
                    }
                    print("Tune one, by Grogrin");
                    this.flags.tune['grogrin'] = play(musicc$(10));
                    // Play tune$(1)
                    print("Press a key when finished.");
                    // GetKey
                    print("Tune two, by ME!");
                    this.flags.tune['mino'] = play(musicc$(10));
                    // Play tune$(2)
                    print("Press a key when finished.");
                    // GetKey
                    print("Tune three, by Turlin");
                    this.flags.tune['turlin'] = play(musicc$(10));
                    // Play tune$(3)
                    print("Press a key when finished.");
                    // GetKey
                    print("Tune four, by the old cat woman");
                    this.flags.tune['cat woman'] = play(musicc$(10));
                    // Play tune$(4)
                    print("Press a key when finished.");
                    // GetKey
                    print("Tune five, by doo-dad man");
                    this.flags.tune['doo-dad man'] = play(musicc$(10));
                    // Play tune$(5)
                    print("Press a key when finished.");
                    // GetKey
                    print("Tune six, by Ieadon");
                    this.flags.tune['ieadon'] = play(musicc$(10));
                    // Play tune$(6)
                    print("Press a key when finished.");
                    await getKey()
                    clear()
                    this.flags['right answer'] = randomChoice(Object.keys(this.flags.tune));
                    print("Ok...");
                    print("Now, which artist played this tune:");
                    let yn = 'y'
                    while (yn == "y") {
                        play(this.flags.tune[this.flags['right answer']])
                        print()
                        print("Want me to replay it? [y/n]");
                        yn = await getKey(['y', 'n'])
                    }
                    print("Now type, 'guess <artist name>' to go for a try.");
                    print("As a reminder they are (type them like this):");
                    print("-Grogrin");
                    print("-Mino");
                    print("-Turlin");
                    print("-Cat Woman");
                    print("-Doo-dad Man");
                    print("-Ieadon");
                    color(blue);
                    print("Thanks again!");
                    break;
                case "n":
                    print("Fine, come again some other day!");
                    play(musicc$(10))
                    break;
            }
        }).addAction('guess', async function (player: Character, guess: string) {
            if (guess.toLocaleLowerCase() == this.flags['right answer']) {
                color(blue)
                print("CORRECT!")
                play(musicc$(10))
                print("  -- Mino gives you the 'lute de lumonate'")
                print()
                print("Hey, this might help you in detroying Sift")
                print("To play this at any time, type 'play lute'")
                this.inventory.transfer('lute de lumonate', player.inventory)
                this.flags.won = true
            } else {
                print("I am so sorry, that is INCORRECT!")
                color(blue)
                print("TRY AGAIN!")
            }
        }).fightMove(actions.sleep);
    },

    peon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peon',
            items: [getItem('gold', 2)],
            hp: 20,
            blunt_damage: 10,
            sharp_damage: 2,
            weapon: getItem('fist'),
            description: 'helpless peon',
            coordination: 2,
            agility: 3,
            pronouns: randomChoice([pronouns.female, pronouns.male]),
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            // if (a == 283) {
            print("Ierdale will stop at nothing to destroy us!");
            print("Join us against them, brother!");
            // } else if ( a == 282) {
            //     print("I can't get this telescope to work.  What a rip-off!");
            //     // Else
            //     print("They don't want to talk.");
            // }
        }).onDeath(async function () {
        }).onAttack(async (character: Character) => {
            // If Int(2 * Rnd) + 1 1 Then
            // End If 
        });
    },

    dark_angel(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dark angel',
            items: [getItem('gold', 50), getItem('dark_sword'), getItem('banana')],
            hp: 300,
            magic_damage: 40,
            sharp_damage: 40,
            weapon: getItem('dark_sword'),
            description: 'angel of death',
            coordination: 25,
            agility: 11,
            pronouns: pronouns.female,
            aliases: ['angel'],
            alignment: 'orc',
            ...args
        }).dialog(async function (player: Character) {
            print("hissss..... deeeeeathhhhh...");
        }).fightMove(async function () {
            print('TODO: fireball')
        });
    },

    gerard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'gerard',
            items: [getItem('gold', 50)],
            hp: 200,
            blunt_damage: 100,
            sharp_damage: 50,
            weapon: new Item({ name: 'a bomb', weapon_stats: { weapon_type: 'magic' } }),
            description: 'Gerard',
            blunt_armor: 20,
            coordination: 5,
            agility: 2,
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.ieadon) {
                print("A hang glider is nice... for gliding from high places.");
            } else {
                print("Try out my newest invention... the PORTAL DETECTOR!");
            }
        });
    },

    doo_dad_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'doo_dad man',
            items: [getItem('gold', 150), getItem('long_dagger')],
            hp: 90,
            blunt_damage: 45,
            sharp_damage: 10,
            coordination: 3,
            agility: 2,
            weapon: getItem('club', { name: 'jackhammer' }),
            description: 'doo-dad man',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("Want some doo-dads?  They're really neat!");
        });
    },

    farm_wife(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'farm wife',
            items: [],
            hp: 12,
            blunt_damage: 3,
            sharp_damage: 0,
            weapon: getItem('fist', { name: 'hands' }),
            description: 'screaming farm wife',
            pronouns: pronouns.female,
            aliases: ['wife'],
            ...args
        }).dialog(async function (player: Character) {
            if (player.flags.forest_pass) {
                print("Help!  Help!, please save us!  There are treacherous evil things invaiding");
                print("our farm... Ahh... Goblins, Kobolds, Zombies, Ahhh... BOOOHOOO, my poor ");
                print("husband... WAHHHHH!!!!");
            } else {
                print("Hello sweetheart!  Fine day out here on the farm!  If you are hungry, feel");
                print("free to pick off a few chickens, we have plenty.  In the same way help");
                print("yourself to our cows too, just please don't butcher all of them.");
                print("You may hunt here until you get a pass to the forest of theives.");
            }
        }).onDeath(async function () {
            if (!this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("You shall regret this, Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true
            }
        });
    },

    clubman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'clubman',
            items: [getItem('club')],
            hp: 21,
            blunt_damage: 7,
            coordination: 2,
            agility: 1,
            weapon: getItem('club'),
            description: 'clubman',
            alignment: 'wander',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("Duuuu... Ummmmmm... How me I forget to breathe...");
        });
    },

    rush_lurker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rush lurker',
            items: [getItem('gold', 10)],
            hp: 31,
            blunt_damage: 8,
            sharp_damage: 3,
            coordination: 3,
            agility: 2,
            weapon: getItem('claws'),
            description: 'rush lurker',
            attackPlayer: true,
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    swordsman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'swordsman',
            items: [getItem('shortsword'), getItem('gold', 5)],
            hp: 72,
            blunt_damage: 14,
            sharp_damage: 8,
            weapon: getItem('shortsword'),
            description: 'swordsman',
            blunt_armor: 2,
            coordination: 3,
            agility: 1,
            pronouns: pronouns.male,
            ...args
        });
    },

    evil_forester(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'evil forester',
            items: [getItem('wooden_stick'), getItem('gold', 8)],
            hp: 50,
            blunt_damage: 20,
            sharp_damage: 0,
            coordination: 5,
            agility: 2,
            weapon: getItem('wooden_stick'),
            description: 'evil forester',
            attackPlayer: true,
            pronouns: pronouns.male,
            ...args
        });
    },

    dirty_thief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dirty thief',
            items: [getItem('dagger'), getItem('gold', 6)],
            hp: 52,
            blunt_damage: 0,
            sharp_damage: 10,
            coordination: 3,
            agility: 2,
            weapon: getItem('dagger'),
            description: 'dirty thiefing rascal',
            pronouns: pronouns.male,
            ...args
        });
    },

    fat_merchant_thief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'fat_merchant thief',
            items: [getItem('whip'), getItem('gold', 20)],
            hp: 61,
            blunt_damage: 12,
            sharp_damage: 0,
            coordination: 9,
            agility: 2,
            weapon: getItem('whip'),
            description: 'fat merchant',
            pronouns: pronouns.male,
            ...args
        });
    },

    snarling_thief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'snarling thief',
            items: [getItem('flail'), getItem('gold', 7)],
            hp: 82,
            blunt_damage: 7,
            sharp_damage: 11,
            coordination: 4,
            agility: 2,
            weapon: getItem('flail'),
            description: 'thief',
            pronouns: pronouns.female,
            ...args
        });
    },

    dark_rider(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dark rider',
            items: [getItem('hand_axe'), getItem('gold', 3)],
            hp: 115,
            blunt_damage: 20,
            sharp_damage: 10,
            coordination: 3,
            agility: 5,
            weapon: getItem('hand_axe'),
            description: 'dark rider',
            blunt_armor: 3,
            attackPlayer: true,
            pronouns: pronouns.male,
            ...args
        });
    },

    fine_gentleman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'fine gentleman',
            items: [getItem('rapier'), getItem('gold', 26)],
            hp: 103,
            blunt_damage: 4,
            sharp_damage: 12,
            coordination: 5,
            agility: 3,
            weapon: getItem('rapier'),
            description: 'gentleman',
            blunt_armor: 1,
            pronouns: pronouns.male,
            ...args
        });
    },

    little_goblin_thief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'little_goblin thief',
            items: [getItem('metal_bar'), getItem('gold', 6)],
            hp: 100,
            blunt_damage: 30,
            sharp_damage: 10,
            coordination: 2,
            agility: 6,
            weapon: getItem('metal_bar'),
            description: 'goblin',
            pronouns: pronouns.male,
            ...args
        });
    },

    orc_amazon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orc amazon',
            items: [getItem('claymoore'), getItem('gold', 17)],
            hp: 250,
            blunt_armor: 5,
            sharp_armor: 30,
            magic_armor: 15,
            coordination: 10,
            agility: 5,
            blunt_damage: 29,
            sharp_damage: 16,
            weapon: getItem('claymoore'),
            pronouns: pronouns.female,
            ...args
        }).onAttack(async function (character: Character) {
            // SB_Gend she
        });
    },

    orc_behemoth(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orc behemoth',
            pronouns: pronouns.male,
            items: [getItem('mighty_warhammer')],
            hp: 300,
            blunt_armor: 11,
            sharp_armor: 12,
            magic_armor: 13,
            coordination: 6,
            agility: 1,
            blunt_damage: 19,
            sharp_damage: 16,
            weapon: getItem('mighty_warhammer'),
            ...args
        });
    },

    //, getItem('87_then_wg', 1)(), getItem('gold', 98), getItem('94_then_wg', 1)(), getItem('gold', 1), getItem('1_then_wg', 1)(), getItem('gold', 7)
    peddler(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peddler',
            items: [getItem('spy_o_scope'), getItem('gold', 100)],
            hp: 100,
            weapon: getItem('dagger'),
            coordination: 2,
            agility: 5,
            sharp_damage: 25,
            description: 'spy o scope peddler',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("They would hang me for saying this... BUT, it is a good idea sometime during");
            print("your adventure to turn AGAINST Ierdale.  I would recomend this after you can");
            print("beat the Forest of Thieves.");
            print("The security guards are a good source of vital EXP!");
            print();
            pause((6));
            print("Oh, sorry, I have something to sell.");
            print("Its called a \"spy o scope\". Cost ", 1);
            color(yellow);
            print("200gp");
            color(black);
            print("It allows you to peek into rooms that are next to you.");
            print("Type \"buy spy o scope\" to purchase it.");
        }).onDeath(async function () {
            if (!this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("You shal regret this, Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true;
            }
        }).onTurn(actions.wander);
    },

    rock_hydra(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rock hydra',
            items: [getItem('gold', 29)],
            hp: 200,
            blunt_damage: 60,
            sharp_damage: 5,
            weapon: getItem('fist', { name: 'his heads' }),
            description: 'Hydra',
            blunt_armor: 5,
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    nightmare(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'nightmare',
            items: [getItem('gold', 50), getItem('longsword')],
            hp: 450,
            blunt_damage: 112,
            sharp_damage: 21,
            weapon: getItem('longsword'),
            description: 'nightmare',
            coordination: 9,
            agility: 5,
            blunt_armor: 28,
            attackPlayer: true,
            pronouns: pronouns.inhuman,
            ...args
        }).fightMove(async function () {
            if (Math.random() * 1 < 8) { print('TODO: armorkill') }
        });
    },

    mogrim(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'mogrim',
            items: [getItem('gold', Math.random() * 30), getItem('hardened_club')],
            hp: 490,
            blunt_damage: 56,
            sharp_damage: 20,
            weapon: getItem('hardened_club'),
            description: 'mogrim',
            coordination: 5,
            agility: 3,
            blunt_armor: 36,
            attackPlayer: true,
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    reaper(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'reaper',
            items: [getItem('scythe'), getItem('gold', Math.random() * 50)],
            hp: 150,
            blunt_damage: 0,
            sharp_damage: 250,
            weapon: getItem('scythe'),
            description: 'reaper',
            coordination: 55,
            agility: 25,
            blunt_armor: 0,
            pronouns: pronouns.inhuman,
            attackPlayer: true,
            ...args
        });
    },

    goblin_hero(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin hero',
            items: [getItem('jagged_polearm'), getItem('gold', Math.random() * 56)],
            hp: 230,
            blunt_damage: 120,
            sharp_damage: 70,
            weapon: getItem('jagged_polearm'),
            description: 'goblin hero',
            coordination: 12,
            agility: 4,
            blunt_armor: 26,
            attackPlayer: true,
            pronouns: pronouns.male,
            ...args
        });
    },

    stone_golem(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'stone golem',
            items: [getItem('warhammer'), getItem('gold', 19)],
            hp: 120,
            blunt_damage: 45,
            sharp_damage: 15,
            weapon: getItem('warhammer'),
            description: 'Huge stone golem',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    wood_troll(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wood troll',
            pronouns: pronouns.male,
            items: [getItem('club')],
            hp: 250,
            blunt_damage: 52,
            sharp_damage: 1,
            weapon: getItem('club'),
            description: 'wood troll',
            coordination: 15,
            agility: 5,
            blunt_armor: 16,
            alignment: 'evil/areaw',
            ...args
        }).onTurn(
            actions.wander
        ).fightMove(async function () {
            if (Math.random() < 1 / 2) {
                print('TODO: call help')
            }
        });
    },

    cat_woman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cat woman',
            items: [getItem('axe_of_the_cat'), getItem('gold', 25)],
            hp: 400,
            blunt_damage: 75,
            sharp_damage: 100,
            weapon: getItem('axe_of_the_cat'),
            description: 'cat woman',
            coordination: 20,
            agility: 15,
            blunt_armor: 25,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            spellChance: () => Math.random() < 1 / 5,
            ...args
        }).fightMove(actions.max_heal)
    },

    megara(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'megara',
            pronouns: pronouns.inhuman,
            items: [getItem('megarian_club'), getItem('gold', 50)],
            hp: 300,
            blunt_damage: 200,
            sharp_damage: 10,
            weapon: getItem('megarian_club'),
            description: 'megara',
            coordination: 10,
            agility: 0,
            blunt_armor: 50,
            attackPlayer: true,
            ...args
        });
    },

    cow(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cow',
            items: [getItem('side_of_meat')],
            hp: 51,
            blunt_damage: 4,
            sharp_damage: 4,
            weapon: getItem('horns'),
            description: 'cow',
            coordination: 3,
            agility: 0,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            ...args
        }).onDeath(async function () {
            color(brightblue);
            print("Yea, you killed a cow!  good job");
        }).fightMove(async function () {
            color(magenta)
            print('Moooooo!')
        })
    },

    bull(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bull',
            pronouns: pronouns.male,
            items: [getItem('side_of_meat')],
            hp: 55,
            blunt_damage: 8,
            sharp_damage: 5,
            weapon: getItem('horns'),
            description: 'bull',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            ...args
        });
    },

    jury_member(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'jury member',
            items: [getItem('gold', 1)],
            hp: 20,
            blunt_damage: 3,
            sharp_damage: 0,
            coordination: 2,
            agility: 3,
            weapon: getItem('fist'),
            description: 'jury member',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            ...args
        }).dialog(async function (player: Character) {
            print("GUILTY!");
        }).onDeath(async function () {
            color(red);
            print("Murder in our own COURT!");
            this.game.player.flags.enemy_of_ierdale = true
            this.game.player.flags.murders += 1
        });
    },

    peasant_elder(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant elder',
            pronouns: pronouns.female,
            items: [getItem('magic_ring')],
            flags: { 'talk': 0 },
            ...args
        }).dialog(async function (player: Character) {
            switch (this.flags['talk']) {
                case 0:
                    print("I heard that the old wizard Eldin moved to the mountains West of town.");
                    break;
                case 1:
                    print("The butcher has a giraffe gizzard for you.");
                    break;
                case 2:
                    print("The Archives are a great place to learn about the world!");
                    print("(Located east of the security office)");
                    break;
                case 3:
                    print("My grand daughter once found an awesome weapon for sale at the pawn shop!");
                    print("Type \"list\" sometime when you're there to take a look.");
                    break;
                case 4:
                    print("Most people don't realize there's a path that goes from the forest of thieves");
                    print("to the path of nod.  Its a handy shortcut!");
                    break;
                case 7:
                    print("I said go away, didn't I?");
                    break;
                case 11:
                    print("Vamoose! Get outta here!");
                    break;
                case 17:
                    print("Inquisitive fella, aren't you?");
                    print("Here, take these... ought to keep you occupied for a bit.");
                    print("Heheh.");
                    // CreateOBJ -1, "mushroom"
                    // CreateOBJ -1, "mushroom"
                    // CreateOBJ -1, "mushroom"
                    color(green);
                    print("<Received 3 mushrooms>");
                    break;
                case 20:
                    print("Ok, ok... here's one more.");
                    // CreateOBJ -1, "mushroom"
                    color(green);
                    print("<Received 1 mushroom>");
                    break;
                case 22:
                    print("Seriously, that's all I've got.");
                    break;
                case 35:
                    print("My mind is spinning - ");
                    print("how many times in a row have I said the same thing?");
                    break;
                case 53:
                    print("Ok... enough, enough.  You've finally worn me down.  I can't take it");
                    print("anymore.  I will tell you my final secret.  A way to bend reality");
                    print("itself.  This is the most powerful spell in the game.");
                    pause(5);
                    print("Hit ctrl+backspace to make this rune:");
                    print("⌂.  Then type \"~\".  Then type \"Glory Blade\".");
                    print("⌂~ \"Glory Blade\".  Make sure to use proper capitalization.");
                    print("Please don't bother me anymore.");
                    break;
                case 54:
                    print("No more.  Please.");
                    break;
                case 55:
                    print("Just stop.");
                    break;
                case 56:
                    print("I can't take any more of this.");
                    break;
                case 57:
                    print("Go away.");
                    break;
                case 58:
                    print("For the love of God, stop bothering me!");
                    break;
                case 59:
                    print("Ok.  Ok.  I can see where this is going.");
                    break;
                case 60:
                    print("--Peasant elder takes out a vial of irrdescent liquid and swallows it.");
                    pause(3);
                    print("I hope you're happy, young one.");
                    pause(3);
                    print("--Peasant elder keels over backwards and dissolves in a cloud of putrid gas.");
                    this.die(player);
                    print();
                    print("peasant elder drops magic ring")
                    break;
                default:
                    print("Get on there, young one.  My ears are tired.");
                    break;
            }
            this.flags['talk'] += 1;
        });
    },

    scarecrow_gaurd(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'scarecrow gaurd',
            items: [getItem('pitchfork'), getItem('gold', 10)],
            hp: 210,
            blunt_damage: 31,
            sharp_damage: 57,
            weapon: getItem('pitchfork'),
            description: 'scarecrow gaurd',
            coordination: 4,
            agility: 3,
            blunt_armor: 6,
            attackPlayer: true,
            pronouns: pronouns.male,
            ...args
        });
    },

    scarecrow_worker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'scarecrow worker',
            items: [getItem('pitchfork')],
            hp: 130,
            blunt_damage: 25,
            sharp_damage: 48,
            weapon: getItem('pitchfork'),
            description: 'scarecrow worker',
            coordination: 3,
            agility: 3,
            blunt_armor: 1,
            alignment: 'nice scarecrow',
            pronouns: pronouns.male,
            ...args
        });
    },

    scarecrow_king(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'scarecrow king',
            items: [getItem('golden_pitchfork'), getItem('gold', 38)],
            hp: 260,
            blunt_damage: 43,
            sharp_damage: 75,
            weapon: getItem('golden_pitchfork'),
            description: 'scarecrow king',
            coordination: 5,
            agility: 3,
            blunt_armor: 12,
            attackPlayer: true,
            pronouns: pronouns.male,
            ...args
        });
    },

    grocer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grocer',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("Please ignore my bag boy.  He scares away the majority of our customers.");
            print("Unfortunatley he's my grandson and I can't really fire him.");
            print("If you aren't scared off, please be my guest and read the sign to see what");
            print("we have to offer you.");
        }).onAttack(actions.pish2);
    },

    old_woman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'old woman',
            pronouns: pronouns.female,
            hp: 1000,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello little one...");
            print("This music box here is more valuable than you may think.  Crafted by the great");
            print("Mino of old, it is said to contain the tunes of any song ever writen.");
            print("I am willing to part with it, for the good of civilization, but it will not");
            print("be easy.  Its pretty boring living up here with only a mixing pot and a music");
            print("box.  If you take the box it will even be worse.");
            print("But if you must...  I guess...");
            print("OH!  Regarding your quest - I have one hint, one word that will be essential:");
            print("                It is: \"jump\"");
        }).onAttack(actions.pish2)
    },

    grobin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grobin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            description: 'N',
            hp: 6000,
            agility: 10000,
            blunt_armor: 1000,
            ...args
        }).onAttack(actions.pish2);
    },

    blobin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'blobin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            description: 'N',
            hp: 6000,
            agility: 10000,
            blunt_armor: 1000,
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game?.flags.biadon) {
                print("Visit Gerard's shop for the latest equipment!");
            } else {
                if (!this.game?.flags.orc_mission) {
                    print("We need a General to lead an attack on Ierdale very desperatley.");
                    print();
                    print("I know something important about Ieadon's whereabouts that will be vital for");
                    print("your quest.  Ierdale thinks WE helped Ieadon escape but the truth is that he");
                    print("ran to hide from YOU!  I will tell you where Ieadon is ONLY if you agree to");
                    print("lead our army against IERDALE!!! Will you?? [y/n]");
                    if (await getKey(['y', 'n']) == "y") {
                        // Dim hpet&
                        // this.game.flags['For a'] = 0 To MaxPets - 1;
                        // If Pet(a).HP > 0 Then hpet = 1
                        // Next
                        // if (hpet > 0) {
                        print("These soldiers will accompany you in your battle as \"pets");
                        print("Your current pets will be put to sleep.");
                        print("Is this ok? [y/n]");
                        // }
                        if (await getKey(['y', 'n']) == "y") {
                            this.game.player.flags.enemy_of_ierdale = true
                            // If MaxPets < 3 Then MaxPets = 3
                            // this.game.flags['For a'] = 0 To MaxPets - 1;
                            // this.game.flags['Pet(a).Name'] = \";
                            // this.game.flags['Pet(a).HP'] = 0;
                            // Next
                            // NewPet "gryphon", 1
                            // NewPet "orc amazon", 2
                            // NewPet "orc behemoth", 3
                            // NewPet "orc behemoth", 4
                            print("Here, take these soldiers and this gryphon on your way.");
                            print("Good luck and remeber you must kill EVERY LAST soldier and general in Ierdale.");
                            // Else
                            print("Fine, if you can do it with your own pets, good luck.");
                            print("Just remember you must kill EVERY LAST soldier and general in Ierdale.");
                        }
                        this.game.flags.soldiers_remaining = 22;
                        this.game.flags.orc_mission = true;
                        // Else
                        print("Fine, but you won't get that ring without me telling you!");
                        print("KAHAHAHAHAEHEHEHEHEHEAHAHAHAHAOHOHOHOH!");
                    }
                } else if (this.game.flags.soldiers_remaining > 0) {
                    print("You must kill ALL the soldiers and generals in Ierdale before I tell you my");
                    print("secret.");
                    print("NOW GET BACK TO BATTLE!");
                } else {
                    // this.game.flags['For a'] = 0 To MaxPets - 1;
                    // If Pet(a).Name = "orc amazon" Then Pet(a).Name = \"
                    // If Pet(a).Name = "orc behemoth" Then Pet(a).Name = \"
                    // If Pet(a).Name = "gryphon" Then Pet(a).Name = \"
                    // Next
                    print("Congradulations!  You have defeated the entire army of Ierdale. That will show");
                    print("thoes dirty HUMAN BASTARDS!");
                    print("I will now tell you the Vital secret.");
                    // Call Pause(5.5)
                    print("Ieadon is right - HERE!");
                    pause(1);
                    print();
                    pause(2);
                    print("-- Ieadon steps from the shadows.");
                    pause(1);
                    print("Ieadon -- \"Orcish soldiers! Attack!");
                    // if (this.game) this.game.flags['LastRoom'] = r;
                    let soldiers_dead = 0;
                    const soldierDown = async () => {
                        soldiers_dead += 1;
                        if (soldiers_dead == 4) {
                            // fight Ieadon
                            const ieadon = this.game.find_character('Ieadon');
                            if (!ieadon) {
                                console.log('important character Ieadon not found.')
                                return;
                            }
                            for (let a = 0; a < 5; a++) {
                                color(black, qbColors[a * 2])
                                clear();
                                pause(1);
                            }
                            color(orange, darkwhite)
                            print("Ieadon -- those were the best soldiers of Grobin!");
                            print("Ieadon -- now it is ON!");
                            pause(4);
                            color(red)
                            print(" -- Ieadon launches himself at your throat.");
                            pause(1);
                            color(black)
                            ieadon.location = this.location;
                            ieadon.attackPlayer = true;
                        }
                    }
                    this.location?.addCharacter(characters.gryphon().onDeath(soldierDown));
                    this.location?.addCharacter(characters.orc_behemoth().onDeath(soldierDown));
                    this.location?.addCharacter(characters.orc_behemoth().onDeath(soldierDown));
                    this.location?.addCharacter(characters.orc_amazon().onDeath(soldierDown));

                    // Fight 157
                    // print("Ieadon is hiding in a mysterious place know as ", 1);
                    // color(red);
                    // print("\"THE VOID\"");
                    // color(black);
                    // print("This place is not reached by walking from anywhere on the map, in fact, there");
                    // print("is only one way to get there.");
                    // print("Do you want to hear it? [y/n]");
                    // if (await getKey(['y', 'n']) == "y") {
                    //     print("Climb to the top of the highest tree in the world, carying a hang glider.");
                    //     print("From the top of this tree, type \"jump void\" to dive into");
                    //     print("the infernal void.");
                    //     print("Good luck!");
                    //     // If spet$ = "gryphon" Then Quote "You can keep the gryphon as another token of my thanks."
                    //     print();
                    //     print("Ierdale has been crushed once and for all.");
                    // } else {
                    //     print("Alright then!  Talk to me again and I will tell you.");
                    // }
                }
            }
        }).onAttack(actions.pish2);
    },

    beggar(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'beggar',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 35,
            coordination: 3,
            agility: 2,
            blunt_damage: 5,
            sharp_damage: 0,
            weapon: getItem('fist'),
            ...args
        }).dialog(async function (player: Character) {
            print("Hmmmmfff...");
            // If GP < 10 Then Exit Sub
            print("Do you have 10gp spare change? [y/n]");
            if (await getKey(['y', 'n']) == "n") {
                print("Hmmfff... Thanks a lot...");
            } else {
                color(yellow);
                player.inventory.remove('gold', 10)
                pause(2)
                color(black);
                print("I will tell you something now:");
                print();
                pause(4)
                print(" There is a portal somewhere near");
                print(" People used to grow things here");
                print(" A portal detector can be found");
                print(" Only when 5 rings are safe... and... sound...");
                print();
                print("Just an old prophecy, not much.  Thanks for the money");
            }
        }).onTurn(actions.wander);
    },

    cleric_tendant(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cleric tendant',
            pronouns: pronouns.male,
            agility: 2,
            hp: 100,
            blunt_armor: 10,
            weapon: getItem('fist'),
            coordination: 3,
            blunt_damage: 4,
            description: 'cleric tendant',
            aliases: ['cleric'],
            ...args
        }).dialog(async function (player: Character) {
            print("Welcome.  I must be stern with you when I say NO TALKING, read the sign.");
        }).onAttack(async function (attacker: Character) {
            if (attacker.isPlayer) {
                print(`${this.name} yells: ELDFARL!  HELP ME!  QUICK!`);
            }
            const eldfarl = this.game.find_character('eldfarl')
            if (!eldfarl) {
                console.log('character Eldfarl not found.')
                return
            }
            eldfarl.location = this.location;
            eldfarl.attackTarget = attacker;
        });
    },

    blind_hermit(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'blind hermit',
            pronouns: pronouns.male,
            agility: 1,
            hp: 30,
            description: 'blind hermit',
            aliases: ['hermit'],
            ...args
        }).dialog(async function (player: Character) {
            print("'The sight of a blind man probes beyond visual perceptions'");
            print("           - Vershi, tempest shaman");
            print();
            pause(4);
            print("Hey, whats up?");
            print("Though I am blind I may see things you do not.");
            print("I am in desperate need of the head of Mythin the forester.  He is a traitor");
            print("to Ierdale and deserves no other fate than death.  If you could tell me the");
            print("whereabouts of Mythin this would be yours.");
            color(blue);
            pause(6);
            print("<blind hermit reveals 10000gp>");
            pause(3);
            color(black);
            print("Take it or leave it? [y/n]");
            if (await getKey(['y', 'n']) == "y") {
                color(blue);
                print("<Something moves in the shadows>");
                print("<blind hermit turns twords you:>");
                pause(4);
                color(black);
                print("Mythin,");
                print("He is the one, kill him");
                pause(4);
                color(blue);
                print("<Mythin leaps from the shadows and just as you see him, you feel cold steel>");
                print("<in your chest>");
                pause(3);
                print("MYTHIN:", 1);
                color(black);
                print("The dark lord has naught a chance now that the one is dead");
                print("A normal human would not take such a risky bribe.");
                pause(7);
                player.die(this.game.find_character('Mythin'));
            } else {
                print("Fine, but 10000gp will cover most any expense");
                print();
                if (!player.has('list')) {
                    print("Though I rarely trouble myself in the affairs of man, take these for I fear");
                    print("your future is un-eventful without them.");
                    color(blue);
                    print("<recieved a list>");
                    print("<recieved an amber chunk>");
                    player.inventory.add(getItem('list'));
                    player.inventory.add(getItem('amber_chunk'));
                }
            }
        }).onAttack(actions.pish2);
    },

    butcher(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'butcher',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 1000,
            sharp_damage: 20,
            blunt_damage: 20,
            blunt_armor: 20,
            agility: 10000,
            coordination: 1,
            ...args
        }).dialog(async function (player: Character) {
            color(red);
            print("<*chop*>");
            await pause(1);
            print("<*crack*>");
            await pause(1);
            print("<*rip leg off animal*>");
            await pause(1);
            print("<*WHACK*>");
            print("<*Blood splaters in your face*>");
            await pause(2);
            color(black);
            print("Sorry about that.");
            print("I like meat.  My father was a butcher, his father before him...");
            await pause(2);
            for (let a = 0; a < 25; a++) {
                print("and his father before him,", 1);
            }            // Next
            print();
            print("As you can see I come from a long line of butchers, and I'm proud!");
            print("I left a 'giraffe gizzard' on the floor a while ago.  I am too fat");
            print("to see it or my feet but if it's still there and you want it...");
            color(red);
            await pause(3);
            print("<*Whack-Splatter*>");
        });
    },

    adder(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'adder',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 32,
            blunt_damage: 2,
            sharp_damage: 10,
            weapon: getItem('fangs'),
            coordination: 6,
            agility: 4,
            description: 'poisonus adder',
        }).fightMove(async function () {
            if (Math.random() > 2 / 3) {
                print('TODO: poison fang')
            }
        });
    },

    bridge_troll(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bridge troll',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 61,
            blunt_damage: 16,
            sharp_damage: 2,
            coordination: 3,
            agility: 1,
            weapon: getItem('fist', { name: 'huge fists' }),
            description: 'troll',
            blunt_armor: 1,
            aliases: ['troll'],
            ...args
        }).dialog(async function (player: Character) {
            print("trying to bother me?");
            print("worthless little human...");
            pause((2));
            print("aarrr... get off my bridge!");
            this.attackPlayer = true;
        });
    },

    swamp_thing(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'swamp thing',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 46,
            blunt_damage: 15,
            sharp_damage: 1,
            coordination: 4,
            agility: 1,
            weapon: new Item({
                name: 'whip-like fingers',
                weapon_stats: { weapon_type: 'club' }
            }),
            description: 'swamp thing',
            attackPlayer: true,
            ...args
        });
    },

    dryad(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dryad',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 130,
            blunt_damage: 12,
            sharp_damage: 5,
            coordination: 3,
            agility: 1,
            weapon: new Item({
                name: 'trunkish arms',
                weapon_stats: { weapon_type: 'club' }
            }),
            description: 'dryad',
            ...args
        });
    },

    goblin_solider(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin solider',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 21,
            blunt_damage: 15,
            sharp_damage: 3,
            coordination: 2,
            agility: 4,
            weapon: getItem('wooden_stick'),
            items: [getItem('gold', 3), getItem('wooden_stick')],
            description: 'evil looking goblin',
            attackPlayer: true,
            ...args
        });
    },

    goblin_captain(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 48,
            blunt_damage: 29,
            sharp_damage: 10,
            weapon: getItem('broadsword'),
            items: [getItem('gold', 9), getItem('broadsword'), getItem('longsword')],
            description: 'horifying goblin captain',
            blunt_armor: 9,
            agility: 3,
            coordination: 2,
            attackPlayer: true,
            ...args
        }).onDeath(async function () {
            // If SB_BC = 95 Then B(95) = 0
            // hengef = 1
            // Turlinf = 1
        });
    },

    security_guard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'security guard',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 35,
            blunt_damage: 17,
            sharp_damage: 7,
            coordination: 3,
            agility: 2,
            weapon: getItem('shortsword'),
            items: [getItem('shortsword')],
            description: 'Ierdale guard',
            blunt_armor: 2,
            aliases: ['guard'],
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.colonel_arach) {
                print("Sorry... we can't let you past.  Colonel Arach has us locking these gates down");
                print("good and tight!  No one may get through.");
            } else if (this.game.flags.biadon && !this.game.flags.ieadon) {
                print();
                print("Greetings...I have some important news for you.");
                print();
                pause
                print("One night some days ago, a group of ork soldiers from");
                print("the town of Grobin snuck into our town by way of a short");
                print("path that leads in from the forest of thieves.  They ran");
                print("around killing people until they were dispatched by the");
                print("guards.  Colonel Arach has declared war on the orc town");
                print("and until the war is over, no one will be allowed in");
                print("through the eastern gates.  Also, it was discovered that");
                print("the great Ieadon had turned traitor and joined the side");
                print("of the orcs.  We think that he fled to Grobin, the orc");
                print("town.");
                print();
                print("We have heard that you are a great warrior, so");
                print("if you want to check it out... <wink> <wink>");
            }
            if (this.game.flags.ieadon || !this.game.flags.ziatos) {
                print("Hello... how are you on this fine day.  We will treat you with respect, if");
                print("you show respect to our town.  If you wish to inquire of something visit");
                print("the security office on North Road. ", 1);
                if (this.location?.name == 'Eastern Gatehouse') {
                    print("(west and north of here)");
                } else if (this.location?.name == 'Western Gatehouse') {
                    print("(east and north of here)");
                } else if (this.location?.name == 'Northern Gatehouse') {
                    print("(south of here)");
                }
            }
        }).onDeath(async function () {
            print("Ierdale has turned against you!")
        }).onDeparture(async function (character: Character, direction: string) {
            if (!this.game.flags.colonel_arach) {
                let blockDirection = ''
                switch (this.location?.name) {
                    case 'Eastern Gatehouse':
                        blockDirection = 'east'
                        break;
                    case 'Western Gatehouse':
                        blockDirection = 'west'
                        break;
                    case 'Northern Gatehouse':
                        blockDirection = 'north'
                        break;
                }
                if (direction == blockDirection) {
                    if (character.isPlayer) print("Sorry... we can't let you past.");
                    return false
                }
            }
            return true
        })
    },

    snotty_page(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'snotty page',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 1,
            blunt_damage: 6,
            sharp_damage: 5,
            coordination: 5,
            agility: 1,
            weapon: getItem('dagger'),
            description: 'snotty ASS page',
            aliases: ['page'],
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            print("What do you want... wait I am too good and too cool to be talking to you,");
            print("Eldin picked me to mentor him because I am the BEST!!!  Way better than you!");
            print("Go away, you're breathing on me, EWWW FAT SLOB!");
        }).onDeath(async function () {
            if (!this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("The Guards will get you for this!");
                this.game.player.flags.enemy_of_ierdale = true
                this.game.player.flags.murders += 1
            }
        });
    },

    police_chief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'police chief',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 150,
            blunt_damage: 65,
            sharp_damage: 30,
            weapon: getItem('silver_sword'),
            description: 'Police chief',
            blunt_armor: 29,
            sharp_armor: 35,
            coordination: 7,
            agility: 9,
            aliases: ['chief'],
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            if (this.game.flags.biadon && !this.game.flags.ieadon) {
                print("Mfrmf... Orcs mfrflm... Oh its you.  Stay OUT, we are at war!  Please show");
                print("some respect for the fighting men of Ierdale.");
                print("Its interesting how in our time of greatest need, Ieadon - our best and most");
                print("trusted fighter - can disapear.  Some say to have seen him leaving town at");
                print("dusk one night.");
            } else {
                print("*cough*  How may I help you?");
                print("Don't try anything funny: here in Ierdale we crack down hard on crime!");
                print("We sell passes to the forest of theives up North at the information desk.");
            }
        });
    },

    sandworm(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'sandworm',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 450,
            blunt_damage: 18,
            sharp_damage: 0,
            weapon: getItem('fist', { name: 'sand he throws' }),
            items: [getItem('gold', 7)],
            description: 'HUGE sandworm',
            coordination: 4,
            agility: 0,
            ...args
        });
    },

    sand_scout(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'sand scout',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 45,
            blunt_damage: 0,
            sharp_damage: 40,
            weapon: getItem('long_rapier'),
            items: [getItem('gold', 12), getItem('partial_healing_potion'), getItem('long_rapier')],
            description: 'quick sand scout',
            agility: 7,
            coordination: 10,
            blunt_armor: 7,
            ...args
        });
    },

    hen(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'hen',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 5,
            blunt_damage: 2,
            sharp_damage: 0,
            coordination: 1,
            agility: 3,
            weapon: getItem('beak'),
            items: [getItem('chicken_leg')],
            description: 'clucking hen',
            ...args
        });
    },

    large_rooster(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'large rooster',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 5,
            blunt_damage: 7,
            sharp_damage: 2,
            weapon: getItem('claws'),
            items: [getItem('chicken_leg')],
            description: 'furious rooster',
            coordination: 4,
            agility: 2,
            attackPlayer: true,
            ...args
        });
    },

    chief_judge(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'chief judge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 30,
            blunt_damage: 9,
            sharp_damage: 0,
            coordination: 4,
            agility: 1,
            weapon: getItem('gavel'),
            items: [getItem('gold', 10), getItem('gavel')],
            description: 'Judge',
            aliases: ['judge'],
            ...args
        }).dialog(async function (player: Character) {
            print("Hello, would you like a trial?");
        }).onDeath(async function () {
            color(red);
            print("Murder in our own COURT!");
            this.game.player.flags.murders += 1
            this.game.player.flags.enemy_of_ierdale = true

        });
    },

    elite_guard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'elite guard',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 50,
            blunt_damage: 22,
            sharp_damage: 10,
            weapon: getItem('broadsword'),
            items: [getItem('broadsword'), getItem('gold', Math.random() * 5)],
            description: 'Ierdale elite',
            coordination: 2,
            agility: 2,
            blunt_armor: 5,
            aliases: ['gaurd'],
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            print("Be careful...");
            print("It is very dangerous here in the desert.");
        }).onDeath(async function () {
            color(red)
            print('Ierdale has turned against you!')
            this.game.player.flags.enemy_of_ierdale = true
        })
    },

    dreaugar_dwarf(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dreaugar dwarf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 175,
            blunt_damage: 90,
            sharp_damage: 10,
            weapon: getItem('axe'),
            items: [getItem('gold', Math.random() * 15), getItem('axe')],
            description: 'evil dwarf',
            coordination: 8,
            agility: 5,
            blunt_armor: 20,
            attackPlayer: true,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 1 / 5) {
                // heal
                print
            }
        });
    },

    orkin_the_animal_trainer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orkin_the_animal trainer',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 220,
            blunt_damage: 20,
            sharp_damage: 10,
            weapon: getItem('fist'),
            items: [getItem('gold', 43)],
            description: 'orkin and his animals',
            coordination: 2,
            agility: 1,
            blunt_armor: 10,
            aliases: ['orkin'],
            ...args
        }).dialog(async function (player: Character) {
            print("Echoo Dakeee??  Wul you like to buy some any-mas!");
        }).fightMove(async function () {
            print('TODO: animals')
        });
    },

    lion(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'lion',
            pronouns: randomChoice([pronouns.female, pronouns.male]),
            hp: 155,
            blunt_damage: 30,
            sharp_damage: 12,
            weapon: getItem('claws'),
            description: 'Lion',
            coordination: 5,
            agility: 6,
            blunt_armor: 2,
            alignment: 'nice lion',
            spellChance: () => Math.random() < 2 / 3,
            ...args
        }).dialog(async function (player: Character) {
            color(red);
            // If QBRed = QBDefault Then SetColor QBBlue
            print("      ROAR!");
        }).fightMove(actions.growl);
    },

    mutant_bat(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'mutant bat',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 500,
            blunt_damage: 10,
            sharp_damage: 0,
            weapon: getItem('scream', { name: 'high_pitched_screech' }),
            description: 'mutant bat',
            coordination: 40,
            agility: 5,
            blunt_armor: 25,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                print('TODO: call troops')
            }
        });
    },

    kobalt_captain(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'kobalt captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 240,
            blunt_damage: 30,
            sharp_damage: 10,
            weapon: getItem('spear'),
            items: [getItem('gold', 12), getItem('spear')],
            description: 'captain',
            coordination: 4,
            agility: 2,
            blunt_armor: 13,
            attackPlayer: true,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                print('TODO: call troops')
            }
        });
    },

    bow_maker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bow maker',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 65,
            blunt_damage: 20,
            sharp_damage: 20,
            weapon: getItem('ballista_bolt'),
            description: 'bow fletcher',
            coordination: 2,
            blunt_armor: 10,
            ...args
        }).dialog(async function (player: Character) {
            print("Hi, want some arrows... OR BOWS!");
        });
    },

    peasant_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant man',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 100,
            blunt_damage: 15,
            sharp_damage: 10,
            weapon: getItem('sickle'),
            items: [getItem('sickle'), getItem('gold', 3)],
            description: 'work-hardened peasant',
            coordination: -1,
            blunt_armor: 4,
            aliases: ['peasant'],
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            print("Nice day aint it?");
            print("I Heard about these 4 jewels once...  heard one was in the forest 'o theives.");
            print("Talk to the Cleric to get some liquid... if he's still alive, he's dying.");
            print();
            print("Talk to the \"peasant elder\" more than once, she has a lot to say.");
        }).onDeath(async function () {
            color(red);
            print("This is MURDER! The guards will have your head for this!");
            this.game.player.flags.enemy_of_ierdale = true;
            this.game.player.flags.murders += 1
        });
    },

    peasant_woman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant woman',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 90,
            blunt_damage: 7,
            sharp_damage: 3,
            weapon: getItem('fist'),
            description: 'peasant woman',
            coordination: -1,
            blunt_armor: 3,
            aliases: ['peasant'],
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            print("Excuse me I need to get to my work.");
            print();
            print("Whats that you say??? Interested in rings?  I heard one is in the mountains.");
            print("Floated by my ear also that it was guarded by some strange beast... Henge???");
            print("Now excuse me, must work work work.");
        });
    },

    dog(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dog',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            hp: 45,
            blunt_damage: 10,
            sharp_damage: 15,
            weapon: getItem('teeth'),
            description: 'yapping dog',
            coordination: 2,
            agility: 2,
            blunt_armor: 4,
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            print("BOW WOW WOW!");
        }).onTurn(actions.wander)
    },

    peasant_child(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant child',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            ...args
        }).onAttack(async function (character: Character) {
            if (character.isPlayer) {
                print("YOU DUMB CRAP!")
                print("You want to kill a poor helpless little KID?")
                if (await getKey(['y', 'n']) == "n") {
                    print("The devilish side of you regrets that decision.")
                    const evil_you = new A2dCharacter({
                        name: `evil ${this.game.player.name}`,
                    })
                    Object.assign(evil_you, this.game.player)
                    evil_you.magic_level = this.game.player.healing
                    evil_you.fightMove(actions.heal)
                    evil_you.attackPlayer = true
                } else {
                    print("Now you will be punished!")
                    print()
                    print()
                    print("ULTIMATE POWERMAXOUT SWEEPS FORTH FROM THE FURIOUS FINGERS OF LARS!")
                    print("YOU WRITHE IN AGONY AS IT DRAINS THE LIFE COMPLETELY FROM YOU.")
                    print("YOU SMELL DEFEAT FULLY AND TERRIBLY AS YOU GO LIMPLY UNCONSIOUS")
                    print()
                    print(" LET THIS BE A LESSON TO YOU!!!!!!!!!")
                    this.game.player.die('Lars')
                }
            }
        });
    },

    peasant_worker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant worker',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 190,
            blunt_damage: 0,
            sharp_damage: 70,
            weapon: getItem('sickle'),
            description: 'work-hardened peasant',
            coordination: 2,
            agility: 2,
            blunt_armor: 10,
            aliases: ['peasant', 'worker'],
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            print("*grumble* darn this town *grumble* *grumble*");
            print("Oh Hi there!  Rings?  Dont know, heard something about the path of Nod.");
        }).onTurn(actions.wander);
    },

    ieadon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Ieadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 1000,
            blunt_damage: 120,
            sharp_damage: 200,
            weapon: getItem('mighty_excalabor'),
            description: 'the ledgendary Ieadon',
            coordination: 35,
            agility: 15,
            blunt_armor: 100,
            magic_armor: 100,
            sharp_armor: 100,
            ...args
        }).dialog(async function (player: Character) {
            print("I am the most renound fighter in all the Land.");
            print("Have you heard about thoes rings, thats a PITY!");
            print("**Ieadon grins**");
        }).fightMove(async function () {
            if (Math.random() < 1 / 4) {
                print('TODO: ring ultimate power')
            }
        }).addAction('train strength', async function (player: Character) {
            await actions.train({
                player: player,
                skillName: 'strength',
                requirements: {
                    xp: 80 + 25 * player.strength,
                    gold: 25 + 5 * Math.floor(player.strength / 5)
                },
                classDiscount: { 'fighter': 50, 'thief': 25 },
                result: (player: Character) => {
                    player.strength += 1;
                    if (player.isPlayer) print(`Your raw fighting POWER increased.  Congradulations, your Attack is now: ${player.strength}`);
                }
            })
        }).addAction('train stamina', async function (player: Character) {
            await actions.train({
                player: player,
                skillName: 'strength',
                requirements: {
                    xp: 2 * player.max_sp,
                    gold: 15 + 5 * Math.floor(player.max_sp / 50)
                },
                classDiscount: { 'fighter': 25, 'thief': 25 },
                result: (player: Character) => {
                    player.max_sp += 5;
                    if (player.isPlayer) print(`Your Stamina improved.  Congradulations, it is now: ${player.max_sp}`);
                }
            })
        }).addAction('train toughness', async function (player: Character) {
            await actions.train({
                player: player,
                skillName: 'toughness',
                requirements: {
                    xp: 2 * player.max_hp,
                    gold: 30 + 10 * Math.floor(player.max_hp / 50)
                },
                classDiscount: { 'fighter': 25 },
                result: (player: Character) => {
                    player.max_hp += 5;
                    if (player.isPlayer) print(`Your toughness increased.  Congradulations your Hit Points are now: ${player.max_hp}`);
                }
            })
        }).onDeath(async function () {
            // win
        });
    },

    mythin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'mythin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 550,
            blunt_damage: 40,
            sharp_damage: 120,
            magic_damage: 40,
            weapon: getItem('psionic_dagger', { name: 'glowing dagger' }),
            items: [getItem('psionic_dagger'), getItem('gold', 300)],
            description: 'the outcast Mythin',
            coordination: 25,
            agility: 25,
            blunt_armor: 30,
            spellChance: () => Math.random() < 3 / 5,
            ...args
        }).dialog(async function (player: Character) {
            print("Since you have been able to get here, I will tell you directions");
            print("on how to get here again...");
            print("When you first enter this forest, go west until you come to a large rock.");
            print("then go south twice to reach me.  So these would be the exact directions:");
            print("Enter forest, west, west, west, west, south (there is an evil forester");
            print("here, I keep telling him he disturbs business but he doesn't listen), south.");
            print();
            print("The directions out are the exact oposite (n,n,e,e,e,e). Then you will be at");
            print("the entrance to the forest.  (Area #112)Go south once more to exit.");
        }).fightMove(actions.heal);
    },

    eldin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'eldin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 450,
            magic_damage: 180,
            weapon: getItem('lightning_staff'),
            items: [getItem('lightning_staff'), getItem('gold', 300), getItem('maple_leaf')],
            description: 'the mystical Eldin',
            coordination: 12,
            agility: 4,
            blunt_armor: 29,
            magic_armor: 100,
            sharp_armor: 35,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello, nice to have company!!!  Please, I am slighty busy, please read");
            print("the sign, then come back to me!");
            print();
            if (player.has("clear liquid") && !player.has("maple leaf")) {
                print("Whats that in your hand?");
                print("May I see it?");
                print("SHOW Eldin your clear liquid? [y/n]");
                if (await getKey(['y', 'n']) == "y") {
                    print("Hmmm...");
                    pause(3);
                    print("Suspicions confirmed, here you are.");
                    print("Oh, I collect maple leaves, are not they beautiful. Have one.");
                    this.inventory.transfer('maple leaf', player.inventory);
                    color(blue);
                    print("<recieved maple leaf>");
                }
            }
        }).fightMove(async function () {
            if (Math.random() < 3 / 4) {
                print('TODO: powermaxout')
            }
        });
    },

    eldfarl(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'eldfarl',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 450,
            blunt_damage: 90,
            sharp_damage: 0,
            weapon: getItem('fist'),
            items: [getItem('gold', 400)],
            description: 'the respected Eldfarl',
            coordination: 12,
            agility: 4,
            blunt_armor: 29,
            spellChance: () => Math.random() < 3 / 5,
            ...args
        }).dialog(async function (player: Character) {
            print("Ahh... nice to see you, please make yourself at home.  IF you would like to ");
            print("be instructed in a class, please visit my fantasic facitlitys to the south...");
            print("please keep your voice down though!  Or if you are interested in merchadise");
            print("please scoot up to my clerics store to the North.  Once again Welcome! ");
            print();
            print("If you like, I can heal all that ails you.");
            print("It is absolutley free and restores you to maximum HP: type 'healme'");
        }).fightMove(actions.heal)
    },

    turlin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'turlin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 150,
            blunt_damage: 60,
            sharp_damage: 0,
            weapon: getItem('fist', { name: 'huge fists' }),
            description: 'Turlin',
            blunt_armor: 4,
            coordination: 3,
            agility: 1,
            ...args
        });
    },

    henge(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'henge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 320,
            blunt_damage: 50,
            sharp_damage: 40,
            weapon: getItem('longsword'),
            items: [getItem('gold', 25), getItem('longsword'), getItem('ring_of_stone')],
            description: 'Henge',
            blunt_armor: 10,
            coordination: 6,
            agility: 4,
            ...args
        }).onDeath(async function () {
            this.game.flags.henge = true;
        })
    },

    ziatos(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ziatos',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 750,
            magic_damage: 50,
            sharp_damage: 150,
            weapon: getItem('blade_of_time'),
            items: [getItem('blade_of_time'), getItem('gold', 125), getItem('ring_of_time')],
            description: 'Ziatos',
            coordination: 35,
            agility: 8,
            blunt_armor: 40,
            ...args
        }).fightMove(async function () {
            print('TODO: time stop')
        });
    },

    official(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'official',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            items: [getItem('gold', 25), getItem('long_dagger')],
            description: 'orc official',
            hp: 200,
            blunt_damage: 60,
            sharp_damage: 100,
            weapon: getItem('long_dagger'),
            coordination: 25,
            agility: 12,
            blunt_armor: 10,
            spellChance: () => true,
            ...args
        }).dialog(async function (player: Character) {
            print("Grrr...");
            print("Will ye have a pass?");
            if (player.flags.assistant) {
                color(magenta);
                print("Assistant -- Type \"pass\" if you want one.");
            }
        }).fightMove(actions.heal);
    },

    wisp(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wisp',
            pronouns: { "subject": "It", "object": "it", "possessive": "its" },
            hp: 220,
            blunt_damage: 10,
            magic_damage: 150,
            magic_level: 500,
            weapon: new Item({ name: 'piercing scream', weapon_stats: { weapon_type: 'magic' } }),
            description: 'wandering wisp',
            coordination: 100,
            agility: 10,
            blunt_armor: 100,
            alignment: 'areaw',
            ...args
        })
    },

    biadon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'biadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 30000,
            blunt_damage: 10,
            sharp_damage: 0,
            weapon: getItem('fist'),
            description: 'evasive Biadon',
            coordination: 1,
            agility: 32000,
            blunt_armor: 32000,
            ...args
        }).dialog(async function (player: Character) {
            const blobin = this.game.find_character('Blobin')
            const grogren = this.game.find_character('Grogren')
            const barracks = this.game.find_location('Orc Barracks')
            if (blobin && grogren && barracks) {
                blobin.relocate(barracks)
                grogren.relocate(barracks)
            } else if (!blobin) {
                console.log('Blobin not found')
            } else if (!grogren) {
                console.log('Grogren not found')
            } else if (!barracks) {
                console.log('Orc barracks not found')
            }
            print("Hehehehehe.");
            print("Me, holding The Ring of Ultimate Power???  Kahahaha.");
            print("You poor fool, my BROTHER holds the ring!!!");
            pause((5));
            print("Can you figure out who he is?");
            print("KAKAKAKAKAKAKAKA");
            if (this.game) this.game.flags.biadon = true;
            if (this.game) this.game.player.flags.enemy_of_ierdale = false;
        });
    },

    cyclops(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cyclops',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 860,
            blunt_damage: 174,
            sharp_damage: 5,
            weapon: getItem('club', { name: 'uprooted_tree' }),
            items: [],
            description: 'towering cyclops',
            coordination: 9,
            agility: -1,
            blunt_armor: 26,
            attackPlayer: true,
            ...args
        }).onDeath(async function () {
            color(green);
            print("  --  towering cyclops dropped uprooted tree.");
            // I1(501) = 7
            // B_n$(211) = "X"
            // End If
        });
    },

    dragon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dragon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 1300,
            blunt_damage: 40,
            sharp_damage: 166,
            weapon: getItem('claws', { name: "sharp claws" }),
            items: [],
            description: 'fire-breathing dragon',
            coordination: 5,
            agility: -3,
            blunt_armor: 60,
            attackPlayer: true,
            ...args
        }).onDeath(async function () {
            // B_n$(212) = "X"
            // WE(504) = 505
            // CreateOBJ 505, "bag of gold"
            // Call CreateOBJ(505, "bag of gold")
            // Call CreateOBJ(506, "bag of gold")
            // Call CreateOBJ(506, "bag of gold")
            // Call CreateOBJ(506, "bag of gold")
            // Call CreateOBJ(507, "bag of gold")
            // Call CreateOBJ(507, "bag of gold")
            // Call CreateOBJ(508, "bag of gold")
            // Call CreateOBJ(508, "bag of gold")
            // Call CreateOBJ(508, "bag of gold")
            // End If
        }).fightMove(async function () {
            if (Math.random() < 1 / 2) {
                color(yellow)
                if (this.location?.playerPresent) {
                    print(`A wave of fire erupts from ${this.name}, heading toward ${this.attackTarget?.name}!`)
                    const dam = Math.floor(Math.sqrt(Math.random()) * this.magic_level)
                    this.attackTarget?.hurt(dam, 'fire')
                }
            }
        })
    },

    giant_scorpion(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'giant scorpion',
            pronouns: { "subject": "It", "object": "it", "possessive": "its" },
            hp: 100,
            blunt_damage: 15,
            sharp_damage: 6,
            weapon: getItem('spear', { name: 'poison_stinger' }),
            description: 'scorpion',
            coordination: 5,
            agility: -1,
            blunt_armor: 15,
            ...args
        });
    },

    mutant_hedgehog(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'mutant hedgehog',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 100,
            blunt_damage: 6,
            sharp_damage: 15,
            weapon: getItem('horns'),
            description: 'mutant hedgehog',
            coordination: 0,
            agility: 18,
            blunt_armor: 25,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 1 / 3) {
                print("TODO: shootspike");
            }
        });
    },

    grizzly_bear(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grizzly bear',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 350,
            blunt_damage: 60,
            sharp_damage: 6,
            weapon: getItem('fist', { name: 'massive_paws' }),
            description: 'grizzly bear',
            coordination: 15,
            agility: 1,
            blunt_armor: 2,
            alignment: 'B_a$(a) + "areaw',
            spellChance: () => Math.random() < 2 / 3,
            ...args
        }).fightMove(actions.growl);
    },

    striped_bear(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'striped bear',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 250,
            blunt_damage: 42,
            sharp_damage: 5,
            weapon: getItem('fist', { name: 'heavy_paws' }),
            description: 'striped bear',
            coordination: 15,
            agility: 10,
            blunt_armor: 5,
            spellChance: () => Math.random() < 1 / 2,
            aliases: ['bear'],
            alignment: 'areaw',
            ...args
        }).dialog(async function (player: Character) {
            print("Striped bear sniffs at you curiously.");
        }).fightMove(actions.growl);
    },

    tiger(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'tiger',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 400,
            blunt_damage: 40,
            sharp_damage: 30,
            weapon: getItem('claws', { name: 'sharp claws' }),
            description: 'ferocious tiger',
            coordination: 25,
            agility: 18,
            blunt_armor: 5,
            spellChance: () => Math.random() < 1 / 2,
            alignment: 'evil/areaw',
            ...args
        }).fightMove(
            actions.growl
        );
    },

    wolf(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wolf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 80,
            blunt_damage: 12,
            sharp_damage: 35,
            weapon: getItem('teeth'),
            description: 'wolf',
            coordination: 15,
            agility: 11,
            blunt_armor: 0,
            spellChance: () => Math.random() < 1 / 2,
            aliases: ['grizzly bear'],
            ...args
        }).dialog(async function (player: Character) {
            print("grrrr...");
        }).fightMove(actions.howl);
    },

    rabid_wolf(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rabid wolf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 60,
            blunt_damage: 12,
            sharp_damage: 45,
            weapon: getItem('teeth'),
            description: 'rabid wolf',
            coordination: 5,
            agility: 0,
            blunt_armor: 0,
            powers: {
                'poison fang': 1,
            },
            attackPlayer: true,
            ...args
        }).onTurn(actions.wander);
    },

    gryphon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'gryphon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            hp: 64,
            blunt_armor: 9,
            coordination: 5,
            agility: 8,
            blunt_damage: 19,
            sharp_damage: 16,
            weapon: getItem('claws', { name: 'talons' }),
            ...args
        });
    },

    grogren(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grogren',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.biadon) {
                print("Hi, nice day.  The tention between us and Ierdale is very high right now.");
            } else {
                print("HELP!  We are in desperate need of a General to lead an attack on Ierdale.");
                print("You look reasonably strong... Talk to my brother Blobin if you are interested.");
            }
        });
    },

    mythins_employee(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: "mythin's employee",
            pronouns: pronouns.male,
            aliases: ['employee'],
            ...args
        }).dialog(async function (player: Character) {
            print("Welcome, please seek the true location of Mythins shop deep in the Forest of");
            print("Thieves.  Mythin is a good thief, yet a thief at that.  If he were to have an");
            print("office in town, the kings men would surely capture him.  I can't give you the");
            print("wareabouts as to where the place is located in the least... sorry.");
            print();
            print("To fool the guards, in town we ONLY refer to Mythin as a \"forester\"");
        });
    },
}

function getCharacter(charName: string, args?: A2dCharacterParams): A2dCharacter {
    const char = characters[charName](args);
    char.key = charName;
    return char
}

export { A2dCharacter, A2dCharacterParams, getCharacter, actions };
