import {Character, Item, Location, newLocation} from '../../game elements/game_elements.ts'
import { items } from './items.ts'
import { characters } from './characters.ts'

const gameMap = {
    1: newLocation({
        name: "Cottage of the Young",
        adjacent: {'north': 6, 'east': 14, 'west': 15},
        items: [items.sign(
            "Welcome to the Village of Nod.  " +
            "The village is small, but the people are friendly.  " +
            "Please be respectful of the villagers and their property."
        )]
    }),
    2: newLocation({
        name: "North Road",
        adjacent: {'north': 3, 'east': 21, 'south': 12},
        items: [items.sign()]
    }),
    3: newLocation({
        name: "North Road",
        adjacent: {'north': 4, 'east': 20, 'south': 2, 'west': 19}
    }),
    4: newLocation({
        name: "North Road",
        adjacent: {'north': 26, 'east': 22, 'south': 3, 'west': 333}
    }),
    5: newLocation({
        name: "South Road",
        adjacent: {'north': 12, 'south': 6}
    }),
    6: newLocation({
        name: "South Road",
        adjacent: {'north': 5, 'south': 1, 'west': 137}
    }),
    7: newLocation({
        name: "West Road",
        adjacent: {'north': 91, 'east': 11, 'south': 279, 'west': 13},
        items: [items.sign()]
    }),
    8: newLocation({
        name: "East Road",
        adjacent: {'east': 9, 'south': 87, 'west': 12}
    }),
    9: newLocation({
        name: "East Road",
        adjacent: {'north': 24, 'east': 10, 'south': 132, 'west': 8}
    }),
    10: newLocation({
        name: "East Road",
        adjacent: {'north': 135, 'east': 93, 'south': 305, 'west': 9}
    }),
    11: newLocation({
        name: "West Road",
        adjacent: {'north': 280, 'east': 12, 'south': 23, 'west': 7},
        items: [items.sign()]
    }),
    12: newLocation({
        name: "Center of Town",
        adjacent: {'north': 2, 'east': 8, 'south': 5, 'west': 11},
        items: [items.sign()]
    }),
    13: newLocation({
        name: "West Road",
        adjacent: {'north': 116, 'east': 7, 'south': 88, 'west': 92}
    }),
    14: newLocation({
        name: "Bedroom",
        adjacent: {'west': 1},
        characters: [characters.sick_old_cleric]
    }),
    15: newLocation({
        name: "Vegtable Garden",
        adjacent: {'east': 1, 'south': 18, 'west': 16},
        items: [items.sign()]
    }),
    16: newLocation({
        name: "Vegtable Garden",
        adjacent: {'east': 15, 'south': 17}
    }),
    17: newLocation({
        name: "Vegtable Garden",
        adjacent: {'north': 16, 'east': 18},
        items: [items.scarecrow]
    }),
    18: newLocation({
        name: "Vegtable Garden",
        adjacent: {'north': 15, 'west': 17}
    }),
    19: newLocation({
        name: "Pawn Shop",
        adjacent: {'east': 3},
        items: [items.sign()]
    }),
    20: newLocation({
        name: "Grocer",
        adjacent: {'west': 3},
        items: [items.sign()]
    }),
    21: newLocation({
        name: "Blacksmith's Shop",
        adjacent: {'west': 2},
        items: [items.sign()]
    }),
    22: newLocation({
        name: "Pet Store",
        adjacent: {'west': 4},
        items: [items.sign()]
    }),
    23: newLocation({
        name: "House",
        adjacent: {'north': 11},
        items: [items.mixing_pot]
    }),
    24: newLocation({
        name: "Ieadon's House",
        adjacent: {'south': 9},
        items: [items.sign()]
    }),
    25: newLocation({
        name: "Meat Market",
        adjacent: {'west': 88}
    }),
    26: newLocation({
        name: "North Road",
        adjacent: {'north': 27, 'east': 331, 'south': 4, 'west': 45}
    }),
    27: newLocation({
        name: "North Road",
        adjacent: {'north': 28, 'east': 29, 'south': 26}
    }),
    28: newLocation({
        name: "North Gatehouse",
        adjacent: {'north': 44, 'south': 27},
        items: [items.unknown(35)]
    }),
    29: newLocation({
        name: "Dirth Track",
        adjacent: {'east': 30, 'west': 27}
    }),
    30: newLocation({
        name: "Dirth Track",
        adjacent: {'north': 33, 'east': 31, 'west': 29}
    }),
    31: newLocation({
        name: "Dirth Track",
        adjacent: {'east': 32, 'west': 30}
    }),
    32: newLocation({
        name: "Dirth Track",
        adjacent: {'north': 39, 'east': 38, 'south': 41, 'west': 31}
    }),
    33: newLocation({
        name: "Corn Field",
        adjacent: {'north': 36, 'east': 37, 'south': 30, 'west': 34}
    }),
    34: newLocation({
        name: "Corn Field",
        adjacent: {'north': 35, 'east': 33}
    }),
    35: newLocation({
        name: "Corn Field",
        adjacent: {'south': 34}
    }),
    36: newLocation({
        name: "Corn Field",
        adjacent: {'south': 33}
    }),
    37: newLocation({
        name: "Corn Field",
        adjacent: {'west': 33}
    }),
    38: newLocation({
        name: "Farmhouse",
        adjacent: {'west': 32}
    }),
    39: newLocation({
        name: "Barnyard",
        adjacent: {'north': 40, 'south': 32}
    }),
    40: newLocation({
        name: "Barn",
        adjacent: {'south': 39}
    }),
    41: newLocation({
        name: "Pasture",
        adjacent: {'north': 32, 'south': 42, 'west': 43}
    }),
    42: newLocation({
        name: "Pasture",
        adjacent: {'north': 41}
    }),
    43: newLocation({
        name: "Pasture",
        adjacent: {'east': 41}
    }),
    44: newLocation({
        name: "Entrance to the Forest of Thieves",
        adjacent: {'north': 46, 'south': 28},
        items: [items.sign()]
    }),
    45: newLocation({
        name: "Headquarters of the Ierdale Guard",
        adjacent: {'north': 321, 'east': 26}
    }),
    46: newLocation({
        name: "Path of Thieves",
        adjacent: {'north': 47, 'east': 53, 'south': 44, 'west': 86}
    }),
    47: newLocation({
        name: "Path of Thieves",
        adjacent: {'north': 48, 'east': 52, 'south': 46, 'west': 84}
    }),
    48: newLocation({
        name: "Path of Thieves",
        adjacent: {'north': 49, 'south': 47, 'west': 72}
    }),
    49: newLocation({
        name: "Path of Thieves",
        adjacent: {'north': 50, 'south': 48, 'west': 71}
    }),
    50: newLocation({
        name: "Path of Thieves",
        adjacent: {'north': 51, 'east': 65, 'south': 49}
    }),
    51: newLocation({
        name: "End of the Path",
        adjacent: {'east': 66, 'south': 50}
    }),
    52: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 58, 'east': 54, 'south': 53, 'west': 47}
    }),
    53: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 52, 'west': 46}
    }),
    54: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 59, 'east': 57, 'south': 55, 'west': 52}
    }),
    55: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 54, 'east': 56}
    }),
    56: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 57, 'west': 55}
    }),
    57: newLocation({
        name: "Forest of Thieves",
        adjacent: {'south': 56, 'west': 54}
    }),
    58: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 60, 'east': 59, 'south': 52}
    }),
    59: newLocation({
        name: "Forest of Thieves",
        adjacent: {'south': 54, 'west': 58}
    }),
    60: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 65, 'east': 61, 'south': 58}
    }),
    61: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 62, 'east': 64, 'west': 60}
    }),
    62: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 67, 'east': 63, 'south': 61, 'west': 65}
    }),
    63: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 85, 'west': 62}
    }),
    64: newLocation({
        name: "Forest of Thieves",
        adjacent: {'west': 61},
        items: [items.unknown(7)]
    }),
    65: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 66, 'east': 62, 'south': 60, 'west': 50}
    }),
    66: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 334, 'south': 65, 'west': 51}
    }),
    67: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 85, 'south': 62}
    }),
    68: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 75, 'east': 69, 'south': 79, 'west': 77}
    }),
    69: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 74, 'west': 68}
    }),
    70: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 71, 'south': 82}
    }),
    71: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 49, 'south': 72, 'west': 70}
    }),
    72: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 71, 'east': 48, 'south': 84, 'west': 82}
    }),
    73: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 83, 'south': 81}
    }),
    74: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 86, 'south': 69, 'west': 75}
    }),
    75: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 80, 'east': 74, 'south': 68, 'west': 76}
    }),
    76: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 81, 'east': 75, 'south': 77},
        items: [items.towering_tree]
    }),
    77: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 76, 'east': 68, 'south': 78}
    }),
    78: newLocation({
        name: "Hideout of Mythin the Forester",
        adjacent: {'north': 77, 'east': 79},
        items: [items.sign()]
    }),
    79: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 68, 'west': 78}
    }),
    80: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 83, 'south': 75, 'west': 81}
    }),
    81: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 73, 'east': 80, 'south': 76}
    }),
    82: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 70, 'east': 72, 'west': 83}
    }),
    83: newLocation({
        name: "Forest of Thieves",
        adjacent: {'east': 82, 'south': 80, 'west': 73}
    }),
    84: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 72, 'east': 47, 'south': 86}
    }),
    85: newLocation({
        name: "Forest of Thieves",
        adjacent: {'south': 63, 'west': 67}
    }),
    86: newLocation({
        name: "Forest of Thieves",
        adjacent: {'north': 84, 'east': 46, 'west': 74}
    }),
    87: newLocation({
        name: "Mythin's Office",
        adjacent: {'north': 8},
        items: [items.sign()]
    }),
    88: newLocation({
        name: "Oak Street",
        adjacent: {'north': 13, 'east': 25, 'south': 89, 'west': 134}
    }),
    89: newLocation({
        name: "Oak Street",
        adjacent: {'north': 88, 'east': 137, 'south': 90, 'west': 136}
    }),
    90: newLocation({
        name: "Oak Street - Dead End",
        adjacent: {'north': 89}
    }),
    91: newLocation({
        name: "House",
        adjacent: {'south': 7}
    }),
    92: newLocation({
        name: "Western Gatehouse",
        adjacent: {'east': 13, 'west': 94},
        items: [items.unknown(35)]
    }),
    93: newLocation({
        name: "Eastern Gatehouse",
        adjacent: {'east': 95, 'west': 10},
        items: [items.unknown(35)]
    }),
    94: newLocation({
        name: "West Road",
        adjacent: {'east': 92, 'west': 98}
    }),
    95: newLocation({
        name: "East Road",
        adjacent: {'east': 97, 'west': 93}
    }),
    96: newLocation({
        name: "East Road, Fork of Nod",
        adjacent: {'east': 283, 'south': 142, 'west': 97},
        items: [items.sign()]
    }),
    97: newLocation({
        name: "East Road",
        adjacent: {'east': 96, 'west': 95},
        items: [items.unknown(37)]
    }),
    98: newLocation({
        name: "West Road, Forks South",
        adjacent: {'east': 94, 'south': 99, 'west': 130}
    }),
    99: newLocation({
        name: "Path",
        adjacent: {'north': 98, 'south': 100},
        items: [items.sign()]
    }),
    100: newLocation({
        name: "Path",
        adjacent: {'north': 99, 'south': 101}
    }),
    101: newLocation({
        name: "Stony Bridge",
        adjacent: {'north': 100, 'south': 102}
    }),
    102: newLocation({
        name: "Stony Bridge",
        adjacent: {'north': 101, 'south': 103}
    }),
    103: newLocation({
        name: "Stony Bridge",
        adjacent: {'north': 102, 'south': 104}
    }),
    104: newLocation({
        name: "Path, Sloping Steeply",
        adjacent: {'north': 103, 'south': 105}
    }),
    105: newLocation({
        name: "Mountain Pass",
        adjacent: {'north': 104, 'east': 113, 'south': 106}
    }),
    106: newLocation({
        name: "Mountain Pass",
        adjacent: {'north': 105, 'south': 107, 'west': 110}
    }),
    107: newLocation({
        name: "Mountain Pass",
        adjacent: {'north': 106, 'east': 108}
    }),
    108: newLocation({
        name: "Lush Valley",
        adjacent: {'east': 109, 'west': 107}
    }),
    109: newLocation({
        name: "Eldin's Mountain Cottage",
        adjacent: {'west': 108},
        items: [items.sign()]
    }),
    110: newLocation({
        name: "Mountain Valley",
        adjacent: {'north': 115, 'east': 106, 'west': 111}
    }),
    111: newLocation({
        name: "Mountain Valley",
        adjacent: {'east': 110, 'south': 112}
    }),
    112: newLocation({
        name: "Mountain Valey",
        adjacent: {'north': 111}
    }),
    113: newLocation({
        name: "Mountain Valley",
        adjacent: {'south': 114, 'west': 105}
    }),
    114: newLocation({
        name: "Mountain Valley",
        adjacent: {'north': 113}
    }),
    115: newLocation({
        name: "Mountain Valley",
        adjacent: {'south': 110}
    }),
    116: newLocation({
        name: "Mucky Path",
        adjacent: {'south': 13, 'west': 117}
    }),
    117: newLocation({
        name: "Mucky Path",
        adjacent: {'east': 116, 'west': 118}
    }),
    118: newLocation({
        name: "Mucky Path, Trails off to Nothing",
        adjacent: {'north': 119, 'east': 117}
    }),
    119: newLocation({
        name: "Swamp",
        adjacent: {'north': 125, 'south': 118, 'west': 120}
    }),
    120: newLocation({
        name: "Swamp",
        adjacent: {'north': 124, 'east': 119, 'south': 121}
    }),
    121: newLocation({
        name: "Swamp",
        adjacent: {'north': 120}
    }),
    122: newLocation({
        name: "Swamp",
        adjacent: {'north': 123}
    }),
    123: newLocation({
        name: "Swamp",
        adjacent: {'north': 128, 'east': 124, 'south': 122, 'west': 126}
    }),
    124: newLocation({
        name: "Swamp",
        adjacent: {'north': 129, 'east': 125, 'south': 120, 'west': 123}
    }),
    125: newLocation({
        name: "Swamp",
        adjacent: {'south': 119, 'west': 124}
    }),
    126: newLocation({
        name: "Swamp",
        adjacent: {'north': 127, 'east': 123, 'west': 139}
    }),
    127: newLocation({
        name: "Swamp",
        adjacent: {'north': 140, 'east': 128, 'south': 126, 'west': 138}
    }),
    128: newLocation({
        name: "Swamp",
        adjacent: {'south': 123, 'west': 127}
    }),
    129: newLocation({
        name: "Swamp",
        adjacent: {'south': 124}
    }),
    130: newLocation({
        name: "West Road",
        adjacent: {'east': 98, 'west': 131}
    }),
    131: newLocation({
        name: "West Road",
        adjacent: {'east': 130, 'west': 323}
    }),
    132: newLocation({
        name: "Courthouse Lobby",
        adjacent: {'north': 9, 'south': 133},
        items: [items.sign()]
    }),
    133: newLocation({
        name: "Courtroom",
        adjacent: {'north': 132}
    }),
    134: newLocation({
        name: "House",
        adjacent: {'east': 88}
    }),
    135: newLocation({
        name: "Spritzer Hut",
        adjacent: {'south': 10}
    }),
    136: newLocation({
        name: "House",
        adjacent: {'east': 89}
    }),
    137: newLocation({
        name: "Alleyway",
        adjacent: {'east': 6, 'west': 89}
    }),
    138: newLocation({
        name: "Water's Edge",
        adjacent: {'north': 141, 'east': 127, 'south': 139}
    }),
    139: newLocation({
        name: "Water's Edge",
        adjacent: {'north': 138, 'east': 126}
    }),
    140: newLocation({
        name: "Water's Edge",
        adjacent: {'south': 127, 'west': 141}
    }),
    141: newLocation({
        name: "Water's Edge",
        adjacent: {'east': 140, 'south': 138}
    }),
    142: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 96, 'south': 143}
    }),
    143: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 142, 'south': 144}
    }),
    144: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 143, 'south': 145}
    }),
    145: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 144, 'south': 146}
    }),
    146: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 145, 'south': 147}
    }),
    147: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 146, 'south': 148}
    }),
    148: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 147, 'south': 149}
    }),
    149: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 148, 'south': 150}
    }),
    150: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 149, 'south': 151}
    }),
    151: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 150, 'south': 152}
    }),
    152: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 151, 'south': 153}
    }),
    153: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 152, 'south': 154}
    }),
    154: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 153, 'south': 155}
    }),
    155: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 154, 'south': 156}
    }),
    156: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 155, 'south': 157}
    }),
    157: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 156, 'south': 158}
    }),
    158: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 157, 'south': 159}
    }),
    159: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 158, 'south': 160}
    }),
    160: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 159, 'south': 161}
    }),
    161: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 160, 'south': 162, 'west': 202}
    }),
    162: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 161, 'south': 163, 'west': 203}
    }),
    163: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 162, 'south': 164, 'west': 204}
    }),
    164: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 163, 'south': 165}
    }),
    165: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 164, 'south': 166}
    }),
    166: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 165, 'south': 167}
    }),
    167: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 166, 'south': 168}
    }),
    168: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 167, 'south': 169}
    }),
    169: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 168, 'south': 170}
    }),
    170: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 169, 'south': 171}
    }),
    171: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 170, 'south': 172}
    }),
    172: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 171, 'south': 173}
    }),
    173: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 172, 'south': 174}
    }),
    174: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 173, 'south': 175}
    }),
    175: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 174, 'south': 176}
    }),
    176: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 175, 'south': 177}
    }),
    177: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 176, 'south': 178}
    }),
    178: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 177, 'south': 179}
    }),
    179: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 178, 'east': 220, 'south': 180}
    }),
    180: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 179, 'south': 181}
    }),
    181: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 180, 'south': 182}
    }),
    182: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 181, 'south': 183}
    }),
    183: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 182, 'south': 184}
    }),
    184: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 183, 'south': 185}
    }),
    185: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 184, 'south': 186}
    }),
    186: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 185, 'south': 187}
    }),
    187: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 186, 'south': 188}
    }),
    188: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 187, 'south': 189}
    }),
    189: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 188, 'south': 190}
    }),
    190: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 189, 'south': 191}
    }),
    191: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 190},
        items: [items.locked_gate]
    }),
    192: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 191, 'south': 193}
    }),
    193: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 192, 'south': 194}
    }),
    194: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 193, 'south': 195}
    }),
    195: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 194, 'south': 196}
    }),
    196: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 195, 'south': 197}
    }),
    197: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 196, 'east': 318, 'south': 198},
        items: [items.sign()]
    }),
    198: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 197, 'south': 199}
    }),
    199: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 198, 'south': 200}
    }),
    200: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 199, 'south': 201}
    }),
    201: newLocation({
        name: "Path of Nod",
        adjacent: {'north': 200, 'south': 250}
    }),
    202: newLocation({
        name: "Meadow",
        adjacent: {'east': 161, 'south': 203}
    }),
    203: newLocation({
        name: "Meadow",
        adjacent: {'north': 202, 'east': 162, 'south': 204, 'west': 206}
    }),
    204: newLocation({
        name: "Meadow",
        adjacent: {'north': 203, 'east': 163, 'west': 207}
    }),
    205: newLocation({
        name: "Meadow",
        adjacent: {'north': 210, 'east': 216}
    }),
    206: newLocation({
        name: "Meadow",
        adjacent: {'east': 203, 'south': 207, 'west': 209}
    }),
    207: newLocation({
        name: "Meadow",
        adjacent: {'north': 206, 'east': 204, 'south': 216, 'west': 210}
    }),
    208: newLocation({
        name: "Meadow",
        adjacent: {'north': 219, 'south': 209, 'west': 211}
    }),
    209: newLocation({
        name: "Meadow",
        adjacent: {'north': 208, 'east': 206, 'south': 210, 'west': 215}
    }),
    210: newLocation({
        name: "Meadow",
        adjacent: {'north': 209, 'east': 207, 'south': 205}
    }),
    211: newLocation({
        name: "Meadow",
        adjacent: {'north': 218, 'east': 208, 'south': 215, 'west': 222}
    }),
    212: newLocation({
        name: "Meadow",
        adjacent: {'east': 213, 'south': 221}
    }),
    213: newLocation({
        name: "Meadow",
        adjacent: {'south': 214, 'west': 212}
    }),
    214: newLocation({
        name: "Meadow",
        adjacent: {'north': 213, 'east': 224, 'west': 221}
    }),
    215: newLocation({
        name: "Meadow",
        adjacent: {'north': 211, 'east': 209}
    }),
    216: newLocation({
        name: "Meadow",
        adjacent: {'north': 207, 'west': 205}
    }),
    217: newLocation({
        name: "Meadow",
        adjacent: {'east': 218, 'south': 222}
    }),
    218: newLocation({
        name: "Meadow",
        adjacent: {'north': 221, 'east': 219, 'south': 211, 'west': 217}
    }),
    219: newLocation({
        name: "Meadow",
        adjacent: {'south': 208, 'west': 218}
    }),
    220: newLocation({
        name: "Bog",
        adjacent: {'east': 229, 'west': 179}
    }),
    221: newLocation({
        name: "Meadow",
        adjacent: {'north': 212, 'east': 214, 'south': 218}
    }),
    222: newLocation({
        name: "Meadow",
        adjacent: {'north': 217, 'east': 211}
    }),
    223: newLocation({
        name: "Boulder Field",
        adjacent: {'east': 228, 'south': 224}
    }),
    224: newLocation({
        name: "Boulder Field",
        adjacent: {'north': 223, 'east': 227, 'south': 225, 'west': 214}
    }),
    225: newLocation({
        name: "Boulder Field",
        adjacent: {'north': 224, 'east': 226, 'west': 383}
    }),
    226: newLocation({
        name: "Boulder Field",
        adjacent: {'north': 227, 'west': 225}
    }),
    227: newLocation({
        name: "Boulder Field",
        adjacent: {'north': 228, 'south': 226, 'west': 224}
    }),
    228: newLocation({
        name: "Boulder Field",
        adjacent: {'south': 227, 'west': 223}
    }),
    229: newLocation({
        name: "Bog",
        adjacent: {'east': 230, 'west': 220}
    }),
    230: newLocation({
        name: "Bog",
        adjacent: {'north': 244, 'east': 231, 'west': 229}
    }),
    231: newLocation({
        name: "Bog",
        adjacent: {'south': 235, 'west': 230}
    }),
    232: newLocation({
        name: "Bog",
        adjacent: {'north': 233, 'east': 249, 'west': 236}
    }),
    233: newLocation({
        name: "Bog",
        adjacent: {'south': 232}
    }),
    234: newLocation({
        name: "Bog",
        adjacent: {'east': 235, 'south': 247}
    }),
    235: newLocation({
        name: "Bog",
        adjacent: {'north': 231, 'east': 236, 'south': 246, 'west': 234}
    }),
    236: newLocation({
        name: "Bog",
        adjacent: {'east': 232, 'west': 235}
    }),
    237: newLocation({
        name: "Bog",
        adjacent: {'north': 239}
    }),
    238: newLocation({
        name: "Bog",
        adjacent: {'east': 239, 'south': 244, 'west': 245}
    }),
    239: newLocation({
        name: "Bog",
        adjacent: {'north': 240, 'east': 241, 'south': 237, 'west': 238}
    }),
    240: newLocation({
        name: "Bog",
        adjacent: {'south': 239}
    }),
    241: newLocation({
        name: "Bog",
        adjacent: {'east': 242, 'south': 243, 'west': 239}
    }),
    242: newLocation({
        name: "Bog",
        adjacent: {'west': 241}
    }),
    243: newLocation({
        name: "Bog",
        adjacent: {'north': 241}
    }),
    244: newLocation({
        name: "Bog",
        adjacent: {'north': 238, 'south': 230}
    }),
    245: newLocation({
        name: "Bog",
        adjacent: {'east': 238}
    }),
    246: newLocation({
        name: "Bog",
        adjacent: {'north': 235, 'west': 247}
    }),
    247: newLocation({
        name: "Bog",
        adjacent: {'north': 234, 'east': 246, 'south': 248}
    }),
    248: newLocation({
        name: "Bog",
        adjacent: {'north': 247}
    }),
    249: newLocation({
        name: "Bog",
        adjacent: {'west': 232}
    }),
    250: newLocation({
        name: "Corroded Gate",
        adjacent: {'north': 201, 'south': 262},
        items: [items.sign()]
    }),
    251: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 252, 'east': 262, 'west': 261}
    }),
    252: newLocation({
        name: "Dark Forest",
        adjacent: {'south': 251}
    }),
    253: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 271, 'south': 261}
    }),
    254: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 261, 'west': 260}
    }),
    255: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 261, 'east': 257, 'south': 258}
    }),
    256: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 262, 'east': 263, 'west': 257}
    }),
    257: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 256, 'west': 255}
    }),
    258: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 255, 'west': 259}
    }),
    259: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 258, 'south': 267, 'west': 277}
    }),
    260: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 254}
    }),
    261: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 253, 'east': 251, 'south': 255, 'west': 254}
    }),
    262: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 250, 'east': 268, 'south': 256, 'west': 251}
    }),
    263: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 268, 'south': 266, 'west': 256}
    }),
    264: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 266, 'east': 273, 'west': 265}
    }),
    265: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 264}
    }),
    266: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 263, 'east': 272, 'south': 264}
    }),
    267: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 259, 'east': 265, 'south': 270, 'west': 271}
    }),
    268: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 269, 'south': 263, 'west': 262}
    }),
    269: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 276, 'east': 270, 'west': 268}
    }),
    270: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 267, 'west': 269}
    }),
    271: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 267, 'south': 253}
    }),
    272: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 274, 'south': 273, 'west': 266}
    }),
    273: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 272, 'east': 275, 'west': 264}
    }),
    274: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 278, 'south': 275, 'west': 272}
    }),
    275: newLocation({
        name: "Dark Forest",
        adjacent: {'north': 274, 'west': 273}
    }),
    276: newLocation({
        name: "Dark Forest",
        adjacent: {'south': 269}
    }),
    277: newLocation({
        name: "Dark Forest",
        adjacent: {'east': 259}
    }),
    278: newLocation({
        name: "Dark Forest",
        adjacent: {'south': 274}
    }),
    279: newLocation({
        name: "House",
        adjacent: {'north': 7}
    }),
    280: newLocation({
        name: "House",
        adjacent: {'south': 11}
    }),
    281: newLocation({
        name: "Beet Street",
        adjacent: {'north': 308, 'east': 314}
    }),
    282: newLocation({
        name: "The Top of the Tree",
        adjacent: {}
    }),
    283: newLocation({
        name: "Gatehouse",
        adjacent: {'north': 286, 'east': 284, 'west': 96},
        items: [items.sign()]
    }),
    284: newLocation({
        name: "East Road",
        adjacent: {'west': 283}
    }),
    285: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 288, 'west': 286}
    }),
    286: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 287, 'east': 285, 'south': 283}
    }),
    287: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 289, 'east': 288, 'south': 286}
    }),
    288: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 290, 'east': 292, 'south': 285, 'west': 287}
    }),
    289: newLocation({
        name: "Sandy Desert",
        adjacent: {'east': 290, 'south': 287, 'west': 297}
    }),
    290: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 293, 'east': 291, 'south': 288, 'west': 289}
    }),
    291: newLocation({
        name: "Sandy Desert",
        adjacent: {'east': 296, 'south': 292, 'west': 290},
        items: [items.unknown(15)]
    }),
    292: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 291, 'east': 300, 'west': 288}
    }),
    293: newLocation({
        name: "Sandy Desert",
        adjacent: {'east': 294, 'south': 290}
    }),
    294: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 299, 'east': 295, 'west': 293}
    }),
    295: newLocation({
        name: "Sandy Desert",
        adjacent: {'south': 296, 'west': 294}
    }),
    296: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 295, 'east': 302, 'west': 291}
    }),
    297: newLocation({
        name: "Sandy Desert",
        adjacent: {'east': 289, 'south': 298}
    }),
    298: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 297}
    }),
    299: newLocation({
        name: "Sandy Desert",
        adjacent: {'south': 294}
    }),
    300: newLocation({
        name: "Sandy Desert",
        adjacent: {'east': 301, 'south': 304, 'west': 292}
    }),
    301: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 302, 'south': 303, 'west': 300}
    }),
    302: newLocation({
        name: "Sandy Desert",
        adjacent: {'south': 301, 'west': 296}
    }),
    303: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 301}
    }),
    304: newLocation({
        name: "Sandy Desert",
        adjacent: {'north': 300}
    }),
    305: newLocation({
        name: "Beet Street",
        adjacent: {'north': 10, 'east': 312, 'south': 306}
    }),
    306: newLocation({
        name: "Beet Street",
        adjacent: {'north': 305, 'east': 317, 'south': 307, 'west': 309}
    }),
    307: newLocation({
        name: "Beet Street",
        adjacent: {'north': 306, 'east': 313, 'south': 308}
    }),
    308: newLocation({
        name: "Beet Street",
        adjacent: {'north': 307, 'south': 281, 'west': 311}
    }),
    309: newLocation({
        name: "Music Store",
        adjacent: {'east': 306}
    }),
    310: newLocation({
        name: "Cleric Shop",
        adjacent: {'south': 311},
        items: [items.sign()]
    }),
    311: newLocation({
        name: "Eldfarl's Office",
        adjacent: {'north': 310, 'east': 308, 'south': 316},
        items: [items.sign()]
    }),
    312: newLocation({
        name: "Eldin's House",
        adjacent: {'west': 305}
    }),
    313: newLocation({
        name: "Archery Workshop",
        adjacent: {'west': 307},
        items: [items.sign()]
    }),
    314: newLocation({
        name: "Apothecary",
        adjacent: {'west': 281},
        items: [items.mixing_pot]
    }),
    315: newLocation({
        name: "The RIver",
        adjacent: {}
    }),
    316: newLocation({
        name: "Clerical Training Facilities",
        adjacent: {'north': 311},
        items: [items.sign()]
    }),
    317: newLocation({
        name: "House",
        adjacent: {'west': 306}
    }),
    318: newLocation({
        name: "Cobblestone Road",
        adjacent: {'east': 319, 'west': 197}
    }),
    319: newLocation({
        name: "Cobblestone Road",
        adjacent: {'east': 320, 'west': 318}
    }),
    320: newLocation({
        name: "Cobblestone Road",
        adjacent: {'east': 343, 'west': 319}
    }),
    321: newLocation({
        name: "Information Desk",
        adjacent: {'south': 45}
    }),
    322: newLocation({
        name: "Hermit Hut",
        adjacent: {'south': 328}
    }),
    323: newLocation({
        name: "Dry Grass",
        adjacent: {'east': 131, 'south': 324, 'west': 329}
    }),
    324: newLocation({
        name: "Dry Grass",
        adjacent: {'north': 323, 'west': 325}
    }),
    325: newLocation({
        name: "Dry Grass",
        adjacent: {'east': 324, 'south': 327, 'west': 328}
    }),
    326: newLocation({
        name: "Dry Grass",
        adjacent: {'west': 327}
    }),
    327: newLocation({
        name: "Dry Grass",
        adjacent: {'north': 325, 'east': 326}
    }),
    328: newLocation({
        name: "Dry Grass",
        adjacent: {'north': 322, 'east': 325}
    }),
    329: newLocation({
        name: "Dry Grass",
        adjacent: {'north': 330, 'east': 323}
    }),
    330: newLocation({
        name: "Dry Grass",
        adjacent: {'south': 329}
    }),
    331: newLocation({
        name: "Ierdale Barracks",
        adjacent: {'east': 332, 'west': 26}
    }),
    332: newLocation({
        name: "Ierdale Barracks",
        adjacent: {'west': 331}
    }),
    333: newLocation({
        name: "Book Store",
        adjacent: {'east': 4},
        items: [items.sign()]
    }),
    334: newLocation({
        name: "Hidden Track",
        adjacent: {'east': 335, 'west': 66}
    }),
    335: newLocation({
        name: "Hidden Track",
        adjacent: {'east': 336, 'west': 334}
    }),
    336: newLocation({
        name: "Hidden Track",
        adjacent: {'east': 337, 'west': 335}
    }),
    337: newLocation({
        name: "Path",
        adjacent: {'south': 338, 'west': 336}
    }),
    338: newLocation({
        name: "Path",
        adjacent: {'north': 337, 'south': 339}
    }),
    339: newLocation({
        name: "Path",
        adjacent: {'north': 338, 'south': 340}
    }),
    340: newLocation({
        name: "Path",
        adjacent: {'north': 339, 'south': 341}
    }),
    341: newLocation({
        name: "Path",
        adjacent: {'north': 340, 'south': 342}
    }),
    342: newLocation({
        name: "Path",
        adjacent: {'north': 341, 'south': 142}
    }),
    343: newLocation({
        name: "Grobin Gates",
        adjacent: {'east': 344, 'west': 320}
    }),
    344: newLocation({
        name: "Grobin Square",
        adjacent: {'north': 355, 'east': 345, 'south': 350, 'west': 343},
        items: [items.sign()]
    }),
    345: newLocation({
        name: "Main Street",
        adjacent: {'north': 373, 'east': 346, 'west': 344}
    }),
    346: newLocation({
        name: "Main Street",
        adjacent: {'north': 372, 'east': 347, 'west': 345}
    }),
    347: newLocation({
        name: "Main Street",
        adjacent: {'east': 348, 'south': 374, 'west': 346}
    }),
    348: newLocation({
        name: "Main Street",
        adjacent: {'north': 349, 'west': 347}
    }),
    349: newLocation({
        name: "Main Street",
        adjacent: {'north': 360, 'east': 377, 'south': 348, 'west': 376}
    }),
    350: newLocation({
        name: "Blobin Street",
        adjacent: {'north': 344, 'east': 362, 'south': 351, 'west': 367}
    }),
    351: newLocation({
        name: "Blobin Street",
        adjacent: {'north': 350, 'east': 368, 'south': 352}
    }),
    352: newLocation({
        name: "Blobin Street",
        adjacent: {'north': 351, 'west': 353}
    }),
    353: newLocation({
        name: "Blobin Street",
        adjacent: {'north': 369, 'east': 352, 'west': 354}
    }),
    354: newLocation({
        name: "End of Blobin Street",
        adjacent: {'north': 370, 'east': 353, 'south': 371}
    }),
    355: newLocation({
        name: "Grogren Street",
        adjacent: {'north': 356, 'south': 344}
    }),
    356: newLocation({
        name: "Grogren Street",
        adjacent: {'north': 357, 'south': 355, 'west': 380}
    }),
    357: newLocation({
        name: "Grogren Street",
        adjacent: {'east': 358, 'south': 356}
    }),
    358: newLocation({
        name: "Grogren Street",
        adjacent: {'north': 379, 'east': 359, 'west': 357}
    }),
    359: newLocation({
        name: "End of Grogren Street",
        adjacent: {'south': 381, 'west': 358}
    }),
    360: newLocation({
        name: "Main Street - Barracks East",
        adjacent: {'east': 361, 'south': 349, 'west': 375}
    }),
    361: newLocation({
        name: "Barracks Gate",
        adjacent: {'east': 363, 'west': 360}
    }),
    362: newLocation({
        name: "Doo-Dad Shop",
        adjacent: {'west': 350}
    }),
    363: newLocation({
        name: "Orcish Stronghold",
        adjacent: {'north': 365, 'east': 366, 'south': 364, 'west': 361}
    }),
    364: newLocation({
        name: "Barracks",
        adjacent: {'north': 363}
    }),
    365: newLocation({
        name: "Barracks",
        adjacent: {'south': 363}
    }),
    366: newLocation({
        name: "Barracks",
        adjacent: {'west': 363}
    }),
    367: newLocation({
        name: "Gerard's General Store",
        adjacent: {'east': 350}
    }),
    368: newLocation({
        name: "Peon House",
        adjacent: {'west': 351}
    }),
    369: newLocation({
        name: "Peon House",
        adjacent: {'south': 353}
    }),
    370: newLocation({
        name: "Orckish Armory",
        adjacent: {'south': 354},
        items: [items.sign()]
    }),
    371: newLocation({
        name: "House",
        adjacent: {'north': 354}
    }),
    372: newLocation({
        name: "Peon House",
        adjacent: {'south': 346}
    }),
    373: newLocation({
        name: "Orc House",
        adjacent: {'south': 345}
    }),
    374: newLocation({
        name: "Orc House",
        adjacent: {'north': 347, 'east': 378}
    }),
    375: newLocation({
        name: "Peon House",
        adjacent: {'east': 360}
    }),
    376: newLocation({
        name: "Peon House",
        adjacent: {'east': 349}
    }),
    377: newLocation({
        name: "Peon House",
        adjacent: {'west': 349}
    }),
    378: newLocation({
        name: "Drawing Room",
        adjacent: {'west': 374}
    }),
    379: newLocation({
        name: "House",
        adjacent: {'south': 358}
    }),
    380: newLocation({
        name: "Peon House",
        adjacent: {'east': 356}
    }),
    381: newLocation({
        name: "Prokon's Pet Store",
        adjacent: {'north': 359},
        items: [items.sign()]
    }),
    382: newLocation({
        name: "Cave",
        adjacent: {'north': 399, 'east': 394, 'south': 385}
    }),
    383: newLocation({
        name: "Cave Entrance",
        adjacent: {'east': 225, 'west': 384}
    }),
    384: newLocation({
        name: "Cave",
        adjacent: {'north': 394, 'east': 383, 'south': 390}
    }),
    385: newLocation({
        name: "Cave",
        adjacent: {'north': 382, 'south': 386, 'west': 389}
    }),
    386: newLocation({
        name: "Cave",
        adjacent: {'north': 385, 'east': 390}
    }),
    387: newLocation({
        name: "Cave",
        adjacent: {'north': 389}
    }),
    388: newLocation({
        name: "Cave",
        adjacent: {'north': 392}
    }),
    389: newLocation({
        name: "Cave",
        adjacent: {'east': 385, 'south': 387, 'west': 392}
    }),
    390: newLocation({
        name: "Cave",
        adjacent: {'north': 384, 'west': 386}
    }),
    391: newLocation({
        name: "Cave",
        adjacent: {'west': 393}
    }),
    392: newLocation({
        name: "Cave",
        adjacent: {'north': 393, 'east': 389, 'south': 388}
    }),
    393: newLocation({
        name: "Cave",
        adjacent: {'east': 391, 'south': 392}
    }),
    394: newLocation({
        name: "Cave",
        adjacent: {'north': 395, 'south': 384, 'west': 382}
    }),
    395: newLocation({
        name: "Cave",
        adjacent: {'north': 396, 'south': 394}
    }),
    396: newLocation({
        name: "Cave",
        adjacent: {'south': 395, 'west': 397}
    }),
    397: newLocation({
        name: "Cave",
        adjacent: {'east': 396, 'south': 399, 'west': 398}
    }),
    398: newLocation({
        name: "Cave",
        adjacent: {'east': 397, 'south': 400}
    }),
    399: newLocation({
        name: "Cave",
        adjacent: {'north': 397, 'south': 382}
    }),
    400: newLocation({
        name: "Cave",
        adjacent: {'north': 398}
    })
}

export { gameMap}