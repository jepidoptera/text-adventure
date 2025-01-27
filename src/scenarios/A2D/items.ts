import { Item, ItemParams } from "../../game/item.js";
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from "../../game/colors.js";
import { Character, Buff } from "../../game/character.js";
import { getBuff } from "./buffs.js";
import { musicc$ } from "./utils.js";
import { lineBreak } from "../../game/utils.js";
import { GameState } from "../../game/game.js";

const items = {
    gold(game: GameState) {
        return new Item({
            name: 'gold',
            size: 0.005,
            value: 1,
            game: game || 1
        }).displayName(function () {
            return `${this.quantity} gold`
        }).on_acquire(async function (player) {
            this.game.color(yellow)
        })
    },
    pile_of_gold(game: GameState) {
        return new Item({
            name: 'pile of gold',
            value: 1,
            size: 0.02,
            game: game,
        }).on_acquire(async function (player) {
            player.giveItem('gold', this.quantity ?? 1)
            player.removeItem(this, player.itemCount(this.name))
            this.game.color(yellow)
            this.game.print(`Got ${this.quantity ?? 0} GP`)
            this.displayName(function () { return '' })
        }).displayName(function () {
            return this.name;
        })
    },
    arrow(game: GameState) {
        return new Item({
            name: 'arrow',
            value: 1,
            size: 0.1,
            game: game,
        })
    },
    toy_sword(game: GameState) {
        return new Item({
            name: 'toy sword',
            value: 1,
            size: 0.5,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 0.5, sharp: 0, } } },
            game: game
        })
    },
    shortsword(game: GameState) {
        return new Item({
            name: 'shortsword',
            description: '',
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 0.5, sharp: 2.5, } } },
            value: 13,
            size: 1.4,
            game: game
        })
    },

    // Consumables
    ear_of_corn(game: GameState) {
        return new Item({
            name: 'corn ear',
            description: 'an ear of corn',
            value: 1,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 8.5
            player.recoverStats({ sp: 12 })
        })
    },
    satchel_of_peas(game: GameState) {
        return new Item({
            name: 'satchel of peas',
            description: 'a satchel of peas',
            value: 11,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 10
            player.recoverStats({ sp: 10 })
        })
    },
    banana(game: GameState) {
        return new Item({
            name: 'banana',
            description: 'a banana',
            value: 4,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 8
            player.recoverStats({ sp: 8 })
        })
    },
    side_of_meat(game: GameState) {
        return new Item({
            name: 'side of meat',
            description: 'a side of meat',
            value: 18,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 80
            player.recoverStats({ sp: 60 })
        })
    },
    chicken_leg(game: GameState) {
        return new Item({
            name: 'chicken leg',
            size: 0.2,
            value: 8,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 10
            player.recoverStats({ sp: 20 })
        })
    },
    dog_steak(game: GameState) {
        return new Item({
            name: 'dog steak',
            size: 0.8,
            value: 15,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 40
            player.recoverStats({ sp: 40 })
        })
    },
    asparagus(game: GameState) {
        return new Item({
            name: 'asparagus',
            size: 0.1,
            value: 11,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 30
            player.recoverStats({ sp: 30, hp: 5 })
        })
    },
    muffin(game: GameState) {
        return new Item({
            name: 'muffin',
            size: 0.3,
            value: 6,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 15
            player.recoverStats({ sp: 15 })
        })
    },
    wheel_of_cheese(game: GameState) {
        return new Item({
            name: 'wheel of cheese',
            size: 1.5,
            value: 20,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 40
            player.recoverStats({ sp: 40 })
            player.mp += 5
        })
    },
    full_ration(game: GameState) {
        return new Item({
            name: 'full ration',
            size: 0.8,
            value: 22,
            game: game
        }).on_eat(async function (player) {
            player.recoverStats({ sp: 40 });
            player.hunger -= 40;
        })
    },
    giraffe_gizzard(game: GameState) {
        return new Item({
            name: 'giraffe gizzard',
            size: 1,
            value: 0,
            game: game
        }).addAction('eat giraffe gizzard', async function (player) {
            this.game.print('You gobble down the disgusting, slimy organ.  It tastes like a mix of')
            this.game.print('rotten fish and charcoal, but something compels you to eat it, and')
            this.game.print('eat it all.  You feel a little sick.')
            await this.game.pause(5)
            this.game.print("Too late, you realize: GIRAFFES DON'T HAVE GIZZARDS!")
            this.game.print("What did you just eat??")
            await this.game.pause(3)
            this.game.print("Whatever it was, it was poisonous.")
            await this.game.pause(2)
            player.die('giraffe gizzard')
        })
    },
    loaf_of_bread(game: GameState) {
        return new Item({
            name: 'loaf of bread',
            size: 0.5,
            value: 10,
            game: game
        }).on_eat(async function (player) {
            player.recoverStats({ sp: 10 })
            player.hunger -= 20
        })
    },
    mushroom(game: GameState) {
        return new Item({
            name: 'mushroom',
            size: 0.2,
            value: 50,
            game: game
        }).on_eat(async function (player) {
            player.hunger -= 5
        })
    },
    "magic acorn"(game: GameState) {
        return new Item({
            name: 'magic acorn',
            size: 0.1,
            value: 0,
            game: game
        }).on_eat(async function (player) {
            player.recoverStats({ mp: player.max_hp, sp: player.max_sp, hp: player.max_mp })
            player.hunger = Math.min(player.hunger, 0)
        })
    },
    "serpent horn"(game: GameState) {
        return new Item({
            name: 'serpent horn',
            size: 1,
            value: 155,
            game: game
        })
    },
    bug_repellent(game: GameState) {
        return new Item({
            name: 'bug repellent',
            size: 0.1,
            value: 0,
            game: game
        }).on_drink(async function (player) {
            this.game.print("hmmm... that bug repellent tasted surprisingly good.")
            await this.game.pause(2)
            this.game.print("suddenly you feel an itching in you chest.")
            await this.game.pause(1.5)
            this.game.print("Now it has become a bubbling.")
            await this.game.pause(1.5)
            this.game.print("Oh no it is...")
            await this.game.pause(1.5)
            this.game.color('red')
            this.game.print("THE DREADED LUNG BOIL DISEASE!!!")
            await this.game.pause(2)
            player.die('bug repellent')
        })
    },
    flask_of_wine(game: GameState) {
        return new Item({
            name: 'flask of wine',
            value: 25,
            game: game
        }).on_drink(async function (player) {
            player.mp += 20;
        })
    },
    keg_of_wine(game: GameState) {
        return new Item({
            name: 'keg of wine',
            size: 1.5,
            value: 45,
            game: game
        }).on_drink(async function (player) {
            player.mp += 40;
        })
    },
    nip_of_gin(game: GameState) {
        return new Item({
            name: 'nip of gin',
            size: 0.4,
            value: 37,
            game: game
        }).on_drink(async function (player) {
            player.mp += 30;
        })
    },
    barrel_of_grog(game: GameState) {
        return new Item({
            name: 'barrel of grog',
            size: 3.5,
            value: 100,
            game: game
        }).on_drink(async function (player) {
            player.mp += 100;
        })
    },
    "mostly healing potion"(game: GameState) {
        return new Item({
            name: 'mostly healing potion',
            size: 0.4,
            value: 10,
            game: game
        }).on_drink(async function (player) {
            player.hp += player.max_hp / 2;
        })
    },
    "partial healing potion"(game: GameState) {
        return new Item({
            name: 'partial healing potion',
            size: 0.4,
            value: 5,
            game: game
        }).on_drink(async function (player) {
            player.hp += player.max_hp / 4;
        })
    },
    "full healing potion"(game: GameState) {
        return new Item({
            name: 'full healing potion',
            size: 0.4,
            value: 30,
            game: game
        }).on_drink(async function (player) {
            player.hp = player.max_hp;
        })
    },
    poison(game: GameState) {
        return new Item({
            name: 'poison',
            size: 0.4,
            value: 0,
            game: game
        }).on_drink(async function (player) {
            this.game.print('You die.')
            player.die('poison')
        })
    },
    healing_potion(game: GameState) {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 25,
            size: 0.4,
            game: game
        }).on_drink(async function (player) {
            player.recoverStats({ hp: 10 });
        })
    },
    clear_liquid(game: GameState) {
        return new Item({
            name: 'clear liquid',
            description: 'a clear liquid',
            value: 1,
            size: 0.5,
            game: game
        }).on_drink(async function (player) {
            player.die('clear liquid');
        })
    },
    red_liquid(game: GameState) {
        return new Item({
            name: 'red liquid',
            description: 'a red liquid',
            value: 1,
            size: 0.5,
            game: game
        }).on_drink(async function (player) {
            player.die('red liquid');
        })
    },
    blue_liquid(game: GameState) {
        return new Item({
            name: 'blue liquid',
            description: 'a blue liquid',
            value: 1,
            size: 0.5,
            game: game
        }).on_drink(async function (player) {
            player.die('blue liquid');
        })
    },
    dark_sword(game: GameState) {
        return new Item({
            name: 'dark sword',
            size: 3.5,
            value: 110,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 3.0, sharp: 3.0 } } },
            game: game
        })
    },
    battle_axe(game: GameState) {
        return new Item({
            name: 'battle axe',
            size: 1,
            value: 55,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 2.0, sharp: 3.0 } } },
            game: game
        })
    },
    scythe(game: GameState) {
        return new Item({
            name: 'scythe',
            size: 2.0,
            value: 43,
            attackVerb: 'slice',
            buff: { times: { damage: { sharp: 4.5 } } },
            game: game
        })
    },
    hand_axe(game: GameState) {
        return new Item({
            name: 'hand axe',
            size: 1.0,
            value: 19,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 1.5, sharp: 2.0 } } },
            game: game
        })
    },
    axe_of_the_cat(game: GameState) {
        return new Item({
            name: 'axe of the cat',
            size: 5.0,
            value: 402,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 2.2, sharp: 3.2, magic: 1.5 } } },
            game: game
        })
    },
    axe(game: GameState) {
        return new Item({
            name: 'axe',
            size: 2.0,
            value: 28,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 2.0, sharp: 2.0 } } },
            game: game
        })
    },
    lightning_staff(game: GameState) {
        return new Item({
            name: 'lightning staff',
            size: 2.0,
            value: 950,
            attackVerb: 'electric',
            buff: { times: { damage: { blunt: 2.0, magic: 7.0 } } },
            game: game
        })
    },
    crossbow(game: GameState) {
        return new Item({
            name: 'crossbow',
            size: 1.6,
            value: 455,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 13.0, sharp: 50.0 } } },
            game: game
        })
    },
    hand_crossbow(game: GameState) {
        return new Item({
            name: 'hand crossbow',
            size: 1.0,
            value: 84,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 8.0, sharp: 25.0 } } },
            game: game
        })
    },
    short_bow(game: GameState) {
        return new Item({
            name: 'short bow',
            size: 0.8,
            value: 35,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 6.0, sharp: 18.0 } } },
            game: game
        })
    },
    ballista(game: GameState) {
        return new Item({
            name: 'ballista',
            size: 4.5,
            value: 5000,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 140.0, sharp: 234.0 } } },
            game: game
        })
    },
    pocket_ballista(game: GameState) {
        return new Item({
            name: 'pocket ballista',
            size: 1.5,
            value: 2000,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 40.0, sharp: 134.0 } } },
            game: game
        })
    },
    heavy_crossbow(game: GameState) {
        return new Item({
            name: 'heavy crossbow',
            size: 2.0,
            value: 890,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 24.0, sharp: 60.0 } } },
            game: game
        })
    },
    composite_bow(game: GameState) {
        return new Item({
            name: 'composite bow',
            size: 2.4,
            value: 2000,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 15.0, sharp: 58.0 } } },
            game: game
        }).on_use(async function (player) {
            this.buff!.plus = { damage: { blunt: 15.0 + player.strength, sharp: 58.0 + player.strength } }
        })
    },
    long_bow(game: GameState) {
        return new Item({
            name: 'long bow',
            size: 1.3,
            value: 210,
            attackVerb: 'bow',
            equipment_slot: 'bow',
            buff: { plus: { damage: { blunt: 8.0, sharp: 44.0 } } },
            game: game
        })
    },
    mighty_warhammer(game: GameState) {
        return new Item({
            name: 'mighty warhammer',
            size: 4.0,
            value: 110,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 7.0 } } },
            requirements: { strength: 30 },
            game: game
        })
    },
    club(game: GameState) {
        return new Item({
            name: 'club',
            size: 1,
            value: 4,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.0 } } },
            game: game
        })
    },
    cudgel(game: GameState) {
        return new Item({
            name: 'club',
            size: 1.5,
            value: 7,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.7 } } },
            game: game
        })
    },
    hardened_club(game: GameState) {
        return new Item({
            name: 'hardened club',
            size: 2.0,
            value: 10,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 3.3 } } },
            game: game
        })
    },
    warhammer(game: GameState) {
        return new Item({
            name: 'warhammer',
            size: 2.4,
            value: 34,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 4.0 } } },
            game: game
        })
    },
    flail(game: GameState) {
        return new Item({
            name: 'flail',
            size: 1.4,
            value: 14,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 3.0, sharp: 0.5 } } },
            game: game
        })
    },
    fist(game: GameState) {
        return new Item({
            name: 'fist',
            size: 1,
            value: 0,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 1.0 } } },
            game: game
        })
    },
    wooden_stick(game: GameState) {
        return new Item({
            name: 'wooden stick',
            size: 1,
            value: 4,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.5 } } },
            game: game
        })
    },
    morning_star(game: GameState) {
        return new Item({
            name: 'morning star',
            size: 1,
            value: 20,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.0, sharp: 2.0 } } },
            game: game
        })
    },
    metal_bar(game: GameState) {
        return new Item({
            name: 'metal bar',
            size: 1.5,
            value: 9,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 3.0 } } },
            game: game
        })
    },
    megarian_club(game: GameState) {
        return new Item({
            name: 'megarian club',
            size: 1,
            value: 250,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 6.0 } } },
            game: game
        })
    },
    spiked_club(game: GameState) {
        return new Item({
            name: 'spiked club',
            size: 1.5,
            value: 12,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.0, sharp: 1.0 } } },
            game: game
        })
    },
    long_rapier(game: GameState) {
        return new Item({
            name: 'long rapier',
            size: 1.5,
            value: 22,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 3.5 } } },
            game: game
        })
    },
    dagger(game: GameState) {
        return new Item({
            name: 'dagger',
            size: 0.5,
            value: 5,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 2.0 } } },
            game: game
        })
    },
    heavy_spear(game: GameState) {
        return new Item({
            name: 'heavy spear',
            size: 1,
            value: 59,
            attackVerb: 'stab',
            buff: { times: { damage: { blunt: 1.0, sharp: 4.0 } } },
            game: game
        })
    },
    long_dagger(game: GameState) {
        return new Item({
            name: 'long dagger',
            size: 0.8,
            value: 8,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 2.5 } } },
            game: game
        })
    },
    mighty_gigasarm(game: GameState) {
        return new Item({
            name: 'mighty gigasarm',
            size: 1,
            value: 5350,
            attackVerb: 'axe',
            buff: {
                times: { damage: { blunt: 1.92, sharp: 7.44, magic: 2.4 } },
                plus: { coordination: 4, agility: 2 }
            },
            game: game
        })
    },
    trident(game: GameState) {
        return new Item({
            name: 'trident',
            size: 1,
            value: 125,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 6.2 } } },
            game: game
        })
    },
    mighty_warfork(game: GameState) {
        return new Item({
            name: 'mighty warfork',
            size: 6.5,
            value: 4160,
            attackVerb: 'stab',
            buff: {
                times: { damage: { blunt: 3.1, sharp: 5.0, magic: 1.0 } },
                plus: { healing: 20, sp_recharge: 0.1 }
            },
            requirements: { strength: 30 },
            game: game
        })
    },
    steel_polearm(game: GameState) {
        return new Item({
            name: 'steel polearm',
            size: 2.5,
            value: 35,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 1.0, sharp: 3.2 } } },
            game: game
        })
    },
    lance(game: GameState) {
        return new Item({
            name: 'lance',
            size: 1,
            value: 83,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 5.0 } } },
            game: game
        })
    },
    spear(game: GameState) {
        return new Item({
            name: 'spear',
            size: 2.0,
            value: 32,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 4.0 } } },
            game: game
        })
    },
    rapier(game: GameState) {
        return new Item({
            name: 'rapier',
            size: 1.0,
            value: 14,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 3.0 } } },
            game: game
        })
    },
    jagged_polearm(game: GameState) {
        return new Item({
            name: 'jagged polearm',
            size: 3.0,
            value: 58,
            attackVerb: 'axe',
            buff: { times: { damage: { blunt: 1.5, sharp: 3.5 }, coordination: 1.2 } },
            game: game
        })
    },
    psionic_dagger(game: GameState) {
        return new Item({
            name: 'psionic dagger',
            size: 2.0,
            value: 764,
            attackVerb: 'stab',
            buff: { times: { damage: { sharp: 3.0, magic: 3.0 } } },
            game: game
        })
    },
    halberd(game: GameState) {
        return new Item({
            name: 'halberd',
            size: 2.0,
            value: 67,
            attackVerb: 'axe',
            buff: {
                times: {
                    damage: { blunt: 1.9, sharp: 3.7 },
                    coordination: 1.1
                }
            },
            game: game
        })
    },
    crystal_ultima_blade(game: GameState) {
        return new Item({
            name: 'crystal ultima blade',
            size: 1,
            value: 740,
            attackVerb: 'sword',
            buff: { times: { damage: { sharp: 7.77 } } },
            game: game
        })
    },
    glory_blade(game: GameState) {
        return new Item({
            name: 'glory blade',
            size: 8.5,
            value: 29661,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 10.0, sharp: 10.0, magic: 1 }, strength: 2, coordination: 2 } },
            game: game
        })
    },
    mighty_excalabor(game: GameState) {
        return new Item({
            name: 'mighty excalabor',
            size: 6.5,
            value: 5150,
            attackVerb: 'sword',
            buff: {
                times: { damage: { blunt: 2.75, sharp: 6.5, magic: 2.5 } },
                plus: { strength: 15, max_sp: 50 }
            },
            requirements: { strength: 30 },
            game: game
        })
    },
    scimitar(game: GameState) {
        return new Item({
            name: 'scimitar',
            size: 1.4,
            value: 40,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 0.2, sharp: 3.8 } } },
            game: game
        })
    },
    silver_sword(game: GameState) {
        return new Item({
            name: 'silver sword',
            size: 3.5,
            value: 150,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 2.0, sharp: 4.0 } } },
            game: game
        })
    },
    broadsword(game: GameState) {
        return new Item({
            name: 'broadsword',
            size: 2.0,
            value: 20,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 0.5, sharp: 3.0 } } },
            game: game
        })
    },
    longsword(game: GameState) {
        return new Item({
            name: 'longsword',
            size: 3.0,
            value: 42,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 1.0, sharp: 3.5 } } },
            game: game
        })
    },
    blade_of_time(game: GameState) {
        return new Item({
            name: 'blade of time',
            size: 3.0,
            value: 1314,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 2.0, sharp: 4.0, magic: 3.0 } } },
            game: game
        })
    },
    claymoore(game: GameState) {
        return new Item({
            name: 'claymoore',
            size: 5.0,
            value: 52,
            attackVerb: 'sword',
            buff: { times: { damage: { blunt: 3.0, sharp: 2.0 } } },
            game: game
        })
    },
    channeled_blade(game: GameState) {
        return new Item({
            name: 'channeled blade',
            size: 4.0,
            value: 365,
            attackVerb: 'sword',
            buff: { times: { damage: { magic: 0.75, sharp: 11.0 } } },
            game: game
        })
    },
    acid(game: GameState) {
        return new Item({
            name: 'acid',
            size: 1,
            value: 80,
            game: game
        })
    },
    adilons_colorful_history(game: GameState) {
        return new Item({
            name: 'adilon\'s colorful history',
            size: 1,
            value: 50,
            game: game
        })
    },
    amber_chunk(game: GameState) {
        return new Item({
            name: 'amber chunk',
            size: 0.5,
            value: 0,
            game: game
        })
    },
    ballista_bolt(game: GameState) {
        return new Item({
            name: 'ballista bolt',
            size: 0.5,
            value: 16,
            game: game
        })
    },
    boar_tusk(game: GameState) {
        return new Item({
            name: 'boar tusk',
            size: 1,
            value: 45,
            game: game
        })
    },
    camera(game: GameState) {
        return new Item({
            name: 'camera',
            size: 1,
            value: 65,
            game: game
        })
    },
    citrus_jewel(game: GameState) {
        return new Item({
            name: 'citrus jewel',
            size: 1,
            value: 1000,
            game: game
        })
    },
    cure(game: GameState) {
        return new Item({
            name: 'cure',
            size: 1,
            value: 110,
            game: game
        })
    },
    draught_of_visions(game: GameState) {
        return new Item({
            name: 'draught of visions',
            size: 1,
            value: 140,
            game: game
        })
    },
    ear_plugs(game: GameState) {
        return new Item({
            name: 'ear plugs',
            size: 1,
            value: 20,
            game: game
        })
    },
    earth_potion(game: GameState) {
        return new Item({
            name: 'earth potion',
            size: 0.4,
            value: 0,
            game: game
        }).on_use(async function (player) {
            if (player.location && player.location.landmarks?.map(landmark => landmark.key).includes('slash_in_the_earth')) {
                this.game.print("You drop the potion into the crevice.")
                await this.game.pause(2)
                this.game.print("The earth shakes beneath you as the crevice seals itself shut.")
                player.location.removeLandmark('slash_in_the_earth')
                player.removeItem(this, 1)
            } else {
                this.game.print("You aren't supposed to use that here.")
            }
        })
    },
    enhanced_club(game: GameState) {
        return new Item({
            name: 'enhanced club',
            size: 1,
            value: 17,
            game: game
        })
    },
    flute(game: GameState) {
        return new Item({
            name: 'flute',
            size: 1,
            value: 100,
            game: game
        })
    },
    gold_potion(game: GameState) {
        return new Item({
            name: 'gold potion',
            size: 1,
            value: 500,
            game: game
        })
    },
    gold_sludge(game: GameState) {
        return new Item({
            name: 'gold sludge',
            size: 1,
            value: 50,
            game: game
        })
    },
    gold_watch(game: GameState) {
        return new Item({
            name: 'gold watch',
            size: 1,
            value: 60,
            game: game
        })
    },
    golden_pitchfork(game: GameState) {
        return new Item({
            name: 'golden pitchfork',
            size: 1,
            value: 48,
            game: game
        })
    },
    hang_glider(game: GameState) {
        return new Item({
            name: 'hang glider',
            size: 1,
            value: 350,
            game: game
        })
    },
    horn(game: GameState) {
        return new Item({
            name: 'horn',
            size: 1,
            value: 200,
            game: game
        })
    },
    how_to_kill_things(game: GameState) {
        return new Item({
            name: 'how to kill things',
            size: 1,
            value: 50,
            game: game
        })
    },
    jespridge_feather(game: GameState) {
        return new Item({
            name: 'jespridge feather',
            size: 1,
            value: 30,
            game: game
        })
    },
    jespridge_horn(game: GameState) {
        return new Item({
            name: 'jespridge horn',
            size: 1,
            value: 100,
            game: game
        })
    },
    leather_armor(game: GameState) {
        return new Item({
            name: 'leather armor',
            size: 4,
            value: 30,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 4, 'sharp': 7, 'magic': 1 } } }
        })
    },
    studded_leather(game: GameState) {
        return new Item({
            name: 'studded leather',
            size: 4,
            value: 60,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 4, 'sharp': 14, 'magic': 3 } } }
        })
    },
    light_chainmail(game: GameState) {
        return new Item({
            name: 'light chainmail',
            size: 4,
            value: 100,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 5, 'sharp': 22, 'magic': 3 } } }
        })
    },
    chain_mail(game: GameState) {
        return new Item({
            name: 'chain mail',
            size: 5,
            value: 220,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 6, 'sharp': 28, 'magic': 4 } } }
        })
    },
    banded_mail(game: GameState) {
        return new Item({
            name: 'banded mail',
            size: 6,
            value: 420,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 15, 'sharp': 26, 'magic': 20 } } }
        })
    },
    light_plate(game: GameState) {
        return new Item({
            name: 'light plate',
            size: 7,
            value: 900,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 20, 'sharp': 40, 'magic': 5 } } }
        })
    },
    full_plate(game: GameState) {
        return new Item({
            name: 'full plate',
            size: 8,
            value: 2000,
            equipment_slot: 'armor',
            game: game,
            buff: { plus: { defense: { 'blunt': 35, 'sharp': 54, 'magic': 10 } } }
        })
    },
    list(game: GameState) {
        return new Item({
            name: 'list',
            size: 0.1,
            value: 0,
            game: game
        }).on_read(async function (player) {
            this.game.print("This apears to be torn from a book.")
            this.game.print("In scrawled handwriting the list reads:")
            this.game.print()
            this.game.print(" The mixing of these ingredients will")
            this.game.print(" create a potion ledgend holds as one")
            this.game.print(" capable of healing the very earth on ")
            this.game.print(" which we stand:")
            this.game.print()
            this.game.print(" 1 - maple leaf")
            this.game.print(" 1 - spritzer hair")
            this.game.print(" 1 - ochre stone from Forest of Theives")
            this.game.print(" 1 - music box")
            this.game.print(" - some clear liquid")
            this.game.print()
            this.game.print("Find a pot and, 'mix potion'")
        })
    },
    map(game: GameState) {
        return new Item({
            name: 'map',
            size: 0.1,
            value: 0,
            game: game
        }).on_read(async function (player) {
            this.game.print([
                ' !----------------------------------------------------------------------------!',
                ' !                               <green, black>▓▓&▓▓▓▓▓▓▓▓▓<black, darkwhite>                                 !',
                ' !                           <green, black>▓▓▓▓▓▓▓▓▓▓▓▓▓&▓▓▓▓▓<black, darkwhite>                              !',
                ' !                         <green, black>▓▓▓▓▓Forest of▓▓▓▓▓&▓▓▓▓<black, darkwhite>                           !',
                ' !                            <green, black>▓▓▓Thieves▓▓▓▓▓▓▓▓<black, darkwhite>                              !',
                ' !                          <green, black>▓▓▓&▓▓▓▓▓▓▓▓▓▓▓▓<black, darkwhite>                                  !',
                ' !                                    <gray, black>▥<black, darkwhite>                                       !',
                ' !                                    |---farm->                              !',
                ' !                          security--|--barracks     <darkwhite, orange>░░░░░░░░░░░░░░░<black, darkwhite>         !',
                ' !               <brightgreen, gray>▒▒▒▒▒▒▒▒▒<black, darkwhite>     books--|--pets         <darkwhite, orange>░░░░░░░░░░░░░░░░░░<black, darkwhite>      !',
                ' !              <brightgreen, gray>▒swamp▒▒▒▒<black, darkwhite>   pawnshop-|--grocer        <darkwhite, orange>░░░░░Desert░░░░░░░░<black, darkwhite>    !',
                ' !             <brightgreen, gray>▒▒▒▒▒▒▒▒▒▒▒▒▒<black, darkwhite>  /\\   /\\ |--blacksmith      <darkwhite, orange>░░░░░░░░░░░░░░░<black, darkwhite>      !',
                ' !  <green>"  "<black>                |     ██ ↑ ██ |                            |          !',
                ' !  <green>grass<black> ------------<gray, black>▥<black, darkwhite>-------clubmen-<red>X<black><-<white>you are here-<gray, black>▥<black, darkwhite>---//---------<gray>castle<black>-> !',
                ' !  <green>" land "<black> |              | /\\ ↓ /\\ |        |      |          |            !',
                ' !    <green>" "<black>    |              O ██   ██ |        B      F          |            !',
                ' !           |              a         |        e      e        Path           !',
                ' !     <darkwhite, gray>^/  ^ <black>|  <, darkwhite>            k   .     | Eldin--e      r          |            !',
                ' !    <darkwhite, gray>^/     ^/  <black, darkwhite>           |         |        t      n st.     of            !',
                ' !   <darkwhite, gray> Mountains    <black, darkwhite>         |--alley--|        |-alley-          |            !',
                ' !   <darkwhite, gray>/     /^     ^\\<black, darkwhite>        st.                st.    |         Nod           !',
                ' !     <darkwhite, gray>^      /  <black, darkwhite>                                  Doo Dad       |            !',
                ' !                                                   Man         |            !',
                ' !                                                               ?            !',
                ' !----------------------------------------------------------------------------!',
            ].join('\n'))
            await this.game.getKey()
        })
    },
    lute_de_lumonate(game: GameState) {
        return new Item({
            name: 'lute de lumonate',
            size: 0.3,
            value: 0,
            game: game
        }).addAction('play lute', async function (player: Character) {
            this.game.color(blue)
            this.game.print("You lift the beautiful lute to your lips, and unleash a tune...")
            if (player.attackTarget?.name.toLowerCase() == 'sift') {
                this.game.print(musicc$(10))
                this.game.print()
                this.game.color(magenta)
                this.game.print("Sift falters, entranced by the music.")
                await this.game.pause(1)
                this.game.print("His attack fell!")
                await this.game.pause(1)
                player.attackTarget.addBuff(
                    new Buff({
                        name: 'power drain',
                        duration: Math.floor(Math.random() * 5) + 1,
                        plus: { damage: { blunt: -10, sharp: -50 }, agility: -10 }
                    }).onExpire(async function () {
                        this.game.color(magenta)
                        this.game.print("Sift shakes off the trance of the lute.")
                    })
                )
            }
        })
    },
    mace(game: GameState) {
        return new Item({
            name: 'mace',
            size: 1,
            value: 20,
            game: game,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 3.7 } } }
        })
    },
    magic_ring(game: GameState) {
        return new Item({
            name: 'magic ring',
            size: 0.05,
            value: 900,
            game: game
        })
    },
    mana_draught(game: GameState) {
        return new Item({
            name: 'mana draught',
            size: 1,
            value: 400,
            game: game
        })
    },
    maple_leaf(game: GameState) {
        return new Item({
            name: 'maple leaf',
            size: 0.05,
            value: 0,
            game: game
        })
    },
    mighty_megaraclub(game: GameState) {
        return new Item({
            name: 'mighty megaraclub',
            size: 1,
            value: 500,
            game: game
        })
    },
    monogrammed_pen(game: GameState) {
        return new Item({
            name: 'monogrammed pen',
            size: 1,
            value: 100,
            game: game
        })
    },
    music_box(game: GameState) {
        return new Item({
            name: 'music box',
            size: 0.3,
            value: 200,
            game: game
        })
    },
    ochre_stone(game: GameState) {
        return new Item({
            name: 'ochre stone',
            size: 0.5,
            value: 110,
            game: game
        })
    },
    pitchfork(game: GameState) {
        return new Item({
            name: 'pitchfork',
            size: 1,
            value: 20,
            game: game
        })
    },
    portal_detector(game: GameState) {
        return new Item({
            name: 'portal detector',
            size: 1,
            value: 265,
            game: game
        })
    },
    potions_of_clout(game: GameState) {
        return new Item({
            name: 'potions of clout',
            size: 1,
            value: 8000,
            game: game
        })
    },
    quarterstaff(game: GameState) {
        return new Item({
            name: 'quarterstaff',
            size: 1,
            value: 12,
            game: game
        })
    },
    rake(game: GameState) {
        return new Item({
            name: 'rake',
            size: 1,
            value: 20,
            game: game
        })
    },
    recipe(game: GameState) {
        return new Item({
            name: 'recipe',
            size: 0.1,
            value: 0,
            game: game
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                this.game.color(magenta)
                this.game.print("Assistant -- You should read that. (type \"read recipe\")")
            }
        }).on_read(async function (player) {
            this.game.color(black, white)
            this.game.color(black, white); this.game.print("____________________________", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|   GRANDMAS BUG FORMULA   |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|      X-Tra bonus         |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|                          |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|\"hope it kills the bugs   |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("| before it kills you\"     |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|             - Grandma    |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|INGREDIENTS:              |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("| - 1 giraffe gizzard      |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("| - 1 spritzer hair        |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("| - some blue liquid       |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|                          |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|When you have everything, |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|find a mixing pot and type|", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|      'mix potion'        |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|         ENJOY!           |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|__________________________|", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|SURGEON GENERALS WARNING: |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|Do not eat for fear of the|", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print("|lung-boil disease.        |", 1); this.game.color(black, darkwhite); this.game.print()
            this.game.color(black, white); this.game.print(" \\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/ ", 1); this.game.color(black, darkwhite); this.game.print()
            if (player?.flags.assistant) {
                this.game.color(magenta);
                this.game.print("   --ASSISTANT: The ingredients for this are scattered around town.");
            }
        })
    },
    ring_of_dreams(game: GameState) {
        return new Item({
            name: 'ring of dreams',
            description: 'With this ring, you can bring dreams into reality.',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            game: game
        }).on_equip(async function (player) {
            player.addBuff(getBuff('dreams')({ power: 100, duration: -1 }))
        }).on_remove(async function (player) {
            player.removeBuff('dreams')
        })
    },
    ring_of_nature(game: GameState) {
        return new Item({
            name: 'ring of nature',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            game: game,
            buff: { plus: { hp_recharge: 0.10, sp_recharge: 0.10, mp_recharge: 0.10 }, times: { max_hp: 1.5 } }
        }).addAction('use ring', async function (player) {
            this.game.print('TODO: use ring of nature')
        })
    },
    ring_of_stone(game: GameState) {
        return new Item({
            name: 'ring of stone',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            game: game,
            buff: { times: { defense: { blunt: 2, sharp: 2 } } }
        })
    },
    ring_of_time(game: GameState) {
        return new Item({
            name: 'ring of time',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            game: game,
            buff: { times: { speed: 2 } }
        }).on_equip(async function (player) {
            if (player.isPlayer) {
                let totalTime = 4.0
                const slowfactor = 0.1
                const text = "You feel the world around you slooooooow doowwn..."
                const chars = text.split('')
                const colors = chars.map((char, i) =>
                    i < text.length - 20
                        ? black
                        : i < text.length - 10
                            ? gray
                            : [magenta, blue, green, yellow, red, cyan, magenta, blue, green, yellow][text.length - i - 1]
                )
                const pauseLength = chars.map((char, i) => {
                    let length = totalTime * slowfactor
                    totalTime -= length
                    return length
                }).reverse()
                for (let i in chars) {
                    this.game.color(colors[i])
                    this.game.print(chars[i], 1)
                    await this.game.pause(pauseLength[i])
                }
                this.game.print()
            }
        }).on_remove(async function (player) {
            if (player.isPlayer) {
                this.game.print("Time returns to normal.")
            }
        })
    },
    ring_of_ultimate_power(game: GameState) {
        return new Item({
            name: 'ring of ultimate power',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            game: game,
            buff: { plus: { strength: 100, magic_level: 100, max_hp: 100, max_sp: 100, max_mp: 100, defense: { blunt: 100, sharp: 100, magic: 100 } } }
        }).on_acquire(async function (player) {
            player.abilities.powermaxout = Math.max(player.abilities.powermaxout || 0, 7)
        })
    },
    shovel(game: GameState) {
        return new Item({
            name: 'shovel',
            size: 1,
            value: 20,
            game: game
        })
    },
    sickle(game: GameState) {
        return new Item({
            name: 'sickle',
            size: 2.0,
            value: 36,
            game: game,
            attackVerb: 'slice',
            buff: { times: { damage: { sharp: 3.0 } } },
        })
    },
    soul(game: GameState) {
        return new Item({
            name: 'soul',
            size: 1,
            value: 10000,
            game: game
        })
    },
    spell_book(game: GameState) {
        return new Item({
            name: 'spell book',
            size: 1,
            value: 50,
            game: game
        })
    },
    spiked_flail(game: GameState) {
        return new Item({
            name: 'spiked flail',
            size: 1,
            value: 17,
            game: game
        })
    },
    spritzer_hair(game: GameState) {
        return new Item({
            name: 'spritzer hair',
            size: 0.1,
            value: 30,
            game: game
        })
    },
    telescope(game: GameState) {
        return new Item({
            name: 'telescope',
            size: 1,
            value: 25,
            game: game
        })
    },
    the_colorful_history_of_adilon(game: GameState) {
        return new Item({
            name: 'the colorful history of adilon',
            size: 1,
            value: 50,
            game: game
        })
    },
    vanish_potion(game: GameState) {
        return new Item({
            name: 'vanish potion',
            size: 1,
            value: 200,
            game: game
        })
    },
    wand(game: GameState) {
        return new Item({
            name: 'wand',
            size: 1,
            value: 105,
            game: game
        })
    },
    whip(game: GameState) {
        return new Item({
            name: 'whip',
            size: 0.5,
            value: 11,
            game: game
        })
    },
    spy_o_scope(game: GameState) {
        return new Item({
            name: 'spy-o-scope',
            size: 1,
            value: 200,
            game: game
        })
    },
    gavel(game: GameState) {
        return new Item({
            name: 'gavel',
            size: 1,
            value: 20,
            attackVerb: 'club',
            buff: { times: { damage: { blunt: 2.0 } } },
            game: game
        })
    },
    wolf_fang(game: GameState) {
        return new Item({
            name: 'wolf fang',
            size: 1,
            value: 20,
            game: game
        })
    },
    comb(game: GameState) {
        return new Item({
            name: 'comb',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    pen(game: GameState) {
        return new Item({
            name: 'pen',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    paperclip(game: GameState) {
        return new Item({
            name: 'paperclip',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    sock(game: GameState) {
        return new Item({
            name: 'sock',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    crumpled_paper(game: GameState) {
        return new Item({
            name: 'crumpled paper',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    pokemon_card(game: GameState) {
        return new Item({
            name: 'pokemon card',
            size: 0.1,
            value: 1,
            game: game
        })
    },
    cranberries_cd(game: GameState) {
        return new Item({
            name: 'cranberries cd',
            size: 0.1,
            value: 1,
            game: game
        }).addAction('play cranberries cd', async function (player) {
            this.game.print("You pop the CD into your walkman and hit play.")
            await this.game.pause(2)
            this.game.print(lineBreak("Far above, the clouded sky opens up with a furious rumble. A lone beam of light shines down, directly on - you."))
            await this.game.pause(2)
            this.game.print(lineBreak("Suddenly a burst of lightning arcs down from the heavens, striking the CD in your hand. Bolt after bolt follows until nothing remains of you or the CD but a smoking hole in the ground."))
            this.game.print("Lars hates the cranberries!")
            player.die('Wrath of God')
            if (player.flags.assistant) {
                this.game.color(magenta, darkwhite)
                this.game.print("Assistant -- what did I tell you?!.")
            }
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                this.game.color(magenta)
                this.game.print("Assistant -- don't type \"play cranberries cd\".")
            }
        })
    },
    voidstone(game: GameState) {
        return new Item({
            name: 'voidstone',
            size: 1,
            value: 1000,
            game: game
        })
    },
    negative_gold(game: GameState) {
        return new Item({
            name: 'negative gold',
            size: 0.005,
            value: -1,
            game: game || 1
        }).displayName(function () {
            return `${this.quantity} gold`
        }).on_acquire(async function (player) {
            this.game.color(brightmagenta)
            player.removeItem('gold', this.quantity)
            player.removeItem(this, this.quantity)
            this.game.print(`Got negative ${this.quantity} GP`)
        })
    },
}

type ItemNames = keyof typeof items;

function isValidItemKey(key: string): key is ItemNames {
    return key in items;
}

// function getItem(itemName: ItemNames, args: number | ItemParams = 1): Item {
//     if (typeof args === 'number') {
//         args = { quantity: args } as ItemParams
//     } else if (!('quantity' in args)) {
//         args.quantity = 1
//     }
//     if (!items[itemName]) {
//         throw new Error(`Item ${itemName} not found`)
//     }
//     const item = items[itemName](args)
//     item.key = itemName.toString()
//     return item
// }

const potions = new Map(
    [
        [['giraffe gizzard', 'blue liquid', 'spritzer hair'], 'bug_repellent'],
        [['maple leaf', 'spritzer hair', 'ochre stone', 'music box', 'clear liquid'], 'earth_potion'],
    ]
)

// make sure the ingredients are sorted right and return a function to copy the potion
let sorted_potions = new Map<string, string>()
potions.forEach(function (value, key) {
    sorted_potions.set(key.sort().join(', '), value)
})

export { items, sorted_potions as potions, isValidItemKey };
