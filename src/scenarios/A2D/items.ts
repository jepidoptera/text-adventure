import { Item } from '../../game/location.ts';
import { black, blue, green, cyan, red, magenta, orange, darkwhite, gray, brightblue, brightgreen, brightcyan, brightred, brightmagenta, yellow, white, qbColors } from './colors.ts';

const items: {[key: string]: (...args: any) => Item} = {
    gold(args: {[key: string]: any}) {
        class Gold extends Item {
            constructor(args: {[key: string]: any}) {
                super({
                    name: 'gold',
                    value: 1,
                    size: 0.02,
                    ...args
                })
            }
            get display(): string {
                return `${this.quantity} GP`
            }
        }
        return new Gold(args)
    },
    pile_of_gold(args: {[key: string]: any}) {
        class GoldBag extends Item {
            constructor(args: {[key: string]: any}) {
                super({
                    name: args.name || 'pile of gold',
                    value: 1,
                    size: 0.02,
                    acquire: (player) => {
                        player.inventory.add(items.gold(args.quantity??0))
                        player.inventory.remove(this)
                        color(black)
                        print(`Got ${args.quantity??0} GP`)
                    },
                    ...args
                })
            }
            get display(): string {
                return this.name
            }
        }
        return new GoldBag(args)
    },
    arrows(args: {[key: string]: any}) {
        return new Item({
            name: 'arrows',
            value: 1,
            ...args
        })
    },
    shortsword(args: {[key: string]: any}) {
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
            ...args
        })
    },

    // Consumables
    ear_of_corn(args: {[key: string]: any}) {
        return new Item({
            name: 'corn ear',
            description: 'an ear of corn',
            value: 1,
            eat: (player) => {
                player.hunger -= 8.5
                player.sp += 12
            },
            ...args
        })
    },
    satchel_of_peas(args: {[key: string]: any}) {
        return new Item({
            name: 'satchel of peas',
            description: 'a satchel of peas',
            value: 11,
            eat: (player) => {
                player.hunger -= 10
                player.sp += 10
            },
            ...args
        })
    },
    banana(args: {[key: string]: any}) {
        return new Item({
            name: 'banana',
            description: 'a banana',
            value: 4,
            eat: (player) => {
                player.hunger -= 8
                player.sp += 8
            },
            ...args
        })
    },
    side_of_meat(args: {[key: string]: any}) {
        return new Item({
            name: 'side of meat',
            description: 'a side of meat',
            value: 18,
            eat: (player) => {
                player.hunger -= 80
                player.sp += 60
            },
            ...args
        })
    },
    flask_of_wine(args: {[key: string]: any}) {
        return new Item({
            name: 'flask of wine',
            value: 25,
            drink: (player) => {
                player.mp += 10;
            },
            ...args
        })
    },
    healing_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'healing potion',
            description: '',
            value: 25,
            drink: (player) => {
                player.hp += 10;
            },
            size: 0.4,
            ...args
        })
    },
    clear_liquid(args: {[key: string]: any}) {
        return new Item({
            name: 'clear liquid',
            description: 'a clear liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            ...args
        })
    },
    red_liquid(args: {[key: string]: any}) {
        return new Item({
            name: 'red liquid',
            description: 'a red liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            ...args
        })
    },
    blue_liquid(args: {[key: string]: any}) {
        return new Item({
            name: 'blue liquid',
            description: 'a blue liquid',
            value: 1,
            size: 0.5,
            drink: (player) => {
                player.hp = 0;
            },
            ...args
        })
    },
    dark_sword(args: {[key: string]: any}) {
        return new Item({
            name: 'dark sword',
            size: 3.5,
            value: 110,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 3.0,
            },
            ...args
        })
    },
    battle_axe(args: {[key: string]: any}) {
        return new Item({
            name: 'battle axe',
            size: 1,
            value: 55,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 3.0,
            },
            ...args
        })
    },
    scythe(args: {[key: string]: any}) {
        return new Item({
            name: 'scythe',
            size: 2.0,
            value: 43,
            weapon_stats: {
                weapon_type: 'axe',
                sharp_damage: 4.5,
            },
            ...args
        })
    },
    hand_axe(args: {[key: string]: any}) {
        return new Item({
            name: 'hand axe',
            size: 1.0,
            value: 19,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 1.5,
                sharp_damage: 2.0,
            },
            ...args
        })
    },
    axe_of_the_cat(args: {[key: string]: any}) {
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
            ...args
        })
    },
    axe(args: {[key: string]: any}) {
        return new Item({
            name: 'axe',
            size: 2.0,
            value: 28,
            weapon_stats: {
                weapon_type: 'axe',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            ...args
        })
    },
    lightning_staff(args: {[key: string]: any}) {
        return new Item({
            name: 'lightning staff',
            size: 2.0,
            value: 950,
            weapon_stats: {
                weapon_type: 'bolt',
                blunt_damage: 2.0,
                magic_damage: 6.0,
            },
            ...args
        })
    },
    crossbow(args: {[key: string]: any}) {
        return new Item({
            name: 'crossbow',
            size: 1.6,
            value: 455,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 13.0,
                sharp_damage: 50.0,
            },
            ...args
        })
    },
    hand_crossbow(args: {[key: string]: any}) {
        return new Item({
            name: 'hand crossbow',
            size: 1.0,
            value: 84,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 25.0,
            },
            ...args
        })
    },
    short_bow(args: {[key: string]: any}) {
        return new Item({
            name: 'short bow',
            size: 0.8,
            value: 35,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 6.0,
                sharp_damage: 18.0,
            },
            ...args
        })
    },
    ballista(args: {[key: string]: any}) {
        return new Item({
            name: 'ballista',
            size: 4.5,
            value: 5000,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 140.0,
                sharp_damage: 234.0,
            },
            ...args
        })
    },
    heavy_crossbow(args: {[key: string]: any}) {
        return new Item({
            name: 'heavy crossbow',
            size: 2.0,
            value: 890,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 24.0,
                sharp_damage: 60.0,
            },
            ...args
        })
    },
    composite_bow(args: {[key: string]: any}) {
        return new Item({
            name: 'composite bow',
            size: 2.4,
            value: 2000,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 15.0,
                sharp_damage: 58.0,
            },
            ...args
        })
    },
    long_bow(args: {[key: string]: any}) {
        return new Item({
            name: 'long bow',
            size: 1.3,
            value: 210,
            weapon_stats: {
                weapon_type: 'bow',
                blunt_damage: 8.0,
                sharp_damage: 44.0,
            },
            ...args
        })
    },
    mighty_warhammer(args: {[key: string]: any}) {
        return new Item({
            name: 'mighty warhammer',
            size: 4.0,
            value: 110,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 5.0,
            },
            ...args
        })
    },
    club(args: {[key: string]: any}) {
        return new Item({
            name: 'club',
            size: 1,
            value: 4,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
            },
            ...args
        })
    },
    hardened_club(args: {[key: string]: any}) {
        return new Item({
            name: 'hardened club',
            size: 2.0,
            value: 10,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.3,
            },
            ...args
        })
    },
    warhammer(args: {[key: string]: any}) {
        return new Item({
            name: 'warhammer',
            size: 2.4,
            value: 34,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 4.0,
            },
            ...args
        })
    },
    flail(args: {[key: string]: any}) {
        return new Item({
            name: 'flail',
            size: 1.4,
            value: 14,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.0,
                sharp_damage: 0.5,
            },
            ...args
        })
    },
    fist(args: {[key: string]: any}) {
        return new Item({
            name: 'fist',
            size: 1,
            value: 0,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 1.0,
            },
            ...args
        })
    },
    wooden_stick(args: {[key: string]: any}) {
        return new Item({
            name: 'wooden stick',
            size: 1,
            value: 4,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.5,
            },
            ...args
        })
    },
    morning_star(args: {[key: string]: any}) {
        return new Item({
            name: 'morning star',
            size: 1,
            value: 20,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 2.0,
            },
            ...args
        })
    },
    metal_bar(args: {[key: string]: any}) {
        return new Item({
            name: 'metal bar',
            size: 1.5,
            value: 9,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 3.0,
            },
            ...args
        })
    },
    megarian_club(args: {[key: string]: any}) {
        return new Item({
            name: 'megarian club',
            size: 1,
            value: 250,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 6.0,
            },
            ...args
        })
    },
    spiked_club(args: {[key: string]: any}) {
        return new Item({
            name: 'spiked club',
            size: 1.5,
            value: 12,
            weapon_stats: {
                weapon_type: 'club',
                blunt_damage: 2.0,
                sharp_damage: 1.0,
            },
            ...args
        })
    },
    long_rapier(args: {[key: string]: any}) {
        return new Item({
            name: 'long rapier',
            size: 1.5,
            value: 22,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.5,
            },
            ...args
        })
    },
    dagger(args: {[key: string]: any}) {
        return new Item({
            name: 'dagger',
            size: 0.5,
            value: 5,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 2.0,
            },
            ...args
        })
    },
    heavy_spear(args: {[key: string]: any}) {
        return new Item({
            name: 'heavy spear',
            size: 1,
            value: 59,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 4.0,
            },
            ...args
        })
    },
    long_dagger(args: {[key: string]: any}) {
        return new Item({
            name: 'long dagger',
            size: 0.8,
            value: 8,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 2.5,
            },
            ...args
        })
    },
    mighty_gigasarm(args: {[key: string]: any}) {
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
            ...args
        })
    },
    trident(args: {[key: string]: any}) {
        return new Item({
            name: 'trident',
            size: 1,
            value: 125,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 6.2,
            },
            ...args
        })
    },
    mighty_warfork(args: {[key: string]: any}) {
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
            ...args
        })
    },
    steel_polearm(args: {[key: string]: any}) {
        return new Item({
            name: 'steel polearm',
            size: 2.5,
            value: 35,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.0,
                sharp_damage: 3.2,
            },
            ...args
        })
    },
    lance(args: {[key: string]: any}) {
        return new Item({
            name: 'lance',
            size: 1,
            value: 83,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 5.0,
            },
            ...args
        })
    },
    spear(args: {[key: string]: any}) {
        return new Item({
            name: 'spear',
            size: 2.0,
            value: 32,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 4.0,
            },
            ...args
        })
    },
    rapier(args: {[key: string]: any}) {
        return new Item({
            name: 'rapier',
            size: 1.0,
            value: 14,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.0,
            },
            ...args
        })
    },
    jagged_polearm(args: {[key: string]: any}) {
        return new Item({
            name: 'jagged polearm',
            size: 3.0,
            value: 58,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 1.5,
                sharp_damage: 3.5,
            },
            ...args
        })
    },
    psionic_dagger(args: {[key: string]: any}) {
        return new Item({
            name: 'psionic dagger',
            size: 2.0,
            value: 764,
            weapon_stats: {
                weapon_type: 'spear',
                sharp_damage: 3.0,
                magic_damage: 3.0,
            },
            ...args
        })
    },
    polearm(args: {[key: string]: any}) {
        return new Item({
            name: 'polearm',
            size: 2.0,
            value: 17,
            weapon_stats: {
                weapon_type: 'spear',
                blunt_damage: 0.9,
                sharp_damage: 2.44,
            },
            ...args
        })
    },
    crystal_ultima_blade(args: {[key: string]: any}) {
        return new Item({
            name: 'crystal ultima blade',
            size: 1,
            value: 740,
            weapon_stats: {
                weapon_type: 'sword',
                sharp_damage: 7.77,
            },
            ...args
        })
    },
    Glory_Blade(args: {[key: string]: any}) {
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
            ...args
        })
    },
    mighty_excalabor(args: {[key: string]: any}) {
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
            ...args
        })
    },
    scimitar(args: {[key: string]: any}) {
        return new Item({
            name: 'scimitar',
            size: 1.4,
            value: 40,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 0.2,
                sharp_damage: 3.8,
            },
            ...args
        })
    },
    silver_sword(args: {[key: string]: any}) {
        return new Item({
            name: 'silver sword',
            size: 3.5,
            value: 150,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 2.0,
                sharp_damage: 4.0,
            },
            ...args
        })
    },
    broadsword(args: {[key: string]: any}) {
        return new Item({
            name: 'broadsword',
            size: 2.0,
            value: 20,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 0.5,
                sharp_damage: 3.0,
            },
            ...args
        })
    },
    longsword(args: {[key: string]: any}) {
        return new Item({
            name: 'longsword',
            size: 3.0,
            value: 42,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 1.0,
                sharp_damage: 3.5,
            },
            ...args
        })
    },
    blade_of_time(args: {[key: string]: any}) {
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
            ...args
        })
    },
    claymoore(args: {[key: string]: any}) {
        return new Item({
            name: 'claymoore',
            size: 5.0,
            value: 52,
            weapon_stats: {
                weapon_type: 'sword',
                blunt_damage: 3.0,
                sharp_damage: 2.0,
            },
            ...args
        })
    },
    channeled_blade(args: {[key: string]: any}) {
        return new Item({
            name: 'channeled blade',
            size: 4.0,
            value: 365,
            weapon_stats: {
                weapon_type: 'sword',
                magic_damage: 1.5,
                sharp_damage: 6.0,
            },
            ...args
        })
    },
    a_burger(args: {[key: string]: any}) {
        return new Item({
            name: 'a burger',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    chicken_leg(args: {[key: string]: any}) {
        return new Item({
            name: 'chicken leg',
            size: 0.2,
            value: 8,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    corn_ear(args: {[key: string]: any}) {
        return new Item({
            name: 'corn ear',
            size: 0.22,
            value: 6,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    dog_steak(args: {[key: string]: any}) {
        return new Item({
            name: 'dog steak',
            size: 0.8,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    full_ration(args: {[key: string]: any}) {
        return new Item({
            name: 'full ration',
            size: 0.8,
            value: 22,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    giraffe_gizzard(args: {[key: string]: any}) {
        return new Item({
            name: 'giraffe gizzard',
            size: 1,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    hazelnut(args: {[key: string]: any}) {
        return new Item({
            name: 'hazelnut',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    loaf_of_bread(args: {[key: string]: any}) {
        return new Item({
            name: 'loaf of bread',
            size: 0.5,
            value: 10,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    mushroom(args: {[key: string]: any}) {
        return new Item({
            name: 'mushroom',
            size: 0.2,
            value: 50,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    sandwich(args: {[key: string]: any}) {
        return new Item({
            name: 'sandwich',
            size: 0.2,
            value: 0,
            eat: (player) => {
                print('TODO: eat this')
            },
            ...args
        })
    },
    bug_repelent(args: {[key: string]: any}) {
        return new Item({
            name: 'bug repelent',
            size: 0.1,
            value: 0,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    full_healing_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'full healing potion',
            size: 0.4,
            value: 30,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    keg_of_wine(args: {[key: string]: any}) {
        return new Item({
            name: 'keg of wine',
            size: 1.5,
            value: 45,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    mostly_healing_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'mostly healing potion',
            size: 0.4,
            value: 10,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    partial_healing_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'partial healing potion',
            size: 0.4,
            value: 5,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    poison(args: {[key: string]: any}) {
        return new Item({
            name: 'poison',
            size: 0.4,
            value: 0,
            drink: (player) => {
                print('TODO: drink this')
            },
            ...args
        })
    },
    acid(args: {[key: string]: any}) {
        return new Item({
            name: 'acid',
            size: 1,
            value: 80,
            ...args
        })
    },
    adilons_colorful_history(args: {[key: string]: any}) {
        return new Item({
            name: 'adilon\'s colorful history',
            size: 1,
            value: 50,
            ...args
        })
    },
    amber_chunk(args: {[key: string]: any}) {
        return new Item({
            name: 'amber chunk',
            size: 0.5,
            value: 0,
            ...args
        })
    },
    ballista_bolt(args: {[key: string]: any}) {
        return new Item({
            name: 'ballista bolt',
            size: 0.5,
            value: 16,
            ...args
        })
    },
    banded_mail(args: {[key: string]: any}) {
        return new Item({
            name: 'banded mail',
            size: 1,
            value: 210,
            ...args
        })
    },
    boar_tusk(args: {[key: string]: any}) {
        return new Item({
            name: 'boar tusk',
            size: 1,
            value: 45,
            ...args
        })
    },
    camera(args: {[key: string]: any}) {
        return new Item({
            name: 'camera',
            size: 1,
            value: 65,
            ...args
        })
    },
    chain_mail(args: {[key: string]: any}) {
        return new Item({
            name: 'chain mail',
            size: 1,
            value: 110,
            ...args
        })
    },
    citrus_jewel(args: {[key: string]: any}) {
        return new Item({
            name: 'citrus jewel',
            size: 1,
            value: 1000,
            ...args
        })
    },
    cure(args: {[key: string]: any}) {
        return new Item({
            name: 'cure',
            size: 1,
            value: 110,
            ...args
        })
    },
    draught_of_visions(args: {[key: string]: any}) {
        return new Item({
            name: 'draught of visions',
            size: 1,
            value: 140,
            ...args
        })
    },
    ear_plugs(args: {[key: string]: any}) {
        return new Item({
            name: 'ear plugs',
            size: 1,
            value: 20,
            ...args
        })
    },
    earth_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'earth potion',
            size: 0.4,
            value: 0,
            ...args
        })
    },
    enhanced_club(args: {[key: string]: any}) {
        return new Item({
            name: 'enhanced club',
            size: 1,
            value: 17,
            ...args
        })
    },
    flute(args: {[key: string]: any}) {
        return new Item({
            name: 'flute',
            size: 1,
            value: 100,
            ...args
        })
    },
    full_plate(args: {[key: string]: any}) {
        return new Item({
            name: 'full plate',
            size: 1,
            value: 1000,
            ...args
        })
    },
    glory_blade(args: {[key: string]: any}) {
        return new Item({
            name: 'glory blade',
            size: 1,
            value: 29661,
            ...args
        })
    },
    gold_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'gold potion',
            size: 1,
            value: 500,
            ...args
        })
    },
    gold_sludge(args: {[key: string]: any}) {
        return new Item({
            name: 'gold sludge',
            size: 1,
            value: 50,
            ...args
        })
    },
    gold_watch(args: {[key: string]: any}) {
        return new Item({
            name: 'gold watch',
            size: 1,
            value: 60,
            ...args
        })
    },
    golden_pitchfork(args: {[key: string]: any}) {
        return new Item({
            name: 'golden pitchfork',
            size: 1,
            value: 48,
            ...args
        })
    },
    hang_glider(args: {[key: string]: any}) {
        return new Item({
            name: 'hang glider',
            size: 1,
            value: 350,
            ...args
        })
    },
    horn(args: {[key: string]: any}) {
        return new Item({
            name: 'horn',
            size: 1,
            value: 200,
            ...args
        })
    },
    how_to_kill_things(args: {[key: string]: any}) {
        return new Item({
            name: 'how to kill things',
            size: 1,
            value: 50,
            ...args
        })
    },
    jespridge_feather(args: {[key: string]: any}) {
        return new Item({
            name: 'jespridge feather',
            size: 1,
            value: 30,
            ...args
        })
    },
    jespridge_horn(args: {[key: string]: any}) {
        return new Item({
            name: 'jespridge horn',
            size: 1,
            value: 100,
            ...args
        })
    },
    leather_armor(args: {[key: string]: any}) {
        return new Item({
            name: 'leather armor',
            size: 1,
            value: 15,
            ...args
        })
    },
    light_chainmail(args: {[key: string]: any}) {
        return new Item({
            name: 'light chainmail',
            size: 1,
            value: 50,
            ...args
        })
    },
    light_plate(args: {[key: string]: any}) {
        return new Item({
            name: 'light plate',
            size: 1,
            value: 425,
            ...args
        })
    },
    list(args: {[key: string]: any}) {
        return new Item({
            name: 'list',
            size: 0.1,
            value: 0,
            ...args
        })
    },
    lute_de_lumonate(args: {[key: string]: any}) {
        return new Item({
            name: 'lute de lumonate',
            size: 0.3,
            value: 0,
            ...args
        })
    },
    mace(args: {[key: string]: any}) {
        return new Item({
            name: 'mace',
            size: 1,
            value: 20,
            ...args
        })
    },
    magic_ring(args: {[key: string]: any}) {
        return new Item({
            name: 'magic ring',
            size: 0.05,
            value: 900,
            ...args
        })
    },
    mana_draught(args: {[key: string]: any}) {
        return new Item({
            name: 'mana draught',
            size: 1,
            value: 400,
            ...args
        })
    },
    maple_leaf(args: {[key: string]: any}) {
        return new Item({
            name: 'maple leaf',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    mighty_megaraclub(args: {[key: string]: any}) {
        return new Item({
            name: 'mighty megaraclub',
            size: 1,
            value: 500,
            ...args
        })
    },
    monogrammed_pen(args: {[key: string]: any}) {
        return new Item({
            name: 'monogrammed pen',
            size: 1,
            value: 100,
            ...args
        })
    },
    music_box(args: {[key: string]: any}) {
        return new Item({
            name: 'music box',
            size: 0.3,
            value: 200,
            ...args
        })
    },
    ochre_stone(args: {[key: string]: any}) {
        return new Item({
            name: 'ochre stone',
            size: 0.5,
            value: 110,
            ...args
        })
    },
    pitchfork(args: {[key: string]: any}) {
        return new Item({
            name: 'pitchfork',
            size: 1,
            value: 20,
            ...args
        })
    },
    portal_detector(args: {[key: string]: any}) {
        return new Item({
            name: 'portal detector',
            size: 1,
            value: 265,
            ...args
        })
    },
    potions_of_clout(args: {[key: string]: any}) {
        return new Item({
            name: 'potions of clout',
            size: 1,
            value: 8000,
            ...args
        })
    },
    quarterstaff(args: {[key: string]: any}) {
        return new Item({
            name: 'quarterstaff',
            size: 1,
            value: 12,
            ...args
        })
    },
    rake(args: {[key: string]: any}) {
        return new Item({
            name: 'rake',
            size: 1,
            value: 20,
            ...args
        })
    },
    recipe(args: {[key: string]: any}) {
        return new Item({
            name: 'recipe',
            size: 0.1,
            value: 0,
            ...args
        })
    },
    ring_of_dreams(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of dreams',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    ring_of_life(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of life',
            size: 1,
            value: 800,
            ...args
        })
    },
    ring_of_nature(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of nature',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    ring_of_power(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of power',
            size: 1,
            value: 700,
            ...args
        })
    },
    ring_of_stone(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of stone',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    ring_of_strength(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of strength',
            size: 1,
            value: 600,
            ...args
        })
    },
    ring_of_time(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of time',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    ring_of_ultimate_power(args: {[key: string]: any}) {
        return new Item({
            name: 'ring of ultimate power',
            size: 0.05,
            value: 0,
            ...args
        })
    },
    shovel(args: {[key: string]: any}) {
        return new Item({
            name: 'shovel',
            size: 1,
            value: 20,
            ...args
        })
    },
    sickle(args: {[key: string]: any}) {
        return new Item({
            name: 'sickle',
            size: 2.0,
            value: 36,
            ...args
        })
    },
    soul(args: {[key: string]: any}) {
        return new Item({
            name: 'soul',
            size: 1,
            value: 10000,
            ...args
        })
    },
    spell_book(args: {[key: string]: any}) {
        return new Item({
            name: 'spell book',
            size: 1,
            value: 50,
            ...args
        })
    },
    spiked_flail(args: {[key: string]: any}) {
        return new Item({
            name: 'spiked flail',
            size: 1,
            value: 17,
            ...args
        })
    },
    spritzer_hair(args: {[key: string]: any}) {
        return new Item({
            name: 'spritzer hair',
            size: 0.1,
            value: 30,
            ...args
        })
    },
    studded_leather(args: {[key: string]: any}) {
        return new Item({
            name: 'studded leather',
            size: 1,
            value: 30,
            ...args
        })
    },
    telescope(args: {[key: string]: any}) {
        return new Item({
            name: 'telescope',
            size: 1,
            value: 25,
            ...args
        })
    },
    the_colorful_history_of_adilon(args: {[key: string]: any}) {
        return new Item({
            name: 'the colorful history of adilon',
            size: 1,
            value: 50,
            ...args
        })
    },
    vanish_potion(args: {[key: string]: any}) {
        return new Item({
            name: 'vanish potion',
            size: 1,
            value: 200,
            ...args
        })
    },
    wand(args: {[key: string]: any}) {
        return new Item({
            name: 'wand',
            size: 1,
            value: 105,
            ...args
        })
    },
    whip(args: {[key: string]: any}) {
        return new Item({
            name: 'whip',
            size: 0.5,
            value: 11,
            ...args
        })
    },
    wolf_fang(args: {[key: string]: any}) {
        return new Item({
            name: 'wolf fang',
            size: 1,
            value: 20,
            ...args
        })
    },
}   
     
export { items };
