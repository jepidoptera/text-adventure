import { Item } from '../../game/location.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts';

const items: { [key: string]: (...args: any) => Item } = {
    gold(quantity: number) {
        class Gold extends Item {
            constructor(quantity: number) {
                super({
                    name: 'gold',
                    value: 1,
                    size: 0.02,
                    quantity: quantity,
                })
            }
            get display(): string {
                return `${this.quantity} GP`
            }
        }
        return new Gold(quantity)
    },
    pile_of_gold(args: { quantity: number, name?: string }) {
        class GoldBag extends Item {
            constructor() {
                super({
                    name: args?.name || 'pile of gold',
                    value: 1,
                    size: 0.02,
                    quantity: args.quantity,
                    acquire: (player) => {
                        player.inventory.add(items.gold(args.quantity))
                        player.inventory.remove(this)
                        color(black)
                        print(`Got ${args.quantity ?? 0} GP`)
                    },
                })
            }
            get display(): string {
                return this.name
            }
        }
        return new GoldBag()
    },
    arrows(quantity: number) {
        return new Item({
            name: 'arrows',
            value: 1,
            quantity: quantity
        })
    },
    shortsword(quantity: number) {
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
            quantity: quantity
        })
    },

    // Consumables
    ear_of_corn(quantity: number) {
        return new Item({
            name: 'corn ear',
            description: 'an ear of corn',
            value: 1,
            eat: (player) => {
                player.hunger -= 8.5
                player.sp += 12
            },
            quantity: quantity
        })
    },
    satchel_of_peas(quantity: number) {
        return new Item({
            name: 'satchel of peas',
            description: 'a satchel of peas',
            value: 11,
            eat: (player) => {
                player.hunger -= 10
                player.sp += 10
            },
            quantity: quantity
        })
    },
    banana(quantity: number) {
        return new Item({
            name: 'banana',
            description: 'a banana',
            value: 4,
            eat: (player) => {
                player.hunger -= 8
                player.sp += 8
            },
            quantity: quantity
        })
    },
    side_of_meat(quantity: number) {
        return new Item({
            name: 'side of meat',
            description: 'a side of meat',
            value: 18,
            eat: (player) => {
                player.hunger -= 80
                player.sp += 60
            },
            quantity: quantity
        })
    },
    flask_of_wine(quantity: number) {
        return new Item({
            name: 'flask of wine',
            value: 25,
            drink: (player) => {
                player.mp += 10;
            },
            quantity: quantity
        })
    },
    healing_potion(quantity: number) {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 25,
            drink: (player) => {
                player.hp += 10;
            },
            size: 0.4,
            quantity: quantity
        })
    },
    clear_liquid(quantity: number) {
        return new Item({
            name: 'clear liquid',
            description: 'a clear liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            quantity: quantity
        })
    },
    red_liquid(quantity: number) {
        return new Item({
            name: 'red liquid',
            description: 'a red liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            quantity: quantity
        })
    },
    blue_liquid(quantity: number) {
        return new Item({
            name: 'blue liquid',
            description: 'a blue liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            quantity: quantity
        })
    },
    dark_sword(quantity: number) {
        return new Item({
            name: 'dark sword',
            size: 3.5,
            value: 110,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 3.0,
            },
            quantity: quantity
        })
    },
    battle_axe(quantity: number) {
        return new Item({
            name: 'battle axe',
            size: 1,
            value: 55,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 3.0,
            },
            quantity: quantity
        })
    },
    scythe(quantity: number) {
        return new Item({
            name: 'scythe',
            size: 2.0,
            value: 43,
            weapon_stats: {
                weapon_type: 'axe',
                sharp_damage: 4.5,
            },
            quantity: quantity
        })
    },
    hand_axe(quantity: number) {
        return new Item({
            name: 'hand axe',
            size: 1.0,
            value: 19,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 1.5,
                sharp_damage: 2.0,
            },
            quantity: quantity
        })
    },
    axe_of_the_cat(quantity: number) {
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
            quantity: quantity
        })
    },
    axe(quantity: number) {
        return new Item({
            name: 'axe',
            size: 2.0,
            value: 28,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            quantity: quantity
        })
    },
    lightning_staff(quantity: number) {
        return new Item({
            name: 'lightning staff',
            size: 2.0,
            value: 950,
            weapon_stats: {
                weapon_type: 'bolt',
                blunt_damage: 2.0,
                magic_damage: 6.0,
            },
            quantity: quantity
        })
    },
    crossbow(quantity: number) {
        return new Item({
            name: 'crossbow',
            size: 1.6,
            value: 455,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 13.0,
                sharp_damage: 50.0,
            },
            quantity: quantity
        })
    },
    hand_crossbow(quantity: number) {
        return new Item({
            name: 'hand crossbow',
            size: 1.0,
            value: 84,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 25.0,
            },
            quantity: quantity
        })
    },
    short_bow(quantity: number) {
        return new Item({
            name: 'short bow',
            size: 0.8,
            value: 35,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 6.0,
                sharp_damage: 18.0,
            },
            quantity: quantity
        })
    },
    ballista(quantity: number) {
        return new Item({
            name: 'ballista',
            size: 4.5,
            value: 5000,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 140.0,
                sharp_damage: 234.0,
            },
            quantity: quantity
        })
    },
    heavy_crossbow(quantity: number) {
        return new Item({
            name: 'heavy crossbow',
            size: 2.0,
            value: 890,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 24.0,
                sharp_damage: 60.0,
            },
            quantity: quantity
        })
    },
    composite_bow(quantity: number) {
        return new Item({
            name: 'composite bow',
            size: 2.4,
            value: 2000,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 15.0,
                sharp_damage: 58.0,
            },
            quantity: quantity
        })
    },
    long_bow(quantity: number) {
        return new Item({
            name: 'long bow',
            size: 1.3,
            value: 210,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 44.0,
            },
            quantity: quantity
        })
    },
    mighty_warhammer(quantity: number) {
        return new Item({
            name: 'mighty warhammer',
            size: 4.0,
            value: 110,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 5.0,
            },
            quantity: quantity
        })
    },
    club(quantity: number) {
        return new Item({
            name: 'club',
            size: 1,
            value: 4,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
            },
            quantity: quantity
        })
    },
    hardened_club(quantity: number) {
        return new Item({
            name: 'hardened club',
            size: 2.0,
            value: 10,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.3,
            },
            quantity: quantity
        })
    },
    warhammer(quantity: number) {
        return new Item({
            name: 'warhammer',
            size: 2.4,
            value: 34,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 4.0,
            },
            quantity: quantity
        })
    },
    flail(quantity: number) {
        return new Item({
            name: 'flail',
            size: 1.4,
            value: 14,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.0,
                sharp_damage: 0.5,
            },
            quantity: quantity
        })
    },
    fist(quantity: number) {
        return new Item({
            name: 'fists',
            size: 1,
            value: 0,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 1.0,
            },
            quantity: quantity
        })
    },
    wooden_stick(quantity: number) {
        return new Item({
            name: 'wooden stick',
            size: 1,
            value: 4,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.5,
            },
            quantity: quantity
        })
    },
    morning_star(quantity: number) {
        return new Item({
            name: 'morning star',
            size: 1,
            value: 20,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            quantity: quantity
        })
    },
    metal_bar(quantity: number) {
        return new Item({
            name: 'metal bar',
            size: 1.5,
            value: 9,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.0,
            },
            quantity: quantity
        })
    },
    megarian_club(quantity: number) {
        return new Item({
            name: 'megarian club',
            size: 1,
            value: 250,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 6.0,
            },
            quantity: quantity
        })
    },
    spiked_club(quantity: number) {
        return new Item({
            name: 'spiked club',
            size: 1.5,
            value: 12,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 1.0,
            },
            quantity: quantity
        })
    },
    long_rapier(quantity: number) {
        return new Item({
            name: 'long rapier',
            size: 1.5,
            value: 22,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.5,
            },
            quantity: quantity
        })
    },
    dagger(quantity: number) {
        return new Item({
            name: 'dagger',
            size: 0.5,
            value: 5,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 2.0,
            },
            quantity: quantity
        })
    },
    heavy_spear(quantity: number) {
        return new Item({
            name: 'heavy spear',
            size: 1,
            value: 59,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 4.0,
            },
            quantity: quantity
        })
    },
    long_dagger(quantity: number) {
        return new Item({
            name: 'long dagger',
            size: 0.8,
            value: 8,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 2.5,
            },
            quantity: quantity
        })
    },
    mighty_gigasarm(quantity: number) {
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
            quantity: quantity
        })
    },
    trident(quantity: number) {
        return new Item({
            name: 'trident',
            size: 1,
            value: 125,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 6.2,
            },
            quantity: quantity
        })
    },
    mighty_warfork(quantity: number) {
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
            quantity: quantity
        })
    },
    steel_polearm(quantity: number) {
        return new Item({
            name: 'steel polearm',
            size: 2.5,
            value: 35,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 3.2,
            },
            quantity: quantity
        })
    },
    lance(quantity: number) {
        return new Item({
            name: 'lance',
            size: 1,
            value: 83,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 5.0,
            },
            quantity: quantity
        })
    },
    spear(quantity: number) {
        return new Item({
            name: 'spear',
            size: 2.0,
            value: 32,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 4.0,
            },
            quantity: quantity
        })
    },
    rapier(quantity: number) {
        return new Item({
            name: 'rapier',
            size: 1.0,
            value: 14,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.0,
            },
            quantity: quantity
        })
    },
    jagged_polearm(quantity: number) {
        return new Item({
            name: 'jagged polearm',
            size: 3.0,
            value: 58,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.5,
                sharp_damage: 3.5,
            },
            quantity: quantity
        })
    },
    psionic_dagger(quantity: number) {
        return new Item({
            name: 'psionic dagger',
            size: 2.0,
            value: 764,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.0,
                magic_damage: 3.0,
            },
            quantity: quantity
        })
    },
    polearm(quantity: number) {
        return new Item({
            name: 'polearm',
            size: 2.0,
            value: 17,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 0.9,
                sharp_damage: 2.44,
            },
            quantity: quantity
        })
    },
    crystal_ultima_blade(quantity: number) {
        return new Item({
            name: 'crystal ultima blade',
            size: 1,
            value: 740,
            weapon_stats: {
                weapon_type: 'sword',
                sharp_damage: 7.77,
            },
            quantity: quantity
        })
    },
    Glory_Blade(quantity: number) {
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
            quantity: quantity
        })
    },
    mighty_excalabor(quantity: number) {
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
            quantity: quantity
        })
    },
    scimitar(quantity: number) {
        return new Item({
            name: 'scimitar',
            size: 1.4,
            value: 40,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 0.2,
                sharp_damage: 3.8,
            },
            quantity: quantity
        })
    },
    silver_sword(quantity: number) {
        return new Item({
            name: 'silver sword',
            size: 3.5,
            value: 150,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 2.0,
                sharp_damage: 4.0,
            },
            quantity: quantity
        })
    },
    broadsword(quantity: number) {
        return new Item({
            name: 'broadsword',
            size: 2.0,
            value: 20,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 0.5,
                sharp_damage: 3.0,
            },
            quantity: quantity
        })
    },
    longsword(quantity: number) {
        return new Item({
            name: 'longsword',
            size: 3.0,
            value: 42,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 1.0,
                sharp_damage: 3.5,
            },
            quantity: quantity
        })
    },
    blade_of_time(quantity: number) {
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
            quantity: quantity
        })
    },
    claymoore(quantity: number) {
        return new Item({
            name: 'claymoore',
            size: 5.0,
            value: 52,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 2.0,
            },
            quantity: quantity
        })
    },
    channeled_blade(quantity: number) {
        return new Item({
            name: 'channeled blade',
            size: 4.0,
            value: 365,
            weapon_stats: {
                weapon_type: 'sword',
                magic_damage: 1.5,
                sharp_damage: 6.0,
            },
            quantity: quantity
        })
    },
    a_burger(quantity: number) {
        return new Item({
            name: 'a burger',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    chicken_leg(quantity: number) {
        return new Item({
            name: 'chicken leg',
            size: 0.2,
            value: 8,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    corn_ear(quantity: number) {
        return new Item({
            name: 'corn ear',
            size: 0.22,
            value: 6,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    dog_steak(quantity: number) {
        return new Item({
            name: 'dog steak',
            size: 0.8,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    full_ration(quantity: number) {
        return new Item({
            name: 'full ration',
            size: 0.8,
            value: 22,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    giraffe_gizzard(quantity: number) {
        return new Item({
            name: 'giraffe gizzard',
            size: 1,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    hazelnut(quantity: number) {
        return new Item({
            name: 'hazelnut',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    loaf_of_bread(quantity: number) {
        return new Item({
            name: 'loaf of bread',
            size: 0.5,
            value: 10,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    mushroom(quantity: number) {
        return new Item({
            name: 'mushroom',
            size: 0.2,
            value: 50,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    sandwich(quantity: number) {
        return new Item({
            name: 'sandwich',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            quantity: quantity
        })
    },
    bug_repelent(quantity: number) {
        return new Item({
            name: 'bug repelent',
            size: 0.1,
            value: 0,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    full_healing_potion(quantity: number) {
        return new Item({
            name: 'full healing potion',
            size: 0.4,
            value: 30,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    keg_of_wine(quantity: number) {
        return new Item({
            name: 'keg of wine',
            size: 1.5,
            value: 45,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    mostly_healing_potion(quantity: number) {
        return new Item({
            name: 'mostly healing potion',
            size: 0.4,
            value: 10,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    partial_healing_potion(quantity: number) {
        return new Item({
            name: 'partial healing potion',
            size: 0.4,
            value: 5,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    poison(quantity: number) {
        return new Item({
            name: 'poison',
            size: 0.4,
            value: 0,
            drink: (player) => {
                print('TODO: drink this')
            },
            quantity: quantity
        })
    },
    acid(quantity: number) {
        return new Item({
            name: 'acid',
            size: 1,
            value: 80,
            quantity: quantity
        })
    },
    adilons_colorful_history(quantity: number) {
        return new Item({
            name: 'adilon\'s colorful history',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    amber_chunk(quantity: number) {
        return new Item({
            name: 'amber chunk',
            size: 0.5,
            value: 0,
            quantity: quantity
        })
    },
    ballista_bolt(quantity: number) {
        return new Item({
            name: 'ballista bolt',
            size: 0.5,
            value: 16,
            quantity: quantity
        })
    },
    banded_mail(quantity: number) {
        return new Item({
            name: 'banded mail',
            size: 1,
            value: 210,
            quantity: quantity
        })
    },
    boar_tusk(quantity: number) {
        return new Item({
            name: 'boar tusk',
            size: 1,
            value: 45,
            quantity: quantity
        })
    },
    camera(quantity: number) {
        return new Item({
            name: 'camera',
            size: 1,
            value: 65,
            quantity: quantity
        })
    },
    chain_mail(quantity: number) {
        return new Item({
            name: 'chain mail',
            size: 1,
            value: 110,
            quantity: quantity
        })
    },
    citrus_jewel(quantity: number) {
        return new Item({
            name: 'citrus jewel',
            size: 1,
            value: 1000,
            quantity: quantity
        })
    },
    cure(quantity: number) {
        return new Item({
            name: 'cure',
            size: 1,
            value: 110,
            quantity: quantity
        })
    },
    draught_of_visions(quantity: number) {
        return new Item({
            name: 'draught of visions',
            size: 1,
            value: 140,
            quantity: quantity
        })
    },
    ear_plugs(quantity: number) {
        return new Item({
            name: 'ear plugs',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    earth_potion(quantity: number) {
        return new Item({
            name: 'earth potion',
            size: 0.4,
            value: 0,
            quantity: quantity
        })
    },
    enhanced_club(quantity: number) {
        return new Item({
            name: 'enhanced club',
            size: 1,
            value: 17,
            quantity: quantity
        })
    },
    flute(quantity: number) {
        return new Item({
            name: 'flute',
            size: 1,
            value: 100,
            quantity: quantity
        })
    },
    full_plate(quantity: number) {
        return new Item({
            name: 'full plate',
            size: 1,
            value: 1000,
            quantity: quantity
        })
    },
    glory_blade(quantity: number) {
        return new Item({
            name: 'glory blade',
            size: 1,
            value: 29661,
            quantity: quantity
        })
    },
    gold_potion(quantity: number) {
        return new Item({
            name: 'gold potion',
            size: 1,
            value: 500,
            quantity: quantity
        })
    },
    gold_sludge(quantity: number) {
        return new Item({
            name: 'gold sludge',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    gold_watch(quantity: number) {
        return new Item({
            name: 'gold watch',
            size: 1,
            value: 60,
            quantity: quantity
        })
    },
    golden_pitchfork(quantity: number) {
        return new Item({
            name: 'golden pitchfork',
            size: 1,
            value: 48,
            quantity: quantity
        })
    },
    hang_glider(quantity: number) {
        return new Item({
            name: 'hang glider',
            size: 1,
            value: 350,
            quantity: quantity
        })
    },
    horn(quantity: number) {
        return new Item({
            name: 'horn',
            size: 1,
            value: 200,
            quantity: quantity
        })
    },
    how_to_kill_things(quantity: number) {
        return new Item({
            name: 'how to kill things',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    jespridge_feather(quantity: number) {
        return new Item({
            name: 'jespridge feather',
            size: 1,
            value: 30,
            quantity: quantity
        })
    },
    jespridge_horn(quantity: number) {
        return new Item({
            name: 'jespridge horn',
            size: 1,
            value: 100,
            quantity: quantity
        })
    },
    leather_armor(quantity: number) {
        return new Item({
            name: 'leather armor',
            size: 1,
            value: 15,
            quantity: quantity
        })
    },
    light_chainmail(quantity: number) {
        return new Item({
            name: 'light chainmail',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    light_plate(quantity: number) {
        return new Item({
            name: 'light plate',
            size: 1,
            value: 425,
            quantity: quantity
        })
    },
    list(quantity: number) {
        return new Item({
            name: 'list',
            size: 0.1,
            value: 0,
            quantity: quantity
        })
    },
    lute_de_lumonate(quantity: number) {
        return new Item({
            name: 'lute de lumonate',
            size: 0.3,
            value: 0,
            quantity: quantity
        })
    },
    mace(quantity: number) {
        return new Item({
            name: 'mace',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    magic_ring(quantity: number) {
        return new Item({
            name: 'magic ring',
            size: 0.05,
            value: 900,
            quantity: quantity
        })
    },
    mana_draught(quantity: number) {
        return new Item({
            name: 'mana draught',
            size: 1,
            value: 400,
            quantity: quantity
        })
    },
    maple_leaf(quantity: number) {
        return new Item({
            name: 'maple leaf',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    mighty_megaraclub(quantity: number) {
        return new Item({
            name: 'mighty megaraclub',
            size: 1,
            value: 500,
            quantity: quantity
        })
    },
    monogrammed_pen(quantity: number) {
        return new Item({
            name: 'monogrammed pen',
            size: 1,
            value: 100,
            quantity: quantity
        })
    },
    music_box(quantity: number) {
        return new Item({
            name: 'music box',
            size: 0.3,
            value: 200,
            quantity: quantity
        })
    },
    ochre_stone(quantity: number) {
        return new Item({
            name: 'ochre stone',
            size: 0.5,
            value: 110,
            quantity: quantity
        })
    },
    pitchfork(quantity: number) {
        return new Item({
            name: 'pitchfork',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    portal_detector(quantity: number) {
        return new Item({
            name: 'portal detector',
            size: 1,
            value: 265,
            quantity: quantity
        })
    },
    potions_of_clout(quantity: number) {
        return new Item({
            name: 'potions of clout',
            size: 1,
            value: 8000,
            quantity: quantity
        })
    },
    quarterstaff(quantity: number) {
        return new Item({
            name: 'quarterstaff',
            size: 1,
            value: 12,
            quantity: quantity
        })
    },
    rake(quantity: number) {
        return new Item({
            name: 'rake',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    recipe(quantity: number) {
        return new Item({
            name: 'recipe',
            size: 0.1,
            value: 0,
            quantity: quantity
        })
    },
    ring_of_dreams(quantity: number) {
        return new Item({
            name: 'ring of dreams',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    ring_of_life(quantity: number) {
        return new Item({
            name: 'ring of life',
            size: 1,
            value: 800,
            quantity: quantity
        })
    },
    ring_of_nature(quantity: number) {
        return new Item({
            name: 'ring of nature',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    ring_of_power(quantity: number) {
        return new Item({
            name: 'ring of power',
            size: 1,
            value: 700,
            quantity: quantity
        })
    },
    ring_of_stone(quantity: number) {
        return new Item({
            name: 'ring of stone',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    ring_of_strength(quantity: number) {
        return new Item({
            name: 'ring of strength',
            size: 1,
            value: 600,
            quantity: quantity
        })
    },
    ring_of_time(quantity: number) {
        return new Item({
            name: 'ring of time',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    ring_of_ultimate_power(quantity: number) {
        return new Item({
            name: 'ring of ultimate power',
            size: 0.05,
            value: 0,
            quantity: quantity
        })
    },
    shovel(quantity: number) {
        return new Item({
            name: 'shovel',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    sickle(quantity: number) {
        return new Item({
            name: 'sickle',
            size: 2.0,
            value: 36,
            quantity: quantity
        })
    },
    soul(quantity: number) {
        return new Item({
            name: 'soul',
            size: 1,
            value: 10000,
            quantity: quantity
        })
    },
    spell_book(quantity: number) {
        return new Item({
            name: 'spell book',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    spiked_flail(quantity: number) {
        return new Item({
            name: 'spiked flail',
            size: 1,
            value: 17,
            quantity: quantity
        })
    },
    spritzer_hair(quantity: number) {
        return new Item({
            name: 'spritzer hair',
            size: 0.1,
            value: 30,
            quantity: quantity
        })
    },
    studded_leather(quantity: number) {
        return new Item({
            name: 'studded leather',
            size: 1,
            value: 30,
            quantity: quantity
        })
    },
    telescope(quantity: number) {
        return new Item({
            name: 'telescope',
            size: 1,
            value: 25,
            quantity: quantity
        })
    },
    the_colorful_history_of_adilon(quantity: number) {
        return new Item({
            name: 'the colorful history of adilon',
            size: 1,
            value: 50,
            quantity: quantity
        })
    },
    vanish_potion(quantity: number) {
        return new Item({
            name: 'vanish potion',
            size: 1,
            value: 200,
            quantity: quantity
        })
    },
    wand(quantity: number) {
        return new Item({
            name: 'wand',
            size: 1,
            value: 105,
            quantity: quantity
        })
    },
    whip(quantity: number) {
        return new Item({
            name: 'whip',
            size: 0.5,
            value: 11,
            quantity: quantity
        })
    },
    spy_o_scope(quantity: number) {
        return new Item({
            name: 'spy-o-scope',
            size: 1,
            value: 200,
            quantity: quantity
        })
    },
    gavel(quantity: number) {
        return new Item({
            name: 'gavel',
            size: 1,
            value: 20,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
            },
            quantity: quantity
        })
    },
    wolf_fang(quantity: number) {
        return new Item({
            name: 'wolf fang',
            size: 1,
            value: 20,
            quantity: quantity
        })
    },
    teeth(quantity: number) {
        return new Item({
            name: 'teeth',
            weapon_stats: {
                weapon_type: 'teeth',
                sharp_damage: 1.0,
            }
        })
    },
    claws(quantity: number) {
        return new Item({
            name: 'claws',
            weapon_stats: {
                weapon_type: 'sword',
                sharp_damage: 1.0,
            }
        })
    },
    beak(quantity: number) {
        return new Item({
            name: 'beak',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    },
    horns(quantity: number) {
        return new Item({
            name: 'horns',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    },
    fangs(quantity: number) {
        return new Item({
            name: 'fangs',
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 1.0,
            }
        })
    }
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

export { items, sorted_potions as potions };
