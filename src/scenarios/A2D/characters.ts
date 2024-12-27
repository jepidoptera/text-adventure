import { Location } from "../../game/location.js";
import { Character, CharacterParams, pronouns } from "../../game/character.js";
import { Player } from "./player.js";
import { Item, WeaponTypes } from "../../game/item.js";
import { plural, caps, randomChoice, lineBreak } from "../../game/utils.js";
import { play, musicc$ } from "./utils.js";
import { getItem } from "./items.js";
import { getLandmark } from "./landmarks.js";
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js"
import { GameState } from "../../game/game.js";
import { A2D } from "./game.js";
import { abilityLevels } from "./spells.js";
import { getBuff } from "./buffs.js";
import { spells } from "./spells.js";

interface A2dCharacterParams extends CharacterParams {
    spellChance?: ((this: A2dCharacter) => boolean) | undefined
    respawnTime?: number,
    action?: keyof typeof actions
}

class A2dCharacter extends Character {
    class_name: string = ''
    _spellChance: ((this: A2dCharacter) => boolean) | undefined
    tripping: number = 0;
    drunk: number = 0;
    respawnTime: number = 500;
    declare game: A2D

    constructor({ spellChance, respawnTime, action, ...baseParams }: A2dCharacterParams) {
        super(baseParams)
        // recover 100% of max hp per turn (when not in combat)
        if (!baseParams.hp_recharge) this.hp_recharge = 1
        if (!this.weaponName) {
            this.weaponName = 'fists';
            this.weaponType = 'club';
            this.damageType = 'blunt';
        }
        this._spellChance = spellChance?.bind(this)
        this.respawnTime = respawnTime || this.respawnTime
        if (caps(this.alignment) == 'Ierdale') {
            this.onEncounter(
                async function (character: Character) {
                    if (character.flags.enemy_of_ierdale) {
                        if (!this.enemies.includes(character.name)) this.enemies.push(character.name)
                    }
                }
            )
        }
        if (!this.exp_value) {
            this.exp_value = Math.floor(
                this.max_hp / 2
                + this.sharp_damage() + this.blunt_damage() + this.magic_damage()
                + this.blunt_armor + this.sharp_armor + this.magic_armor
                + this.magic_level * 2
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
        if (this.respawns) {
            await this.relocate(this.game.find_location('limbo'));
            this.respawnCountdown = this.respawnTime;
        }
    }

    fight(character: Character | null) {
        if (character) {
            if (this.attackTarget === character) return;
            if (character.isPlayer && character.attackTarget !== this && this.location?.playerPresent) {
                color(red)
                print(this.name, 1)
                color(black)
                print(` takes the initiative to attack you!`);
                console.log(`${this.name} has ${this.hp} hp`)
            } else if (!character.isPlayer && this.location?.playerPresent && !this.isPlayer) {
                print(`${this.name} attacks ${character.name}!`);
            }
        }
        super.fight(character);
    }

    async encounter(character: Character) {
        await super.encounter(character);
        if (this.alignment === 'evil' && character.alignment != 'evil' && !this.dead) {
            // evil characters fight everyone
            this.fight(character);
        } else if (this.attackTarget == character || this.enemies.includes(character.name)) {
            this.fight(character);
        }
    }

    async go(direction: string): Promise<void> {
        const oldLocation = this.location;
        await super.go(direction);
        if (this.location !== oldLocation) {
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
        }
    }

    get evasion() {
        let toHit = this.agility * Math.random();
        if (this.drunk) toHit = toHit * (1 - this.drunk / (this.max_sp / 2 + 50))
        return toHit
    }

    dialog(action: (this: A2dCharacter, player: Character) => Promise<void>) {
        return super.onDialog(this.bindMethod(action));
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

    onSlay(action: (this: A2dCharacter, character: Character | Character[]) => Promise<void>) {
        return super.onSlay(this.bindMethod(action));
    }

    onDeath(action: (this: A2dCharacter, cause?: any) => Promise<void>) {
        return super.onDeath(this.bindMethod(action));
    }

    onTurn(action: ((this: A2dCharacter) => Promise<void>) | null) {
        return super.onTurn(action ? this.bindMethod(action) : null);
    }

    fightMove(action: (this: A2dCharacter) => Promise<void>): this {
        return super.fightMove(this.bindMethod(action))
    }

    addAction(name: string, action: (this: A2dCharacter, ...args: any[]) => Promise<any>) {
        this.actions.set(name, this.bindMethod(action));
        return this;
    }

    get spellChance(): boolean {
        return this._spellChance ? this._spellChance() : true;
    }

    async attack(target: Character | null = null, weapon: Item | null = null) {
        color(black)
        await super.attack(target, weapon);
    }

    describeAttack(
        target: Character,
        weaponName: string,
        weaponType: WeaponTypes,
        damage: number,
        call_attack: boolean = true
    ): string {
        console.log(`${this.name} attacking ${target.name} with ${weaponName} (${weaponType}): ${damage} damage`)
        const DT = (damage / target.max_hp) * 100
        const s = ['you', 'they'].includes(this.pronouns.subject) ? (str: string) => str : plural
        const t_s = ['you', 'they'].includes(target.pronouns.subject) ? (str: string) => str : plural
        const t_be = ['you', 'they'].includes(target.pronouns.subject) ? 'are' : 'is'
        if (weaponType === 'sword') weaponType = randomChoice(['stab', 'slice'])
        if (weaponType === 'axe') weaponType = randomChoice(['slice', 'club'])

        let does = ''
        let callAttack = ''


        const num_enemies = (
            this.isPlayer
                ? this.location?.characters.filter(c => c.attackTarget === this).length
                : this.location?.characters.filter(c => c.attackTarget === this.attackTarget).length
        ) || 0

        const attackerPronouns = {
            subject: this.isPlayer ? 'you' : (num_enemies == 1 ? this.pronouns.subject : this.name),
            object: this.isPlayer ? 'you' : (num_enemies == 1 ? this.pronouns.object : this.name),
            possessive: this.isPlayer ? 'your' : (num_enemies == 1 ? this.pronouns.possessive : `${this.name}'s`)
        }
        const targetPronouns = {
            subject: target.isPlayer ? 'you' : (num_enemies == 1 ? target.pronouns.subject : target.name),
            object: target.isPlayer ? 'you' : (num_enemies == 1 ? target.pronouns.object : target.name),
            possessive: target.isPlayer ? 'your' : (num_enemies == 1 ? target.pronouns.possessive : `${target.name}'s`)
        }

        if (DT < 0) {
            does = `${attackerPronouns.subject} ${s('miss')} ${targetPronouns.object} with ${weaponName}!`
        } else {
            does = `${caps(attackerPronouns.subject)} ${s('graze')} ${targetPronouns.object} with ${weaponName}, doing little to no damage.`
        }

        switch (weaponType) {
            case ("club"):
                if (DT >= 0) { does = `${caps(attackerPronouns.subject)} ${s('graze')} ${targetPronouns.object} with ${weaponName}, doing little to no damage.` };
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('knock')} ${targetPronouns.object} with ${weaponName}, inflicting a minor wound.` };
                if (DT >= 12) { does = `${caps(attackerPronouns.subject)} ${s('whack')} ${targetPronouns.object} with ${weaponName}, making a jagged cut.` };
                if (DT >= 25) { does = `${caps(attackerPronouns.subject)} ${s('hit')} ${targetPronouns.object} with ${weaponName}, knocking ${target.pronouns.object} backwards.` };
                if (DT >= 40) { does = `${caps(attackerPronouns.subject)} ${s('smash')} ${targetPronouns.object} with ${weaponName}, and you hear a bone break.` };
                if (DT >= 60) { does = `${caps(attackerPronouns.subject)} ${s('crush')} ${targetPronouns.object} with ${weaponName}, damaging organs.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('pulverise')} ${targetPronouns.object} with ${weaponName}, splintering bones.` };
                if (DT >= 500) { does = `${caps(attackerPronouns.subject)} ${s('send')} ${targetPronouns.object} FLYING backwards with ${weaponName}, and severed body parts fly in all directions!` };
                break;
            case ("slice"):
                if (DT >= 0) { does = `${caps(attackerPronouns.subject)} ${s('graze')} ${targetPronouns.object} with ${weaponName}, doing little to no damage.` };
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('scratch')} ${targetPronouns.object} with ${weaponName}, inflicting a minor wound.` };
                if (DT >= 10) { does = `${caps(attackerPronouns.subject)} ${s('cut')} ${targetPronouns.object} with ${weaponName}, making a deep gash.` };
                if (DT >= 20) { does = `${caps(attackerPronouns.subject)} ${s('slash')} ${targetPronouns.object} with ${weaponName}, inflicting a major wound.` };
                if (DT >= 35) { does = `${caps(attackerPronouns.subject)} ${s('slice')} ${targetPronouns.object} with ${weaponName}, and blood sprays the ground.` };
                if (DT >= 60) { does = `${caps(attackerPronouns.subject)} ${s('lacerate')} ${targetPronouns.object} with ${weaponName}, inflicting a mortal wound.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('hew')} ${targetPronouns.object} with ${weaponName}, severing limbs.` };
                if (DT >= 200) { does = `${caps(attackerPronouns.subject)} ${s('cleave')} ${targetPronouns.object} with ${weaponName}, slicing ${target.pronouns.object} in half.` };
                if (DT >= 500) { does = `${caps(attackerPronouns.subject)} ${s('flick')} ${this.pronouns.possessive} ${weaponName} and ${targetPronouns.subject} tumbles into a pile of diced meat.` };
                break;
            case ("stab"):
                if (DT >= 0) { does = `${caps(attackerPronouns.subject)} ${s('graze')} ${targetPronouns.object} with ${weaponName}, doing little to no damage.` };
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('nick')} ${targetPronouns.object} with ${weaponName}, drawing blood.` };
                if (DT >= 12) { does = `${caps(attackerPronouns.subject)} ${s('jab')} ${targetPronouns.object} with ${weaponName}, inflicting a minor wound.` };
                if (DT >= 25) { does = `${caps(attackerPronouns.subject)} ${s('hit')} ${targetPronouns.object} with ${weaponName}, inflicting a major wound.` };
                if (DT >= 50) { does = `${caps(attackerPronouns.subject)} ${s('stab')} ${targetPronouns.object} with ${weaponName}, damaging organs.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('impale')} ${targetPronouns.object} with ${weaponName}, making vital fluids gush.` };
                if (DT >= 200) { does = `${caps(attackerPronouns.subject)} ${s('eviscerate')} ${targetPronouns.object} with ${weaponName}. Blood splatters everywhere.` };
                break;
            case ("fire"):
                if (DT >= 0) does = `${caps(attackerPronouns.possessive)} ${weaponName} flickers against ${targetPronouns.object} without leaving a mark.`;
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('singe')} ${targetPronouns.object} with ${weaponName}, hurting ${target.pronouns.object} slightly.` };
                if (DT >= 12) { does = `${caps(attackerPronouns.subject)} ${s('scorch')} ${targetPronouns.object} with ${weaponName}, inflicting first-degree burns.` };
                if (DT >= 25) { does = `${caps(attackerPronouns.subject)} ${s('scald')} ${targetPronouns.object} with ${weaponName}, inflicting second-degree burns.` };
                if (DT >= 50) { does = `${caps(attackerPronouns.subject)} ${s('ignite')} ${targetPronouns.object} with ${weaponName}, instantly blistering skin.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('roast')} ${targetPronouns.object} with ${weaponName}, making charred flesh sizzle.` };
                if (DT >= 220) { does = `${caps(targetPronouns.subject)} ${t_be} blasted off ${targetPronouns.possessive} feet and cooked to a cinder in mid-air.` };
                if (DT >= 500) { does = `${caps(targetPronouns.possessive)} family is saved the cost of cremation, as ${target.pronouns.possessive} ashes scatter to the wind.` };
                break;
            case ("bow"):
                if (DT >= 0) does = `${target.name} barely ${t_s('notices')} ${attackerPronouns.possessive} arrow striking ${target.pronouns.object}.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${s('take')} minimal damage.` };
                if (DT >= 12) { does = `${caps(targetPronouns.subject)} ${t_be} minorly wounded.` };
                if (DT >= 25) { does = `${caps(targetPronouns.subject)} ${s('sustain')} a major injury.` };
                if (DT >= 50) { does = `${caps(targetPronouns.subject)} ${s('suffer')} damage to vital organs.` };
                if (DT >= 100) { does = `${caps(targetPronouns.subject)} ${t_be} slain instantly.` };
                if (DT >= 400) { does = `${caps(targetPronouns.subject)} ${t_be} ripped messily in half.` };
                if (DT >= 1000) { does = `Tiny pieces of ${caps(targetPronouns.subject)} fly in all directions.` };
                if (DT >= 2500) { does = `${caps(targetPronouns.subject)} ${t_be} VAPORIZED.` };
                if (call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('shoot')} an arrow at ${targetPronouns.object}!`;
                break;
            case ("magic"):
                if (DT >= 0) does = `${caps(targetPronouns.subject)} ${t_s('wince')} slightly, perhaps at ${attackerPronouns.possessive} incompetence.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${t_s('flinch')}, but doesn't slow down.` };
                if (DT >= 10) { does = `${caps(targetPronouns.subject)} ${t_be} knocked back a step.` };
                if (DT >= 25) { does = `${caps(targetPronouns.subject)} ${t_s('stagger')} under the force.` };
                if (DT >= 50) { does = `${caps(targetPronouns.subject)} ${t_s('reel')} backwards, almost knocked off ${target.pronouns.possessive} feet.` };
                if (DT >= 100) { does = `${caps(targetPronouns.subject)} ${t_be} snuffed out like a candle.` };
                if (DT >= 220) { does = `${caps(targetPronouns.subject)} blows away like a dendelion puff in a hurricane.` };
                if (DT >= 500) { does = `${caps(targetPronouns.subject)} ${t_be} swept off ${target.pronouns.possessive} feet and out of the time/space continuum!` };
                if (call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('attack')} ${targetPronouns.object} with ${weaponName}!`
                break;
            case ("electric"):
                if (DT >= 0) does = `${caps(targetPronouns.subject)} barely ${t_s('notice')}.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${t_s('twitch')} irritably.` };
                if (DT >= 10) { does = `${caps(targetPronouns.subject)} ${t_be} struck with a sizzle.` };
                if (DT >= 20) { does = `${caps(targetPronouns.subject)} ${t_be} badly zapped.` };
                if (DT >= 35) { does = `${caps(targetPronouns.subject)} ${t_s('stagger')}, sparking and spasming.` };
                if (DT >= 60) { does = `${caps(targetPronouns.subject)} ${t_s('howl')}, and ${t_be} rendered briefly transparent.` };
                if (DT >= 100) { does = `${caps(targetPronouns.subject)} ${t_s('fall')}, smoking, to the ground and ${t_s('twitch')} a couple of times.` };
                if (DT >= 220) { does = `${caps(attackerPronouns.subject)} ${s('ignite')} ${targetPronouns.object} with ${weaponName}, and electrical flames shoot from ${target.pronouns.possessive} blistered eye sockets.` };
                if (DT >= 500) { does = `${caps(targetPronouns.subject)} ${t_s('explode')} like a knot of pine sap.` };
                if (call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('attack')} ${targetPronouns.object} with ${weaponName}!`
                break;
            case ("blades"):
                if (DT >= 0) does = `${caps(targetPronouns.subject)} ${t_be} only scratched.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${t_s('suffer')} some nicks and cuts.` };
                if (DT >= 10) { does = `${caps(targetPronouns.subject)} ${t_s('suffer')} some cuts and gashes.` };
                if (DT >= 20) { does = `${caps(targetPronouns.subject)} ${t_be} slashed rather badly.` };
                if (DT >= 35) { does = `${caps(targetPronouns.subject)} ${t_s('stagger')} backwards, bleeding copiously from multiple wounds.` };
                if (DT >= 60) { does = `${caps(targetPronouns.subject)} ${t_s('scream')} as magical knives stab through ${target.pronouns.object}.` };
                if (DT >= 100) { does = `${caps(targetPronouns.subject)} ${t_s('fall')}, streaming blood from numerous fatal wounds.` };
                if (DT >= 220) { does = `${caps(targetPronouns.subject)} ${t_be} sliced to ribbons.` };
                if (DT >= 500) { does = `${caps(targetPronouns.subject)} ${t_be} diced into high-grade mincemeat.` };
                if (call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('attack')} ${targetPronouns.object} with ${weaponName}!`
                break;
            case ("sonic"):
                if (DT >= 5) { does = `${caps(attackerPronouns.possessive)} ${weaponName} stings ${targetPronouns.object}, making ${target.pronouns.object} grit ${target.pronouns.possessive} teeth.` };
                if (DT >= 10) { does = `${caps(attackerPronouns.possessive)} ${weaponName} stabs at ${targetPronouns.possessive} ears, and ${target.pronouns.subject} ${t_s('feel')} momentarily faint.` };
                if (DT >= 20) { does = `${caps(attackerPronouns.possessive)} ${weaponName} hits ${targetPronouns.object} full in the face, making ${target.pronouns.possessive} ears ring.` };
                if (DT >= 35) { does = `${caps(attackerPronouns.possessive)} ${weaponName} strikes ${targetPronouns.object} in the gut, sucking the breath from ${target.pronouns.possessive} lungs.` };
                if (DT >= 60) { does = `${caps(attackerPronouns.possessive)} ${weaponName} rolls through ${targetPronouns.object}, siezing in ${target.pronouns.possessive} chest, and blackness creeps into the corners of ${target.pronouns.possessive} vision.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.possessive)} ${weaponName} sweeps ${targetPronouns.possessive} feet from under ${target.pronouns.object}, etching cold lines of frost over ${target.pronouns.possessive} stilled heart.` };
                if (DT >= 220) { does = `${caps(attackerPronouns.possessive)} ${weaponName} pierces ${targetPronouns.object} like a sword, freezing the blood in ${target.pronouns.possessive} veins.` };
                if (DT >= 500) { does = `${caps(attackerPronouns.possessive)} ${weaponName} whips through ${targetPronouns.possessive} body, and ${target.pronouns.possessive} frozen limbs shatter like fine crystal."   ` };
                break;
            case ("teeth"):
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('nip')} ${targetPronouns.object} with ${weaponName}, inflicting a minor wound.` };
                if (DT >= 10) { does = `${caps(attackerPronouns.subject)} ${s('rake')} ${targetPronouns.object} with ${weaponName}, leaving a trail of scratches.` };
                if (DT >= 20) { does = `${caps(attackerPronouns.subject)} ${s('bite')} ${targetPronouns.object} with ${weaponName}, inflicting a major wound.` };
                if (DT >= 35) { does = `${caps(attackerPronouns.subject)} ${s('chomp')} ${targetPronouns.object} with ${weaponName}, taking a chunk from ${target.pronouns.possessive} side.` };
                if (DT >= 60) { does = `${caps(attackerPronouns.subject)} ${s('rip')} ${targetPronouns.object} with ${weaponName}, making vital fluids gush.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('shred')} ${targetPronouns.object} with ${weaponName}, severing limbs.` };
                if (DT >= 220) { does = `${caps(attackerPronouns.subject)} ${s('crush')} ${targetPronouns.object} with ${weaponName}, snapping ${target.pronouns.possessive} bones like dry twigs.` };
                if (DT >= 500) { does = `${caps(attackerPronouns.subject)} ${s('snap')} ${targetPronouns.object} up and ${s('pick')} the bones from ${this.pronouns.possessive} teeth.` };
                break;
        }
        does = lineBreak(does);
        if (!this.isPlayer && !target.isPlayer && !callAttack) callAttack = `${caps(attackerPronouns.subject)} ${s('attack')} ${targetPronouns.object} with ${weaponName}!`
        // if (DT === 0) callAttack = ''
        return callAttack ? `${callAttack}\n${does}` : does
    }
}

const actions = {
    wander: function ({ bounds, frequency = 1 / 2 }: { bounds?: string[], frequency?: number }) {
        async function wander_function(this: A2dCharacter) {
            if (this.attackTarget) return;
            if (Math.random() < frequency) {
                const options = Array.from(
                    this.location?.adjacent?.keys() || []
                ).filter(
                    // don't go back if you can help it
                    key => key != this.backDirection
                ).filter(
                    key => {
                        // stay in bounds
                        const goLocation = this.location?.adjacent?.get(key)
                        return !bounds || goLocation && (
                            !bounds.includes(goLocation.key.toString())
                            && !bounds.includes(goLocation.name.toLowerCase())
                        )
                    }
                )
                // console.log(`${this.name} wandering toward one of: ${options}`)
                const goDirection = randomChoice(options) || this.backDirection;
                // console.log(`chose ${goDirection} ${goDirection == this.backDirection ? '(backward)' : ''}`)
                const goLocation = this.location?.adjacent?.get(goDirection)
                if (goLocation && bounds && (
                    bounds.includes(goLocation.key.toString())
                    || bounds.includes(goLocation.name.toLowerCase())
                )) {
                    console.log(`${this.name} turned back at ${goLocation.name}`)
                    return;
                } else this.go(goDirection);
            }
        }
        return wander_function;
    },
    pish2: async function (this: A2dCharacter, character: Character) {
        // usage: character.onAttack(actions.pish2)
        if (character.isPlayer) print("I don't want to fight.");
        character.fight(null);
        this.fight(null);
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
        color(magenta)
        print(`${caps(this.name)} growls fiercly, your attack fell.`)
        this.attackTarget?.addBuff(getBuff('fear')({ power: Math.random() * this.magic_level, duration: 12 }));
    },
    howl: async function (this: A2dCharacter) {
        if (this.attackTarget?.isPlayer) {
            print(`TODO: howl`);
        }
    },
    train: function ({ skillName, requirements, classDiscount, result }:
        {
            skillName: string,
            requirements: (player: Player) => { gold: number, xp: number, magic_level?: number, other?: boolean },
            classDiscount: { [key: string]: number },
            result: (player: Player) => void
        }
    ): (this: A2dCharacter, player: Player) => Promise<void> {
        return async function (this: A2dCharacter, player: Player) {
            color(black)

            const discount = (classDiscount[player.class_name] ? (1 - classDiscount[player.class_name] / 100) : 1)
            const reqs = Object.assign({ other: true }, requirements(player))

            if (!reqs.other) {
                print('You will not be able to train at this time.');
                return;
            }

            reqs.gold = Math.floor(reqs.gold * discount)
            reqs.xp = Math.floor(reqs.xp * discount)
            reqs.magic_level = Math.floor(reqs.magic_level || 0)

            if (player.isPlayer) {
                print("It will require the following attributes:");
                if (classDiscount[player.class_name]) {
                    print(`Because you are of the ${player.class_name} class, "${skillName}"`)
                    print(`will take ${classDiscount[player.class_name]}% less gold and experience.`);
                }
                print(`Exp: ${reqs.xp}`);
                if (reqs.magic_level) print(`Magic Level: ${reqs.magic_level} or higher.`);
                print(`Gold: ${reqs.gold}`);
            }

            if (player.has('gold', reqs.gold) && player.experience >= reqs.xp && player.magic_level >= reqs.magic_level) {
                if (
                    !player.isPlayer
                    || await (async () => { print("Procede with training? [y/n]"); return await getKey(['y', 'n']) == 'y' })()
                ) {
                    player.removeItem('gold', reqs.gold);
                    player.experience -= reqs.xp;
                    if (player.isPlayer) {
                        print("You begin your training...");
                        await pause(3);
                        print();
                        print("You continue your training...");
                        await pause(3);
                        print();
                        print("Your training is almost complete...");
                        await pause(2);
                        print();
                    }
                    result(player);
                    return;
                } else return;
            } else if (player.isPlayer) {
                if (player.experience < reqs.xp) {
                    print("You do not have enough experience.");
                }
                if (!player.has('gold', reqs.gold)) {
                    print("You do not have enough gold.");
                }
                if (player.magic_level < reqs.magic_level) {
                    print("You are too low of a magic level.");
                }
                print("You will not be able to train at this time.");
                print("Press any key.");
                await getKey();
            }
        }
    },
    buy: async function (this: A2dCharacter, character: Character, itemName: string) {
        color(black)
        const item = this.item(itemName);
        if (!item) {
            print("That is not for sale here.");
            return;
        } else if (item.value > character.itemCount('gold')) {
            print("You don't have enough money.");
            return;
        } else {
            character.giveItem(item.copy());
            character.removeItem('gold', item.value);
            print(`Bought ${item.name} for ${item.value} GP.`);

            if (item.equipment_slot === 'armor') {
                const player = character as Player
                if (player.equipment.armor) {
                    print("You remove your old armor...")
                    await pause(1)
                }
                player.equip(item, 'armor')
                print(`${item.name} equipped.`)
            }
        }
    },
    travel: function (path: string | string[]) {
        path = typeof path === 'string' ? path.split(' ') : path
        async function travel(this: A2dCharacter) {
            this.flags.path = path;
            this.onTurn(async function () {
                let dir: string = (path as string[]).pop() || ''
                dir = {
                    n: 'north',
                    s: 'south',
                    e: 'east',
                    w: 'west',
                    ne: 'northeast',
                    nw: 'northwest',
                    se: 'southeast',
                    sw: 'southwest'
                }[dir] || dir
                if (dir) {
                    this.flags.path = path
                    await this.go(dir)
                    console.log(`${this.name} travels ${dir}`)
                } else {
                    this.onTurn(null)
                }
            })
        }
        return travel;
    }
}

const characters = {
    player(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'player',
            isPlayer: true,
            ...args
        });
    },
    sick_old_cleric(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'A sick old cleric, lying in bed',
            aliases: ['cleric', 'old cleric', 'sick cleric', 'sick old cleric'],
            description: 'A sick old cleric, lying in bed',
            items: [getItem('clear_liquid'), getItem('blue_liquid'), getItem('red_liquid')],
            ...args
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
            this.transferAllItems(player)
        })
    },

    ierdale_forester(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale forester',
            items: [getItem('long_dagger'), getItem('gold', 12)],
            max_hp: 54,
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
            if (
                this.location?.name.toLowerCase().includes('entrance')
                && this.location?.character(this.name) === this
                && direction == 'north' && character.isPlayer && character.flags.forest_pass) {

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
            max_hp: 100,
            blunt_damage: 10,
            sharp_damage: 40,
            weapon: getItem('longsword'),
            description: 'guard captain',
            coordination: 7,
            agility: 2,
            blunt_armor: 13,
            sharp_armor: 20,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            alignment: 'ierdale',
            ...args
        }).dialog(async function (player: Character) {
            const assignMission = async () => {
                this.game.flags.ierdale_mission = 'yes';
                print("You are a true hero. GLORY TO IERDALE!")
                await pause(2)
                print("Half now, half when you return. You may need this to equip yourself for")
                print("the journey.")
                player.giveItem(getItem('gold', 5000))
                await pause(2)
                print("This may also help you - ")
                color(magenta)
                print("<recieved pocket ballista>")
            }
            if (!this.game.flags.biadon) {
                print("Beware... if you attack me I will call more guards to help me.");
            } else if (!this.game.flags.ierdale_mission) {
                print("Guard captain looks up from her maps and schematics.");
                print(`${caps(player.name)}. You came.`)
                await pause(3)
                print()
                print("We need your help for a desperate mission. The orcs have been plotting to")
                print("invade Ierdale. We've raised the gates and are preparing for a siege, but")
                print("it may not be enough. The worst part is that the legendary Ieadon has turned")
                print("against us and escaped town. With him on their side, we are in real trouble.")
                print("I think our best shot may be to send a lone hero to Grobin to steal their")
                print("most potent weapon, the Mighty Gigasarm. That would weaken their forces and")
                print("give ours a much needed boost to morale.")
                print()
                print("I think you may be up to the task.")
                await pause(11)
                print()
                print("What do you say? Will you help us?")
                print("If so, the orcs' best weapon will be YOURS to keep, and you will have")
                print("all the GLORY of Ierdale!")
                await pause(5)
                print()
                print("Also, 10 thousand GP.")
                await pause(2)
                print('[y/n]')
                const answer = await getKey(['y', 'n'])
                if (answer == 'y') {
                    await assignMission()
                } else {
                    print("I understand. This is a difficult thing to ask.")
                    print("Come back later if you change your mind.")
                    this.game.flags.ierdale_mission = 'maybe';
                }
            } else if (this.game.flags.ierdale_mission == 'maybe') {
                print("Are you ready to accept the mission?");
                print("[y/n]");
                const answer = await getKey(['y', 'n'])
                if (answer == 'y') {
                    await assignMission()
                } else {
                    print("Come back later if you change your mind.")
                }
            } else if (this.game.flags.ierdale_mission == 'yes') {
                print("You have accepted the mission.  Go to Grobin and steal the Mighty Gigasarm.")
            }
        }).onDeath(async function (player) {
            if (player.isPlayer && !player.flags.enemy_of_ierdale) {
                color(red)
                print("Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true;
            }
        }).fightMove(async function () {
            this.game.find_all_characters('security guard').forEach(guard => {
                guard.goto(this.location!.key)
                guard.fight(this.attackTarget)
            })
        });
    },

    minotaur(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'minotaur',
            pronouns: pronouns.male,
            items: [getItem('spiked_club')],
            max_hp: 760,
            blunt_damage: 280,
            sharp_damage: 13,
            weapon: getItem('spiked_club'),
            description: 'labyrinth minotaur',
            coordination: 15,
            agility: 2,
            alignment: 'evil/areaw',
            respawn: false,
            ...args
        });
    },

    stone_ogre(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'stone ogre',
            pronouns: pronouns.male,
            items: [getItem('gold', 5), getItem('spiked_club')],
            max_hp: 100,
            blunt_damage: 20,
            sharp_damage: 5,
            weapon: getItem('spiked_club'),
            description: 'stone ogre',
            blunt_armor: 2,
            coordination: 3,
            agility: 2,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    ierdale_soldier(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale soldier',
            pronouns: pronouns.male,
            items: [getItem('gold', 50), getItem('claymoore')],
            max_hp: 300,
            blunt_damage: 50,
            sharp_damage: 50,
            weapon: getItem('claymoore'),
            description: 'ierdale soldier',
            coordination: 14,
            agility: 3,
            blunt_armor: 15,
            sharp_armor: 25,
            aliases: ['soldier'],
            alignment: 'ierdale',
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            if (!player.has('mighty_gigasarm')) {
                if (!this.flags.dialog) {
                    this.flags.dialog = this.game.flags.soldier_dialogue.shift() || "Sir! Yes sir!";
                }
                print(lineBreak(this.flags.dialog));
                this.flags.dialog = 'Sir! Yes sir!'
            } else {
                print(`${player.name}! ${player.name}! The hero returns!`)
            }
        }).onDeath(async function () {
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            if (this.location?.playerPresent) {
                color(red)
                print('Ierdale soldier')
                print(` -- Help!  I'm under attack!`);
            }
            for (let soldier of this.game.find_all_characters('ierdale_soldier')) {
                await soldier.goto(this.location!.key)
            }
        });
    },

    ierdale_patrol(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale soldier',
            pronouns: pronouns.male,
            items: [getItem('gold', 50), getItem('claymoore')],
            max_hp: 300,
            blunt_damage: 50,
            sharp_damage: 50,
            weapon: getItem('claymoore'),
            description: 'ierdale soldier',
            coordination: 14,
            agility: 3,
            blunt_armor: 15,
            sharp_armor: 25,
            aliases: ['soldier'],
            alignment: 'ierdale',
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            if (player.has('mighty_gigasarm')) {
                print("Let the hero pass!")
            } else {
                print("We are ready to attack the filthy Orcs at a moments notice!");
            }
        }).onDeath(async function () {
            this.game.player.flags.enemy_of_ierdale = true;
        }).onTurn(actions.wander({
            bounds: [
                'mucky path', 'stony bridge', 'dry grass', 'entrance to the forest of thieves', 'house', 'sandy desert', 'path of nod'
            ], frequency: 1 / 4
        })).fightMove(async function () {
            if (this.location?.playerPresent) {
                color(red)
                print('Ierdale soldier')
                print(` -- Help!  I'm under attack!`);
            }
            for (let soldier of this.game.find_all_characters('ierdale_soldier')) {
                await soldier.goto(this.location!.key)
            }
        });;
    },

    general_kerry(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale general',
            pronouns: pronouns.male,
            items: [getItem('gold', 200), getItem('silver_sword')],
            max_hp: 700,
            blunt_damage: 50,
            sharp_damage: 120,
            weapon: getItem('silver_sword'),
            description: 'ierdale general',
            coordination: 16,
            agility: 8,
            blunt_armor: 30,
            sharp_armor: 45,
            magic_armor: 10,
            aliases: ['general'],
            respawn: false,
            ...args
        }).onDeath(async function () {
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            this.game.find_all_characters('ierdale_soldier').forEach(soldier => {
                soldier.goto(this.location!.key)
                soldier.fight(this.attackTarget)
            })
        }).dialog(async function (player: Character) {
            print("Ieadon is nowhere to be found, and our best intelligence is that he has")
            print("joined the Orcs.  We must prepare for the worst.  We have locked the gates")
            print("and are preparing for a siege.")
        });
    },

    general_gant(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ierdale general',
            pronouns: pronouns.male,
            items: [getItem('gold', 200), getItem('silver_sword')],
            max_hp: 700,
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
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Back in LINE!  This is a time of seriousness.  We are planning on crushing the");
            print("Orcs for helping Ieadon break free.  All the gates where the Orcs could enter");
            print("are locked.  Once you leave through a gate you won't be able to come back!");
        }).onDeath(async function () {
            this.game.player.flags.enemy_of_ierdale = true;
        }).fightMove(async function () {
            this.game.find_all_characters('ierdale_soldier').forEach(soldier => {
                soldier.goto(this.location!.key)
                soldier.fight(this.attackTarget)
            })
        });
    },

    security_page(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'security page',
            items: [getItem('dagger'), getItem('gold', Math.random() * 300 + 500)],
            max_hp: 21,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("AVENGE ME!");
                this.game.player.flags.murders += 1
                this.game.player.flags.enemy_of_ierdale = true
                let chief = this.game?.find_character('police chief')
                if (chief && !chief.dead) {
                    print();
                    pause(2);
                    print("Police chief hears cry and enters.");
                    print("POLICE CHIEF");
                    print("Now I bring the world down on your ASS!")
                    print("That was my CHICK!");
                    print();
                    chief.relocate(this.location);
                }
            }
        }).addAction('pass', async function (player) {
            if (player.flags.forest_pass) {
                if (player.isPlayer) print("You already have a pass.")
                return;
            }
            color(black)
            if (player.experience < 500 || !player.inventory.has('gold', 30)) {
                if (player.isPlayer) print("Sorry sir, you are not aplicable.")
                return;
            }
            player.removeItem('gold', 30)
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
            // this is the signal for the farm goblins to appear
            for (let location of [34, 35, 36, 39, 41].map(key => this.game.find_location(key))) {
                location?.addCharacter(getCharacter('goblin_captain', this.game))
                for (let i = 0; i < 4; i++) {
                    location?.addCharacter(getCharacter('goblin_solider', this.game))
                }
            }
        }).onRespawn(async function () {
            this.item('gold')!.value = Math.random() * 300 + 500
        });
    },

    toothless_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'toothless man',
            pronouns: pronouns.male,
            items: [getItem('battle_axe'), getItem('gold', 1000)],
            max_hp: 70,
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
        }).addAction('pawn', async function (player: Character, itemName: string) {
            color(black)
            const item = player.item(itemName)
            if (!item) {
                print("You don't have that.");
                return;
            }
            if (!item.value) {
                print("Hmm... nice piece of equipment there.")
                print("Sorry, can't give ya money for it, I'll take it though.")
            } else {
                print(`Selling price: ${item.value}`);
            }
            print("How many?")
            const quantity: number = Math.min(parseInt(await input()) || 0, player.itemCount(itemName));
            const payment = item.value * quantity;
            if (quantity > 0) {
                print("Thanks, here's your money - HEHEHAHAHOHOHO!!")
                player.giveItem(getItem('gold', payment));
                player.removeItem(itemName, quantity);
            }
            if (quantity === 1) {
                print(`----Pawned 1 ${itemName} for ${payment} GP.`)
            } else {
                print(`----Pawned ${quantity} ${plural(itemName)} for ${payment} GP.`)
            }
        }).fightMove(actions.heal);
    },

    armor_merchant(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'armor merchant',
            pronouns: pronouns.male,
            items: [
                getItem('leather_armor'),
                getItem('studded_leather'),
                getItem('light_chainmail'),
                getItem('chain_mail'),
                getItem('banded_mail'),
                getItem('light_plate'),
                getItem('full_plate'),
            ],
            max_hp: 130,
            blunt_damage: 30,
            sharp_damage: 0,
            weapon: getItem('fist'),
            coordination: 2,
            agility: 1,
            blunt_armor: 30,
            aliases: ['merchant'],
            alignment: 'armor shop',
            respawn: false,
            spellChance: () => Math.random() < 1 / 3,
            ...args
        }).dialog(async function (player: Character) {
            print("May I aid in assisting you?  Read the sign.  It contains all of our products.");
            print("Also: I've heard thiers a ring somewhere in the caves off the meadow.");
        }).onDeath(async function () {
            this.clearInventory();
            this.giveItem(getItem('gold', 1418));
            color(red);
            print("armor merchant lets out a strangled cry as he dies.  The blacksmith is pissed.");
            const blacksmith = this.game.find_character('blacksmith')
            if (!blacksmith) {
                console.log('character "blacksmith" not found.')
                return
            }
            blacksmith.attackPlayer = true
        }).fightMove(
            actions.heal
        ).addAction('buy', actions.buy);
    },

    blacksmith(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'blacksmith',
            items: [getItem('gold', 50), getItem('battle_axe')],
            max_hp: 500,
            blunt_damage: 40,
            sharp_damage: 100,
            weapon: getItem('battle_axe'),
            coordination: 10,
            agility: 6,
            blunt_armor: 50,
            sharp_armor: 50,
            description: 'blacksmith',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            alignment: 'armor shop',
            respawn: false,
            spellChance: () => Math.random() < 3 / 4,
            ...args
        }).dialog(async function (player: Character) {
            print("'Ello me'lad.  Please, I am not much of a talker, talk to the other un'");
        }).fightMove(
            actions.heal
        );
    },

    bag_boy(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bag boy',
            pronouns: pronouns.male,
            items: [getItem('gold', 4), getItem('banana')],
            description: 'worthless little bag boy',
            max_hp: 30,
            weaponName: 'banana',
            weaponType: 'club',
            blunt_damage: 5,
            sharp_damage: 0,
            blunt_armor: 2,
            coordination: 1,
            agility: 1,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello SIR!  How are you on this fine day!  I love life!  Isn't this a great");
            print("job I have here!  I get to bag groceries all day long!  Weeee!");
            print("Can I help you PLLLEEEASEEE?  I'd love to help you.");
            await pause(10)
            print("Can I help you?");
            await pause(1.5)
            print("Pretty Please may I help?");
            await pause(1.5)
            print("May I be of assistance?");
            await pause(1.5)
            print("GOOD DAY!  What can I help ya with?");
            await pause(1.5)
            print("Here to serve you!  Just holler!");
            await pause(1.5)
            print("Seriously though, if you need anything just ASK AWAY!  Weeee!");
        }).onDeath(async function () {
            color(brightblue);
            print("---Grocer");
            print("Thank god you killed him, he was getting annoying.");
        });
    },

    baby_spritzer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'baby spritzer',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            items: [getItem('gold', 6), getItem('spritzer_hair')],
            description: 'potent baby spritzer',
            max_hp: 25,
            magic_damage: 18,
            blunt_armor: 1,
            coordination: 1,
            agility: 1.5,
            weaponName: 'spritzer power',
            weaponType: 'magic',
            spellChance: () => Math.random() < 1 / 4,
            ...args
        }).dialog(async function (player: Character) {
            print("Wanna play?");
        }).onDeath(async function () {
            color(brightblue);
            print(`Baby spritzer vanishes to be with ${this.pronouns.possessive} parents, ${this.pronouns.subject} is done playing.`);
        }).fightMove(
            actions.sleep
        ).onRespawn(async function () {
            this.enemies = [];
            this.attackPlayer = false;
        });
    },

    colonel_arach(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Colonel Arach',
            pronouns: pronouns.male,
            items: [getItem('gold', 500), getItem('mighty_excalabor')],
            description: 'Arach the Terrible',
            max_hp: 1500,
            sharp_damage: 500,
            weapon: getItem('mighty_excalabor'),
            blunt_armor: 60,
            sharp_armor: 40,
            coordination: 20,
            agility: 20,
            aliases: ['colonel', 'arach'],
            alignment: 'ierdale',
            respawn: false,
            spellChance: () => true,  // always heals
            magic_level: 50,
            ...args
        }).dialog(async function (player: Character) {
            if (player.has("bug repellent")) {
                print("Whats that you're holding in your hand?");
                print();
                color(red);
                print("<show colonel arach your bug repellent?> [y/n]");
                color(black)

                if (await getKey(['y', 'n']) == "y") {
                    print();
                    print("Whats that you say... bug repellent???  BUG repellent!");
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
                    player.removeItem('bug repellent')
                    this.game.flags.colonel_arach = true
                    this.flags['cured'] = true
                    const gate_locations = [
                        this.game.find_location('Eastern Gatehouse'),
                        this.game.find_location('Western Gatehouse'),
                        this.game.find_location('Northern Gatehouse'),
                    ]
                    gate_locations.forEach(location => {
                        if (location) {
                            location.removeLandmark('locked_gate')
                            location.addLandmark(getLandmark('open_gate'))
                        }
                    })
                    this.relocate(this.game.find_location('Ierdale Barracks'))
                } else {
                    color(black);
                    print();
                    print("Alright, looks curious though.");
                    print();
                }
            } else if (!this.flags['talked'] && !this.flags['cured']) {
                this.flags['talked'] = true;
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
            } else if (!this.flags['cured']) {
                print("I'm sorry, no one will be allowed to leave as long as the menace persists.");
            } else {
                print("Greetings to you. All is well in Ierdale today.")
            }
        }).onAttack(async function (attacker) {
            if (this.location?.playerPresent) {
                color(red)
                print(`Colonel Arach -- Assassin!`);
                print('              -- Soldiers!  To me!')
                attacker.flags.enemy_of_ierdale = true;
            }
            for (let soldier of this.game.find_all_characters('ierdale soldier')) {
                await soldier.goto(this.location!.key)
            }
            for (let guard of this.game.find_all_characters('security guard')) {
                await guard.goto(this.location!.key)
            }
            for (let general of this.game.find_all_characters('ierdale general')) {
                await general.goto(this.location!.key)
            }
        }).fightMove(actions.heal);
    },

    sift(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Sift',
            pronouns: pronouns.male,
            items: [getItem('gold', 200), getItem('ring_of_dreams')],
            max_hp: 580,
            blunt_damage: 20,
            sharp_damage: 100,
            weaponName: 'claws',
            weaponType: 'slice',
            description: 'Sift',
            coordination: 25,
            agility: 15,
            blunt_armor: 25,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
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
            max_hp: 1000,
            blunt_damage: 250,
            sharp_damage: 150,
            weapon: getItem('spiked_club'),
            blunt_armor: 26,
            coordination: 5,
            agility: 5,
            spellChance: () => Math.random() < 5 / 7,
            magic_level: 25,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.cradel) {
                print("mumble mumble");
                print("Oh to be able to sleep.");
                print("I lay long hours at trying to sleep.");
                print("To anyone who could make me fall asleep... I");
                print("would grant any wish in my power.");
            } else {
                print("Cradel grins at you sleepily");
                print("'Thankyou once again friend.'");
            }
        }).fightMove(
            actions.growl
        ).onDeath(async function () {
            // open gate
            this.location?.removeLandmark('locked_gate')
            this.location?.addLandmark(getLandmark('open_gate'))
            this.game.flags.cradel = true;
            this.location?.adjacent?.set('south', this.game.find_location(192) || this.location);
        }).addAction('play lute', async function (player: Character) {
            if (!player.has('lute de lumonate')) {
                color(gray);
                print("You don't have that.");
                return;
            } else {
                color(blue)
                print("You lift the beautiful lute to your lips, and unleash a tune...")
                await pause(1)
                play(musicc$(10))
                print()
                if (!this.game.flags.cradel) {
                    color(black)
                    print("Cradel jerks his head suddenly...")
                    print("He looks up at you longingly and then slowly, ever so slowly...")
                    print("The music goes on, his head sinks twords his chest.")
                    print()
                    await pause(6)
                    if (!player.has('ring of dreams')) {
                        print("Not enough, almost, and yet I still cannot sleep.")
                        await pause(1);
                        return;
                    } else {
                        print("Cradel eyes your ring of dreams.")
                        await pause(1)
                        print("Cradel gasps I have lived long and seen that ring many times...")
                        print("I never knew it would fall into the hands of one the likes of")
                        print("you.  With the help of that I know I could sleep.")
                        print("Help me out? [y/n]")
                        if (await getKey(['y', 'n']) == "n") {
                            print("Oh, I am a peaceful troll.  Now would seem a time as any though to break")
                            print("my pasifistic nature.  I will not however it agains my beliefs.  Please re-")
                            print("consider later.")
                            await pause(5)
                            return
                        } else {
                            print("'Thankyou, whatever do you want... You have GIVEN ME SLEEP!'")
                            print("You seek to open these gates, and find what reality has in store on the")
                            print("other side. I can tell, for your eyes say it aloud.")
                            await pause(4)
                            print()
                            print("That is one wish I have the power to grant, Make it so? [y/n]")
                            if (await getKey(['y', 'n']) == "y") {
                                color(black)
                                print("Cradel gets off of his huge rump.")
                                print("With a shudder he opens the gates and thanks you with all his heart.")
                                print(`'Thankyou again ${player.name}, come see me again soon!'`)
                                player.transferItem('ring of dreams', this)
                                this.game.flags.cradel = true;
                                this.location!.landmarks = [getLandmark('open_gate')];
                                this.location?.adjacent?.set('south', this.game.find_location(192) || this.location);
                            } else {
                                print("Thankyou anyway.");
                                print("If you change your mind play that wonderful tune again.");
                            }
                        }
                    }
                }
            }
        })
    },

    mino(args: { [key: string]: any }) {

        return new A2dCharacter({
            name: 'Mino',
            pronouns: pronouns.male,
            items: [getItem('gold', 15), getItem('long_dagger'), getItem('lute_de_lumonate')],
            description: 'musical Mino',
            max_hp: 250,
            blunt_damage: 0,
            sharp_damage: 40,
            weapon: getItem('long_dagger'),
            blunt_armor: 20,
            agility: 40,
            coordination: 12,
            respawn: false,
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
                    print()
                    print("Press a key when finished.");
                    await getKey()
                    print("Tune two, by ME!");
                    this.flags.tune['mino'] = play(musicc$(10));
                    print()
                    print("Press a key when finished.");
                    await getKey()
                    print("Tune three, by Turlin");
                    this.flags.tune['turlin'] = play(musicc$(10));
                    print()
                    print("Press a key when finished.");
                    await getKey()
                    print("Tune four, by the old cat woman");
                    this.flags.tune['cat woman'] = play(musicc$(10));
                    print()
                    print("Press a key when finished.");
                    await getKey()
                    print("Tune five, by doo-dad man");
                    this.flags.tune['doo-dad man'] = play(musicc$(10));
                    print()
                    print("Press a key when finished.");
                    await getKey()
                    print("Tune six, by Ieadon");
                    this.flags.tune['ieadon'] = play(musicc$(10));
                    print()
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
                this.transferItem('lute de lumonate', player)
                this.flags.won = true
            } else if (!Object.keys(this.flags.tune).includes(guess)) {
                color(black)
                print("I didn't play a song by them.")
            } else {
                color(black)
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
            max_hp: 50,
            blunt_damage: 10,
            sharp_damage: 2,
            weapon: getItem('fist'),
            description: 'helpless peon',
            coordination: 2,
            agility: 3,
            pronouns: randomChoice([pronouns.female, pronouns.male]),
            alignment: 'orc',
            ...args
        }).dialog(async function (player: Character) {
            print("Ierdale will stop at nothing to destroy us!");
            print("Join us against them, brother!");
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'] })
        ).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    orcish_citizen(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orcish citizen',
            items: [getItem('gold', 29), getItem('rapier')],
            max_hp: 80,
            sharp_damage: 20,
            weaponName: 'rapier',
            weaponType: 'stab',
            description: 'orcish citizen',
            coordination: 3,
            agility: 2,
            pronouns: pronouns.male,
            alignment: 'orc',
            ...args
        }).dialog(async function (player: Character) {
            print("Ierdale will stop at nothing to destroy us!");
            print("Join us against them, brother!");
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'], frequency: 1 / 3 })
        ).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    orcish_child(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orcish child',
            items: [getItem('toy_sword')],
            max_hp: 10,
            blunt_damage: 1,
            sharp_damage: 0,
            weaponName: 'toy sword',
            description: 'orcish child',
            coordination: 1,
            agility: 1,
            alignment: 'orc',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
        }).dialog(async function (player: Character) {
            print('Kill humans! Weeeee!')
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'], frequency: 1 / 3 })
        ).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    orcish_soldier(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orcish soldier',
            pronouns: pronouns.male,
            items: [getItem('gold', 5), getItem('halberd')],
            description: 'orcish soldier',
            max_hp: 120,
            blunt_damage: 30,
            sharp_damage: 45,
            weaponName: 'halberd',
            weaponType: 'axe',
            coordination: 5,
            agility: 3,
            alignment: 'orc',
        }).onTurn(
            actions.wander({ bounds: ['grobin gates', 'peon house', 'orc house', 'house', 'orcish grocery'] })
        ).dialog(async function (player: Character) {
            print("Ten-hut! The humans will find no quarter with me!");
        }).onEncounter(async function (player: Character) {
            if (!player.flags.orc_pass && !player.alignment.includes('orc')) {
                this.fight(player)
            };
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })

    },

    dark_angel(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dark angel',
            items: [getItem('gold', 50), getItem('dark_sword'), getItem('banana')],
            max_hp: 300,
            magic_damage: 40,
            sharp_damage: 40,
            weapon: getItem('dark_sword'),
            magic_level: 150,
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
            if (this.attackTarget && Math.random() < 1 / 3) {
                if (this.location?.playerPresent) {
                    color(brightred);
                    print("Dark angel launches a fireball...");
                }
                await spells['fire'].call(this, this.attackTarget)
            }
        }).onEncounter(async function (player: Character) {
            if (!player.flags.orc_pass && !player.alignment.includes('orc')) {
                this.fight(player)
            };
        }).onAttack(async function (attacker) {
            // pass revoked
            attacker.flags.orc_pass = false;
        })
    },

    gerard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'gerard',
            items: [getItem('gold', 50)],
            max_hp: 200,
            blunt_damage: 100,
            sharp_damage: 50,
            weaponName: 'a bomb',
            weaponType: 'magic',
            description: 'Gerard',
            blunt_armor: 20,
            coordination: 5,
            agility: 2,
            pronouns: pronouns.male,
            respawn: false,
            alignment: 'orc',
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.ieadon) {
                print("A hang glider is nice... for gliding from high places.");
            } else {
                print("Try out my newest invention... the PORTAL DETECTOR!");
            }
        });
    },

    orc_emissary(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orcish emissary',
            aliases: ['emissary', 'orc'],
            pronouns: pronouns.female,
            description: 'orc emissary',
            max_hp: 250,
            blunt_damage: 19,
            sharp_damage: 74,
            magic_damage: 24,
            weapon: getItem('mighty_gigasarm'),
            items: [getItem('gold', 5), getItem('mighty_gigasarm')],
            sharp_armor: 20,
            blunt_armor: 20,
            magic_armor: 20,
            coordination: 5,
            agility: 3,
            alignment: 'orc',
            chase: true,
            ...args
        }).dialog(async function (player: Character) {
            print(`I am the emissary of the orcs. I'm seeking you in particular, `, 1)
            color(red)
            print(player.name, 1);
            color(black)
            print(".")
            print("We are at war with the humans, but we are not evil. We're simply trying to");
            print("protect our land while taking as much of theirs as we can for ourselves.");
            await pause(5)
            print()
            print("We are not the enemy. We need your help.");
            await pause(2)
            print()
            print("Word has spread that you are a friend to the orcs, and that there is something");
            print("that you want. I tell you that we know the whereabouts of the fifth ring, the");
            color(blue)
            print("ring of ultimate power", 1)
            color(black)
            print(", and we are prepared to deliver it to you, if you can");
            print("accomplish our mission.");
            print()
            print("Do you want to hear about it [y/n]")
            if (await getKey(['y', 'n']) == "y") {
                print("We seek to destroy the humans' leader, Colonel Arach.");
                await pause(2)
                print()
                print("To do so, you will probably have to kill every human soldier in Ierdale.");
                print("I would go myself, but I don't want to die. This way, we risk nothing");
                print("<cough> except human lives <cough>, and you get the ring. It's a win-win.");
                await pause(5)
                print()
                print("We would also provide you with a powerful weapon and several of our best");
                print("soldiers. If you succeed, the ring is yours.");
                print("Accept? [y/n]");
                if (await getKey(['y', 'n']) == "y") {
                    print("Follow me, then.")
                    this.game.player.flags.orc_pass = true;
                    this.flags.lead_player = true;
                    this.goto('Orcish Stronghold')
                } else {
                    print("That means death.");
                    await pause(2);
                    this.fight(player);
                }
            } else {
                print("I'm sorry to hear that. You die now.");
                this.fight(player)
            }
        }).onTurn(async function () {
            if (this.flags.lead_player) {
                if (this.location?.name == 'Orcish Stronghold') {
                    delete this.flags.lead_player;
                    color(magenta);
                    print("Orcish emissary -- Blobin will tell you the rest.");
                } else if (this.actionQueue.length == 0 && this.location?.playerPresent) {
                    color(magenta);
                    print("Orcish emissary -- follow me.");
                    this.goto('Orcish Stronghold');
                } else {
                    this.actionQueue = [];
                }
            }
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    doo_dad_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'doo dad man',
            items: [getItem('gold', 150), getItem('long_dagger')],
            max_hp: 90,
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
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    orcish_grocer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'orcish grocer',
            aliases: ['grocer'],
            pronouns: pronouns.female,
            items: [
                getItem('banana'),
                getItem('muffin'),
                getItem('wheel_of_cheese'),
                getItem('asparagus'),
                getItem('dog_steak'),
                getItem('nip_of_gin'),
                getItem('barrel_of_grog'),
            ],
            description: 'orcish grocer',
            max_hp: 30,
            weaponName: 'banana',
            weaponType: 'club',
            blunt_damage: 5,
            sharp_damage: 0,
            blunt_armor: 2,
            coordination: 1,
            agility: 1,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello sir! I hope your enjoy our fine orcish cuisine.");
            print("Here is what I have for sale:");
            print();
            for (const item of this.items) {
                print(`${item.name} - ${item.value} GP`);
            }
        }).addAction(
            'buy', actions.buy
        ).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
            };
        })
    },

    farm_wife(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'farm wife',
            items: [],
            max_hp: 12,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer && !this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("You shall regret this, Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true
            }
        });
    },

    clubman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'clubman',
            items: [getItem('club'), getItem('gold', 5)],
            max_hp: 21,
            blunt_damage: 7,
            coordination: 2,
            agility: 1,
            weapon: getItem('club'),
            description: 'clubman',
            alignment: 'clubmen clan',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("Duuuu... Ummmmmm... How me I forget to breathe...");
        });
    },

    wandering_clubman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'clubman',
            items: [getItem('club'), getItem('gold', 5)],
            max_hp: 21,
            blunt_damage: 7,
            coordination: 2,
            agility: 1,
            weapon: getItem('club'),
            description: 'clubman',
            alignment: 'clubmen clan',
            pronouns: pronouns.male,
            ...args
        }).dialog(async function (player: Character) {
            print("Duuuu... Ummmmmm... How me I forget to breathe...");
        }).onTurn(
            actions.wander({ bounds: [] })
        );
    },

    rush_lurker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rush lurker',
            items: [getItem('gold', 10)],
            max_hp: 31,
            blunt_damage: 8,
            sharp_damage: 3,
            coordination: 3,
            agility: 2,
            weaponName: 'claws',
            weaponType: 'slice',
            description: 'rush lurker',
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    swordsman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'swordsman',
            items: [getItem('shortsword'), getItem('gold', 5)],
            max_hp: 72,
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
            aliases: ['forester'],
            items: [getItem('wooden_stick'), getItem('gold', 8)],
            max_hp: 50,
            blunt_damage: 20,
            sharp_damage: 0,
            coordination: 5,
            agility: 2,
            weapon: getItem('wooden_stick'),
            description: 'evil forester',
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            ...args
        });
    },

    dirty_thief(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dirty thief',
            aliases: ['thief'],
            items: [getItem('dagger'), getItem('gold', 6)],
            max_hp: 52,
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
            name: 'fat merchant-thief',
            items: [getItem('whip'), getItem('gold', 20)],
            aliases: ['fat merchant', 'merchant-thief', 'merchant', 'thief'],
            max_hp: 61,
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
            aliases: ['thief'],
            items: [getItem('flail'), getItem('gold', 7)],
            max_hp: 82,
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
            max_hp: 115,
            blunt_damage: 20,
            sharp_damage: 10,
            coordination: 3,
            agility: 5,
            weapon: getItem('hand_axe'),
            description: 'dark rider',
            blunt_armor: 3,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            ...args
        });
    },

    fine_gentleman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'fine gentleman',
            aliases: ['gentleman'],
            items: [getItem('rapier'), getItem('gold', 26)],
            max_hp: 103,
            blunt_damage: 0,
            sharp_damage: 16,
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
            name: 'little goblin thief',
            aliases: ['goblin thief', 'goblin', 'thief'],
            items: [getItem('metal_bar'), getItem('gold', 6)],
            max_hp: 100,
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
            aliases: ['amazon', 'orc'],
            items: [getItem('claymoore'), getItem('gold', 17)],
            max_hp: 250,
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
            aliases: ['behemoth', 'orc'],
            pronouns: pronouns.male,
            items: [getItem('mighty_warhammer')],
            max_hp: 300,
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
            max_hp: 100,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer && !this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("You shal regret this, Ierdale has turned against you!");
                this.game.player.flags.enemy_of_ierdale = true;
            }
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] }));
    },

    rock_hydra(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rock hydra',
            aliases: ['hydra'],
            items: [getItem('gold', 29)],
            max_hp: 200,
            blunt_damage: 60,
            sharp_damage: 5,
            weaponName: 'his heads',
            description: 'Hydra',
            blunt_armor: 5,
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            ...args
        });
    },

    nightmare(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'nightmare',
            items: [getItem('gold', 50), getItem('longsword')],
            max_hp: 450,
            blunt_damage: 112,
            sharp_damage: 21,
            weapon: getItem('longsword'),
            description: 'nightmare',
            coordination: 9,
            agility: 5,
            blunt_armor: 28,
            attackPlayer: true,
            alignment: 'evil',
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
            max_hp: 490,
            blunt_damage: 56,
            sharp_damage: 20,
            weapon: getItem('hardened_club'),
            description: 'mogrim',
            coordination: 5,
            agility: 3,
            blunt_armor: 36,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
            ...args
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 30;
        })
    },

    reaper(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'reaper',
            items: [getItem('scythe'), getItem('gold', Math.random() * 50)],
            max_hp: 150,
            blunt_damage: 0,
            sharp_damage: 250,
            weapon: getItem('scythe'),
            description: 'reaper',
            coordination: 55,
            agility: 25,
            blunt_armor: 0,
            pronouns: pronouns.inhuman,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 50;
        })
    },

    goblin_hero(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin hero',
            items: [getItem('jagged_polearm'), getItem('gold', Math.random() * 56 + 1)],
            max_hp: 230,
            blunt_damage: 120,
            sharp_damage: 70,
            weapon: getItem('jagged_polearm'),
            description: 'goblin hero',
            coordination: 12,
            agility: 4,
            blunt_armor: 26,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            ...args
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 56 + 1;
        })
    },

    stone_golem(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'stone golem',
            items: [getItem('warhammer'), getItem('gold', 19)],
            max_hp: 120,
            blunt_damage: 45,
            sharp_damage: 15,
            weapon: getItem('warhammer'),
            description: 'Huge stone golem',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
            ...args
        });
    },

    wood_troll(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wood troll',
            pronouns: pronouns.male,
            items: [getItem('club')],
            max_hp: 250,
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
            actions.wander({})
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
            max_hp: 400,
            blunt_damage: 75,
            sharp_damage: 100,
            magic_level: 200,
            weapon: getItem('axe_of_the_cat'),
            description: 'cat woman',
            coordination: 20,
            agility: 15,
            blunt_armor: 25,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            spellChance: () => Math.random() < 1 / 5,
            respawn: false,
            ...args
        }).fightMove(actions.max_heal)
    },

    megara(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'megara',
            pronouns: pronouns.inhuman,
            items: [getItem('megarian_club'), getItem('gold', 50)],
            max_hp: 300,
            blunt_damage: 200,
            sharp_damage: 10,
            weapon: getItem('megarian_club'),
            description: 'megara',
            coordination: 10,
            agility: 0,
            blunt_armor: 50,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    cow(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cow',
            items: [getItem('side_of_meat')],
            max_hp: 51,
            blunt_damage: 4,
            sharp_damage: 4,
            weaponName: 'horns',
            weaponType: 'stab',
            description: 'cow',
            coordination: 3,
            agility: 0,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            ...args
        }).onDeath(async function (cause: Character) {
            if (cause.isPlayer) {
                color(brightblue);
                print("Yea, you killed a cow!  good job");
            }
        }).fightMove(async function () {
            if (this.attackTarget?.isPlayer) {
                color(magenta)
                print('Moooooo!')
            }
        })
    },

    bull(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bull',
            pronouns: pronouns.male,
            items: [getItem('side_of_meat')],
            max_hp: 55,
            blunt_damage: 8,
            sharp_damage: 5,
            weaponName: 'horns',
            weaponType: 'stab',
            description: 'bull',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    jury_member(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'jury member',
            items: [getItem('gold', 1)],
            max_hp: 20,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("Murder in our own COURT!");
                this.game.player.flags.enemy_of_ierdale = true
                this.game.player.flags.murders += 1
            }
        });
    },

    peasant_elder(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant elder',
            pronouns: pronouns.female,
            items: [getItem('magic_ring')],
            respawn: false,
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
                    await this.die(player);
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
            max_hp: 210,
            blunt_damage: 31,
            sharp_damage: 57,
            weapon: getItem('pitchfork'),
            description: 'scarecrow gaurd',
            coordination: 4,
            agility: 3,
            blunt_armor: 6,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            ...args
        });
    },

    scarecrow_worker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'scarecrow worker',
            items: [getItem('pitchfork')],
            max_hp: 130,
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
            max_hp: 260,
            blunt_damage: 43,
            sharp_damage: 75,
            weapon: getItem('golden_pitchfork'),
            description: 'scarecrow king',
            coordination: 5,
            agility: 3,
            blunt_armor: 12,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            respawn: false,
            ...args
        });
    },

    grocer(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grocer',
            pronouns: pronouns.male,
            items: [
                getItem('banana'),
                getItem('side_of_meat'),
                getItem('chicken_leg'),
                getItem('satchel_of_peas'),
                getItem('full_ration'),
                getItem('ear_of_corn'),
                getItem('flask_of_wine'),
                getItem('keg_of_wine')
            ],
            ...args
        }).dialog(async function (player: Character) {
            print("Please ignore my bag boy.  He scares away the majority of our customers.");
            print("Unfortunatley he's my grandson and I can't really fire him.");
            print("If you aren't scared off, please be my guest and read the sign to see what");
            print("we have to offer you.");
        }).onAttack(
            actions.pish2
        ).addAction('buy', actions.buy);
    },

    old_woman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'old woman',
            pronouns: pronouns.female,
            max_hp: 1000,
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

    blobin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Blobin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            description: 'N',
            max_hp: 6000,
            agility: 10000,
            blunt_armor: 1000,
            respawn: false,
            alignment: 'orc',
            ...args
        }).dialog(async function (player: Character) {
            if (!this.game.flags.biadon) {
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
                        print("These soldiers will accompany you in your battle.");
                        print("Is this ok? [y/n]");
                        if (await getKey(['y', 'n']) == "y") {
                            this.game.player.flags.enemy_of_ierdale = true
                            const soldiers = [
                                this.game.addCharacter('orc_amazon', this.location!),
                                this.game.addCharacter('orc_behemoth', this.location!),
                                this.game.addCharacter('orc_behemoth', this.location!),
                                this.game.addCharacter('gryphon', this.location!)
                            ].filter(c => c) as Character[];
                            soldiers.forEach(soldier => soldier.following = player.name);
                            print("Here, take these soldiers and this gryphon on your way.");
                            print("Good luck and remeber you must kill EVERY LAST soldier and general in Ierdale.");
                        } else {
                            print("Fine, if you can do it on your own, good luck.");
                            print("Just remember you must kill EVERY LAST soldier and general in Ierdale.");
                        }
                        print()
                        print("Bring me Arach's sword to prove that it's done.")
                        this.game.flags.orc_mission = true;
                    } else {
                        print("Fine, but you won't get that ring without me telling you!");
                        print("KAHAHAHAHAEHEHEHEHEHEAHAHAHAHAOHOHOHOH!");
                    }
                } else {
                    const arach = this.game.find_character('colonel arach')
                    if (arach && !arach.dead) {
                        print("You must kill ALL the soldiers and generals in Ierdale before I tell you my");
                        print("secret.");
                        print("NOW GET BACK TO BATTLE!");
                    }
                    print("Congradulations!  You have defeated the entire army of Ierdale. That will show");
                    print("thoes dirty HUMAN BASTARDS!");
                    print("I will now tell you the Vital secret.");
                    await pause(5.5);
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
                                console.log('Character Ieadon not found.')
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
                            ieadon.relocate(this.location);
                            ieadon.fight(player);
                        }
                    }
                    this.location?.addCharacter(getCharacter('gryphon', this.game).onDeath(soldierDown));
                    this.location?.addCharacter(getCharacter('orc_behemoth', this.game).onDeath(soldierDown));
                    this.location?.addCharacter(getCharacter('orc_behemoth', this.game).onDeath(soldierDown));
                    this.location?.addCharacter(getCharacter('orc_amazon', this.game).onDeath(soldierDown));
                    (player as Player).disableCommands(['save'], 'no.')
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
            max_hp: 35,
            coordination: 3,
            agility: 2,
            blunt_damage: 5,
            sharp_damage: 0,
            weapon: getItem('fist'),
            ...args
        }).dialog(async function (player: Character) {
            print("Hmmmmfff...");
            if (!player.has('gold', 10)) return;
            print("Do you have 10gp spare change? [y/n]");
            if (await getKey(['y', 'n']) == "n") {
                print("Hmmfff... Thanks a lot...");
            } else {
                color(yellow);
                player.removeItem('gold', 10)
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
        }).onTurn(actions.wander({ bounds: [] }));
    },

    cleric_tendant(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cleric tendant',
            pronouns: pronouns.male,
            agility: 2,
            max_hp: 100,
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
            eldfarl.fight(attacker);
        }).addAction('train healing', actions.train({
            skillName: 'healing',
            requirements: (player: Character) => ({
                gold: 20 + player._healing * 5 / 8,
                xp: 30 + 15 * player._healing
            }),
            classDiscount: {
                'cleric': 50,
            },
            result: (player: Character) => {
                player.healing += 1;
                print(`Your healing capabilitys Improved.  Congradulations, you now heal by: ${player._healing}`);
            }
        })).addAction('train archery', actions.train({
            skillName: 'archery',
            requirements: (player: Character) => ({
                gold: 10 + player._archery / 4,
                xp: 15 + 8 * player._archery
            }),
            classDiscount: {
                'cleric': 25,
                'thief': 50
            },
            result: (player: Character) => {
                player.archery += 1;
                print(`Your archery skills improved.  Congradulations, you now have Archery: ${player._archery}`);
            }
        })).addAction('train mindfulness', actions.train({
            skillName: 'mindfulness',
            requirements: (player: Character) => ({
                gold: 30 + 10 * player._max_mp / 50,
                xp: 4 * player._max_mp
            }),
            classDiscount: {
                'spellcaster': 30,
                'cleric': 25
            },
            result: (player: Character) => {
                player.max_mp += 5;
                print(`Your Mind Improved. Congradulations, your Boerdom Points are now: ${player._max_mp}`);
            }
        })).addAction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        });
    },

    blind_hermit(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'blind hermit',
            pronouns: pronouns.male,
            agility: 1,
            max_hp: 30,
            description: 'blind hermit',
            aliases: ['hermit'],
            ...args
        }).dialog(async function (player: Character) {
            print("'The sight of a blind man probes beyond visual perceptions'");
            print("           - Vershi, tempest shaman");
            print();
            await pause(4);
            print("Hey, whats up?");
            print("Though I am blind I may see things you do not.");
            print("I am in desperate need of the head of Mythin the forester.  He is a traitor");
            print("to Ierdale and deserves no other fate than death.  If you could tell me the");
            print("whereabouts of Mythin this would be yours.");
            color(blue);
            await pause(6);
            print("<blind hermit reveals 10000gp>");
            await pause(3);
            color(black);
            print("Take it or leave it? [y/n]");
            if (await getKey(['y', 'n']) == "y") {
                color(blue);
                print("<Something moves in the shadows>");
                print("<blind hermit turns twords you:>");
                await pause(4);
                color(black);
                print("Mythin,");
                print("He is the one, kill him");
                await pause(4);
                color(blue);
                print("<Mythin leaps from the shadows and just as you see him, you feel cold steel>");
                print("<in your chest>");
                await pause(3);
                print("MYTHIN:", 1);
                color(black);
                print("The dark lord has naught a chance now that the one is dead");
                print("A normal human would not take such a risky bribe.");
                await pause(7);
                await player.die(this.game.find_character('Mythin'));
            } else {
                print("Fine, but 10000gp will cover most any expense");
                print();
                if (!player.has('list')) {
                    print("Though I rarely trouble myself in the affairs of man, take these for I fear");
                    print("your future is un-eventful without them.");
                    color(blue);
                    print("<recieved a list>");
                    print("<recieved an amber chunk>");
                    player.giveItem(getItem('list'));
                    player.giveItem(getItem('amber_chunk'));
                }
            }
        }).onAttack(actions.pish2);
    },

    butcher(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'butcher',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 1000,
            sharp_damage: 20,
            blunt_damage: 20,
            blunt_armor: 20,
            agility: 100,
            coordination: 10,
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
            max_hp: 32,
            blunt_damage: 2,
            sharp_damage: 10,
            weaponName: 'fangs',
            weaponType: 'stab',
            coordination: 6,
            agility: 4,
            description: 'poisonus adder',
            alignment: 'evil',
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
            max_hp: 61,
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
            await pause(2);
            print("aarrr... get off my bridge!");
            this.fight(player);
        });
    },

    swamp_thing(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'swamp thing',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 46,
            blunt_damage: 15,
            sharp_damage: 1,
            coordination: 4,
            agility: 1,
            weaponName: 'whip-like fingers',
            description: 'swamp thing',
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    dryad(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dryad',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 130,
            blunt_damage: 12,
            sharp_damage: 5,
            coordination: 3,
            agility: 1,
            weaponName: 'trunkish arms',
            description: 'dryad',
            ...args
        });
    },

    goblin_solider(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin solider',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 21,
            blunt_damage: 15,
            sharp_damage: 3,
            coordination: 2,
            agility: 4,
            weapon: getItem('wooden_stick'),
            items: [getItem('gold', 3), getItem('wooden_stick')],
            description: 'evil looking goblin',
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    goblin_captain(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'goblin captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 48,
            blunt_damage: 29,
            sharp_damage: 10,
            weapon: getItem('broadsword'),
            items: [getItem('gold', 9), getItem('broadsword')],
            description: 'horifying goblin captain',
            blunt_armor: 9,
            agility: 3,
            coordination: 2,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        })
    },

    security_guard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'security guard',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 35,
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
                print("The guard captain wants to see you! Report to the security office, please!");
            } else if (this.game.flags.ieadon || !this.game.flags.ziatos) {
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
            color(red)
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
            max_hp: 1,
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
            print("Eldfarl picked me to mentor him because I am the BEST!!!  Way better than you!");
            print("Go away, you're breathing on me, EWWW FAT SLOB!");
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer && !this.game.player.flags.enemy_of_ierdale) {
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
            max_hp: 150,
            blunt_damage: 65,
            sharp_damage: 30,
            weapon: getItem('silver_sword'),
            items: [getItem('silver_sword'), getItem('gold', 15)],
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
            max_hp: 450,
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
            max_hp: 45,
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
            max_hp: 5,
            blunt_damage: 2,
            sharp_damage: 0,
            coordination: 1,
            agility: 3,
            weaponName: 'beak',
            weaponType: 'stab',
            items: [getItem('chicken_leg')],
            description: 'clucking hen',
            ...args
        });
    },

    large_rooster(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'large rooster',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 5,
            blunt_damage: 7,
            sharp_damage: 2,
            weaponName: 'claws',
            weaponType: 'slice',
            items: [getItem('chicken_leg')],
            description: 'furious rooster',
            coordination: 4,
            agility: 2,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        });
    },

    chief_judge(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'chief judge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 30,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("Murder in our own COURT!");
                this.game.player.flags.murders += 1
                this.game.player.flags.enemy_of_ierdale = true
            }
        });
    },

    elite_guard(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'elite guard',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 50,
            blunt_damage: 22,
            sharp_damage: 10,
            weapon: getItem('broadsword'),
            items: [getItem('broadsword'), getItem('gold', 6)],
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer && !this.game.player.flags.enemy_of_ierdale) {
                color(red)
                print('Ierdale has turned against you!')
                this.game.player.flags.enemy_of_ierdale = true
            }
        })
    },

    dreaugar_dwarf(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dreaugar dwarf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 175,
            blunt_damage: 90,
            sharp_damage: 10,
            weapon: getItem('axe'),
            items: [getItem('gold', Math.random() * 15 + 1), getItem('axe')],
            description: 'evil dwarf',
            coordination: 8,
            agility: 5,
            blunt_armor: 20,
            attackPlayer: true,
            alignment: 'evil',
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
            name: 'Orkin the animal trainer',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 220,
            blunt_damage: 20,
            sharp_damage: 10,
            weapon: getItem('fist'),
            items: [getItem('gold', 43)],
            description: 'orkin and his animals',
            coordination: 2,
            agility: 1,
            blunt_armor: 10,
            aliases: ['orkin'],
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Echoo Dakeee??  Wul you like to buy some any-mas!");
        }).fightMove(async function () {
            print('TODO: animals')
        });
    },

    lion(args: { [key: string]: any }) {
        const gender = randomChoice(['male', 'female']) as keyof typeof pronouns;
        return new A2dCharacter({
            name: gender == 'male' ? 'lion' : 'lioness',
            pronouns: gender == 'male' ? pronouns.male : pronouns.female,
            max_hp: 155,
            blunt_damage: 12,
            sharp_damage: 30,
            weaponName: 'claws',
            weaponType: 'slice',
            description: 'Lion',
            coordination: 5,
            agility: 6,
            blunt_armor: 2,
            magic_level: 6,
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
            max_hp: 500,
            magic_damage: 20,
            weaponName: 'high pitched screech',
            weaponType: 'sonic',
            description: 'mutant bat',
            coordination: 40,
            agility: 5,
            blunt_armor: 25,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                this.location?.addCharacter(getCharacter(
                    'mutant_bat', this.game, { respawn: false, persist: false }
                ).onTurn(
                    async function () { await this.die() }
                ));
            }
        });
    },

    kobalt_captain(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'kobalt captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 240,
            blunt_damage: 10,
            sharp_damage: 30,
            weapon: getItem('spear'),
            items: [getItem('gold', 12), getItem('spear')],
            description: 'captain',
            coordination: 4,
            agility: 2,
            blunt_armor: 13,
            attackPlayer: true,
            alignment: 'evil',
            ...args
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                color(magenta);
                print("Kobalt Captain calls for reinforcements!");
                this.location?.addCharacter(getCharacter('kobalt_soldier', this.game));
            }
        });
    },

    kobalt_soldier(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'kobalt soldier',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 50,
            blunt_damage: 15,
            sharp_damage: 5,
            weaponName: 'mace',
            items: [getItem('gold', 5), getItem('mace')],
            description: 'kobalt soldier',
            coordination: 2,
            agility: 3,
            blunt_armor: 5,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
            persist: false,
            ...args
        }).onTurn(async function () { await this.die() })
    },

    bow_maker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'bow maker',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 65,
            blunt_damage: 20,
            sharp_damage: 20,
            weapon: getItem('ballista_bolt'),
            description: 'bow fletcher',
            coordination: 2,
            blunt_armor: 10,
            ...args
        }).dialog(async function (player: Character) {
            print("Hi, want some arrows... OR BOWS!");
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("This is MURDER! The guards will have your head for this!");
                this.game.player.flags.enemy_of_ierdale = true;
                this.game.player.flags.murders += 1
            }
        });
    },

    peasant_man(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant man',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 100,
            sharp_damage: 25,
            weaponName: 'cudgel',
            items: [getItem('cudgel'), getItem('gold', 3)],
            description: 'peasant man',
            coordination: 2,
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
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("This is MURDER! The guards will have your head for this!");
                this.game.player.flags.enemy_of_ierdale = true;
                this.game.player.flags.murders += 1
            }
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] }));
    },

    peasant_woman(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant woman',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 90,
            blunt_damage: 0,
            sharp_damage: 15,
            weaponName: 'pocket knife',
            weaponType: 'slice',
            description: 'peasant woman',
            coordination: 2,
            blunt_armor: 3,
            aliases: ['peasant'],
            ...args
        }).dialog(async function (player: Character) {
            print("Excuse me I need to get to my work.");
            print();
            print("Whats that you say??? Interested in rings?  I heard one is in the mountains.");
            print("Floated by my ear also that it was guarded by some strange beast... Henge???");
            print("Now excuse me, must work work work.");
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("This is MURDER! The guards will have your head for this!");
                this.game.player.flags.enemy_of_ierdale = true;
                this.game.player.flags.murders += 1
            }
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] }));
    },

    dog(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'dog',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 45,
            blunt_damage: 10,
            sharp_damage: 15,
            weaponName: 'teeth',
            weaponType: 'teeth',
            description: 'yapping dog',
            coordination: 2,
            agility: 2,
            blunt_armor: 4,
            alignment: 'wander',
            ...args
        }).dialog(async function (player: Character) {
            print("BOW WOW WOW!");
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse'] }))
    },

    peasant_child(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant child',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            ...args
        }).onAttack(async function (character: Character) {
            console.log(this.name, 'onAttack')
            if (character.isPlayer) {
                const player = character as Player
                print("YOU DUMB CRAP!")
                print("You want to kill a poor helpless little KID?")
                if (await getKey(['y', 'n']) == "n") {
                    print("The devilish side of you regrets that decision.")
                    const evil_you = new A2dCharacter({
                        name: `evil ${player.name}`,
                        pronouns: player.pronouns,
                        max_hp: player.hp,
                        weapon: player.equipment['right hand'] || getItem('fist'),
                        blunt_damage: player.strength * (player.equipment['right hand']?.weapon_stats?.blunt_damage || 0),
                        sharp_damage: player.strength * (player.equipment['right hand']?.weapon_stats?.sharp_damage || 0),
                        magic_damage: (player.strength + player.magic_level) * (player.equipment['right hand']?.weapon_stats?.magic_damage || 0),
                        blunt_armor: player.blunt_armor,
                        sharp_armor: player.sharp_armor,
                        magic_armor: player.magic_armor,
                        coordination: player.coordination,
                        agility: player.agility,
                        strength: player.strength,
                        magic_level: player.healing,
                        game: player.game,
                        respawn: false,
                        persist: false
                    })
                    evil_you.fightMove(actions.heal)
                    await evil_you.relocate(this.location)
                    evil_you.fight(player)
                    player.fight(evil_you)
                    player.enemies = player.enemies.filter(e => e != this.name)
                    this.fight(null)
                } else {
                    print("Now you will be punished!")
                    print()
                    print()
                    print("ULTIMATE POWERMAXOUT SWEEPS FORTH FROM THE FURIOUS FINGERS OF LARS!")
                    print("YOU WRITHE IN AGONY AS IT DRAINS THE LIFE COMPLETELY FROM YOU.")
                    print("YOU SMELL DEFEAT FULLY AND TERRIBLY AS YOU GO LIMPLY UNCONSIOUS")
                    print()
                    print(" LET THIS BE A LESSON TO YOU!!!!!!!!!")
                    await player.die('Lars')
                }
            }
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] }));
    },

    peasant_worker(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'peasant worker',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 190,
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
        }).onTurn(
            actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] })
        ).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("This is MURDER! The guards will have your head for this!");
                this.game.player.flags.enemy_of_ierdale = true;
                this.game.player.flags.murders += 1
            }
        });
    },

    ieadon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Ieadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 1000,
            blunt_damage: 2000,
            sharp_damage: 2000,
            magic_damage: 300,
            hp_recharge: 0.01, // he won't heal right away
            weapon: getItem('glory_blade'),
            items: [getItem('gold', 1000), getItem('glory_blade'), getItem('ring_of_ultimate_power')],
            description: 'the ledgendary Ieadon',
            coordination: 35,
            agility: 15,
            blunt_armor: 100,
            magic_armor: 100,
            sharp_armor: 100,
            magic_level: 20,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("I am the most renound fighter in all the Land.");
            print("Have you heard about thoes rings, thats a PITY!");
            print("**Ieadon grins**");
        }).fightMove(async function () {
            if (Math.random() < 1 / 4) {
                print('TODO: ring ultimate power')
            }
        }).addAction('train strength', actions.train({
            skillName: 'strength',
            requirements: (player: Character) => ({
                xp: 80 + 25 * player._strength,
                gold: 25 + 5 * Math.floor(player._strength / 5)
            }),
            classDiscount: { 'fighter': 50, 'thief': 25 },
            result: (player: Character) => {
                player.strength += 1;
                if (player.isPlayer) print(`Your raw fighting POWER increased.  Congradulations, your Attack is now: ${player._strength}`);
            }
        })).addAction('train stamina', actions.train({
            skillName: 'stamina',
            requirements: (player: Character) => ({
                xp: 2 * player._max_sp,
                gold: 15 + 5 * Math.floor(player._max_sp / 50)
            }),
            classDiscount: { 'fighter': 25, 'cleric': 25 },
            result: (player: Character) => {
                player.max_sp += 5;
                if (player.isPlayer) print(`Your Stamina improved.  Congradulations, it is now: ${player._max_sp}`);
            }
        })).addAction('train toughness', actions.train({
            skillName: 'toughness',
            requirements: (player: Character) => ({
                xp: 2 * player._max_hp,
                gold: 30 + 10 * Math.floor(player._max_hp / 50)
            }),
            classDiscount: { 'fighter': 25 },
            result: (player: Character) => {
                player.max_hp += 5;
                if (player.isPlayer) print(`Your toughness increased.  Congradulations your Hit Points are now: ${player._max_hp}`);
            }
        })).onDeath(async function (player) {
            // win
            if (player.isPlayer) {
                // they can save again
                player.enableCommands(['save'])
                // and then we should probably say something about how well they did
                print("Ieadon is defeated, and the new holder of the ultimate ring is... you!")
            } else {
                // very unexpectedly, Ieadon died but the player didn't do it
            }
        }).addAction('list', async function () {
            color(black);
            print("At the domain of Ieadon we teach the following:");
            print(" train toughness   | increaces HP");
            print(" train strength    | increases attack damage");
            print(" train stamina     | increases SP");
            print(" To train any of these, please type 'train' then");
            print(" type what to train.");
        }).addAction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        })
    },

    mythin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Mythin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 550,
            blunt_damage: 40,
            sharp_damage: 120,
            magic_damage: 40,
            weapon: getItem('psionic_dagger', { name: 'glowing dagger' }),
            items: [getItem('psionic_dagger'), getItem('gold', 300)],
            description: 'the outcast Mythin',
            coordination: 25,
            agility: 25,
            blunt_armor: 30,
            respawn: false,
            flags: { 'gave_directions': false, 'met_biadon': false },
            spellChance: () => Math.random() < 3 / 5,
            magic_level: 50,
            ...args
        }).dialog(async function (player: Character) {
            if (!this.flags.gave_directions) {
                print("Since you have been able to get here, I will tell you directions");
                print("on how to get here again...");
                print("When you first enter this forest, go west until you come to a large rock.");
                print("then go south twice to reach me.  So these would be the exact directions:");
                print("Enter forest, west, west, west, west, south (there is an evil forester");
                print("here, I keep telling him he disturbs business but he doesn't listen), south.");
                print();
                print("The directions out are the exact oposite (n,n,e,e,e,e). Then you will be at");
                print("the entrance to the forest.  (Area #112)Go south once more to exit.");
            } else if (this.game.flags.biadon && !this.flags.met_biadon) {
                print("I have no idea who this guy is. He just showed up out of the bushes, and");
                print("he can't stop laughing.")
                this.flags.met_biadon = true
            } else {
                print("Hello, have you come to learn? Type \"list\" to see what I can teach you.");
            }
        }).addAction('train coordination', actions.train({
            skillName: 'coordination',
            requirements: (player) => ({
                xp: 100 + 150 * player._coordination,
                gold: 30 + 20 * player._coordination
            }),
            classDiscount: { 'thief': 25, 'fighter': 25 },
            result: (player) => {
                player.coordination += 1;
                if (player.isPlayer) print(`Your coordination increased.  Congradulations, it is now: ${player._coordination}`);
            }
        })).addAction('train agility', actions.train({
            skillName: 'agility',
            requirements: (player) => ({
                xp: 75 + 150 * player._agility,
                gold: 35 + 20 * player._agility
            }),
            classDiscount: { 'thief': 50 }, // thief specialty
            result: (player) => {
                player.agility += 1;
                if (player.isPlayer) print(`Your agility increased.  Congradulations, it is now: ${player._agility}`);
            }
        })).addAction('train offhand', actions.train({
            skillName: 'offhand',
            requirements: (player) => {
                const ambidextrous = player.offhand >= 1;
                if (ambidextrous && player.isPlayer) {
                    print("You are already fully ambidextrous.");
                }
                return {
                    xp: 300 + 200 * (1 - player.offhand),
                    gold: 35,
                    other: !ambidextrous
                }
            },
            classDiscount: { 'thief': 25, 'fighter': 25 },
            result: (player) => {
                player.offhand += Math.min(Math.floor(((1 - player.offhand) / 4) * 100 + 1.5) / 100, 1);
                if (player.isPlayer) print(`Your left-handed capabilities increased.  Congradulations, offhand is now: ${Math.floor(player.offhand * 100)}%`);
            }
        })).addAction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        }).addAction('list', async function () {
            color(black)
            print("At the domain of Mythin we teach the following:");
            print(" train coordination | increaces to-hit");
            print(" train agility      | decreases enemy to-hit");
            print(" train offhand      | increases left-hand weapon power");
            print(" To train any of these, please type 'train' then");
            print(" type what to train.");
        }).fightMove(actions.heal);
    },

    eldin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Eldin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 450,
            magic_damage: 180,
            weapon: getItem('lightning_staff'),
            items: [getItem('lightning_staff'), getItem('gold', 300), getItem('maple_leaf')],
            description: 'the mystical Eldin',
            coordination: 12,
            agility: 4,
            blunt_armor: 29,
            magic_armor: 100,
            sharp_armor: 35,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Hello, nice to have company!!!")
            if (player.has("clear liquid") && this.has("maple leaf")) {
                print();
                await pause(1);
                print("Whats that in your hand?");
                print("May I see it?");
                print("SHOW Eldin your clear liquid? [y/n]");
                if (await getKey(['y', 'n']) == "y") {
                    print("Hmmm...");
                    pause(3);
                    print("Suspicions confirmed, here you are.");
                    print("Oh, I collect maple leaves, are not they beautiful. Have one.");
                    this.transferItem('maple leaf', player);
                    color(blue);
                    print("<recieved maple leaf>");
                }
            } else {
                print("Please, I am slighty busy, please read");
                print("the sign, then come back to me!");
                print();
            }
        }).fightMove(async function () {
            if (Math.random() < 3 / 4) {
                print('TODO: powermaxout')
            }
        }).addAction('list', async function () {
            color(black)
            print("At the domain of Eldin we teach the following:")
            print(" train mindfulness | increaces BP")
            print(" train healing     | increases healing power")
            print(" train archery     | increases archery skills")
            print(" To train any of these, please type 'train' then")
            print(" type what to train.")
        }).addAction('train magic', actions.train({
            skillName: 'magic',
            requirements: (player) => ({
                xp: 160 + 50 * player._magic_level,
                gold: 50 + 10 * player._magic_level
            }),
            classDiscount: { 'spellcaster': 50 },
            result: (player) => {
                player.magic_level += 1;
                if (player.isPlayer) print(`Your magical abilities increased. Congradulations, your magic level is now: ${player._magic_level}`);
            }
        })).addAction('train newbie', actions.train({
            skillName: 'newbie',
            requirements: (player) => {
                const reqs = {
                    xp: 100 + 20 * (player.abilities['newbie'] || 0),
                    gold: 10 + 5 * (player.abilities['newbie'] || 0),
                }
                if (player.abilities['newbie'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['newbie'] = player.abilities['newbie'] ? player.abilities['newbie'] + 1 : 1;
                if (player.isPlayer) print(`Learned Newbie.  Congradulations, your skill is now: ${abilityLevels[player.abilities['newbie']]}`);
            }
        })).addAction('train bolt', actions.train({
            skillName: 'bolt',
            requirements: (player) => {
                const reqs = {
                    xp: 375 + 125 * (player.abilities['bolt'] || 0),
                    gold: 40 + 20 * (player.abilities['bolt'] || 0),
                    magic_level: 3 + (player.abilities['bolt'] || 0)
                }
                if (player.abilities['bolt'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['bolt'] = player.abilities['bolt'] ? player.abilities['bolt'] + 1 : 1;
                if (player.isPlayer) print(`Learned Bolt.  Congradulations, your skill is now: ${abilityLevels[player.abilities['bolt']]}`);
            }
        })).addAction('train fire', actions.train({
            skillName: 'fire',
            requirements: (player) => {
                const reqs = {
                    xp: 700 + 250 * (player.abilities['fire'] || 0),
                    gold: 75 + 25 * (player.abilities['fire'] || 0),
                    magic_level: 6 + 2 * (player.abilities['fire'] || 0)
                }
                if (player.abilities['fire'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['fire'] = player.abilities['fire'] ? player.abilities['fire'] + 1 : 1;
                if (player.isPlayer) print(`Learned Fire.  Congradulations, your skill is now: ${abilityLevels[player.abilities['fire']]}`);
            }
        })).addAction('train blades', actions.train({
            skillName: 'blades',
            requirements: (player) => {
                const reqs = {
                    xp: 1200 + 400 * (player.abilities['blades'] || 0),
                    gold: 80 + 30 * (player.abilities['blades'] || 0),
                    magic_level: 10 + 3 * (player.abilities['blades'] || 0)
                }
                if (player.abilities['blades'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['blades'] = player.abilities['blades'] ? player.abilities['blades'] + 1 : 1;
                if (player.isPlayer) print(`Learned Blades.  Congradulations, your skill is now: ${abilityLevels[player.abilities['blades']]}`);
            }
        })).addAction('train powermaxout', actions.train({
            skillName: 'powermaxout',
            requirements: (player) => {
                const reqs = {
                    xp: 2000 + 1000 * (player.abilities['powermaxout'] || 0),
                    gold: 150 + 50 * (player.abilities['powermaxout'] || 0),
                    magic_level: 20 + 4 * (player.abilities['powermaxout'] || 0)
                }
                if (player.abilities['powermaxout'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['powermaxout'] = player.abilities['powermaxout'] ? player.abilities['powermaxout'] + 1 : 1;
                if (player.isPlayer) print(`Learned Powermaxout.  Congradulations, your skill is now: ${abilityLevels[player.abilities['powermaxout']]}`);
            }
        })).addAction('train shield', actions.train({
            skillName: 'shield',
            requirements: (player) => {
                const reqs = {
                    xp: 300 + 150 * (player.abilities['shield'] || 0),
                    gold: 50 + 20 * (player.abilities['shield'] || 0),
                }
                if (player.abilities['shield'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30 },
            result: (player) => {
                player.abilities['shield'] = player.abilities['shield'] ? player.abilities['shield'] + 1 : 1;
                if (player.isPlayer) print(`Learned Shield.  Congradulations, your skill is now: ${abilityLevels[player.abilities['shield']]}`);
            }
        })).addAction('train bloodlust', actions.train({
            skillName: 'bloodlust',
            requirements: (player) => {
                const reqs = {
                    xp: 300 + 150 * (player.abilities['bloodlust'] || 0),
                    gold: 50 + 20 * (player.abilities['bloodlust'] || 0),
                }
                if (player.abilities['bloodlust'] >= 7) {
                    if (player.isPlayer) print("You have already mastered that spell.");
                    Object.assign(reqs, { other: false });
                }
                return reqs;
            },
            classDiscount: { 'spellcaster': 30, 'fighter': 25 },
            result: (player) => {
                player.abilities['bloodlust'] = player.abilities['bloodlust'] ? player.abilities['bloodlust'] + 1 : 1;
                if (player.isPlayer) print(`Learned Bloodlust.  Congradulations, your skill is now: ${abilityLevels[player.abilities['bloodlust']]}`);
            }
        })).addAction('list', async function () {
            print("At the Cottage of Eldin we teach the following:");
            print(" train newbie        | basic attack spell, low requirements");
            print(" train bolt          | heat-seeking lightning bolt");
            print(" train bloodlust     | increase strength for a short time");
            print(" train shield        | a temporary shield protects you from attacks");
            print(" train trance        | teaches trance spell (todo)");
            print(" train flex          | teaches flex spell (todo)");
            print(" train fire          | a blast of magical flame roasts your enemies");
            print(" train blades        | cut your enemies to pieces with magical knives");
            print(" train vanish        | become invisible! (todo)");
            color(yellow)
            print(" train powermaxout   | put all your magic into a single overwhelming blast");
            color(blue)
            print(" train conjure       | pull useful items out of thin air (todo)");
            color(black)
            print(" train magic         | increases magical power, enhances all spells");
            print(" To see info on a spell type 'info [spellname]'");
        }).addAction('transport', async function (player) {
            print("Goodbye!")
            await pause(1)
            player.relocate(this.game.find_location("Eldin's house"))
        }).addAction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        })
    },

    eldfarl(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Eldfarl',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 450,
            blunt_damage: 90,
            sharp_damage: 0,
            weaponName: 'fist',
            items: [getItem('gold', 400)],
            description: 'the respected Eldfarl',
            coordination: 12,
            agility: 4,
            blunt_armor: 29,
            magic_level: 100,
            respawn: false,
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
        }).fightMove(
            actions.heal
        ).addAction('list', async function (player) {
            print("There are no classes offered here.")
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- Go south, that's where the classes are.");
            }
        }).addAction('train', async function (player) {
            print("There are no classes offered here.")
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- Go south, that's where the classes are.");
            }
        }).addAction('healme', async function (player) {
            print("Eldfarl lifts his hands and a remakably calm feeling floats over your body.")
            print(`Eldfarl healed you ${Math.floor(player.max_hp - player.hp)} HP.`)
            player.hp = player.max_hp
        })
    },

    turlin(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Turlin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 250,
            blunt_damage: 60,
            sharp_damage: 0,
            weaponName: 'huge fists',
            items: [getItem('ring_of_nature')],
            description: 'Turlin',
            blunt_armor: 4,
            coordination: 3,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
            ...args
        }).onDeath(async function () {
            color(green);
            print("Defeated, the beast Turlin falls from the platform, crashing into the forest");
            print("canopy far below.");
            pause(2)
            print("He leaves behind just one small item...");
            await pause(3);
        }).addAction('climb down', async function (player: Character) {
            print("As you grasp for the upper rungs of the ladder, you see something from the")
            print("corner of your eye.")
            await pause(2)
            print("It's Turlin, lunging at you with a roar!")
            print("You try to put up your hands to defend yourself, only to realize - you were")
            print("holding the ladder with those.")
            await pause(5)
            print("You fall down...")
            for (let i = 0; i < 3; i++) {
                await pause(1)
                print("and down...")
            }
            player.hurt(200, 'the fall');
            if (player.isPlayer && !player.dead) (player as Player).checkHP();
        })
    },

    henge(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Henge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 320,
            blunt_damage: 50,
            sharp_damage: 40,
            weapon: getItem('longsword'),
            items: [getItem('gold', 25), getItem('longsword'), getItem('ring_of_stone')],
            description: 'Henge',
            blunt_armor: 10,
            sharp_armor: 50,
            coordination: 6,
            agility: 4,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
            exp: 650,
            ...args
        }).onEncounter(async function (player: Character) {
            if (player.isPlayer) {
                color(black)
                print("You stand before Henge, the king of the ogres.  20 feet tall, he looks down");
                print("on you like a snack left on his doorstep.  You feel your stomach drop.");
                await pause(5);
                print("His voice rumbles. \"Good,\" he says. \"I need bones to gind my teeth on.\"");
                print("He looks down on you with opal eyes.  His teeth are small boulders of quartz.");
                await pause(5);
                print("Behind you, the canyon wall closes.");
                this.location?.adjacent?.clear();
                await pause(2);
            }
        }).onDeath(async function () {
            this.game.flags.henge = true;
            const canyon1 = this.game.find_location(114)
            const canyon2 = this.game.find_location(114.1)
            const canyon3 = this.game.find_location(114.2)
            if (canyon1 && canyon2) {
                canyon1.description = '';
                canyon2.description = '';
                canyon3?.adjacent?.set('west', canyon2)
            }
        })
    },

    ziatos(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ziatos',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 750,
            magic_damage: 50,
            sharp_damage: 150,
            weapon: getItem('blade_of_time'),
            items: [getItem('blade_of_time'), getItem('gold', 125), getItem('ring_of_time')],
            description: 'Ziatos',
            coordination: 35,
            agility: 8,
            speed: 2,
            blunt_armor: 40,
            respawn: false,
            alignment: 'evil',
            ...args
        }).fightMove(async function () {
            print('TODO: time stop')
        }).onDeath(async function () {
            this.game.flags.ziatos = true;
            await pause(5)
            color(black, black)
            clear()
            await pause(2)
            color(black, white)
            print("You have defeated the holder of the 4th ring.")
            print()
            print("** Suddenly out of nowhere a fairy sprite apears**")
            // Play "o4fdadc"
            await pause(2)
            print("FAIRY SPRITE: Congradulations, I can give you one small hint as to the")
            print("location of the 5th and final ring, the ring of ultimate power.")
            print()
            print("     The ring is located in the Forest of Thieves.")
            print()
            print("I must go now.")
            this.game.player.flags.enemy_of_ierdale = false;
            this.game.addCharacter('biadon', 78)
            this.game.find_character('ieadon')?.relocate(this.game.find_location('the void'))
            await pause(15)
            color(black, black)
            clear()
            await pause(2)
            color(black, darkwhite)
            clear()
        });
    },

    official(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'official',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            items: [getItem('gold', 25), getItem('long_dagger')],
            description: 'orc official',
            max_hp: 200,
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
        }).fightMove(
            actions.heal
        ).addAction('pass', async function (player: Character) {
            if (!player.has('gold', 1000)) {
                color(gray); print("You cannot afford a pass here.");
                return;
            }
            color(blue);
            print("You purchase a pass to Grobin");
            color(black);
            print("You will no longer get attacked...");
            print();
            if (player.flags.orc_pass) print("I don't know why you wanted to go through this again but OK...");
            await pause(3);
            print("The official takes out a hot poker and ", 1);
            color(red);
            print("JAMS A FLAMING", 1);
            color(black);
            print(" rod into your shoulder.");
            await pause(5);
            print("You wince and scream, pain is shooting all over your body and you smell");
            print("burned flesh.");
            await pause(5);
            color(red);
            print("Ow...", 1); color(black); print(" Thats gota hurt");
            player.flags.orc_pass = true;
            player.removeItem('gold', 1000);
        });
    },

    wisp(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wisp',
            pronouns: { "subject": "It", "object": "it", "possessive": "its" },
            max_hp: 110,
            blunt_damage: 10,
            magic_damage: 150,
            weaponName: 'piercing scream',
            weaponType: 'sonic',
            description: 'wandering wisp',
            coordination: 100,
            agility: 10,
            blunt_armor: 100,
            sharp_armor: 100,
            alignment: 'evil',
            attackPlayer: true,
            ...args
        }).onTurn(
            actions.wander({ bounds: ['250', 'corroded gate'] })
        )
    },

    biadon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'Biadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 30000,
            blunt_damage: 10,
            sharp_damage: 0,
            weapon: getItem('fist'),
            description: 'evasive Biadon',
            coordination: 1,
            agility: 32000,
            blunt_armor: 32000,
            respawn: false,
            ...args
        }).dialog(async function (player: Character) {
            print("Hehehehehe.");
            print("Me, holding The Ring of Ultimate Power???  Kahahaha.");
            print("You poor fool, my BROTHER holds the ring!!!");
            pause((5));
            print("Can you figure out who he is?");
            print("KAKAKAKAKAKAKAKA");
            this.game.flags.biadon = true;
            this.game.player.flags.enemy_of_ierdale = false;
            const blobin = this.game.find_character('Blobin')
            const grogren = this.game.find_character('Grogren')
            const barracks = this.game.find_location('Orc Barracks')
            if (blobin && grogren && barracks) {
                await blobin.relocate(barracks)
                await grogren.relocate(barracks)
            } else if (!blobin) {
                console.log('Blobin not found')
            } else if (!grogren) {
                console.log('Grogren not found')
            } else if (!barracks) {
                console.log('Orc barracks not found')
            }
            this.game.addCharacter('orc_emissary', 197)
            const dispatches = [
                'center of town',
                'beet street',
                'north road',
                'south road',
                'east road',
                'west road',
                'alleyway',
                'northern gatehouse',
                'western gatehouse',
                'eastern gatehouse',
                "Ieadon's house",
            ]
            for (let i = 0; i < dispatches.length; i++) {
                const soldier = this.game.addCharacter('ierdale_soldier', 284)
                await soldier?.goto(dispatches[i])
            }
            for (let i = 0; i < 11; i++) {
                this.game.addCharacter('ierdale_patrol', 284)
            }
            this.game.addCharacter('security_guard', 'center of town')
            this.game.flags.soldier_dialogue = [
                "Something very serious has happened! Stay calm, but ARM YOURSELF TO THE TEETH! We need every fighter we can get.",
                `I've heard of you, ${player.name}. You're the one who defeated the ogre king. Maybe you can help us! Talk to the security guards.`,
                "Don't worry, citizen. We will defend Ierdale to our last breath!",
                "Look, I don't know if I should tell you this, but... I heard that Ieadon turned against Ierdale and is working with the orcs. If it's true, we're really in for it.",
                "Ierdale is under attack! We must prepare for the worst!",
                "I heard that the orcs are planning to attack tomorrow. I hope we survive.",
                "There's no way we can defeat Ieadon! Please do something!",
                "By the orders of General Kerry, we are to patrol and defend the town! No one gets in!",
                `It's good that you're here, ${player.name}. A strong ${player.class_name} like you could help us turn the tide in this fight.`,
                "We have been dispatched to counter the rising threat of invasion from the orcs!"
            ]
            this.game.addCharacter('general_gant', "Ierdale Barracks")
            this.game.addCharacter('general_kerry', "Ieadon's house")
            this.game.find_character('guard captain')?.goto('45')
        });
    },

    cyclops(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'cyclops',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 860,
            blunt_damage: 174,
            sharp_damage: 5,
            weaponName: 'uprooted tree',
            items: [],
            description: 'towering cyclops',
            coordination: 9,
            agility: -1,
            blunt_armor: 26,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
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
            max_hp: 1300,
            blunt_damage: 40,
            sharp_damage: 166,
            weaponName: "sharp claws",
            weaponType: "sword",
            items: [],
            description: 'fire-breathing dragon',
            coordination: 5,
            agility: -3,
            blunt_armor: 60,
            attackPlayer: true,
            alignment: 'evil',
            respawn: false,
            ...args
        }).fightMove(async function () {
            if (Math.random() < 1 / 2) {
                color(yellow)
                if (this.location?.playerPresent) {
                    print(`A wave of fire erupts from ${this.name}, heading toward ${this.attackTarget?.name}!`)
                    let dam = Math.floor(Math.sqrt(Math.random()) * this.magic_level)
                    dam *= this.attackTarget?.damage_modifier(dam, 'fire') || 1
                    await this.attackTarget?.hurt(dam, this)
                }
            }
        })
    },

    giant_scorpion(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'giant scorpion',
            pronouns: { "subject": "It", "object": "it", "possessive": "its" },
            max_hp: 100,
            blunt_damage: 15,
            sharp_damage: 6,
            weaponName: 'poison stinger',
            weaponType: 'stab',
            description: 'scorpion',
            coordination: 5,
            agility: -1,
            blunt_armor: 15,
            alignment: 'evil',
            ...args
        });
    },

    mutant_hedgehog(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'mutant hedgehog',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 100,
            blunt_damage: 6,
            sharp_damage: 15,
            weaponName: 'horns',
            weaponType: 'stab',
            description: 'mutant hedgehog',
            coordination: 0,
            agility: 18,
            blunt_armor: 25,
            alignment: 'evil',
            ...args
        }).fightMove(async function () {
            if (Math.random() < 1 / 3) {
                print("TODO: shootspike");
            }
        });
    },

    ogre(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'ogre',
            pronouns: pronouns.male,
            items: [getItem('club')],
            max_hp: 120,
            blunt_damage: 20,
            sharp_damage: 0,
            weaponName: 'club',
            weaponType: 'club',
            description: 'giant ogre',
            coordination: 2,
            agility: 1,
            blunt_armor: 2,
            alignment: 'evil',
            ...args
        });
    },

    path_demon(args: { [key: string]: any }) {
        const monsterOptions = [this.ogre, this.mutant_hedgehog, this.giant_scorpion]
        return randomChoice(monsterOptions)(
            args
        ).onRespawn(async function () {
            this.location?.removeCharacter(this)
            this.location?.addCharacter(getCharacter('path_demon', this.game))
            console.log(`path demon respawned as ${this.location?.character('path_demon')?.name}`)
        }).onTurn(
            actions.wander({ bounds: ['96', '191', 'meadow', 'bog'] })
        )
    },

    grizzly_bear(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grizzly bear',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 350,
            blunt_damage: 60,
            sharp_damage: 6,
            weapon: getItem('fist', { name: 'massive paws' }),
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
            max_hp: 250,
            blunt_damage: 42,
            sharp_damage: 5,
            weapon: getItem('fist', { name: 'heavy paws' }),
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
            max_hp: 400,
            blunt_damage: 40,
            sharp_damage: 30,
            weaponName: 'sharp claws',
            weaponType: 'slice',
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
            max_hp: 80,
            blunt_damage: 12,
            sharp_damage: 35,
            weaponName: 'teeth',
            weaponType: 'teeth',
            description: 'wolf',
            coordination: 15,
            agility: 11,
            blunt_armor: 0,
            spellChance: () => Math.random() < 1 / 2,
            ...args
        }).dialog(async function (player: Character) {
            print("grrrr...");
        }).fightMove(actions.howl);
    },

    rabid_wolf(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'rabid wolf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 60,
            blunt_damage: 12,
            sharp_damage: 45,
            weaponName: 'teeth',
            weaponType: 'teeth',
            description: 'rabid wolf',
            coordination: 5,
            agility: 0,
            blunt_armor: 0,
            powers: {
                'poison fang': 1,
            },
            attackPlayer: true,
            alignment: 'evil',
            ...args
        }).onTurn(actions.wander({}));
    },

    gryphon(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'gryphon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 64,
            blunt_armor: 9,
            coordination: 5,
            agility: 8,
            blunt_damage: 19,
            sharp_damage: 16,
            weaponName: 'talons',
            weaponType: 'slice',
            ...args
        });
    },

    voidfish(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'voidfish',
            description: 'slithering voidfish',
            pronouns: pronouns.inhuman,
            max_hp: 164,
            blunt_armor: 9,
            damage_modifier: {
                'sharp': dam => dam * 2,
                'blunt': dam => dam / 2
            },
            coordination: 5,
            agility: 8,
            sharp_damage: 160,
            weaponName: 'needle teeth',
            weaponType: 'teeth',
            alignment: 'evil',
            ...args
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }));
    },

    wraith(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'wraith',
            pronouns: pronouns.inhuman,
            max_hp: 640,
            damage_modifier: {
                'fire': dam => dam * 10,
                'electric': dam => dam * 5,
                'blunt': dam => 0,
                'sharp': dam => 0,
                'magic': dam => 0,
                'cold': dam => 0,
                'poison': dam => 0,
            },
            coordination: 27,
            agility: 4,
            magic_damage: 160,
            weaponName: 'blood-curdling shriek',
            weaponType: 'sonic',
            alignment: 'evil',
            chase: true,
            ...args
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }));
    },

    voidrat(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'void rat',
            pronouns: pronouns.inhuman,
            max_hp: 400,
            blunt_damage: 60,
            sharp_damage: 40,
            coordination: 5,
            agility: 2,
            weaponName: 'teeth',
            weaponType: 'teeth',
            description: 'monstrous rat',
            alignment: 'evil',
            ...args
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }))
    },

    grogren(args: { [key: string]: any }) {
        return new A2dCharacter({
            name: 'grogren',
            pronouns: pronouns.male,
            alignment: 'orc',
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
            print("Welcome, please seek the true location of Mythin's shop deep in the Forest of");
            print("Thieves.  Mythin is a good thief, yet a thief at that.  If he were to have an");
            print("office in town, the kings men would surely capture him.  I can't give you the");
            print("wareabouts as to where the place is located in the least... sorry.");
            print();
            print("To fool the guards, in town we ONLY refer to Mythin as a \"forester\"");
        });
    },
} as const;

type CharacterNames = keyof typeof characters;

function isValidCharacter(key: string): key is CharacterNames {
    return key in characters;
}

function getCharacter(charName: CharacterNames, game: GameState, args?: any): A2dCharacter {
    if (!characters[charName]) {
        console.log(`Character "${charName}" not found`);
        throw new Error(`Character "${charName}" not found`);
    }
    // console.log(`Creating character: ${charName}`);
    const char = characters[charName]({ game: game, ...args });
    char.key = charName;
    return char
}

export { A2dCharacter, A2dCharacterParams, getCharacter, isValidCharacter, characters, actions };
