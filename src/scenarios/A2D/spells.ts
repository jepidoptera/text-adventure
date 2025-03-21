import { Character, DamageTypes } from '../../game/character.js';
import { A2dCharacter } from './characters.js';
import { brightred, black, gray, magenta } from '../../game/colors.js';
import { getBuff } from './buffs.js';
import { AttackDescriptors } from '../../game/item.js';
import { highRandom, randomChoice, caps } from '../../game/utils.js';
type SpellAction = (this: A2dCharacter, target: Character) => Promise<void>;
const abilityLevels = ["None", "Novice", "Ameteur", "Competent", "Proficient", "Adept", "Expert", "Master", "Ultimate"]
const spellPower = 1.0860331325016919

const spells: Record<string, SpellAction> = {
    newbie: async function (this: A2dCharacter, target: Character) {
        if (!checkRequirements.call(this, 'newbie', (2 + this.abilities['newbie']) / 4)) return;
        if (this.isPlayer) this.game.print(`<brightred>You send a bolt of sputtering newbie magic at ${target.name}.`);
        await damageSpell({
            spellName: 'newbie',
            damage: highRandom() * (((this.abilities['newbie'] || 1) ** spellPower + 1) / 3) * this.magic_level + Math.random() * 7,
            accuracy: Math.random() * (this.coordination + (this.abilities['newbie'] || 1) / 3),
            damageType: 'magic',
            attackVerb: 'magic',
        }).call(this, target)
    },
    // I want bolt, fire and blades to be relatively on a par with each other.
    // they'll differ more qualitatively than quantitatively.
    bolt: async function (this: A2dCharacter, target: Character) {
        // bolt is low cost, low damage, high accuracy.
        if (!checkRequirements.call(this, 'bolt', 4 + this.abilities['bolt'] / 2)) return;
        if (this.isPlayer) this.game.print(`<brightred>A jagged flash of lightning strikes towards ${target.name}.`);
        await damageSpell({
            spellName: 'bolt',
            damage: highRandom() * (1 + (this.abilities['bolt'] || 1) ** spellPower * 11 / 14) * this.magic_level + Math.random() * 5,
            accuracy: Math.random() * (1.5 + this.coordination * (1.5 + (this.abilities['bolt'] || 1) / 5)),
            damageType: 'electric',
            attackVerb: 'electric',
        }).call(this, target)
    },
    fire: async function (this: A2dCharacter, target: Character) {
        // fire is medium cost, medium damage, medium accuracy.
        if (!checkRequirements.call(this, 'fire', 8 + this.abilities['fire'])) return;
        if (this.isPlayer) this.game.print(`<brightred>A jet of flame shoots towards ${target.name}.`);
        await damageSpell({
            spellName: 'magic fire',
            damage: highRandom() * (4 + (this.abilities['fire'] || 1) ** spellPower * 14 / 11) * this.magic_level,
            accuracy: Math.random() * (this.coordination + 2 + (this.abilities['fire'] || 1) / 3),
            damageType: 'fire',
            attackVerb: 'fire',
            damage_overflow: 0.5
        }).call(this, target)
    },
    blades: async function (this: A2dCharacter, target: Character) {
        // blades is high cost, high damage, low accuracy.
        if (!checkRequirements.call(this, 'blades', 13 + this.abilities['blades'] * 11 / 7)) return;
        if (this.isPlayer) this.game.print(`<brightred>Blades sprout from your fingers and hurtle towards ${target.name}.`);
        await damageSpell({
            spellName: 'blades',
            damage: highRandom() * (5 + (this.abilities['blades'] || 1) ** spellPower * 2) * this.magic_level,
            accuracy: Math.random() * (Math.max(this.coordination - 1, 1) + (this.abilities['blades'] || 1) / 5),
            attackVerb: 'blades',
            damageType: 'sharp',
            damage_overflow: 0.8
        }).call(this, target)
    },
    powermaxout: async function (this: A2dCharacter, target: Character) {
        // maximum cost, very high damage, very high accuracy.
        const mp = this.mp
        if (!checkRequirements.call(this, 'powermaxout', Math.max(this.mp, 50))) return;
        if (this.isPlayer) this.game.print(`<brightred>A booming wave of ULTIMATE POWER rolls towards ${target.name}.`);
        await damageSpell({
            spellName: 'powermaxout',
            damage: highRandom() * (7 + mp / 25 * (this.abilities['powermaxout'] || 1) ** spellPower) * this.magic_level,
            accuracy: highRandom() * 2 * (this.coordination + (this.abilities['powermaxout'] || 1) * 2),
            attackVerb: 'magic',
            damageType: 'magic',
            damage_overflow: 1
        }).call(this, target)
    },
    shield: async function (this: A2dCharacter) {
        if (!this.abilities['shield']) {
            if (this.isPlayer) this.game.print("You don't know that spell.");
            return;
        }
        const power = 7 + (this.abilities['shield'] ** spellPower * 2) * this.magic_level / 7
        const duration = (3 + this.abilities['shield']) * 10
        const existingShield = this.getBuff('shield')
        const magicCost = (3 + this.abilities['shield']) * 2 * (existingShield ? 1 - existingShield.duration / duration : 1)
        if (this.mp < magicCost) {
            if (this.isPlayer) this.game.print("You are too bored!");
            return;
        }
        this.mp -= magicCost;
        this.addBuff(getBuff('shield')({
            power: power,
            duration: duration
        }));
        this.game.print("An invisible barrier shimmers into place, protecting you from harm.")
    },
    bloodlust: async function (this: A2dCharacter) {
        if (!this.abilities['bloodlust']) {
            if (this.isPlayer) this.game.print("You don't know that spell.");
            return;
        }
        let magicCost = 10
        let power = 6 + (this.abilities['bloodlust'] ** spellPower) * this.magic_level / 5
        let duration = (3 + this.abilities['bloodlust']) * 10
        let maxCost = 6 + this.abilities['bloodlust'] * 2
        if (this.mp < maxCost) {
            power *= this.mp / maxCost
            duration = Math.floor(duration * this.mp / maxCost)
            if (this.flags.assistant && this.max_mp < maxCost) {
                this.game.print("<magenta>Assistant -- You don't have enough magic to cast bloodlust at full power.")
            }
            magicCost = this.mp;
        } else magicCost = maxCost
        if (this.mp < magicCost) {
            if (this.isPlayer) this.game.print("You are too bored!");
            return;
        }
        this.mp -= magicCost;
        this.addBuff(getBuff('bloodlust')({
            power: power,
            duration: duration
        }));
        if (this.isPlayer) this.game.print("You chant a few words and you feel the bloodlust seeping into your veins.")
    }
}

