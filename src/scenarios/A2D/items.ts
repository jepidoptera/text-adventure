import { Item, ItemParams } from '../../game/item.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts';
import { Player } from './player.ts';
import { Character, Buff } from '../../game/character.ts';
import { getBuff } from './buffs.ts';
import { play, musicc$ } from './utils.ts';

function equip(slot: keyof Player["equipment"]) {
    return async function (this: Item, character: Character) {
        if (character.isPlayer) {
            if (slot === 'armor') {
                const player = character as Player
                if (player.equipment.armor) {
                    print("You remove your old armor...")
                    player.giveItem(player.equipment['armor'])
                } else {
                    print(`${this.name} equipped.`)
                }
                player.equipment['armor'] = this
            }
        }
    }
}

const items = {
    gold(args: ItemParams) {
        return new Item({
            name: 'gold',
            size: 0.005,
            value: 1,
            quantity: args.quantity
        })
    },
    pile_of_gold(args: ItemParams) {
        return new Item({
            name: args?.name || 'pile of gold',
            value: 1,
            size: 0.02,
            quantity: args.quantity,
        }).on_acquire(async function (player) {
            player.giveItem(items.gold({ name: 'gold', quantity: this.quantity ?? 1 }))
            player.removeItem(this)
            color(yellow)
            print(`Got ${this.quantity ?? 0} GP`)
            this.displayName(function () { return '' })
        }).displayName(function () {
            return this.name;
        })
    },
    arrows(args: ItemParams) {
        return new Item({
            name: 'arrows',
            value: 1,
            quantity: args.quantity,
        })
    },
    shortsword(args: ItemParams) {
        return new Item({
            name: 'shortsword',
            description: '',
            weapon_stats: {
                type: 'sword',
                blunt_damage: 0.5,
                sharp_damage: 2.5
            },
            value: 13,
            size: 1.4,
            quantity: args.quantity
        })
    },

    // Consumables
    ear_of_corn(args: ItemParams) {
        return new Item({
            name: 'corn ear',
            description: 'an ear of corn',
            value: 1,
            eat: async (player) => {
                player.hunger -= 8.5
                player.sp += 12
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    satchel_of_peas(args: ItemParams) {
        return new Item({
            name: 'satchel of peas',
            description: 'a satchel of peas',
            value: 11,
            eat: async (player) => {
                player.hunger -= 10
                player.sp += 10
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    banana(args: ItemParams) {
        return new Item({
            name: 'banana',
            description: 'a banana',
            value: 4,
            eat: async (player) => {
                player.hunger -= 8
                player.sp += 8
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    side_of_meat(args: ItemParams) {
        return new Item({
            name: 'side of meat',
            description: 'a side of meat',
            value: 18,
            eat: async (player) => {
                player.hunger -= 80
                player.sp += 60
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    chicken_leg(args: ItemParams) {
        return new Item({
            name: 'chicken leg',
            size: 0.2,
            value: 8,
            eat: async (player) => {
                player.hunger -= 10
                player.sp += 20
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    dog_steak(args: ItemParams) {
        return new Item({
            name: 'dog steak',
            size: 0.8,
            value: 0,
            eat: async (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    full_ration(args: ItemParams) {
        return new Item({
            name: 'full ration',
            size: 0.8,
            value: 22,
            eat: async (player) => {
                player.sp += 40;
                player.hunger -= 40;
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    giraffe_gizzard(args: ItemParams) {
        return new Item({
            name: 'giraffe gizzard',
            size: 1,
            value: 0,
            eat: async (player) => {
                print('You gobble down the disgusting, slimy organ.  It tastes like a mix of')
                print('rotten fish and old socks, but something compels you to eat it, and')
                print('eat it all.  You feel a little sick.')
                await pause(5)
                print("Too late, you realize: GIRAFFES DON'T HAVE GIZZARDS!")
                print("What did you just eat??")
                await pause(3)
                print("Whatever it was, it was poisonous.")
                await pause(2)
                player.die('giraffe gizzard')
            },
            quantity: args.quantity
        })
    },
    loaf_of_bread(args: ItemParams) {
        return new Item({
            name: 'loaf of bread',
            size: 0.5,
            value: 10,
            eat: async (player) => {
                player.sp += 10
                player.hunger -= 20
            },
            quantity: args.quantity
        })
    },
    mushroom(args: ItemParams) {
        return new Item({
            name: 'mushroom',
            size: 0.2,
            value: 50,
            eat: async (player) => {
                player.hunger -= 5
            },
            quantity: args.quantity
        })
    },
    bug_repellent(args: ItemParams) {
        return new Item({
            name: 'bug repellent',
            size: 0.1,
            value: 0,
            drink: async (player) => {
                print("hmmm... that bug repellent tasted surprisingly good.")
                await pause(2)
                print("suddenly you feel an itching in you chest.")
                await pause(1.5)
                print("Now it has become a bubbling.")
                await pause(1.5)
                print("Oh no it is...")
                await pause(1.5)
                color('red')
                print("THE DREADED LUNG BOIL DISEASE!!!")
                await pause(2)
                player.die('bug repellent')
            },
            quantity: args.quantity
        })
    },
    full_healing_potion(args: ItemParams) {
        return new Item({
            name: 'full healing potion',
            size: 0.4,
            value: 30,
            drink: async (player) => {
                player.hp = player.max_hp
            },
            quantity: args.quantity
        })
    },
    keg_of_wine(args: ItemParams) {
        return new Item({
            name: 'keg of wine',
            size: 1.5,
            value: 45,
            drink: async (player) => {
                player.mp += 40;
                if (player.isPlayer) (player as Player).checkHP()
            },
            quantity: args.quantity
        })
    },
    mostly_healing_potion(args: ItemParams) {
        return new Item({
            name: 'mostly healing potion',
            size: 0.4,
            value: 10,
            drink: async (player) => {
                print('TODO: drink this')
            },
            quantity: args.quantity
        })
    },
    partial_healing_potion(args: ItemParams) {
        return new Item({
            name: 'partial healing potion',
            size: 0.4,
            value: 5,
            drink: async (player) => {
                print('TODO: drink this')
            },
            quantity: args.quantity
        })
    },
    poison(args: ItemParams) {
        return new Item({
            name: 'poison',
            size: 0.4,
            value: 0,
            drink: async (player) => {
                print('You die.')
                player.die('poison')
            },
            quantity: args.quantity
        })
    },
    flask_of_wine(args: ItemParams) {
        return new Item({
            name: 'flask of wine',
            value: 25,
            drink: async (player) => {
                player.mp += 20;
            },
            quantity: args.quantity
        })
    },
    healing_potion(args: ItemParams) {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 25,
            drink: async (player) => {
                player.hp += 10;
            },
            size: 0.4,
            quantity: args.quantity
        })
    },
    clear_liquid(args: ItemParams) {
        return new Item({
            name: 'clear liquid',
            description: 'a clear liquid',
            value: 1,
            size: 0.5,
            drink: async (player) => {
                player.die('clear liquid');
            },
            quantity: args.quantity
        })
    },
    red_liquid(args: ItemParams) {
        return new Item({
            name: 'red liquid',
            description: 'a red liquid',
            value: 1,
            size: 0.5,
            drink: async (player) => {
                player.die('red liquid');
            },
            quantity: args.quantity
        })
    },
    blue_liquid(args: ItemParams) {
        return new Item({
            name: 'blue liquid',
            description: 'a blue liquid',
            value: 1,
            size: 0.5,
            drink: async (player) => {
                player.die('blue liquid');
            },
            quantity: args.quantity
        })
    },
    dark_sword(args: ItemParams) {
        return new Item({
            name: 'dark sword',
            size: 3.5,
            value: 110,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    battle_axe(args: ItemParams) {
        return new Item({
            name: 'battle axe',
            size: 1,
            value: 55,
            weapon_stats: {
                type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    scythe(args: ItemParams) {
        return new Item({
            name: 'scythe',
            size: 2.0,
            value: 43,
            weapon_stats: {
                type: 'axe',
                sharp_damage: 4.5,
            },
            quantity: args.quantity
        })
    },
    hand_axe(args: ItemParams) {
        return new Item({
            name: 'hand axe',
            size: 1.0,
            value: 19,
            weapon_stats: {
                type: 'axe',
                blunt_damage: 1.5,
                sharp_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    axe_of_the_cat(args: ItemParams) {
        return new Item({
            name: 'axe of the cat',
            size: 5.0,
            value: 402,
            weapon_stats: {
                type: 'axe',
                blunt_damage: 2.2,
                sharp_damage: 3.2,
                magic_damage: 1.5,
            },
            quantity: args.quantity
        })
    },
    axe(args: ItemParams) {
        return new Item({
            name: 'axe',
            size: 2.0,
            value: 28,
            weapon_stats: {
                type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    lightning_staff(args: ItemParams) {
        return new Item({
            name: 'lightning staff',
            size: 2.0,
            value: 950,
            weapon_stats: {
                type: 'electric',
                blunt_damage: 2.0,
                magic_damage: 6.0,
            },
            quantity: args.quantity
        })
    },
    crossbow(args: ItemParams) {
        return new Item({
            name: 'crossbow',
            size: 1.6,
            value: 455,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 13.0,
                sharp_damage: 50.0,
            },
            quantity: args.quantity
        })
    },
    hand_crossbow(args: ItemParams) {
        return new Item({
            name: 'hand crossbow',
            size: 1.0,
            value: 84,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 25.0,
            },
            quantity: args.quantity
        })
    },
    short_bow(args: ItemParams) {
        return new Item({
            name: 'short bow',
            size: 0.8,
            value: 35,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 6.0,
                sharp_damage: 18.0,
            },
            quantity: args.quantity
        })
    },
    ballista(args: ItemParams) {
        return new Item({
            name: 'ballista',
            size: 4.5,
            value: 5000,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 140.0,
                sharp_damage: 234.0,
            },
            quantity: args.quantity
        })
    },
    heavy_crossbow(args: ItemParams) {
        return new Item({
            name: 'heavy crossbow',
            size: 2.0,
            value: 890,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 24.0,
                sharp_damage: 60.0,
            },
            quantity: args.quantity
        })
    },
    composite_bow(args: ItemParams) {
        return new Item({
            name: 'composite bow',
            size: 2.4,
            value: 2000,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 15.0,
                sharp_damage: 58.0,
            },
            quantity: args.quantity
        })
    },
    long_bow(args: ItemParams) {
        return new Item({
            name: 'long bow',
            size: 1.3,
            value: 210,
            weapon_stats: {
                type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 44.0,
            },
            quantity: args.quantity
        })
    },
    mighty_warhammer(args: ItemParams) {
        return new Item({
            name: 'mighty warhammer',
            size: 4.0,
            value: 110,
            weapon_stats: {
                type: 'club',
                blunt_damage: 5.0,
            },
            quantity: args.quantity
        })
    },
    club(args: ItemParams) {
        return new Item({
            name: 'club',
            size: 1,
            value: 4,
            weapon_stats: {
                type: 'club',
                blunt_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    hardened_club(args: ItemParams) {
        return new Item({
            name: 'hardened club',
            size: 2.0,
            value: 10,
            weapon_stats: {
                type: 'club',
                blunt_damage: 3.3,
            },
            quantity: args.quantity
        })
    },
    warhammer(args: ItemParams) {
        return new Item({
            name: 'warhammer',
            size: 2.4,
            value: 34,
            weapon_stats: {
                type: 'club',
                blunt_damage: 4.0,
            },
            quantity: args.quantity
        })
    },
    flail(args: ItemParams) {
        return new Item({
            name: 'flail',
            size: 1.4,
            value: 14,
            weapon_stats: {
                type: 'club',
                blunt_damage: 3.0,
                sharp_damage: 0.5,
            },
            quantity: args.quantity
        })
    },
    fist(args: ItemParams) {
        return new Item({
            name: args.name || 'fists',
            size: 1,
            value: 0,
            weapon_stats: {
                type: 'club',
                blunt_damage: 1.0,
            },
            quantity: args.quantity
        })
    },
    wooden_stick(args: ItemParams) {
        return new Item({
            name: 'wooden stick',
            size: 1,
            value: 4,
            weapon_stats: {
                type: 'club',
                blunt_damage: 2.5,
            },
            quantity: args.quantity
        })
    },
    morning_star(args: ItemParams) {
        return new Item({
            name: 'morning star',
            size: 1,
            value: 20,
            weapon_stats: {
                type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    metal_bar(args: ItemParams) {
        return new Item({
            name: 'metal bar',
            size: 1.5,
            value: 9,
            weapon_stats: {
                type: 'club',
                blunt_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    megarian_club(args: ItemParams) {
        return new Item({
            name: 'megarian club',
            size: 1,
            value: 250,
            weapon_stats: {
                type: 'club',
                blunt_damage: 6.0,
            },
            quantity: args.quantity
        })
    },
    spiked_club(args: ItemParams) {
        return new Item({
            name: 'spiked club',
            size: 1.5,
            value: 12,
            weapon_stats: {
                type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 1.0,
            },
            quantity: args.quantity
        })
    },
    long_rapier(args: ItemParams) {
        return new Item({
            name: 'long rapier',
            size: 1.5,
            value: 22,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 3.5,
            },
            quantity: args.quantity
        })
    },
    dagger(args: ItemParams) {
        return new Item({
            name: 'dagger',
            size: 0.5,
            value: 5,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    heavy_spear(args: ItemParams) {
        return new Item({
            name: 'heavy spear',
            size: 1,
            value: 59,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 4.0,
            },
            quantity: args.quantity
        })
    },
    long_dagger(args: ItemParams) {
        return new Item({
            name: 'long dagger',
            size: 0.8,
            value: 8,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 2.5,
            },
            quantity: args.quantity
        })
    },
    mighty_gigasarm(args: ItemParams) {
        return new Item({
            name: 'mighty gigasarm',
            size: 1,
            value: 1350,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 1.9,
                sharp_damage: 7.44,
                magic_damage: 2.4,
            },
            quantity: args.quantity
        })
    },
    trident(args: ItemParams) {
        return new Item({
            name: 'trident',
            size: 1,
            value: 125,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 6.2,
            },
            quantity: args.quantity
        })
    },
    mighty_warfork(args: ItemParams) {
        return new Item({
            name: 'mighty warfork',
            size: 1,
            value: 460,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 3.1,
                sharp_damage: 5.0,
                magic_damage: 1.0,
            },
            quantity: args.quantity
        })
    },
    steel_polearm(args: ItemParams) {
        return new Item({
            name: 'steel polearm',
            size: 2.5,
            value: 35,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 3.2,
            },
            quantity: args.quantity
        })
    },
    lance(args: ItemParams) {
        return new Item({
            name: 'lance',
            size: 1,
            value: 83,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 5.0,
            },
            quantity: args.quantity
        })
    },
    spear(args: ItemParams) {
        return new Item({
            name: 'spear',
            size: 2.0,
            value: 32,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 4.0,
            },
            quantity: args.quantity
        })
    },
    rapier(args: ItemParams) {
        return new Item({
            name: 'rapier',
            size: 1.0,
            value: 14,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    jagged_polearm(args: ItemParams) {
        return new Item({
            name: 'jagged polearm',
            size: 3.0,
            value: 58,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 1.5,
                sharp_damage: 3.5,
            },
            quantity: args.quantity
        })
    },
    psionic_dagger(args: ItemParams) {
        return new Item({
            name: 'psionic dagger',
            size: 2.0,
            value: 764,
            weapon_stats: {
                type: 'spear',
                sharp_damage: 3.0,
                magic_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    polearm(args: ItemParams) {
        return new Item({
            name: 'polearm',
            size: 2.0,
            value: 17,
            weapon_stats: {
                type: 'spear',
                blunt_damage: 0.9,
                sharp_damage: 2.44,
            },
            quantity: args.quantity
        })
    },
    crystal_ultima_blade(args: ItemParams) {
        return new Item({
            name: 'crystal ultima blade',
            size: 1,
            value: 740,
            weapon_stats: {
                type: 'sword',
                sharp_damage: 7.77,
            },
            quantity: args.quantity
        })
    },
    Glory_Blade(args: ItemParams) {
        return new Item({
            name: 'Glory Blade',
            size: 8.5,
            value: 0,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 10.0,
                sharp_damage: 10.0,
                magic_damage: 10.0,
            },
            quantity: args.quantity
        })
    },
    mighty_excalabor(args: ItemParams) {
        return new Item({
            name: 'mighty excalabor',
            size: 6.5,
            value: 1150,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 6.5,
                magic_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    scimitar(args: ItemParams) {
        return new Item({
            name: 'scimitar',
            size: 1.4,
            value: 40,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 0.2,
                sharp_damage: 3.8,
            },
            quantity: args.quantity
        })
    },
    silver_sword(args: ItemParams) {
        return new Item({
            name: 'silver sword',
            size: 3.5,
            value: 150,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 2.0,
                sharp_damage: 4.0,
            },
            quantity: args.quantity
        })
    },
    broadsword(args: ItemParams) {
        return new Item({
            name: 'broadsword',
            size: 2.0,
            value: 20,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 0.5,
                sharp_damage: 3.0,
            },
            quantity: args.quantity
        })
    },
    longsword(args: ItemParams) {
        return new Item({
            name: 'longsword',
            size: 3.0,
            value: 42,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 1.0,
                sharp_damage: 3.5,
            },
            quantity: args.quantity
        })
    },
    blade_of_time(args: ItemParams) {
        return new Item({
            name: 'blade of time',
            size: 3.0,
            value: 1314,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
                magic_damage: 5.0,
            },
            quantity: args.quantity
        })
    },
    claymoore(args: ItemParams) {
        return new Item({
            name: 'claymoore',
            size: 5.0,
            value: 52,
            weapon_stats: {
                type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    channeled_blade(args: ItemParams) {
        return new Item({
            name: 'channeled blade',
            size: 4.0,
            value: 365,
            weapon_stats: {
                type: 'sword',
                magic_damage: 1.5,
                sharp_damage: 6.0,
            },
            quantity: args.quantity
        })
    },
    acid(args: ItemParams) {
        return new Item({
            name: 'acid',
            size: 1,
            value: 80,
            quantity: args.quantity
        })
    },
    adilons_colorful_history(args: ItemParams) {
        return new Item({
            name: 'adilon\'s colorful history',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    amber_chunk(args: ItemParams) {
        return new Item({
            name: 'amber chunk',
            size: 0.5,
            value: 0,
            quantity: args.quantity
        })
    },
    ballista_bolt(args: ItemParams) {
        return new Item({
            name: 'ballista bolt',
            size: 0.5,
            value: 16,
            quantity: args.quantity
        })
    },
    boar_tusk(args: ItemParams) {
        return new Item({
            name: 'boar tusk',
            size: 1,
            value: 45,
            quantity: args.quantity
        })
    },
    camera(args: ItemParams) {
        return new Item({
            name: 'camera',
            size: 1,
            value: 65,
            quantity: args.quantity
        })
    },
    citrus_jewel(args: ItemParams) {
        return new Item({
            name: 'citrus jewel',
            size: 1,
            value: 1000,
            quantity: args.quantity
        })
    },
    cure(args: ItemParams) {
        return new Item({
            name: 'cure',
            size: 1,
            value: 110,
            quantity: args.quantity
        })
    },
    draught_of_visions(args: ItemParams) {
        return new Item({
            name: 'draught of visions',
            size: 1,
            value: 140,
            quantity: args.quantity
        })
    },
    ear_plugs(args: ItemParams) {
        return new Item({
            name: 'ear plugs',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
    earth_potion(args: ItemParams) {
        return new Item({
            name: 'earth potion',
            size: 0.4,
            value: 0,
            quantity: args.quantity
        }).on_use(async function (player) {
            if (player.location && player.location.landmarks?.map(landmark => landmark.key).includes('slash_in_the_earth')) {
                print("You drop some of the potion into the crevice.")
                await pause(2)
                print("The earth shakes beneath you as the crevice seals itself shut.")
                player.location.removeLandmark('slash_in_the_earth')
                player.removeItem(this)
            } else {
                print("You aren't supposed to use that here.")
            }
        })
    },
    enhanced_club(args: ItemParams) {
        return new Item({
            name: 'enhanced club',
            size: 1,
            value: 17,
            quantity: args.quantity
        })
    },
    flute(args: ItemParams) {
        return new Item({
            name: 'flute',
            size: 1,
            value: 100,
            quantity: args.quantity
        })
    },
    glory_blade(args: ItemParams) {
        return new Item({
            name: 'glory blade',
            size: 1,
            value: 29661,
            quantity: args.quantity
        })
    },
    gold_potion(args: ItemParams) {
        return new Item({
            name: 'gold potion',
            size: 1,
            value: 500,
            quantity: args.quantity
        })
    },
    gold_sludge(args: ItemParams) {
        return new Item({
            name: 'gold sludge',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    gold_watch(args: ItemParams) {
        return new Item({
            name: 'gold watch',
            size: 1,
            value: 60,
            quantity: args.quantity
        })
    },
    golden_pitchfork(args: ItemParams) {
        return new Item({
            name: 'golden pitchfork',
            size: 1,
            value: 48,
            quantity: args.quantity
        })
    },
    hang_glider(args: ItemParams) {
        return new Item({
            name: 'hang glider',
            size: 1,
            value: 350,
            quantity: args.quantity
        })
    },
    horn(args: ItemParams) {
        return new Item({
            name: 'horn',
            size: 1,
            value: 200,
            quantity: args.quantity
        })
    },
    how_to_kill_things(args: ItemParams) {
        return new Item({
            name: 'how to kill things',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    jespridge_feather(args: ItemParams) {
        return new Item({
            name: 'jespridge feather',
            size: 1,
            value: 30,
            quantity: args.quantity
        })
    },
    jespridge_horn(args: ItemParams) {
        return new Item({
            name: 'jespridge horn',
            size: 1,
            value: 100,
            quantity: args.quantity
        })
    },
    leather_armor(args: ItemParams) {
        return new Item({
            name: 'leather armor',
            size: 4,
            value: 30,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 4, 'sharp_armor': 7, 'magic_armor': 1 }
        )
    },
    studded_leather(args: ItemParams) {
        return new Item({
            name: 'studded leather',
            size: 4,
            value: 60,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 5, 'sharp_armor': 14, 'magic_armor': 3 }
        )
    },
    light_chainmail(args: ItemParams) {
        return new Item({
            name: 'light chainmail',
            size: 4,
            value: 200,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 5, 'sharp_armor': 22, 'magic_armor': 3 }
        )
    },
    chain_mail(args: ItemParams) {
        return new Item({
            name: 'chain mail',
            size: 5,
            value: 220,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 6, 'sharp_armor': 28, 'magic_armor': 4 }
        )
    },
    banded_mail(args: ItemParams) {
        return new Item({
            name: 'banded mail',
            size: 6,
            value: 420,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 15, 'sharp_armor': 26, 'magic_armor': 20 }
        )
    },
    light_plate(args: ItemParams) {
        return new Item({
            name: 'light plate',
            size: 7,
            value: 900,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 20, 'sharp_armor': 40, 'magic_armor': 5 }
        )
    },
    full_plate(args: ItemParams) {
        return new Item({
            name: 'full plate',
            size: 8,
            value: 2000,
            equipment_slot: 'armor',
            quantity: args.quantity
        }).addBuff(
            { 'blunt_armor': 35, 'sharp_armor': 54, 'magic_armor': 10 }
        )
    },
    list(args: ItemParams) {
        return new Item({
            name: 'list',
            size: 0.1,
            value: 0,
            quantity: args.quantity
        }).on_read(async function (player) {
            print("This apears to be torn from a book.")
            print("In scrawled handwriting the list reads:")
            print()
            print(" The mixing of these ingredients will")
            print(" create a potion ledgend holds as one")
            print(" capable of healing the very earth on ")
            print(" which we stand:")
            print()
            print(" 1 - maple leaf")
            print(" 1 - spritzer hair")
            print(" 1 - ochre stone from Forest of Theives")
            print(" 1 - music box")
            print(" - some clear liquid")
            print()
            print("Find a pot and, 'mix potion'")
        })
    },
    lute_de_lumonate(args: ItemParams) {
        return new Item({
            name: 'lute de lumonate',
            size: 0.3,
            value: 0,
            quantity: args.quantity
        }).addAction('play lute', async function (player: Character) {
            color(blue)
            print("You lift the beautiful lute to your lips, and unleash a tune...")
            if (player.attackTarget?.name.toLowerCase() == 'sift') {
                play(musicc$(10))
                print()
                color(magenta)
                print("Sift falters, entranced by the music.")
                await pause(1)
                print("His attack fell!")
                await pause(1)
                player.attackTarget.addBuff(
                    new Buff({
                        name: 'power drain',
                        duration: Math.floor(Math.random() * 5) + 1,
                        bonuses: { 'blunt_damage': -10, 'sharp_damage': -50 }
                    }).onExpire(async function () {
                        color(magenta)
                        print("Sift shakes off the trances of the lute.")
                    })
                )
            }
        })
    },
    mace(args: ItemParams) {
        return new Item({
            name: 'mace',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
    magic_ring(args: ItemParams) {
        return new Item({
            name: 'magic ring',
            size: 0.05,
            value: 900,
            quantity: args.quantity
        })
    },
    mana_draught(args: ItemParams) {
        return new Item({
            name: 'mana draught',
            size: 1,
            value: 400,
            quantity: args.quantity
        })
    },
    maple_leaf(args: ItemParams) {
        return new Item({
            name: 'maple leaf',
            size: 0.05,
            value: 0,
            quantity: args.quantity
        })
    },
    mighty_megaraclub(args: ItemParams) {
        return new Item({
            name: 'mighty megaraclub',
            size: 1,
            value: 500,
            quantity: args.quantity
        })
    },
    monogrammed_pen(args: ItemParams) {
        return new Item({
            name: 'monogrammed pen',
            size: 1,
            value: 100,
            quantity: args.quantity
        })
    },
    music_box(args: ItemParams) {
        return new Item({
            name: 'music box',
            size: 0.3,
            value: 200,
            quantity: args.quantity
        })
    },
    ochre_stone(args: ItemParams) {
        return new Item({
            name: 'ochre stone',
            size: 0.5,
            value: 110,
            quantity: args.quantity
        })
    },
    pitchfork(args: ItemParams) {
        return new Item({
            name: 'pitchfork',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
    portal_detector(args: ItemParams) {
        return new Item({
            name: 'portal detector',
            size: 1,
            value: 265,
            quantity: args.quantity
        })
    },
    potions_of_clout(args: ItemParams) {
        return new Item({
            name: 'potions of clout',
            size: 1,
            value: 8000,
            quantity: args.quantity
        })
    },
    quarterstaff(args: ItemParams) {
        return new Item({
            name: 'quarterstaff',
            size: 1,
            value: 12,
            quantity: args.quantity
        })
    },
    rake(args: ItemParams) {
        return new Item({
            name: 'rake',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
    recipe(args: ItemParams) {
        return new Item({
            name: 'recipe',
            size: 0.1,
            value: 0,
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You should read that. (type \"read recipe\")")
            }
        }).on_read(async function (player) {
            color(black, white)
            color(black, white); print("____________________________", 1); color(black, darkwhite); print()
            color(black, white); print("|   GRANDMAS BUG FORMULA   |", 1); color(black, darkwhite); print()
            color(black, white); print("|      X-Tra bonus         |", 1); color(black, darkwhite); print()
            color(black, white); print("|                          |", 1); color(black, darkwhite); print()
            color(black, white); print("|\"hope it kills the bugs   |", 1); color(black, darkwhite); print()
            color(black, white); print("| before it kills you\"     |", 1); color(black, darkwhite); print()
            color(black, white); print("|             - Grandma    |", 1); color(black, darkwhite); print()
            color(black, white); print("|INGREDIENTS:              |", 1); color(black, darkwhite); print()
            color(black, white); print("| - 1 giraffe gizzard      |", 1); color(black, darkwhite); print()
            color(black, white); print("| - 1 spritzer hair        |", 1); color(black, darkwhite); print()
            color(black, white); print("| - some blue liquid       |", 1); color(black, darkwhite); print()
            color(black, white); print("|                          |", 1); color(black, darkwhite); print()
            color(black, white); print("|When you have everything, |", 1); color(black, darkwhite); print()
            color(black, white); print("|find a mixing pot and type|", 1); color(black, darkwhite); print()
            color(black, white); print("|      'mix potion'        |", 1); color(black, darkwhite); print()
            color(black, white); print("|         ENJOY!           |", 1); color(black, darkwhite); print()
            color(black, white); print("|__________________________|", 1); color(black, darkwhite); print()
            color(black, white); print("|SURGEON GENERALS WARNING: |", 1); color(black, darkwhite); print()
            color(black, white); print("|Do not eat for fear of the|", 1); color(black, darkwhite); print()
            color(black, white); print("|lung-boil disease.        |", 1); color(black, darkwhite); print()
            color(black, white); print(" \\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/ ", 1); color(black, darkwhite); print()
            if (player?.flags.assistant) {
                color(magenta);
                print("   --ASSISTANT: The ingredients for this are scattered around town.");
            }
        })
    },
    ring_of_dreams(args: ItemParams) {
        return new Item({
            name: 'ring of dreams',
            description: 'With this ring, you can bring dreams into reality.',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_life(args: ItemParams) {
        return new Item({
            name: 'ring of life',
            size: 0.05,
            value: 800,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_nature(args: ItemParams) {
        return new Item({
            name: 'ring of nature',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).addBuff(new Buff({
            name: 'ring_of_nature',
            bonuses: {
                max_hp: 50,
                hp_recharge: 0.10,
                sp_recharge: 0.10,
                mp_recharge: 0.10,
            },
        })).addAction('use ring', async function (player) {
            print('TODO: use ring of nature')
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_power(args: ItemParams) {
        return new Item({
            name: 'ring of power',
            size: 0.05,
            value: 700,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_stone(args: ItemParams) {
        return new Item({
            name: 'ring of stone',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).addBuff(new Buff({
            name: 'ring_of_stone',
            bonuses: {
                blunt_armor: 50,
                sharp_armor: 50,
            },
        })).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_strength(args: ItemParams) {
        return new Item({
            name: 'ring of strength',
            size: 0.05,
            value: 600,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_time(args: ItemParams) {
        return new Item({
            name: 'ring of time',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You can wear that.")
            }
        })
    },
    ring_of_ultimate_power(args: ItemParams) {
        return new Item({
            name: 'ring of ultimate power',
            size: 0.05,
            value: 0,
            equipment_slot: 'ring',
            quantity: args.quantity
        }).on_acquire(async function (player) {
            if (player.flags.assistant) {
                color(magenta)
                print("Assistant -- You should definitely wear that.")
            }
        })
    },
    shovel(args: ItemParams) {
        return new Item({
            name: 'shovel',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
    sickle(args: ItemParams) {
        return new Item({
            name: 'sickle',
            size: 2.0,
            value: 36,
            quantity: args.quantity
        })
    },
    soul(args: ItemParams) {
        return new Item({
            name: 'soul',
            size: 1,
            value: 10000,
            quantity: args.quantity
        })
    },
    spell_book(args: ItemParams) {
        return new Item({
            name: 'spell book',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    spiked_flail(args: ItemParams) {
        return new Item({
            name: 'spiked flail',
            size: 1,
            value: 17,
            quantity: args.quantity
        })
    },
    spritzer_hair(args: ItemParams) {
        return new Item({
            name: 'spritzer hair',
            size: 0.1,
            value: 30,
            quantity: args.quantity
        })
    },
    telescope(args: ItemParams) {
        return new Item({
            name: 'telescope',
            size: 1,
            value: 25,
            quantity: args.quantity
        })
    },
    the_colorful_history_of_adilon(args: ItemParams) {
        return new Item({
            name: 'the colorful history of adilon',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    vanish_potion(args: ItemParams) {
        return new Item({
            name: 'vanish potion',
            size: 1,
            value: 200,
            quantity: args.quantity
        })
    },
    wand(args: ItemParams) {
        return new Item({
            name: 'wand',
            size: 1,
            value: 105,
            quantity: args.quantity
        })
    },
    whip(args: ItemParams) {
        return new Item({
            name: 'whip',
            size: 0.5,
            value: 11,
            quantity: args.quantity
        })
    },
    spy_o_scope(args: ItemParams) {
        return new Item({
            name: 'spy-o-scope',
            size: 1,
            value: 200,
            quantity: args.quantity
        })
    },
    gavel(args: ItemParams) {
        return new Item({
            name: 'gavel',
            size: 1,
            value: 20,
            weapon_stats: {
                type: 'club',
                blunt_damage: 2.0,
            },
            quantity: args.quantity
        })
    },
    wolf_fang(args: ItemParams) {
        return new Item({
            name: 'wolf fang',
            size: 1,
            value: 20,
            quantity: args.quantity
        })
    },
} as const

type ItemKey = keyof typeof items;

function isValidItemKey(key: string): key is ItemKey {
    return key in items;
}

function getItem(itemName: ItemKey, args: number | ItemParams = 1): Item {
    if (typeof args === 'number') {
        args = { quantity: args } as ItemParams
    } else if (!('quantity' in args)) {
        args.quantity = 1
    }
    if (!items[itemName]) {
        throw new Error(`Item ${itemName} not found`)
    }
    const item = items[itemName](args)
    item.key = itemName.toString()
    return item
}

const potions = new Map(
    [
        [['giraffe gizzard', 'blue liquid', 'spritzer hair'], getItem('bug_repellent')],
        [['maple leaf', 'spritzer hair', 'ochre stone', 'music box', 'clear liquid'], getItem('earth_potion')],
    ]
)

// make sure the ingredients are sorted right and return a function to copy the potion
let sorted_potions = new Map()
potions.forEach(function (value, key) {
    sorted_potions.set(key.sort().join(', '), value.copy.bind(value))
})

export { getItem, ItemKey, isValidItemKey, sorted_potions as potions };
