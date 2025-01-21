import { Location } from "../../game/location.js";
import { Character, CharacterParams, pronouns, DamageTypes, damageTypesList } from "../../game/character.js";
import { Player } from "./player.js";
import { Item, WeaponTypes } from "../../game/item.js";
import { plural, singular, caps, randomChoice, lineBreak, highRandom } from "../../game/utils.js";
import { play, musicc$ } from "./utils.js";
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

const tribe_name: { [key: string]: string } = {
    'orcs': 'Grobin',
    'ierdale': 'Ierdale'
}

class A2dCharacter extends Character {
    class_name: string = ''
    _spellChance: ((this: A2dCharacter) => boolean) | undefined
    tripping: number = 0;
    drunk: number = 0;
    respawnTime: number = 500;
    declare game: A2D;

    constructor({ spellChance, respawnTime, ...baseParams }: A2dCharacterParams) {
        super(baseParams)
        // recover 100% of max hp per turn (when not in combat)
        if (!baseParams.hp_recharge) this.base_stats.hp_recharge = 1
        if (!this.weaponName) {
            this.weaponName = 'fists';
            this.attackVerb = 'club';
        }
        this._spellChance = spellChance?.bind(this)
        this.respawnTime = respawnTime || this.respawnTime
        if (!this.exp_value) {
            this.exp_value = Math.floor(
                this.max_hp / 2 * Math.max(Object.values(this.defenseBuffs.times).reduce(
                    (sum, value) => sum + Math.log(value) / damageTypesList.length, 1
                ), 1)
                + Object.values(this.base_damage).reduce((sum, value) => sum + value, 0)
                + Object.values(this.defenseBuffs.plus).reduce((sum, value) => sum + value, 0)
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

    get evasion() {
        let toHit = this.agility * Math.random();
        if (this.drunk) toHit = toHit * (1 - this.drunk / (this.max_sp / 2 + 50))
        return toHit
    }

    async giveItem(item: Item | keyof this["game"]["itemTemplates"], quantity?: number): Promise<void> {
        await super.giveItem(item, quantity);
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

    interaction(name: string, action: (this: A2dCharacter, ...args: any[]) => Promise<any>) {
        this.interactions.set(name, this.bindMethod(action));
        return this;
    }

    get spellChance(): boolean {
        const chance = this._spellChance ? this._spellChance() : true;
        console.log(`${this.name} spell chance: ${chance}`)
        return chance
    }

    async attack(
        target: Character | null = null,
        weapon: Item | string | null = null,
        damage_potential: Partial<{ [key in DamageTypes]: number }> = this.base_damage
    ) {
        color(black)
        await super.attack(target, weapon, damage_potential);
    }

    describeAttack(
        target: Character,
        weaponName: string,
        weaponType: WeaponTypes,
        damage: number,
        call_attack: boolean = false
    ): string {
        console.log(`${this.name} attacking ${target.name} with ${weaponName} (${weaponType}): ${damage} damage`)
        const DT = (damage / target.max_hp) * 100

        if (weaponType === 'sword') weaponType = randomChoice(['stab', 'slice'])
        if (weaponType === 'axe') weaponType = randomChoice(['slice', 'club'])

        let does = ''
        let callAttack = ''

        const num_enemies = this.location?.characters.filter(c => {
            return c.enemies.includes(this.name)
        }).length || 0
        const num_allies = this.location?.characters.filter(c => {
            return c.enemies.includes(target.name)
        }).length || 0

        const attackerPronouns = {
            subject: num_allies == 0 || this.isPlayer ? this.pronouns.subject : this.description,
            object: num_allies == 0 || this.isPlayer ? this.pronouns.object : this.description,
            possessive: num_allies == 0 || this.isPlayer ? this.pronouns.possessive : `${this.description}'s`
        }
        const targetPronouns = {
            subject: num_enemies == 1 || target.isPlayer ? target.pronouns.subject : target.description,
            object: num_enemies == 1 || target.isPlayer ? target.pronouns.object : target.description,
            possessive: num_enemies == 1 || target.isPlayer ? target.pronouns.possessive : `${target.description}'s`
        }
        const s = ['you', 'they'].includes(this.pronouns.subject) ? (str: string) => str : plural
        const t_s = ['you', 'they'].includes(target.pronouns.subject) ? (str: string) => str : plural
        const t_be = ['you', 'they'].includes(target.pronouns.subject) ? 'are' : 'is'

        if (DT < 0) {
            does = `${caps(attackerPronouns.subject)} ${s('miss')} ${targetPronouns.object} with ${weaponName}!`
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
                if (DT >= 220) { does = `${caps(attackerPronouns.subject)} ${s('eviscerate')} ${targetPronouns.object} with ${weaponName}. Blood splatters everywhere.` };
                if (DT >= 500) { does = `${caps(attackerPronouns.subject)} ${s('toss')} ${targetPronouns.object} from the end of ${attackerPronouns.possessive} ${weaponName} like a rotten leaf off a salad fork.` };
                break;
            case ("fire"):
                if (DT >= 0) does = `${caps(attackerPronouns.possessive)} ${weaponName} flickers against ${targetPronouns.object} without leaving a mark.`;
                if (DT >= 5) { does = `${caps(attackerPronouns.subject)} ${s('singe')} ${targetPronouns.object} with ${weaponName}, hurting ${target.pronouns.object} slightly.` };
                if (DT >= 10) { does = `${caps(attackerPronouns.subject)} ${s('scorch')} ${targetPronouns.object} with ${weaponName}, inflicting first-degree burns.` };
                if (DT >= 20) { does = `${caps(attackerPronouns.subject)} ${s('roast')} ${targetPronouns.object} with ${weaponName}, inflicting second-degree burns.` };
                if (DT >= 35) { does = `${caps(attackerPronouns.subject)} ${s('seriously burn')} ${targetPronouns.object} with ${weaponName}, making charred flesh sizzle.` };
                if (DT >= 60) { does = `${caps(attackerPronouns.subject)} ${s('torch')} ${targetPronouns.object} with ${weaponName}, setting ${target.pronouns.object} alight.` };
                if (DT >= 100) { does = `${caps(attackerPronouns.subject)} ${s('engulf')} ${targetPronouns.object} with the flames of ${weaponName}, cooking ${target.pronouns.object} where ${target.pronouns.subject} ${t_s('stand')}.` };
                if (DT >= 220) { does = `${caps(targetPronouns.subject)} ${t_be} blasted off ${target.pronouns.possessive} feet and cooked to a cinder in mid-air.` };
                if (DT >= 500) { does = `${caps(targetPronouns.possessive)} family is saved the cost of cremation, as ${target.pronouns.possessive} ashes scatter to the wind.` };
                break;
            case ("bow"):
                if (DT >= 0) does = `${target.description} barely ${t_s('notices')} ${attackerPronouns.possessive} arrow striking ${target.pronouns.object}.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${t_s('take')} minimal damage.` };
                if (DT >= 12) { does = `${caps(targetPronouns.subject)} ${t_be} minorly wounded.` };
                if (DT >= 25) { does = `${caps(targetPronouns.subject)} ${t_s('sustain')} a major injury.` };
                if (DT >= 50) { does = `${caps(targetPronouns.subject)} ${t_s('suffer')} damage to vital organs.` };
                if (DT >= 100) { does = `${caps(targetPronouns.subject)} ${t_be} slain instantly.` };
                if (DT >= 400) { does = `${caps(attackerPronouns.possessive)} arrow goes straight through ${targetPronouns.object}, leaving a gaping hole.` };
                if (DT >= 1000) { does = `${caps(targetPronouns.subject)} ${t_be} ripped messily in half.` };
                if (DT >= 2500) { does = `Tiny pieces of ${target.description} fly in all directions.` };
                if (call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('shoot')} an arrow at ${targetPronouns.object}!`;
                break;
            case ("magic"):
                if (DT >= 0) does = `${caps(targetPronouns.subject)} ${t_s('wince')} slightly, perhaps at ${attackerPronouns.possessive} incompetence.`;
                if (DT >= 5) { does = `${caps(targetPronouns.subject)} ${t_s('flinch')}... a little.` };
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
                if (DT >= 35) { does = `${caps(targetPronouns.subject)} ${t_s('stagger')} backwards, bleeding copiously.` };
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
            case ("bite"):
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
        if (!this.isPlayer && !target.isPlayer && !callAttack && call_attack) callAttack = `${caps(attackerPronouns.subject)} ${s('attack')} ${targetPronouns.object} with ${weaponName}!`
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
                } else this.push_action(`go ${goDirection}`);
            }
        }
        return wander_function;
    },
    pish2: async function (this: A2dCharacter, character: Character) {
        // usage: character.onAttack(actions.pish2)
        if (character.isPlayer) print("I don't want to fight.");
        await character.fight(null);
        await this.fight(null);
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
        if (this.attackTarget?.isPlayer) {
            const player = this.attackTarget as Player
            player.disableCommands(Array.from(player.actions.keys()), "Shhh. You are sleeping.");
            player.addBuff(getBuff('sleep')({ duration: length, power: 1 }));
        }
    },
    growl: async function (this: A2dCharacter) {
        if (this.attackTarget?.isPlayer) {
            color(magenta)
            print(`${caps(this.name)} growls fiercly, your attack fell.`)
        }
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
        itemName = itemName.toLowerCase().trim();
        let item = this.item(itemName);
        if (!item) item = this.item(singular(itemName));
        let quantity = 1
        if (!item) {
            print("That is not for sale here.");
            return;
        } else if (item.quantity > 1) {
            quantity = parseInt(await input(`How many? `));
            if (isNaN(quantity)) {
                print("What?");
                return;
            } else if (quantity > 1) {
                itemName = plural(item.name);
            } else if (quantity < 0) {
                print('No.');
                return;
            }
        }

        if (item.value * quantity > character.itemCount('gold')) {
            print("You don't have enough money.");
            return;
        } else {
            character.giveItem(item.key, quantity);
            character.removeItem('gold', item.value * quantity);
            print(`Bought ${quantity > 1 ? quantity.toString() + ' ' : ''}${itemName} for ${item.value * quantity} GP.`);

            if (item.equipment_slot === 'armor' && quantity > 0) {
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
    declare_war: async function (this: Character, character: Character) {
        if (character?.isPlayer && !character?.flags?.[`enemy_of_${this.alignment}`]) {
            color(red);
            print(`${tribe_name[this.alignment]} has turned against you!`);
        }
        if (character?.flags) character.flags[`enemy_of_${this.alignment}`] = true;
    },
    defend_tribe: async function (this: Character, attacker: Character) {
        if (attacker.flags[`enemy_of_${this.alignment}`]) {
            await this.fight(attacker);
        }
    },
    call_help(...characterNames: CharacterNames[]) {
        return async function (this: Character) {
            for (const char of this.game.characters.filter(c => characterNames.includes(c.key as CharacterNames))) {
                if (!char.fighting) char.goto(this.location!);
                await char.fight(this.attackTarget);
            }
        }
    }
}

const characters = {
    player(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'player',
            isPlayer: true,
        });
    },
    sick_old_cleric(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'A sick old cleric, lying in bed',
            aliases: ['cleric', 'old cleric', 'sick cleric', 'sick old cleric'],
            description: 'A sick old cleric, lying in bed',
            items: ['clear_liquid', 'blue_liquid', 'red_liquid'],
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
            this.game.addLandmark('dead_cleric', this.location!)
            this.transferAllItems(player)
        })
    },

    ierdale_forester(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'ierdale forester',
            items: ['long_dagger', { name: 'gold', quantity: 12 }],
            max_hp: 54,
            damage: { blunt: 6, sharp: 20 },
            weaponName: 'long dagger',
            attackVerb: 'stab',
            description: 'forester',
            agility: 4,
            coordination: 2,
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            aliases: ['forester'],
        }).dialog(async function (player: Character) {
            if (!player.flags.forest_pass) {
                print("You need a pass to get in to this forest.");
                print("You can buy one at the police station.  South");
                print("three times, west once, north once.");
            } else {
                print("Be careful in here.  Most of these theives are dangerous.");
            }
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer && !attacker.flags.enemy_of_ierdale) {
                color(red)
                print(`Forester blows a short blast on ${this.pronouns.possessive} horn.`);
                print("Ierdale has turned against you!");
            }
            attacker.flags.enemy_of_ierdale = true;
        }).allowDeparture(async function (character, direction) {
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

    guard_captain(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'guard captain',
            items: [{ name: 'gold', quantity: 25 }, 'longsword'],
            max_hp: 100,
            damage: { blunt: 10, sharp: 40 },
            weaponName: 'longsword',
            attackVerb: 'slice',
            description: 'guard captain',
            coordination: 7,
            agility: 2,
            armor: { blunt: 13, sharp: 20 },
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
            respawns: false,
        }).onEncounter(
            actions.defend_tribe
        ).onAttack(
            actions.declare_war
        ).dialog(async function (player: Character) {
            const assignMission = async () => {
                this.game.flags.ierdale_mission = 'yes';
                print("You are a true hero. GLORY TO IERDALE!")
                await pause(2)
                print("Half now, half when you return. You may need this to equip yourself for")
                print("the fight.")
                player.giveItem('gold', 5000)
                print("<received 5000 GP>")
                await pause(2)
                color(black)
                print("This may also help you - ")
                color(magenta)
                player.giveItem('pocket_ballista')
                player.giveItem('arrow', 10)
                print("<recieved pocket ballista>")
            }
            const completeMission = async () => {
                print("You have it!  You have saved us ALL!")
                await pause(2)
                print("Here is the rest of your reward.")
                player.giveItem('gold', 5000)
                print("<received 5000 GP>")
                await pause(1)
                color(black)
                print("I'm sure that Colonel Arach -")
                await pause(2)
                color(magenta)
                print("<ka-thump>")
                await pause(3)
                color(black)
                print("What was that?")
                await pause(2)
                color(magenta)
                print("<ka-thump>")
                await pause(2)
                print("<ka-thump>")
                await pause(2)
                print("<ka-thump>")
                await pause(1)
                color(black)
                print("Security Guard -- Enemy at the gates!")
                await pause(3)
                color(magenta)
                print("<CRASH>")
                await pause(2)
                print("<distant screams>")
                await pause(2)
                color(black)
                print("Guard Captain -- They've breached the gates! It's time to FIGHT!")
                const breach_point = this.game.find_location('Eastern Gatehouse')
                this.goto(breach_point!)
                this.game.find_character('colonel arach')?.goto(breach_point!)
                const invading_army = this.game.find_all_characters(['dark angel', 'orcish soldier', 'orcish emissary', 'grogren']).filter(c => !c.dead)
                invading_army.forEach(c => c.relocate(breach_point))
                invading_army.push(this.game.addCharacter({ name: 'orc_amazon', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orc_behemoth', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orc_behemoth', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'gryphon', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'gryphon', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'gryphon', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orcish_soldier', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orcish_soldier', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orcish_soldier', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orcish_soldier', location: breach_point! })!)
                invading_army.push(this.game.addCharacter({ name: 'orcish_soldier', location: breach_point! })!)
                invading_army.forEach(c => {
                    c.relocate(breach_point!)
                    c.goto('Center of Town');
                    c.enemies.push(player.name);
                })
                this.game.flags.orc_battle = true
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
                print("I've heard good things about you. I think you may be up to the task.")
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
                if (player.has('mighty gigasarm')) {
                    await completeMission();
                } else {
                    print("You have accepted the mission.  Go to Grobin and steal the Mighty Gigasarm!")
                }
            }
        }).fightMove(
            actions.call_help('security_guard')
        ).onTurn(async function () {
            if (!this.fighting) this.flags.called_for_help = false;
        })
    },

    minotaur(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'minotaur',
            pronouns: pronouns.male,
            items: ['spiked_club'],
            max_hp: 760,
            damage: { blunt: 280, sharp: 13 },
            weaponName: 'spiked club',
            attackVerb: 'club',
            description: 'labyrinth minotaur',
            coordination: 15,
            agility: 2,
            alignment: 'evil/areaw',
            respawns: false,
        });
    },

    stone_ogre(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'stone ogre',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 5 }, 'spiked_club'],
            max_hp: 100,
            damage: { blunt: 20, sharp: 5 },
            weaponName: 'spiked club',
            attackVerb: 'club',
            description: 'stone ogre',
            armor: { blunt: 2 },
            coordination: 3,
            agility: 2,
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    ierdale_soldier(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Ierdale soldier',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 50 }, 'claymoore'],
            max_hp: 300,
            damage: { blunt: 50, sharp: 50 },
            weaponName: 'claymoore',
            attackVerb: 'slice',
            description: 'ierdale soldier',
            coordination: 14,
            agility: 3,
            armor: { blunt: 15, sharp: 25 },
            aliases: ['soldier'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
            respawns: false,
        }).onEncounter(
            actions.defend_tribe
        ).dialog(async function (player: Character) {
            if (!player.has('mighty_gigasarm')) {
                if (!this.flags.dialog) {
                    this.flags.dialog = this.game.flags.soldier_dialogue.shift() || "Sir! Yes sir!";
                }
                print(lineBreak(this.flags.dialog));
                this.flags.dialog = 'Sir! Yes sir!'
            } else {
                print(`${player.name}! ${player.name}! The hero returns!`)
            }
        }).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('general_kerry', 'general_gant', 'ierdale_soldier')
        ).onTurn(async function () {
            if (this.game.flags.orc_battle && !this.fighting && !this.actionQueue.length) {
                this.goto('eastern gatehouse')
            }
        });
    },

    ierdale_patrol(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Ierdale soldier',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 50 }, 'claymoore'],
            max_hp: 300,
            damage: { blunt: 50, sharp: 50 },
            weaponName: 'claymoore',
            attackVerb: 'slice',
            description: 'ierdale soldier',
            coordination: 14,
            agility: 3,
            armor: { blunt: 15, sharp: 25 },
            aliases: ['soldier'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
            respawns: false,
        }).onEncounter(
            actions.defend_tribe
        ).dialog(async function (player: Character) {
            if (player.has('mighty_gigasarm')) {
                print("Let the hero pass!")
            } else {
                if (!this.flags.dialog) {
                    this.flags.dialog = this.game.flags.soldier_dialogue.shift() || "Sir! Yes sir!";
                }
                print(lineBreak(this.flags.dialog));
                this.flags.dialog = "We are ready to attack the filthy Orcs at a moment's notice!"
            }
        }).onAttack(
            actions.declare_war
        ).onTurn(actions.wander({
            bounds: [
                'mucky path', 'stony bridge', 'dry grass', 'entrance to the forest of thieves', 'house', 'sandy desert', 'path of nod'
            ], frequency: 1 / 4
        })).fightMove(
            actions.call_help('general_kerry', 'general_gant', 'ierdale_patrol')
        );
    },

    general_kerry(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Ierdale general',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 200 }, 'silver_sword'],
            max_hp: 700,
            damage: { blunt: 50, sharp: 120 },
            weaponName: 'silver sword',
            attackVerb: 'slice',
            description: 'Ierdale general',
            coordination: 16,
            agility: 8,
            armor: { blunt: 30, sharp: 45, magic: 10 },
            aliases: ['general'],
            respawns: false,
        }).onAttack(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        ).fightMove(async function () {
            for (let soldier of this.game.find_all_characters('ierdale_soldier')) {
                soldier.goto(this.location!.key)
                await soldier.fight(this.attackTarget)
            }
        }).dialog(async function (player: Character) {
            print("Ieadon is nowhere to be found, and our best intelligence is that he has")
            print("joined the Orcs.  We must prepare for the worst.  We have locked the gates")
            print("and are preparing for a siege.")
        });
    },

    general_gant(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Ierdale general',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 200 }, 'silver_sword'],
            max_hp: 700,
            damage: { blunt: 120, sharp: 50 },
            weaponName: 'silver sword',
            attackVerb: 'slice',
            description: 'Ierdale general',
            coordination: 16,
            agility: 8,
            armor: { blunt: 30, sharp: 45, magic: 10 },
            aliases: ['general'],
            respawns: false,
        }).dialog(async function (player: Character) {
            print("Back in LINE!  This is a time of seriousness.  We are planning on crushing the");
            print("Orcs for helping Ieadon break free.  All the gates where the Orcs could enter");
            print("are locked.  Once you leave through a gate you won't be able to come back!");
        }).onAttack(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        ).fightMove(async function () {
            for (let soldier of this.game.find_all_characters('ierdale_soldier')) {
                soldier.goto(this.location!.key)
                await soldier.fight(this.attackTarget)
            }
        });
    },

    security_page(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'security page',
            items: ['dagger', { name: 'gold', quantity: Math.random() * 300 + 500 }],
            max_hp: 21,
            damage: { blunt: 5, sharp: 3 },
            weaponName: 'dagger',
            attackVerb: 'stab',
            description: 'Ierdale page',
            pronouns: pronouns.female,
            aliases: ['page'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
        }).onEncounter(
            actions.defend_tribe
        ).dialog(async function (player: Character) {
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
        }).interaction('pass', async function (player) {
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
            for (let location of [34, 35, 36, 39, 41]) {
                this.game.addCharacter({ name: 'goblin_captain', location: location })
                for (let i = 0; i < 4; i++) {
                    this.game.addCharacter({ name: 'goblin_soldier', location: location })
                }
            }
        }).onRespawn(async function () {
            this.item('gold')!.value = Math.random() * 300 + 500
        });
    },

    toothless_man(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'toothless man',
            pronouns: pronouns.male,
            items: ['battle_axe', { name: 'gold', quantity: 1000 }],
            max_hp: 70,
            damage: { blunt: 0, sharp: 40 },
            weaponName: 'battle axe',
            attackVerb: 'axe',
            coordination: 10,
            agility: 6,
            armor: { blunt: 50 },
            description: '',
            spellChance: () => Math.random() < 3 / 4,
        }).dialog(async function (player: Character) {
            print("Welcome to my thop.  Here we buy and thell many an ithem.");
            print("Read my thign to learn more bucko.  Teehhehehehe.");
        }).interaction('pawn', async function (player: Character, itemName: string) {
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
                player.giveItem('gold', payment);
                player.removeItem(itemName, quantity);
            }
            if (quantity === 1) {
                print(`----Pawned 1 ${itemName} for ${payment} GP.`)
            } else {
                print(`----Pawned ${quantity} ${plural(itemName)} for ${payment} GP.`)
            }
        }).fightMove(actions.heal);
    },

    armor_merchant(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'armor merchant',
            pronouns: pronouns.male,
            items: [
                'leather_armor',
                'studded_leather',
                'light_chainmail',
                'chain_mail',
                'banded_mail',
                'light_plate',
                'full_plate',
            ],
            max_hp: 130,
            damage: { blunt: 30, sharp: 0 },
            weaponName: 'fist',
            attackVerb: 'club',
            coordination: 2,
            agility: 1,
            armor: { blunt: 30 },
            aliases: ['merchant'],
            alignment: 'armor shop',
            respawns: false,
            spellChance: () => Math.random() < 1 / 3,
        }).dialog(async function (player: Character) {
            print("May I aid in assisting you?  Read the sign.  It contains all of our products.");
            print("Also: I've heard thiers a ring somewhere in the caves off the meadow.");
        }).onDeath(async function () {
            this.clearInventory();
            this.giveItem('gold', 1418);
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
        ).interaction('buy', actions.buy);
    },

    blacksmith(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'blacksmith',
            items: [{ name: 'gold', quantity: 50 }, 'battle_axe'],
            max_hp: 500,
            damage: { blunt: 40, sharp: 100 },
            weaponName: 'battle axe',
            attackVerb: 'axe',
            coordination: 10,
            agility: 6,
            armor: { blunt: 50, sharp: 50 },
            description: 'blacksmith',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            alignment: 'armor shop',
            respawns: false,
            spellChance: () => Math.random() < 3 / 4,
        }).dialog(async function (player: Character) {
            print("'Ello me'lad.  Please, I am not much of a talker, talk to the other un'");
        }).fightMove(
            actions.heal
        );
    },

    bag_boy(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'bag boy',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 4 }, 'banana'],
            description: 'worthless little bag boy',
            max_hp: 30,
            weaponName: 'banana',
            attackVerb: 'club',
            damage: { blunt: 5, sharp: 0 },
            armor: { blunt: 2 },
            coordination: 1,
            agility: 1,
            respawns: false,
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

    baby_spritzer(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'baby spritzer',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
            items: [{ name: 'gold', quantity: 6 }, 'spritzer_hair'],
            description: 'potent baby spritzer',
            max_hp: 25,
            armor: { blunt: 1, magic: 18 },
            coordination: 1,
            agility: 1.5,
            weaponName: 'spritzer power',
            attackVerb: 'magic',
            spellChance: () => Math.random() < 1 / 4,
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

    colonel_arach(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Colonel Arach',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 500 }, 'mighty_excalabor'],
            description: 'Arach the Terrible',
            max_hp: 1500,
            damage: { sharp: 500 },
            weaponName: 'mighty excalabor',
            attackVerb: 'slice',
            armor: { blunt: 60, sharp: 40 },
            coordination: 20,
            agility: 20,
            aliases: ['colonel', 'arach'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
            respawns: false,
            spellChance: () => true,  // always heals
            magic_level: 50,
        }).onEncounter(
            actions.defend_tribe
        ).dialog(async function (player: Character) {
            if (this.game.flags.biadon && !this.game.flags.ierdale_mission) {
                print("You've heard the news? I fear the orcish attack is imminent. Arm yourself!");
            } else if (this.game.flags.ierdale_mission) {
                print(`Good luck with your mission, brave ${player.name}. We're all counting on you!`);
            } else if (player.has("bug repellent")) {
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
                            location.clearLandmarks();
                            this.game.addLandmark('open_gate', location)
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
            actions.declare_war.bind(this)(attacker);
            if (attacker.isPlayer) {
                color(red)
                print(`Colonel Arach -- Assassin!`);
                print('              -- Soldiers!  To me!')
            }
            actions.call_help('ierdale_soldier', 'general_gant', 'general_kerry', 'security_guard').bind(this)();
        }).fightMove(actions.heal);
    },

    sift(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Sift',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 200 }, 'ring_of_dreams'],
            max_hp: 580,
            damage: { blunt: 20, sharp: 100 },
            weaponName: 'claws',
            attackVerb: 'slice',
            description: 'Sift',
            coordination: 25,
            agility: 15,
            armor: { blunt: 25 },
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
            exp: 3500,
        }).onDeath(async function () {
            this.game.flags.sift = true;
        }).fightMove(async function () {
            if (!this.attackTarget) return;
            color(magenta)
            await randomChoice([
                async function (this: A2dCharacter) {
                    if (this.attackTarget!.isPlayer) {
                        print("Sift recalls a dream where he stalked in the shadows, unseen.");
                        print("-- sift vanishes --")
                    }
                    this.attackTarget?.addBuff(getBuff('blindness')({ power: 25, duration: 2 }))
                },
                async function (this: A2dCharacter) {
                    if (this.attackTarget!.isPlayer) {
                        print("Sift recalls a dream where he was invulnerable.");
                        print("-- defenses raised --")
                    }
                    this.addBuff(getBuff('shield')({ power: 50, duration: 2 }))
                },
                async function (this: A2dCharacter) {
                    if (this.attackTarget!.isPlayer) {
                        print("A lightning storm is the dream as Sift tears around in his trance.");
                    }
                    this.attack(this.attackTarget, 'lightning bolt', { electric: 50 })
                },
                async function (this: A2dCharacter) {
                    if (this.attackTarget!.isPlayer) {
                        print("He remembers a dream where he was aided by bats.");
                        print("-- bats summoned --")
                    }
                    this.game.addCharacter({ name: 'mutant_bat', location: this.location! })
                    this.game.addCharacter({ name: 'mutant_bat', location: this.location! })
                }
            ]).call(this);
        });
    },

