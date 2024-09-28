import {Character, Item, Location } from '../../game elements/game_elements.ts'
import { items } from './items.ts'
import { characters } from './characters.ts'

const gameMap = {
    1: new Location({
        name: "Cottage of the Young",
        adjacent: {'north': 6, 'east': 14, 'west': 15},
        items: [items.sign([
            "--------------------------------------------",
            "|      Welcome to the world of A2D.        |",
            "| You are currently in the town of Ierdale |",
            "|                                          |",
            "| This is a text-based game where you type |",
            "| commands to have your character perform  |",
            "| an action.  To learn about actions you   |",
            "| can do, type ",
            "|------------------------------------------|"
        ])]
    }),
    2: new Location({
        name: "North Road",
        adjacent: {'north': 3, 'east': 21, 'south': 12},
        items: [items.sign([
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
        ])]
    }),
    3: new Location({
        name: "North Road",
        adjacent: {'north': 4, 'east': 20, 'south': 2, 'west': 19}
    }),
    4: new Location({
        name: "North Road",
        adjacent: {'north': 26, 'east': 22, 'south': 3, 'west': 333}
    }),
    5: new Location({
        name: "South Road",
        adjacent: {'north': 12, 'south': 6}
    }),
    6: new Location({
        name: "South Road",
        adjacent: {'north': 5, 'south': 1, 'west': 137}
    }),
    7: new Location({
        name: "West Road",
        adjacent: {'north': 91, 'east': 11, 'south': 279, 'west': 13},
        items: [items.sign([
            "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
            "&                                      &",
            "&   CLUBMEN HOUSES    /|\\        |     &",
            "&                      |        \\|/    &",
            "&                                      &",
            "& North and South from here            &",
            "& (please kill them)                   &",
            "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
        ])]
    }),
    8: new Location({
        name: "East Road",
        adjacent: {'east': 9, 'south': 87, 'west': 12}
    }),
    9: new Location({
        name: "East Road",
        adjacent: {'north': 24, 'east': 10, 'south': 132, 'west': 8}
    }),
    10: new Location({
        name: "East Road",
        adjacent: {'north': 135, 'east': 93, 'south': 305, 'west': 9}
    }),
    11: new Location({
        name: "West Road",
        adjacent: {'north': 280, 'east': 12, 'south': 23, 'west': 7},
        items: [items.sign([
            "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
            "&                                      &",
            "&   CLUBMEN HOUSES    /|\\        |     &",
            "&                      |        \\|/    &",
            "&                                      &",
            "& North and South from here            &",
            "& (please kill them)                   &",
            "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&"
        ])]
    }),
    12: new Location({
        name: "Center of Town",
        adjacent: {'north': 2, 'east': 8, 'south': 5, 'west': 11},
        items: [items.sign([
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
        ])]
    }),
    13: new Location({
        name: "West Road",
        adjacent: {'north': 116, 'east': 7, 'south': 88, 'west': 92}
    }),
    14: new Location({
        name: "Bedroom",
        adjacent: {'west': 1},
        characters: [characters.sick_old_cleric]
    }),
    15: new Location({
        name: "Vegtable Garden",
        adjacent: {'east': 1, 'south': 18, 'west': 16},
        items: [items.sign([
            " ________________________________",
            "|                                |",
            "|     BEWARE OF SCARECROWS       |",
            "|________________________________|"
        ])]
    }),
    16: new Location({
        name: "Vegtable Garden",
        adjacent: {'east': 15, 'south': 17}
    }),
    17: new Location({
        name: "Vegtable Garden",
        adjacent: {'north': 16, 'east': 18},
        items: [items.scarecrow]
    }),
    18: new Location({
        name: "Vegtable Garden",
        adjacent: {'north': 15, 'west': 17}
    }),
    19: new Location({
        name: "Pawn Shop",
        adjacent: {'east': 3},
        items: [items.sign([
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
        ])]
    }),
    20: new Location({
        name: "Grocer",
        adjacent: {'west': 3},
        items: [items.sign([
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
        ])]
    }),
    21: new Location({
        name: "Blacksmith's Shop",
        adjacent: {'west': 2},
        items: [items.sign([
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
        ])]
    }),
    22: new Location({
        name: "Pet Store",
        adjacent: {'west': 4},
        items: [items.sign()]
    }),
    23: new Location({
        name: "House",
        adjacent: {'north': 11},
        items: [items.mixing_pot]
    }),
    24: new Location({
        name: "Ieadon's House",
        adjacent: {'south': 9},
        items: [items.sign([
            " )~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~(",
            "( Welcome to the Hearty Domain of the )",
            "(  fighters of Ierdale.  To see what  )",
            "( Ieadon will teach you, type 'list', )",
            "(  learning from Ieadon is the best   )",
            "(    expierience you will have.       )",
            " )___________________________________("
        ])]
    }),
    25: new Location({
        name: "Meat Market",
        adjacent: {'west': 88}
    }),
    26: new Location({
        name: "North Road",
        adjacent: {'north': 27, 'east': 331, 'south': 4, 'west': 45}
    }),
    27: new Location({
        name: "North Road",
        adjacent: {'north': 28, 'east': 29, 'south': 26}
    }),
    28: new Location({
        name: "North Gatehouse",
        adjacent: {'north': 44, 'south': 27},
        items: [items.unknown(35)]
    }),
    29: new Location({
        name: "Dirth Track",
        adjacent: {'east': 30, 'west': 27}
    }),
    30: new Location({
        name: "Dirth Track",
        adjacent: {'north': 33, 'east': 31, 'west': 29}
    }),
    31: new Location({
        name: "Dirth Track",
        adjacent: {'east': 32, 'west': 30}
    }),
    32: new Location({
        name: "Dirth Track",
        adjacent: {'north': 39, 'east': 38, 'south': 41, 'west': 31}
    }),
    33: new Location({
        name: "Corn Field",
        adjacent: {'north': 36, 'east': 37, 'south': 30, 'west': 34}
    }),
    34: new Location({
        name: "Corn Field",
        adjacent: {'north': 35, 'east': 33}
    }),
    35: new Location({
        name: "Corn Field",
        adjacent: {'south': 34}
    }),
    36: new Location({
        name: "Corn Field",
        adjacent: {'south': 33}
    }),
    37: new Location({
        name: "Corn Field",
        adjacent: {'west': 33}
    }),
    38: new Location({
        name: "Farmhouse",
        adjacent: {'west': 32}
    }),
    39: new Location({
        name: "Barnyard",
        adjacent: {'north': 40, 'south': 32}
    }),
    40: new Location({
        name: "Barn",
        adjacent: {'south': 39}
    }),
    41: new Location({
        name: "Pasture",
        adjacent: {'north': 32, 'south': 42, 'west': 43}
    }),
    42: new Location({
        name: "Pasture",
        adjacent: {'north': 41}
    }),
    43: new Location({
        name: "Pasture",
        adjacent: {'east': 41}
    }),
    44: new Location({
        name: "Entrance to the Forest of Thieves",
        adjacent: {'north': 46, 'south': 28},
        items: [items.sign([
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
        ])]
    }),
    45: new Location({
        name: "Headquarters of the Ierdale Guard",
        adjacent: {'north': 321, 'east': 26},
        items: [items.sign([
            "#############################################",
            "#   Welcome to the Ierdale Security Dept.   #",
            "#                                           #",
            "#    Go North for Information Dept.         #",
            "#############################################"
        ])]
    }),
    46: new Location({
        name: "Path of Thieves",
        adjacent: {'north': 47, 'east': 53, 'south': 44, 'west': 86}
    }),
    47: new Location({
        name: "Path of Thieves",
        adjacent: {'north': 48, 'east': 52, 'south': 46, 'west': 84}
    }),
    48: new Location({
        name: "Path of Thieves",
        adjacent: {'north': 49, 'south': 47, 'west': 72}
    }),
    49: new Location({
        name: "Path of Thieves",
        adjacent: {'north': 50, 'south': 48, 'west': 71}
    }),
    50: new Location({
        name: "Path of Thieves",
        adjacent: {'north': 51, 'east': 65, 'south': 49}
    }),
    51: new Location({
        name: "End of the Path",
        adjacent: {'east': 66, 'south': 50}
    }),
    52: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 58, 'east': 54, 'south': 53, 'west': 47}
    }),
    53: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 52, 'west': 46}
    }),
    54: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 59, 'east': 57, 'south': 55, 'west': 52}
    }),
    55: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 54, 'east': 56}
    }),
    56: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 57, 'west': 55}
    }),
    57: new Location({
        name: "Forest of Thieves",
        adjacent: {'south': 56, 'west': 54}
    }),
    58: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 60, 'east': 59, 'south': 52}
    }),
    59: new Location({
        name: "Forest of Thieves",
        adjacent: {'south': 54, 'west': 58}
    }),
    60: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 65, 'east': 61, 'south': 58}
    }),
    61: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 62, 'east': 64, 'west': 60}
    }),
    62: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 67, 'east': 63, 'south': 61, 'west': 65}
    }),
    63: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 85, 'west': 62}
    }),
    64: new Location({
        name: "Forest of Thieves",
        adjacent: {'west': 61},
        items: [items.unknown(7)]
    }),
    65: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 66, 'east': 62, 'south': 60, 'west': 50}
    }),
    66: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 334, 'south': 65, 'west': 51}
    }),
    67: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 85, 'south': 62}
    }),
    68: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 75, 'east': 69, 'south': 79, 'west': 77}
    }),
    69: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 74, 'west': 68}
    }),
    70: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 71, 'south': 82}
    }),
    71: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 49, 'south': 72, 'west': 70}
    }),
    72: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 71, 'east': 48, 'south': 84, 'west': 82}
    }),
    73: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 83, 'south': 81}
    }),
    74: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 86, 'south': 69, 'west': 75}
    }),
    75: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 80, 'east': 74, 'south': 68, 'west': 76}
    }),
    76: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 81, 'east': 75, 'south': 77},
        items: [items.towering_tree]
    }),
    77: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 76, 'east': 68, 'south': 78}
    }),
    78: new Location({
        name: "Hideout of Mythin the Forester",
        adjacent: {'north': 77, 'east': 79},
        items: [items.sign([
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
        ])]
    }),
    79: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 68, 'west': 78}
    }),
    80: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 83, 'south': 75, 'west': 81}
    }),
    81: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 73, 'east': 80, 'south': 76}
    }),
    82: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 70, 'east': 72, 'west': 83}
    }),
    83: new Location({
        name: "Forest of Thieves",
        adjacent: {'east': 82, 'south': 80, 'west': 73}
    }),
    84: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 72, 'east': 47, 'south': 86}
    }),
    85: new Location({
        name: "Forest of Thieves",
        adjacent: {'south': 63, 'west': 67}
    }),
    86: new Location({
        name: "Forest of Thieves",
        adjacent: {'north': 84, 'east': 46, 'west': 74}
    }),
    87: new Location({
        name: "Mythin's Office",
        adjacent: {'north': 8},
        items: [items.sign([
            "^!^!^!^!^!^!^!^!^!^!^!^!^!^!^",
            "! Mythin is out now, please !",
            "! ask employee for details  !",
            "^!^!^!^!^!^!^!^!^!^!^!^!^!^!^"
        ])]
    }),
    88: new Location({
        name: "Oak Street",
        adjacent: {'north': 13, 'east': 25, 'south': 89, 'west': 134}
    }),
    89: new Location({
        name: "Oak Street",
        adjacent: {'north': 88, 'east': 137, 'south': 90, 'west': 136},
        items: [items.sign([
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
        ])]
    }),
    90: new Location({
        name: "Oak Street - Dead End",
        adjacent: {'north': 89}
    }),
    91: new Location({
        name: "House",
        adjacent: {'south': 7}
    }),
    92: new Location({
        name: "Western Gatehouse",
        adjacent: {'east': 13, 'west': 94},
        items: [items.unknown(35)]
    }),
    93: new Location({
        name: "Eastern Gatehouse",
        adjacent: {'east': 95, 'west': 10},
        items: [items.unknown(35)]
    }),
    94: new Location({
        name: "West Road",
        adjacent: {'east': 92, 'west': 98}
    }),
    95: new Location({
        name: "East Road",
        adjacent: {'east': 97, 'west': 93}
    }),
    96: new Location({
        name: "East Road, Fork of Nod",
        adjacent: {'east': 283, 'south': 142, 'west': 97},
        items: [items.sign([
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
        )]
    }),
    97: new Location({
        name: "East Road",
        adjacent: {'east': 96, 'west': 95},
        items: [items.unknown(37)]
    }),
    98: new Location({
        name: "West Road, Forks South",
        adjacent: {'east': 94, 'south': 99, 'west': 130}
    }),
    99: new Location({
        name: "Path",
        adjacent: {'north': 98, 'south': 100},
        items: [items.sign([
            "-\\  /---\\/------------------------",
            "| \\/  Beware of water to the west|",
            "|        and east of the river   |",
            "-----/\\---------/\\-------------/\\|"
        ])]
    }),
    100: new Location({
        name: "Path",
        adjacent: {'north': 99, 'south': 101}
    }),
    101: new Location({
        name: "Stony Bridge",
        adjacent: {'north': 100, 'south': 102}
    }),
    102: new Location({
        name: "Stony Bridge",
        adjacent: {'north': 101, 'south': 103}
    }),
    103: new Location({
        name: "Stony Bridge",
        adjacent: {'north': 102, 'south': 104}
    }),
    104: new Location({
        name: "Path, Sloping Steeply",
        adjacent: {'north': 103, 'south': 105}
    }),
    105: new Location({
        name: "Mountain Pass",
        adjacent: {'north': 104, 'east': 113, 'south': 106}
    }),
    106: new Location({
        name: "Mountain Pass",
        adjacent: {'north': 105, 'south': 107, 'west': 110}
    }),
    107: new Location({
        name: "Mountain Pass",
        adjacent: {'north': 106, 'east': 108}
    }),
    108: new Location({
        name: "Lush Valley",
        adjacent: {'east': 109, 'west': 107}
    }),
    109: new Location({
        name: "Eldin's Mountain Cottage",
        adjacent: {'west': 108},
        items: [items.sign([
            "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+",
            "+  Welcome to My Cottage!                 +",
            "+    Please make yourself at home, to see +",
            "+    what I train, please type 'list'.    +",
            "+                                         +",
            "+    I know that is a long trip out here, +",
            "+    and so for your convenience I will   +",
            "+    transport you back to town free of   +",
            "+    cost.  Type 'transport' to have me do+",
            "+    so.                                  +",
            "+                                         +",
            "+        Thankyou, Eldin                  +",
            "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+"
        ])]
    }),
    110: new Location({
        name: "Mountain Valley",
        adjacent: {'north': 115, 'east': 106, 'west': 111}
    }),
    111: new Location({
        name: "Mountain Valley",
        adjacent: {'east': 110, 'south': 112}
    }),
    112: new Location({
        name: "Mountain Valey",
        adjacent: {'north': 111}
    }),
    113: new Location({
        name: "Mountain Valley",
        adjacent: {'south': 114, 'west': 105}
    }),
    114: new Location({
        name: "Mountain Valley",
        adjacent: {'north': 113}
    }),
    115: new Location({
        name: "Mountain Valley",
        adjacent: {'south': 110}
    }),
    116: new Location({
        name: "Mucky Path",
        adjacent: {'south': 13, 'west': 117}
    }),
    117: new Location({
        name: "Mucky Path",
        adjacent: {'east': 116, 'west': 118}
    }),
    118: new Location({
        name: "Mucky Path, Trails off to Nothing",
        adjacent: {'north': 119, 'east': 117}
    }),
    119: new Location({
        name: "Swamp",
        adjacent: {'north': 125, 'south': 118, 'west': 120}
    }),
    120: new Location({
        name: "Swamp",
        adjacent: {'north': 124, 'east': 119, 'south': 121}
    }),
    121: new Location({
        name: "Swamp",
        adjacent: {'north': 120}
    }),
    122: new Location({
        name: "Swamp",
        adjacent: {'north': 123}
    }),
    123: new Location({
        name: "Swamp",
        adjacent: {'north': 128, 'east': 124, 'south': 122, 'west': 126}
    }),
    124: new Location({
        name: "Swamp",
        adjacent: {'north': 129, 'east': 125, 'south': 120, 'west': 123}
    }),
    125: new Location({
        name: "Swamp",
        adjacent: {'south': 119, 'west': 124}
    }),
    126: new Location({
        name: "Swamp",
        adjacent: {'north': 127, 'east': 123, 'west': 139}
    }),
    127: new Location({
        name: "Swamp",
        adjacent: {'north': 140, 'east': 128, 'south': 126, 'west': 138}
    }),
    128: new Location({
        name: "Swamp",
        adjacent: {'south': 123, 'west': 127}
    }),
    129: new Location({
        name: "Swamp",
        adjacent: {'south': 124}
    }),
    130: new Location({
        name: "West Road",
        adjacent: {'east': 98, 'west': 131}
    }),
    131: new Location({
        name: "West Road",
        adjacent: {'east': 130, 'west': 323}
    }),
    132: new Location({
        name: "Courthouse Lobby",
        adjacent: {'north': 9, 'south': 133},
        items: [items.sign([
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
        ])]
    }),
    133: new Location({
        name: "Courtroom",
        adjacent: {'north': 132}
    }),
    134: new Location({
        name: "House",
        adjacent: {'east': 88}
    }),
    135: new Location({
        name: "Spritzer Hut",
        adjacent: {'south': 10}
    }),
    136: new Location({
        name: "House",
        adjacent: {'east': 89}
    }),
    137: new Location({
        name: "Alleyway",
        adjacent: {'east': 6, 'west': 89}
    }),
    138: new Location({
        name: "Water's Edge",
        adjacent: {'north': 141, 'east': 127, 'south': 139}
    }),
    139: new Location({
        name: "Water's Edge",
        adjacent: {'north': 138, 'east': 126}
    }),
    140: new Location({
        name: "Water's Edge",
        adjacent: {'south': 127, 'west': 141}
    }),
    141: new Location({
        name: "Water's Edge",
        adjacent: {'east': 140, 'south': 138}
    }),
    142: new Location({
        name: "Path of Nod",
        adjacent: {'north': 96, 'south': 143}
    }),
    143: new Location({
        name: "Path of Nod",
        adjacent: {'north': 142, 'south': 144}
    }),
    144: new Location({
        name: "Path of Nod",
        adjacent: {'north': 143, 'south': 145}
    }),
    145: new Location({
        name: "Path of Nod",
        adjacent: {'north': 144, 'south': 146}
    }),
    146: new Location({
        name: "Path of Nod",
        adjacent: {'north': 145, 'south': 147}
    }),
    147: new Location({
        name: "Path of Nod",
        adjacent: {'north': 146, 'south': 148}
    }),
    148: new Location({
        name: "Path of Nod",
        adjacent: {'north': 147, 'south': 149}
    }),
    149: new Location({
        name: "Path of Nod",
        adjacent: {'north': 148, 'south': 150}
    }),
    150: new Location({
        name: "Path of Nod",
        adjacent: {'north': 149, 'south': 151}
    }),
    151: new Location({
        name: "Path of Nod",
        adjacent: {'north': 150, 'south': 152}
    }),
    152: new Location({
        name: "Path of Nod",
        adjacent: {'north': 151, 'south': 153}
    }),
    153: new Location({
        name: "Path of Nod",
        adjacent: {'north': 152, 'south': 154}
    }),
    154: new Location({
        name: "Path of Nod",
        adjacent: {'north': 153, 'south': 155}
    }),
    155: new Location({
        name: "Path of Nod",
        adjacent: {'north': 154, 'south': 156}
    }),
    156: new Location({
        name: "Path of Nod",
        adjacent: {'north': 155, 'south': 157}
    }),
    157: new Location({
        name: "Path of Nod",
        adjacent: {'north': 156, 'south': 158}
    }),
    158: new Location({
        name: "Path of Nod",
        adjacent: {'north': 157, 'south': 159}
    }),
    159: new Location({
        name: "Path of Nod",
        adjacent: {'north': 158, 'south': 160}
    }),
    160: new Location({
        name: "Path of Nod",
        adjacent: {'north': 159, 'south': 161}
    }),
    161: new Location({
        name: "Path of Nod",
        adjacent: {'north': 160, 'south': 162, 'west': 202}
    }),
    162: new Location({
        name: "Path of Nod",
        adjacent: {'north': 161, 'south': 163, 'west': 203}
    }),
    163: new Location({
        name: "Path of Nod",
        adjacent: {'north': 162, 'south': 164, 'west': 204}
    }),
    164: new Location({
        name: "Path of Nod",
        adjacent: {'north': 163, 'south': 165}
    }),
    165: new Location({
        name: "Path of Nod",
        adjacent: {'north': 164, 'south': 166}
    }),
    166: new Location({
        name: "Path of Nod",
        adjacent: {'north': 165, 'south': 167}
    }),
    167: new Location({
        name: "Path of Nod",
        adjacent: {'north': 166, 'south': 168}
    }),
    168: new Location({
        name: "Path of Nod",
        adjacent: {'north': 167, 'south': 169}
    }),
    169: new Location({
        name: "Path of Nod",
        adjacent: {'north': 168, 'south': 170}
    }),
    170: new Location({
        name: "Path of Nod",
        adjacent: {'north': 169, 'south': 171}
    }),
    171: new Location({
        name: "Path of Nod",
        adjacent: {'north': 170, 'south': 172}
    }),
    172: new Location({
        name: "Path of Nod",
        adjacent: {'north': 171, 'south': 173}
    }),
    173: new Location({
        name: "Path of Nod",
        adjacent: {'north': 172, 'south': 174}
    }),
    174: new Location({
        name: "Path of Nod",
        adjacent: {'north': 173, 'south': 175}
    }),
    175: new Location({
        name: "Path of Nod",
        adjacent: {'north': 174, 'south': 176}
    }),
    176: new Location({
        name: "Path of Nod",
        adjacent: {'north': 175, 'south': 177}
    }),
    177: new Location({
        name: "Path of Nod",
        adjacent: {'north': 176, 'south': 178}
    }),
    178: new Location({
        name: "Path of Nod",
        adjacent: {'north': 177, 'south': 179}
    }),
    179: new Location({
        name: "Path of Nod",
        adjacent: {'north': 178, 'east': 220, 'south': 180}
    }),
    180: new Location({
        name: "Path of Nod",
        adjacent: {'north': 179, 'south': 181}
    }),
    181: new Location({
        name: "Path of Nod",
        adjacent: {'north': 180, 'south': 182}
    }),
    182: new Location({
        name: "Path of Nod",
        adjacent: {'north': 181, 'south': 183}
    }),
    183: new Location({
        name: "Path of Nod",
        adjacent: {'north': 182, 'south': 184}
    }),
    184: new Location({
        name: "Path of Nod",
        adjacent: {'north': 183, 'south': 185}
    }),
    185: new Location({
        name: "Path of Nod",
        adjacent: {'north': 184, 'south': 186}
    }),
    186: new Location({
        name: "Path of Nod",
        adjacent: {'north': 185, 'south': 187}
    }),
    187: new Location({
        name: "Path of Nod",
        adjacent: {'north': 186, 'south': 188}
    }),
    188: new Location({
        name: "Path of Nod",
        adjacent: {'north': 187, 'south': 189}
    }),
    189: new Location({
        name: "Path of Nod",
        adjacent: {'north': 188, 'south': 190}
    }),
    190: new Location({
        name: "Path of Nod",
        adjacent: {'north': 189, 'south': 191}
    }),
    191: new Location({
        name: "Path of Nod",
        adjacent: {'north': 190},
        items: [items.locked_gate]
    }),
    192: new Location({
        name: "Path of Nod",
        adjacent: {'north': 191, 'south': 193}
    }),
    193: new Location({
        name: "Path of Nod",
        adjacent: {'north': 192, 'south': 194}
    }),
    194: new Location({
        name: "Path of Nod",
        adjacent: {'north': 193, 'south': 195}
    }),
    195: new Location({
        name: "Path of Nod",
        adjacent: {'north': 194, 'south': 196}
    }),
    196: new Location({
        name: "Path of Nod",
        adjacent: {'north': 195, 'south': 197}
    }),
    197: new Location({
        name: "Path of Nod",
        adjacent: {'north': 196, 'east': 318, 'south': 198},
        items: [items.sign([
            " ______________ ",
            "|          \\   |",
            "| tHiS way tO\\ |",
            "|------------->|",
            "| GroBiN     / |",
            "|__________/___|"
        ])]
    }),
    198: new Location({
        name: "Path of Nod",
        adjacent: {'north': 197, 'south': 199}
    }),
    199: new Location({
        name: "Path of Nod",
        adjacent: {'north': 198, 'south': 200}
    }),
    200: new Location({
        name: "Path of Nod",
        adjacent: {'north': 199, 'south': 201}
    }),
    201: new Location({
        name: "Path of Nod",
        adjacent: {'north': 200, 'south': 250}
    }),
    202: new Location({
        name: "Meadow",
        adjacent: {'east': 161, 'south': 203}
    }),
    203: new Location({
        name: "Meadow",
        adjacent: {'north': 202, 'east': 162, 'south': 204, 'west': 206}
    }),
    204: new Location({
        name: "Meadow",
        adjacent: {'north': 203, 'east': 163, 'west': 207}
    }),
    205: new Location({
        name: "Meadow",
        adjacent: {'north': 210, 'east': 216}
    }),
    206: new Location({
        name: "Meadow",
        adjacent: {'east': 203, 'south': 207, 'west': 209}
    }),
    207: new Location({
        name: "Meadow",
        adjacent: {'north': 206, 'east': 204, 'south': 216, 'west': 210}
    }),
    208: new Location({
        name: "Meadow",
        adjacent: {'north': 219, 'south': 209, 'west': 211}
    }),
    209: new Location({
        name: "Meadow",
        adjacent: {'north': 208, 'east': 206, 'south': 210, 'west': 215}
    }),
    210: new Location({
        name: "Meadow",
        adjacent: {'north': 209, 'east': 207, 'south': 205}
    }),
    211: new Location({
        name: "Meadow",
        adjacent: {'north': 218, 'east': 208, 'south': 215, 'west': 222}
    }),
    212: new Location({
        name: "Meadow",
        adjacent: {'east': 213, 'south': 221}
    }),
    213: new Location({
        name: "Meadow",
        adjacent: {'south': 214, 'west': 212}
    }),
    214: new Location({
        name: "Meadow",
        adjacent: {'north': 213, 'east': 224, 'west': 221}
    }),
    215: new Location({
        name: "Meadow",
        adjacent: {'north': 211, 'east': 209}
    }),
    216: new Location({
        name: "Meadow",
        adjacent: {'north': 207, 'west': 205}
    }),
    217: new Location({
        name: "Meadow",
        adjacent: {'east': 218, 'south': 222}
    }),
    218: new Location({
        name: "Meadow",
        adjacent: {'north': 221, 'east': 219, 'south': 211, 'west': 217}
    }),
    219: new Location({
        name: "Meadow",
        adjacent: {'south': 208, 'west': 218}
    }),
    220: new Location({
        name: "Bog",
        adjacent: {'east': 229, 'west': 179}
    }),
    221: new Location({
        name: "Meadow",
        adjacent: {'north': 212, 'east': 214, 'south': 218}
    }),
    222: new Location({
        name: "Meadow",
        adjacent: {'north': 217, 'east': 211}
    }),
    223: new Location({
        name: "Boulder Field",
        adjacent: {'east': 228, 'south': 224}
    }),
    224: new Location({
        name: "Boulder Field",
        adjacent: {'north': 223, 'east': 227, 'south': 225, 'west': 214}
    }),
    225: new Location({
        name: "Boulder Field",
        adjacent: {'north': 224, 'east': 226, 'west': 383}
    }),
    226: new Location({
        name: "Boulder Field",
        adjacent: {'north': 227, 'west': 225}
    }),
    227: new Location({
        name: "Boulder Field",
        adjacent: {'north': 228, 'south': 226, 'west': 224}
    }),
    228: new Location({
        name: "Boulder Field",
        adjacent: {'south': 227, 'west': 223}
    }),
    229: new Location({
        name: "Bog",
        adjacent: {'east': 230, 'west': 220}
    }),
    230: new Location({
        name: "Bog",
        adjacent: {'north': 244, 'east': 231, 'west': 229}
    }),
    231: new Location({
        name: "Bog",
        adjacent: {'south': 235, 'west': 230}
    }),
    232: new Location({
        name: "Bog",
        adjacent: {'north': 233, 'east': 249, 'west': 236}
    }),
    233: new Location({
        name: "Bog",
        adjacent: {'south': 232}
    }),
    234: new Location({
        name: "Bog",
        adjacent: {'east': 235, 'south': 247}
    }),
    235: new Location({
        name: "Bog",
        adjacent: {'north': 231, 'east': 236, 'south': 246, 'west': 234}
    }),
    236: new Location({
        name: "Bog",
        adjacent: {'east': 232, 'west': 235}
    }),
    237: new Location({
        name: "Bog",
        adjacent: {'north': 239}
    }),
    238: new Location({
        name: "Bog",
        adjacent: {'east': 239, 'south': 244, 'west': 245}
    }),
    239: new Location({
        name: "Bog",
        adjacent: {'north': 240, 'east': 241, 'south': 237, 'west': 238}
    }),
    240: new Location({
        name: "Bog",
        adjacent: {'south': 239}
    }),
    241: new Location({
        name: "Bog",
        adjacent: {'east': 242, 'south': 243, 'west': 239}
    }),
    242: new Location({
        name: "Bog",
        adjacent: {'west': 241}
    }),
    243: new Location({
        name: "Bog",
        adjacent: {'north': 241}
    }),
    244: new Location({
        name: "Bog",
        adjacent: {'north': 238, 'south': 230}
    }),
    245: new Location({
        name: "Bog",
        adjacent: {'east': 238}
    }),
    246: new Location({
        name: "Bog",
        adjacent: {'north': 235, 'west': 247}
    }),
    247: new Location({
        name: "Bog",
        adjacent: {'north': 234, 'east': 246, 'south': 248}
    }),
    248: new Location({
        name: "Bog",
        adjacent: {'north': 247}
    }),
    249: new Location({
        name: "Bog",
        adjacent: {'west': 232}
    }),
    250: new Location({
        name: "Corroded Gate",
        adjacent: {'north': 201, 'south': 262},
        items: [items.sign([
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
        ])]
    }),
    251: new Location({
        name: "Dark Forest",
        adjacent: {'north': 252, 'east': 262, 'west': 261}
    }),
    252: new Location({
        name: "Dark Forest",
        adjacent: {'south': 251}
    }),
    253: new Location({
        name: "Dark Forest",
        adjacent: {'north': 271, 'south': 261}
    }),
    254: new Location({
        name: "Dark Forest",
        adjacent: {'east': 261, 'west': 260}
    }),
    255: new Location({
        name: "Dark Forest",
        adjacent: {'north': 261, 'east': 257, 'south': 258}
    }),
    256: new Location({
        name: "Dark Forest",
        adjacent: {'north': 262, 'east': 263, 'west': 257}
    }),
    257: new Location({
        name: "Dark Forest",
        adjacent: {'east': 256, 'west': 255}
    }),
    258: new Location({
        name: "Dark Forest",
        adjacent: {'north': 255, 'west': 259}
    }),
    259: new Location({
        name: "Dark Forest",
        adjacent: {'east': 258, 'south': 267, 'west': 277}
    }),
    260: new Location({
        name: "Dark Forest",
        adjacent: {'east': 254}
    }),
    261: new Location({
        name: "Dark Forest",
        adjacent: {'north': 253, 'east': 251, 'south': 255, 'west': 254}
    }),
    262: new Location({
        name: "Dark Forest",
        adjacent: {'north': 250, 'east': 268, 'south': 256, 'west': 251}
    }),
    263: new Location({
        name: "Dark Forest",
        adjacent: {'north': 268, 'south': 266, 'west': 256}
    }),
    264: new Location({
        name: "Dark Forest",
        adjacent: {'north': 266, 'east': 273, 'west': 265}
    }),
    265: new Location({
        name: "Dark Forest",
        adjacent: {'east': 264}
    }),
    266: new Location({
        name: "Dark Forest",
        adjacent: {'north': 263, 'east': 272, 'south': 264}
    }),
    267: new Location({
        name: "Dark Forest",
        adjacent: {'north': 259, 'east': 265, 'south': 270, 'west': 271}
    }),
    268: new Location({
        name: "Dark Forest",
        adjacent: {'east': 269, 'south': 263, 'west': 262}
    }),
    269: new Location({
        name: "Dark Forest",
        adjacent: {'north': 276, 'east': 270, 'west': 268}
    }),
    270: new Location({
        name: "Dark Forest",
        adjacent: {'north': 267, 'west': 269}
    }),
    271: new Location({
        name: "Dark Forest",
        adjacent: {'east': 267, 'south': 253}
    }),
    272: new Location({
        name: "Dark Forest",
        adjacent: {'east': 274, 'south': 273, 'west': 266}
    }),
    273: new Location({
        name: "Dark Forest",
        adjacent: {'north': 272, 'east': 275, 'west': 264}
    }),
    274: new Location({
        name: "Dark Forest",
        adjacent: {'north': 278, 'south': 275, 'west': 272}
    }),
    275: new Location({
        name: "Dark Forest",
        adjacent: {'north': 274, 'west': 273}
    }),
    276: new Location({
        name: "Dark Forest",
        adjacent: {'south': 269}
    }),
    277: new Location({
        name: "Dark Forest",
        adjacent: {'east': 259}
    }),
    278: new Location({
        name: "Dark Forest",
        adjacent: {'south': 274}
    }),
    279: new Location({
        name: "House",
        adjacent: {'north': 7}
    }),
    280: new Location({
        name: "House",
        adjacent: {'south': 11}
    }),
    281: new Location({
        name: "Beet Street",
        adjacent: {'north': 308, 'east': 314},
        items: [items.sign([
            "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
            "% RANDOM USEFUL THINGS - SIGN 2:    %",
            "%                                   %",
            "% *Sick of being attacked by guards?%",
            "%   If you've commited a past sin,  %",
            "%   there IS hope!  Visit the court %",
            "%   room on East Road to have your  %",
            "%   case repealed!                  %",
            "%                                   %",
            "%  For more useful INFO, visit the  %",
            "%    IERDALE INFORMATION ARCHIVES   %",
            "% Directly East       ------------> %",
            "%                                   %",
            "%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%{-}%",
            "                 | |",
            "                 | |",
            "                 | |"
        ])]
    }),
    282: new Location({
        name: "The Top of the Tree",
        adjacent: {}
    }),
    283: new Location({
        name: "Gatehouse",
        adjacent: {'north': 286, 'east': 284, 'west': 96},
        items: [items.sign([
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
        ])]
    }),
    284: new Location({
        name: "East Road",
        adjacent: {'west': 283}
    }),
    285: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 288, 'west': 286}
    }),
    286: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 287, 'east': 285, 'south': 283}
    }),
    287: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 289, 'east': 288, 'south': 286}
    }),
    288: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 290, 'east': 292, 'south': 285, 'west': 287}
    }),
    289: new Location({
        name: "Sandy Desert",
        adjacent: {'east': 290, 'south': 287, 'west': 297}
    }),
    290: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 293, 'east': 291, 'south': 288, 'west': 289}
    }),
    291: new Location({
        name: "Sandy Desert",
        adjacent: {'east': 296, 'south': 292, 'west': 290},
        items: [items.unknown(15)]
    }),
    292: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 291, 'east': 300, 'west': 288}
    }),
    293: new Location({
        name: "Sandy Desert",
        adjacent: {'east': 294, 'south': 290}
    }),
    294: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 299, 'east': 295, 'west': 293}
    }),
    295: new Location({
        name: "Sandy Desert",
        adjacent: {'south': 296, 'west': 294}
    }),
    296: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 295, 'east': 302, 'west': 291}
    }),
    297: new Location({
        name: "Sandy Desert",
        adjacent: {'east': 289, 'south': 298}
    }),
    298: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 297}
    }),
    299: new Location({
        name: "Sandy Desert",
        adjacent: {'south': 294}
    }),
    300: new Location({
        name: "Sandy Desert",
        adjacent: {'east': 301, 'south': 304, 'west': 292}
    }),
    301: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 302, 'south': 303, 'west': 300}
    }),
    302: new Location({
        name: "Sandy Desert",
        adjacent: {'south': 301, 'west': 296}
    }),
    303: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 301}
    }),
    304: new Location({
        name: "Sandy Desert",
        adjacent: {'north': 300}
    }),
    305: new Location({
        name: "Beet Street",
        adjacent: {'north': 10, 'east': 312, 'south': 306}
    }),
    306: new Location({
        name: "Beet Street",
        adjacent: {'north': 305, 'east': 317, 'south': 307, 'west': 309}
    }),
    307: new Location({
        name: "Beet Street",
        adjacent: {'north': 306, 'east': 313, 'south': 308}
    }),
    308: new Location({
        name: "Beet Street",
        adjacent: {'north': 307, 'south': 281, 'west': 311}
    }),
    309: new Location({
        name: "Music Store",
        adjacent: {'east': 306}
    }),
    310: new Location({
        name: "Cleric Shop",
        adjacent: {'south': 311},
        items: [items.sign([
            "<---------------------------------->",
            "[] Welcome to The Shop of Eldfarl []",
            "[]                                []",
            "[] Here is what we sell:          []",
            "[] partial healing potion ..  5gp []",
            "[] mostly healing potion ... 10gp []",
            "[] full healing potion ..... 30gp []",
            "[]                                []",
            "[]    To buy something, type:     []",
            "[]      ",
            "<---------------------------------->"
        ])]
    }),
    311: new Location({
        name: "Eldfarl's Office",
        adjacent: {'north': 310, 'east': 308, 'south': 316},
        items: [items.sign([
            "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+",
            "|                           |",
            "| /|\\ NORTH - Potion Shop   |",
            "|                           |",
            "| \\|/ SOUTH - Training Area |",
            "|                           |",
            "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+"
        ])]
    }),
    312: new Location({
        name: "Eldin's House",
        adjacent: {'west': 305},
        items: [items.sign([
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
            "{        sincerly,                   }",
            "{         Eldin the wise of Ierdale  }",
            "{{{{{{{{{{{{{{{{{{{{}}}}}}}}}}}}}}}}}}}"
        ])]
            
    }),
    313: new Location({
        name: "Archery Workshop",
        adjacent: {'west': 307},
        items: [items.sign([
            "******************************",
            "|    Our Bows...             |",
            "|Our bows come with a quality|",
            "|guarantee.  Nobody in town  |",
            "|makes a better bow.  This is|",
            "|what we sell:               |",
            "|                            |",
            "| shortbow          99 gp    |",
            "| longbow           600 gp   |",
            "| crossbow          1300 gp  |",
            "| heavy crossbow    2500 gp  |",
            "| hand crossbow     140 gp   |",
            "| composite bow     2910 gp  |",
            "| ballista          18600 gp |",
            "| arrow             2 gp     |",
            "| ballista bolt     25 gp    |",
            "|Type: buy [merchandise name]|",
            "******************************"
        ])]
    }),
    314: new Location({
        name: "Apothecary",
        adjacent: {'west': 281},
        items: [items.mixing_pot]
    }),
    315: new Location({
        name: "The RIver",
        adjacent: {}
    }),
    316: new Location({
        name: "Clerical Training Facilities",
        adjacent: {'north': 311},
        items: [items.sign([
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
        ])]
    }),
    317: new Location({
        name: "House",
        adjacent: {'west': 306}
    }),
    318: new Location({
        name: "Cobblestone Road",
        adjacent: {'east': 319, 'west': 197}
    }),
    319: new Location({
        name: "Cobblestone Road",
        adjacent: {'east': 320, 'west': 318}
    }),
    320: new Location({
        name: "Cobblestone Road",
        adjacent: {'east': 343, 'west': 319}
    }),
    321: new Location({
        name: "Information Desk",
        adjacent: {'south': 45}
    }),
    322: new Location({
        name: "Hermit Hut",
        adjacent: {'south': 328}
    }),
    323: new Location({
        name: "Dry Grass",
        adjacent: {'east': 131, 'south': 324, 'west': 329}
    }),
    324: new Location({
        name: "Dry Grass",
        adjacent: {'north': 323, 'west': 325}
    }),
    325: new Location({
        name: "Dry Grass",
        adjacent: {'east': 324, 'south': 327, 'west': 328},
        items: [items.sign([
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
        ])]
    }),
    326: new Location({
        name: "Dry Grass",
        adjacent: {'west': 327}
    }),
    327: new Location({
        name: "Dry Grass",
        adjacent: {'north': 325, 'east': 326}
    }),
    328: new Location({
        name: "Dry Grass",
        adjacent: {'north': 322, 'east': 325}
    }),
    329: new Location({
        name: "Dry Grass",
        adjacent: {'north': 330, 'east': 323}
    }),
    330: new Location({
        name: "Dry Grass",
        adjacent: {'south': 329}
    }),
    331: new Location({
        name: "Ierdale Barracks",
        adjacent: {'east': 332, 'west': 26},
        items: [items.sign([
            "0========(--------------------------------",
            "|     Welcome to the Ierdale Barracks    |",
            "|                                        |",
            "| The Military Headquarters of Ierdale   |",
            "--------------------------------)========0"
        ])]
    }),
    332: new Location({
        name: "Ierdale Barracks",
        adjacent: {'west': 331}
    }),
    333: new Location({
        name: "Book Store",
        adjacent: {'east': 4},
        items: [items.sign()]
    }),
    334: new Location({
        name: "Hidden Track",
        adjacent: {'east': 335, 'west': 66},
        items: [items.sign([
            "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
            "~    Secret Passage to the Path of Nod      ~",
            "~                ~~~~~~~~~                  ~",
            "~                                           ~",
            "~  Maintained by the thieves of The Forest  ~",
            "~ of Theives.  Do not tell ANYONE about this~",
            "~               secret path.                ~",
            "~                                           ~",
            "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
        ])]
    }),
    335: new Location({
        name: "Hidden Track",
        adjacent: {'east': 336, 'west': 334}
    }),
    336: new Location({
        name: "Hidden Track",
        adjacent: {'east': 337, 'west': 335}
    }),
    337: new Location({
        name: "Path",
        adjacent: {'south': 338, 'west': 336}
    }),
    338: new Location({
        name: "Path",
        adjacent: {'north': 337, 'south': 339}
    }),
    339: new Location({
        name: "Path",
        adjacent: {'north': 338, 'south': 340}
    }),
    340: new Location({
        name: "Path",
        adjacent: {'north': 339, 'south': 341}
    }),
    341: new Location({
        name: "Path",
        adjacent: {'north': 340, 'south': 342}
    }),
    342: new Location({
        name: "Path",
        adjacent: {'north': 341, 'south': 142},
        items: [items.sign([
            "/\\\\-------------------\\   ",
            "\\// Hear Ye, Hear Ye: /   ",
            " /  Outlawed in town? |   ",
            " |     /----\\/----\\   |   ",
            " |  Buy a pass to this|   ",
            " |   town for 1000gp! |   ",
            " \\                    |   ",
            "/\\\\ to buy,type 'pass'\\   ",
            "\\//-------------------/   "
        ])]
    }),
    343: new Location({
        name: "Grobin Gates",
        adjacent: {'east': 344, 'west': 320}
    }),
    344: new Location({
        name: "Grobin Square",
        adjacent: {'north': 355, 'east': 345, 'south': 350, 'west': 343},
        items: [items.sign([
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
        ])]
    }),
    345: new Location({
        name: "Main Street",
        adjacent: {'north': 373, 'east': 346, 'west': 344}
    }),
    346: new Location({
        name: "Main Street",
        adjacent: {'north': 372, 'east': 347, 'west': 345}
    }),
    347: new Location({
        name: "Main Street",
        adjacent: {'east': 348, 'south': 374, 'west': 346}
    }),
    348: new Location({
        name: "Main Street",
        adjacent: {'north': 349, 'west': 347}
    }),
    349: new Location({
        name: "Main Street",
        adjacent: {'north': 360, 'east': 377, 'south': 348, 'west': 376}
    }),
    350: new Location({
        name: "Blobin Street",
        adjacent: {'north': 344, 'east': 362, 'south': 351, 'west': 367}
    }),
    351: new Location({
        name: "Blobin Street",
        adjacent: {'north': 350, 'east': 368, 'south': 352}
    }),
    352: new Location({
        name: "Blobin Street",
        adjacent: {'north': 351, 'west': 353}
    }),
    353: new Location({
        name: "Blobin Street",
        adjacent: {'north': 369, 'east': 352, 'west': 354}
    }),
    354: new Location({
        name: "End of Blobin Street",
        adjacent: {'north': 370, 'east': 353, 'south': 371}
    }),
    355: new Location({
        name: "Grogren Street",
        adjacent: {'north': 356, 'south': 344}
    }),
    356: new Location({
        name: "Grogren Street",
        adjacent: {'north': 357, 'south': 355, 'west': 380}
    }),
    357: new Location({
        name: "Grogren Street",
        adjacent: {'east': 358, 'south': 356}
    }),
    358: new Location({
        name: "Grogren Street",
        adjacent: {'north': 379, 'east': 359, 'west': 357}
    }),
    359: new Location({
        name: "End of Grogren Street",
        adjacent: {'south': 381, 'west': 358}
    }),
    360: new Location({
        name: "Main Street - Barracks East",
        adjacent: {'east': 361, 'south': 349, 'west': 375}
    }),
    361: new Location({
        name: "Barracks Gate",
        adjacent: {'east': 363, 'west': 360},
        items: [items.sign([
            "{[(@)]}{[(@)]}{[(@)]}{[(@)]}",
            "{                          }",
            "{   ORC BARRACKS - GROBIN  }",
            "{                          }",
            "{[(@)]}{[(@)]}{[(@)]}{[(@)]}"
        ])]
    }),
    362: new Location({
        name: "Doo-Dad Shop",
        adjacent: {'west': 350}
    }),
    363: new Location({
        name: "Orcish Stronghold",
        adjacent: {'north': 365, 'east': 366, 'south': 364, 'west': 361}
    }),
    364: new Location({
        name: "Barracks",
        adjacent: {'north': 363}
    }),
    365: new Location({
        name: "Barracks",
        adjacent: {'south': 363}
    }),
    366: new Location({
        name: "Barracks",
        adjacent: {'west': 363}
    }),
    367: new Location({
        name: "Gerard's General Store",
        adjacent: {'east': 350},
        items: [items.sign([
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
        ])]
    }),
    368: new Location({
        name: "Peon House",
        adjacent: {'west': 351}
    }),
    369: new Location({
        name: "Peon House",
        adjacent: {'south': 353}
    }),
    370: new Location({
        name: "Orckish Armory",
        adjacent: {'south': 354},
        items: [items.sign()]
    }),
    371: new Location({
        name: "House",
        adjacent: {'north': 354}
    }),
    372: new Location({
        name: "Peon House",
        adjacent: {'south': 346}
    }),
    373: new Location({
        name: "Orc House",
        adjacent: {'south': 345}
    }),
    374: new Location({
        name: "Orc House",
        adjacent: {'north': 347, 'east': 378}
    }),
    375: new Location({
        name: "Peon House",
        adjacent: {'east': 360}
    }),
    376: new Location({
        name: "Peon House",
        adjacent: {'east': 349}
    }),
    377: new Location({
        name: "Peon House",
        adjacent: {'west': 349}
    }),
    378: new Location({
        name: "Drawing Room",
        adjacent: {'west': 374}
    }),
    379: new Location({
        name: "House",
        adjacent: {'south': 358}
    }),
    380: new Location({
        name: "Peon House",
        adjacent: {'east': 356}
    }),
    381: new Location({
        name: "Prokon's Pet Store",
        adjacent: {'north': 359},
        items: [items.sign([
            "/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\!/\\",
            "!                                          !",
            "!    Welcome.                              !",
            "!  I raise and sell various animals.       !",
            "!  To see which ones I currently have      !",
            "!  available, please type ",
            "!  I also buy pets you don't want.         !",
            "!  To sell one, type ",
            "!  of the pet.                             !",
            "!                                          !",
            "\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/"
        ])]
    }),
    382: new Location({
        name: "Cave",
        adjacent: {'north': 399, 'east': 394, 'south': 385}
    }),
    383: new Location({
        name: "Cave Entrance",
        adjacent: {'east': 225, 'west': 384}
    }),
    384: new Location({
        name: "Cave",
        adjacent: {'north': 394, 'east': 383, 'south': 390}
    }),
    385: new Location({
        name: "Cave",
        adjacent: {'north': 382, 'south': 386, 'west': 389}
    }),
    386: new Location({
        name: "Cave",
        adjacent: {'north': 385, 'east': 390}
    }),
    387: new Location({
        name: "Cave",
        adjacent: {'north': 389}
    }),
    388: new Location({
        name: "Cave",
        adjacent: {'north': 392}
    }),
    389: new Location({
        name: "Cave",
        adjacent: {'east': 385, 'south': 387, 'west': 392}
    }),
    390: new Location({
        name: "Cave",
        adjacent: {'north': 384, 'west': 386}
    }),
    391: new Location({
        name: "Cave",
        adjacent: {'west': 393}
    }),
    392: new Location({
        name: "Cave",
        adjacent: {'north': 393, 'east': 389, 'south': 388}
    }),
    393: new Location({
        name: "Cave",
        adjacent: {'east': 391, 'south': 392}
    }),
    394: new Location({
        name: "Cave",
        adjacent: {'north': 395, 'south': 384, 'west': 382}
    }),
    395: new Location({
        name: "Cave",
        adjacent: {'north': 396, 'south': 394}
    }),
    396: new Location({
        name: "Cave",
        adjacent: {'south': 395, 'west': 397}
    }),
    397: new Location({
        name: "Cave",
        adjacent: {'east': 396, 'south': 399, 'west': 398}
    }),
    398: new Location({
        name: "Cave",
        adjacent: {'east': 397, 'south': 400}
    }),
    399: new Location({
        name: "Cave",
        adjacent: {'north': 397, 'south': 382}
    }),
    400: new Location({
        name: "Cave",
        adjacent: {'north': 398}
    })
}

export { gameMap}