import { GameState } from "../../game/game.js"
import { characters } from "./characters.js"
import { landmarks } from "./landmarks.js"

const scenario = {
    locations: {
        0: {
            name: "limbo",
            adjacent: {}
        },
        1: {
            name: "Cottage of the Young",
            adjacent: { 'north': 6, 'east': 14, 'west': 15 },
            landmarks: [{
                name: 'sign',
                text: [
                    "--------------------------------------------",
                    "|      Welcome to the world of A2D.        |",
                    "| You are currently in the town of Ierdale |",
                    "|                                          |",
                    "| This is a text-based game where you type |",
                    "| commands to have your character perform  |",
                    "| an action.  To learn about actions you   |",
                    "| can do, type \"help\".                     |",
                    "|------------------------------------------|"
                ]
            }]
        },
        2: {
            name: "North Road",
            adjacent: { 'north': 3, 'east': 21, 'south': 12 },
            landmarks: [{
                name: "sign",
                text: [
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
                    "@  Ierdale Merchant Settlement  @",
                    "@                               @",
                    "@ MAP:         |                @",
                    "@       Police-|-Baracks        @",
                    "@        Books-|-Pets           @",
                    "@    Pawn Shop-|-Food           @",
                    "@       Vacant-O-Armor          @",
                    "@              ^you are here    @",
                    "@                               @",
                    "@                               @",
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
                ]
            }]
        },
        3: {
            name: "North Road",
            adjacent: { 'north': 4, 'east': 20, 'south': 2, 'west': 19 },
            characters: [{ name: 'wandering_clubman' }]
        },
        4: {
            name: "North Road",
            adjacent: { 'north': 26, 'east': 22, 'south': 3, 'west': 333 }
        },
        5: {
            name: "South Road",
            adjacent: { 'north': 12, 'south': 6 }
        },
        6: {
            name: "South Road",
            adjacent: { 'north': 5, 'south': 1, 'west': 137 },
            characters: [{ name: 'peasant_worker' }, { name: 'dog' }, { name: 'dog' }]
        },
        7: {
            name: "West Road",
            adjacent: { 'north': 91, 'east': 11, 'south': 279, 'west': 13 },
            characters: [{ name: 'peddler' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
                    "&                                      &",
                    "&   CLUBMEN HOUSES    /|\\        |     &",
                    "&                      |        \\|/    &",
                    "&                                      &",
                    "& North and South from here            &",
                    "& (please kill them)                   &",
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
                ]
            }]
        },
        8: {
            name: "East Road",
            adjacent: { 'east': 9, 'south': 87, 'west': 12 },
            characters: [{ name: 'peasant_man' }]
        },
        9: {
            name: "East Road",
            adjacent: { 'north': 24, 'east': 10, 'south': 132, 'west': 8 },
            characters: [{ name: 'peddler' }]
        },
        10: {
            name: "East Road",
            adjacent: { 'north': 135, 'east': 10.1, 'south': 305, 'west': 9 }
        },
        10.1: {
            name: "East Road",
            adjacent: { 'north': 10.2, 'east': 93, 'west': 10 }
        },
        10.2: {
            name: "House",
            adjacent: { 'south': 10.1, 'down': 10.3 },
        },
        10.3: {
            name: "Basement",
            adjacent: { 'up': 10.2 },
            characters: [{ name: 'ultra_clubman' }]
        },
        11: {
            name: "West Road",
            adjacent: { 'north': 280, 'east': 12, 'south': 23, 'west': 7 },
            characters: [{ name: 'peasant_woman' }, { name: 'peasant_man' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
                    "&                                      &",
                    "&   CLUBMEN HOUSES    /|\\        |     &",
                    "&                      |        \\|/    &",
                    "&                                      &",
                    "& North and South from here            &",
                    "& (please kill them)                   &",
                    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
                ]
            }]
        },
        12: {
            name: "Center of Town",
            adjacent: { 'north': 2, 'east': 8, 'south': 5, 'west': 11 },
            characters: [{ name: 'wandering_clubman' }, { name: 'wandering_clubman' }, { name: 'colonel_arach' }, { name: 'guard_captain' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "/\\\\------------------------\\   ",
                    "\\// The Town of Ierdale    /   ",
                    " /                         |   ",
                    " | N-Security Office       |   ",
                    " | N,E-Farm                |   ",
                    " | W-Swamp                 |   ",
                    " | W-Clubman houses        |   ",
                    " | N-Merchant Row          |   ",
                    " \\                         |   ",
                    "/\\\\ Please kill the clubmen\\   ",
                    "\\//------------------------/   "
                ]
            }]
        },
        13: {
            name: "West Road",
            adjacent: { 'north': 116, 'east': 7, 'south': 88, 'west': 92 }
        },
        14: {
            name: "Bedroom",
            adjacent: { 'west': 1 },
            characters: [{ name: 'sick_old_cleric' }]
        },
        15: {
            name: "Vegtable Garden",
            adjacent: { 'east': 1, 'south': 18, 'west': 16 },
            items: [{ name: 'ear_of_corn' }],
            landmarks: [{
                name: 'sign',
                text: [
                    " ________________________________",
                    "|                                |",
                    "|     BEWARE OF SCARECROWS       |",
                    "|________________________________|"
                ]
            }]
        },
        16: {
            name: "Vegtable Garden",
            adjacent: { 'east': 15, 'south': 17 },
            characters: [{ name: 'wandering_clubman' }]
        },
        17: {
            name: "Vegtable Garden",
            adjacent: { 'north': 16, 'east': 18 },
            items: [{ name: 'satchel_of_peas' }],
            landmarks: [{ name: 'scarecrow' },
            ]
        },
        18: {
            name: "Vegtable Garden",
            adjacent: { 'north': 15, 'west': 17 }
        },
        19: {
            name: "Pawn Shop",
            adjacent: { 'east': 3 },
            characters: [{ name: 'toothless_man' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "=======================================",
                    "=   PoN shOp                          =",
                    "=   we lyk to by stuf U dunt want     =",
                    "= to pon somting, tipe  'pawn' then   =",
                    "=    tipe wut you wont to pon         =",
                    "= ohr tipe 'list' tu sea wut i hav tu =",
                    "=         sel                         =",
                    "=     thANk yOu,                      =",
                    "=          tHe menegemant             =",
                    "======================================="
                ]
            }]
        },
        20: {
            name: "Grocer",
            adjacent: { 'west': 3 },
            characters: [{ name: 'grocer' }, { name: 'bag_boy' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "ooooooooooooooooooooooooooooooooooooooooooooooooooo",
                    "o                                                 o",
                    "o    Food market of Ierdale                       o",
                    "o                                                 o",
                    "o we stock:                                       o",
                    "o  banana               | restores 8%  SP | 4gp   o",
                    "o  side of meat         | restores 80% SP | 18gp  o",
                    "o  chicken leg          | restores 30% SP | 8gp   o",
                    "o  satchel of peas      | restores 50% SP | 11gp  o",
                    "o  corn ear             | restores 20% SP | 6gp   o",
                    "o  full ration          | restores all SP | 22gp  o",
                    "o  flask of wine        | restores 40% BP | 25gp  o",
                    "o  keg of wine          | restores all BP | 45gp  o",
                    "o                                                 o",
                    "o    to purchase type 'buy' then type the food    o",
                    "oooooooooooooooooooooooooooooooooooooooooooooooooo"
                ]
            }]
        },
        21: {
            name: "Blacksmith's Shop",
            adjacent: { 'west': 2 },
            characters: [{ name: 'armor_merchant' }, { name: 'blacksmith' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                    "x                                         x",
                    "x    THE FINE ARMORY OF IERDALE           x",
                    "x                                         x",
                    "x  Armor we so proudly stock:             x",
                    "x    leather armor            | 30 gp     x",
                    "x    studded leather          | 60 gp     x",
                    "x    light chainmail          | 100 gp    x",
                    "x    chainmail                | 220 gp    x",
                    "x    banded mail              | 420 gp    x",
                    "x    light plate              | 900 gp    x",
                    "x    full plate               | 2000 gp   x",
                    "x                                         x",
                    "x To purchase armor, \"buy <armor type>\"   x",
                    "x                                         x",
                    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                ]
            }]
        },
        22: {
            name: "Pet Store",
            adjacent: { 'west': 4 },
            characters: [{ name: 'orkin_the_animal_trainer' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\",
                    "!                                          !",
                    "!    Welcome.                              !",
                    "!  I raise and sell various animals.       !",
                    "!  To see which ones I currently have      !",
                    "!  available, please type \"list\".          !",
                    "!  I also buy pets you don't want.         !",
                    "!  To sell one, type \"sell\" and the name   !",
                    "!  of the pet.                             !",
                    "!                                          !",
                    "\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/"
                ]
            }]
        },
        23: {
            name: "House",
            adjacent: { 'north': 11 },
            characters: [{ name: 'clubman' }],
            landmarks: [{ name: 'mixing_pot' }
            ]
        },
        24: {
            name: "Ieadon's House",
            adjacent: { 'south': 9 },
            characters: [{ name: 'ieadon' }],
            landmarks: [{
                name: 'sign',
                text: [
                    " )~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~(",
                    "( Welcome to the Hearty Domain of the )",
                    "(  fighters of Ierdale.  To see what  )",
                    "( Ieadon will teach you, type 'list', )",
                    "(  learning from Ieadon is the best   )",
                    "(    expierience you will have.       )",
                    " )___________________________________("
                ]
            }]
        },
        25: {
            name: "Meat Market",
            adjacent: { 'west': 88 },
            characters: [{ name: 'butcher' }],
            items: [{ name: 'side of meat' }, { name: 'giraffe_gizzard' }]
        },
        26: {
            name: "North Road",
            adjacent: { 'north': 27, 'east': 331, 'south': 4, 'west': 45 }
        },
        27: {
            name: "North Road",
            adjacent: { 'north': 28, 'east': 29, 'south': 26 }
        },
        28: {
            name: "Northern Gatehouse",
            adjacent: { 'north': 44, 'south': 27 },
            characters: [{ name: 'security_guard' }, { name: 'security_guard' }],
            landmarks: [{ name: 'locked_gate' }
            ]
        },
        29: {
            name: "Dirth Track",
            adjacent: { 'east': 30, 'west': 27 }
        },
        30: {
            name: "Dirth Track",
            adjacent: { 'north': 33, 'east': 31, 'west': 29 }
        },
        31: {
            name: "Dirth Track",
            adjacent: { 'east': 32, 'west': 30 }
        },
        32: {
            name: "Dirth Track",
            adjacent: { 'north': 39, 'east': 38, 'south': 41, 'west': 31 }
        },
        33: {
            name: "Corn Field",
            adjacent: { 'north': 36, 'east': 37, 'south': 30, 'west': 34 }
        },
        34: {
            name: "Corn Field",
            adjacent: { 'north': 35, 'east': 33 },
        },
        35: {
            name: "Corn Field",
            adjacent: { 'south': 34 },
        },
        36: {
            name: "Corn Field",
            adjacent: { 'south': 33 },
        },
        37: {
            name: "Corn Field",
            adjacent: { 'west': 33 }
        },
        38: {
            name: "Farmhouse",
            adjacent: { 'west': 32 },
            characters: [{ name: 'farm_wife' }]
        },
        39: {
            name: "Barnyard",
            adjacent: { 'north': 40, 'south': 32 },
            characters: [{ name: 'hen' }, { name: 'hen' }, { name: 'hen' }, { name: 'hen' }]
        },
        40: {
            name: "Barn",
            adjacent: { 'south': 39 },
            characters: [{ name: 'large_rooster' }]
        },
        41: {
            name: "Pasture",
            adjacent: { 'north': 32, 'south': 42, 'west': 43 },
            characters: [{ name: 'cow' }]
        },
        42: {
            name: "Pasture",
            adjacent: { 'north': 41 },
            characters: [{ name: 'cow' }]
        },
        43: {
            name: "Pasture",
            adjacent: { 'east': 41 },
            characters: [{ name: 'bull' }]
        },
        44: {
            name: "Entrance to the Forest of Thieves",
            adjacent: { 'north': 46, 'south': 28 },
            characters: [{ name: 'ierdale_forester' }, { name: 'ierdale_forester' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\",
                    "\\                                        /",
                    "/  Welcome to the Forests of Thieves...  \\",
                    "\\                                        /",
                    "/  To insure the saftey of tourists and  \\",
                    "\\ you yourself, this forest is off limits/",
                    "/  without prior consent from the chief  \\",
                    "\\ of police.  Please, this is only for   /",
                    "/ the saftey of your self...             \\",
                    "\\    Thank you,                          /",
                    "/        Ierdale Forest Society          \\",
                    "\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/"
                ]
            }]
        },
        45: {
            name: "Headquarters of the Ierdale Guard",
            adjacent: { 'north': 321, 'east': 26 },
            characters: [{ name: 'police_chief' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "#############################################",
                    "#   Welcome to the Ierdale Security Dept.   #",
                    "#                                           #",
                    "#    Go North for Information Dept.         #",
                    "#############################################"
                ]
            }]
        },
        46: {
            name: "Path of Thieves",
            adjacent: { 'north': 47, 'east': 53, 'south': 44, 'west': 86 }
        },
        47: {
            name: "Path of Thieves",
            adjacent: { 'north': 48, 'east': 52, 'south': 46, 'west': 84 },
            characters: [{ name: 'fine_gentleman' }, { name: 'ierdale_forester' }]
        },
        48: {
            name: "Path of Thieves",
            adjacent: { 'north': 49, 'south': 47, 'west': 72 },
            characters: [{ name: 'dirty_thief' }]
        },
        49: {
            name: "Path of Thieves",
            adjacent: { 'north': 50, 'south': 48, 'west': 71 },
            characters: [{ name: 'dirty_thief' }]
        },
        50: {
            name: "Path of Thieves",
            adjacent: { 'north': 51, 'east': 65, 'south': 49 },
            characters: [{ name: 'fat_merchant_thief' }, { name: 'dryad' }, { name: 'ierdale_forester' }]
        },
        51: {
            name: "End of the Path",
            adjacent: { 'east': 66, 'south': 50 },
            characters: [{ name: 'fat_merchant_thief' }, { name: 'fine_gentleman' }]
        },
        52: {
            name: "Forest of Thieves",
            adjacent: { 'north': 58, 'east': 54, 'south': 53, 'west': 47 },
            characters: [{ name: 'dirty_thief' }, { name: 'ierdale_forester' }]
        },
        53: {
            name: "Forest of Thieves",
            adjacent: { 'north': 52, 'west': 46 },
            characters: [{ name: 'fat_merchant_thief' }]
        },
        54: {
            name: "Forest of Thieves",
            adjacent: { 'north': 59, 'east': 57, 'south': 55, 'west': 52 },
            characters: [{ name: 'fine_gentleman' }]
        },
        55: {
            name: "Forest of Thieves",
            adjacent: { 'north': 54, 'east': 56 },
            characters: [{ name: 'swordsman' }]
        },
        56: {
            name: "Forest of Thieves",
            adjacent: { 'north': 57, 'west': 55, 'southeast': 334 },
            characters: [{ name: 'swordsman' }]
        },
        57: {
            name: "Forest of Thieves",
            adjacent: { 'south': 56, 'west': 54 },
            characters: [{ name: 'little_goblin_thief' }]
        },
        58: {
            name: "Forest of Thieves",
            adjacent: { 'north': 60, 'east': 59, 'south': 52 },
            characters: [{ name: 'evil_forester' }]
        },
        59: {
            name: "Forest of Thieves",
            adjacent: { 'south': 54, 'west': 58 },
            characters: [{ name: 'swordsman' }]
        },
        60: {
            name: "Forest of Thieves",
            adjacent: { 'north': 65, 'east': 61, 'south': 58 },
            characters: [{ name: 'dryad' }]
        },
        61: {
            name: "Forest of Thieves",
            adjacent: { 'north': 62, 'east': 64, 'west': 60 }
        },
        62: {
            name: "Forest of Thieves",
            adjacent: { 'north': 67, 'east': 63, 'south': 61, 'west': 65 }
        },
        63: {
            name: "Forest of Thieves",
            adjacent: { 'north': 85, 'west': 62 },
            characters: [{ name: 'swordsman' }]
        },
        64: {
            name: "Forest of Thieves",
            adjacent: { 'west': 61 },
            landmarks: [{ name: 'towering_tree' }
            ]
        },
        65: {
            name: "Forest of Thieves",
            adjacent: { 'north': 66, 'east': 62, 'south': 60, 'west': 50 }
        },
        66: {
            name: "Forest of Thieves",
            adjacent: { 'south': 65, 'west': 51 },
        },
        67: {
            name: "Forest of Thieves",
            adjacent: { 'east': 85, 'south': 62 },
            characters: [{ name: 'snarling_thief' }, { name: 'little_goblin_thief' }],
            items: [{ name: 'ochre_stone' }]
        },
        68: {
            name: "Forest of Thieves",
            adjacent: { 'north': 75, 'east': 69, 'south': 79, 'west': 77 },
            characters: [{ name: 'snarling_thief' }]
        },
        69: {
            name: "Forest of Thieves",
            adjacent: { 'north': 74, 'west': 68 },
            characters: [{ name: 'dirty_thief' }]
        },
        70: {
            name: "Forest of Thieves",
            adjacent: { 'east': 71, 'south': 82 },
            characters: [{ name: 'dirty_thief' }, { name: 'dryad' }]
        },
        71: {
            name: "Forest of Thieves",
            adjacent: { 'east': 49, 'south': 72, 'west': 70 },
            characters: [{ name: 'swordsman' }]
        },
        72: {
            name: "Forest of Thieves",
            adjacent: { 'north': 71, 'east': 48, 'south': 84, 'west': 82 },
            characters: [{ name: 'swordsman' }]
        },
        73: {
            name: "Forest of Thieves",
            adjacent: { 'east': 83, 'south': 81 },
            characters: [{ name: 'fine_gentleman' }]
        },
        74: {
            name: "Forest of Thieves",
            adjacent: { 'east': 86, 'south': 69, 'west': 75 }
        },
        75: {
            name: "Forest of Thieves",
            adjacent: { 'north': 80, 'east': 74, 'south': 68, 'west': 76 },
            characters: [{ name: 'dark_rider' }]
        },
        76: {
            name: "Forest of Thieves",
            adjacent: { 'north': 81, 'east': 75, 'south': 77 },
            landmarks: [{ name: 'large_rock' }
            ]
        },
        77: {
            name: "Forest of Thieves",
            adjacent: { 'north': 76, 'east': 68, 'south': 78 },
            characters: [{ name: 'evil_forester' }]
        },
        78: {
            name: "Hideout of Mythin the Forester",
            adjacent: { 'north': 77, 'east': 79 },
            characters: [{ name: 'mythin' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "(____)-----(----------)---^--------/\\",
                    "/                                    =",
                    "\\    Mythins Thief Stronghold        '",
                    "+        To see what I will teach you^",
                    "|     type 'list'.  Please be warned #",
                    "I    I only accept serious students  *",
                    "!                                    .",
                    "-   ANY knowladge of the ware-abouts -",
                    "$   of this place given to the king  =",
                    "~   police, or any other of his men  ^",
                    "`  WILL result in severe consequences@",
                    "!  I have evil conatacts and friends!~",
                    "\\/                                   /",
                    "/!!!!-----{----________/\\/\\//\\/\\/\\/\\/"
                ]
            }]
        },
        79: {
            name: "Forest of Thieves",
            adjacent: { 'north': 68, 'west': 78 },
            characters: [{ name: 'evil_forester' }]
        },
        80: {
            name: "Forest of Thieves",
            adjacent: { 'north': 83, 'south': 75, 'west': 81 },
            characters: [{ name: 'little_goblin_thief' }, { name: 'dryad' }]
        },
        81: {
            name: "Forest of Thieves",
            adjacent: { 'north': 73, 'east': 80, 'south': 76 }
        },
        82: {
            name: "Forest of Thieves",
            adjacent: { 'north': 70, 'east': 72, 'west': 83 }
        },
        83: {
            name: "Forest of Thieves",
            adjacent: { 'east': 82, 'south': 80, 'west': 73 },
            characters: [{ name: 'dark_rider' }]
        },
        84: {
            name: "Forest of Thieves",
            adjacent: { 'north': 72, 'east': 47, 'south': 86 },
            characters: [{ name: 'dark_rider' }]
        },
        85: {
            name: "Forest of Thieves",
            adjacent: { 'south': 63, 'west': 67 },
            characters: [{ name: 'little_goblin_thief' }]
        },
        86: {
            name: "Forest of Thieves",
            adjacent: { 'north': 84, 'east': 46, 'west': 74 },
            characters: [{ name: 'ierdale_forester' }]
        },
        87: {
            name: "Mythin's Office",
            adjacent: { 'north': 8 },
            characters: [{ name: 'mythins_employee' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "^!^!^!^!^!^!^!^!^!^!^!^!^!^!^",
                    "! Mythin is out now, please !",
                    "! ask employee for details  !",
                    "^!^!^!^!^!^!^!^!^!^!^!^!^!^!^"
                ]
            }]
        },
        88: {
            name: "Oak Street",
            adjacent: { 'north': 13, 'east': 25, 'south': 89, 'west': 134 }
        },
        89: {
            name: "Oak Street",
            adjacent: { 'north': 88, 'east': 137, 'south': 90, 'west': 136 },
            landmarks: [{
                name: 'sign',
                text: [
                    "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
                    "% RANDOM USEFUL THINGS - SIGN 1:    %",
                    "%                                   %",
                    "% *Sick of taking so long to heal?  %",
                    "%   Benches, chairs and beds exist  %",
                    "%   for using.  Type 'sit' or 'lay' %",
                    "%   to use them.  Your hp/sp/bp     %",
                    "%   will go up fast while doing so. %",
                    "%                                   %",
                    "%   Brought to you by the Ierdale   %",
                    "%   Information Archives.  Please   %",
                    "% visit us to learn more good stuff.%",
                    "%    Located on the North Road      %",
                    "%                                   %",
                    "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
                    "                 | |",
                    "                 | |",
                    "                 | |"
                ]
            }]
        },
        90: {
            name: "Oak Street - Dead End",
            adjacent: { 'north': 89 }
        },
        91: {
            name: "House",
            adjacent: { 'south': 7 },
            characters: [{ name: 'clubman' }]
        },
        92: {
            name: "Western Gatehouse",
            adjacent: { 'east': 13, 'west': 94 },
            characters: [{ name: 'security_guard' }, { name: 'security_guard' }],
            landmarks: [{ name: 'locked_gate' }
            ]
        },
        93: {
            name: "Eastern Gatehouse",
            adjacent: { 'east': 95, 'west': 10.1, 'south': 93.1 },
            characters: [{ name: 'security_guard' }, { name: 'security_guard' }],
            landmarks: [{ name: 'locked_gate' }
            ]
        },
        93.1: {
            name: "Fern Street",
            adjacent: { 'north': 93, 'south': 93.2 }
        },
        93.2: {
            name: "Fern Street",
            adjacent: { 'east': 93.25, 'north': 93.1, 'south': 93.3 }
        },
        93.25: {
            name: "House",
            adjacent: { 'west': 93.2 }
        },
        93.3: {
            name: "Fern Street",
            adjacent: { 'east': 93.35, 'north': 93.2, 'south': 93.4 }
        },
        93.35: {
            name: "House",
            adjacent: { 'west': 93.3 }
        },
        93.4: {
            name: "Fern Street",
            adjacent: { 'west': 93.5, 'north': 93.3, 'south': 362, }
        },
        93.5: {
            name: "Alleyway",
            adjacent: { 'east': 93.4, 'west': 93.6 }
        },
        93.6: {
            name: "Alleyway",
            adjacent: { 'east': 93.5, 'west': 308, 'north': 93.7 }
        },
        93.7: {
            name: "Junk Pile",
            adjacent: { 'south': 93.6 },
            items: [{ name: 'pile_of_gold', quantity: 156 }]
        },
        94: {
            name: "West Road",
            adjacent: { 'east': 92, 'west': 98 }
        },
        95: {
            name: "East Road",
            adjacent: { 'east': 97, 'west': 93 }
        },
        96: {
            name: "East Road, Fork of Nod",
            adjacent: { 'east': 283, 'south': 142, 'west': 97 },
            landmarks: [{
                name: 'sign',
                text: [
                    "|/\\|/\\|/\\|/\\|/\\|/\\|/\\|/\\|/\\|/\\|/\\|/\\|",
                    "|    Fork of Nod                    |",
                    "| Travel along this path for aprox. |",
                    "| 100 miles (please make sure you   |",
                    "| have food well stocked, as it is a|",
                    "| long journey), there is a small   |",
                    "| settlement at the end of the path,|",
                    "| they will sell you basic supplies.|",
                    "| From the Path of Nod, you will be |",
                    "| be able to head 'South' for the   |",
                    "| great Ironwood forests, 'East' for|",
                    "| then sea of darkness, or 'West'   |",
                    "| to come to the Meadows of the Fork|",
                    "| of nod.  Please be warned that    |",
                    "| many a fierce monster has been    |",
                    "| spotted apon this path, though we |",
                    "| attempt to keep it clear.  We will|",
                    "| pay bounty for any monsters you   |",
                    "| kill.  Please, travel well armed  |",
                    "|                                   |",
                    "|    Thank you Kindly,              |",
                    "|        Republic of Nod            |",
                    "|\\/|\\/|\\/|\\/|\\/|\\/|\\/|\\/|\\/|\\/|\\/|\\/|"
                ]
            }]
        },
        97: {
            name: "East Road",
            adjacent: { 'east': 96, 'west': 95 },
            landmarks: [{ name: 'slash_in_the_earth' }]
        },
        98: {
            name: "West Road, Forks South",
            adjacent: { 'east': 94, 'south': 99, 'west': 130 }
        },
        99: {
            name: "Path",
            adjacent: { 'north': 98, 'south': 100 },
            landmarks: [{
                name: 'sign',
                text: [
                    "-\\  /---\\/------------------------",
                    "| \\/  Beware of water to the west|",
                    "|        and east of the river   |",
                    "-----/\\---------/\\-------------/\\|"
                ]
            }]
        },
        100: {
            name: "Path",
            adjacent: { 'north': 99, 'south': 101 }
        },
        101: {
            name: "Stony Bridge",
            adjacent: { 'north': 100, 'south': 102 },
            characters: [{ name: 'bridge_troll' }]
        },
        102: {
            name: "Stony Bridge",
            adjacent: { 'north': 101, 'south': 103 },
            characters: [{ name: 'bridge_troll' }]
        },
        103: {
            name: "Stony Bridge",
            adjacent: { 'north': 102, 'south': 104 },
            characters: [{ name: 'bridge_troll' }]
        },
        104: {
            name: "Path, Sloping Steeply",
            adjacent: { 'north': 103, 'south': 105 }
        },
        105: {
            name: "Mountain Pass",
            adjacent: { 'north': 104, 'east': 113, 'south': 106 }
        },
        106: {
            name: "Mountain Pass",
            adjacent: { 'north': 105, 'south': 107, 'west': 110 }
        },
        107: {
            name: "Mountain Pass",
            adjacent: { 'north': 106, 'east': 108 },
            characters: [{ name: 'stone_ogre' }]
        },
        108: {
            name: "Lush Valley",
            adjacent: { 'east': 109, 'west': 107 },
            characters: [{ name: 'stone_ogre' }]
        },
        109: {
            name: "Eldin's Mountain Cottage",
            adjacent: { 'west': 108 },
            characters: [{ name: 'eldin' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+",
                    "+  Welcome to My Cottage!                 +",
                    "+                                         +",
                    "+   Please make yourself at home, to see  +",
                    "+   what I train, please type 'list'.     +",
                    "+                                         +",
                    "+   I know that is a long trip out here,  +",
                    "+   and so for your convenience I will    +",
                    "+   transport you back to town free of    +",
                    "+   cost.  Type 'transport' to have me do +",
                    "+   so.                                   +",
                    "+                                         +",
                    "+        Thankyou, Eldin                  +",
                    "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+"
                ]
            }]
        },
        110: {
            name: "Mountain Valley",
            adjacent: { 'north': 115, 'east': 106, 'west': 111 }
        },
        111: {
            name: "Mountain Valley",
            adjacent: { 'east': 110, 'south': 112 },
            characters: [{ name: 'stone_ogre' }]
        },
        112: {
            name: "Mountain Valey",
            adjacent: { 'north': 111 },
            characters: [{ name: 'stone_ogre' }]
        },
        113: {
            name: "Mountain Valley",
            adjacent: { 'west': 105, 'down': 114 },
            characters: [{ name: 'stone_ogre' }],
            landmarks: [{ name: 'slot_canyon' }
            ]
        },
        114: {
            name: "Slot Canyon, Littered with Bones",
            description: "Some of the bones are human. You feel a shudder.",
            adjacent: { 'up': 113, 'south': 114.1 }
        },
        114.1: {
            name: "Slot Canyon",
            description: "From the east emanate a smell like burnt paper and a slow, methodical gnashing. The pieces of bone diminish progressively in size until they become dust.",
            adjacent: { 'north': 114, 'east': 114.2 },
        },
        114.2: {
            name: "Henge's Lair",
            adjacent: { 'west': 114.1 },
            characters: [{ name: 'henge' }],
            items: [{ name: 'pile_of_gold', quantity: 1418 }]
        },
        115: {
            name: "Mountain Valley",
            adjacent: { 'south': 110 },
            characters: [{ name: 'stone_ogre' }]
        },
        116: {
            name: "Mucky Path",
            adjacent: { 'south': 13, 'west': 117 }
        },
        117: {
            name: "Mucky Path",
            adjacent: { 'east': 116, 'west': 118 }
        },
        118: {
            name: "Mucky Path, Trails off to Nothing",
            adjacent: { 'north': 119, 'east': 117 }
        },
        119: {
            name: "Swamp",
            adjacent: { 'north': 125, 'south': 118, 'west': 120 }
        },
        120: {
            name: "Swamp",
            adjacent: { 'north': 124, 'east': 119, 'south': 121 }
        },
        121: {
            name: "Swamp",
            adjacent: { 'north': 120 },
            characters: [{ name: 'rush_lurker' }]
        },
        122: {
            name: "Swamp",
            adjacent: { 'north': 123 },
            characters: [{ name: 'rush_lurker' }, { name: 'adder' }]
        },
        123: {
            name: "Swamp",
            adjacent: { 'north': 128, 'east': 124, 'south': 122, 'west': 126 }
        },
        124: {
            name: "Swamp",
            adjacent: { 'north': 129, 'east': 125, 'south': 120, 'west': 123 }
        },
        125: {
            name: "Swamp",
            adjacent: { 'south': 119, 'west': 124 },
            characters: [{ name: 'adder' }]
        },
        126: {
            name: "Swamp",
            adjacent: { 'north': 127, 'east': 123, 'west': 139 }
        },
        127: {
            name: "Swamp",
            adjacent: { 'north': 140, 'east': 128, 'south': 126, 'west': 138 }
        },
        128: {
            name: "Swamp",
            adjacent: { 'south': 123, 'west': 127 },
            characters: [{ name: 'adder' }]
        },
        129: {
            name: "Swamp",
            adjacent: { 'south': 124 },
            characters: [{ name: 'rush_lurker' }]
        },
        130: {
            name: "West Road",
            adjacent: { 'east': 98, 'west': 131 }
        },
        131: {
            name: "West Road",
            adjacent: { 'east': 130, 'west': 323 }
        },
        132: {
            name: "Courthouse Lobby",
            adjacent: { 'north': 9, 'south': 133 },
            landmarks: [{
                name: 'sign',
                text: [
                    "(------------)",
                    "|  Ierdale   |",
                    "| Courthouse |",
                    "|            |",
                    "| If you have|",
                    "|been charged|",
                    "|with murder,|",
                    "|type 'trial'|",
                    "|to have us  |",
                    "|review your |",
                    "|case.       |",
                    "(------------)"
                ]
            }]
        },
        133: {
            name: "Courtroom",
            adjacent: { 'north': 132 },
            size: 10,
            characters: [{ name: 'chief_judge' }, { name: 'jury_member' }, { name: 'jury_member' }, { name: 'jury_member' }, { name: 'jury_member' }]
        },
        134: {
            name: "House",
            adjacent: { 'east': 88 }
        },
        135: {
            name: "Spritzer Hut",
            adjacent: { 'south': 10 },
            characters: [{ name: 'baby_spritzer' }, { name: 'baby_spritzer' }]
        },
        136: {
            name: "House",
            adjacent: { 'east': 89 },
            characters: [{ name: 'peasant_child' }]
        },
        137: {
            name: "Alleyway",
            adjacent: { 'east': 6, 'west': 89 },
            items: [{ name: 'recipe' }]
        },
        138: {
            name: "Water's Edge",
            adjacent: { 'north': 141, 'east': 127, 'south': 139 },
            characters: [{ name: 'swamp_thing' }]
        },
        139: {
            name: "Water's Edge",
            adjacent: { 'north': 138, 'east': 126 },
            characters: [{ name: 'swamp_thing' }]
        },
        140: {
            name: "Water's Edge",
            adjacent: { 'south': 127, 'west': 141 },
            characters: [{ name: 'swamp_thing' }]
        },
        141: {
            name: "Water's Edge",
            adjacent: { 'east': 140, 'south': 138 }
        },
        142: {
            name: "Path of Nod",
            adjacent: { 'north': 96, 'south': 143 }
        },
        143: {
            name: "Path of Nod",
            adjacent: { 'north': 142, 'south': 144 }
        },
        144: {
            name: "Path of Nod",
            adjacent: { 'north': 143, 'south': 145 },
            characters: [{ name: 'path_demon' }]
        },
        145: {
            name: "Path of Nod",
            adjacent: { 'north': 144, 'south': 146 }
        },
        146: {
            name: "Path of Nod",
            adjacent: { 'north': 145, 'south': 147 }
        },
        147: {
            name: "Path of Nod",
            adjacent: { 'north': 146, 'south': 148 }
        },
        148: {
            name: "Path of Nod",
            adjacent: { 'north': 147, 'south': 149 }
        },
        149: {
            name: "Path of Nod",
            adjacent: { 'north': 148, 'south': 150 }
        },
        150: {
            name: "Path of Nod",
            adjacent: { 'north': 149, 'south': 151 }
        },
        151: {
            name: "Path of Nod",
            adjacent: { 'north': 150, 'south': 152 }
        },
        152: {
            name: "Path of Nod",
            adjacent: { 'north': 151, 'south': 153 }
        },
        153: {
            name: "Path of Nod",
            adjacent: { 'north': 152, 'south': 154 }
        },
        154: {
            name: "Path of Nod",
            adjacent: { 'north': 153, 'south': 155 },
            characters: [{ name: 'path_demon' }]
        },
        155: {
            name: "Path of Nod",
            adjacent: { 'north': 154, 'south': 156 }
        },
        156: {
            name: "Path of Nod",
            adjacent: { 'north': 155, 'south': 157 }
        },
        157: {
            name: "Path of Nod",
            adjacent: { 'north': 156, 'south': 158 }
        },
        158: {
            name: "Path of Nod",
            adjacent: { 'north': 157, 'south': 159 }
        },
        159: {
            name: "Path of Nod",
            adjacent: { 'north': 158, 'south': 160 }
        },
        160: {
            name: "Path of Nod",
            adjacent: { 'north': 159, 'south': 161 }
        },
        161: {
            name: "Path of Nod",
            adjacent: { 'north': 160, 'south': 162, 'west': 202 }
        },
        162: {
            name: "Path of Nod",
            adjacent: { 'north': 161, 'south': 163, 'west': 203 }
        },
        163: {
            name: "Path of Nod",
            adjacent: { 'north': 162, 'south': 164, 'west': 204 }
        },
        164: {
            name: "Path of Nod",
            adjacent: { 'north': 163, 'south': 165 }
        },
        165: {
            name: "Path of Nod",
            adjacent: { 'north': 164, 'south': 166 }
        },
        166: {
            name: "Path of Nod",
            adjacent: { 'north': 165, 'south': 167 }
        },
        167: {
            name: "Path of Nod",
            adjacent: { 'north': 166, 'south': 168 }
        },
        168: {
            name: "Path of Nod",
            adjacent: { 'north': 167, 'south': 169 }
        },
        169: {
            name: "Path of Nod",
            adjacent: { 'north': 168, 'south': 170 },
            characters: [{ name: 'path_demon' }]
        },
        170: {
            name: "Path of Nod",
            adjacent: { 'north': 169, 'south': 171 }
        },
        171: {
            name: "Path of Nod",
            adjacent: { 'north': 170, 'south': 172 }
        },
        172: {
            name: "Path of Nod",
            adjacent: { 'north': 171, 'south': 173 }
        },
        173: {
            name: "Path of Nod",
            adjacent: { 'north': 172, 'south': 174 }
        },
        174: {
            name: "Path of Nod",
            adjacent: { 'north': 173, 'south': 175 }
        },
        175: {
            name: "Path of Nod",
            adjacent: { 'north': 174, 'south': 176 }
        },
        176: {
            name: "Path of Nod",
            adjacent: { 'north': 175, 'south': 177 }
        },
        177: {
            name: "Path of Nod",
            adjacent: { 'north': 176, 'south': 178 }
        },
        178: {
            name: "Path of Nod",
            adjacent: { 'north': 177, 'south': 179 },
            characters: [{ name: 'path_demon' }]
        },
        179: {
            name: "Path of Nod",
            adjacent: { 'north': 178, 'east': 220, 'south': 180 }
        },
        180: {
            name: "Path of Nod",
            adjacent: { 'north': 179, 'south': 181 }
        },
        181: {
            name: "Path of Nod",
            adjacent: { 'north': 180, 'south': 182 }
        },
        182: {
            name: "Path of Nod",
            adjacent: { 'north': 181, 'south': 183 }
        },
        183: {
            name: "Path of Nod",
            adjacent: { 'north': 182, 'south': 184 }
        },
        184: {
            name: "Path of Nod",
            adjacent: { 'north': 183, 'south': 185 },
            characters: [{ name: 'path_demon' }]
        },
        185: {
            name: "Path of Nod",
            adjacent: { 'north': 184, 'south': 186 }
        },
        186: {
            name: "Path of Nod",
            adjacent: { 'north': 185, 'south': 187 }
        },
        187: {
            name: "Path of Nod",
            adjacent: { 'north': 186, 'south': 188 }
        },
        188: {
            name: "Path of Nod",
            adjacent: { 'north': 187, 'south': 189 }
        },
        189: {
            name: "Path of Nod",
            adjacent: { 'north': 188, 'south': 190 }
        },
        190: {
            name: "Path of Nod",
            adjacent: { 'north': 189, 'south': 191 }
        },
        191: {
            name: "Path of Nod",
            adjacent: { 'north': 190 },
            characters: [{ name: 'cradel' }],
            landmarks: [{ name: 'locked_gate' }
            ]
        },
        192: {
            name: "Path of Nod",
            adjacent: { 'north': 191, 'south': 193 }
        },
        193: {
            name: "Path of Nod",
            adjacent: { 'north': 192, 'south': 194 }
        },
        194: {
            name: "Path of Nod",
            adjacent: { 'north': 193, 'south': 195 }
        },
        195: {
            name: "Path of Nod",
            adjacent: { 'north': 194, 'south': 196 }
        },
        196: {
            name: "Path of Nod",
            adjacent: { 'north': 195, 'south': 197 }
        },
        197: {
            name: "Path of Nod",
            adjacent: { 'north': 196, 'east': 318, 'south': 198 },
            landmarks: [{
                name: 'sign',
                text: [
                    " ______________ ",
                    "|          \\   |",
                    "| tHiS way tO\\ |",
                    "|------------->|",
                    "| GroBiN     / |",
                    "|__________/___|"
                ]
            }]
        },
        198: {
            name: "Path of Nod",
            adjacent: { 'north': 197, 'south': 199 }
        },
        199: {
            name: "Path of Nod",
            adjacent: { 'north': 198, 'south': 200 }
        },
        200: {
            name: "Path of Nod",
            adjacent: { 'north': 199, 'south': 201 }
        },
        201: {
            name: "Path of Nod",
            adjacent: { 'north': 200, 'south': 250 }
        },
        202: {
            name: "Meadow",
            adjacent: { 'east': 161, 'south': 203 }
        },
        203: {
            name: "Meadow",
            adjacent: { 'north': 202, 'east': 162, 'south': 204, 'west': 206 }
        },
        204: {
            name: "Meadow",
            adjacent: { 'north': 203, 'east': 163, 'west': 207 }
        },
        205: {
            name: "Meadow",
            adjacent: { 'north': 210, 'east': 216 },
            characters: [{ name: 'lion' }]
        },
        206: {
            name: "Meadow",
            adjacent: { 'east': 203, 'south': 207, 'west': 209 }
        },
        207: {
            name: "Meadow",
            adjacent: { 'north': 206, 'east': 204, 'south': 216, 'west': 210 },
            characters: [{ name: 'lion' }]
        },
        208: {
            name: "Meadow",
            adjacent: { 'north': 219, 'south': 209, 'west': 211 }
        },
        209: {
            name: "Meadow",
            adjacent: { 'north': 208, 'east': 206, 'south': 210, 'west': 215 },
            characters: [{ name: 'lion' }]
        },
        210: {
            name: "Meadow",
            adjacent: { 'north': 209, 'east': 207, 'south': 205 }
        },
        211: {
            name: "Meadow",
            adjacent: { 'north': 218, 'east': 208, 'south': 215, 'west': 222 }
        },
        212: {
            name: "Meadow",
            adjacent: { 'east': 213, 'south': 221 },
            characters: [{ name: 'lion' }]
        },
        213: {
            name: "Meadow",
            adjacent: { 'south': 214, 'west': 212 }
        },
        214: {
            name: "Meadow",
            adjacent: { 'north': 213, 'east': 224, 'west': 221 }
        },
        215: {
            name: "Meadow",
            adjacent: { 'north': 211, 'east': 209 }
        },
        216: {
            name: "Meadow",
            adjacent: { 'north': 207, 'west': 205 }
        },
        217: {
            name: "Meadow",
            adjacent: { 'east': 218, 'south': 222 },
            characters: [{ name: 'lion' }]
        },
        218: {
            name: "Meadow",
            adjacent: { 'north': 221, 'east': 219, 'south': 211, 'west': 217 }
        },
        219: {
            name: "Meadow",
            adjacent: { 'south': 208, 'west': 218 }
        },
        220: {
            name: "Bog",
            adjacent: { 'east': 229, 'west': 179 }
        },
        221: {
            name: "Meadow",
            adjacent: { 'north': 212, 'east': 214, 'south': 218 }
        },
        222: {
            name: "Meadow",
            adjacent: { 'north': 217, 'east': 211 }
        },
        223: {
            name: "Boulder Field",
            adjacent: { 'east': 228, 'south': 224 },
            characters: [{ name: 'kobalt_captain' }]
        },
        224: {
            name: "Boulder Field",
            adjacent: { 'north': 223, 'east': 227, 'south': 225, 'west': 214 }
        },
        225: {
            name: "Boulder Field",
            adjacent: { 'north': 224, 'east': 226, 'west': 383 },
            characters: [{ name: 'kobalt_captain' }]
        },
        226: {
            name: "Boulder Field",
            adjacent: { 'north': 227, 'west': 225 }
        },
        227: {
            name: "Boulder Field",
            adjacent: { 'north': 228, 'south': 226, 'west': 224 },
            characters: [{ name: 'kobalt_captain' }]
        },
        228: {
            name: "Boulder Field",
            adjacent: { 'south': 227, 'west': 223 }
        },
        229: {
            name: "Bog",
            adjacent: { 'east': 230, 'west': 220 }
        },
        230: {
            name: "Bog",
            adjacent: { 'north': 244, 'east': 231, 'west': 229 }
        },
        231: {
            name: "Bog",
            adjacent: { 'south': 235, 'west': 230 }
        },
        232: {
            name: "Bog",
            adjacent: { 'north': 233, 'east': 249, 'west': 236 }
        },
        233: {
            name: "Bog",
            adjacent: { 'south': 232 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        234: {
            name: "Bog",
            adjacent: { 'east': 235, 'south': 247 },
            characters: [{ name: 'mogrim' }]
        },
        235: {
            name: "Bog",
            adjacent: { 'north': 231, 'east': 236, 'south': 246, 'west': 234 }
        },
        236: {
            name: "Bog",
            adjacent: { 'east': 232, 'west': 235 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        237: {
            name: "Bog",
            adjacent: { 'north': 239 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        238: {
            name: "Bog",
            adjacent: { 'east': 239, 'south': 244, 'west': 245 }
        },
        239: {
            name: "Bog",
            adjacent: { 'north': 240, 'east': 241, 'south': 237, 'west': 238 }
        },
        240: {
            name: "Bog",
            adjacent: { 'south': 239 }
        },
        241: {
            name: "Bog",
            adjacent: { 'east': 242, 'south': 243, 'west': 239 }
        },
        242: {
            name: "Bog",
            adjacent: { 'west': 241 },
            characters: [{ name: 'mogrim' }]
        },
        243: {
            name: "Bog",
            adjacent: { 'north': 241 },
            characters: [{ name: 'mogrim' }]
        },
        244: {
            name: "Bog",
            adjacent: { 'north': 238, 'south': 230 },
            characters: [{ name: 'mogrim' }]
        },
        245: {
            name: "Bog",
            adjacent: { 'east': 238 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        246: {
            name: "Bog",
            adjacent: { 'north': 235, 'west': 247 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        247: {
            name: "Bog",
            adjacent: { 'north': 234, 'east': 246, 'south': 248 },
            characters: [{ name: 'dreaugar_dwarf' }]
        },
        248: {
            name: "Bog",
            adjacent: { 'north': 247 },
            characters: [{ name: 'nightmare' }]
        },
        249: {
            name: "Bog",
            adjacent: { 'west': 232 },
            characters: [{ name: 'nightmare' }]
        },
        250: {
            name: "Corroded Gate",
            adjacent: { 'north': 201, 'south': 262 },
            landmarks: [{
                name: 'sign',
                text: [
                    "  ______          |",
                    " //  \\ \\ \\         ---------------------------|",
                    "|  / \\ / _|    THE FOREST OF ETERNAL DARKNESS |",
                    "  \\  \\  /__        ---------------------------|",
                    "   |   |/ /        |",
                    "   | O  /          |",
                    "   |   |           |",
                    "   |   |           |",
                    "   |   |           |",
                    "  /_____\\          |"
                ]
            }]
        },
        251: {
            name: "Dark Forest",
            adjacent: { 'north': 252, 'east': 262, 'west': 261 }
        },
        252: {
            name: "Dark Forest",
            adjacent: { 'south': 251 },
            characters: [{ name: 'goblin_hero' }, { name: 'wisp' }]
        },
        253: {
            name: "Dark Forest",
            adjacent: { 'north': 271, 'south': 261 }
        },
        254: {
            name: "Dark Forest",
            adjacent: { 'east': 261, 'west': 260 }
        },
        255: {
            name: "Dark Forest",
            adjacent: { 'north': 261, 'east': 257, 'south': 258 }
        },
        256: {
            name: "Dark Forest",
            adjacent: { 'north': 262, 'east': 263, 'west': 257 },
            characters: [{ name: 'silver fox' }]
        },
        257: {
            name: "Dark Forest",
            adjacent: { 'east': 256, 'west': 255 },
            characters: [{ name: 'goblin_hero' }]
        },
        258: {
            name: "Dark Forest",
            adjacent: { 'north': 255, 'west': 259 }
        },
        259: {
            name: "Dark Forest",
            adjacent: { 'east': 258, 'south': 267, 'west': 277 },
            characters: [{ name: 'reaper' }]
        },
        260: {
            name: "Dark Forest",
            adjacent: { 'east': 254 }
        },
        261: {
            name: "Dark Forest",
            adjacent: { 'north': 253, 'east': 251, 'south': 255, 'west': 254 },
            characters: [{ name: 'goblin_hero' }]
        },
        262: {
            name: "Dark Forest",
            adjacent: { 'north': 250, 'east': 268, 'south': 256, 'west': 251 },
            characters: [{ name: 'goblin_hero' }]
        },
        263: {
            name: "Dark Forest",
            adjacent: { 'north': 268, 'south': 266, 'west': 256 }
        },
        264: {
            name: "Dark Forest",
            adjacent: { 'north': 266, 'east': 273, 'west': 265 },
            characters: [{ name: 'reaper' }]
        },
        265: {
            name: "Dark Forest",
            adjacent: { 'east': 264 }
        },
        266: {
            name: "Dark Forest",
            adjacent: { 'north': 263, 'east': 272, 'south': 264 }
        },
        267: {
            name: "Dark Forest",
            adjacent: { 'north': 259, 'east': 265, 'south': 270, 'west': 271 },
            landmarks: [{ name: 'silver tree', contents: ['magic acorn'] }]
        },
        267.1: {
            name: "Fairy Nest",
            adjacent: { 'down': 267 },
            characters: [{ name: 'effelin' }]
        },
        268: {
            name: "Dark Forest",
            adjacent: { 'east': 269, 'south': 263, 'west': 262 },
            characters: [{ name: 'reaper' }]
        },
        269: {
            name: "Dark Forest",
            adjacent: { 'north': 276, 'east': 270, 'west': 268 }
        },
        270: {
            name: "Dark Forest",
            adjacent: { 'north': 267, 'west': 269 }
        },
        271: {
            name: "Dark Forest",
            adjacent: { 'east': 267, 'south': 253 },
            characters: [{ name: 'goblin_hero' }]
        },
        272: {
            name: "Dark Forest",
            adjacent: { 'east': 274, 'south': 273, 'west': 266 },
            characters: [{ name: 'wisp' }]
        },
        273: {
            name: "Dark Forest",
            adjacent: { 'north': 272, 'east': 275, 'west': 264 }
        },
        274: {
            name: "Dark Forest",
            adjacent: { 'north': 278, 'south': 275, 'west': 272 }
        },
        275: {
            name: "Dark Forest",
            adjacent: { 'north': 274, 'west': 273 }
        },
        276: {
            name: "Dark Forest",
            adjacent: { 'south': 269 },
            characters: [{ name: 'ziatos' }]
        },
        277: {
            name: "Dark Forest",
            adjacent: { 'east': 259 },
            characters: [{ name: 'cat_woman' }]
        },
        278: {
            name: "Dark Forest",
            adjacent: { 'south': 274 },
            characters: [{ name: 'megara' }]
        },
        279: {
            name: "House",
            adjacent: { 'north': 7 },
            characters: [{ name: 'clubman' }, { name: 'clubman' }]
        },
        280: {
            name: "House",
            adjacent: { 'south': 11 },
            characters: [{ name: 'clubman' }, { name: 'clubman' }]
        },
        281: {
            name: "Beet Street",
            adjacent: { 'north': 308, 'east': 314 },
            // landmarks: [{
            //     name: 'sign',
            //     text: [
            //         "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
            //         "% RANDOM USEFUL THINGS - SIGN 2:    %",
            //         "%                                   %",
            //         "% *Sick of being attacked by guards?%",
            //         "%   If you've commited a past sin,  %",
            //         "%   there IS hope!  Visit the court %",
            //         "%   room on East Road to have your  %",
            //         "%   case repealed!                  %",
            //         "%                                   %",
            //         "%  For more useful INFO, visit the  %",
            //         "%    IERDALE INFORMATION ARCHIVES   %",
            //         "% Directly East       ------------> %",
            //         "%                                   %",
            //         "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
            //         "                 | |",
            //         "                 | |",
            //         "                 | |"
            //     ]
            // }]
        },
        282: {
            name: "The Top of the Tree",
            adjacent: { 'type "climb down"': 282 },
            characters: [{ name: 'turlin' }],
            landmarks: [{ name: 'treehouse_platform' }
            ]
        },
        283: {
            name: "Gatehouse",
            adjacent: { 'north': 286, 'east': 284, 'west': 96 },
            characters: [{ name: 'elite_guard' }, { name: 'elite_guard' }, { name: 'elite_guard' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "=--=--=--=--=--=--=--=--=--=",
                    "=  Dear Citzens of Ierdale,=",
                    "= and all others passing   =",
                    "= this way...              =",
                    "=                          =",
                    "=  North of this gate house=",
                    "= stretches the Desert.    =",
                    "=                          =",
                    "=  The Journey across the  =",
                    "= the barren desert is     =",
                    "= increadibly parilous. It =",
                    "= intended for only those  =",
                    "= who are thouroghly       =",
                    "= comfortable walking      =",
                    "= the Forest of Thieves.   =",
                    "=                          =",
                    "= Sincerely,               =",
                    "=  Ierdale Chief of Police =",
                    "=--=--=--=--=--=--=--=--=--="
                ]
            }]
        },
        284: {
            name: "East Road Ends",
            adjacent: { 'west': 283 },
            landmarks: [{ name: 'locked_gate' },
            ]
        },
        284.1: {
            name: "The King's Court",
            adjacent: { 'west': 284 },
        },
        285: {
            name: "Sandy Desert",
            adjacent: { 'north': 288, 'west': 286 },
            characters: [{ name: 'sand_scout' }]
        },
        286: {
            name: "Sandy Desert",
            adjacent: { 'north': 287, 'east': 285, 'south': 283 }
        },
        287: {
            name: "Sandy Desert",
            adjacent: { 'north': 289, 'east': 288, 'south': 286 },
            characters: [{ name: 'sand_scout' }]
        },
        288: {
            name: "Sandy Desert",
            adjacent: { 'north': 290, 'east': 292, 'south': 285, 'west': 287 }
        },
        289: {
            name: "Sandy Desert",
            adjacent: { 'east': 290, 'south': 287, 'west': 297 },
            characters: [{ name: 'sand_scout' }]
        },
        290: {
            name: "Sandy Desert",
            adjacent: { 'north': 293, 'east': 291, 'south': 288, 'west': 289 }
        },
        291: {
            name: "Sandy Desert",
            adjacent: { 'east': 296, 'south': 292, 'west': 290 },
            characters: [{ name: 'sand_scout' }],
            landmarks: [{ name: 'spire' }
            ],
        },
        292: {
            name: "Sandy Desert",
            adjacent: { 'north': 291, 'east': 300, 'west': 288 }
        },
        293: {
            name: "Sandy Desert",
            adjacent: { 'east': 294, 'south': 290 }
        },
        294: {
            name: "Sandy Desert",
            adjacent: { 'north': 299, 'east': 295, 'west': 293 }
        },
        295: {
            name: "Sandy Desert",
            adjacent: { 'south': 296, 'west': 294 }
        },
        296: {
            name: "Sandy Desert",
            adjacent: { 'north': 295, 'east': 302, 'west': 291 },
            characters: [{ name: 'stone_golem' }]
        },
        297: {
            name: "Sandy Desert",
            adjacent: { 'east': 289, 'south': 298 },
            characters: [{ name: 'stone_golem' }]
        },
        298: {
            name: "Sandy Desert",
            adjacent: { 'north': 297 },
            characters: [{ name: 'sandworm' }]
        },
        299: {
            name: "Sandy Desert",
            adjacent: { 'south': 294 },
            characters: [{ name: 'rock_hydra' }]
        },
        300: {
            name: "Sandy Desert",
            adjacent: { 'east': 301, 'south': 304, 'west': 292 }
        },
        301: {
            name: "Sandy Desert",
            adjacent: { 'north': 302, 'south': 303, 'west': 300 },
            characters: [{ name: 'sand_scout' }]
        },
        302: {
            name: "Sandy Desert",
            adjacent: { 'south': 301, 'west': 296 }
        },
        303: {
            name: "Sandy Desert",
            adjacent: { 'north': 301 },
            characters: [{ name: 'sandworm' }]
        },
        304: {
            name: "Sandy Desert",
            adjacent: { 'north': 300 },
            characters: [{ name: 'sandworm' }]
        },
        305: {
            name: "Beet Street",
            adjacent: { 'north': 10, 'east': 312, 'south': 306 },
            characters: [{ name: 'beggar' }]
        },
        306: {
            name: "Beet Street",
            adjacent: { 'north': 305, 'east': 317, 'south': 307, 'west': 309 }
        },
        307: {
            name: "Beet Street",
            adjacent: { 'north': 306, 'east': 313, 'south': 308 }
        },
        308: {
            name: "Beet Street",
            adjacent: { 'north': 307, 'south': 281, 'west': 311, 'east': 93.6 }
        },
        309: {
            name: "Music Store",
            adjacent: { 'east': 306 },
            items: [{ name: 'music_box' }]
        },
        310: {
            name: "Cleric Shop",
            adjacent: { 'south': 311 },
            characters: [{ name: 'snotty_page' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "<---------------------------------->",
                    "[] Welcome to The Shop of Eldfarl []",
                    "[]                                []",
                    "[] Here is what we sell:          []",
                    "[] minor healing potion ...  25gp []",
                    "[] major healing potion ...  50gp []",
                    "[] mega healing potion .... 100gp []",
                    "[]                                []",
                    "[]    To buy something, type:     []",
                    "[]                                []",
                    "<---------------------------------->"
                ]
            }]
        },
        311: {
            name: "Eldfarl's Office",
            adjacent: { 'north': 310, 'east': 308, 'south': 316 },
            characters: [{ name: 'eldfarl' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+",
                    "|                           |",
                    "| /|\\ NORTH - Potion Shop   |",
                    "|                           |",
                    "| \\|/ SOUTH - Training Area |",
                    "|                           |",
                    "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+"
                ]
            }]
        },
        312: {
            name: "Eldin's House",
            adjacent: { 'west': 305 },
            landmarks: [
                {
                    name: 'sign',
                    text: [
                        "{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}",
                        "{ Fellow citysins of Ierdale,        }",
                        "{    I regret to inform you that I   }",
                        "{ have taken refuge in the valleys of}",
                        "{ stone.  I grew tiered of the hustle}",
                        "{ of living in the city.  I will     }",
                        "{ still be teaching classes, however }",
                        "{ I will do so in the shelter of the }",
                        "{ mountains.  Please come by just to }",
                        "{ see me sometime if you like!       }",
                        "{                                    }",
                        "{ Because I know the journey can be  }",
                        "{ difficult, I have placed a portal  }",
                        "{ stone at this location. If you     }",
                        "{ to be brought to me, simply type   }",
                        "{ 'transport' and you will find      }",
                        "{ yourself in my mountain abode.     }",
                        "{                                    }",
                        "{        sincerly,                   }",
                        "{         Eldin the wise of Ierdale  }",
                        "{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}"
                    ]
                },
                { name: 'portal_stone' }
            ]
        },
        313: {
            name: "Archery Workshop",
            adjacent: { 'west': 307 },
            characters: [{ name: 'bow_maker' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "******************************",
                    "|    Our Bows...             |",
                    "|Our bows come with a quality|",
                    "|guarantee.  Nobody in town  |",
                    "|makes a better bow.  This is|",
                    "|what we sell:               |",
                    "|                            |",
                    "| short bow         99 gp    |",
                    "| long bow          210 gp   |",
                    "| crossbow          455 gp   |",
                    "| heavy crossbow    890 gp   |",
                    "| hand crossbow     140 gp   |",
                    "| composite bow     2190 gp  |",
                    "| arrow             2 gp     |",
                    "|Type: buy [merchandise name]|",
                    "******************************"
                ]
            }]
        },
        314: {
            name: "Apothecary",
            adjacent: { 'west': 281 },
            landmarks: [{ name: 'mixing_pot' }
            ],
        },
        315: {
            name: "The RIver",
            adjacent: {}
        },
        316: {
            name: "Clerical Training Facilities",
            adjacent: { 'north': 311 },
            characters: [{ name: 'cleric_tendant' }],
            landmarks: [{
                name: 'sign',
                text: [
                    " (-)-(-)-(-)-(-)-(-)-(-)-(-)-(-)-(-) ",
                    "/ The Training Facitiys of Eldfarl  \\",
                    "|                                   |",
                    "| This room is intendended for hard |",
                    "| core students, any playing aroung |",
                    "| will have you strictly banned from|",
                    "| this classroom.  Eldfarl only     |",
                    "| acceptps the best... Good Luck.   |",
                    "| Eldfarl will heal you fully for   |",
                    "| absolutely free. If you would like|",
                    "| to have him do so, go north, then |",
                    "| type: 'healme'                    |",
                    "|                                   |",
                    "|>><><><><><><><!><><><><><><><><><<|",
                    "|                                   |",
                    "\\ Type 'list' to see what we teach. /",
                    " (-)-(-)-(-)-(-)-(-)-(-)-(-)-(-)-(-)"
                ]
            }]
        },
        317: {
            name: "House",
            adjacent: { 'west': 306 },
            characters: [{ name: 'peasant_woman' }, { name: 'peasant_elder' }]
        },
        318: {
            name: "Cobblestone Road",
            adjacent: { 'east': 319, 'west': 197 }
        },
        319: {
            name: "Cobblestone Road",
            adjacent: { 'east': 320, 'west': 318 }
        },
        320: {
            name: "Cobblestone Road",
            adjacent: { 'east': 343, 'west': 319 }
        },
        321: {
            name: "Information Desk",
            adjacent: { 'south': 45 },
            characters: [{ name: 'security_page' }]
        },
        322: {
            name: "Hermit Hut",
            adjacent: { 'south': 328 },
            characters: [{ name: 'blind_hermit' }]
        },
        323: {
            name: "Dry Grass",
            adjacent: { 'east': 131, 'south': 324, 'west': 329 }
        },
        324: {
            name: "Dry Grass",
            adjacent: { 'north': 323, 'west': 325 }
        },
        325: {
            name: "Dry Grass",
            adjacent: { 'east': 324, 'south': 327, 'west': 328 },
        },
        326: {
            name: "Dry Grass",
            adjacent: { 'west': 327 }
        },
        327: {
            name: "Dry Grass",
            adjacent: { 'north': 325, 'east': 326 }
        },
        328: {
            name: "Dry Grass",
            adjacent: { 'north': 322, 'east': 325 }
        },
        329: {
            name: "Dry Grass",
            adjacent: { 'north': 330, 'east': 323 }
        },
        330: {
            name: "Dry Grass",
            adjacent: { 'south': 329 }
        },
        331: {
            name: "Ierdale Barracks Lobby",
            adjacent: { 'east': 332, 'west': 26 },
            landmarks: [{
                name: 'sign',
                text: [
                    "0========(--------------------------------",
                    "|     Welcome to the Ierdale Barracks    |",
                    "|                                        |",
                    "| The Military Headquarters of Ierdale   |",
                    "--------------------------------)========0"
                ]
            }]
        },
        332: {
            name: "Ierdale Barracks",
            adjacent: { 'west': 331 }
        },
        333: {
            name: "Book Store",
            adjacent: { 'east': 4 },
            landmarks: [{ name: 'sign' }
            ],
        },
        334: {
            name: "Hidden Track",
            adjacent: { 'east': 335, 'northwest': 56 },
            landmarks: [{
                name: 'sign',
                text: [
                    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
                    "~    KEEP OUT                               ~",
                    "~                                           ~",
                    "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
                ]
            }]
        },
        335: {
            name: "Hidden Track",
            adjacent: { 'east': 336, 'west': 334 }
        },
        336: {
            name: "Hidden Track",
            adjacent: { 'east': 337, 'west': 335 }
        },
        337: {
            name: "Path",
            adjacent: { 'south': 338, 'west': 336 }
        },
        338: {
            name: "Path",
            adjacent: { 'north': 337, 'south': 339 }
        },
        339: {
            name: "Path",
            adjacent: { 'north': 338, 'south': 340 }
        },
        340: {
            name: "Path",
            adjacent: { 'north': 339, 'south': 341 }
        },
        341: {
            name: "Path",
            adjacent: { 'north': 340, 'south': 342 }
        },
        342: {
            name: "Thieves' Hideout",
            adjacent: { 'north': 341 },
            characters: [
                { name: 'snarling_thief', attackPlayer: true, chase: true },
                { name: 'dirty_thief', attackPlayer: true, chase: true },
                { name: 'fat_merchant_thief', attackPlayer: true, chase: true },
                { name: 'little_goblin_thief', attackPlayer: true, chase: true },
            ],
            items: [{ key: "pile_of_gold", quantity: 501, name: 'bag of loot' }]
        },
        343: {
            name: "Grobin Gates",
            adjacent: { 'east': 344, 'west': 320 },
            characters: [{ name: 'official' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "/\\\\-------------------\\   ",
                    "\\// Hear Ye, Hear Ye: /   ",
                    " /  Outlawed in town? |   ",
                    " |     /----\\/----\\   |   ",
                    " |  Buy a pass to this|   ",
                    " |   town for 1000gp! |   ",
                    " \\                    |   ",
                    "/\\\\ to buy,type 'pass'\\   ",
                    "\\//-------------------/   "
                ]
            }]
        },
        344: {
            name: "Grobin Square",
            adjacent: { 'north': 355, 'east': 345, 'south': 350, 'west': 343 },
            characters: [{ name: 'dark_angel' }, { name: 'dark_angel' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "{[(@)]}{[(@)]}{[(@)]}{[(@)]}",
                    "{    WELCOME TO GROBIN     }",
                    "{ The town of Orcish beauty}",
                    "{==========================}",
                    "{-------Directions---------}",
                    "{ ({N - Grogren Street     }",
                    "{ ({E - Main Road          }",
                    "{ ({S - Blobin Street      }",
                    "{ ({W - Exit to our City   }",
                    "{--------------------------}",
                    "{ * Visit the Brothers on  }",
                    "{   Grogren and Blobin Str.}",
                    "{[(@)]}{[(@)]}{[(@)]}{[(@)]}"
                ]
            }]
        },
        345: {
            name: "Main Street",
            adjacent: { 'north': 373, 'east': 346, 'west': 344 }
        },
        346: {
            name: "Main Street",
            adjacent: { 'north': 372, 'east': 347, 'west': 345 }
        },
        347: {
            name: "Main Street",
            adjacent: { 'east': 348, 'south': 374, 'west': 346 }
        },
        348: {
            name: "Main Street",
            adjacent: { 'north': 349, 'west': 347 }
        },
        349: {
            name: "Main Street",
            adjacent: { 'north': 360, 'east': 377, 'south': 348, 'west': 376 },
            characters: [{ name: 'peon' }]
        },
        350: {
            name: "Blobin Street",
            adjacent: { 'north': 344, 'south': 351, 'west': 367 },
            characters: [{ name: 'peon' }]
        },
        351: {
            name: "Blobin Street",
            adjacent: { 'north': 350, 'east': 368, 'south': 352 }
        },
        352: {
            name: "Blobin Street",
            adjacent: { 'north': 351, 'west': 353 }
        },
        353: {
            name: "Blobin Street",
            adjacent: { 'north': 369, 'east': 352, 'west': 354 }
        },
        354: {
            name: "End of Blobin Street",
            adjacent: { 'north': 370, 'east': 353, 'south': 371 }
        },
        355: {
            name: "Grogren Street",
            adjacent: { 'north': 356, 'south': 344 }
        },
        356: {
            name: "Grogren Street",
            adjacent: { 'north': 357, 'south': 355, 'west': 380 }
        },
        357: {
            name: "Grogren Street",
            adjacent: { 'east': 358, 'south': 356 }
        },
        358: {
            name: "Grogren Street",
            adjacent: { 'north': 379, 'east': 359, 'west': 357 }
        },
        359: {
            name: "End of Grogren Street",
            adjacent: { 'south': 381, 'west': 358 },
            characters: [{ name: 'peon' }]
        },
        360: {
            name: "Main Street - Barracks East",
            adjacent: { 'east': 361, 'south': 349, 'west': 375 },
            characters: [{ name: 'peon' }]
        },
        361: {
            name: "Barracks Gate",
            adjacent: { 'east': 363, 'west': 360 },
            landmarks: [{
                name: 'sign',
                text: [
                    "{[(@)]}{[(@)]}{[(@)]}{[(@)]}",
                    "{                          }",
                    "{   ORC BARRACKS - GROBIN  }",
                    "{                          }",
                    "{[(@)]}{[(@)]}{[(@)]}{[(@)]}"
                ]
            }]
        },
        362: {
            name: "Doo-Dad Shop",
            adjacent: { 'north': 93.4 },
            characters: [{ name: 'doo_dad_man' }],
            landmarks: [{
                name: 'sign',
                text: [
                    "<%%%%%%%%%%%%%%%%%%%%%%%%%%%%>",
                    " |  Hi, I sell doo-dads     |",
                    " |    Here they are:        |",
                    " |                          |",
                    " | rod              - 200 gp|",
                    " | wishbone         - 45 gp |",
                    " |                          |",
                    " | type 'buy <item name>'   |",
                    " |then type: use <item name>|",
                    " |/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/\\/"
                ]
            }]
        },
        363: {
            name: "Orcish Stronghold",
            adjacent: { 'north': 365, 'east': 366, 'south': 364, 'west': 361 },
            characters: []
        },
        364: {
            name: "Barracks",
            adjacent: { 'north': 363 },
            characters: [{ name: 'orcish_soldier' }, { name: 'orcish_soldier' }]
        },
        365: {
            name: "Barracks",
            adjacent: { 'south': 363 },
            characters: [{ name: 'orcish_soldier' }, { name: 'orcish_soldier' }]
        },
        366: {
            name: "Barracks",
            adjacent: { 'west': 363 },
            characters: [{ name: 'orcish_soldier' }, { name: 'orcish_soldier' }]
        },
        367: {
            name: "Gerard's General Store",
            adjacent: { 'east': 350 },
            characters: [{ name: 'gerard' }],
            landmarks: [{
                name: 'sign',
                text: [
                    " -----------------------------",
                    "|I am Gerard                  |",
                    "|I am know world-round for my |",
                    "|fantastic creations. I will  |",
                    "|sell my latest contraptions: |",
                    "|                             |",
                    "| telescope - 25 gp           |",
                    "| camera - 65 gp              |",
                    "| hang glider - 50 gp         |",
                    "|                             |",
                    "| NEW - portal detector...    |",
                    "|          only 265 gp!!!     |",
                    "|    Thank you, GERARD        |",
                    " -----------------------------"
                ]
            }]
        },
        368: {
            name: "Peon House",
            adjacent: { 'west': 351 }
        },
        369: {
            name: "Orcish Grocery",
            adjacent: { 'south': 353 },
            characters: [{ name: 'orcish_grocer' }]
        },
        370: {
            name: "Orckish Armory",
            adjacent: { 'south': 354 },
            landmarks: [{ name: 'sign' }
            ]
        },
        371: {
            name: "House",
            adjacent: { 'north': 354 },
            characters: [{ name: 'blobin' }]
        },
        372: {
            name: "Peon House",
            adjacent: { 'south': 346 },
            characters: [{ name: 'peon' }]
        },
        373: {
            name: "Orc House",
            adjacent: { 'south': 345 },
            characters: [{ name: 'orcish_citizen' }, { name: 'orcish_child' }]
        },
        374: {
            name: "Orc House",
            adjacent: { 'north': 347, 'east': 378 },
            characters: [{ name: 'orcish_citizen' }]
        },
        375: {
            name: "Peon House",
            adjacent: { 'east': 360 },
            characters: [{ name: 'peon' }]
        },
        376: {
            name: "Peon House",
            adjacent: { 'east': 349 },
            characters: [{ name: 'peon' }]
        },
        377: {
            name: "Peon House",
            adjacent: { 'west': 349 },
            characters: [{ name: 'peon' }]
        },
        378: {
            name: "Drawing Room",
            adjacent: { 'west': 374 },
            characters: [{ name: 'orcish_citizen' }, { name: 'orcish_child' }]
        },
        379: {
            name: "House",
            adjacent: { 'south': 358 },
            characters: [{ name: 'grogren' }]
        },
        380: {
            name: "Peon House",
            adjacent: { 'east': 356 }
        },
        381: {
            name: "Prokon's Pet Store",
            adjacent: { 'north': 359 },
            landmarks: [{
                name: 'sign',
                text: [
                    "/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\",
                    "!                                          !",
                    "!    Welcome.                              !",
                    "!  I raise and sell various animals.       !",
                    "!  To see which ones I currently have      !",
                    "!  available, please type \"list\".          !",
                    "!  I also buy pets you don't want.         !",
                    "!  To sell one, type \"sell\" and the name   !",
                    "!  of the pet.                             !",
                    "!                                          !",
                    "\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/"
                ]
            }]
        },
        382: {
            name: "Cave",
            adjacent: { 'north': 399, 'east': 394, 'south': 385 }
        },
        383: {
            name: "Cave Entrance",
            adjacent: { 'east': 225, 'west': 384 }
        },
        384: {
            name: "Cave",
            adjacent: { 'north': 394, 'east': 383, 'south': 390 }
        },
        385: {
            name: "Cave",
            adjacent: { 'north': 382, 'south': 386, 'west': 389 }
        },
        386: {
            name: "Cave",
            adjacent: { 'north': 385, 'east': 390 }
        },
        387: {
            name: "Cave",
            adjacent: { 'north': 389 }
        },
        388: {
            name: "Cave",
            adjacent: { 'north': 392 }
        },
        389: {
            name: "Cave",
            adjacent: { 'east': 385, 'south': 387, 'west': 392 }
        },
        390: {
            name: "Cave",
            adjacent: { 'north': 384, 'west': 386 }
        },
        391: {
            name: "Cave",
            adjacent: { 'west': 393 },
            characters: [{ name: 'sift' }]
        },
        392: {
            name: "Cave",
            adjacent: { 'north': 393, 'east': 389, 'south': 388 }
        },
        393: {
            name: "Cave",
            adjacent: { 'east': 391, 'south': 392 }
        },
        394: {
            name: "Cave",
            adjacent: { 'north': 395, 'south': 384, 'west': 382 }
        },
        395: {
            name: "Cave",
            adjacent: { 'north': 396, 'south': 394 }
        },
        396: {
            name: "Cave",
            adjacent: { 'south': 395, 'west': 397 }
        },
        397: {
            name: "Cave",
            adjacent: { 'east': 396, 'south': 399, 'west': 398 }
        },
        398: {
            name: "Cave",
            adjacent: { 'east': 397, 'south': 400 }
        },
        399: {
            name: "Cave",
            adjacent: { 'north': 397, 'south': 382 }
        },
        400: {
            name: "Cave",
            adjacent: { 'north': 398 },
            characters: [{ name: 'mino' }]
        },
        401: {
            name: "the void",
            adjacent: {}
        },
    },
    flags: {
        cleric: false,
        ieadon: false,
        colonel_arach: false,
        biadon: false,
        ziatos: false,
        turlin: false,
        henge: false,
        cradel: false,
        orc_mission: false,
        orc_battle: false,
        ierdale_mission: '',
        sift: false,
        soldier_dialogue: []
    }
}

const locationTemplates = {
    the_void(
        game: GameState,
        params?: any
    ) {
        return {
            name: "The Void",
            adjacent: {},
            game: game,
            ...params
        }
    },
    stony_bridge(
        game: GameState,
        params?: any
    ) {
        return {
            name: "Stony Bridge",
            adjacent: { 'north': 315 },
            game: game,
            ...params
        }
        // 'They jump off bridge
        // SetColor 1, 1
        // CLS
        // Call Pause(2)
        // SetColor 1, 7
        // CLS
        // Quote "Without heeding the warnings of the sign, you PLUNGE into the dark water."
        // Call Pause(3.5)
        // Quote
        // Quote "It catches you offguard with its shrill, bitter cold, cutting you to your core."
        // Quote "With a cry of terror, you struggle to grab hold of the bridge once more..."
        // Call Pause(6)
        // Quote
        // Quote "Its too late... the bridge slips away out of sight and the banks of the"
        // Quote "river grow farther and farther away."
        // Call Pause(5)
        // Quote
        // Quote "Slowly you sink, first to your mouth, then your nose, then your ears."
        // Quote "And yet... You aren't drowning..."
        // Call Pause(4.5)
        // Quote
        // Quote "Some cruel sorccery keeps you alive, forever, floating in this Underwater Abbys"
        // Call Pause(4)
        // SetColor 0
        // Move 315
    }
}

export { scenario, locationTemplates }