function checkRequirements(this: A2dCharacter, spellName: string, magicCost: number): boolean {
    if (!this.isPlayer) return true;
    if (!this.abilities[spellName]) {
        // if (this.isPlayer) 
        this.game.print("You don't know that spell.");
        return false;
    } else if (this.mp < magicCost) {
        // if (this.isPlayer) 
        this.game.print("You don't have enough magic.");
        return false;
    } else if (!this.attackTarget) {
        // if (this.isPlayer) 
        this.game.print("There is no target for that spell.");
        return false;
    }
    this.mp -= magicCost;
    return true;
}

function damageSpell({ spellName, damage, accuracy, damageType, attackVerb, damage_overflow = 0, casualties = [] }: {
    spellName: string,
    damage: number,
    accuracy: number,
    attackVerb: AttackDescriptors,
    damageType: DamageTypes,
    damage_overflow?: number,
    casualties?: Character[]
}) {
    return async function (this: A2dCharacter, target: Character) {
        // console.log(this.abilities)
        let hit = accuracy > target.evasion;
        if (!hit) {
            console.log(`${target.name} dodges ${spellName}!`)
            const otherEnemies = this.location?.characters.filter(character => {
                (character.enemies.includes(this.name) || this.enemies.includes(character.name)) && !casualties.includes(character) && character !== target
            }) || []
            for (const char of otherEnemies) {
                if (Math.random() * char.agility < Math.random() * otherEnemies.length) {
                    this.game.print(`${caps(spellName)} misses ${target.name} and hits ${char.name} instead!`)
                    target = char;
                    hit = true;
                    break;
                }
            }
        }
        if (hit) {
            damage = Math.max(target.modify_incoming_damage(damage, damageType), 0);
            console.log(`${target.name} is hit by ${spellName} for ${damage} ${damageType} damage!`)
        } else {
            this.print(`<black>${caps(spellName)} misses ${target.name}.`);
            return;
        }
        if (this.location?.playerPresent) {
            this.game.color(damage ? black : gray)
            this.game.print(this.describeAttack(target, spellName, attackVerb, damage, false))
        }
        if (damage >= target.hp) {
            casualties.push(target)
            damage = (damage - target.hp) * damage_overflow
            console.log(`${target.name} is dead from ${spellName}!`)
            if (damage_overflow) {
                const otherEnemies = this.location?.characters.filter(character => (this.hasEnemy(character) || character.hasEnemy(this)) && !casualties.includes(character)) || []
                console.log(`damage overflows to ${otherEnemies.length} remaining enemies`)
                const newTarget = randomChoice(otherEnemies)
                if (newTarget) {
                    await damageSpell({ spellName, damage, accuracy, damageType, attackVerb: attackVerb, damage_overflow, casualties }).call(this, newTarget)
                } else { damage = 0 }
            } else { damage = 0 }
        } else {
            target.hurt({
                'blunt': damageType == 'blunt' ? damage : 0,
                'sharp': damageType == 'sharp' ? damage : 0,
                'electric': damageType == 'electric' ? damage : 0,
                'fire': damageType == 'fire' ? damage : 0,
                'magic': damageType == 'magic' ? damage : 0,
                'cold': damageType == 'cold' ? damage : 0,
                'poison': damageType == 'poison' ? damage : 0,
                'sickness': damageType == 'sickness' ? damage : 0,
                'sonic': damageType == 'sonic' ? damage : 0,
                'acid': damageType == 'acid' ? damage : 0,
            }, this);
            damage = 0;
        }
        if (damage == 0 && casualties.length > 0) {
            // all damage potential is expended
            for (const char of casualties) {
                await char.die(this);
            }
            await this.slay(casualties)
        }
    }
}
export { spells, abilityLevels };
