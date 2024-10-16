import { Item, ItemParams } from '../../game/item.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts';

const items = {
    gold(args: ItemParams) {
        return new Item({
            name: 'gold',
            size: 0.02,
            value: 1,
            quantity: args.quantity
        }).on_acquire(function (player) {
            player.inventory.add(items.gold({ name: 'gold', quantity: args.quantity ?? 1 }))
            player.inventory.remove(this)
            color(black)
            print(`Got ${args.quantity ?? 0} GP`)
        })
    },
    pile_of_gold(args: ItemParams) {
        return new Item({
            name: args?.name || 'pile of gold',
            value: 1,
            size: 0.02,
            quantity: args.quantity,
        }).on_acquire(function (player) {
            player.inventory.add(items.gold({ name: 'gold', quantity: args.quantity ?? 1 }))
            player.inventory.remove(this)
            color(black)
            print(`Got ${args.quantity ?? 0} GP`)
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
                weapon_type: 'sword',
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
            eat: (player) => {
                player.hunger -= 8.5
                player.sp += 12
            },
            quantity: args.quantity
        })
    },
    satchel_of_peas(args: ItemParams) {
        return new Item({
            name: 'satchel of peas',
            description: 'a satchel of peas',
            value: 11,
            eat: (player) => {
                player.hunger -= 10
                player.sp += 10
            },
            quantity: args.quantity
        })
    },
    banana(args: ItemParams) {
        return new Item({
            name: 'banana',
            description: 'a banana',
            value: 4,
            eat: (player) => {
                player.hunger -= 8
                player.sp += 8
            },
            quantity: args.quantity
        })
    },
    side_of_meat(args: ItemParams) {
        return new Item({
            name: 'side of meat',
            description: 'a side of meat',
            value: 18,
            eat: (player) => {
                player.hunger -= 80
                player.sp += 60
            },
            quantity: args.quantity
        })
    },
    flask_of_wine(args: ItemParams) {
        return new Item({
            name: 'flask of wine',
            value: 25,
            drink: (player) => {
                player.mp += 10;
            },
            quantity: args.quantity
        })
    },
    healing_potion(args: ItemParams) {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 25,
            drink: (player) => {
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
            drink: (player) => {
                player.hp = 0;
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
            drink: (player) => {
                player.hp = 0;
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
            drink: (player) => {
                player.hp = 0;
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
                weapon_type: 'sword',
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
                weapon_type: 'axe',
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
                weapon_type: 'axe',
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
                weapon_type: 'axe',
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
                weapon_type: 'axe',
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
                weapon_type: 'axe',
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
                weapon_type: 'bolt',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'bow',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
                blunt_damage: 3.0,
                sharp_damage: 0.5,
            },
            quantity: args.quantity
        })
    },
    fist(args: ItemParams) {
        return new Item({
            name: 'fists',
            size: 1,
            value: 0,
            weapon_stats: {
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'club',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'spear',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
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
                weapon_type: 'sword',
                magic_damage: 1.5,
                sharp_damage: 6.0,
            },
            quantity: args.quantity
        })
    },
    a_burger(args: ItemParams) {
        return new Item({
            name: 'a burger',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    chicken_leg(args: ItemParams) {
        return new Item({
            name: 'chicken leg',
            size: 0.2,
            value: 8,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    dog_steak(args: ItemParams) {
        return new Item({
            name: 'dog steak',
            size: 0.8,
            value: 0,
            eat: (player) => {
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
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    giraffe_gizzard(args: ItemParams) {
        return new Item({
            name: 'giraffe gizzard',
            size: 1,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    hazelnut(args: ItemParams) {
        return new Item({
            name: 'hazelnut',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    loaf_of_bread(args: ItemParams) {
        return new Item({
            name: 'loaf of bread',
            size: 0.5,
            value: 10,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    mushroom(args: ItemParams) {
        return new Item({
            name: 'mushroom',
            size: 0.2,
            value: 50,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    sandwich(args: ItemParams) {
        return new Item({
            name: 'sandwich',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: args.quantity
        })
    },
    bug_repelent(args: ItemParams) {
        return new Item({
            name: 'bug repelent',
            size: 0.1,
            value: 0,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: args.quantity
        })
    },
    full_healing_potion(args: ItemParams) {
        return new Item({
            name: 'full healing potion',
            size: 0.4,
            value: 30,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: args.quantity
        })
    },
    keg_of_wine(args: ItemParams) {
        return new Item({
            name: 'keg of wine',
            size: 1.5,
            value: 45,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: args.quantity
        })
    },
    mostly_healing_potion(args: ItemParams) {
        return new Item({
            name: 'mostly healing potion',
            size: 0.4,
            value: 10,
            drink: (player) => {
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
            drink: (player) => {
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
            drink: (player) => {
                print('TODO: drink this')
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
    banded_mail(args: ItemParams) {
        return new Item({
            name: 'banded mail',
            size: 1,
            value: 210,
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
    chain_mail(args: ItemParams) {
        return new Item({
            name: 'chain mail',
            size: 1,
            value: 110,
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
    full_plate(args: ItemParams) {
        return new Item({
            name: 'full plate',
            size: 1,
            value: 1000,
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
            size: 1,
            value: 15,
            quantity: args.quantity
        })
    },
    light_chainmail(args: ItemParams) {
        return new Item({
            name: 'light chainmail',
            size: 1,
            value: 50,
            quantity: args.quantity
        })
    },
    light_plate(args: ItemParams) {
        return new Item({
            name: 'light plate',
            size: 1,
            value: 425,
            quantity: args.quantity
        })
    },
    list(args: ItemParams) {
        return new Item({
            name: 'list',
            size: 0.1,
            value: 0,
            quantity: args.quantity
        })
    },
    lute_de_lumonate(args: ItemParams) {
        return new Item({
            name: 'lute de lumonate',
            size: 0.3,
            value: 0,
            quantity: args.quantity
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
            color(black, white); print("|\"hope it kills the bugs   |",); color(black, darkwhite); print()
            color(black, white); print("| before it kills you\"     |",); color(black, darkwhite); print()
            color(black, white); print("|             - Grandma    |", 1); color(black, darkwhite); print()
            color(black, white); print("|INGREDIENTS:              |", 1); color(black, darkwhite); print()
            color(black, white); print("| - 1 giraffe gizzard      |", 1); color(black, darkwhite); print()
            color(black, white); print("| - 1 spritzer hair        |", 1); color(black, darkwhite); print()
            color(black, white); print("| - some blue liquid       |", 1); color(black, darkwhite); print()
            color(black, white); print("|                          |", 1); color(black, darkwhite); print()
            color(black, white); print("|When you have everything, |", 1); color(black, darkwhite); print()
            color(black, white); print("|find a steel pot and type |", 1); color(black, darkwhite); print()
            color(black, white); print("|      'mix formula'       |", 1); color(black, darkwhite); print()
            color(black, white); print("|         ENJOY!           |", 1); color(black, darkwhite); print()
            color(black, white); print("|__________________________|", 1); color(black, darkwhite); print()
            color(black, white); print("____________________________", 1); color(black, darkwhite); print()
            color(black, white); print("|SURGEON GENERALS WARNING: |", 1); color(black, darkwhite); print()
            color(black, white); print("|Do not eat for fear of the|", 1); color(black, darkwhite); print()
            color(black, white); print("|lung-boil disease.        |", 1); color(black, darkwhite); print()
            color(black, white); print(" \/\/\/\/\/\/\/\/\/\/\/\/\/ ", 1); color(black, darkwhite); print()
            if (player?.flags.assistant) color(magenta); print("   --ASSISTANT: The ingredients for this are scattered around town.")
        })
    },
    ring_of_dreams(args: ItemParams) {
        return new Item({
            name: 'ring of dreams',
            size: 0.05,
            value: 0,
            quantity: args.quantity
        })
    },
    ring_of_life(args: ItemParams) {
        return new Item({
            name: 'ring of life',
            size: 1,
            value: 800,
            quantity: args.quantity
        })
    },
    ring_of_nature(args: ItemParams) {
        return new Item({
            name: 'ring of nature',
            size: 0.05,
            value: 0,
            quantity: args.quantity
        })
    },
    ring_of_power(args: ItemParams) {
        return new Item({
            name: 'ring of power',
            size: 1,
            value: 700,
            quantity: args.quantity
        })
    },
    ring_of_stone(args: ItemParams) {
        return new Item({
            name: 'ring of stone',
            size: 0.05,
            value: 0,
            quantity: args.quantity
        })
    },
    ring_of_strength(args: ItemParams) {
        return new Item({
            name: 'ring of strength',
            size: 1,
            value: 600,
            quantity: args.quantity
        })
    },
    ring_of_time(args: ItemParams) {
        return new Item({
            name: 'ring of time',
            size: 0.05,
            value: 0,
            quantity: args.quantity
        })
    },
    ring_of_ultimate_power(args: ItemParams) {
        return new Item({
            name: 'ring of ultimate power',
            size: 0.05,
            value: 0,
            quantity: args.quantity
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
    studded_leather(args: ItemParams) {
        return new Item({
            name: 'studded leather',
            size: 1,
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
                weapon_type: 'club',
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
    teeth(args: ItemParams) {
        return new Item({
            name: args.name || 'teeth',
            weapon_stats: {
                weapon_type: 'teeth',
                sharp_damage: 1.0,
            }
        })
    },
    claws(args: ItemParams) {
        return new Item({
            name: args.name || 'claws',
            weapon_stats: {
                weapon_type: 'sword',
                sharp_damage: 1.0,
            }
        })
    },
    beak(args: ItemParams) {
        return new Item({
            name: args.name || 'beak',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    },
    horns(args: ItemParams) {
        return new Item({
            name: args.name || 'horns',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    },
    fangs(args: ItemParams) {
        return new Item({
            name: args.name || 'fangs',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    },
    scream(args: ItemParams) {
        return new Item({
            name: args.name || 'scream',
            weapon_stats: {
                weapon_type: 'sonic',
                magic_damage: 1.0
            }
        })
    }
} as const

type ItemKey = keyof typeof items;

function getItem(itemName: ItemKey, args: number | ItemParams = 1): Item {
    if (typeof args === 'number') {
        args = { quantity: args } as ItemParams
    }
    const item = items[itemName](args)
    item.key = itemName.toString()
    return item
}

const potions = new Map(
    [
        [['giraffe gizzard', 'blue liquid', 'spritzer hair'], items.bug_repelent],
    ]
)

// make sure the ingredients are sorted right
let sorted_potions = new Map()
potions.forEach(function (value, key) {
    potions.delete(key)
    sorted_potions.set(key.sort().join(', '), value)
    console.log(key, value.name)
})

export { getItem, ItemKey, sorted_potions as potions };
