const g4PokemonData = {
    "Turtwig": {
        species: { value: "Turtwig" },
        type1: { value: "Grass" },
        type2: { value: "Grass" },
        stats: {
            maxHp: 55,
            attack: 68,
            defense: 64,
            special: 45,
            speed: 31,
            specialAttack: 45,
            specialDefense: 55,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [5, "Withdraw"],
            [9, "Absorb"],
            [13, "Razor Leaf"],
            [17, "Curse"],
            [21, "Bite"],
            [25, "Mega Drain"],
            [29, "Leech Seed"],
            [33, "Synthesis"],
            [37, "Crunch"],
            [41, "Giga Drain"],
            [45, "Leaf Storm" ]
        ],
        "tm_hm_learnset": [
            "Toxic", "Bullet Seed", "Hidden Power", "Sunny Day",
            "Light Screen", "Protect", "Giga Drain", "Safeguard",
            "Frustration", "SolarBeam", "Iron Tail", "Return",
            "Double Team", "Reflect", "Facade", "Secret Power",
            "Rest", "Attract", "Energy Ball", "Endure",
            "Flash", "Swords Dance", "Stealth Rock", "Captivate",
            "Sleep Talk", "Natural Gift", "Grass Knot", "Swagger",
            "Substitute", "Cut", "Strength", "Rock Smash",
            "Rock Climb"
        ],
    },

    "Grotle": {
        species: { value: "Grotle" },
        type1: { value: "Grass" },
        type2: { value: "Grass" },
        stats: {
            maxHp: 75,
            attack: 89,
            defense: 85,
            special: 55,
            speed: 36,
            specialAttack: 55,
            specialDefense: 65,
        },
        "levelup_moveset": [
            // Note: Grotle inherits Turtwig's moveset and adds to it as it levels up.
            [1, "Tackle"],
            [5, "Withdraw"],
            [9, "Absorb"],
            [13, "Razor Leaf"],
            [17, "Curse"],
            [22, "Bite"],
            [27, "Mega Drain"],
            [32, "Earthquake"],
            [37, "Leech Seed"],
            [42, "Synthesis"],
            [47, "Crunch"],
            [52, "Giga Drain"],
            [57, "Leaf Storm"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Bullet Seed", "Hidden Power", "Sunny Day", "Light Screen", 
            "Protect", "Safeguard", "Frustration", "SolarBeam", "Earthquake", "Return", 
            "Dig", "Double Team", "Reflect", "Rock Tomb", "Facade", "Rest", "Attract", 
            "Energy Ball", "Flash", "Swords Dance", "Rock Slide", "Grass Knot", "Swagger", 
            "Substitute", "Cut", "Strength", "Rock Smash"
        ]
    },

    "Torterra": {
        species: { value: "Torterra" },
        type1: { value: "Grass" },
        type2: { value: "Ground" },
        stats: {
            maxHp: 95,
            attack: 109,
            defense: 105,
            special: 75,
            speed: 56,
            specialAttack: 75,
            specialDefense: 85,
        },
        "levelup_moveset": [
            // Note: Torterra continues to inherit and adds further moves.
            [1, "Tackle"],
            [5, "Withdraw"],
            [9, "Absorb"],
            [13, "Razor Leaf"],
            [17, "Curse"],
            [22, "Bite"],
            [27, "Mega Drain"],
            [32, "Earthquake"],
            [33, "Wood Hammer"],
            [39, "Leech Seed"],
            [45, "Synthesis"],
            [51, "Crunch"],
            [57, "Giga Drain"],
            [63, "Leaf Storm"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hail", "Bullet Seed", "Hidden Power", "Sunny Day", "Hyper Beam", 
            "Light Screen", "Protect", "Safeguard", "Frustration", "SolarBeam", "Earthquake", 
            "Return", "Dig", "Double Team", "Reflect", "Sandstorm", "Rock Tomb", "Facade", 
            "Rest", "Attract", "Round", "Energy Ball", "False Swipe", "Fling", "Charge Beam", 
            "Sky Drop", "Giga Impact", "Stone Edge", "Gyro Ball", "Bulldoze", "Rock Slide", 
            "Grass Knot", "Swagger", "Substitute", "Cut", "Strength", "Rock Smash", "Rock Climb"
        ]
    },

    "Piplup": {
        species: { value: "Piplup" },
        type1: { value: "Water" },
        type2: { value: "Water" },
        stats: {
            maxHp: 53,
            attack: 51,
            defense: 53,
            special: 61,
            speed: 40,
            specialAttack: 61,
            specialDefense: 56,
        },
        "levelup_moveset": [
            [1, "Pound"],
            [4, "Growl"],
            [8, "Bubble"],
            [11, "Water Sport"],
            [15, "Peck"],
            [18, "BubbleBeam"],
            [22, "Bide"],
            [25, "Fury Attack"],
            [29, "Brine"],
            [32, "Whirlpool"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Ice Beam", "Blizzard", "Protect", "Rain Dance", 
            "Frustration", "Return", "Brick Break", "Double Team", "Aerial Ace", 
            "Facade", "Rest", "Attract", "Round", "Scald", "Swagger", "Substitute", 
            "Cut", "Surf", "Waterfall", "Dive"
        ]
    },
    
    "Prinplup": {
        species: { value: "Prinplup" },
        type1: { value: "Water" },
        type2: { value: "Water" },
        stats: {
            maxHp: 64,
            attack: 66,
            defense: 68,
            special: 81,
            speed: 50,
            specialAttack: 81,
            specialDefense: 76,
        },
        "levelup_moveset": [
            [1, "Pound"],
            [4, "Growl"],
            [8, "Bubble"],
            [11, "Water Sport"],
            [15, "Peck"],
            [19, "BubbleBeam"],
            [24, "Bide"],
            [28, "Fury Attack"],
            [33, "Brine"],
            [37, "Whirlpool"],
            [42, "Mist"],
            [46, "Drill Peck"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Ice Beam", "Blizzard", "Protect", "Rain Dance", 
            "Frustration", "Return", "Brick Break", "Double Team", "Aerial Ace", 
            "Facade", "Rest", "Attract", "Round", "Scald", "Swagger", "Substitute", 
            "Cut", "Surf", "Waterfall", "Dive"
        ]
    },
    
    "Empoleon": {
        species: { value: "Empoleon" },
        type1: { value: "Water" },
        type2: { value: "Steel" },
        stats: {
            maxHp: 84,
            attack: 86,
            defense: 88,
            special: 111,
            speed: 60,
            specialAttack: 111,
            specialDefense: 101,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [4, "Growl"],
            [8, "Bubble"],
            [11, "Swords Dance"],
            [15, "Peck"],
            [16, "Metal Claw"],
            [19, "BubbleBeam"],
            [24, "Swagger"],
            [28, "Fury Attack"],
            [33, "Brine"],
            [36, "Aqua Jet"],
            [39, "Whirlpool"],
            [46, "Mist"],
            [52, "Drill Peck"],
            [59, "Hydro Pump"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hail", "Hidden Power", "Ice Beam", "Blizzard", "Hyper Beam", "Protect", 
            "Rain Dance", "Roar", "Frustration", "Earthquake", "Return", "Dig", "Brick Break", 
            "Double Team", "Aerial Ace", "Facade", "Rest", "Attract", "Thief", "Round", 
            "Echoed Voice", "Scald", "Fling", "Charge Beam", "Giga Impact", "Flash Cannon", 
            "Swagger", "Substitute", "Cut", "Surf", "Waterfall", "Dive", "Strength", "Rock Climb"
        ]
    },

    "Chimchar": {
        species: { value: "Chimchar" },
        type1: { value: "Fire" },
        type2: { value: "Fire" },
        stats: {
            maxHp: 44,
            attack: 58,
            defense: 44,
            special: 58,
            speed: 61,
            specialAttack: 58,
            specialDefense: 44,
        },
        "levelup_moveset": [
            [1, "Scratch"],
            [1, "Leer"],
            [7, "Ember"],
            [9, "Taunt"],
            [15, "Fury Swipes"],
            [17, "Flame Wheel"],
            [23, "Nasty Plot"],
            [25, "Torment"],
            [31, "Facade"],
            [33, "Fire Spin"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Sunny Day", "Protect", "Frustration", 
            "SolarBeam", "Return", "Dig", "Brick Break", "Double Team", "Flamethrower", 
            "Fire Blast", "Aerial Ace", "Torment", "Facade", "Rest", "Attract", 
            "Low Sweep", "Round", "Overheat", "Acrobatics", "Grass Knot", "Swagger", 
            "Substitute", "Cut", "Strength", "Rock Smash"
        ]
    },
    
    "Monferno": {
        species: { value: "Monferno" },
        type1: { value: "Fire" },
        type2: { value: "Fighting" },
        stats: {
            maxHp: 64,
            attack: 78,
            defense: 52,
            special: 78,
            speed: 81,
            specialAttack: 78,
            specialDefense: 52,
        },
        "levelup_moveset": [
            [1, "Scratch"],
            [1, "Leer"],
            [7, "Ember"],
            [9, "Taunt"],
            [14, "Mach Punch"],
            [16, "Fury Swipes"],
            [19, "Flame Wheel"],
            [26, "Feint"],
            [29, "Torment"],
            [36, "Close Combat"],
            [39, "Fire Spin"],
            [46, "Acrobatics"],
            [49, "Slack Off"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Sunny Day", "Protect", "Frustration", 
            "SolarBeam", "Smack Down", "Return", "Dig", "Brick Break", "Double Team", 
            "Flamethrower", "Fire Blast", "Aerial Ace", "Torment", "Facade", 
            "Rest", "Attract", "Low Sweep", "Round", "Overheat", "Acrobatics", 
            "Grass Knot", "Swagger", "Substitute", "Cut", "Strength", "Rock Smash"
        ]
    },
    
    "Infernape": {
        species: { value: "Infernape" },
        type1: { value: "Fire" },
        type2: { value: "Fighting" },
        stats: {
            maxHp: 76,
            attack: 104,
            defense: 71,
            special: 104,
            speed: 108,
            specialAttack: 104,
            specialDefense: 71,
        },
        "levelup_moveset": [
            [1, "Scratch"],
            [1, "Leer"],
            [1, "Flare Blitz"],
            [7, "Ember"],
            [9, "Taunt"],
            [14, "Mach Punch"],
            [17, "Fury Swipes"],
            [21, "Flame Wheel"],
            [28, "Feint"],
            [33, "Punishment"],
            [41, "Close Combat"],
            [49, "Fire Spin"],
            [59, "Acrobatics"],
            [68, "Calm Mind"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Sunny Day", "Hyper Beam", "Protect", "Frustration", 
            "SolarBeam", "Earthquake", "Return", "Dig", "Brick Break", "Double Team", 
            "Flamethrower", "Fire Blast", "Aerial Ace", "Torment", "Facade", "Flame Charge", 
            "Rest", "Attract", "Low Sweep", "Round", "Focus Blast", "Fling", "Incinerate", 
            "Will-O-Wisp", "Acrobatics", "Shadow Claw", "Giga Impact", "Rock Slide", 
            "Grass Knot", "Swagger", "Substitute", "Cut", "Strength", "Rock Smash"
        ]
    },

    "Starly": {
        species: { value: "Starly" },
        type1: { value: "Normal" },
        type2: { value: "Flying" },
        stats: {
            maxHp: 40,
            attack: 55,
            defense: 30,
            special: 30,
            speed: 60,
            specialAttack: 30,
            specialDefense: 30,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [1, "Growl"],
            [5, "Quick Attack"],
            [9, "Wing Attack"],
            [13, "Double Team"],
            [17, "Endeavor"],
            [21, "Whirlwind"],
            [25, "Aerial Ace"],
            [29, "Take Down"],
            [33, "Agility"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Protect", "Frustration", "Return", 
            "Double Team", "Aerial Ace", "Facade", "Rest", "Attract", 
            "Steel Wing", "Endure", "Swagger", "Substitute", "Pluck", 
            "Fly"
        ]
    },
    
    "Staravia": {
        species: { value: "Staravia" },
        type1: { value: "Normal" },
        type2: { value: "Flying" },
        stats: {
            maxHp: 55,
            attack: 75,
            defense: 50,
            special: 40,
            speed: 80,
            specialAttack: 40,
            specialDefense: 40,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [1, "Growl"],
            [1, "Quick Attack"],
            [5, "Quick Attack"],
            [9, "Wing Attack"],
            [13, "Double Team"],
            [18, "Endeavor"],
            [23, "Whirlwind"],
            [28, "Aerial Ace"],
            [33, "Take Down"],
            [38, "Agility"],
            [43, "Brave Bird"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Protect", "Rain Dance", "Frustration", 
            "Return", "Double Team", "Aerial Ace", "Facade", "Rest", "Attract", 
            "Steel Wing", "Endure", "Swagger", "Substitute", "Pluck", "U-turn",
            "Fly"
        ]
    },
    
    "Staraptor": {
        species: { value: "Staraptor" },
        type1: { value: "Normal" },
        type2: { value: "Flying" },
        stats: {
            maxHp: 85,
            attack: 120,
            defense: 70,
            special: 50,
            speed: 100,
            specialAttack: 50,
            specialDefense: 60,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [1, "Growl"],
            [1, "Quick Attack"],
            [1, "Wing Attack"],
            [5, "Quick Attack"],
            [9, "Wing Attack"],
            [13, "Double Team"],
            [18, "Endeavor"],
            [23, "Whirlwind"],
            [28, "Aerial Ace"],
            [34, "Take Down"],
            [41, "Agility"],
            [49, "Brave Bird"],
            [57, "Close Combat"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Hyper Beam", "Protect", "Rain Dance", "Frustration", 
            "Return", "Double Team", "Aerial Ace", "Facade", "Rest", "Attract", 
            "Steel Wing", "Giga Impact", "Endure", "Swagger", "Substitute", "Pluck", 
            "U-turn", "Fly"
        ]
    },

    "Shinx": {
        species: { value: "Shinx" },
        type1: { value: "Electric" },
        type2: { value: "Electric" },
        stats: {
            maxHp: 45,
            attack: 65,
            defense: 34,
            special: 40,
            speed: 45,
            specialAttack: 40,
            specialDefense: 34,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [5, "Leer"],
            [9, "Charge"],
            [13, "Spark"],
            [17, "Bite"],
            [21, "Roar"],
            [25, "Swagger"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Light Screen", "Protect", "Thunderbolt", 
            "Thunder", "Return", "Double Team", "Facade", "Rest", "Attract", 
            "Charge Beam", "Thunder Wave", "Swagger", "Substitute", "Flash", 
            "Shock Wave"
        ]
    },
    
    "Luxio": {
        species: { value: "Luxio" },
        type1: { value: "Electric" },
        type2: { value: "Electric" },
        stats: {
            maxHp: 60,
            attack: 85,
            defense: 49,
            special: 60,
            speed: 60,
            specialAttack: 60,
            specialDefense: 49,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [1, "Leer"],
            [5, "Leer"],
            [9, "Charge"],
            [13, "Spark"],
            [18, "Bite"],
            [23, "Roar"],
            [28, "Swagger"],
            [35, "Thunder Fang"],
            [42, "Crunch"],
            [49, "Scary Face"],
            [56, "Discharge"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Light Screen", "Protect", "Rain Dance", 
            "Thunderbolt", "Thunder", "Return", "Double Team", "Facade", "Rest", 
            "Attract", "Charge Beam", "Thunder Wave", "Swagger", "Substitute", 
            "Flash", "Shock Wave"
        ]
    },
    
    "Luxray": {
        species: { value: "Luxray" },
        type1: { value: "Electric" },
        type2: { value: "Electric" },
        stats: {
            maxHp: 80,
            attack: 120,
            defense: 79,
            special: 95,
            speed: 70,
            specialAttack: 95,
            specialDefense: 79,
        },
        "levelup_moveset": [
            [1, "Tackle"],
            [1, "Leer"],
            [1, "Charge"],
            [5, "Leer"],
            [9, "Charge"],
            [13, "Spark"],
            [18, "Bite"],
            [23, "Roar"],
            [28, "Swagger"],
            [35, "Thunder Fang"],
            [42, "Crunch"],
            [49, "Scary Face"],
            [56, "Discharge"],
            [63, "Wild Charge"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Hyper Beam", "Light Screen", "Protect", 
            "Rain Dance", "Thunderbolt", "Thunder", "Return", "Double Team", 
            "Facade", "Rest", "Attract", "Charge Beam", "Giga Impact", 
            "Thunder Wave", "Swagger", "Substitute", "Flash", "Shock Wave"
        ]
    },

    "Darkrai": {
        species: { value: "Darkrai" },
        type1: { value: "Dark" },
        type2: { value: "Dark" },
        stats: {
            maxHp: 70,
            attack: 90,
            defense: 90,
            special: 135,
            speed: 125,
            specialAttack: 135,
            specialDefense: 90,
        },
        "levelup_moveset": [
            [1, "Ominous Wind"],
            [1, "Disable"],
            [11, "Quick Attack"],
            [20, "Hypnosis"],
            [29, "Faint Attack"],
            [38, "Nightmare"],
            [47, "Double Team"],
            [57, "Haze"],
            [66, "Dark Void"],
            [75, "Nasty Plot"],
            [84, "Dream Eater"],
            [93, "Dark Pulse"]
        ],
        "tm_hm_learnset": [
            "Toxic", "Hidden Power", "Taunt", "Hyper Beam", "Protect", "Rain Dance", 
            "Frustration", "Return", "Psychic", "Shadow Ball", "Double Team", 
            "Reflect", "Rock Tomb", "Facade", "Rest", "Thief", "Attract", "Focus Blast", 
            "Fling", "Embargo", "Payback", "Thunder Wave", "Dream Eater", "Swagger", 
            "Substitute", "Trick Room", "Snarl"
        ]
    },
}