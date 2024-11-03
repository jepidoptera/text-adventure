import { Character, DamageTypes } from '../../game/character.js';
import { A2dCharacter } from './characters.js';
import { brightred, black, gray, magenta } from './colors.js';
import { getBuff } from './buffs.js';
import { WeaponTypes } from '../../game/item.js';
type AttackAction = (this: A2dCharacter, target: Character) => Promise<void>;
const abilityLevels = ["Novice", "Ameteur", "Competent", "Proficient", "Adept", "Expert", "Master", "Grand Master"]
const spellPower = 1.0860331325016919

const spells: Record<string, AttackAction> = {
    newbie: async function (target: Character) {
        await damageSpell({
            spellName: 'newbie',
            magicCost: (this.abilities['newbie'] + 2) / 3,
            damage: Math.sqrt(Math.random()) * ((this.abilities['newbie'] ** spellPower + 1) / 3) * this.magic_level + Math.random() * 3,
            accuracy: Math.random() * (this.coordination + this.abilities['newbie'] / 3),
            damageType: 'magic',
            weaponType: 'magic',
            description: "You send a bolt of sputtering newbie magic at"
        }).call(this, target)
    },
    // I want bolt, fire and blades to be relatively on a par with each other.
    // they'll differ more qualitatively than quantitatively.
    bolt: async function (target: Character) {
        await damageSpell({
            spellName: 'bolt',
            magicCost: 3 + this.abilities['bolt'],
            damage: Math.sqrt(Math.random()) * (1.5 + this.abilities['bolt'] ** spellPower * 11 / 14) * this.magic_level + Math.random() * 5,
            accuracy: Math.random() * (1.5 + this.coordination * (1.5 + this.abilities['bolt'] / 5)),
            damageType: 'electric',
            weaponType: 'electric',
            description: "A jagged flash of lighning strikes towards"
        }).call(this, target)
    },
    fire: async function (this: A2dCharacter, target: Character) {
        // fire is medium cost, medium damage, medium accuracy.
        await damageSpell({
            spellName: 'fire',
            magicCost: 6 + this.abilities['fire'] * 2,
            damage: Math.sqrt(Math.random()) * (1 + this.abilities['fire'] ** spellPower) * this.magic_level,
            accuracy: Math.random() * (this.coordination + 2 + this.abilities['fire'] / 3),
            damageType: 'fire',
            weaponType: 'fire',
            description: "A jet of flame shoots towards"
        }).call(this, target)
    },
    blades: async function (this: A2dCharacter, target: Character) {
        // blades is high cost, high damage, low accuracy.
        await damageSpell({
            spellName: 'blades',
            magicCost: 10 + this.abilities['blades'] * 3,
            damage: Math.sqrt(Math.random()) * (1 + this.abilities['blades'] ** spellPower * 1.25) * this.magic_level,
            accuracy: Math.random() * (Math.max(this.coordination - 1, 1) + this.abilities['blades'] / 5),
            weaponType: 'blades',
            damageType: 'sharp',
            description: "Blades sprout from your fingers and hurtle towards"
        }).call(this, target)
    },
    powermaxout: async function (this: A2dCharacter, target: Character) {
        // maximum cost, very high damage, very high accuracy.
        await damageSpell({
            spellName: 'powermaxout',
            magicCost: Math.max(this.mp, 50),
            damage: Math.sqrt(Math.random()) * (this.mp / 25 * this.abilities['powermaxout'] ** spellPower) * this.magic_level,
            accuracy: Math.sqrt(Math.random()) * 2 * (this.coordination + this.abilities['powermaxout'] * 2),
            weaponType: 'magic',
            damageType: 'magic',
            description: "A booming wave of ULTIMATE POWER rolls towards"
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

function damageSpell({ spellName, magicCost, damage, accuracy, damageType, weaponType, description }: {
    spellName: string,
    magicCost: number,
    damage: number,
    accuracy: number,
    weaponType: WeaponTypes,
    damageType: DamageTypes,
    description: string
}) {
    return async function (this: A2dCharacter, target: Character) {
        // console.log(this.abilities)
        if (!this.abilities[spellName]) {
            if (this.isPlayer) print("You don't know that spell.");
            return;
        } else if (this.mp < magicCost) {
            if (this.isPlayer) print("You don't have enough magic.");
            return;
        } else if (!this.fighting) {
            if (this.isPlayer) print("There is no target for that spell.");
            return;
        }
        this.mp -= magicCost;
        const hit = accuracy > target.evasion;
        if (!hit) {
            damage = -1;
        } else {
            damage = Math.max(this.damage_modifier(damage, damageType), 0);
        }
        color(brightred);
        print(`${description} ${target.name}.`);
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
