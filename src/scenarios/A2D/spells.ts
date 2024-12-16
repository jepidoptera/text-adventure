import { Character, DamageTypes } from '../../game/character.js';
import { A2dCharacter } from './characters.js';
import { brightred, black, gray, magenta } from './colors.js';
import { getBuff } from './buffs.js';
import { WeaponTypes } from '../../game/item.js';
import { highRandom } from '../../game/utils.js';
type SpellAction = (this: A2dCharacter, target: Character) => Promise<void>;
const abilityLevels = ["Novice", "Ameteur", "Competent", "Proficient", "Adept", "Expert", "Master", "Grand Master"]
const spellPower = 1.0860331325016919

const spells: Record<string, SpellAction> = {
    newbie: async function (target: Character) {
        if (!checkRequirements.call(this, 'newbie', (2 + this.abilities['newbie']) / 3)) return;
        color(brightred);
        if (this.isPlayer) print(`You send a bolt of sputtering newbie magic at ${target.name}.`);
        await damageSpell({
            spellName: 'newbie',
            damage: highRandom() * (((this.abilities['newbie'] || 1) ** spellPower + 1) / 3) * this.magic_level + Math.random() * 3,
            accuracy: Math.random() * (this.coordination + (this.abilities['newbie'] || 1) / 3),
            damageType: 'magic',
            weaponType: 'magic',
        }).call(this, target)
    },
    // I want bolt, fire and blades to be relatively on a par with each other.
    // they'll differ more qualitatively than quantitatively.
    bolt: async function (target: Character) {
        // bolt is low cost, low damage, high accuracy.
        if (!checkRequirements.call(this, 'bolt', 3 + this.abilities['bolt'])) return;
        color(brightred);
        if (this.isPlayer) print(`A jagged flash of lighning strikes towards ${target.name}.`);
        await damageSpell({
            spellName: 'bolt',
            damage: highRandom() * (1.5 + (this.abilities['bolt'] || 1) ** spellPower * 11 / 14) * this.magic_level + Math.random() * 5,
            accuracy: Math.random() * (1.5 + this.coordination * (1.5 + (this.abilities['bolt'] || 1) / 5)),
            damageType: 'electric',
            weaponType: 'electric',
        }).call(this, target)
    },
    fire: async function (this: A2dCharacter, target: Character) {
        // fire is medium cost, medium damage, medium accuracy.
        if (!checkRequirements.call(this, 'fire', 6 + this.abilities['fire'] * 2)) return;
        color(brightred);
        if (this.isPlayer) print(`A jet of flame shoots towards ${target.name}.`);
        await damageSpell({
            spellName: 'fire',
            damage: highRandom() * (1 + (this.abilities['fire'] || 1) ** spellPower) * this.magic_level,
            accuracy: Math.random() * (this.coordination + 2 + (this.abilities['fire'] || 1) / 3),
            damageType: 'fire',
            weaponType: 'fire',
        }).call(this, target)
    },
    blades: async function (this: A2dCharacter, target: Character) {
        // blades is high cost, high damage, low accuracy.
        if (!checkRequirements.call(this, 'blades', 10 + this.abilities['blades'] * 3)) return;
        color(brightred);
        if (this.isPlayer) print(`Blades sprout from your fingers and hurtle towards ${target.name}.`);
        await damageSpell({
            spellName: 'blades',
            damage: highRandom() * (1 + (this.abilities['blades'] || 1) ** spellPower * 1.25) * this.magic_level,
            accuracy: Math.random() * (Math.max(this.coordination - 1, 1) + (this.abilities['blades'] || 1) / 5),
            weaponType: 'blades',
            damageType: 'sharp',
        }).call(this, target)
    },
    powermaxout: async function (this: A2dCharacter, target: Character) {
        // maximum cost, very high damage, very high accuracy.
        if (!checkRequirements.call(this, 'powermaxout', Math.max(this.mp, 50))) return;
        color(brightred);
        if (this.isPlayer) print(`$A booming wave of ULTIMATE POWER rolls towards ${target.name}.`);
        await damageSpell({
            spellName: 'powermaxout',
            damage: highRandom() * (this.mp / 25 * (this.abilities['powermaxout'] || 1) ** spellPower) * this.magic_level,
            accuracy: highRandom() * 2 * (this.coordination + (this.abilities['powermaxout'] || 1) * 2),
            weaponType: 'magic',
            damageType: 'magic'
        }).call(this, target)
    },
    shield: async function (this: A2dCharacter) {
        if (!this.abilities['shield']) {
            if (this.isPlayer) print("You don't know that spell.");
            return;
        }
        const power = 7 + (this.abilities['shield'] ** spellPower * 2) * this.magic_level / 7
        const duration = 3 + this.abilities['shield']
        const existingShield = this.getBuff('shield')
        const magicCost = (3 + this.abilities['shield']) * 2 * (existingShield ? 1 - existingShield.duration / duration : 1)
        if (this.mp < magicCost) {
            if (this.isPlayer) print("You are too bored!");
            return;
        }
        this.mp -= magicCost;
        this.addBuff(getBuff('shield')({
            power: power,
            duration: duration
        }));
        print("An invisible barrier shimmers into place, protecting you from harm.")
    },
    bloodlust: async function (this: A2dCharacter) {
        if (!this.abilities['bloodlust']) {
            if (this.isPlayer) print("You don't know that spell.");
            return;
        }
        let magicCost = 10
        let power = 6 + (this.abilities['bloodlust'] ** spellPower) * this.magic_level / 5
        let duration = 3 + this.abilities['bloodlust']
        let maxCost = 6 + this.abilities['bloodlust'] * 2
        if (this.mp < maxCost) {
            power *= this.mp / maxCost
            duration = Math.floor(duration * this.mp / maxCost)
            if (this.flags.assistant && this.max_mp < maxCost) {
                color(magenta)
                print("Assistant -- You don't have enough magic to cast bloodlust at full power.")
            }
            magicCost = this.mp;
        } else magicCost = maxCost
        if (this.mp < magicCost) {
            if (this.isPlayer) print("You are too bored!");
            return;
        }
        this.mp -= magicCost;
        this.addBuff(getBuff('bloodlust')({
            power: power,
            duration: duration
        }));
        print("You chant a few words and you feel the bloodlust seeping into your veins.")
    }
}

function checkRequirements(this: A2dCharacter, spellName: string, magicCost: number): boolean {
    if (!this.isPlayer) return true;
    if (!this.abilities[spellName]) {
        if (this.isPlayer) print("You don't know that spell.");
        return false;
    } else if (this.mp < magicCost) {
        if (this.isPlayer) print("You don't have enough magic.");
        return false;
    } else if (!this.fighting) {
        if (this.isPlayer) print("There is no target for that spell.");
        return false;
    }
    this.mp -= magicCost;
    return true;
}

function damageSpell({ spellName, damage, accuracy, damageType, weaponType }: {
    spellName: string,
    damage: number,
    accuracy: number,
    weaponType: WeaponTypes,
    damageType: DamageTypes
}) {
    return async function (this: A2dCharacter, target: Character) {
        // console.log(this.abilities)
        const hit = accuracy > target.evasion;
        if (!hit) {
            damage = -1;
        } else {
            damage = Math.max(this.damage_modifier(damage, damageType), 0);
        }
        color(damage ? black : gray)
        print(this.describeAttack(target, spellName, weaponType, damage, false))
        await target.hurt(damage, damageType, this);
        if (target.dead) {
            console.log(`${target.name} is dead from ${spellName}!`)
            await this.slay(target);
        }
    }
}
export { spells, abilityLevels };