    cradel(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'cradel',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 100 }, 'spiked_club'],
            description: 'Cradel the troll',
            max_hp: 1000,
            damage: { blunt: 250, sharp: 150 },
            weaponName: 'spiked club',
            attackVerb: 'club',
            armor: { blunt: 26 },
            coordination: 5,
            agility: 5,
            spellChance: () => Math.random() < 5 / 7,
            magic_level: 25,
            respawns: false,
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
            this.location?.clearLandmarks();
            this.game.addLandmark('open_gate', this.location!)
            this.game.flags.cradel = true;
            this.location?.adjacent?.set('south', this.game.find_location(192) || this.location);
        }).interaction('play lute', async function (player: Character) {
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
                                player.removeItem('ring of dreams')
                                this.game.flags.cradel = true;
                                this.location!.landmarks = [this.game.addLandmark('open_gate', this.location!)!];
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

    mino(game: GameState) {

        return new A2dCharacter({
            game: game,
            name: 'Mino',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 15 }, 'long_dagger', 'lute_de_lumonate'],
            description: 'musical Mino',
            max_hp: 250,
            damage: { blunt: 0, sharp: 40 },
            weaponName: 'long dagger',
            attackVerb: 'stab',
            armor: { blunt: 20 },
            agility: 40,
            coordination: 12,
            respawns: false,
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
        }).interaction('guess', async function (player: Character, guess: string) {
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

    peon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peon',
            items: [{ name: 'gold', quantity: 2 }],
            max_hp: 50,
            damage: { blunt: 10, sharp: 2 },
            weaponName: 'fist',
            attackVerb: 'club',
            description: 'helpless peon',
            coordination: 2,
            agility: 3,
            pronouns: randomChoice([pronouns.female, pronouns.male]),
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).dialog(async function (player: Character) {
            print("Ierdale will stop at nothing to destroy us!");
            print("Join us against them, brother!");
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'] })
        ).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth')
        )
    },

    orcish_citizen(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orcish citizen',
            items: [{ name: 'gold', quantity: 29 }, 'rapier'],
            max_hp: 80,
            damage: { sharp: 20 },
            weaponName: 'rapier',
            attackVerb: 'stab',
            description: 'orcish citizen',
            coordination: 3,
            agility: 2,
            pronouns: pronouns.male,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).dialog(async function (player: Character) {
            print("Ierdale will stop at nothing to destroy us!");
            print("Join us against them, brother!");
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'], frequency: 1 / 3 })
        ).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth')
        )
    },

    orcish_child(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orcish child',
            items: ['toy_sword'],
            max_hp: 10,
            damage: { blunt: 1, sharp: 0 },
            weaponName: 'toy sword',
            description: 'orcish child',
            coordination: 1,
            agility: 1,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
            pronouns: randomChoice([pronouns.male, pronouns.female]),
        }).dialog(async function (player: Character) {
            print('Kill humans! Weeeee!')
        }).onTurn(
            actions.wander({ bounds: ['grobin gates'], frequency: 1 / 3 })
        ).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth')
        )
    },

    orcish_soldier(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orcish soldier',
            pronouns: pronouns.male,
            items: [{ name: 'gold', quantity: 5 }, 'halberd'],
            description: 'orcish soldier',
            max_hp: 120,
            damage: { blunt: 30, sharp: 45 },
            weaponName: 'halberd',
            attackVerb: 'axe',
            coordination: 5,
            agility: 3,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).onTurn(
            actions.wander({ bounds: ['grobin gates', 'peon house', 'orc house', 'house', 'orcish grocery'] })
        ).dialog(async function (player: Character) {
            print("Ten-hut! The humans will find no quarter with me!");
        }).onEncounter(
            actions.defend_tribe
        ).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth')
        )
    },

    dark_angel(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dark angel',
            items: [{ name: 'gold', quantity: 50 }, 'dark_sword', 'banana'],
            max_hp: 300,
            damage: { sharp: 40, magic: 40 },
            weaponName: 'dark sword',
            attackVerb: 'slice',
            magic_level: 150,
            description: 'angel of death',
            coordination: 25,
            agility: 11,
            pronouns: pronouns.female,
            aliases: ['angel'],
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
            size: -1,
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
        }).onEncounter(async function (character) {
            if (character.alignment !== this.alignment && (character.flags.enemy_of_orcs || !character.flags.orc_pass)) {
                this.fight(character)
            }
        }).onAttack(async function (attacker) {
            // pass revoked
            attacker.flags.orc_pass = false;
        }).onTurn(async function () {
            if (this.game.flags.orc_battle && !this.fighting) {
                this.goto('Ierdale Barracks');
            }
        })
    },

    gerard(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'gerard',
            items: [{ name: 'gold', quantity: 50 }],
            max_hp: 200,
            damage: { blunt: 100, sharp: 50 },
            weaponName: 'a bomb',
            attackVerb: 'magic',
            description: 'Gerard',
            armor: { blunt: 20 },
            coordination: 5,
            agility: 2,
            pronouns: pronouns.male,
            respawns: false,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).dialog(async function (player: Character) {
            if (!this.game.flags.ieadon) {
                print("A hang glider is nice... for gliding from high places.");
            } else {
                print("Try out my newest invention... the PORTAL DETECTOR!");
            }
        }).onAttack(
            actions.declare_war
        ).fightMove(
            actions.call_help('orcish_soldier')
        )
    },

    orc_emissary(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orcish emissary',
            aliases: ['emissary', 'orcs'],
            pronouns: pronouns.female,
            description: 'orc emissary',
            max_hp: 250,
            damage: { blunt: 19, sharp: 74, magic: 24 },
            weaponName: 'mighty gigasarm',
            attackVerb: 'axe',
            items: [{ name: 'gold', quantity: 5 }, 'mighty_gigasarm'],
            armor: { blunt: 50, sharp: 50, magic: 50 },
            coordination: 5,
            agility: 3,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
            chase: true,
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
                    await this.fight(player);
                }
            } else {
                print("I'm sorry to hear that. You die now.");
                await this.fight(player)
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
            if (attacker.isPlayer && attacker.flags.orc_pass && !this.flags.minions) {
                color(red);
                print("Minions! Help!");
                attacker.flags.orc_pass = false;
                color(black)
                // call all the backup
                this.game.addCharacter({ name: 'orc_amazon', location: this.location?.adjacent.get('east')!, chase: true })?.goto(this.location)
                this.game.addCharacter({ name: 'orc_behemoth', location: this.location?.adjacent.get('east')!, chase: true })?.goto(this.location)
                this.game.addCharacter({ name: 'orc_behemoth', location: this.location?.adjacent.get('east')!, chase: true })?.goto(this.location)
                this.game.addCharacter({ name: 'gryphon', location: this.location?.adjacent.get('east')!, chase: true })?.goto(this.location)
                this.flags.minions = true;
            };
        })
    },

    doo_dad_man(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'doo dad man',
            items: [{ name: 'gold', quantity: 150 }, 'long_dagger'],
            max_hp: 90,
            damage: { blunt: 45, sharp: 10 },
            coordination: 3,
            agility: 2,
            weaponName: 'jackhammer',
            attackVerb: 'club',
            description: 'doo-dad man',
            pronouns: pronouns.male,
        }).dialog(async function (player: Character) {
            print("Want some doo-dads?  They're really neat!");
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer && attacker.flags.orc_pass) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
                color(black)
            };
        })
    },

    orcish_grocer(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orcish grocer',
            aliases: ['grocer'],
            pronouns: pronouns.female,
            items: [
                { name: 'banana', quantity: Infinity },
                { name: 'muffin', quantity: Infinity },
                { name: 'wheel_of_cheese', quantity: Infinity },
                { name: 'asparagus', quantity: Infinity },
                { name: 'dog_steak', quantity: Infinity },
                { name: 'nip_of_gin', quantity: Infinity },
                { name: 'barrel_of_grog', quantity: Infinity },
            ],
            description: 'orcish grocer',
            max_hp: 30,
            weaponName: 'banana',
            attackVerb: 'club',
            damage: { blunt: 5, sharp: 0 },
            armor: { blunt: 2 },
            coordination: 1,
            agility: 1,
            respawns: false,
        }).dialog(async function (player: Character) {
            print("Hello, sir or madam! I hope you enjoy our fine orcish cuisine.");
            print("Here is what I have for sale:");
            print();
            for (const item of this.items) {
                print(`${item.name} - ${item.value} GP`);
            }
        }).interaction(
            'buy', actions.buy
        ).onAttack(async function (attacker) {
            if (attacker.isPlayer && attacker.flags.orc_pass) {
                color(red);
                print("The orcs have turned against you!");
                attacker.flags.orc_pass = false;
                color(black)
            };
        }).onDeath(async function () {
            for (const item of this.items) {
                item.quantity = 1;
            }
        })
    },

    farm_wife(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'farm wife',
            items: [],
            max_hp: 12,
            damage: { blunt: 3, sharp: 0 },
            weaponName: 'hands',
            attackVerb: 'club',
            description: 'screaming farm wife',
            pronouns: pronouns.female,
            aliases: ['wife'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
            respawns: false,
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
        }).onDeath(async function (attacker) {
            if (attacker instanceof Character && attacker.isPlayer && !this.game.player.flags.enemy_of_ierdale) {
                color(red);
                print("You shall regret this, Ierdale has turned against you!");
                attacker.flags.enemy_of_ierdale = true
            }
        });
    },

    clubman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'clubman',
            items: ['club', { name: 'gold', quantity: 5 }],
            max_hp: 21,
            damage: { blunt: 7 },
            coordination: 2,
            agility: 1,
            weaponName: 'club',
            attackVerb: 'club',
            description: 'clubman',
            alignment: 'clubmen clan',
            pronouns: pronouns.male,
        }).dialog(async function (player: Character) {
            print("Duuuu... Ummmmmm... How me I forget to breathe...");
        });
    },

    wandering_clubman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'clubman',
            items: ['club', { name: 'gold', quantity: 5 }],
            max_hp: 21,
            damage: { blunt: 7 },
            coordination: 2,
            agility: 1,
            weaponName: 'club',
            attackVerb: 'club',
            description: 'clubman',
            alignment: 'clubmen clan',
            pronouns: pronouns.male,
        }).dialog(async function (player: Character) {
            print("Duuuu... Ummmmmm... How me I forget to breathe...");
        }).onTurn(
            actions.wander({ bounds: [] })
        );
    },

    ultra_clubman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'clubman',
            items: ['club', 'club', { name: 'gold', quantity: 10 }],
            max_hp: 84,
            damage: { blunt: 27 },
            coordination: 4,
            agility: 4,
            weaponName: 'club',
            attackVerb: 'club',
            description: 'ultra clubman',
            alignment: 'clubmen clan',
            pronouns: pronouns.male,
            attackPlayer: true,
        }).fightMove(async function () {
            print("Clubman attacks with his other hand!");
            await this.attack(this.attackTarget, 'club', { blunt: 23 });
        });
    },

    rush_lurker(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'rush lurker',
            items: [{ name: 'gold', quantity: 10 }],
            max_hp: 31,
            damage: { blunt: 8, sharp: 3 },
            coordination: 3,
            agility: 2,
            weaponName: 'claws',
            attackVerb: 'slice',
            description: 'rush lurker',
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
        });
    },

    swordsman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'swordsman',
            items: ['shortsword', { name: 'gold', quantity: 5 }],
            max_hp: 72,
            damage: { blunt: 8, sharp: 14 },
            weaponName: 'shortsword',
            attackVerb: 'slice',
            description: 'swordsman',
            armor: { blunt: 2 },
            coordination: 3,
            agility: 1,
            pronouns: pronouns.male,
        });
    },

    evil_forester(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'evil forester',
            aliases: ['forester'],
            items: ['wooden_stick', { name: 'gold', quantity: 8 }],
            max_hp: 50,
            damage: { blunt: 20, sharp: 0 },
            coordination: 5,
            agility: 2,
            weaponName: 'wooden stick',
            attackVerb: 'club',
            description: 'evil forester',
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
        });
    },

    dirty_thief(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dirty thief',
            aliases: ['thief'],
            items: ['dagger', { name: 'gold', quantity: 6 }],
            max_hp: 52,
            damage: { blunt: 0, sharp: 10 },
            coordination: 3,
            agility: 2,
            weaponName: 'dagger',
            attackVerb: 'stab',
            description: 'dirty thiefing rascal',
            pronouns: pronouns.male,
        });
    },

    fat_merchant_thief(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'fat merchant-thief',
            items: ['whip', { name: 'gold', quantity: 20 }],
            aliases: ['fat merchant', 'merchant-thief', 'merchant', 'thief'],
            max_hp: 61,
            damage: { blunt: 12, sharp: 0 },
            coordination: 9,
            agility: 2,
            weaponName: 'whip',
            attackVerb: 'slice',
            description: 'fat merchant',
            pronouns: pronouns.male,
        });
    },

    snarling_thief(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'snarling thief',
            aliases: ['thief'],
            items: ['flail', { name: 'gold', quantity: 7 }],
            max_hp: 82,
            damage: { blunt: 7, sharp: 11 },
            coordination: 4,
            agility: 2,
            weaponName: 'flail',
            attackVerb: 'club',
            description: 'thief',
            pronouns: pronouns.female,
        });
    },

    dark_rider(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dark rider',
            items: ['hand_axe', { name: 'gold', quantity: 3 }],
            max_hp: 115,
            damage: { blunt: 20, sharp: 10 },
            coordination: 3,
            agility: 5,
            weaponName: 'hand axe',
            attackVerb: 'axe',
            description: 'dark rider',
            armor: { blunt: 3 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
        });
    },

    fine_gentleman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'fine gentleman',
            aliases: ['gentleman'],
            items: ['rapier', { name: 'gold', quantity: 26 }],
            max_hp: 103,
            damage: { blunt: 0, sharp: 16 },
            coordination: 5,
            agility: 3,
            weaponName: 'rapier',
            attackVerb: 'stab',
            description: 'gentleman',
            armor: { blunt: 1 },
            pronouns: pronouns.male,
        });
    },

    little_goblin_thief(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'little goblin thief',
            aliases: ['goblin thief', 'goblin', 'thief'],
            items: ['metal_bar', { name: 'gold', quantity: 6 }],
            max_hp: 100,
            damage: { blunt: 30, sharp: 10 },
            coordination: 2,
            agility: 6,
            weaponName: 'metal bar',
            attackVerb: 'club',
            description: 'goblin',
            pronouns: pronouns.male,
        });
    },

    orc_amazon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orc amazon',
            aliases: ['amazon', 'orc'],
            items: ['claymoore', { name: 'gold', quantity: 17 }],
            max_hp: 250,
            armor: { blunt: 5, sharp: 30, magic: 15 },
            coordination: 10,
            agility: 5,
            damage: { blunt: 29, sharp: 16 },
            weaponName: 'claymoore',
            attackVerb: 'slice',
            pronouns: pronouns.female,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
            chase: true,
        }).onAttack(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth', 'gryphon')
        );
    },

    orc_behemoth(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'orc behemoth',
            aliases: ['behemoth', 'orc'],
            pronouns: pronouns.male,
            items: ['mighty_warhammer'],
            max_hp: 300,
            armor: { blunt: 11, sharp: 12, magic: 13 },
            coordination: 6,
            agility: 1,
            damage: { blunt: 19, sharp: 16 },
            weaponName: 'mighty warhammer',
            attackVerb: 'club',
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).onAttack(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth', 'gryphon')
        );
    },

    //, getItem('87_then_wg', 1)(), {name: 'gold', quantity: 98}, getItem('94_then_wg', 1)(), {name: 'gold', quantity: 1}, getItem('1_then_wg', 1)(), {name: 'gold', quantity: 7}
    peddler(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peddler',
            items: ['spy_o_scope', { name: 'gold', quantity: 100 }],
            max_hp: 100,
            weaponName: 'dagger',
            attackVerb: 'stab',
            coordination: 2,
            agility: 5,
            damage: { sharp: 25 },
            description: 'spy o scope peddler',
            pronouns: pronouns.male,
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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
        }).onDeath(
            actions.declare_war
        ).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse', 'mucky path'] }));
    },

    rock_hydra(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'rock hydra',
            aliases: ['hydra'],
            items: [{ name: 'gold', quantity: 29 }],
            max_hp: 200,
            damage: { blunt: 60, sharp: 5 },
            weaponName: 'his heads',
            description: 'Hydra',
            armor: { blunt: 5 },
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
        });
    },

    nightmare(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'nightmare',
            items: [{ name: 'gold', quantity: 50 }, 'longsword'],
            max_hp: 450,
            damage: { blunt: 112, sharp: 21 },
            weaponName: 'longsword',
            attackVerb: 'slice',
            description: 'nightmare',
            coordination: 9,
            agility: 5,
            armor: { blunt: 28 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
        }).fightMove(async function () {
            // if (Math.random() * 1 < 8) { print('TODO: armorkill') }
        });
    },

    mogrim(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'mogrim',
            items: [{ name: 'gold', quantity: Math.random() * 30 }, 'hardened_club'],
            max_hp: 490,
            damage: { blunt: 56, sharp: 20 },
            weaponName: 'hardened club',
            attackVerb: 'club',
            description: 'mogrim',
            coordination: 5,
            agility: 3,
            armor: { blunt: 36 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 30;
        })
    },

    reaper(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'reaper',
            items: ['scythe', { name: 'gold', quantity: Math.random() * 50 }],
            max_hp: 150,
            damage: { blunt: 0, sharp: 250 },
            weaponName: 'scythe',
            attackVerb: 'slice',
            description: 'reaper',
            coordination: 55,
            agility: 25,
            armor: { blunt: 0 },
            pronouns: pronouns.inhuman,
            attackPlayer: true,
            alignment: 'evil',
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 50;
        })
    },

    goblin_hero(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'goblin hero',
            items: ['jagged_polearm', { name: 'gold', quantity: Math.random() * 56 + 1 }],
            max_hp: 230,
            damage: { blunt: 120, sharp: 70 },
            weaponName: 'jagged polearm',
            attackVerb: 'axe',
            description: 'goblin hero',
            coordination: 12,
            agility: 4,
            armor: { blunt: 26 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
        }).onRespawn(async function () {
            this.item('gold')!.quantity = Math.random() * 56 + 1;
        })
    },

    stone_golem(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'stone golem',
            items: ['warhammer', { name: 'gold', quantity: 19 }],
            max_hp: 120,
            damage: { blunt: 45, sharp: 15 },
            weaponName: 'warhammer',
            attackVerb: 'club',
            description: 'Huge stone golem',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.inhuman,
        });
    },

    wood_troll(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'wood troll',
            pronouns: pronouns.male,
            items: ['club'],
            max_hp: 250,
            damage: { blunt: 52, sharp: 1 },
            weaponName: 'club',
            attackVerb: 'club',
            description: 'wood troll',
            coordination: 15,
            agility: 5,
            armor: { blunt: 16 },
            alignment: 'evil/areaw',
        }).onTurn(
            actions.wander({})
        ).fightMove(actions.call_help('wood_troll'));
    },

    cat_woman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'cat woman',
            items: ['axe_of_the_cat', { name: 'gold', quantity: 25 }],
            max_hp: 400,
            damage: { blunt: 75, sharp: 100 },
            magic_level: 200,
            weaponName: 'axe of the cat',
            attackVerb: 'axe',
            description: 'cat woman',
            coordination: 20,
            agility: 15,
            armor: { blunt: 25, magic: 150 },
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            spellChance: () => Math.random() < 1 / 5,
            respawns: false,
            alignment: 'evil',
        }).fightMove(actions.max_heal)
    },

    megara(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'megara',
            pronouns: pronouns.inhuman,
            items: ['megarian_club', { name: 'gold', quantity: 50 }],
            max_hp: 300,
            damage: { blunt: 200, sharp: 10 },
            weaponName: 'megarian club',
            attackVerb: 'club',
            description: 'megara',
            coordination: 10,
            agility: 0,
            armor: { blunt: 50 },
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    cow(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'cow',
            items: ['side_of_meat'],
            max_hp: 51,
            damage: { blunt: 4, sharp: 4 },
            weaponName: 'horns',
            attackVerb: 'stab',
            description: 'cow',
            coordination: 3,
            agility: 0,
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
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

    bull(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'bull',
            pronouns: pronouns.male,
            items: ['side_of_meat'],
            max_hp: 55,
            damage: { blunt: 8, sharp: 5 },
            weaponName: 'horns',
            attackVerb: 'stab',
            description: 'bull',
            coordination: 4,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    jury_member(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'jury member',
            items: [{ name: 'gold', quantity: 1 }],
            max_hp: 20,
            damage: { blunt: 3, sharp: 0 },
            coordination: 2,
            agility: 3,
            weaponName: 'fist',
            attackVerb: 'club',
            description: 'jury member',
            pronouns: randomChoice([pronouns.male, pronouns.female]),
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

    peasant_elder(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peasant elder',
            pronouns: pronouns.female,
            items: ['magic_ring'],
            respawns: false,
            flags: { 'talk': 0 },
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

    scarecrow_gaurd(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'scarecrow gaurd',
            items: ['pitchfork', { name: 'gold', quantity: 10 }],
            max_hp: 210,
            damage: { blunt: 31, sharp: 57 },
            weaponName: 'pitchfork',
            attackVerb: 'stab',
            description: 'scarecrow gaurd',
            coordination: 4,
            agility: 3,
            armor: { blunt: 6 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
        });
    },

    scarecrow_worker(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'scarecrow worker',
            items: ['pitchfork'],
            max_hp: 130,
            damage: { blunt: 25, sharp: 48 },
            weaponName: 'pitchfork',
            attackVerb: 'stab',
            description: 'scarecrow worker',
            coordination: 3,
            agility: 3,
            armor: { blunt: 1 },
            alignment: 'nice scarecrow',
            pronouns: pronouns.male,
        });
    },

    scarecrow_king(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'scarecrow king',
            items: ['golden_pitchfork', { name: 'gold', quantity: 38 }],
            max_hp: 260,
            damage: { blunt: 43, sharp: 75 },
            weaponName: 'golden pitchfork',
            attackVerb: 'stab',
            description: 'scarecrow king',
            coordination: 5,
            agility: 3,
            armor: { blunt: 12 },
            attackPlayer: true,
            alignment: 'evil',
            pronouns: pronouns.male,
            respawns: false,
        });
    },

    grocer(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'grocer',
            pronouns: pronouns.male,
            items: [
                { name: 'banana', quantity: Infinity },
                { name: 'side_of_meat', quantity: Infinity },
                { name: 'chicken_leg', quantity: Infinity },
                { name: 'satchel_of_peas', quantity: Infinity },
                { name: 'full_ration', quantity: Infinity },
                { name: 'ear_of_corn', quantity: Infinity },
                { name: 'flask_of_wine', quantity: Infinity },
                { name: 'keg_of_wine', quantity: Infinity },
            ],
        }).dialog(async function (player: Character) {
            print("Please ignore my bag boy.  He scares away the majority of our customers.");
            print("Unfortunatley he's my grandson and I can't really fire him.");
            print("If you aren't scared off, please be my guest and read the sign to see what");
            print("we have to offer you.");
        }).onAttack(
            actions.pish2
        ).interaction('buy', actions.buy);
    },

    old_woman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'old woman',
            pronouns: pronouns.female,
            max_hp: 1000,
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

    blobin(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Blobin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 600,
            agility: 10,
            armor: { blunt: 100, sharp: 100, magic: 100, fire: 100, cold: 100, electric: 100 },
            respawns: false,
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
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
                                this.game.addCharacter({ name: 'orc_amazon', location: this.location! }),
                                this.game.addCharacter({ name: 'orc_behemoth', location: this.location! }),
                                this.game.addCharacter({ name: 'orc_behemoth', location: this.location! }),
                                this.game.addCharacter({ name: 'gryphon', location: this.location! })
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
                            await ieadon.fight(player);
                        }
                    }
                    this.game.addCharacter({ name: 'gryphon', location: this.location! })?.onDeath(soldierDown);
                    this.game.addCharacter({ name: 'orc_behemoth', location: this.location! })?.onDeath(soldierDown);
                    this.game.addCharacter({ name: 'orc_behemoth', location: this.location! })?.onDeath(soldierDown);
                    this.game.addCharacter({ name: 'orc_amazon', location: this.location! })?.onDeath(soldierDown);
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

    beggar(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'beggar',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 35,
            coordination: 3,
            agility: 2,
            damage: { blunt: 5, sharp: 0 },
            weaponName: 'fist',
            attackVerb: 'club',
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

    cleric_tendant(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'cleric tendant',
            pronouns: pronouns.male,
            agility: 2,
            max_hp: 100,
            armor: { blunt: 10 },
            weaponName: 'fist',
            attackVerb: 'club',
            coordination: 3,
            damage: { blunt: 4 },
            description: 'cleric tendant',
            aliases: ['cleric'],
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
            await eldfarl.fight(attacker);
        }).interaction('train healing', actions.train({
            skillName: 'healing',
            requirements: (player: Character) => ({
                gold: 20 + player.base_stats.healing * 5 / 8,
                xp: 30 + 15 * player.base_stats.healing
            }),
            classDiscount: {
                'cleric': 50,
            },
            result: (player: Character) => {
                player.base_stats.healing += 1;
                print(`Your healing capabilitys Improved.  Congradulations, you now heal by: ${player.base_stats.healing}`);
            }
        })).interaction('train archery', actions.train({
            skillName: 'archery',
            requirements: (player: Character) => ({
                gold: 10 + player.base_stats.archery / 4,
                xp: 15 + 8 * player.base_stats.archery
            }),
            classDiscount: {
                'cleric': 25,
                'thief': 50
            },
            result: (player: Character) => {
                player.base_stats.archery += 1;
                print(`Your archery skills improved.  Congradulations, you now have Archery: ${player.base_stats.archery}`);
            }
        })).interaction('train mindfulness', actions.train({
            skillName: 'mindfulness',
            requirements: (player: Character) => ({
                gold: 30 + 10 * player.base_stats.max_mp / 50,
                xp: 4 * player.base_stats.max_mp
            }),
            classDiscount: {
                'spellcaster': 30,
                'cleric': 25
            },
            result: (player: Character) => {
                player.base_stats.max_mp += 5;
                print(`Your Mind Improved. Congradulations, your Boerdom Points are now: ${player.base_stats.max_mp}`);
            }
        })).interaction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        });
    },

    blind_hermit(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'blind hermit',
            pronouns: pronouns.male,
            agility: 1,
            max_hp: 30,
            description: 'blind hermit',
            aliases: ['hermit'],
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
                    player.giveItem('list');
                    player.giveItem('amber_chunk');
                }
            }
        }).onAttack(actions.pish2);
    },

    butcher(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'butcher',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 1000,
            damage: { sharp: 20, blunt: 20 },
            armor: { blunt: 20 },
            agility: 100,
            coordination: 10,
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

    adder(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'adder',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 32,
            damage: { blunt: 2, sharp: 10 },
            weaponName: 'fangs',
            attackVerb: 'stab',
            coordination: 6,
            agility: 4,
            description: 'poisonus adder',
            alignment: 'evil',
        }).fightMove(async function () {
            if (Math.random() > 2 / 3) {
                // print('TODO: poison fang')
            }
        });
    },

    bridge_troll(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'bridge troll',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 61,
            damage: { blunt: 16, sharp: 2 },
            coordination: 3,
            agility: 1,
            weaponName: 'huge fists',
            attackVerb: 'club',
            description: 'troll',
            armor: { blunt: 1 },
            aliases: ['troll'],
        }).dialog(async function (player: Character) {
            print("trying to bother me?");
            print("worthless little human...");
            await pause(2);
            print("aarrr... get off my bridge!");
            await this.fight(player);
        });
    },

    swamp_thing(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'swamp thing',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 46,
            damage: { blunt: 15, sharp: 1 },
            coordination: 4,
            agility: 1,
            weaponName: 'whip-like fingers',
            description: 'swamp thing',
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    dryad(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dryad',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 130,
            damage: { blunt: 12, sharp: 5 },
            coordination: 3,
            agility: 1,
            weaponName: 'trunkish arms',
            buff: { times: { defense: { blunt: 2, fire: 1 / 2 }, }, },
            description: 'dryad',
        });
    },

    goblin_soldier(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'goblin soldier',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 21,
            damage: { blunt: 15, sharp: 3 },
            coordination: 2,
            agility: 4,
            weaponName: 'wooden stick',
            attackVerb: 'club',
            items: [{ name: 'gold', quantity: 3 }, 'wooden_stick'],
            description: 'evil looking goblin',
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    goblin_captain(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'goblin captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 48,
            damage: { blunt: 29, sharp: 10 },
            weaponName: 'broadsword',
            attackVerb: 'slice',
            items: [{ name: 'gold', quantity: 9 }, 'broadsword'],
            description: 'horifying goblin captain',
            armor: { blunt: 9 },
            agility: 3,
            coordination: 2,
            attackPlayer: true,
            alignment: 'evil',
        })
    },

    security_guard(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'security guard',
            pronouns: randomChoice([pronouns.male, pronouns.female, pronouns.male]),
            max_hp: 35,
            damage: { blunt: 17, sharp: 7 },
            coordination: 3,
            agility: 2,
            weaponName: 'shortsword',
            attackVerb: 'slice',
            items: ['shortsword'],
            description: 'Ierdale guard',
            armor: { blunt: 2 },
            aliases: ['guard'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
        }).onEncounter(
            actions.defend_tribe
        ).dialog(async function (player: Character) {
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
        }).onDeath(
            actions.declare_war
        ).allowDeparture(async function (character: Character, direction: string) {
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
        }).onAttack(async function (attacker) {
            if (attacker.isPlayer) {
                color(red)
                print("Security Guard -- Colonel Arach!  Help!");
            }
            actions.call_help('colonel_arach').bind(this)()
        })
    },

    snotty_page(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'snotty page',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 20,
            damage: { blunt: 1, sharp: 10 },
            coordination: 5,
            agility: 1,
            weaponName: 'dagger',
            attackVerb: 'stab',
            description: 'snotty ASS page',
            aliases: ['page'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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

    police_chief(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'police chief',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 150,
            damage: { blunt: 65, sharp: 30 },
            weaponName: 'silver sword',
            attackVerb: 'slice',
            items: ['silver_sword', { name: 'gold', quantity: 15 }],
            description: 'Police chief',
            armor: { blunt: 29, sharp: 35 },
            coordination: 7,
            agility: 9,
            aliases: ['chief'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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
        }).onEncounter(
            actions.defend_tribe
        );
    },

    sandworm(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'sandworm',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 450,
            damage: { blunt: 18, sharp: 0 },
            weaponName: 'sand he throws',
            attackVerb: 'club',
            items: [{ name: 'gold', quantity: 7 }],
            description: 'HUGE sandworm',
            coordination: 4,
            agility: 0,
        });
    },

    sand_scout(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'sand scout',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 45,
            damage: { blunt: 0, sharp: 40 },
            weaponName: 'long rapier',
            attackVerb: 'stab',
            items: [{ name: 'gold', quantity: 12 }, 'partial_healing_potion', 'long_rapier'],
            description: 'quick sand scout',
            agility: 7,
            coordination: 10,
            armor: { blunt: 7 },
        });
    },

    hen(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'hen',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 5,
            damage: { blunt: 2, sharp: 0 },
            coordination: 1,
            agility: 3,
            weaponName: 'beak',
            attackVerb: 'stab',
            items: ['chicken_leg'],
            description: 'clucking hen',
        });
    },

    large_rooster(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'large rooster',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 5,
            damage: { blunt: 7, sharp: 2 },
            weaponName: 'claws',
            attackVerb: 'slice',
            items: ['chicken_leg'],
            description: 'furious rooster',
            coordination: 4,
            agility: 2,
            attackPlayer: true,
            alignment: 'evil',
        });
    },

    chief_judge(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'chief judge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 30,
            damage: { blunt: 9, sharp: 0 },
            coordination: 4,
            agility: 1,
            weaponName: 'gavel',
            attackVerb: 'club',
            items: [{ name: 'gold', quantity: 10 }, 'gavel'],
            description: 'Judge',
            aliases: ['judge'],
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

    elite_guard(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'elite guard',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 50,
            damage: { blunt: 22, sharp: 10 },
            weaponName: 'broadsword',
            attackVerb: 'slice',
            items: ['broadsword', { name: 'gold', quantity: 6 }],
            description: 'Ierdale elite',
            coordination: 2,
            agility: 2,
            armor: { blunt: 5 },
            aliases: ['gaurd'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
        }).dialog(async function (player: Character) {
            print("Be careful...");
            print("It is very dangerous here in the desert.");
        }).onDeath(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        )
    },

    dreaugar_dwarf(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dreaugar dwarf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 175,
            damage: { blunt: 90, sharp: 10 },
            weaponName: 'axe',
            attackVerb: 'axe',
            items: [{ name: 'gold', quantity: Math.random() * 15 + 1 }, 'axe'],
            description: 'evil dwarf',
            coordination: 8,
            agility: 5,
            armor: { blunt: 20 },
            attackPlayer: true,
            alignment: 'evil',
        }).fightMove(async function () {
            if (Math.random() < 1 / 5) {
                // heal
                print
            }
        });
    },

    orkin_the_animal_trainer(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Orkin the animal trainer',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 220,
            damage: { blunt: 20, sharp: 10 },
            weaponName: 'fist',
            attackVerb: 'club',
            items: [{ name: 'gold', quantity: 43 }],
            description: 'orkin and his animals',
            coordination: 2,
            agility: 1,
            armor: { blunt: 10 },
            aliases: ['orkin'],
            respawns: false,
        }).dialog(async function (player: Character) {
            print("Echoo Dakeee??  Wul you like to buy some any-mas!");
        }).fightMove(async function () {
            print('TODO: animals')
        });
    },

    lion(game: GameState) {
        const gender = randomChoice(['male', 'female']) as keyof typeof pronouns;
        return new A2dCharacter({
            game: game,
            name: gender == 'male' ? 'lion' : 'lioness',
            pronouns: gender == 'male' ? pronouns.male : pronouns.female,
            max_hp: 155,
            damage: { blunt: 12, sharp: 30 },
            weaponName: 'claws',
            attackVerb: 'slice',
            description: 'Lion',
            coordination: 5,
            agility: 6,
            armor: { blunt: 2 },
            magic_level: 6,
            alignment: 'nice lion',
            spellChance: () => Math.random() < 2 / 3,
        }).dialog(async function (player: Character) {
            color(red);
            // If QBRed = QBDefault Then SetColor QBBlue
            print("      ROAR!");
        }).fightMove(actions.growl);
    },

    mutant_bat(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'mutant bat',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 50,
            damage: { sonic: 20 },
            weaponName: 'high pitched screech',
            attackVerb: 'sonic',
            description: 'mutant bat',
            coordination: 20,
            agility: 10,
            buff: { times: { defense: { sonic: 25 } } },
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                this.game.addCharacter({
                    name: 'mutant_bat', location: this.location!, respawns: false, persist: false
                })?.onTurn(
                    async function () { await this.die() }
                );
            }
        });
    },

    kobalt_captain(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'kobalt captain',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 240,
            damage: { blunt: 10, sharp: 30 },
            weaponName: 'spear',
            attackVerb: 'stab',
            items: [{ name: 'gold', quantity: 12 }, 'spear'],
            description: 'captain',
            coordination: 4,
            agility: 2,
            armor: { blunt: 13 },
            attackPlayer: true,
            alignment: 'evil',
        }).fightMove(async function () {
            if (Math.random() < 2 / 3) {
                if (this.location?.playerPresent) {
                    color(magenta);
                    print("Kobalt Captain calls for reinforcements!");
                }
                this.game.addCharacter({ name: 'kobalt_soldier', location: this.location! });
            }
        });
    },

    kobalt_soldier(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'kobalt soldier',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 50,
            damage: { blunt: 15, sharp: 5 },
            weaponName: 'mace',
            items: [{ name: 'gold', quantity: 5 }, 'mace'],
            description: 'kobalt soldier',
            coordination: 2,
            agility: 3,
            armor: { blunt: 5 },
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
            persist: false,
        })
    },

    bow_maker(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'bow maker',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 65,
            damage: { blunt: 20, sharp: 20 },
            weaponName: 'ballista bolt',
            attackVerb: 'stab',
            description: 'bow fletcher',
            coordination: 2,
            armor: { blunt: 10 },
            items: [{ name: 'arrow', quantity: Infinity }, 'short_bow', 'long_bow', 'composite_bow', 'hand_crossbow', 'crossbow', 'heavy_crossbow'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
        }).dialog(async function (player: Character) {
            print("Hi, want some arrows... OR BOWS!");
        }).onDeath(async function (cause) {
            if (cause instanceof Character && cause.isPlayer) {
                color(red);
                print("This is MURDER! The guards will have your head for this!");
                this.game.player.flags.enemy_of_ierdale = true;
                this.game.player.flags.murders += 1
            }
        }).interaction('buy', actions.buy);
    },

    peasant_man(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peasant man',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 100,
            damage: { sharp: 25 },
            weaponName: 'cudgel',
            items: ['cudgel', { name: 'gold', quantity: 3 }],
            description: 'peasant man',
            coordination: 2,
            armor: { blunt: 4 },
            aliases: ['peasant'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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

    peasant_woman(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peasant woman',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 90,
            damage: { blunt: 0, sharp: 15 },
            weaponName: 'pocket knife',
            attackVerb: 'slice',
            description: 'peasant woman',
            coordination: 2,
            armor: { blunt: 3 },
            aliases: ['peasant'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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

    dog(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dog',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            max_hp: 45,
            damage: { blunt: 10, sharp: 15 },
            weaponName: 'teeth',
            attackVerb: 'bite',
            description: 'yapping dog',
            coordination: 2,
            agility: 2,
            armor: { blunt: 4 },
        }).dialog(async function (player: Character) {
            print("BOW WOW WOW!");
        }).onTurn(actions.wander({ bounds: ['eastern gatehouse', 'western gatehouse', 'northern gatehouse'] }))
    },

    peasant_child(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peasant child',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
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
                        pronouns: { subject: 'you', object: 'yourself', possessive: 'your' },
                        max_hp: player.hp,
                        weaponName: player.equipment['right hand']?.name || 'fist',
                        damage: {
                            blunt: player.strength * (player.equipment['right hand']?.buff?.times?.damage?.blunt || 0),
                            sharp: player.strength * (player.equipment['right hand']?.buff?.times?.damage?.sharp || 0),
                            magic: (player.strength + player.magic_level) * (player.equipment['right hand']?.buff?.times?.damage?.magic || 0),
                        },
                        flags: {
                            'left hand': {
                                damage: {
                                    blunt: player.strength * (player.equipment['right hand']?.buff?.times?.damage?.blunt || 0) * player.offhand,
                                    sharp: player.strength * (player.equipment['right hand']?.buff?.times?.damage?.sharp || 0) * player.offhand,
                                    magic: (player.strength + player.magic_level) * (player.equipment['right hand']?.buff?.times?.damage?.magic || 0) * player.offhand,
                                },
                                name: player.equipment['left hand']?.name || 'fist'
                            }
                        },
                        armor: player.equipment['armor']?.buff?.plus?.defense || { blunt: 0, sharp: 0, magic: 0 },
                        coordination: player.coordination,
                        agility: player.agility,
                        strength: player.strength,
                        magic_level: player.magic_level,
                        game: player.game,
                        respawns: false,
                        persist: false
                    }).fightMove(async function () {
                        player.pronouns.object = 'yourself'
                        console.log('player currently goes by: ', player.name, player.pronouns)
                        if (this.hp < this.max_hp / 2) {
                            color(magenta)
                            print(`${caps(this.name)} heals yourself!`)
                            this.hp += player.healing;
                        } else if (player.class_name == 'spellcaster') {
                            const spell = randomChoice([
                                player.abilities['newbie'] ? 'newbie' : '',
                                player.abilities['bolt'] ? 'bolt' : '',
                                player.abilities['fire'] ? 'fire' : '',
                                player.abilities['blades'] ? 'blades' : ''
                            ].filter(spell => spell))
                            color(brightred)
                            print(`${caps(this.name)} casts ${spell}!`)
                            spells[spell].bind(this)(player)
                        } else {
                            print(`${caps(this.name)} attacks with your other hand!`)
                            this.attack(player, this.flags['left hand']?.name, this.flags['left hand']?.damage)
                        }
                    }).onTurn(async function () {
                        player.pronouns.object = 'you';
                        console.log('evil you is having a turn.')
                    })
                    await this.fight(null)
                    await evil_you.relocate(player.location)
                    await evil_you.fight(player)
                    await player.fight(null)
                    await player.fight(evil_you)
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

    peasant_worker(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'peasant worker',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 190,
            damage: { blunt: 0, sharp: 70 },
            weaponName: 'sickle',
            attackVerb: 'slice',
            description: 'work-hardened peasant',
            coordination: 2,
            agility: 2,
            armor: { blunt: 10 },
            aliases: ['peasant', 'worker'],
            alignment: 'ierdale',
            flags: { enemy_of_orcs: true },
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

    ieadon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Ieadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 1000,
            damage: { blunt: 2000, sharp: 2000, magic: 300 },
            hp_recharge: 0.01, // he won't heal right away
            weaponName: 'glory blade',
            attackVerb: 'slice',
            items: [{ name: 'gold', quantity: 1000 }, 'glory_blade', 'ring_of_ultimate_power'],
            description: 'the ledgendary Ieadon',
            coordination: 35,
            agility: 15,
            armor: { blunt: 100, sharp: 100, magic: 100 },
            magic_level: 20,
            respawns: false,
        }).dialog(async function (player: Character) {
            print("I am the most renound fighter in all the Land.");
            print("Have you heard about thoes rings, thats a PITY!");
            print("**Ieadon grins**");
        }).fightMove(async function () {
            if (Math.random() < 1 / 4) {
                // print('TODO: ring ultimate power')
            }
        }).interaction('train strength', actions.train({
            skillName: 'strength',
            requirements: (player: Character) => ({
                xp: 80 + 25 * player.base_stats.strength,
                gold: 25 + 5 * Math.floor(player.base_stats.strength / 5)
            }),
            classDiscount: { 'fighter': 50, 'thief': 25 },
            result: (player: Character) => {
                player.base_stats.strength += 1;
                if (player.isPlayer) print(`Your raw fighting POWER increased.  Congradulations, your Attack is now: ${player.base_stats.strength}`);
            }
        })).interaction('train stamina', actions.train({
            skillName: 'stamina',
            requirements: (player: Character) => ({
                xp: 2 * player.base_stats.max_sp,
                gold: 15 + 5 * Math.floor(player.base_stats.max_sp / 50)
            }),
            classDiscount: { 'fighter': 25, 'cleric': 25 },
            result: (player: Character) => {
                player.base_stats.max_sp += 5;
                if (player.isPlayer) print(`Your Stamina improved.  Congradulations, it is now: ${player.base_stats.max_sp}`);
            }
        })).interaction('train toughness', actions.train({
            skillName: 'toughness',
            requirements: (player: Character) => ({
                xp: 2 * player.base_stats.max_hp,
                gold: 30 + 10 * Math.floor(player.base_stats.max_hp / 50)
            }),
            classDiscount: { 'fighter': 25 },
            result: (player: Character) => {
                player.base_stats.max_hp += 5;
                if (player.isPlayer) print(`Your toughness increased.  Congradulations your Hit Points are now: ${player.base_stats.max_hp}`);
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
        }).interaction('list', async function () {
            color(black);
            print("At the domain of Ieadon we teach the following:");
            print(" train toughness   | increaces HP");
            print(" train strength    | increases attack damage");
            print(" train stamina     | increases SP");
            print(" To train any of these, please type 'train' then");
            print(" type what to train.");
        }).interaction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        })
    },

    mythin(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Mythin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 550,
            damage: { blunt: 40, sharp: 120, magic: 40 },
            weaponName: 'glowing dagger',
            attackVerb: 'stab',
            items: ['psionic_dagger', { name: 'gold', quantity: 300 }],
            description: 'the outcast Mythin',
            coordination: 25,
            agility: 25,
            armor: { blunt: 30 },
            respawns: false,
            flags: { 'gave_directions': false, 'met_biadon': false },
            spellChance: () => Math.random() < 3 / 5,
            magic_level: 50,
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
        }).interaction('train coordination', actions.train({
            skillName: 'coordination',
            requirements: (player) => ({
                xp: 100 + 150 * player.base_stats.coordination,
                gold: 30 + 20 * player.base_stats.coordination
            }),
            classDiscount: { 'thief': 25, 'fighter': 25 },
            result: (player) => {
                player.base_stats.coordination += 1;
                if (player.isPlayer) print(`Your coordination increased.  Congradulations, it is now: ${player.base_stats.coordination}`);
            }
        })).interaction('train agility', actions.train({
            skillName: 'agility',
            requirements: (player) => ({
                xp: 75 + 150 * player.base_stats.agility,
                gold: 35 + 20 * player.base_stats.agility
            }),
            classDiscount: { 'thief': 50 }, // thief specialty
            result: (player) => {
                player.base_stats.agility += 1;
                if (player.isPlayer) print(`Your agility increased.  Congradulations, it is now: ${player.base_stats.agility}`);
            }
        })).interaction('train offhand', actions.train({
            skillName: 'offhand',
            requirements: (player) => {
                const ambidextrous = player.base_stats.offhand >= 1;
                if (ambidextrous && player.isPlayer) {
                    print("You are already fully ambidextrous.");
                }
                return {
                    xp: 300 + 200 * (1 - player.base_stats.offhand),
                    gold: 35,
                    other: !ambidextrous
                }
            },
            classDiscount: { 'thief': 25, 'fighter': 25 },
            result: (player) => {
                player.base_stats.offhand += Math.min(Math.floor(((1 - player.base_stats.offhand) / 4) * 100 + 1.5) / 100, 1);
                if (player.isPlayer) print(`Your left-handed capabilities increased.  Congradulations, offhand is now: ${Math.floor(player.base_stats.offhand * 100)}%`);
            }
        })).interaction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        }).interaction('list', async function () {
            color(black)
            print("At the domain of Mythin we teach the following:");
            print(" train coordination | increaces to-hit");
            print(" train agility      | decreases enemy to-hit");
            print(" train offhand      | increases left-hand weapon power");
            print(" To train any of these, please type 'train' then");
            print(" type what to train.");
        }).fightMove(actions.heal);
    },

    eldin(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Eldin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 450,
            max_mp: 400,
            damage: { magic: 180 },
            weaponName: 'lightning staff',
            attackVerb: 'electric',
            items: ['lightning_staff', { name: 'gold', quantity: 300 }, 'maple_leaf'],
            description: 'the mystical Eldin',
            coordination: 12,
            agility: 4,
            magic_level: 100,
            armor: { blunt: 29, sharp: 35, magic: 100 },
            powers: { 'powermaxout': 7 },
            respawns: false,
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
            if (this.attackTarget) spells['powermaxout'].bind(this)(this.attackTarget)
        }).interaction('list', async function () {
            color(black)
            print("At the domain of Eldin we teach the following:")
            print(" train mindfulness | increaces BP")
            print(" train healing     | increases healing power")
            print(" train archery     | increases archery skills")
            print(" To train any of these, please type 'train' then")
            print(" type what to train.")
        }).interaction('train magic', actions.train({
            skillName: 'magic',
            requirements: (player) => ({
                xp: 160 + 50 * player.base_stats.magic_level,
                gold: 50 + 10 * player.base_stats.magic_level
            }),
            classDiscount: { 'spellcaster': 50 },
            result: (player) => {
                player.base_stats.magic_level += 1;
                if (player.isPlayer) print(`Your magical abilities increased. Congradulations, your magic level is now: ${player.base_stats.magic_level}`);
            }
        })).interaction('train newbie', actions.train({
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
        })).interaction('train bolt', actions.train({
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
        })).interaction('train fire', actions.train({
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
        })).interaction('train blades', actions.train({
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
        })).interaction('train powermaxout', actions.train({
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
        })).interaction('train shield', actions.train({
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
        })).interaction('train bloodlust', actions.train({
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
        })).interaction('list', async function () {
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
        }).interaction('transport', async function (player) {
            print("Goodbye!")
            await pause(1)
            player.relocate(this.game.find_location("Eldin's house"))
        }).interaction('train', async function (player) {
            color(black)
            print('That class is not taught here.')
        })
    },

    eldfarl(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Eldfarl',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 450,
            damage: { blunt: 90, sharp: 0 },
            weaponName: 'fist',
            items: [{ name: 'gold', quantity: 400 }],
            description: 'the respected Eldfarl',
            coordination: 12,
            agility: 4,
            armor: { blunt: 29 },
            magic_level: 100,
            respawns: false,
            spellChance: () => Math.random() < 3 / 5,
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
        ).interaction('list', async function (player) {
            print("There are no classes offered here.")
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- Go south, that's where the classes are.");
            }
        }).interaction('train', async function (player) {
            print("There are no classes offered here.")
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- Go south, that's where the classes are.");
            }
        }).interaction('healme', async function (player) {
            print("Eldfarl lifts his hands and a remakably calm feeling floats over your body.")
            print(`Eldfarl healed you ${Math.floor(player.max_hp - player.hp)} HP.`)
            player.hp = player.max_hp
        })
    },

    turlin(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Turlin',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 375,
            damage: { blunt: 60, sharp: 0 },
            weaponName: 'huge fists',
            items: ['ring_of_nature'],
            description: 'Turlin',
            armor: { blunt: 4 },
            coordination: 3,
            agility: 1,
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
            exp: 1000
        }).onDeath(async function () {
            color(green);
            print("Defeated, the beast Turlin falls from the platform, crashing into the forest");
            print("canopy far below.");
            pause(2)
            print("He leaves behind just one small item...");
            await pause(3);
        }).interaction('climb down', async function (player: Character) {
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

    henge(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Henge',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 320,
            damage: { blunt: 20, sharp: 50 },
            weaponName: 'longsword',
            attackVerb: 'slice',
            items: [{ name: 'gold', quantity: 25 }, 'longsword', 'ring_of_stone'],
            description: 'Henge',
            armor: { blunt: 10, sharp: 50 },
            buff: { times: { defense: { sharp: 2, blunt: 2 } } },
            coordination: 6,
            agility: 4,
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
            exp: 2000,
        }).onEncounter(async function (player: Character) {
            if (player.isPlayer) {
                color(black)
                print("You stand before Henge, the king of the ogres.  20 feet tall, he looks down");
                print("on you like a snack left on his doorstep.  You feel your stomach drop.");
                await pause(5);
                print("His voice rumbles. \"Good,\" he says. \"I need bones to grind my teeth on.\"");
                print("He looks at you with opal eyes.  His teeth are small boulders of quartz.");
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

    ziatos(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'ziatos',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 750,
            damage: { sharp: 150, magic: 50 },
            weaponName: 'blade of time',
            attackVerb: 'slice',
            items: ['blade_of_time', { name: 'gold', quantity: 125 }, 'ring_of_time'],
            description: 'Ziatos',
            coordination: 20,
            agility: 8,
            speed: 2,
            armor: { blunt: 40 },
            respawns: false,
            alignment: 'evil',
            exp: 5000,
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
            // ierdale will give them another chance
            this.game.player.flags.enemy_of_ierdale = false;
            for (let char of this.game.characters.filter(c => c.alignment == 'ierdale')) {
                char.enemies = char.enemies.filter(e => e != this.game.player.name)
            }
            this.game.addCharacter({ name: 'biadon', location: 78 })
            this.game.find_character('ieadon')?.relocate(this.game.find_location('the void'))
            this.game.find_character('doo dad man')?.giveItem('hang_glider')
            await pause(15)
            color(black, black)
            clear()
            await pause(2)
            color(black, darkwhite)
            clear()
        });
    },

    official(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'official',
            pronouns: { "subject": "she", "object": "her", "possessive": "her" },
            items: [{ name: 'gold', quantity: 25 }, 'long_dagger'],
            description: 'orc official',
            max_hp: 200,
            damage: { blunt: 60, sharp: 100 },
            weaponName: 'long dagger',
            attackVerb: 'stab',
            coordination: 25,
            agility: 12,
            armor: { blunt: 10 },
            alignment: 'orcs',
            spellChance: () => true,
        }).dialog(async function (player: Character) {
            print("Grrr...");
            print("Will ye have a pass?");
            if (player.flags.assistant) {
                color(magenta);
                print("Assistant -- Type \"pass\" if you want one.");
            }
        }).fightMove(
            actions.heal
        ).interaction('pass', async function (player: Character) {
            if (!player.has('gold', 1000)) {
                color(gray); print("You cannot afford a pass here.");
                return;
            } else if (player.flags.enemy_of_orcs) {
                print('You burned that bridge, buddy. Get lost.')
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
            player.flags.enemy_of_orcs = false;
            player.removeItem('gold', 1000);
        });
    },

    wisp(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'wisp',
            pronouns: { "subject": "it", "object": "it", "possessive": "its" },
            max_hp: 110,
            damage: { blunt: 10, sonic: 150 },
            weaponName: 'piercing scream',
            attackVerb: 'sonic',
            description: 'wandering wisp',
            coordination: 100,
            agility: 10,
            buff: { times: { defense: { blunt: 10, sharp: 10 } } },
            alignment: 'evil',
            attackPlayer: true,
        }).onTurn(
            actions.wander({ bounds: ['250', 'corroded gate'] })
        )
    },

    biadon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'Biadon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 30000,
            damage: { blunt: 10, sharp: 0 },
            weaponName: 'fist',
            attackVerb: 'club',
            description: 'evasive Biadon',
            coordination: 1,
            agility: 32000,
            armor: { blunt: 32000 },
            respawns: false,
        }).dialog(async function (player: Character) {
            print("Hehehehehe.");
            print("Me, holding The Ring of Ultimate Power???  Kahahaha.");
            print("You poor fool, my BROTHER holds the ring!!!");
            pause((5));
            print("Can you figure out who he is?");
            print("KAKAKAKAKAKAKAKA");
            this.game.flags.biadon = true;
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
            this.game.addCharacter({ name: 'orc_emissary', location: 197 })
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
                const soldier = await this.game.addCharacter({ name: 'ierdale_soldier', location: 284 })
                await soldier?.goto(dispatches[i])
            }
            for (let i = 0; i < 11; i++) {
                this.game.addCharacter({ name: 'ierdale_patrol', location: 284 })
            }
            this.game.addCharacter({ name: 'security_guard', location: 'center of town' })
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
            this.game.addCharacter({ name: 'general_gant', location: "Ierdale Barracks" })
            this.game.addCharacter({ name: 'general_kerry', location: "Ieadon's house" })
            this.game.find_character('guard captain')?.goto('45')
        });
    },

    cyclops(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'cyclops',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 860,
            damage: { blunt: 174, sharp: 5 },
            weaponName: 'uprooted tree',
            items: [],
            description: 'towering cyclops',
            coordination: 9,
            agility: -1,
            armor: { blunt: 26 },
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
        }).onDeath(async function () {
            color(green);
            print("  --  towering cyclops dropped uprooted tree.");
            // I1(501) = 7
            // B_n$(211) = "X"
            // End If
        });
    },

    dragon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'dragon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 1300,
            damage: { blunt: 40, sharp: 166 },
            weaponName: "sharp claws",
            attackVerb: "sword",
            items: [],
            description: 'fire-breathing dragon',
            coordination: 5,
            agility: -3,
            armor: { blunt: 60 },
            attackPlayer: true,
            alignment: 'evil',
            respawns: false,
        }).fightMove(async function () {
            if (Math.random() < 1 / 2) {
                color(yellow)
                if (this.location?.playerPresent) {
                    print(`A wave of fire erupts from ${this.name}, heading toward ${this.attackTarget?.name}!`)
                    let dam = highRandom(this.magic_level)
                    dam = this.attackTarget!.modify_damage(dam, 'fire')
                    this.describeAttack(this.attackTarget!, 'scorching breath', 'fire', dam)
                    await this.attackTarget!.hurt(dam, this)
                }
            }
        })
    },

    giant_scorpion(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'giant scorpion',
            pronouns: { "subject": "It", "object": "it", "possessive": "its" },
            max_hp: 100,
            damage: { blunt: 15, sharp: 6 },
            weaponName: 'poison stinger',
            attackVerb: 'stab',
            description: 'scorpion',
            coordination: 5,
            agility: -1,
            armor: { blunt: 15 },
            alignment: 'evil',
            items: [],
        });
    },

    mutant_hedgehog(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'mutant hedgehog',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 100,
            damage: { blunt: 6, sharp: 15 },
            weaponName: 'horns',
            attackVerb: 'stab',
            description: 'mutant hedgehog',
            coordination: 0,
            agility: 18,
            armor: { blunt: 25 },
            alignment: 'evil',
            items: [],
        }).fightMove(async function () {
            if (Math.random() < 1 / 3) {
                if (this.attackTarget?.isPlayer) {
                    print("Mutant hedgehog shoots its poisoned spikes at you!")
                } else if (this.location?.playerPresent) {
                    print("Mutant hedgehog shoots its poisoned spikes at " + this.attackTarget?.name + "!")
                }
                let dam = highRandom(50)
                dam = this.attackTarget?.modify_damage(dam, 'sharp') || 0
                dam = this.attackTarget?.modify_damage(dam, 'poison') || 0
                console.log('poison damage =', dam)
                let currentPoison = this.attackTarget?.getBuff('poison')?.power || 0;
                currentPoison += Math.max(dam, 0);
                if (currentPoison) this.attackTarget?.addBuff(getBuff('poison')({ power: currentPoison, duration: currentPoison }))
            }
        });
    },

    ogre(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'ogre',
            pronouns: pronouns.male,
            items: ['club'],
            max_hp: 120,
            damage: { blunt: 20, sharp: 0 },
            weaponName: 'club',
            attackVerb: 'club',
            description: 'giant ogre',
            coordination: 2,
            agility: 1,
            armor: { blunt: 2 },
            alignment: 'evil',
        });
    },

    path_demon(game: GameState) {
        const monsterOptions = [this.ogre, this.mutant_hedgehog, this.giant_scorpion]
        return randomChoice(monsterOptions)(
            game
        ).onRespawn(async function () {
            this.game.removeCharacter(this)
            this.game.addCharacter({ name: 'path_demon', location: this.location! })
            console.log(`path demon respawned as ${this.location?.character('path_demon')?.name}`)
        }).onTurn(
            actions.wander({ bounds: ['96', '191', 'meadow', 'bog'] })
        )
    },

    grizzly_bear(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'grizzly bear',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 350,
            damage: { blunt: 60, sharp: 6 },
            weaponName: 'massive paws',
            attackVerb: 'club',
            description: 'grizzly bear',
            coordination: 15,
            agility: 1,
            armor: { blunt: 2 },
            alignment: 'B_a$(a) + "areaw',
            spellChance: () => Math.random() < 2 / 3,
        }).fightMove(actions.growl);
    },

    striped_bear(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'striped bear',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 250,
            damage: { blunt: 42, sharp: 5 },
            weaponName: 'heavy paws',
            attackVerb: 'club',
            description: 'striped bear',
            coordination: 15,
            agility: 10,
            armor: { blunt: 5 },
            spellChance: () => Math.random() < 1 / 2,
            aliases: ['bear'],
            alignment: 'areaw',
        }).dialog(async function (player: Character) {
            print("Striped bear sniffs at you curiously.");
        }).fightMove(actions.growl);
    },

    tiger(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'tiger',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 400,
            damage: { blunt: 40, sharp: 30 },
            weaponName: 'sharp claws',
            attackVerb: 'slice',
            description: 'ferocious tiger',
            coordination: 25,
            agility: 18,
            armor: { blunt: 5 },
            spellChance: () => Math.random() < 1 / 2,
            alignment: 'evil/areaw',
        }).fightMove(
            actions.growl
        );
    },

    wolf(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'wolf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 80,
            damage: { blunt: 12, sharp: 35 },
            weaponName: 'teeth',
            attackVerb: 'bite',
            description: 'wolf',
            coordination: 15,
            agility: 11,
            armor: { blunt: 0 },
            spellChance: () => Math.random() < 1 / 2,
        }).dialog(async function (player: Character) {
            print("grrrr...");
        }).fightMove(actions.howl);
    },

    rabid_wolf(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'rabid wolf',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 60,
            damage: { blunt: 12, sharp: 45 },
            weaponName: 'teeth',
            attackVerb: 'bite',
            description: 'rabid wolf',
            coordination: 5,
            agility: 0,
            armor: { blunt: 0 },
            powers: {
                'poison fang': 1,
            },
            attackPlayer: true,
            alignment: 'evil',
        }).onTurn(actions.wander({}));
    },

    gryphon(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'gryphon',
            pronouns: { "subject": "he", "object": "him", "possessive": "his" },
            max_hp: 64,
            armor: { blunt: 9 },
            coordination: 5,
            agility: 8,
            damage: { blunt: 19, sharp: 16 },
            weaponName: 'talons',
            attackVerb: 'slice',
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
            size: 0
        }).onAttack(
            actions.declare_war
        ).onEncounter(
            actions.defend_tribe
        ).fightMove(
            actions.call_help('orcish_soldier', 'orc_amazon', 'orc_behemoth', 'gryphon')
        )
    },

    voidfish(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'voidfish',
            description: 'slithering voidfish',
            pronouns: pronouns.inhuman,
            max_hp: 164,
            armor: { blunt: 9 },
            buff: { times: { defense: { 'sharp': 1 / 2, 'blunt': 2 } } },
            coordination: 5,
            agility: 8,
            damage: { sharp: 160 },
            weaponName: 'needle teeth',
            attackVerb: 'bite',
            alignment: 'evil',
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }));
    },

    wraith(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'wraith',
            pronouns: pronouns.inhuman,
            max_hp: 640,
            buff: { times: { defense: { 'fire': 0.1, 'electric': 0.2, 'blunt': 10, 'sharp': 100, 'magic': 10, 'cold': 10, 'poison': 10, 'sonic': 2 }, }, },
            coordination: 27,
            agility: 4,
            damage: { magic: 160 },
            weaponName: 'blood-curdling shriek',
            attackVerb: 'sonic',
            alignment: 'evil',
            chase: true,
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }));
    },

    voidrat(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'void rat',
            pronouns: pronouns.inhuman,
            max_hp: 400,
            damage: { blunt: 60, sharp: 40 },
            coordination: 5,
            agility: 2,
            weaponName: 'teeth',
            attackVerb: 'bite',
            description: 'monstrous rat',
            alignment: 'evil',
        }).onTurn(actions.wander({ bounds: ['the end'], frequency: 1 }))
    },

    grogren(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: 'grogren',
            pronouns: pronouns.male,
            max_hp: 500,
            damage: { blunt: 0, sharp: 100 },
            weaponName: 'spear',
            attackVerb: 'stab',
            items: ['spear'],
            coordination: 10,
            agility: 10,
            armor: { blunt: 20, sharp: 20 },
            alignment: 'orcs',
            flags: { enemy_of_ierdale: true },
        }).dialog(async function (player: Character) {
            if (!this.game.flags.biadon) {
                print("Hi, nice day.  The tention between us and Ierdale is very high right now.");
            } else {
                print("HELP!  We are in desperate need of a General to lead an attack on Ierdale.");
                print("You look reasonably strong... Talk to my brother Blobin if you are interested.");
            }
        }).onEncounter(
            actions.defend_tribe
        ).fightMove(
            actions.call_help('orcish_soldier')
        ).onTurn(async function () {
            if (this.game.flags.orc_battle && !this.fighting) {
                this.goto('center of town')
            }
        });
    },

    mythins_employee(game: GameState) {
        return new A2dCharacter({
            game: game,
            name: "mythin's employee",
            pronouns: pronouns.male,
            aliases: ['employee'],
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

// function isValidCharacter(key: string): key is CharacterNames {
//     return key in characters;
// }

// function getCharacter(charName: CharacterNames, game: GameState, args?: any): A2dCharacter {
//     if (!characters[charName]) {
//         console.log(`Character "${charName}" not found`);
//         throw new Error(`Character "${charName}" not found`);
//     }
//     // console.log(`Creating character: ${charName}`);
//     const char = characters[charName]({ game: game, ...args });
//     char.key = charName;
//     return char
// }

export { A2dCharacter, A2dCharacterParams, characters, actions };
