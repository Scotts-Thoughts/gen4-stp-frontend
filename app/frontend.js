const MyStorage = new Proxy({}, {
    set: (_, prop, value) => {
        if (value === undefined || value === null)
            localStorage.removeItem(prop);
        else
            localStorage.setItem(prop, JSON.stringify(value));
    },
    get: (_, prop) => {
        if (prop === "clear")
            return () => localStorage.clear();
        if (prop === "entries")
            return () => Object.entries(localStorage);
        if (prop === "keys")
            return () => Object.keys(localStorage);
        if (prop === "has")
            return (key) => localStorage.getItem(key) == null;
        return JSON.parse(localStorage.getItem(prop));
    }
});

async function loadCsvFile() {
    const file = await window.showOpenFilePicker({
        id: "SplitsFolder",
        types: [{
            description: "Split files",
            accept: { "text/csv": [".csv"] }
        }]
    });
    const contents = await file[0].getFile();
    const text = await contents.text();
    return text;
}

// Open the folder ./splits/ in the file explorer with node.js
function openFolder(folderName) {
    require('child_process').exec(`start .\\${folderName}\\`);
}

const Keys = {
    "ESCAPE":         0x1B,
    "BACKSPACE":      0x08,
    "TAB":            0x09,
    
    "LEFT":           0x25,
    "UP":             0x26,
    "RIGHT":          0x27,
    "DOWN":           0x28,
    
    "CAPS_LOCK":      0x14,
    "NUM_LOCK":       0x90,
    "SCROLL_LOCK":    0x91,
    
    "SHIFT":          0x10,
    "L_SHIFT":        0xA0,
    "R_SHIFT":        0xA1,

    "CTRL":           0x11,
    "L_CTRL":         0xA2,
    "R_CTRL":         0xA3,
    
    "ALT":            0x12,
    "L_ALT":          0xA4,
    "R_ALT":          0xA5,
    
    "L_WIN":          0x5B,
    "R_WIN":          0x5C,

    "0":              0x30,
    "1":              0x31,
    "2":              0x32,
    "3":              0x33,
    "4":              0x34,
    "5":              0x35,
    "6":              0x36,
    "7":              0x37,
    "8":              0x38,
    "9":              0x39,

    "A":              0x41,
    "B":              0x42,
    "C":              0x43,
    "D":              0x44,
    "E":              0x45,
    "F":              0x46,
    "G":              0x47,
    "H":              0x48,
    "I":              0x49,
    "J":              0x4A,
    "K":              0x4B,
    "L":              0x4C,
    "M":              0x4D,
    "N":              0x4E,
    "O":              0x4F,
    "P":              0x50,
    "Q":              0x51,
    "R":              0x52,
    "S":              0x53,
    "T":              0x54,
    "U":              0x55,
    "V":              0x56,
    "W":              0x57,
    "X":              0x58,
    "Y":              0x59,
    "Z":              0x5A,

    "NUMPAD0":        0x60,
    "NUMPAD1":        0x61,
    "NUMPAD2":        0x62,
    "NUMPAD3":        0x63,
    "NUMPAD4":        0x64,
    "NUMPAD5":        0x65,
    "NUMPAD6":        0x66,
    "NUMPAD7":        0x67,
    "NUMPAD8":        0x68,
    "NUMPAD9":        0x69,
    "SEPARATOR":      0x6C,
    "DECIMAL":        0x6E,

    "MULTIPLY":       0x6A,
    "ADD":            0x6B,
    "SUBTRACT":       0x6D,
    "DIVIDE":         0x6F,
    
    "F1":             0x70,
    "F2":             0x71,
    "F3":             0x72,
    "F4":             0x73,
    "F5":             0x74,
    "F6":             0x75,
    "F7":             0x76,
    "F8":             0x77,
    "F9":             0x78,
    "F10":            0x79,
    "F11":            0x7A,
    "F12":            0x7B,
    "F13":            0x7C,
    "F14":            0x7D,
    "F15":            0x7E,
    "F16":            0x7F,
    "F17":            0x80,
    "F18":            0x81,
    "F19":            0x82,
    "F20":            0x83,
    "F21":            0x84,
    "F22":            0x85,
    "F23":            0x86,
    "F24":            0x87,


    "APPS":           0x5D,
    "CLEAR":          0x0C,
    "RETURN":         0x0D,
    "PAUSE":          0x13,

    "CONVERT":        0x1C,
    "NONCONVERT":     0x1D,
    "ACCEPT":         0x1E,
    "MODECHANGE":     0x1F,

    "SPACE":          0x20,
    "PRIOR":          0x21,
    "NEXT":           0x22,
    "END":            0x23,
    "HOME":           0x24,
    "SELECT":         0x29,
    "PRINT":          0x2A,
    "EXECUTE":        0x2B,
    "SNAPSHOT":       0x2C,
    "INSERT":         0x2D,
    "DELETE":         0x2E,
    "HELP":           0x2F,
    "SLEEP":          0x5F,
}

Object.entries(Keys).forEach(([k, v]) => Keys[v] = k);

class KeyHook {
    constructor() {
        // start the keyboard hook
        this.process = require("child_process").spawn("keyhook.exe");

        // general logging
        // this.process.on("spawn", () => console.log("Keyboard hook started!"));
        this.process.stderr.on("data", (data) => console.error(`${data}`));
        
        // handle output of the keyboard hook
        this.process.stdout.on("data", (data) => {
            for (const line of data.toString().split(/[\n\r]+/)) {
                const parts = line.split(",").map(x => parseInt(x, 10));
                const [down, key, time] = parts;
                
                if (parts.length !== 3 || parts.some(isNaN)) continue;
                this._processKey(down === 1, key, time);
            }
        });  
    
        // general initialization
        for (let i=0; i<256; i++)
            this._keyState[i] = false;
    }
        
    _listeners = {};
    _keyState = [];
    _processKey(down, keyCode, time) {
        const oldState = this._keyState[keyCode] == true;
        this._keyState[keyCode] = down;
        const key = Keys[keyCode];
        let type = "unknown";

        if (oldState && down)
            type = "repeat";
        else if (down)
            type = "down";
        else
            type = "up";

        if (!this._listeners[type]) return;
        for (const listener of this._listeners[type]) {
            listener({
                type, 
                keyCode, 
                key, 
                alt: this.isAltDown,
                ctrl: this.isCtrlDown,
                shift: this.isShiftDown,
                time,
            });
        }
    }
  
    get isShiftDown() { return this._keyState[Keys.L_SHIFT] || this._keyState[Keys.R_SHIFT] || this._keyState[Keys.SHIFT]; }
    get isCtrlDown()  { return this._keyState[Keys.L_CTRL]  || this._keyState[Keys.R_CTRL]  || this._keyState[Keys.CTRL]; }
    get isAltDown()   { return this._keyState[Keys.L_ALT]   || this._keyState[Keys.R_ALT]   || this._keyState[Keys.ALT]; }

    isKeyDown(key) { 
        if (typeof key === 'string') key = Keys[key.toUpperCase()];
        return this._keyState[key];
    }
    
    on(event, callback) {
        if (this._listeners[event] === undefined)
            this._listeners[event] = [];
        this._listeners[event].push(callback);
    }

    registerShortCut(shortCut, callback) {
        // transform the shortcut into an array of key codes
        if (typeof shortCut === 'number')
            shortCut = [shortCut];
        if (typeof shortCut === 'string')
            shortCut = shortCut.toUpperCase().split("+").map(x => Keys[x.trim()]);
            shortCut = shortCut.map(x => {
            if (typeof x === 'string') x = Keys[x.toUpperCase()];
            if (x === Keys.L_SHIFT || x === Keys.R_SHIFT) x = Keys.SHIFT;
            if (x === Keys.L_CTRL || x === Keys.R_CTRL) x = Keys.CTRL;
            if (x === Keys.L_ALT || x === Keys.R_ALT) x = Keys.ALT;
            return x;
        });

        const checkAlt = shortCut.includes(Keys.ALT);
        const checkCtrl = shortCut.includes(Keys.CTRL);
        const checkShift = shortCut.includes(Keys.SHIFT);
        const checkKeys = shortCut.filter(x => x !== Keys.ALT && x !== Keys.CTRL && x !== Keys.SHIFT);

        if (checkKeys.some(x => typeof x !== 'number')) 
            throw new Error("Invalid key code");

        this.on("down", (data) => {
            if (
                checkAlt === data.alt &&
                checkCtrl === data.ctrl &&
                checkShift === data.shift &&
                checkKeys.every(x => this.isKeyDown(x))
            ) {
                callback();
            }
        });
    }

    stop() {
        return this.process.kill();
    }
}
const keyhook = new KeyHook();

const { log } = require('console');
const fs = require("fs");
const path = require("path");
const { finished } = require('stream');
for (let folder of ['splits', 'splits/Platinum', 'splits/HGSS']) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}

function logData(gameName, str, file_name, split_file_prefix, log_type, testStatus, toggle, evolution, evolution_label, refilming_mode) {
    return new Promise((resolve, reject) => {
        const testStatusText = 'testrun_';
        // When evolution is enabled, use the evolution_label which should be in "FullyEvolved-line" format
        // Otherwise, use split_file_prefix which is the species name
        if (evolution == true && evolution_label) {
            split_file_prefix = evolution_label;
        }
        // File paths
        var dirPath  = refilming_mode == true ? `./splits/${gameName}/refilmed/${split_file_prefix}/` : `./splits/${gameName}/${split_file_prefix}/`;
        var filePath = path.join(dirPath, `${split_file_prefix}-${file_name}-simple.csv`);
        // Header
        var header = "player_name," + "pokemon," + "trainer_name," + "real_time_hmmss," + "resets," + "blackouts," + "failures," + "level," + "game_time," + "battle_duration," + "move1," + "move2," + "move3," + "move4,\n"
        if (testStatus == true) { 
            dirPath = `./splits/${gameName}/${split_file_prefix}/test_runs`; 
            switch (log_type) {
                case "Deprecated": filePath = path.join(dirPath, `${testStatusText}_${split_file_prefix}-${file_name}-deprecated.csv`); break;
                case "Full":       filePath = path.join(dirPath, `${testStatusText}_${split_file_prefix}-${file_name}-full.csv`); break;
                default:           filePath = path.join(dirPath, `${testStatusText}_${split_file_prefix}-${file_name}-simple.csv`);
            }
        }
        switch (log_type) {
            case "Deprecated": filePath = path.join(dirPath, `${split_file_prefix}-${file_name}-deprecated.csv`); break;
            case "Full":       filePath = path.join(dirPath, `${split_file_prefix}-${file_name}-full.csv`); break;
            default:           filePath = path.join(dirPath, `${split_file_prefix}-${file_name}-simple.csv`);
        }
        if (log_type == "Deprecated" && toggle == true) {
            header = "ROM," +
                "Species," +
                "Trainer," +
                "Start Time," +
                "Real Time," +
                "Game Time," +
                "Level," +
                "Resets," +
                "RTHours," +
                "RTMinutes," +
                "RTSeconds," +
                "RTMilliseconds," +
                "Move 1," +
                "Move 2," +
                "Move 3," +
                "Move 4," +
                "Attack," +
                "Defense," +
                "Sp. Attack," +
                "Sp. Defense," +
                "Speed," +
                "Attack Stage," +
                "Defense Stage," +
                "Sp. Attack Stage," +
                "Sp. Defense Stage," +
                "Speed Stage," +
                "Accuracy Stage," +
                "Evasion Stage," +
                "Battle Attack," +
                "Battle Defense," +
                "Battle Sp. Attack," +
                "Battle Sp. Defense," +
                "Battle Speed," +
                "Frame Count," +
                "Overworld Frame Count," +
                "Battle Frame Count," +
                "Menu Frame Count," +
                "Intro Frame Count," +
                "Save Count," +
                "Reload Count," +
                "Clock Reset Count," +
                "Steps Count," +
                "Steps Count Walk," +
                "Steps Count Bike," +
                "Steps Count Surf," +
                "Bonks," +
                "Battles," +
                "Trainer Battles," +
                "Wild Battles," +
                "Battles Fled," +
                "Failed Runs," +
                "Total Damage Dealt," +
                "Actual Damage Dealt," +
                "Total Damage Taken," +
                "Actual Damage Taken," +
                "Own Moves Hit," +
                "Own Moves Missed," +
                "Enemy Moves Hit," +
                "Enemy Moves Missed," +
                "Own Moves Super Effective," +
                "Own Moves Not Very Effective," +
                "Enemy Moves Super Effective," +
                "Enemy Moves Not Very Effective," +
                "Criticals Dealt," +
                "OHKOs Dealt," +
                "Criticals Taken," +
                "OHKOs Taken," +
                "Was Confused," +
                "Enemy Became Confused," +
                "Was Paralyzed," +
                "Enemy Was Paralyzed," +
                "Was Burned," +
                "Enemy Was Burned," +
                "Was Frozen," +
                "Enemy Was Frozen," +
                "Was Poisoned," +
                "Enemy Was Poisoned," +
                "Was Badly Poisoned," +
                "Enemy Was Badly Poisoned," +
                "Fell Asleep," +
                "Enemy Fell Asleep," +
                "Player Turns Confused," +
                "Player Turns Confused Hit Self," +
                "Player Turns Paralyzed," +
                "Player Turns Paralyzed Fully," +
                "Enemy Turns Confused," +
                "Enemy Turns Confused Hit Self," +
                "Enemy Turns Paralyzed," +
                "Enemy Turns Paralyzed Fully," +
                "Player HP Healed," +
                "Enemy HP Healed," +
                "Player Pokemon Fainted," +
                "Enemy Pokemon Fainted," +
                "Experience Gained," +
                "Switchouts," +
                "Money Made," +
                "Money Spent," +
                "Money Lost," +
                "Items Picked Up," +
                "Items Bought," +
                "Items Sold," +
                "Balls Thrown," +
                "Pokemon Caught In Balls," +
                "Moves Learnt," +
                //new properties" +
                "Blackouts," +
                "Attempt Number," +
                "Failures," +
                "Rival's Team,\n"
        }
        fs.mkdir(dirPath, { recursive: true }, (err) => {
            if (!fs.existsSync(filePath)) {
                fs.writeFile(filePath, header, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        fs.appendFile(filePath, str, (err) => {
                            if (err) {
                                console.error(err);
                            }
                            resolve();
                        });
                    }
                });
            } else {
                fs.appendFile(filePath, str, (err) => {
                    if (err) {
                        console.error(err);
                    }
                    resolve();

                });   
            }
        });
        }
    );
}

function logCopy(gameName, file_name, splitFileName, finished_run_count, evolution, evolution_label) {
    // Use splitFileName for directory paths and file names
    var dirPathAttempts = `./splits/${gameName}/${splitFileName}`;
    var dirPathFinishes = `./splits/${gameName}/${splitFileName}/finishes`;
    fs.mkdir(dirPathFinishes, { recursive: true }, (err) => {
        fs.copyFile(
            path.join(dirPathAttempts, `${splitFileName}-${file_name}-simple.csv`), 
            path.join(dirPathFinishes, `${splitFileName}-${finished_run_count}-simple.csv`), (err) => {
            if (err) {
                console.error(err);
            }
        });
        fs.copyFile(
            path.join(dirPathAttempts, `${splitFileName}-${file_name}-full.csv`), 
            path.join(dirPathFinishes, `${splitFileName}-${finished_run_count}-full.csv`), (err) => {
            if (err) {
                console.error(err);
            }
        });
        fs.copyFile(
            path.join(dirPathAttempts, `${splitFileName}-${file_name}-deprecated.csv`), 
            path.join(dirPathFinishes, `${splitFileName}-${finished_run_count}-deprecated.csv`), (err) => {
            if (err) {
                console.error(err);
            }
        });
    });
}

function transition(fn, ms) {
    return new Promise((resolve) => {
        const T = performance.now()
        function step() {
            const t = performance.now() - T
            fn(Math.min(t / ms, 1))
            if (t < ms) requestAnimationFrame(step)
            else resolve()
        }
        requestAnimationFrame(step)
    })
}

const app = Vue.createApp({
    data() {
        return {
            ready                        : false,
            mapper                       : null,
            state                        : "No Pokemon",
            editor                       : false,
            game_variables               : null,
            autosplitter_toggle          : true,
            evolution                    : false,
            evolution_splits_label       : "",
            selected_evolution_species   : null,  // Currently selected species in evolution family for styling
            evolution_family_list        : [],    // List of species in the current evolution family
            last_known_species           : null,  // Track last known species for evolution detection
            last_known_personality_value : null,  // Track last known personality value for evolution detection
            evolution_transitioning      : false, // Flag to track if evolution transition is in progress
            evolution_old_species        : null,  // Species before evolution (for transition)
            evolution_new_species        : null,  // Species after evolution (for transition)
            evolution_transition_progress: 0,     // Progress of evolution transition (0-1)
            show_evolved_base_stats      : false, // Flag to show base stats of evolved species until next battle
            evolved_species_for_stats    : null,  // Species to show base stats for
            is_loading_evolution_style   : false, // Flag to prevent watchers from saving during style loading
            frame                        : false,
            selected_game                : MyStorage['selected_game'] ?? "Platinum",
            available_games              : ["Platinum", "HeartGold and SoulSilver", "Diamond and Pearl"],
            starter_choice               : "Turtwig",
            refilming_mode               : false,
            show_advanced_settings       : MyStorage['show_advanced_settings']        ?? false,
            legacy_starter_assignment    : MyStorage['legacy_starter_assignment']     ?? false,
            set_rom_starter_automatically: MyStorage['set_rom_starter_automatically'] ?? true,
            catch_rate                   : MyStorage['catch_rate'] ?? false,
            previous_splits              : MyStorage['previous_splits']     ?? [],
            current_splits               : MyStorage['current_splits']      ?? [],
            collect_split_data           : MyStorage["collect_split_data"]  ?? true,
            previous_label               : MyStorage['previous_label'] ?? "Previous",
            current_label                : MyStorage['current_label']  ?? "Current",
            automatic_post_battle_splits : MyStorage['automatic_post_battle_splits'] ?? true,
            split_type                   : MyStorage['split_type']       ?? "First",
            right_ui: "Automatic",
            debugging_mode               : MyStorage['debugging_mode']     ?? true,
            collect_split_data           : MyStorage['collect_split_data'] ?? true,
            showPopup                    : false,
            unobtainable_moves_toggle    : MyStorage['unobtainable_moves_toggle'] ?? "Always Cross Out",
            banned_hidden_power          : MyStorage['banned_hidden_power']       ?? true,

            // Fix for Resets and Blackouts incrementing twice instead of just once
            disallow_faults: false,
            disallow_delay : 2000,
            
            // Editor variables
            move1_replacement: "",
            move2_replacement: "",
            move3_replacement: "",
            move4_replacement: "",
            item1_replacement: "Rare Candy",
            item2_replacement: "PP Up",
            item3_replacement: "Full Restore",
            item4_replacement: "Max Elixir",

            // POKEMON CONFIG (components) ---------------------------------//
            starter                : "Heatran",
            pkmnNature             : "Adamant",
            pkmn_gender            : "Female",
            pkmn_ability           : null,
            hidden_power_type      : "Dark",
            hidden_power_index     : 0,
            overlayNew             : "Chimchar",
            overlayOld             : "Chimchar",
            scott_mode             : true,
            testStatus             : MyStorage['testStatus']           ?? false,
            wild_pokemon_display   : false,
            stats_setting          : MyStorage['stats_setting']        ?? "Automatic",
            expBarToggle           : MyStorage['expBarToggle']         ?? true,
            show_nature_changes    : MyStorage['show_nature_changes']  ?? true,
            show_tutor_moves       : MyStorage['show_tutor_moves']     ?? true,
            movepool_isolation     : MyStorage['movepool_isolation']   ?? "Automatic",
            
            right_display          : MyStorage['right_display'] ?? "Automatic",
            hgss_trainers          : [],
            examined_trainer       : "",
            search_trainers        : "",
            
            stat_fix_toggle        : false,
            stat_fix_toggle_2      : 0,
            stat_fix_lvl           : 0,
            stat_fix_hp            : 0,
            stat_fix_atk           : 0,
            stat_fix_def           : 0,
            stat_fix_spe           : 0,
            stat_fix_spa           : 0,
            stat_fix_spd           : 0,

            customMovepool: {
                "Torterra"     : "line-height: 16px;",
                "Infernape"    : "line-height: 15px;",
                "Empoleon"     : "line-height: 15px;",
                "Cresselia"    : "line-height: 18px;",
                "Heatran"      : "line-height: 18px;",
                "Machop"       : "line-height: 16.54px;",
                "Machoke"      : "line-height: 16.26px;",
                "Machamp"      : "line-height: 15.47px;",
                "Combee"       : "line-height: 19px;",
                "Vespiquen"    : "line-height: 16.82px;",
                "Shellos"      : "line-height: 19px;",
                "Gastrodon"    : "line-height: 16.54px;",
                "Swinub"       : "line-height: 18.42px;",
                "Piloswine"    : "line-height: 15.99px;",
                "Mamoswine"    : "line-height: 14.77px;",
                "Bonsly"       : "line-height: 19.13px;",
                "Sudowoodo"    : "line-height: 18.41px;",
                "Snorunt"      : "line-height: 19px;",    // no tutor moves
                "Froslass"     : "line-height: 17.42px;", // no tutor moves
                "Carnivine"    : "line-height: 18.42px;", // no tutor moves
                "Snover"       : "line-height: 18.06px;",
                "Abomasnow"    : "line-height: 16.25px;", // no tutor moves
                "Riolu"        : "line-height: 16.54px;",
                "Lucario"      : "line-height: 15.47px;", // no tutor moves
                "Giratina"     : "line-height: 16.25px;", // no tutor moves
                "Arceus"       : "line-height: 13.74px;", // no tutor moves
                "Gible"        : "line-height: 17.42px;", // no tutor moves
                "Gabite"       : "line-height: 16.82px;", // no tutor moves
                "Garchomp"     : "line-height: 13.74px;", // no tutor moves
                "Shaymin"      : "line-height: 19.52px;",
                "Shaymin - Sky": "line-height: 19.52px;",
                "Feraligatr"   : "line-height: 15.49px;",
                "Mewtwo"       : "line-height: 11.62px;",
                "Pidgey"       : "line-height: 19px;",
                "Pidgeotto"    : "line-height: 19px;",
                "Pidgeot"      : "line-height: 19px;",
                "Glameow"      : "line-height: 17.5px;",
                "Purugly"      : "line-height: 17.5px;",
                "Starly"       : "line-height: 19px;",
                "Staravia"     : "line-height: 19px;",
                "Staraptor"    : "line-height: 19px;",
                "Heracross"    : "line-height: 19px;",
                "Stunky"       : "line-height: 20px;",
                "Skuntank"     : "line-height: 18px;",
                "Croagunk"     : "line-height: 17.75px;",
                "Toxicroak"    : "line-height: 15.74px;",
                "Yanma"        : "line-height: 20px;",
                "Yanmega"      : "line-height: 18.75px;",
                "Zubat"        : "line-height: 19px;",
                "Golbat"       : "line-height: 17.75px;",
                "Crobat"       : "line-height: 18.75px;",
                "Murkrow"      : "line-height: 20.34px;",
                "Honchkrow"    : "line-height: 20.75px;",
                "Sneasel"      : "line-height: 15.99px;",
                "Weavile"      : "line-height: 14.35px;",
                "Drifloon"     : "line-height: 18.4px;",
                "Drifblim"     : "line-height: 16.82px;",
                "Aipom"        : "line-height: 17.41px;",
                "Ambipom"      : "line-height: 16.25px;",
                "Lickitung"    : "line-height: 15.48px;",
                "Lickilicky"   : "line-height: 14.55px;",
                "Tangela"      : "line-height: 18px;",
                "Tangrowth"    : "line-height: 15.99px;",
                "Chatot"       : "line-height: 20px;",
                "Bronzor"      : "line-height: 18.4px;",
                "Bronzong"     : "line-height: 15.47px;",
                "Rhyhorn"      : "line-height: 18.05px;",
                "Rhydon"       : "line-height: 14.35px;",
                "Rhyperior"    : "line-height: 13.74px;",
            },
            set_starter_stats_object: {
                ivs: {
                    hp: 31,
                    atk: 31,
                    def: 31,
                    spe: 31,
                    spa: 31,
                    spd: 31,
                },
                gender: 10,
                nature: 'Hardy',
                ability: 0,
            },
            simple_natures: {
                "0" : "Hardy",
                "1" : "Lonely",
                "2" : "Brave",
                "3" : "Adamant",
                "4" : "Naughty",
                "5" : "Bold",
                "6" : "Docile",
                "7" : "Relaxed",
                "8" : "Impish",
                "9" : "Lax",
                "10": "Timid",
                "11": "Hasty",
                "12": "Serious",
                "13": "Jolly",
                "14": "Naive",
                "15": "Modest",
                "16": "Mild",
                "17": "Quiet",
                "18": "Bashful",
                "19": "Rash",
                "20": "Calm",
                "21": "Gentle",
                "22": "Sassy",
                "23": "Careful",
                "24": "Quirky",
            },
            hiddenPowerTypes : {
                15: "Dark",
                8 : "Fire",
                6 : "Ghost",
                11: "Electric",
                10: "Grass",
                9 : "Water",
                4 : "Rock",
                1 : "Flying",
                0 : "Fighting",
                3 : "Ground",
                13: "Ice",
                12: "Psychic",
                5 : "Bug",
                7 : "Steel",
                14: "Dragon",
                2 : "Poison",
            },
            encounter_settings: [
            ],
            pokemon_list: [],
            
            // USER CONFIG (components) ------------------------------------------------------------------------// 
            typeCalcs: true,

            //CSS styling values
            statLabelOpacityValue: 0.1, //used when a stage modifier is applied

            //DATA ---------------------------------------------------------------------------------------------//
            g4MoveData               : g4MoveData,
            g4tmhmMapping            : g4tmhmMapping,
            // g4PokemonData            : g4PokemonData,
            stageModifiersData       : stageModifiersData,
            typeEffectivenessArray   : typeEffectivenessArray,
            typeData                 : typeData,
            typeBoostingItems        : typeBoostingItems,
            platinum_trainers        : platinum_trainers,
            platinum_moves           : platinum_moves,
            hiddenPowerTypes         : hiddenPowerTypes,
            generation4_moves_new    : generation4_moves_new,
            textures                 : textures,
            default_colors           : default_colors,
            autosplitter             : autosplitter,
            post_game_moves          : post_game_moves,
            auto_save_settings       : auto_save_settings,
            natures                  : natures,
            hiddenpower_type_selector: hiddenpower_type_selector,
            game_variables           : game_variables,
            natural_gift             : natural_gift,
            cross_generation_moves   : cross_generation_moves,
            hiddenpowers             : hiddenpowers,
            unobtainable_moves_object: unobtainable_moves,

            // Data (New as of 2024-06-02)
            // These files contain the most up-to-date data for both trainers and pokemon.
            // The frontend is not currently using these paths and it needs to be updated so that it can.
            // This will enable game switching within generation 4 and it will allow this frontend to eventually be used for generation 5.
            pokedex_dp   : pokedex_dp,
            pokedex_plat : pokedex_plat,
            pokedex_hgss : pokedex_hgss,
            trainers_dp  : trainers_dp,
            trainers_plat: trainers_plat,
            trainers_hgss: trainers_hgss,
            tmhm         : tmhm,

            //LOOPS
            badges: [0, 1, 2, 3, 4, 5, 6, 7],
            johto_badge_indexes: [0, 1, 2, 3, 4, 5, 6, 7],
            kanto_badge_indexes: [8, 9, 10, 11, 12, 13, 14, 15],
            badgeBoosts:     ["badge1", "badge3", "badge5", "badge7"],
            moves:           ["move1","move2","move3","move4",],
            pkmnSlots:       [0, 1, 2, 3, 4, 5],
            modifier_values: ["attack","defense","special_attack","special_defense","speed"],
            simple_natures: {
                "0" : "Hardy",
                "1" : "Lonely",
                "2" : "Brave",
                "3" : "Adamant",
                "4" : "Naughty",
                "5" : "Bold",
                "6" : "Docile",
                "7" : "Relaxed",
                "8" : "Impish",
                "9" : "Lax",
                "10": "Timid",
                "11": "Hasty",
                "12": "Serious",
                "13": "Jolly",
                "14": "Naive",
                "15": "Modest",
                "16": "Mild",
                "17": "Quiet",
                "18": "Bashful",
                "19": "Rash",
                "20": "Calm",
                "21": "Gentle",
                "22": "Sassy",
                "23": "Careful",
                "24": "Quirky",
            },
            stat_object:     [
                {abrv: "Hp",  name: "Hp",              name_stat_exp: "Hp",      label: "HP",   path: "hp",              mod_path: "Hp",             mod_abrv: "hp",  base_stat_path: "base_hp",      object_identifier: "hp",      dv: "dvHp",      hp_spe_label_row: 1, hp_spd_label_row: 1, label_column: 1, hp_spe_value_row: 1, hp_spd_value_row: 1, value_column: 2,}, 
                {abrv: "Atk", name: "Attack",          name_stat_exp: "Attack",  label: "Atk.", path: "attack",          mod_path: "Attack",         mod_abrv: "atk", base_stat_path: "base_atk",     object_identifier: "atk",     dv: "dvAttack",  hp_spe_label_row: 2, hp_spd_label_row: 2, label_column: 1, hp_spe_value_row: 2, hp_spd_value_row: 2, value_column: 2,}, 
                {abrv: "Def", name: "Defense",         name_stat_exp: "Defense", label: "Def.", path: "defense",         mod_path: "Defense",        mod_abrv: "def", base_stat_path: "base_def",     object_identifier: "def",     dv: "dvDefense", hp_spe_label_row: 3, hp_spd_label_row: 3, label_column: 1, hp_spe_value_row: 3, hp_spd_value_row: 3, value_column: 2,}, 
                {abrv: "SpA", name: "Special Attack",  name_stat_exp: "Special", label: "SpA.", path: "special_attack",  mod_path: "SpecialAttack",  mod_abrv: "spA", base_stat_path: "base_spc_atk", object_identifier: "spc_atk", dv: "dvSpecial", hp_spe_label_row: 2, hp_spd_label_row: 2, label_column: 3, hp_spe_value_row: 2, hp_spd_value_row: 2, value_column: 4,}, 
                {abrv: "SpD", name: "Special Defense", name_stat_exp: "Special", label: "SpD.", path: "special_defense", mod_path: "SpecialDefense", mod_abrv: "spD", base_stat_path: "base_spc_def", object_identifier: "spc_def", dv: "dvSpecial", hp_spe_label_row: 3, hp_spd_label_row: 3, label_column: 3, hp_spe_value_row: 3, hp_spd_value_row: 3, value_column: 4,}, 
                {abrv: "Spe", name: "Speed",           name_stat_exp: "Speed",   label: "Spe.", path: "speed",           mod_path: "Speed",          mod_abrv: "spe", base_stat_path: "base_spd",     object_identifier: "spd",     dv: "dvSpeed",   hp_spe_label_row: 1, hp_spd_label_row: 1, label_column: 3, hp_spe_value_row: 1, hp_spd_value_row: 1, value_column: 4,}, 
            ],

            //VARIABLES THAT TRACK IN GAME PROGRESS ------------------------------------------------------------//
            playerId      : -1,
            resets        : 0,
            trainerBattles: 0,
            wildEncounters: 0,
            blackout: false,

            //STATE MANAGEMENT ---------------------------------------------------------------------------------//
            gameStarted:  true, //tracks if the player has a save game or not
            playerID:     999,
            expBarState: {
                species:   "",
                expPoints: 0,
            },
            expBarAnimation: true,
            slotTimingFix:   false,
            enemyModColour:  [0, "background: #d84444;"],
            enemyState:      "Pokemon",
            field_array:     ["Reflect", 0],
            last_initiated_field_effect: "Reflect",

            //Pokemon settings for local storage
            overlay_color: MyStorage["overlay_color"] ?? "#000000",
            imageXOffset : MyStorage["imageXOffset"]  ?? 0,
            imageYOffset : MyStorage["imageYOffset"]  ?? 0,
            imageScale   : MyStorage["imageScale"]    ?? 1,
            imageFlip    : MyStorage["imageFlip"]     ?? false,
            imageSat     : MyStorage["imageSat"]      ?? 100,
            imageRotation: MyStorage["imageRotation"] ?? 0,

            //background texture settings
            backgroundBlur       : MyStorage["backgroundBlur"]        ?? 0,
            backgroundHue        : MyStorage["backgroundHue"]         ?? 0,
            backgroundScale      : MyStorage["backgroundScale"]       ?? 100,
            backgroundUrl        : MyStorage["backgroundUrl"]         ?? "",
            backgroundFlip       : MyStorage["backgroundFlip"]        ?? false,
            use_custom_background: MyStorage["use_custom_background"] ?? false,
            backgroundXOffset    : MyStorage["backgroundXOffset"]     ?? 0,
            backgroundYOffset    : MyStorage["backgroundYOffset"]     ?? 0,
            backgroundTexture    : MyStorage["backgroundTexture"]     ?? 'Bug 1',
            backgroundBrightness : MyStorage["backgroundBrightness"]  ?? 100,
            backgroundContrast   : MyStorage["backgroundContrast"]    ?? 100,
            backgroundSaturation : MyStorage["backgroundSaturation"]  ?? 100,

            kanto_badges: MyStorage["kanto_badges"] ?? false,

            //backed up pokemon specific settings
            pokemon_settings: [
                "overlay_color",
                "imageXOffset",
                "imageYOffset",
                "imageScale",
                "imageFlip",
                "imageSat",
                "imageRotation",
                "backgroundBlur",
                "backgroundHue",
                "backgroundScale",
                "backgroundUrl",
                "use_custom_background",
                "attempt_number",
                "pb_time",
                "backgroundXOffset",
                "backgroundYOffset",
                "backgroundTexture",
                "backgroundBrightness",
                "backgroundContrast",
                "backgroundSaturation",
                "backgroundFlip",
                "pkmnNature",
                "pkmn_ability",
                "hidden_power_type",
                "hidden_power_index",
                "pkmn_gender",
                "finished_run_count",
                "evolution",
                "evolution_splits_label",
                "playerResets",
                "blackout_counter",
                "ui_saturation",
                "frame",
                "previous_label",
                "current_label",
                "split_type",
                "kanto_badges",
            ],
            //timer variables
            timer_startTimeOffset: MyStorage["timer_startTimeOffset"] ?? "00:00:00.00",
            timer_startTime:       MyStorage["timer_startTime"]       ?? 0,
            timer_pause:           MyStorage["timer_pause"]           ?? true,
            timer_formatted_time:  MyStorage["timer_formatted_time"]  ?? ["0", ".00"],
            timer_pause_time:      MyStorage["timer_pause_time"]      ?? 0,
            time_h:                MyStorage['time_h']                ?? 0,
            time_m:                MyStorage['time_m']                ?? 0,
            time_s:                MyStorage['time_s']                ?? 0,
            time_ms:               MyStorage['time_ms']               ?? 0,
            time_split_start:      MyStorage['time_split_start']      ?? "00:00:00:00",
            battle_start:          MyStorage['battle_start']          ?? 0,

            //resets
            playerId                 : MyStorage["playerId"] ?? 0,
            playerName               : "",
            resetCatcher             : "NINTEN",
            playerResets             : MyStorage["playerResets"] ?? 0,
            blackout_counter         : MyStorage["blackout_counter"] ?? 0,
            resetCounter             : true,
            game_over                : false,
            hallOfFameReset          : false,
            finished_logs            : false,
            pb_time                  : "None",
            split_logStr             : "",
            attempt_number           : 0,
            finished_run_count       : 0,
            split_data               : MyStorage["split_data"]          ?? [],
            simple_data_str          : MyStorage["simple_data_str"]     ?? "",
            full_data_str            : MyStorage["full_data_str"]       ?? "",
            deprecated_data_str      : MyStorage["deprecated_data_str"] ?? "",
            simple_data              : MyStorage["simple_data"]         ?? "",
            testRun                  : MyStorage['testRun']             ?? false,
            copy_overlay_pokemon_from: "",
            copy_overlay_pokemon_to  : "",
            run_complete             : MyStorage["run_complete"]       ?? false,

            // buffer properties
            buffer_battle_level          : 0,
            buffer_battle_exp            : 0,
            buffer_battle_attack         : 0,
            buffer_battle_defense        : 0,
            buffer_battle_speed          : 0,
            buffer_battle_special_attack : 0,
            buffer_battle_special_defense: 0,
            buffer_battle_friendship     : 0,

            search_term: MyStorage["search_term"] ?? "",

            track_TMHM_viability: false,

            // UI
            ui_saturation:                MyStorage["ui_saturation"]                ?? .6,
            ui_type_icons:                MyStorage["ui_type_icons"]                ?? "2024",
            ui_type_icons_modifier:       MyStorage["ui_type_icons_modifier"]       ?? "2024/",
            ui_stats_styling:             MyStorage["ui_stats_styling"]             ?? "2024",
            ui_stats_styling_modifier:    MyStorage["ui_stats_styling_modifier"]    ?? "",
            ui_stat_arrangement:          MyStorage['ui_stat_arrangement']          ?? "HP, Atk, Def, Spe, SpA, SpD",
            ui_stat_arrangement_modifier: MyStorage['ui_stat_arrangement_modifier'] ?? "hp_spe_",
        }
    },
    created() {
        if (MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]) {  
            this.overlay_color          = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].overlay_color           ?? this.default_colors[g4PokemonData[this.starter]?.type_1];
            this.imageXOffset           = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageXOffset            ?? 0;
            this.imageYOffset           = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageYOffset            ?? 0;
            this.imageScale             = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageScale              ?? 1;
            this.imageFlip              = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageFlip               ?? false;
            this.imageSat               = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageSat                ?? 100
            this.imageRotation          = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].imageRotation           ?? 0
            this.backgroundBlur         = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundBlur          ?? 0
            this.backgroundHue          = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundHue           ?? 0
            this.backgroundScale        = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundScale         ?? 100
            this.backgroundUrl          = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundUrl           ?? ""
            this.use_custom_background  = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].use_custom_background   ?? false
            this.backgroundXOffset      = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundXOffset       ?? 0
            this.backgroundYOffset      = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundYOffset       ?? 0
            this.backgroundTexture      = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`].backgroundTexture       ?? `${this.g4PokemonData[this.starter]?.type_1 ?? ''}`
            this.pkmn_ability           = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.pkmn_ability           ?? g4PokemonData[this.starter]?.abilities?.[0] ?? null
            this.attempt_number         = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.attempt_number         ?? 0
            this.finished_run_count     = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.finished_run_count     ?? 0
            this.playerResets           = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.playerResets           ?? 0
            this.blackout_counter       = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.blackout_counter       ?? 0
            this.evolution              = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.evolution              ?? 0
            this.evolution_splits_label = MyStorage[`${this.mapper?.properties.meta.game_name.value}_${this.starter}`]?.evolution_splits_label ?? 0
        }
        for (let i = 0; i < this.pokemon_settings.length; i++) {
            let propName = this.pokemon_settings[i];
            this.$watch(
                () => this[propName],
                (newValue) => {
                    // Skip saving if we're currently loading evolution styles to prevent overwriting
                    if (this.is_loading_evolution_style) {
                        return;
                    }
                    
                    // Shared evolution family properties (ability, nature, gender, hidden power) 
                    // should be saved to the evolution family storage key when evolution is enabled
                    // These settings apply to all members of the evolution family
                    const sharedEvolutionFamilyProperties = ['pkmnNature', 'pkmn_ability', 'pkmn_gender', 'hidden_power_type', 'hidden_power_index'];
                    const isSharedFamilyProperty = sharedEvolutionFamilyProperties.includes(propName);
                    
                    let storageKey;
                    if (this.evolution && isSharedFamilyProperty) {
                        // Use evolution family storage key for shared properties (e.g., "Black_Unfezant-line")
                        storageKey = this.getEvolutionFamilyStorageKey(this.starter);
                    } else {
                        // Use the appropriate storage key based on evolution mode for other properties
                        // If evolution is enabled and selected_evolution_species is set, use evolution line storage
                        // Otherwise, use individual species storage
                        // This ensures styles are saved to the correct location (e.g., "Black_Unfezant-line-Pidove" vs "Black_Pidove")
                        storageKey = this.getCurrentStorageKey();
                    }
                    
                    // Ensure that MyStorage[storageKey] is an object
                    if (!MyStorage[storageKey]) {
                        MyStorage[storageKey] = {};
                    }

                    // Set the new value
                    MyStorage[storageKey] = {
                        ...MyStorage[storageKey],
                        [propName]: newValue
                    };
                }
            );
        }
        for (let i = 0; i < this.auto_save_settings.length; i++) {
            let propName = this.auto_save_settings[i];
            this.$watch(
                () => this[propName], // Using a function to return the property's value
                (newValue) => {
                    MyStorage[`${propName}`] = newValue;
                }
            );
        }
        this.hgss_trainers = this.extractTrainerInfo(this.trainers_hgss)

        for (let i = 0; i < this.encounter_settings.length; i++) {
            let propName = this.encounter_settings[i];
            this.$watch(
                () => this[propName], // Using a function to return the property's value
                (newValue) => {
                    MyStorage[`${propName}`] = newValue;
                    this.freezeEncounters();
                }
            );
        }
    },
    watch: {
        current_splits: {
            handler: function (newVal, oldVal) {
                MyStorage['current_splits'] = newVal
            },
            deep: true,
        },
        previous_splits: {
            handler: function (newVal, oldVal) {
                MyStorage['previous_splits'] = newVal
            },
            deep: true,
        },
        catch_rate(newValue) {
            if (newValue == true) {
                this.mapper.properties.patch.stpCatchRate.set(1,false); 
            }
            else {
                this.mapper.properties.patch.stpCatchRate.set(0,false); 
            }
        },
        evolution(newValue) {
            // When evolution checkbox is toggled, update evolution family list
            if (newValue) {
                this.updateEvolutionFamilyList();
                // Set default selected evolution species to the starter
                if (!this.selected_evolution_species && this.evolution_family_list.length > 0) {
                    this.selected_evolution_species = this.starter;
                    this.loadEvolutionStyle(this.selected_evolution_species, true);
                    
                    // Save selected evolution species to storage
                    const game_name = this.mapper?.properties?.meta?.game_name?.value || this.selected_game;
                    if (!MyStorage[`${game_name}_${this.starter}`]) {
                        MyStorage[`${game_name}_${this.starter}`] = {};
                    }
                    MyStorage[`${game_name}_${this.starter}`] = {
                        ...MyStorage[`${game_name}_${this.starter}`],
                        selected_evolution_species: this.starter
                    };
                } else if (this.selected_evolution_species) {
                    // Load styles for the already selected species
                    this.loadEvolutionStyle(this.selected_evolution_species, true);
                }
            } else {
                // When disabled, load individual species styles
                this.loadEvolutionStyle(this.starter, false);
            }
        },
        selected_evolution_species(newValue, oldValue) {
            // When a different evolution family species is selected in the dropdown:
            // 1. The Pokemon art will automatically update via displayedPokemonSpecies computed property
            // 2. Load its styles from evolution line storage (e.g., "Unfezant-line-Pidove")
            // 3. If there's a transition (oldValue exists), perform a fade transition
            // 4. Save the selection to storage
            if (newValue && this.evolution) {
                // Load evolution line styles first (before transition) to ensure styles are loaded
                // The flag in loadEvolutionStyle will prevent watchers from overwriting
                this.loadEvolutionStyle(newValue, true);
                
                // Recalculate movepool size for the new species
                this.$nextTick(() => {
                    this.movepoolResize();
                });
                
                // If we're changing from one species to another (not initial load), perform transition
                if (oldValue && oldValue !== newValue) {
                    this.performEvolutionTransition(oldValue, newValue);
                }
                
                // Save selected evolution species to storage
                const game_name = this.mapper?.properties?.meta?.game_name?.value || this.selected_game;
                if (!MyStorage[`${game_name}_${this.starter}`]) {
                    MyStorage[`${game_name}_${this.starter}`] = {};
                }
                MyStorage[`${game_name}_${this.starter}`] = {
                    ...MyStorage[`${game_name}_${this.starter}`],
                    selected_evolution_species: newValue
                };
            }
        },
        starter(newValue, oldValue) {
            const starter = newValue
            const game = this.mapper?.properties.meta.game_name.value
            const state = this.mapper?.properties.meta.state.value
            MyStorage['starter'] = newValue
            
            // Update evolution family list when starter changes
            this.updateEvolutionFamilyList();
            
            // If evolution is enabled, load selected_evolution_species from storage or default to starter
            if (this.evolution && this.evolution_family_list.length > 0) {
                // Load selected evolution species from storage
                const stored_evolution_species = MyStorage[`${game}_${starter}`]?.selected_evolution_species;
                if (stored_evolution_species && this.evolution_family_list.includes(stored_evolution_species)) {
                    this.selected_evolution_species = stored_evolution_species;
                } else {
                    // Default to starter if not set or invalid
                    this.selected_evolution_species = starter;
                    // Save it
                    if (!MyStorage[`${game}_${starter}`]) {
                        MyStorage[`${game}_${starter}`] = {};
                    }
                    MyStorage[`${game}_${starter}`] = {
                        ...MyStorage[`${game}_${starter}`],
                        selected_evolution_species: starter
                    };
                }
                
                // Load evolution line styles for the selected species
                this.loadEvolutionStyle(this.selected_evolution_species, true);
            } else {
                // Load individual species styles
                if (!MyStorage[`${game}_${starter}`]) {
                    MyStorage[`${game}_${starter}`] = {};
                }
                this.loadEvolutionStyle(starter, false);
            }
            
            // Keep frame setting from individual storage for now
            this.frame = MyStorage[`${game}_${starter}`]?.frame ?? false
            
            // Load shared evolution family settings (ability, nature, gender, hidden power) if evolution is enabled
            // Otherwise, load from individual species storage
            if (this.evolution) {
                const evolutionFamilyStorageKey = this.getEvolutionFamilyStorageKey(starter);
                const familyStored = MyStorage[evolutionFamilyStorageKey] || {};
                
                // Load from evolution family storage, fallback to individual storage, then defaults
                this.pkmnNature = familyStored.pkmnNature ?? MyStorage[`${game}_${starter}`]?.pkmnNature ?? "Hardy";
                this.pkmn_ability = familyStored.pkmn_ability ?? MyStorage[`${game}_${starter}`]?.pkmn_ability ?? (this.g4PokemonData?.[starter]?.abilities?.[0]) ?? null;
                this.pkmn_gender = familyStored.pkmn_gender ?? MyStorage[`${game}_${starter}`]?.pkmn_gender ?? "Female";
                this.hidden_power_type = familyStored.hidden_power_type ?? MyStorage[`${game}_${starter}`]?.hidden_power_type ?? "Dark";
                this.hidden_power_index = familyStored.hidden_power_index ?? MyStorage[`${game}_${starter}`]?.hidden_power_index ?? 0;
            } else {
                // Evolution is disabled, load from individual species storage
                this.pkmnNature = MyStorage[`${game}_${starter}`]?.pkmnNature ?? "Hardy";
                this.pkmn_ability = MyStorage[`${game}_${starter}`]?.pkmn_ability ?? null;
                this.pkmn_gender = MyStorage[`${game}_${starter}`]?.pkmn_gender ?? "Female";
                this.hidden_power_type = MyStorage[`${game}_${starter}`]?.hidden_power_type ?? "Dark";
                this.hidden_power_index = MyStorage[`${game}_${starter}`]?.hidden_power_index ?? 0;
            }
            
            //! FIX_LATER Fix this implementation later
            // this.ability           = MyStorage[`${game}_${starter}`]?.ability          ?? this.g4PokemonData[starter].abilities[0],
            this.encounters_route_1 = MyStorage[`${game}_${starter}`]?.encounters_route_1 ?? false
            this.encounters_route_2 = MyStorage[`${game}_${starter}`]?.encounters_route_2 ?? false
            
            // Evolution management
            if (this.evolution != true) {
                this.evolution              = MyStorage[`${game}_${starter}`]?.evolution              ?? false
                this.evolution_splits_label = MyStorage[`${game}_${starter}`]?.evolution_splits_label ?? ""

                this.attempt_number     = MyStorage[`${game}_${starter}`]?.attempt_number     ?? 0
                this.finished_run_count = MyStorage[`${game}_${starter}`]?.finished_run_count ?? 0
                this.playerResets       = MyStorage[`${game}_${starter}`]?.playerResets       ?? 0
                this.blackout_counter   = MyStorage[`${game}_${starter}`]?.blackout_counter   ?? 0
            }
            else {

            }

            this.movepoolResize();
        },
        playerId(newValue) {
            MyStorage["playerId"] = newValue
            this.game_over = false;
            MyStorage["playerResets"] = 0
            this.playerResets = 0;
            this.finished_logs == false;
            MyStorage["blackout_counter"] = 0
            this.blackout_counter = 0;
        },    
        overlay_color(newColor) {
            document.documentElement.style.setProperty('--overlay-color', newColor);
        }, 
        async playerResets(newProp) {
            if ((newProp + this.blackout_counter).toString().length == 1) {
                document.getElementById("reset_counter").style.fontSize = "68px"
            }
            if ((newProp + this.blackout_counter).toString().length == 2) {
                document.getElementById("reset_counter").style.fontSize = "68px"
            }
            if ((newProp + this.blackout_counter).toString().length == 3) {
                document.getElementById("reset_counter").style.fontSize = "54px"
            }
            if ((newProp + this.blackout_counter).toString().length == 4) {
                document.getElementById("reset_counter").style.fontSize = "40px"
            }

            // if (newProp.toString().length == 1) {
            //     document.getElementById("reset_counter").style.fontSize = "68px"
            // }
            // if (newProp.toString().length == 3) {
            //     document.getElementById("reset_counter").style.fontSize = "54px"
            // }
            // if (newProp.toString().length == 4) {
            //     document.getElementById("reset_counter").style.fontSize = "40px"
            // }
            
            if (this.playerResets < 0) {
                this.playerResets = 0;
            }
            this.blackout == false
            MyStorage["playerResets"] = this.playerResets
        },
        blackout_counter(newProp) {
            if ((this.playerResets + newProp).toString().length == 1) {
                document.getElementById("reset_counter").style.fontSize = "68px"
            }
            if ((this.playerResets + newProp).toString().length == 2) {
                document.getElementById("reset_counter").style.fontSize = "68px"
            }
            if ((this.playerResets + newProp).toString().length == 3) {
                document.getElementById("reset_counter").style.fontSize = "54px"
            }
            if ((this.playerResets + newProp).toString().length == 4) {
                document.getElementById("reset_counter").style.fontSize = "40px"
            }
            
            if (this.blackout_counter < 0) {
                this.blackout_counter = 0;
            }
            MyStorage["blackout_counter"] = this.blackout_counter
        },
        playerNameChoice() {
            this.overlay_color = `lch(75% 100 ${hash(this.playerNameChoice) % 360})`
            MyStorage["playerNameChoice"] = this.playerNameChoice
            MyStorage["overlay_color"] = this.overlay_color
        },
        playerName(newName) {
            MyStorage['playerName'] = newName;
        },
        ui_stat_arrangement(newValue) {
            if (newValue == 'HP, Atk, Def, SpA, SpD, Spe') {
                this.ui_stat_arrangement_modifier = "hp_spe_"
            }
            if (newValue == 'HP, Atk, Def, Spe, SpA, SpD') {
                this.ui_stat_arrangement_modifier = "hp_spd_"
            }
        },
        // evolution(newValue) {
        //     if (this.ready == false) { return }
        //     const evolution_family = this.game.evolutions[this.starterString]?.evolution_family
        //     const family_length = evolution_family.length
        //     const split_label = `${evolution_family[evolution_family.length - 1]?.species}-line`
        //     // console.log(evolution_family)
        //     if (newValue == true) {
        //         this.evolution_splits_label = split_label
        //     }
        //     if (newValue == false) {
        //         this.evolution_splits_label = ""
        //     }
        //     for (let i = 0; i < family_length; i++) {
        //         MyStorage[evolution_family[i].species] = {
        //             ...MyStorage[evolution_family[i].species],
        //             evolution             : newValue,
        //             evolution_splits_label: this.evolution_splits_label,
        //             attempt_number        : this.attempt_number,
        //             finished_run_count    : this.finished_run_count,
        //         };
        //     }
        // },
    },
    computed: {
        hp_tracker_style() {
            const state = this.mapper.properties.meta.state.value
            const hp = this.mapper.properties.player.team[0].stats.hp.value
            const hp_max = this.mapper.properties.player.team[0].stats.hp_max.value
            const hp_percentage = hp / hp_max
            const status_condition = this.mapper.properties.player.team[0].status_condition.value
            if (state == "Overworld" && hp_percentage != 1) {
                return "--overlay-color: rgb(255, 98, 98);"
            }
            else if (status_condition != null) {
                return "--overlay-color: rgb(98, 192, 255);"
            }
            else {
                return "--overlay-color: #39b54a;"
            }
        },
        compare_splits() {
            debugging_mode = false
            if (debugging_mode == true) { console.log("compare_splits starting...") } 
            if (debugging_mode == true) { console.log("...") } 
            if (this.collect_split_data == true) {
                if (debugging_mode == true) { console.log("collect_split_data == true") } 
                const result = []

                let lastPushedTrainer = null; // Keep track of the last pushed trainer
                if (debugging_mode == true) { console.log("lastPushedTrainer:", lastPushedTrainer) } 

                const trainersToSkip = ["ELITE_FOUR_LORELEI_2", "ELITE_FOUR_BRUNO_2"]; // Trainers to skip
                
                // Track occurrences for Rival and Cyrus
                const rivalCount = { count: 0 }
                const cyrusCount = { count: 0 }
                
                // If no previous splits are loaded, return default list from game.splits
                if (!this.previous_splits || this.previous_splits.length === 0) {
                    if (!this.game || !this.game.splits) {
                        return result
                    }
                    const default_string = "-"
                    for (const trainer of this.game.splits) {
                        if (!trainersToSkip.includes(trainer)) {
                            // Track occurrences
                            let baseName = trainer
                            if (baseName.startsWith("Leader ")) baseName = baseName.substring(7)
                            else if (baseName.startsWith("Commander ")) baseName = baseName.substring(10)
                            else if (baseName.startsWith("Galactic Boss ")) baseName = baseName.substring(14)
                            
                            if (baseName === "Rival") {
                                rivalCount.count++
                                const displayName = this.format_display_name(trainer, rivalCount.count)
                                if (displayName === null) continue // Skip Rival 1
                            } else if (baseName === "Cyrus") {
                                cyrusCount.count++
                            }
                            
                            const displayName = this.format_display_name(trainer, baseName === "Rival" ? rivalCount.count : (baseName === "Cyrus" ? cyrusCount.count : 1))
                            if (displayName === null) continue // Skip if null (Rival 1)
                            
                            if (this.split_type == 'First') {
                                result.push({trainer: displayName, original_trainer: trainer, current_time: default_string})
                            } else {
                                result.push({trainer: displayName, original_trainer: trainer, previous_time: default_string, current_time: default_string, difference: default_string})
                            }
                        }
                    }
                    return result
                }
                
                // Track current_splits indices separately for Rival and Cyrus to match by order
                let currentRivalIndex = 0
                let currentCyrusIndex = 0
                
                for (const x of this.previous_splits) {
                    if (debugging_mode == true) { console.log("Loop X:", x.trainer) } 
                    if (this.game.splits.includes(x.trainer)) {
                        const default_string = "-"
                        
                        // Track occurrences
                        let baseName = x.trainer
                        if (baseName.startsWith("Leader ")) baseName = baseName.substring(7)
                        else if (baseName.startsWith("Commander ")) baseName = baseName.substring(10)
                        else if (baseName.startsWith("Galactic Boss ")) baseName = baseName.substring(14)
                        
                        if (baseName === "Rival") {
                            rivalCount.count++
                        } else if (baseName === "Cyrus") {
                            cyrusCount.count++
                        }
                        
                        // Find matching split in current_splits by order for Rival/Cyrus, by name for others
                        let cur_split = undefined
                        if (x.trainer === "Rival") {
                            // Find the Nth Rival in current_splits based on order
                            const rivalsInCurrent = this.current_splits.filter(s => s.trainer === "Rival")
                            if (currentRivalIndex < rivalsInCurrent.length) {
                                // Find the index in the full current_splits array
                                let found = 0
                                for (let i = 0; i < this.current_splits.length; i++) {
                                    if (this.current_splits[i].trainer === "Rival") {
                                        if (found === currentRivalIndex) {
                                            cur_split = this.current_splits[i]
                                            break
                                        }
                                        found++
                                    }
                                }
                            }
                            currentRivalIndex++
                        } else if (x.trainer === "Cyrus") {
                            // Find the Nth Cyrus in current_splits based on order
                            const cyrusInCurrent = this.current_splits.filter(s => s.trainer === "Cyrus")
                            if (currentCyrusIndex < cyrusInCurrent.length) {
                                // Find the index in the full current_splits array
                                let found = 0
                                for (let i = 0; i < this.current_splits.length; i++) {
                                    if (this.current_splits[i].trainer === "Cyrus") {
                                        if (found === currentCyrusIndex) {
                                            cur_split = this.current_splits[i]
                                            break
                                        }
                                        found++
                                    }
                                }
                            }
                            currentCyrusIndex++
                        } else {
                            // For other trainers, find by exact name match
                            cur_split = this.current_splits.find(y => y.trainer === x.trainer)
                        }
                        
                        const prev = this.convertDurationToSeconds(x.time)
                        
                        const displayName = this.format_display_name(x.trainer, baseName === "Rival" ? rivalCount.count : (baseName === "Cyrus" ? cyrusCount.count : 1))
                        if (displayName === null) continue // Skip Rival 1
                        
                        if (cur_split == undefined) { 
                            if (x.trainer !== lastPushedTrainer && !trainersToSkip.includes(x.trainer)) { // Check if the current trainer is the same as the last pushed one and if it should be skipped
                                result.push({trainer: displayName, original_trainer: x.trainer, previous_time: this.convertSecondsToDuration(prev), current_time: default_string, difference: default_string}) 
                                lastPushedTrainer = x.trainer; // Update the last pushed trainer
                            }
                            continue
                        }
                        const cur = this.convertDurationToSeconds(cur_split.time)
                        const diff = cur - prev;
                        const diff_abs = Math.abs(diff);
                        const diff_sign = Math.sign(diff);
                        const diff_m = Math.floor(diff_abs / 60);
                        const diff_s = diff_abs % 60;
                        var diff_str = `${diff_sign === -1 ? "-" : "+"}${diff_m}:${diff_s.toString().padStart(2, "0")}`;
                        if (diff_str == "+0:00") { diff_str = "0:00" }
                        if (debugging_mode == true) { console.log({trainer: x.trainer, previous_time: this.convertSecondsToDuration(prev), current_time: this.convertSecondsToDuration(cur), difference: diff_str}) } 
                        if (x.trainer !== lastPushedTrainer && !trainersToSkip.includes(x.trainer)) { // Check if the current trainer is the same as the last pushed one and if it should be skipped
                            if (debugging_mode == true) { console.log({trainer: x.trainer, previous_time: this.convertSecondsToDuration(prev), current_time: this.convertSecondsToDuration(cur), difference: diff_str}) } 
                            
                            result.push({trainer: displayName, original_trainer: x.trainer, previous_time: this.convertSecondsToDuration(prev), current_time: this.convertSecondsToDuration(cur), difference: diff_str})
                            lastPushedTrainer = x.trainer; // Update the last pushed trainer
                        }
                    }
                }
                return result
            }
            // If collect_split_data is false, still return default list
            if (!this.game || !this.game.splits) {
                return []
            }
            const result = []
            const default_string = "-"
            const trainersToSkip = ["ELITE_FOUR_LORELEI_2", "ELITE_FOUR_BRUNO_2"]
            const rivalCount = { count: 0 }
            const cyrusCount = { count: 0 }
            for (const trainer of this.game.splits) {
                if (!trainersToSkip.includes(trainer)) {
                    // Track occurrences
                    let baseName = trainer
                    if (baseName.startsWith("Leader ")) baseName = baseName.substring(7)
                    else if (baseName.startsWith("Commander ")) baseName = baseName.substring(10)
                    else if (baseName.startsWith("Galactic Boss ")) baseName = baseName.substring(14)
                    
                    if (baseName === "Rival") {
                        rivalCount.count++
                        const displayName = this.format_display_name(trainer, rivalCount.count)
                        if (displayName === null) continue // Skip Rival 1
                    } else if (baseName === "Cyrus") {
                        cyrusCount.count++
                    }
                    
                    const displayName = this.format_display_name(trainer, baseName === "Rival" ? rivalCount.count : (baseName === "Cyrus" ? cyrusCount.count : 1))
                    if (displayName === null) continue // Skip if null (Rival 1)
                    
                    if (this.split_type == 'First') {
                        result.push({trainer: displayName, original_trainer: trainer, current_time: default_string})
                    } else {
                        result.push({trainer: displayName, original_trainer: trainer, previous_time: default_string, current_time: default_string, difference: default_string})
                    }
                }
            }
            return result
        },
        blackouts_resets() {
            const resets = this.playerResets
            const blackouts = this.blackout_counter
            const allow_none = true // Toggle that allows for the UI to display no border if there are no faults
            if (allow_none == true && blackouts == 0 && resets == 0) {
                return "None"
            }
            else if (blackouts == 0 && resets > 0) {
                return "Resets"
            }
            else if (blackouts > 0 && resets == 0) {
                return "Blackouts"
            }
            else {
                return "Both"
            }
        },
        g4PokemonData() {
            const game = this.mapper?.properties?.meta?.game_name?.value
            if (!game) {
                return this.pokedex_plat || {}; // Default to platinum pokedex if mapper not ready
            }
            switch (game) {
                case "Diamond"                 : return this.pokedex_dp || {}
                case "Pearl"                   : return this.pokedex_dp || {}
                case "Diamond and Pearl"       : return this.pokedex_dp || {}
                case "Platinum"                : return this.pokedex_plat || {}
                case "HeartGold"               : return this.pokedex_hgss || {}
                case "SoulSilver"              : return this.pokedex_hgss || {}
                case "HeartGold and SoulSilver": return this.pokedex_hgss || {}
                default                        : return this.pokedex_plat || {}
            }
        },
        faults() {
            return this.blackout_counter + this.playerResets
        },
        voltorb_flip() {
            const voltorb_flip_trigger = this.mapper.properties.screen.voltorb_flip.activate_voltorb_flip.value
            const map = this.mapper.properties.overworld.map_name.value 
            if (voltorb_flip_trigger == 160 && map == 'Goldenrod City - Map 31') {
                console.log("Voltorb Flip Active")
                return true
            }
            else {
                return false
            }
        },
        examined_trainer_data() {
            var trainer_id = ""
            var inputString = this.examined_trainer
            const underscoreIndex = inputString.indexOf('_');
            trainer_id = inputString.substring(underscoreIndex + 1);
            var data = this.trainers_hgss[trainer_id] ?? { name: "Unknown"}
            return data
        },
        double_battle_team_size() {
            const opponent_2 = this.mapper.properties.battle.opponent_2.trainer.value
            const opponent_1_team_count = this.mapper.properties.battle.opponent.team_count.value
            const opponent_2_team_count = this.mapper.properties.battle.opponent_2.team_count.value
            if (opponent_2) {
                return opponent_1_team_count + opponent_2_team_count
            }
            else {
                return opponent_1_team_count
            }
        },
        rival_starter() {
            const game = this.mapper.properties.meta.game_name.value
            if (game == 'Platinum' || game == 'Diamond' || game == 'Pearl' || game == 'Diamond and Pearl') {
                let starter = this.starter_choice == 'Turtwig' ? 'Chimchar' : this.starter_choice == 'Chimchar' ? 'Piplup' : 'Turtwig'
                return starter
            }
            else if (game == 'HeartGold' || game == 'SoulSilver' || game == 'HeartGold and SoulSilver') {
                let starter = this.starter_choice == 'Chikorita' ? 'Cyndaquil' : this.starter_choice == 'Cyndaquil' ? 'Totodile' : 'Chikorita'
                return starter
            }
        },
        stats_header() {
            const toggle    = true
            const stat_type = this.stats_setting
            const year      = this.ui_stats_styling_modifier
            const state     = this.mapper.properties.meta.state.value
            if (stat_type == 'Base Stats Average') {
                return 'Gen4 Base Stat Averages'
            }
            if (stat_type == 'Base Stats Median') {
                return 'Gen4 Base Stat Medians'
            }
            // stat_fix_lvl 
            if (year == '2023') {
                if (this.mapper.properties.flags.got_tm27_return.value == false) {
                    return `IVs`
                }
                switch (state) {
                    case "Base Stats":  return `Base Stats`
                    case "Overworld":   return `Level ${this.mapper.properties.player.team[0].level.value}`
                    case "To Battle":   return `Level ${this.mapper.properties.player.team[0].level.value}`
                    case "From Battle": return `Level ${this.stat_fix_lvl}`
                    case "Battle":      return `Level ${this.mapper.properties.battle.player.active_pokemon.level.value}`
                }
            }
            else {
                if (this.selected_game == 'Platinum' && this.mapper.properties.flags?.got_tm27_return?.value == false && state == 'Overworld') {
                    return `IVs`
                }
                switch (stat_type) {
                    case "Base Stats":   return `Base Stats`
                    case "IVs":          return `IVs`
                    case "Hidden Power": return `Hidden Power ${this.hpType}`
                    case "EVs":          return `EVs`
                    case "Detailed EVs": {
                        let ev_hp  = this.mapper.properties.player.team[0].evs.hp.value
                        let ev_atk = this.mapper.properties.player.team[0].evs.attack.value
                        let ev_def = this.mapper.properties.player.team[0].evs.defense.value
                        let ev_spa = this.mapper.properties.player.team[0].evs.special_attack.value
                        let ev_spd = this.mapper.properties.player.team[0].evs.special_defense.value
                        let ev_spe = this.mapper.properties.player.team[0].evs.speed.value
                        let total = ev_hp + ev_atk + ev_def + ev_spa + ev_spd + ev_spe
                        return `${total}/510 (${this.decimalToPercentage(total/510)}%)`
                    }
                    case "Automatic":    {
                        switch (state) {
                            case "No Pokemon":  return `Base Stats`
                            case "Overworld":   return `Level ${this.mapper.properties.player.team[0].level.value}`
                            case "To Battle":   return `Level ${this.mapper.properties.player.team[0].level.value}`
                            case "From Battle": return `Level ${this.stat_fix_lvl}`
                            case "Battle":      return `Level ${this.mapper.properties.battle.player.active_pokemon.level.value}`
                        }
                    }
                    case "Badge Boosts": return `Level ${this.mapper.properties.player.team[0].level.value}`
                }
            }
        },
        growth_rate() {
            return this.g4PokemonData[this.starter].growth_rate
        },
        filtered_pokemon_list() {
            if (this.search_term === '') {
                return this.pokemon_list;
            } else {
                return this.pokemon_list.filter(pokemon => pokemon.toLowerCase().includes(this.search_term.toLowerCase()));
            }
        },
        filtered_trainer_list() {
            if (this.search_trainers === '') {
                return this.hgss_trainers;
            } else {
                return this.hgss_trainers.filter(pokemon => pokemon.toLowerCase().includes(this.search_trainers.toLowerCase()));
            }
        },
        exp_label_percentage() {
            switch (this.state) {
                case "No Pokemon":
                    return "0%";
                case "Battle":
                    return "0%";
                case "From Battle":
                    return "0%";
                case "To Battle":
                    return "0%";
                case "Overworld":
                    return "0%";
            }
        },
        gametimeSplit() {
            h = this.mapper.properties.game_time.hours.value
            m = this.mapper.properties.game_time.minutes.value
            timecode = h + ":" + m.toString().padStart(2, "0")
            return timecode
        },
        game() {
            const game = this.mapper.properties.meta.game_name.value
            if (game == 'Platinum') { return this.game_variables['Platinum']; }
            if (game == 'HeartGold and SoulSilver') { return this.game_variables['HeartGold and SoulSilver']; }
        },
        enemy_mon_static() {
            const opponent_id = this.mapper.properties.battle.opponent.id.value
            const object      = this.selected_game == 'Platinum' ? this.platinum_trainers[opponent_id].party : 
                this.selected_game == 'HeartGold and SoulSilver' ? this.trainers_hgss[opponent_id].party :
                this.trainers_dp[opponent_id].party
            return object
        },
        enemy_2_mon_static() {
            const opponent_id = this.mapper.properties.battle.opponent_2?.trainer?.bytes
            const object      = this.platinum_trainers[opponent_id].party
            return object
        },
        heldItem() {
            const state = this.mapper.properties.meta.state.value
            if (this.mapper.properties.player?.team[0]?.held_item?.value == "Never-Melt Ice") { return "NeverMeltIce"}
            switch (state) {
                case "Battle":
                    return this.mapper.properties.battle.player.active_pokemon.held_item.value
                default:
                    return this.mapper.properties.player.team[0].held_item.value
            }
        },
        enemy_graphic() {
            const state = this.mapper.properties.meta.state.value
            let show = false
            let delay = false
            let trainer = this.mapper?.properties.battle.opponent.trainer?.value ?? "none"
            let id = this.mapper?.properties.battle.opponent.id.value
            if (id == 0) { 
                return false 
            }
            switch (trainer) {
                // case "School Kid Christine": delay = true; break; // test case
                case "Leader Roark":         delay = true; break;
                case "Leader Gardenia":      delay = true; break;
                case "Leader Fantina":       delay = true; break;
                case "Leader Maylene":       delay = true; break;
                case "Leader Wake":          delay = true; break;
                case "Leader Byron":         delay = true; break;
                case "Leader Candice":       delay = true; break;
                case "Leader Volkner":       delay = true; break;
                case "Commander Mars":       delay = true; break;
                case "Commander Jupiter":    delay = true; break;
                case "Commander Saturn":     delay = true; break;
                case "Galactica Boss Cyrus": delay = true; break;
                case "Elite Four Aaron":     delay = true; break;
                case "Elite Four Bertha":    delay = true; break;
                case "Elite Four Flint":     delay = true; break;
                case "Elite Four Lucian":    delay = true; break;
                case "Champion Cynthia":     delay = true; break;
                default: delay = false; break;
            }
            if (this.mapper.properties.battle.opponent.trainer.value != null) {
                show = true
            }
            
            // console.log(show, delay, trainer, this.mapper.properties.battle.opponent.trainer.value, this.mapper.properties.meta.state.value)
            if (delay == true && state == `Battle`) {
                return true
            }
            else if (delay == true && state == `From Battle`) {
                return true
            }
            else if (delay == false && state == `Battle`) {
                return true
            }
            else {
                return false
            }
        },
        wild_pokemon() {
            if (this.wild_pokemon_display == false) { return false}
            const state = this.mapper?.properties.meta.state.value
            const id = this.mapper?.properties.battle.opponent.id.value
            if (id == 0 && (state == `Battle` && state == `From Battle`)) {
                return true
            }
            else {
                return false
            }
        },
        battlePokemonCrop() {
            let totalPokemon = 0
            const heights = {
                1: "233px",
                2: "399px",
                3: "566px",
                4: "733px",
                5: "898px",
                6: "1080px"
              };
            if (this.right_display == 'Trainer') {
                totalPokemon = this.examined_trainer_data?.party?.length ?? 0
                return `height: ${heights[totalPokemon]}; filter: saturate(${this.ui_saturation}) drop-shadow(0px 0px 1px #000000)`;
            }
            totalPokemon = this.mapper.properties.battle.opponent.team_count.value;
            let game = this.mapper.properties.meta.game_name.value
            let opponent_2            = this.mapper.properties.battle.opponent_2.trainer.value
            let opponent_team_count   = this.mapper.properties.battle.opponent.team_count.value;
            let opponent_2_team_count = this.mapper.properties.battle.opponent_2.team_count.value;
            if (opponent_2 && game != "HeartGold and SoulSilver") {
                totalPokemon = opponent_team_count + opponent_2_team_count
            }
            return `height: ${heights[totalPokemon]}; filter: saturate(${this.ui_saturation}) drop-shadow(0px 0px 1px #000000)`;
        },
        play() {
            if (this.mapper.properties.battle.player) {
                return this.mapper.properties.battle.player
            }
        },
        wild() {
            if (this.mapper.properties.battle.wild) {
                return this.mapper.properties.battle.wild
            }
        },
        oppA() {
            if (this.mapper.properties.battle.opponent) {
                return this.mapper.properties.battle.opponent
            }
        },
        oppB() {
            if (this.mapper.properties.battle.opponentB) {
                return this.mapper.properties.battle.opponent_2
            }
        },
        ally() {
            if (this.mapper.properties.battle.ally) {
                return this.mapper.properties.battle.ally
            }
        },
        trainerData() {
            if (this.mapper.properties.meta.game_name.value == "Platinum") { return this.platinum_trainers }
            else if (this.mapper.meta.game_name == "HeartGold and SoulSilver") { return }
            else { return }
        },
        solo_mon() {
            const state = this.mapper.properties.meta.state.value
            if (state == `Battle` || state == `From Battle`) {
                return this.mapper?.properties?.battle?.player?.active_pokemon
            }
            else if (state == `No Pokemon` || this.mapper?.properties?.player?.team[0]?.species?.value == null || this.mapper?.properties?.battle?.player?.team_count?.value == 0) {
                var data = this.g4PokemonData[this.starter]
                return {
                    species: { value: this.starter },
                    status_condition: { value: null },
                    ...data
                }
            }
            else {
                return this.mapper?.properties?.player?.team[0]
            }
        },
        solo_mon_exp() {
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper?.properties?.battle?.player?.active_pokemon
            }
            else if (this.mapper.properties.meta.state.value == `No Pokemon` || this.mapper?.properties?.player?.team[0]?.species?.value == null || this.mapper?.properties?.battle?.player?.team_count?.value == 0) {
                // var data = this.g4PokemonData[this.starter]
                // return {
                //     species: { value: data["name"] },
                //     ...data
                // }
                return this.g4PokemonData[this.starter]
            }
            else {
                return this.mapper?.properties?.player?.team[0]
            }
        },
        moveRouting() {
            const gamestate    = this.mapper.properties.meta.state.value
            const team_pid     = this.mapper?.properties.battle.player.active_pokemon.internals.personality_value.value
            const battle_pid   = this.mapper?.properties.player.team[0].internals.personality_value.value
            const battle_moves = this.mapper.properties.battle.player.active_pokemon.moves
            const team_moves   = this.mapper.properties.player.team[0].moves
            debugger
            if (gamestate == `Overworld` && team_pid != battle_pid) {
                return team_moves
            }
            if (gamestate == `Battle`) {
                return battle_moves
            }
            if (gamestate == `From Battle`) {
                return team_moves
            }
            if (gamestate == `No Pokemon`) {
                return team_moves
            }
        },
        stats_location() {
            if (this.mapper.properties.meta.state.value == "Battle") {
                return "Battle Stats"
            }
            if (this.mapper.properties.meta.state.value == "Overworld") {
                return "Party Stats"
            }
            if (this.mapper.properties.meta.state.value == "No Pokemon") {
                return "No Pokemon"
            }
        },
        enemyTrainer() {
            return this.remakeTrainers[this.mapper.properties.battle.trainer.id.value]
        },
        s1() {
            return this.mapper?.properties?.player?.team[0]
        },
        map() {
            return this.mapper?.properties
        },
        batt() {
            return this.mapper?.properties?.battle
        },
        battEn() {
            return this.mapper?.properties?.battle?.opponent?.active_pokemon
        },
        s1dynamic() {
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper?.properties?.battle?.player?.active_pokemon
            }
            else {
                return this.mapper?.properties?.player?.team[0]
            }
        },
        typeHeaderColor() {
            return
            // if (this.mapper.properties.meta.state.value == `Battle`) { return this.mapper.properties.battle.yourPokemon.type2.value }
            // if (this.mapper.properties.meta.state.value == `Overworld`) { return this.g4PokemonData[this.mapper.properties.player.team[0].species.value].type_2 }
            // if (this.mapper.properties.meta.state.value == `No Pokemon`) { return this.g4PokemonData[this.starter].type_2}
            // else { return }
            // else { return this.g4PokemonData[this.starter].type_2}
        },
        //BATTLE FADE
        battle_fade() {
            if (
            (this.batt.trainer.class.value == "WILL" ||
            // this.batt.trainer.class.value == "CLAIR" ||
            this.batt.trainer.class.value == "KOGA" ||
            this.batt.trainer.class.value == "BRUNO" ||
            this.batt.trainer.class.value == "KAREN" ||
            this.batt.trainer.class.value == "CHAMPION") &&
            (this.mapper.properties.meta.state.value == "To Battle" ||
            this.mapper.properties.meta.state.value == "Battle" ||
            this.mapper.properties.meta.state.value == "From Battle")
            ) {
                return true
            }
            else if (
            this.mapper.properties.meta.state.value == "To Battle" ||
            this.mapper.properties.meta.state.value == "Battle") {
                return true
            }
            else {
                return false
            }
        },
        // SCREENS
        screen_weather() { // [statusReflect, reflectCount, statusLightScreen, LightScreenCount, weather, weatherCount, showPopUp]
            var fieldArray = [null, null, null, null, null, null, false]
            if (this.batt.field.weather.value != null) {
                fieldArray[4] = this.batt.field.weather.value
                fieldArray[5] = this.batt.field.weather_count.value
                fieldArray[6] = true
            }
            if (this.batt.field.player.reflect.value == true) {
                fieldArray[2] = "Reflect"
                fieldArray[3] = this.batt.field.player.reflect_count.value
                fieldArray[6] = true
            }
            if (this.batt.field.player.lightscreen.value == true) {
                fieldArray[0] = "Light Screen"
                fieldArray[1] = this.batt.field.player.lightscreen_count.value
                fieldArray[6] = true
            }
            return fieldArray
        },
        //SELECT THE RELEVANT FIELD MOVE
        field_selector() {
            var reflect = [this.batt.field.player?.reflect_count?.value, this.batt.field?.player?.reflect?.value, "Reflect"]
            var lightscreen = [this.batt.field?.player?.lightscreen_count?.value, this.batt.field?.player?.lightscreen?.value, "Light Screen"]
            var safeguard = [this.batt.field?.player?.safeguard_count?.value, this.batt.field?.player?.safeguard?.value, "Safeguard"]
            var weather = [this.batt.field?.weather_count?.value, this.weather_boolean, this.pascalCaseSpace(this.capitalization_format(this.batt.field?.weather?.value?.toLowerCase()))]
            var comparison = [reflect, lightscreen, safeguard, weather]
            var maxArr = [0, false, ""]
            for(var i = 0; i < comparison.length; i++) {
                if ((comparison[i][0])) {
                    if(maxArr[0] < comparison[i][0]) {
                        maxArr = comparison[i];
                    }
                }
            }
            return maxArr
        },
        weather_boolean() {
            if (this.batt.field?.weather?.value == "Sun" || this.batt.field?.weather?.value == "Rain" || this.batt.field?.weather?.value == "Sandstorm") {
                return true
            }
            else {
                return false
            }
        },
        pkmnGrowthRate() {
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_MEDIUM_SLOW`) { return "Medium Slow" }
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_MEDIUM_FAST`) { return "Medium Fast" }
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_SLOW`) { return "Slow" }
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_FAST`) { return "Fast" }
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_FLUCTUATING`) { return "Fluctuating" }
            if (this.g4PokemonData[this.starter].growth_rate == `GROWTH_ERRATIC`) { return "Erratic" }
        },
        field_effect_array() {
            var effect_array = [
                ["Reflect", false, 0,],
                ["Light Screen", false, 0,],
                ["Safeguard", false, 0,],
                [this.mapper.properties.battle.field.weather.value, false, 0,],
            ]
            if (this.mapper.properties.meta.state.value == `Battle`) {
                effect_array[0][1] = this.batt.field.player.reflect?.value
                effect_array[0][2] = this.batt.field.player.reflect_count?.value
                effect_array[1][1] = this.batt.field.player.lightscreen?.value
                effect_array[1][2] = this.batt.field.player.lightscreen_count?.value
                effect_array[2][1] = this.batt.field.player.safeguard?.value
                effect_array[2][2] = this.batt.field.player.safeguard_count?.value
                effect_array[3][1] = this.batt.field.weather?.value
                effect_array[3][2] = this.batt.field.weather_count?.value
            }
            return effect_array
        },
        field_effect_first_expiring() {
            var field_effect_most_recent_array = ["Reflect", false, 6,]
            for(var i = 0; i < this.field_effect_array.length; i++) {
                if (this.field_effect_array[i][2] < field_effect_most_recent_array[2] && this.field_effect_array[i][2] != 0) {
                    field_effect_most_recent_array = this.field_effect_array[i]
                }
            }
            if (this.field_effect_array[0][2] == 0 && this.field_effect_array[1][2] == 0 && this.field_effect_array[2][2] == 0 && this.field_effect_array[3][2] == 0) {
                field_effect_most_recent_array = [this.last_initiated_field_effect, false, 0]
            }
            return field_effect_most_recent_array
        },
        starting_type_fix() {
            if (this.g4PokemonData[this.starter]?.type_1?.toLowerCase() != this.g4PokemonData[this.starter]?.type_2?.toLowerCase()) {
                return this.g4PokemonData[this.starter]?.type_1?.toLowerCase()
            }
            else {
                return this.g4PokemonData[this.starter]?.type_2?.toLowerCase()
            }
        },
        effortValues() {
            let evHp  = this.mapper.properties.player.team[0].evs.hp.value
            let evAtk = this.mapper.properties.player.team[0].evs.attack.value
            let evDef = this.mapper.properties.player.team[0].evs.defense.value
            let evSpe = this.mapper.properties.player.team[0].evs.speed.value
            let evSpA = this.mapper.properties.player.team[0].evs.special_attack.value
            let evSpD = this.mapper.properties.player.team[0].evs.special_defense.value
            let sum = evHp + evAtk + evDef + evSpe + evSpA + evSpD
            return {
                totalEvs: sum,
                maximumEvs: 510,
                remaining: 510 - sum,
                percentage: this.decimalToPercentage(sum/510)
            }
        },
        dropdownDownMenuKeys() {
            return {
                textures: Object.keys(this.textures)
            }
        },
        pokemonArtOpacity() {
            // Return opacity for Pokemon art during evolution transition
            if (this.evolution_transitioning) {
                // Fade out old, fade in new
                return 1 - this.evolution_transition_progress;
            }
            return 1;
        },
        pokemonArtTransition() {
            // Return transition style for Pokemon art
            if (this.evolution_transitioning) {
                return 'opacity 1s ease-in-out';
            }
            return '';
        },
        movepoolOpacity() {
            // Return opacity for movepool during evolution transition only
            // Battle transitions are handled by Vue's transition component
            if (this.evolution_transitioning) {
                return 1 - this.evolution_transition_progress;
            }
            
            // For non-evolution transitions, don't set opacity (let Vue transition handle it)
            // Return 1 so it's visible when rendered, Vue transition will handle fade in/out
            return 1;
        },
        movepoolTransition() {
            // Return transition style for movepool
            // During evolution transitions, use longer transition
            if (this.evolution_transitioning) {
                return 'opacity 1s ease-in-out';
            }
            
            // For battle state changes, return empty string to use default in template
            // The template will fall back to 'opacity 0.5s ease-in-out' if this is empty
            return '';
        },
        statsDisplaySpecies() {
            // Return the species to display stats for
            // If showing evolved base stats (temporary after evolution), use the evolved species
            if (this.show_evolved_base_stats && this.evolved_species_for_stats) {
                return this.evolved_species_for_stats;
            }
            // When evolution is enabled, use the selected evolution family species for base stats
            if (this.evolution && this.selected_evolution_species) {
                return this.selected_evolution_species;
            }
            return this.starter;
        },
        displayedPokemonSpecies() {
            // Return the Pokemon species to display in the art
            // When evolution is enabled, use selected_evolution_species from dropdown
            // Otherwise, use starter
            if (this.evolution && this.selected_evolution_species) {
                return this.selected_evolution_species;
            }
            return this.starter;
        },
    },

    methods: { 
        get_trainer_name(trainer_name, trainer_id) {
            // console.log(trainer_name, trainer_id)
            switch (trainer_id) {
                case 850: return 'Rival 1'
                case 851: return 'Rival 1'
                case 852: return 'Rival 1'
                case 247: return 'Rival 2'
                case 248: return 'Rival 2'
                case 249: return 'Rival 2'
                case 470: return 'Rival 3'
                case 471: return 'Rival 3'
                case 472: return 'Rival 3'
                case 473: return 'Rival 4'
                case 474: return 'Rival 4'
                case 475: return 'Rival 4'
                case 476: return 'Rival 5'
                case 477: return 'Rival 5'
                case 478: return 'Rival 5'
                case 479: return 'Rival 6'
                case 480: return 'Rival 6'
                case 481: return 'Rival 6'
                case 295: return 'Mars 1'
                case 405: return 'Mars 2'
                case 528: return 'Mars 3'
                case 926: return 'Mars 4'
                case 406: return 'Jupiter 1'
                case 407: return 'Jupiter 2'
                case 927: return 'Jupiter 3'
                case 408: return 'Saturn 1'
                case 409: return 'Saturn 2'
                case 403: return 'Cyrus 1'
                case 404: return 'Cyrus 2'
                case 913: return 'Cyrus 3'
                default : return trainer_name
            }
        },
        getUnobtainableMoveStyle(move_object, type_of_move) {
            const unobtainable_moves_toggle = this.unobtainable_moves_toggle
            const state = this.mapper.properties.meta.state.value
            const move_name = this.move_name(move_object.Move)
            const unobtainable_moves = this.unobtainable_moves_object[type_of_move] || []
            const opacity = 0.4
            const animation_duration = 1.5 // seconds
            let unobtainable_moves_first_run = (this.attempt_number > 1 || this.banned_hidden_power == false) ? [] : (this.unobtainable_moves_object['First Playthrough'] || [])

            if (unobtainable_moves_toggle == "Never Cross Out") {
                return `transition: opacity ${animation_duration}s;`
            }
            else if (state != "No Pokemon" && unobtainable_moves_toggle == "Cross Out When Starter is Obtained" && (unobtainable_moves.includes(move_name) || unobtainable_moves_first_run.includes(move_name))) {
                return `transition: opacity ${animation_duration}s; opacity: ${opacity}; text-decoration: line-through;`
            }
            else if (this.mapper.properties.player.badges[0].value == true && unobtainable_moves_toggle == "Cross Out After First Badge" && (unobtainable_moves.includes(move_name) || unobtainable_moves_first_run.includes(move_name))) {
                return `transition: opacity ${animation_duration}s; opacity: ${opacity}; text-decoration: line-through;`
            }
            else if (unobtainable_moves_toggle == "Always Cross Out" && (unobtainable_moves.includes(move_name) || unobtainable_moves_first_run.includes(move_name))) {
                return `transition: opacity ${animation_duration}s; opacity: ${opacity}; text-decoration: line-through;`
            }
            else {
                return `transition: opacity ${animation_duration}s;`
            }
        },
        // Evolution family helper functions
        getFullyEvolvedSpecies(species) {
            // Get the fully evolved species from the evolution family
            // This is the species with method == null and parameter == null (or the last one)
            if (!this.g4PokemonData || !species) {
                return species;
            }
            const evolution_family = this.g4PokemonData[species]?.evolution_family;
            if (!evolution_family || evolution_family.length === 0) {
                return species; // If no evolution family, return the species itself
            }
            
            // Find the fully evolved species (the one with no method/parameter, or the last one)
            let fullyEvolved = species;
            for (const member of evolution_family) {
                if (member.method == null && member.parameter == null) {
                    fullyEvolved = member.species;
                }
            }
            // If we didn't find one with null method, get the last one
            if (fullyEvolved === species && evolution_family.length > 0) {
                fullyEvolved = evolution_family[evolution_family.length - 1].species;
            }
            return fullyEvolved;
        },
        getEvolutionFamily(species) {
            // Get the list of species in the evolution family
            if (!this.g4PokemonData || !species) {
                return [species];
            }
            const evolution_family = this.g4PokemonData[species]?.evolution_family;
            if (!evolution_family || evolution_family.length === 0) {
                return [species]; // If no evolution family, return just the species
            }
            return evolution_family.map(member => member.species).filter(s => s != null);
        },
        getStorageKey(species, useEvolutionLine = false) {
            // Get the storage key for a species
            // If useEvolutionLine is true, use "FullyEvolved-line-Species" format
            // Otherwise, use just the species name
            if (!useEvolutionLine) {
                return `${this.mapper?.properties?.meta?.game_name?.value || this.selected_game}_${species}`;
            }
            
            const fullyEvolved = this.getFullyEvolvedSpecies(species);
            return `${this.mapper?.properties?.meta?.game_name?.value || this.selected_game}_${fullyEvolved}-line-${species}`;
        },
        getEvolutionFamilyStorageKey(species) {
            // Get the storage key for the entire evolution family (shared settings like ability, nature, gender)
            // Format: "Game_FullyEvolved-line" (e.g., "Black_Unfezant-line")
            const fullyEvolved = this.getFullyEvolvedSpecies(species);
            return `${this.mapper?.properties?.meta?.game_name?.value || this.selected_game}_${fullyEvolved}-line`;
        },
        getSplitFileName() {
            // Get the filename for split files
            // If evolution is enabled, use "FullyEvolved-line" format
            // Otherwise, use the species name
            if (!this.evolution) {
                return this.starter;
            }
            const fullyEvolved = this.getFullyEvolvedSpecies(this.starter);
            return `${fullyEvolved}-line`;
        },
        getCurrentStorageKey() {
            // Get the current storage key based on whether evolution is enabled and which species is selected
            if (this.evolution && this.selected_evolution_species) {
                return this.getStorageKey(this.selected_evolution_species, true);
            }
            return this.getStorageKey(this.starter, false);
        },
        async transfer_metrics(previous_mon_resets, previous_mon_blackouts, previous_mon_finished_runs, previous_mon_attempt_number) {
            await this.sleep(50)
            this.playerResets = previous_mon_resets
            this.blackout_counter = previous_mon_blackouts
            this.finished_run_count = previous_mon_finished_runs
            this.attempt_number = previous_mon_attempt_number
        },
        freezeEncounters() {
            const catch_state = this.mapper.properties.patch.stpCatchRate.value
            // Catch rate logic is not implemented yet within generation 4
            if (catch_state == 0 && this.catch_rate == true) { 
                this.mapper.properties.patch.stpCatchRate.set(1,false); 
            }
        },
        async disallow_faults_function() {
            this.disallow_faults = true
            await this.sleep(this.disallow_delay)
            this.disallow_faults = false
        },
        enemy_status(status) {
            switch (status) {
                case "Paralyzed"     : return "PRZ"
                case "Burned"        : return "BRN"
                case "Frozen"        : return "FRZ"
                case "Asleep"        : return "SLP"
                case "Poisoned"      : return "PSN"
                case "Badly Poisoned": return "PSN"
                default: return ""
            }
        },
        async update_rom_starter_and_intro_mon() {
            let starter = this.starter
            let game = this.selected_game
            if (game == "Platinum") {
                await Promise.all([
                    this.mapper.properties.patch.stpStarterSpecies.set(starter, true), 
                ])
            }
            if (game == "HeartGold and SoulSilver") {
                await Promise.all([
                    this.mapper.properties.patch.stpStarterSpecies.set(starter, true), 
                ])
            }
        },
        async update_items() {
            var item1 = this.item1_replacement
            var item2 = this.item2_replacement
            var item3 = this.item3_replacement
            var item4 = this.item4_replacement
            await this.mapper.properties.bag.medicine[0].item.set(item1, false)
            await this.mapper.properties.bag.medicine[0].quantity.set(99, false)
            await this.mapper.properties.bag.medicine[1].item.set(item2, false)
            await this.mapper.properties.bag.medicine[1].quantity.set(99, false)
            await this.mapper.properties.bag.medicine[2].item.set(item3, false)
            await this.mapper.properties.bag.medicine[2].quantity.set(99, false)
            await this.mapper.properties.bag.medicine[3].item.set(item4, false)
            await this.mapper.properties.bag.medicine[3].quantity.set(99, false)
        },
        async update_moveset() {
            const move_data = this.cross_generation_moves.g4
            var move1 = this.move_name(this.move1_replacement)
            var move2 = this.move_name(this.move2_replacement)
            var move3 = this.move_name(this.move3_replacement)
            var move4 = this.move_name(this.move4_replacement)
            var pp1   = move_data[this.move_name(move1)]
            var pp2   = move_data[this.move_name(move2)]
            var pp3   = move_data[this.move_name(move3)]
            var pp4   = move_data[this.move_name(move4)]
            if (move1 != "") {
                await this.mapper.properties.player.team[0].moves[0].move.set(move1, false)
                await this.mapper.properties.player.team[0].moves[0].pp.set(pp1["PP"], false)
            }
            if (move2 != "") {
                await this.mapper.properties.player.team[0].moves[1].move.set(move2, false)
                await this.mapper.properties.player.team[0].moves[1].pp.set(pp2["PP"], false)
            }
            if (move3 != "") {
                await this.mapper.properties.player.team[0].moves[2].move.set(move3, false)
                await this.mapper.properties.player.team[0].moves[2].pp.set(pp3["PP"], false)
            }
            if (move4 != "") {
                await this.mapper.properties.player.team[0].moves[3].move.set(move4, false)
                await this.mapper.properties.player.team[0].moves[3].pp.set(pp4["PP"], false)
            }
        },
        async update_battle_moveset() {
            if (this.mapper.properties.meta.state.value == "Battle") {
                const move_data = this.cross_generation_moves.g4
                var move1 = this.move_name(this.move1_replacement)
                var move2 = this.move_name(this.move2_replacement)
                var move3 = this.move_name(this.move3_replacement)
                var move4 = this.move_name(this.move4_replacement)
                var pp1   = move_data[this.move_name(move1)]
                var pp2   = move_data[this.move_name(move2)]
                var pp3   = move_data[this.move_name(move3)]
                var pp4   = move_data[this.move_name(move4)]
                if (move1 != "") {
                    await this.mapper.properties.battle.player.active_pokemon.moves[0].move.set(move1, false)
                    await this.mapper.properties.battle.player.active_pokemon.moves[0].pp.set(pp1["PP"], false)
                    await this.mapper.properties.battle.player.team[0].moves[0].move.set(move1, false)
                    await this.mapper.properties.battle.player.team[0].moves[0].pp.set(pp1["PP"], false)
                }
                if (move2 != "") {
                    await this.mapper.properties.battle.player.active_pokemon.moves[1].move.set(move2, false)
                    await this.mapper.properties.battle.player.active_pokemon.moves[1].pp.set(pp2["PP"], false)
                    await this.mapper.properties.battle.player.team[0].moves[1].move.set(move2, false)
                    await this.mapper.properties.battle.player.team[0].moves[1].pp.set(pp2["PP"], false)
                }
                if (move3 != "") {
                    await this.mapper.properties.battle.player.active_pokemon.moves[2].move.set(move3, false)
                    await this.mapper.properties.battle.player.active_pokemon.moves[2].pp.set(pp3["PP"], false)
                    await this.mapper.properties.battle.player.team[0].moves[2].move.set(move3, false)
                    await this.mapper.properties.battle.player.team[0].moves[2].pp.set(pp3["PP"], false)
                }
                if (move4 != "") {
                    await this.mapper.properties.battle.player.active_pokemon.moves[3].move.set(move4, false)
                    await this.mapper.properties.battle.player.active_pokemon.moves[3].pp.set(pp4["PP"], false)
                    await this.mapper.properties.battle.player.team[0].moves[3].move.set(move4, false)
                    await this.mapper.properties.battle.player.team[0].moves[3].pp.set(pp4["PP"], false)
                }
            }
            else { return }
        },
        hgss_badge_check(x) {
            const badge          = this.mapper.properties.player.badges[x].value
            const state          = this.mapper.properties.meta.state.value          
            const global_pointer = this.mapper.properties.meta.global_pointer.value
            // console.log(global_pointer)
            if (badge == true && state!= `No Pokemon`) {
                return true
            }
            else {
                return false
            }
        },
        voltorb_flip_style(voltorb_flip_card_value) {
            if (voltorb_flip_card_value == 2 || voltorb_flip_card_value == 3) {
                return "opacity: .9; filter: saturate(150%);"
            }
            if (voltorb_flip_card_value == 1) {
                return "opacity: .9; filter: grayscale(100%);"
            }
            if (voltorb_flip_card_value == 'Voltorb') {
                return "opacity: .20; filter: grayscale(100%);"
            }
        },
        stripBeforeUnderscore(inputString) {
            const underscoreIndex = inputString.indexOf('_');
            if (underscoreIndex === -1) {
                return inputString; // Return the original string if no underscore is found
            }
            return inputString.substring(underscoreIndex + 1);
        },
        extractTrainerInfo(trainers) {
            const result = [];
            for (const key in trainers) {
                if (trainers.hasOwnProperty(key)) {
                    const trainer = trainers[key];
                    const infoString = `${trainer.name}_${trainer.rom_id}`;
                    result.push(infoString);
                }
            }
            return result;
        },
        // Open the folder ./splits/ in the file explorer with node.js
        openFolder(folderName) {
            require('child_process').exec(`start .\\${folderName}\\`);
        },
        average_median_stats(stat_label) {
            let sum = 0;
            let count = 0;
            let values = [];
            
            for (let pokemon of Object.values(this.g4PokemonData)) {
                let stat = pokemon[`base_${stat_label}`];
                sum += stat;
                count++;
                values.push(stat);
            }
            
            let average = sum / count;
            
            values.sort((a, b) => a - b);
            let median;
            let midIndex = Math.floor(values.length / 2);
            
            if (values.length % 2 === 0) {
                median = (values[midIndex - 1] + values[midIndex]) / 2;
            } else {
                median = values[midIndex];
            }
            return {
                average: Math.round(average),
                median : Math.round(median),
            };
        },
        natureLabels(nature) {
            let output = nature + ": ";
            // let pad = 7 - nature.length;
            // output+="-".repeat(pad) + ": "
            switch(this.natures[nature].raises) {
                case "Attack":
                    output+= "+Attack";
                    break;
                case "Defense":
                    output+= "+Defense";
                    break;
                case "Special Attack":
                    output+= "+Sp. Atk";
                    break;
                case "Special Defense":
                    output+= "+Sp. Def";
                    break;
                case "Speed":
                    output+= "+Speed";
                    break;
                default:
                    output+= "Neutral";
                    break;
            }
            switch(this.natures[nature].lowers) {
                case "Attack":
                    output+= " | -Attack";
                    break;
                case "Defense":
                    output+= " | -Defense";
                    break;
                case "Special Attack":
                    output+= " | -Sp. Atk";
                    break;
                case "Special Defense":
                    output+= " | -Sp. Def";
                    break;
                case "Speed":
                    output+= " | -Speed";
                    break;
                default:
                    break;
            }
            return output;
        },
        get_iv(stat_name) {
            const state = this.mapper.properties.meta.state.value
            let iv_hp  = this.mapper.properties.player.team[0].ivs.hp.value
            let iv_atk = this.mapper.properties.player.team[0].ivs.attack.value
            let iv_def = this.mapper.properties.player.team[0].ivs.defense.value
            let iv_spa = this.mapper.properties.player.team[0].ivs.special_attack.value
            let iv_spd = this.mapper.properties.player.team[0].ivs.special_defense.value
            let iv_spe = this.mapper.properties.player.team[0].ivs.speed.value
            switch (stat_name) {
                case "Hp":
                    return iv_hp
                case "Attack":
                    return iv_atk
                case "Defense":
                    return iv_def
                case "Special Attack":
                    return iv_spa
                case "Special Defense":
                    return iv_spd
                case "Speed":
                    return iv_spe
            }
        },
        get_stat() {
            const state = this.mapper.properties.meta.state.value
            const held_item = this.mapper.properties.player.team[0].held_item.value
            var ability = this.pkmn_ability
            var status_condition = this.mapper.properties.player.team[0].status_condition.value


            var starter = this.evolution ? this.selected_evolution_species : this.starter

            function choice_specs(stat) {
                return Math.floor(stat * 1.5)
            }
            let HP  = 0
            let Atk = 0
            let Def = 0
            let SpA = 0
            let SpD = 0
            let SpE = 0
            // const active_pokemonPv = this.mapper.properties.battle.player.active_pokemon.internals.personality_value
            // const teamPokemonPv = this.mapper.properties.player.team[0].internals.personality_value
            if (state == `Overworld` || state == `To Battle`) {
                HP = this.mapper.properties.player.team[0].stats.hp_max.value
                Atk = this.mapper.properties.player.team[0].stats.attack.value
                Def = this.mapper.properties.player.team[0].stats.defense.value
                SpA = held_item == 'Choice Specs' ? choice_specs(this.mapper.properties.player.team[0].stats.special_attack.value) : this.mapper.properties.player.team[0].stats.special_attack.value
                SpD = this.mapper.properties.player.team[0].stats.special_defense.value
                SpE = this.mapper.properties.player.team[0].stats.speed.value
                if (status_condition && ability == 'Quick Feet') {
                    SpE = Math.floor(SpE * 1.5)
                }
                if (status_condition == 'Paralyzed' && ability != 'Quick Feet') {
                    SpE = Math.floor(SpE / 4)
                }

                if (ability == 'Slow Start') {
                    Atk = Math.floor(Atk * 0.5)
                    SpE = Math.floor(SpE * 0.5)
                }
                if (this.stat_fix_toggle_2 > 0) {
                    this.stat_fix_toggle_2 -= 1
                    HP = this.stat_fix_hp
                    Atk = this.stat_fix_hp
                    Def = this.stat_fix_hp
                    SpA = this.stat_fix_hp
                    SpD = this.stat_fix_hp
                    SpE = this.stat_fix_hp
                    return {
                        "Hp" : HP,
                        "Atk": Atk,
                        "Def": Def,
                        "SpA": SpA,
                        "SpD": SpD,
                        "Spe": SpE
                    }
                }
                return {
                    "Hp" : HP,
                    "Atk": Atk,
                    "Def": Def,
                    "SpA": SpA,
                    "SpD": SpD,
                    "Spe": SpE,
                }
            }
            if (state == `Battle`) {
                this.stat_fix_toggle = true
                ability = this.mapper.properties.battle.player.active_pokemon.ability.value
                const turn_count = this.mapper.properties.battle.turn_counter.value

                const mod_atk = this.mapper.properties.battle.player.active_pokemon.modifiers.attack.value
                const mod_def = this.mapper.properties.battle.player.active_pokemon.modifiers.defense.value
                const mod_spa = this.mapper.properties.battle.player.active_pokemon.modifiers.special_attack.value
                const mod_spd = this.mapper.properties.battle.player.active_pokemon.modifiers.special_defense.value
                const mod_spe = this.mapper.properties.battle.player.active_pokemon.modifiers.speed.value
                HP  = this.mapper.properties.battle.player.active_pokemon.stats.hp_max.value
                Atk = this.mapper.properties.battle.player.active_pokemon.stats.attack.value
                Def = this.mapper.properties.battle.player.active_pokemon.stats.defense.value
                SpA = this.mapper.properties.battle.player.active_pokemon.stats.special_attack.value
                SpD = this.mapper.properties.battle.player.active_pokemon.stats.special_defense.value
                SpE = this.mapper.properties.battle.player.active_pokemon.stats.speed.value
                if (status_condition == 'Paralyzed') {
                    SpE = Math.floor(SpE / 4)
                }
                if (ability == 'Slow Start' && turn_count < 5) {
                    Atk = Math.floor(Atk * 0.5)
                    SpE = Math.floor(SpE * 0.5)
                }
                let battle_hp  = HP
                let battle_atk = Math.floor(Atk * this.stageModifiersData.stats[mod_atk])
                let battle_def = Math.floor(Def * this.stageModifiersData.stats[mod_def])
                let battle_spa = Math.floor(SpA * this.stageModifiersData.stats[mod_spa])
                let battle_spd = Math.floor(SpD * this.stageModifiersData.stats[mod_spd])
                let battle_spe = Math.floor(SpE * this.stageModifiersData.stats[mod_spe])
                return {
                    "Hp" : battle_hp,
                    "Atk": battle_atk,
                    "Def": battle_def,
                    "SpA": battle_spa,
                    "SpD": battle_spd,
                    "Spe": battle_spe,
                }
            }
            if (state == `From Battle`) {
                if (this.stat_fix_toggle = true) {
                    this.stat_fix_toggle = false
                    HP = this.mapper.properties.battle.player.active_pokemon.stats.hp_max.value
                    Atk = this.mapper.properties.battle.player.active_pokemon.stats.attack.value
                    Def = this.mapper.properties.battle.player.active_pokemon.stats.defense.value
                    SpA = held_item == 'Choice Specs' ? choice_specs(this.mapper.properties.battle.player.active_pokemon.stats.special_attack.value) : this.mapper.properties.battle.player.active_pokemon.stats.special_attack.value
                    SpD = this.mapper.properties.battle.player.active_pokemon.stats.special_defense.value
                    SpE = this.mapper.properties.battle.player.active_pokemon.stats.speed.value
                    if (status_condition == 'Paralyzed') {
                        SpE = Math.floor(SpE / 4)
                    }
                    if (ability == 'Slow Start') {
                        Atk = Math.floor(Atk * 0.5)
                        SpE = Math.floor(SpE * 0.5)
                    }
                    if (this.mapper.properties.battle.player.active_pokemon.stats.defense.value < 2000) {
                        this.stat_fix_lvl = this.mapper.properties.battle.player.active_pokemon.level.value
                        this.stat_fix_hp  = HP
                        this.stat_fix_atk = Atk
                        this.stat_fix_def = Def
                        this.stat_fix_spa = SpA
                        this.stat_fix_spd = SpD
                        this.stat_fix_spe = SpE
                        this.stat_fix_toggle_2 = 500
                    }
                }
                return {
                    "Hp" : this.stat_fix_hp,
                    "Atk": this.stat_fix_atk,
                    "Def": this.stat_fix_def,
                    "SpA": this.stat_fix_spa,
                    "SpD": this.stat_fix_spd,
                    "Spe": this.stat_fix_spe
                }
            }
            if (state == `No Pokemon`) {
                return {
                    "Hp" : this.g4PokemonData[starter].base_stats.hp,
                    "Atk": this.g4PokemonData[starter].base_stats.attack,
                    "Def": this.g4PokemonData[starter].base_stats.defense,
                    "SpA": this.g4PokemonData[starter].base_stats.special_attack,
                    "SpD": this.g4PokemonData[starter].base_stats.special_defense,
                    "Spe": this.g4PokemonData[starter].base_stats.speed,
                }
            }
        },
        togglePopup() {
            this.showPopup = !this.showPopup;
        },
        closePopup() {
            this.showPopup = false;
        },
        calculate_ev_benefit(stat_name) {
            const state = this.mapper.properties.meta.state.value
            if (state == 'No Pokemon') {
                return
            }

            let level = this.mapper.properties.player.team[0].level.value
            let species = this.starter
            let nature = this.mapper.properties.player.team[0].nature.value
            let nature_modifiers = this.natures[nature]

            let iv_hp = this.mapper.properties.player.team[0].ivs.hp.value
            let iv_atk = this.mapper.properties.player.team[0].ivs.attack.value
            let iv_def = this.mapper.properties.player.team[0].ivs.defense.value
            let iv_spa = this.mapper.properties.player.team[0].ivs.special_attack.value
            let iv_spd = this.mapper.properties.player.team[0].ivs.special_defense.value
            let iv_spe = this.mapper.properties.player.team[0].ivs.speed.value
            
            function calculate_hp(iv, effort_value, level, base_stat) {
                return Math.floor((2 * base_stat + iv + Math.floor(effort_value / 4)) * level / 100) + level + 10
            }
            function calculate_other_stat(iv, effort_value, level, base_stat, nature_modifier) {
                return Math.floor((Math.floor((2 * base_stat + iv + Math.floor(effort_value / 4)) * level / 100) + 5) * nature_modifier)
            }

            switch (stat_name) {
                case 'hp': {
                    let current_stat = this.get_stat().Hp
                    let no_ev_stat   = calculate_hp(iv_hp, 0, level, this.g4PokemonData[species].base_stats?.hp ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                case 'attack': {
                    let current_stat = this.get_stat().Atk
                    let no_ev_stat   = calculate_other_stat(iv_atk, 0, level, this.g4PokemonData[species].base_stats.attack, nature_modifiers?.nature_attack ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                case 'defense': {
                    let current_stat = this.get_stat().Def
                    let no_ev_stat   = calculate_other_stat(iv_def, 0, level, this.g4PokemonData[species].base_stats.defense, nature_modifiers?.nature_defense ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                case 'special_attack': {
                    let current_stat = this.get_stat().SpA
                    let no_ev_stat   = calculate_other_stat(iv_spa, 0, level, this.g4PokemonData[species].base_stats.special_attack, nature_modifiers?.nature_specialAttack ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                case 'special_defense': {
                    let current_stat = this.get_stat().SpD
                    let no_ev_stat   = calculate_other_stat(iv_spd, 0, level, this.g4PokemonData[species].base_stats.special_defense, nature_modifiers?.nature_specialDefense ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                case 'speed': {
                    let current_stat = this.get_stat().Spe
                    let no_ev_stat   = calculate_other_stat(iv_spe, 0, level, this.g4PokemonData[species].base_stats.speed, nature_modifiers?.nature_speed ?? 1)
                    let difference   = current_stat - no_ev_stat
                    return difference
                }
                default: {
                    return
                }
            }
        },
        statLabelOpacity() {
            let default_opacity = .63
            let faded_opacity = .1
            let mod_atk = this.mapper.properties.battle.player.active_pokemon.modifiers.attack.value != '0'          && this.mapper.properties.meta.state.value == 'Battle' ? faded_opacity : default_opacity
            let mod_def = this.mapper.properties.battle.player.active_pokemon.modifiers.defense.value != '0'         && this.mapper.properties.meta.state.value == 'Battle' ? faded_opacity : default_opacity
            let mod_spa = this.mapper.properties.battle.player.active_pokemon.modifiers.special_attack.value != '0'  && this.mapper.properties.meta.state.value == 'Battle' ? faded_opacity : default_opacity
            let mod_spd = this.mapper.properties.battle.player.active_pokemon.modifiers.special_defense.value != '0' && this.mapper.properties.meta.state.value == 'Battle' ? faded_opacity : default_opacity
            let mod_spe = this.mapper.properties.battle.player.active_pokemon.modifiers.speed.value != '0'           && this.mapper.properties.meta.state.value == 'Battle' ? faded_opacity : default_opacity
            let object = {
                "HP":              default_opacity,
                "Attack":          mod_atk,
                "Defense":         mod_def,
                "Speed":           mod_spe,
                "Special Attack":  mod_spa,
                "Special Defense": mod_spd,
            }
            return object
        },
        get_friendship() {
            return this.mapper.properties.player.team[0].friendship + "/255"
        },
        get_effort_values() {
            const ev_hp  = this.mapper.properties.player.team[0].evs.hp.value
            const ev_atk = this.mapper.properties.player.team[0].evs.attack.value
            const ev_def = this.mapper.properties.player.team[0].evs.defense.value
            const ev_spa = this.mapper.properties.player.team[0].evs.special_attack.value
            const ev_spd = this.mapper.properties.player.team[0].evs.special_defense.value
            const ev_spe = this.mapper.properties.player.team[0].evs.speed.value
            const total = ev_hp + ev_atk + ev_def + ev_spa + ev_spd + ev_spe
            return total + "/510"
        },
        get_iv_total() {
            const iv_hp  = this.mapper.properties.player.team[0].ivs.hp.value
            const iv_atk = this.mapper.properties.player.team[0].ivs.attack.value
            const iv_def = this.mapper.properties.player.team[0].ivs.defense.value
            const iv_spa = this.mapper.properties.player.team[0].ivs.special_attack.value
            const iv_spd = this.mapper.properties.player.team[0].ivs.special_defense.value
            const iv_spe = this.mapper.properties.player.team[0].ivs.speed.value
            const total = iv_hp + iv_atk + iv_def + iv_spa + iv_spd + iv_spe
            return total + "/186"
        },
        get_base_stat_total() {
            //! EVOLUTION_FIX needed here, recall base stats from the selected evolution species when evolution mode is enabled
            var starter = this.evolution ? this.selected_evolution_species : this.starter
            const data    = this.g4PokemonData[starter]
            const hp      = data.base_stats.hp
            const atk     = data.base_stats.attack
            const def     = data.base_stats.defense
            const spa     = data.base_stats.speed
            const spd     = data.base_stats.special_attack
            const spe     = data.base_stats.special_defense
            const total   = hp + atk + def + spa + spd + spe
            return total
        },
        get_base_stat(stat_path) {
            //! EVOLUTION_FIX needed here, recall base stats from the selected evolution species when evolution mode is enabled
            var starter = this.evolution ? this.selected_evolution_species : this.starter
            return this.g4PokemonData[starter]?.base_stats[stat_path]
        },
        post_game_move_style(move_object) {
            const game_name = 'Platinum' //change this to be dynamic when adding more games
            const move_name = move_object.Move
            var strikethrough_tmhm = ""
            var strikethrough_tutor = ""
            if (this.track_TMHM_viability == false) {
                return {
                    tmhm: strikethrough_tmhm,
                    tutor: strikethrough_tutor,
                }
            }
            if (this.post_game_moves[game_name].tmhm.includes(move_name)) {
                strikethrough_tmhm = "text-decoration: line-through;"
            }
            if (this.post_game_moves[game_name].tutor.includes(move_name)) {
                strikethrough_tutor = "text-decoration: line-through;"
            }
            return {
                tmhm: strikethrough_tmhm,
                tutor: strikethrough_tutor,
            }
        },
        copy_overlay_properties() {
            const copy_from = this.copy_overlay_pokemon_from
            const copy_to   = this.copy_overlay_pokemon_to
            const game_name = this.mapper.properties.meta.game_name.value
            const from      = `${game_name}_${copy_from}`
            const to        = `${game_name}_${copy_to}`

            if (!MyStorage[`${game_name}_${copy_from}`]) {
                console.log("The Pokemon you are trying to copy from does not have overlay data stored for it.")
            }
            if (MyStorage[`${game_name}_${copy_to}`]) {
                MyStorage[`${game_name}_${copy_to}`] = {};
            }
            this.overlay_color         = MyStorage[from].overlay_color
            this.backgroundBlur        = MyStorage[from].backgroundBlur        
            this.backgroundHue         = MyStorage[from].backgroundHue        
            this.backgroundScale       = MyStorage[from].backgroundScale       
            this.backgroundUrl         = MyStorage[from].backgroundUrl         
            this.backgroundFlip        = MyStorage[from].backgroundFlip        
            this.use_custom_background = MyStorage[from].use_custom_background 
            this.backgroundXOffset     = MyStorage[from].backgroundXOffset     
            this.backgroundYOffset     = MyStorage[from].backgroundYOffset     
            this.backgroundTexture     = MyStorage[from].backgroundTexture     
            this.backgroundBrightness  = MyStorage[from].backgroundBrightness  
            this.backgroundContrast    = MyStorage[from].backgroundContrast    
            this.backgroundSaturation  = MyStorage[from].backgroundSaturation  
            this.backgroundBlur        = MyStorage[from].backgroundBlur  
            this.ui_saturation         = MyStorage[from].ui_saturation  
            this.evolution             = MyStorage[from].evolution  
            
            MyStorage[to].overlay_color         = MyStorage[from].overlay_color
            MyStorage[to].backgroundBlur        = MyStorage[from].backgroundBlur       
            MyStorage[to].backgroundHue         = MyStorage[from].backgroundHue       
            MyStorage[to].backgroundScale       = MyStorage[from].backgroundScale      
            MyStorage[to].backgroundUrl         = MyStorage[from].backgroundUrl        
            MyStorage[to].backgroundFlip        = MyStorage[from].backgroundFlip       
            MyStorage[to].use_custom_background = MyStorage[from].use_custom_background
            MyStorage[to].backgroundXOffset     = MyStorage[from].backgroundXOffset    
            MyStorage[to].backgroundYOffset     = MyStorage[from].backgroundYOffset    
            MyStorage[to].backgroundTexture     = MyStorage[from].backgroundTexture    
            MyStorage[to].backgroundBrightness  = MyStorage[from].backgroundBrightness 
            MyStorage[to].backgroundContrast    = MyStorage[from].backgroundContrast   
            MyStorage[to].backgroundSaturation  = MyStorage[from].backgroundSaturation 
            MyStorage[to].ui_saturation         = MyStorage[from].ui_saturation 
            MyStorage[to].evolution             = MyStorage[from].evolution 
        },
        copyCurrentStylesToAllFamilyMembers() {
            // Copy all style settings from the currently selected evolution family member
            // to all other members of the evolution family
            if (!this.evolution || !this.selected_evolution_species || this.evolution_family_list.length <= 1) {
                // console.log("Evolution mode must be enabled and you must have multiple species in the evolution family.")
                return
            }
            
            const game_name = this.mapper?.properties?.meta?.game_name?.value || this.selected_game;
            const sourceSpecies = this.selected_evolution_species;
            const sourceStorageKey = this.getStorageKey(sourceSpecies, true); // Evolution line storage
            
            // Initialize source storage if it doesn't exist
            if (!MyStorage[sourceStorageKey]) {
                MyStorage[sourceStorageKey] = {};
            }
            
            // List of all styling properties to copy
            // This includes all properties from pokemon_settings that affect visual styling
            const stylingProperties = [
                // Overlay color and UI settings
                'overlay_color',
                'ui_saturation',
                
                // Pokemon image settings
                'imageXOffset',
                'imageYOffset',
                'imageScale',
                'imageFlip',
                'imageSat',
                'imageRotation',
                
                // Background texture settings
                'backgroundTexture',
                'backgroundBlur',
                'backgroundHue',
                'backgroundScale',
                'backgroundUrl',
                'backgroundFlip',
                'use_custom_background',
                'backgroundXOffset',
                'backgroundYOffset',
                'backgroundBrightness',
                'backgroundContrast',
                'backgroundSaturation'
            ]
            
            // Build the source data object with all current values
            const sourceData = {};
            stylingProperties.forEach(prop => {
                if (this[prop] !== undefined) {
                    sourceData[prop] = this[prop];
                }
            });
            
            // First, save current values to source storage key to ensure consistency
            // Get existing data (handles null case when key doesn't exist)
            const sourceExistingData = MyStorage[sourceStorageKey];
            MyStorage[sourceStorageKey] = {
                ...(sourceExistingData || {}),
                ...sourceData
            };
            
            // Copy to all other members of the evolution family
            let copiedCount = 0;
            const copiedValues = {}; // Store what we're copying for debugging
            this.evolution_family_list.forEach(targetSpecies => {
                if (targetSpecies !== sourceSpecies) {
                    const targetStorageKey = this.getStorageKey(targetSpecies, true); // Evolution line storage
                    
                    // Get existing data (might be null if key doesn't exist)
                    const existingData = MyStorage[targetStorageKey] || {};
                    
                    // Copy all properties at once - merge existing with new source data
                    const mergedData = {
                        ...existingData,
                        ...sourceData
                    };
                    
                    // Save to storage - this will trigger the Proxy's set trap
                    MyStorage[targetStorageKey] = mergedData;
                    
                    // Store for debugging
                    copiedValues[targetSpecies] = { ...sourceData };
                    
                    // Verify what was actually saved (re-read from storage to confirm)
                    const verifiedData = MyStorage[targetStorageKey];
                    
                    copiedCount++;
                    // Debug: Log what was copied for this species
                    // console.log(`Copied to ${targetSpecies} (key: ${targetStorageKey}):`, copiedValues[targetSpecies]);
                    // Verify what was actually saved
                    // console.log(`Verified storage for ${targetSpecies}:`, verifiedData);
                }
            });
            
            // console.log(`Successfully copied style settings from "${sourceSpecies}" (key: ${sourceStorageKey}) to ${copiedCount} other family member(s).`);
        },
        load_all_settings() {
            const game_name                    = this.mapper.properties.meta.game_name.value
            this.starter                       = MyStorage["starter"]                ?? "Heatran"
            this.show_advanced_settings        = MyStorage['show_advanced_settings'] ?? false
            if (game_name == "HeartGold and SoulSilver") {
                this.starter_choice = MyStorage["starter_choice"] ?? "Chikorita"
            }
            else {
                this.starter_choice = MyStorage["starter_choice"] ?? "Turtwig"
            }

            this.graphicOverlay =             MyStorage['graphicOverlay']             ?? true
            this.gameArea =                   MyStorage['gameArea']                   ?? false
            this.pokeballFloor =              MyStorage['pokeballFloor']              ?? false
            this.dynamicOverlay =             MyStorage['dynamicOverlay']             ?? false
            this.gametime =                   MyStorage['gametime']                   ?? false
            this.pick =                       MyStorage['pick']                       ?? true
            this.typeCalcs =                  MyStorage['typeCalcs']                  ?? true
            this.moveset =                    MyStorage['moveset']                    ?? true
            this.dynamicPower =               MyStorage['dynamicPower']               ?? false
            this.resets =                     MyStorage['resets']                     ?? false
            this.stats =                      MyStorage['stats']                      ?? true
            this.movepool =                   MyStorage['movepool']                   ?? false
            this.inventory =                  MyStorage['inventory']                  ?? false
            this.battleStats =                MyStorage['battleStats']                ?? false
            this.battleInfo =                 MyStorage['battleInfo']                 ?? false
            this.conditions =                 MyStorage['conditions']                 ?? false
            this.expBar =                     MyStorage['expBar']                     ?? false
            this.splits =                     MyStorage['splits']                     ?? false
            this.tooltips =                   MyStorage['tooltips']                   ?? false
            this.btcInfo =                    MyStorage['btcInfo']                    ?? false
            this.returnPower =                MyStorage['returnPower']                ?? true
            this.gamestate =                  MyStorage['gamestate']                  ?? true
            this.labels =                     MyStorage['labels']                     ?? true
            this.tutor_moves =                MyStorage['tutor_moves']                ?? false
            this.showSpecialTrainerGraphics = MyStorage['showSpecialTrainerGraphics'] ?? true
            this.route_101 =                  MyStorage['route_101']                  ?? true
            this.route_102 =                  MyStorage['route_102']                  ?? true
            this.route_103 =                  MyStorage['route_103']                  ?? true
            this.hm_102_zigzagoon =           MyStorage['hm_102_zigzagoon']           ?? true
            this.hm_104_marill =              MyStorage['hm_104_marill']              ?? true
            this.hm_104_taillow =             MyStorage['hm_104_taillow']             ?? true
            this.testRun =                    MyStorage['testRun']                    ?? false
            this.simple_data_str =            MyStorage['simple_data_str']            ?? ""
            this.full_data_str =              MyStorage['full_data_str']              ?? ""
            this.deprecated_data_str =        MyStorage['deprecated_data_str']        ?? ""
            this.simple_data =                MyStorage['simple_data']                ?? ""
            this.time_split_start =           MyStorage['time_split_start']           ?? "00:00:00:00"
            this.battle_start =               MyStorage['battle_start']               ?? 0
            this.encounters_route_1 =         MyStorage['encounters_route_1']         ?? false
            this.encounters_route_2 =         MyStorage['encounters_route_2']         ?? false
            this.editor =                     MyStorage['editor']                     ?? false
            this.debugging_mode =             MyStorage['debugging_mode']             ?? true
            this.held_item_replacement =      MyStorage['held_item_replacement']      ?? ""
            this.move1_replacement =          MyStorage['move1_replacement']          ?? ""
            this.move2_replacement =          MyStorage['move2_replacement']          ?? ""
            this.move3_replacement =          MyStorage['move3_replacement']          ?? ""
            this.move4_replacement =          MyStorage['move4_replacement']          ?? ""
            this.right_ui =                   MyStorage['right_ui']                   ?? "Automatic"
            this.split_type =                 MyStorage['split_type']                 ?? "First"
            this.catch_rate =                 MyStorage['catch_rate']                 ?? false

            const evolution_family = (this.g4PokemonData && this.starter) ? (this.g4PokemonData[this.starter]?.evolution_family ?? [ {species: null, method: null,}, {species: null, method: null,}, {species: null, method: null,}, ]) : [ {species: null, method: null,}, {species: null, method: null,}, {species: null, method: null,}, ]
            this.evolution =               MyStorage[`${game_name}_${this.starter}`]?.evolution              ?? false
            this.evolution_splits_label =  MyStorage[`${game_name}_${this.starter}`]?.evolution_splits_label ?? ""
            this.copy_overlay_pokemon_from = MyStorage['copy_overlay_pokemon_from'] ?? ""
            this.copy_overlay_pokemon_to   = MyStorage['copy_overlay_pokemon_to']   ?? ""

            // Update evolution family list
            this.updateEvolutionFamilyList();
            
            // Load styles based on whether evolution is enabled
            if (this.evolution && this.evolution_family_list.length > 0) {
                // Load shared evolution family settings (ability, nature, gender, hidden power)
                // These are stored in the evolution family storage key (e.g., "Black_Unfezant-line")
                const evolutionFamilyStorageKey = this.getEvolutionFamilyStorageKey(this.starter);
                const familyStored = MyStorage[evolutionFamilyStorageKey] || {};
                
                // Load shared family settings
                this.pkmnNature = familyStored.pkmnNature ?? MyStorage[`${game_name}_${this.starter}`]?.pkmnNature ?? "Hardy";
                this.pkmn_ability = familyStored.pkmn_ability ?? MyStorage[`${game_name}_${this.starter}`]?.pkmn_ability ?? (this.g4PokemonData?.[this.starter]?.abilities?.[0]) ?? null;
                this.pkmn_gender = familyStored.pkmn_gender ?? MyStorage[`${game_name}_${this.starter}`]?.pkmn_gender ?? "Female";
                this.hidden_power_type = familyStored.hidden_power_type ?? MyStorage[`${game_name}_${this.starter}`]?.hidden_power_type ?? "Dark";
                this.hidden_power_index = familyStored.hidden_power_index ?? MyStorage[`${game_name}_${this.starter}`]?.hidden_power_index ?? 0;
                
                // Load selected evolution species from storage
                const stored_evolution_species = MyStorage[`${game_name}_${this.starter}`]?.selected_evolution_species;
                if (stored_evolution_species && this.evolution_family_list.includes(stored_evolution_species)) {
                    this.selected_evolution_species = stored_evolution_species;
                } else {
                    // Default to starter if not set or invalid
                    this.selected_evolution_species = this.starter;
                    // Save it
                    if (!MyStorage[`${game_name}_${this.starter}`]) {
                        MyStorage[`${game_name}_${this.starter}`] = {};
                    }
                    MyStorage[`${game_name}_${this.starter}`] = {
                        ...MyStorage[`${game_name}_${this.starter}`],
                        selected_evolution_species: this.starter
                    };
                }
                
                // Load evolution line styles for the selected species (this will also load the shared settings if they're in the individual storage)
                this.loadEvolutionStyle(this.selected_evolution_species, true);
            } else {
                // Evolution is disabled, load individual species styles
                //Pokemon settings for local storage
                this.overlay_color = MyStorage[`${game_name}_${this.starter}`]?.overlay_color ?? this.default_colors[`${this.g4PokemonData?.[this.starter]?.type_1}`] ?? this.default_colors.Normal
                this.imageXOffset =  MyStorage[`${game_name}_${this.starter}`]?.imageXOffset ?? 0
                this.imageYOffset =  MyStorage[`${game_name}_${this.starter}`]?.imageYOffset ?? 0
                this.imageScale =    MyStorage[`${game_name}_${this.starter}`]?.imageScale ?? 1
                this.imageFlip =     MyStorage[`${game_name}_${this.starter}`]?.imageFlip ?? false
                this.imageSat =      MyStorage[`${game_name}_${this.starter}`]?.imageSat ?? 100
                this.imageRotation = MyStorage[`${game_name}_${this.starter}`]?.imageRotation ?? 0

                //background texture settings
                this.backgroundBlur =        MyStorage[`${game_name}_${this.starter}`]?.backgroundBlur ?? 0
                this.backgroundHue =         MyStorage[`${game_name}_${this.starter}`]?.backgroundHue ?? 0
                this.backgroundScale =       MyStorage[`${game_name}_${this.starter}`]?.backgroundScale ?? 100
                this.backgroundUrl =         MyStorage[`${game_name}_${this.starter}`]?.backgroundUrl ?? ""
                this.backgroundFlip =        MyStorage[`${game_name}_${this.starter}`]?.backgroundFlip ?? false
                this.use_custom_background = MyStorage[`${game_name}_${this.starter}`]?.use_custom_background ?? false
                this.backgroundXOffset =     MyStorage[`${game_name}_${this.starter}`]?.backgroundXOffset ?? 0
                this.backgroundYOffset =     MyStorage[`${game_name}_${this.starter}`]?.backgroundYOffset ?? 0
                this.backgroundTexture =     MyStorage[`${game_name}_${this.starter}`]?.backgroundTexture ?? `${this.g4PokemonData?.[this.starter]?.type_1 ?? 'Normal'}`
                this.backgroundBrightness =  MyStorage[`${game_name}_${this.starter}`]?.backgroundBrightness ?? 100
                this.backgroundContrast =    MyStorage[`${game_name}_${this.starter}`]?.backgroundContrast ?? 100
                this.backgroundSaturation =  MyStorage[`${game_name}_${this.starter}`]?.backgroundSaturation ?? 100
                
                //UI styling
                this.ui_saturation =  MyStorage[`${game_name}_${this.starter}`]?.ui_saturation ?? .6
            }

            //main pokemon settings
            this.pkmnNature   = MyStorage[`${game_name}_${this.starter}`]?.pkmnNature            ?? "Hardy"

            if (this.g4PokemonData?.[this.starter]?.abilities && this.g4PokemonData[this.starter].abilities.indexOf(this.pkmn_ability) == -1 && !MyStorage[`${game_name}_${this.starter}`]?.pkmn_ability) {
                this.pkmn_ability = this.g4PokemonData[this.starter].abilities[0]
            }
            else {
                this.pkmn_ability = MyStorage[`${game_name}_${this.starter}`]?.pkmn_ability          ?? this.g4PokemonData?.[this.starter]?.abilities?.[0] ?? null
            }
            if (this.set_starter_stats_object) {
                this.set_starter_stats_object.gender = this.pkmn_gender;
                this.set_starter_stats_object.nature = this.pkmnNature;
                this.set_starter_stats_object.ability = this.pkmn_ability;
            }
        },
        reset() {
            this.backgroundBlur =        0,
            this.backgroundHue =         0,
            this.backgroundScale =       100,
            this.backgroundUrl =         "",
            this.use_custom_background = false,
            this.backgroundXOffset =     0,
            this.backgroundYOffset =     0,
            this.backgroundTexture =     this.g4PokemonData[this.starter]?.type_1?.toLowerCase(),
            this.backgroundBrightness =  100,
            this.backgroundContrast =    100,
            this.backgroundSaturation =  100
        },
        resetPokemon() {
            this.imageXOffset =  0
            this.imageYOffset =  0
            this.imageScale =    1
            this.imageFlip =     false
            this.imageSat =      100
            this.imageRotation = 0
        },
        increment(property) {
            this[property]++;
        },
        decrement(property) {
            if (this[property] == 0) {
                return 0
            }
            this[property]--;
        },
        async colorPick() {
            return new EyeDropper().open().then(res => res.sRGBHex)
        },
        async color_picker() {
            var color = await this.colorPick()
            this.set_pokemon_prop("overlay_color", color)
            this.overlay_color = color
            // console.log(MyStorage.entries())
        },
        clear_overlay_color() {
            starterType = this.g4PokemonData[this.starter]?.type_1;
            if (starterType) {
                newColor = getComputedStyle(document.documentElement).getPropertyValue("--"+starterType.toLowerCase());
                this.set_pokemon_prop("overlay_color", newColor)
                this.overlay_color = newColor;
            }
            // this.load_pokemon_sprite_settings()
        },
        set_pokemon_prop(property_name, value) {
            // Use the appropriate storage key based on evolution mode
            const storageKey = this.getCurrentStorageKey();
            MyStorage[storageKey] = {
                ...MyStorage[storageKey],
                [property_name]: value,
            }
        },
        updateEvolutionFamilyList() {
            // Update the evolution family list when starter changes
            this.evolution_family_list = this.getEvolutionFamily(this.starter);
            // Set default selected evolution species to the starter if not set
            if (this.evolution && this.evolution_family_list.length > 0) {
                if (!this.selected_evolution_species || !this.evolution_family_list.includes(this.selected_evolution_species)) {
                    this.selected_evolution_species = this.starter;
                }
            }
        },
        loadEvolutionStyle(species, useEvolutionLine = false) {
            // Set flag to prevent watchers from saving during loading
            this.is_loading_evolution_style = true;
            
            // Load styles for a species, either from evolution line storage or individual storage
            const game_name = this.mapper?.properties?.meta?.game_name?.value || this.selected_game;
            const storageKey = useEvolutionLine ? this.getStorageKey(species, true) : this.getStorageKey(species, false);
            
            // Debug: Log what we're trying to load
            // console.log(`Loading styles for ${species} (useEvolutionLine: ${useEvolutionLine}, key: ${storageKey})`);
            // console.log(`Storage data for ${species}:`, MyStorage[storageKey]);
            
            // Load overlay and image settings
            this.overlay_color = MyStorage[storageKey]?.overlay_color ?? this.default_colors[this.g4PokemonData?.[species]?.type_1] ?? this.default_colors.Normal;
            this.ui_saturation = MyStorage[storageKey]?.ui_saturation ?? 0.6;
            this.imageXOffset = MyStorage[storageKey]?.imageXOffset ?? 0;
            this.imageYOffset = MyStorage[storageKey]?.imageYOffset ?? 0;
            this.imageScale = MyStorage[storageKey]?.imageScale ?? 1;
            this.imageFlip = MyStorage[storageKey]?.imageFlip ?? false;
            this.imageSat = MyStorage[storageKey]?.imageSat ?? 100;
            this.imageRotation = MyStorage[storageKey]?.imageRotation ?? 0;
            
            // Load background texture settings
            // Use 'in' operator to check if property exists in storage, to handle 0 and false values correctly
            const stored = MyStorage[storageKey] || {};
            
            this.backgroundTexture = 'backgroundTexture' in stored ? stored.backgroundTexture : `${this.g4PokemonData?.[species]?.type_1 ?? 'Normal'}`;
            this.backgroundBlur = 'backgroundBlur' in stored ? stored.backgroundBlur : 0;
            this.backgroundHue = 'backgroundHue' in stored ? stored.backgroundHue : 0;
            this.backgroundScale = 'backgroundScale' in stored ? stored.backgroundScale : 100;
            this.backgroundUrl = 'backgroundUrl' in stored ? stored.backgroundUrl : "";
            this.backgroundFlip = 'backgroundFlip' in stored ? stored.backgroundFlip : false;
            this.use_custom_background = 'use_custom_background' in stored ? stored.use_custom_background : false;
            this.backgroundXOffset = 'backgroundXOffset' in stored ? stored.backgroundXOffset : 0;
            this.backgroundYOffset = 'backgroundYOffset' in stored ? stored.backgroundYOffset : 0;
            this.backgroundBrightness = 'backgroundBrightness' in stored ? stored.backgroundBrightness : 100;
            this.backgroundContrast = 'backgroundContrast' in stored ? stored.backgroundContrast : 100;
            this.backgroundSaturation = 'backgroundSaturation' in stored ? stored.backgroundSaturation : 100;
            
            // Load shared evolution family settings (ability, nature, gender, hidden power) if using evolution line
            if (useEvolutionLine) {
                const familyStorageKey = this.getEvolutionFamilyStorageKey(species);
                const familyStored = MyStorage[familyStorageKey] || {};
                
                // Load ability, nature, gender, and hidden power from family storage
                // Use 'in' operator to check if property exists, handling null/undefined correctly
                if ('pkmnNature' in familyStored) {
                    this.pkmnNature = familyStored.pkmnNature;
                }
                if ('pkmn_ability' in familyStored) {
                    this.pkmn_ability = familyStored.pkmn_ability;
                } else if (this.pkmn_ability === null || this.pkmn_ability === undefined) {
                    // Only default to first ability if not set at all
                    this.pkmn_ability = this.g4PokemonData?.[species]?.abilities?.[0] ?? null;
                }
                if ('pkmn_gender' in familyStored) {
                    this.pkmn_gender = familyStored.pkmn_gender;
                }
                if ('hidden_power_type' in familyStored) {
                    this.hidden_power_type = familyStored.hidden_power_type;
                }
                if ('hidden_power_index' in familyStored) {
                    this.hidden_power_index = familyStored.hidden_power_index;
                }
            }
            
            // // Debug: Log what was actually loaded
            // console.log(`Loaded background settings for ${species}:`, {
            //     backgroundTexture: this.backgroundTexture,
            //     backgroundXOffset: this.backgroundXOffset,
            //     backgroundYOffset: this.backgroundYOffset,
            //     backgroundScale: this.backgroundScale,
            //     backgroundBrightness: this.backgroundBrightness,
            //     backgroundContrast: this.backgroundContrast,
            //     backgroundSaturation: this.backgroundSaturation,
            //     backgroundBlur: this.backgroundBlur,
            //     backgroundHue: this.backgroundHue,
            //     backgroundFlip: this.backgroundFlip
            // });
            
            // Clear flag after loading is complete, use $nextTick to ensure all watchers have fired
            this.$nextTick(() => {
                this.is_loading_evolution_style = false;
            });
        },
        async performEvolutionTransition(oldSpecies, newSpecies) {
            // Perform smooth fade transition between old and new overlays
            this.evolution_transitioning = true;
            this.evolution_old_species = oldSpecies;
            this.evolution_new_species = newSpecies;
            
            // Get old and new styles
            const oldStorageKey = this.getStorageKey(oldSpecies, true);
            const newStorageKey = this.getStorageKey(newSpecies, true);
            const game_name = this.mapper?.properties?.meta?.game_name?.value || this.selected_game;
            
            const oldOverlayColor = MyStorage[oldStorageKey]?.overlay_color ?? this.default_colors[this.g4PokemonData?.[oldSpecies]?.type_1] ?? this.default_colors.Normal;
            const newOverlayColor = MyStorage[newStorageKey]?.overlay_color ?? this.default_colors[this.g4PokemonData?.[newSpecies]?.type_1] ?? this.default_colors.Normal;
            
            // Transition duration in milliseconds
            const duration = 1000; // 1 second
            const startTime = Date.now();
            
            // If overlay colors are the same, skip color transition
            const colorsMatch = oldOverlayColor === newOverlayColor;
            
            // Perform fade transition
            return new Promise((resolve) => {
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    this.evolution_transition_progress = progress;
                    
                    // Fade Pokemon art (handled via opacity in template)
                    // Fade movepool (handled via opacity in template)
                    // Overlay color transition is handled by CSS transition on the .colored-image::after element
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // Transition complete
                        this.evolution_transitioning = false;
                        this.evolution_transition_progress = 0;
                        this.evolution_old_species = null;
                        this.evolution_new_species = null;
                        
                        // Update Pokemon art source after transition
                        this.$nextTick(() => {
                            // Art source will update automatically via :src binding
                            resolve();
                        });
                    }
                };
                
                // Styles should already be loaded by the watcher before this is called
                // If colors match, still do a quick transition for Pokemon art
                // If colors don't match, CSS transitions will handle the color fade
                
                animate();
            });
        },
        keys_function(object) {
            return Object.keys(object)
        },
        values_function(object) {
            return Object.values(object)
        },
        eHPType(valueToReturn, moveValue, slotIndex) {
            if (moveValue == "Hidden Power") {
                return this.hiddenPowerTypeCalc(this.mapper.properties.battle.opponent.team[slotIndex])
            }
            else {
                return valueToReturn
            }
        },
        enemyFaint(slotIndex) {
            let opponent = 1
            if (slotIndex >= 6) { 
                slotIndex = slotIndex - 6
                opponent = 2
            }
            let fainted = false
            const enemy_hp = opponent == 2 ? this.mapper.properties.battle.opponent_2.team[slotIndex].stats.hp.value : this.mapper.properties.battle.opponent.team[slotIndex].stats.hp.value
            if (enemy_hp == 0) {
                fainted = true
            }
            if (fainted == true) {
                return "opacity: .35; filter: grayscale(100%);"
            }
            else {
                return
            }
        },
        enemyPkmnUI(pkmnData) {
            const state = this.mapper.properties.meta.state.value
            if (state != `Battle` && state != `From Battle`) { return "opacity: 1" }
            if (pkmnData.stats.hp.value == 0 || state == `From Battle`) {
                return "opacity: .5;"
            }
            else {
                return "opacity: 1"
            }
        },
        enemy2Faint(slotIndex) {
            let fainted = false
            if (this.mapper.properties.battle.opponent_2.team[slotIndex].stats.hp.value == 0) {
                fainted = true
            }
            if (fainted == true) {
                return "opacity: .35; filter: grayscale(100%);"
            }
            else {
                return
            }
        },
        //*timer methods
        //start the timer
        startTime() {
            if (this.timer_pause == false) {
                return
            }
            const timeRegex = /(\d+):(\d{2}):(\d{2})\.(\d{2})/;
            const timeOffsetArray = this.timer_startTimeOffset.match(timeRegex)?.slice(1,5).map(x => parseInt(x)) ?? [0,0,0,0];
            const timeOffset = timeOffsetArray[0] * 3600000 + timeOffsetArray[1] * 60000 + timeOffsetArray[2] * 1000 + timeOffsetArray[3] * 10;

            this.timer_startTime = Date.now() - timeOffset
            this.timer_pause = false
            this.updateTime()
        },
        //stop the timer
        stopTime() {
            this.timer_pause_time = Date.now()
            this.timer_pause = true
        },
        padTime(time) {
            return time.toString().padStart(2, "0")
        },
        //animate the timer
        updateTime() {
            var time = Date.now() - this.timer_startTime
            if (this.timer_pause == true) {
                time = this.timer_pause_time - this.timer_startTime
            }
            var f = (x) => x.toString().padStart(2, "0")
            var c = (Math.floor(time / 10) % 100)
            var s = (Math.floor(time / 1000) % 60)
            var m = (Math.floor(time / 60000) % 60)
            var h = (Math.floor(time / 3600000))
            this.time_h = h
            this.time_m = m
            this.time_s = s
            this.time_ms = c
            if (h != 0) {
                this.timer_formatted_time = [ h + ":" + f(m) + ":" + f(s), "." + f(c), h + "h" + m + "m" + s + "s", ]
            }
            else if (m != 0) {
                this.timer_formatted_time = [ m + ":" + f(s), "." + f(c), h + "h" + m + "m" + s + "s", ]
            }
            else {
                this.timer_formatted_time = [ s, "." + f(c), h + "h" + m + "m" + s + "s", ]
            }
            if (this.timer_pause == false) {
                setImmediate(() => {
                    requestAnimationFrame(this.updateTime)
                })
            }
        },
        //pause the timer
        pauseUnpauseTime() {
            if (this.timer_pause == true) {
                this.timer_pause = false
                this.timer_startTime += Date.now() - this.timer_pause_time
                this.updateTime()
            }
            else {
                this.timer_pause = true
                this.timer_pause_time = Date.now()
            }
        },
        set_timer() {
            const timeRegex = /(\d+):(\d{2}):(\d{2})\.(\d{2})/;
            const timeOffsetArray = this.timer_startTimeOffset.match(timeRegex)?.slice(1,5).map(x => parseInt(x)) ?? [0,0,0,0];
            const timeOffset = timeOffsetArray[0] * 3600000 + timeOffsetArray[1] * 60000 + timeOffsetArray[2] * 1000 + timeOffsetArray[3] * 10;

            this.timer_pause = true
            this.timer_startTime = Date.now() - timeOffset
            this.timer_pause_time = Date.now()
            this.timer_formatted_time = [ "0", ".00" ]
            this.finished_logs = false

            this.updateTime()
        },
        newRun() {
            const timeRegex = /(\d+):(\d{2}):(\d{2})\.(\d{2})/;
            const timeOffsetArray = this.timer_startTimeOffset.match(timeRegex)?.slice(1,5).map(x => parseInt(x)) ?? [0,0,0,0];
            const timeOffset = timeOffsetArray[0] * 3600000 + timeOffsetArray[1] * 60000 + timeOffsetArray[2] * 1000 + timeOffsetArray[3] * 10;
            this.starter_received = false,

            this.kanto_badges = false
            this.timer_pause = true
            this.timer_startTime = Date.now() - timeOffset
            this.timer_pause_time = Date.now()
            this.timer_formatted_time = [ "0", ".00" ]
            this.playerResets = 0
            this.finished_logs = false
            this.blackout_counter = 0
            this.playerId = 0
            // this.playerName = "NINTEN"
            this.current_splits = []
            this.previous_splits = []

            this.updateTime()
            if (this.set_rom_starter_automatically && this.timer_formatted_time[0] == "0" && this.timer_formatted_time[1] == ".00") {
                console.log('Setting ROM starter automatically')
                this.update_rom_starter_and_intro_mon()
            }
        },
        //fixes species that contain special characters in their names
        speciesSpecialCharacters(species) {
            switch (species) {
                case "Mr. Mime":   return "Mr. Mime"
                case "MrMime":     return "Mr. Mime"
                case "Mr Mime":    return "Mr. Mime"
                case "Farfetchd":  return "Farfetch'd"
                case "Mime Jr.":   return "Mime Jr."
                case "Mime Jr":    return "Mime Jr."
                case "MimeJr":     return "Mime Jr."
                case "HoOh":       return "Ho-oh"
                case "Ho Oh":      return "Ho-oh"
                default:           return species
            }
        },
        getTrainerGraphic() {
            if (this.mapper.properties.meta.state == `Battle`) {
                let graphic = `images/trainers/roark.png`
                let trainer = this.mapper.properties.battle.opponent.trainer.value
                let bytes = this.mapper.properties.battle.opponent.trainer.bytes
                let id_value = this.mapper.properties.battle.opponent.id.value
                let displayGraphicState = this.enemy_graphic == true ? true : false
                if (this.selected_game == `Platinum` || this.selected_game == `Diamond and Pearl`) {
                    switch (trainer) {
                        case "Leader Roark":      graphic = `images/trainers/roark.png`;       break;
                        case "Leader Gardenia":   graphic = `images/trainers/gardenia.png`;    break;
                        case "Leader Fantina":    graphic = `images/trainers/fantina.png`;     break;
                        case "Leader Wake":       graphic = `images/trainers/crasherwake.png`; break;
                        case "Leader Maylene":    graphic = `images/trainers/maylene.png`;     break;
                        case "Leader Candice":    graphic = `images/trainers/candice.png`;     break;
                        case "Leader Volkner":    graphic = `images/trainers/volkner.png`;     break;
                        case "Leader Byron":      graphic = `images/trainers/byron.png`;       break;
                        case "Elite Four Aaron":  graphic = `images/trainers/aaron.png`;       break;
                        case "Elite Four Bertha": graphic = `images/trainers/bertha.png`;      break;
                        case "Elite Four Flint":  graphic = `images/trainers/flint.png`;       break;
                        case "Elite Four Lucian": graphic = `images/trainers/lucian.png`;      break;
                        case "Rival": {
                            switch (this.mapper.properties.battle.opponent.team_count.value) {
                                case 1: graphic = `images/trainers/rival1mon.png`; break;
                                case 2: graphic = `images/trainers/rival1mon.png`; break;
                                case 4: graphic = `images/trainers/rival4mon.png`; break;
                                case 5: graphic = `images/trainers/rival5mon.png`; break;
                                case 6: displayGraphicState = false; break;
                                default: graphic = `images/trainers/rival1mon.png`; break;
                            }
                            break;
                        }   
                        case "Commander Mars": {
                            switch (id_value) {
                                case 295: graphic = `images/trainers/mars.png`;  break;
                                case 405: graphic = `images/trainers/mars2.png`; break;
                                case 528: graphic = `images/trainers/mars.png`;  break;
                                case 926: { // TODO
                                    graphic = `images/trainers/mars.png`;  
                                    displayGraphicState = false;
                                    break; 
                                } 
                                default:  graphic = `images/trainers/mars.png`;  break;
                            }
                            break;
                        }           
                        case "Commander Jupiter": {
                            switch (bytes) {
                                case 406: graphic = `images/trainers/jupiter.png`; break;
                                case 407: graphic = `images/trainers/jupiter.png`; break;
                                case 927: { // TODO
                                    graphic = `images/trainers/jupiter.png`; 
                                    displayGraphicState = false;
                                    break; 
                                } 
                                default:  graphic = `images/trainers/jupiter.png`; break;
                            }
                            break;
                        }            
                        case "Commander Saturn": {
                            switch (bytes) {
                                case 408: graphic = `images/trainers/saturn.png`; break;
                                case 409: graphic = `images/trainers/saturn.png`; break; 
                                default:  graphic = `images/trainers/saturn.png`; break;
                            }
                            break;
                        }            
                        case "Galactic Boss Cyrus": {
                            switch (id_value) {
                                case 403: graphic = `images/trainers/cyrus_1_2.png`; break;
                                case 404: graphic = `images/trainers/cyrus_3.png`; break;
                                case 913: graphic = `images/trainers/cyrus_1_2.png`; break;
                                default:  graphic = `images/trainers/cyrus_3.png`;   break;
                            }
                            break;
                        }            
                        default: displayGraphicState = false; break;
                    } 
                }
                if (this.selected_game == `HeartGold and SoulSilver`) {
                    switch (trainer) {
                        case "Leader Falkner":   graphic = `images/trainers/falkner.png`;      break;
                        case "Leader Bugsy":     graphic = `images/trainers/bugsy.png`;        break;
                        case "Leader Whitney":   graphic = `images/trainers/whitney.png`;      break;
                        case "Leader Morty":     graphic = `images/trainers/morty.png`;        break;
                        case "Leader Chuck":     graphic = `images/trainers/chuck.png`;        break;
                        case "Leader Pryce":     graphic = `images/trainers/pryce.png`;        break;
                        case "Leader Jasmine":   graphic = `images/trainers/jasmine.png`;      break;
                        case "Leader Clair":     graphic = `images/trainers/clair.png`;        break;
                        case "Leader Brock":     graphic = `images/trainers/brock.png`;        break;
                        case "Leader Misty":     graphic = `images/trainers/misty.png`;        break;
                        case "Leader Lt. Surge": graphic = `images/trainers/surge.png`;        break;
                        case "Leader Erika":     graphic = `images/trainers/erika.png`;        break;
                        case "Leader Sabrina":   graphic = `images/trainers/sabrina.png`;      break;
                        case "Leader Janine":    graphic = `images/trainers/janine.png`;       break;
                        case "Leader Blaine":    graphic = `images/trainers/blaine.png`;       break;
                        case "Elite Four Will": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 245: graphic = `images/trainers/will.png`; break;
                                case 702: displayGraphicState = false;          break;
                                default:  displayGraphicState = false;          break;
                            }
                            break;
                        }   
                        case "Elite Four Koga": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 247: graphic = `images/trainers/koga.png`; break;
                                case 703: displayGraphicState = false;          break;
                                default:  displayGraphicState = false;          break;
                            }
                            break;
                        }   
                        case "Elite Four Bruno": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 418: graphic = `images/trainers/bruno.png`; break;
                                case 704: displayGraphicState = false;           break;
                                default:  displayGraphicState = false;           break;
                            }
                            break;
                        }   
                        case "Elite Four Karen": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 246: graphic = `images/trainers/karen.png`; break;
                                case 705: displayGraphicState = false;           break;
                                default:  displayGraphicState = false;           break;
                            }
                            break;
                        }   
                        case "Passerby Boy": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 495: graphic = `images/trainers/passerby boy.png`; break;
                                case 496: graphic = `images/trainers/passerby boy.png`; break;
                                case 497: graphic = `images/trainers/passerby boy.png`; break;
                                default:  graphic = `images/trainers/passerby boy.png`; break;
                            }
                            break;
                        }
                        case "Rival": {
                            switch (this.mapper.properties.battle.opponent.trainer.bytes) {
                                case 1:   graphic = `images/trainers/rival2.png`;    break;
                                case 2:   graphic = `images/trainers/rival1.png`;    break;
                                case 3:   graphic = `images/trainers/rival1.png`;    break;
                                case 263: graphic = `images/trainers/rival3.png`;    break;
                                case 264: graphic = `images/trainers/rival5.png`;    break;
                                case 265: graphic = `images/trainers/rival1.png`;    break;
                                case 266: graphic = `images/trainers/rival2.png`;    break;
                                case 267: graphic = `images/trainers/rival3.png`;    break;
                                case 268: graphic = `images/trainers/rival5.png`;    break;
                                case 269: graphic = `images/trainers/rival2.png`;    break;
                                case 270: graphic = `images/trainers/rival3.png`;    break;
                                case 271: graphic = `images/trainers/rival4.png`;    break;
                                case 272: graphic = `images/trainers/rival5.png`;    break;
                                case 285: graphic = `images/trainers/rival6.png`;    break;
                                case 286: graphic = `images/trainers/rival6.png`;    break;
                                case 287: graphic = `images/trainers/rival6.png`;    break;
                                case 288: graphic = `images/trainers/rival4.png`;    break;
                                case 289: graphic = `images/trainers/rival4.png`;    break;
                                default:  graphic = `images/trainers/rival1mon.png`; break;
                            }
                            break;
                        }   
                        default: displayGraphicState = false; break;
                    } 
                }
                return {
                    state: displayGraphicState,
                    graphic: graphic,
                    name: trainer,
                }
            }
            else {
                return {
                    state: false,
                    graphic: `images/trainers/roark.png`,
                    name: "Error - there is no trainer graphic to display. Use 'v-if' to disable rendering of this code through the .state property of this object.",
                }
            }
        },
        getSoloNature() {
            pid = this.mapper.properties.player.team[0].internals.personality_value
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return ""
            }
            else {
                return this.getNature(pid)
            }
        },
        get_friendship() {
            const state = this.mapper.properties.meta.state.value
            const battle_friendship = this.mapper.properties.battle.player.active_pokemon.friendship.value
            const team_friendship = this.mapper.properties.player.team[0].friendship.value
            var return_value = 0
            switch (state) {
                case `Battle`: 
                    this.buffer_battle_friendship = battle_friendship; 
                    return_value = battle_friendship; 
                    break;
                case `From Battle`: 
                    return_value = this.buffer_battle_friendship; 
                    break;
                case `No Pokemon`: 
                    if (this.mapper.properties.player.team[0].species.value != null) {
                        return_value = team_friendship; 
                    }
                    else {
                        return_value = 0; 
                    }
                    break;
                case `Overworld`: 
                    return_value = team_friendship; 
                    break;
                case `To Battle`: 
                    return_value = team_friendship; 
                    break;
            }
            return return_value + "/255"
        },
        statusConditionConverter(statusCondition) {
            if (statusCondition) {
                if (this.mapper.properties.meta.generation == 1) {
                    return
                }
                if (this.mapper.properties.meta.generation == 2) {
                    return
                }
                if (this.mapper.properties.meta.generation == 3) {
                    return
                }
                if (this.mapper.properties.meta.generation == 4) {
                    switch (statusCondition) {
                        case "Asleep":         return "SLP"
                        case "Poisoned":       return "PSN"
                        case "Burned":         return "BRN"
                        case "Frozen":         return "FRZ"
                        case "Paralyzed":      return "PAR"
                        case "Badly Poisoned": return "PSN"
                        default:               return ""
                    }
                }
                if (this.mapper.properties.meta.generation.value == 5) {
                    return
                }
            }
            else return ""
        },
        getTrainer(trainer) {
            return this.trainerData.find(x => x.trainer_name === trainer)
        },
        getNature(pid) { //Pass ins the PID (Personality ID also known as the Personality Value)
            let index = pid.value % 25
            nature = Object.values(this.natures).find(x => x.index === index)
            return nature
        },
        countSetBits(byte) { //Used to determine the number of badges the player has
            let count = 0;
            while (byte) {
                count += byte & 1;
                byte >>= 1;
            }
            return count;
        },
        decimalToPercentage(decimal) {
            return Math.round(decimal * 100);
        },
        decimalToHex(decimal) {
            if (typeof decimal !== 'number' || decimal !== parseInt(decimal)) {
                throw new Error('Input must be a valid integer.');
            }
            return decimal.toString(16).toUpperCase();
        },
        getMoveCategory(category, move) {
            var move = move
            var categoryText = category
            if (this.ready == false) { return ["", "",]}
            if (category == "Physical") { return [category, "current_physical"] }
            if (category == "Special")  { return [category, "current_special"] }
            if (category == "Status")   { return [category, "current_status"] }
            else {return [category, "current_physical"]}
        },
        getStat(stat) { //stat = the name of the stat ie. "hp", "attack", "defense", etc.
            const state = this.mapper.properties.meta.state.value
            const battle_ram = this.mapper.properties.battle.player.active_pokemon
            var ability = this.mapper.properties.battle.player.active_pokemon.ability.value
            var currentStat = 0
            var modifier = 0
            var stageModification = 1
            var return_value = 0

            var starter = this.evolution ? this.selected_evolution_species : this.starter

            if (state == `Battle`) {
                currentStat = this.mapper?.properties?.battle?.player?.active_pokemon?.stats[stat].value
                modifier = this.mapper?.properties?.battle?.player?.active_pokemon?.modifiers[stat].value == null ? 0 
                    : this.mapper?.properties?.battle?.player?.active_pokemon?.modifiers[stat].value
                if (ability == 'Simple') {
                        switch (modifier) {
                            case -4: modifier = -6; break;
                            case -5: modifier = -6; break;
                            case -6: modifier = -6; break;
                            case 4:  modifier = 6;  break;
                            case 5:  modifier = 6;  break;
                            case 6:  modifier = 6;  break;
                            default: modifier = modifier * 2; break;
                        }
                }
                stageModification = this.stageModifiersData.stats[modifier] == undefined ? 1 
                    : this.stageModifiersData.stats[modifier]
                return_value = Math.floor(currentStat * stageModification)
                //assign buffer values
                this.buffer_battle_level           = battle_ram.level.value
                this.buffer_battle_exp             = battle_ram.exp.value
                this.buffer_battle_hp              = battle_ram.stats.hp_max.value
                switch (stat) {
                    case 'attack':          this.buffer_battle_attack          = return_value; break;
                    case 'defense':         this.buffer_battle_defense         = return_value; break;
                    case 'speed':           this.buffer_battle_speed           = return_value; break;
                    case 'special_attack':  this.buffer_battle_special_attack  = return_value; break;
                    case 'special_defense': this.buffer_battle_special_defense = return_value; break;
                }
            }
            else if (state == `From Battle`) {
                switch (stat) {
                    case 'attack':          return_value = this.buffer_battle_attack;          break;
                    case 'defense':         return_value = this.buffer_battle_defense;         break;
                    case 'speed':           return_value = this.buffer_battle_speed;           break;
                    case 'special_attack':  return_value = this.buffer_battle_special_attack;  break;
                    case 'special_defense': return_value = this.buffer_battle_special_defense; break;
                }
            }
            else if (state == `No Pokemon`) {
                var statName = ""
                switch (stat) {
                    case "attack":          statName = "base_atk";     break;
                    case "defense":         statName = "base_def";     break;
                    case "speed":           statName = "base_spd";     break;
                    case "special_attack":  statName = "base_spc_atk"; break;
                    case "special_defense": statName = "base_spc_def"; break;
                }
                return_value = this.g4PokemonData[starter][statName]
            }
            else if (state == `Overworld` || state == `To Battle`) {
                return_value = this.mapper?.properties?.player?.team[0].stats[stat].value
                if (stat == 'speed' && this.mapper.properties.player.team[0].status_condition.value == 'Paralyzed') {
                    return_value = Math.floor(return_value / 4)
                }
            }
            // console.log(stat, state, currentStat, modifier, stageModification, return_value) 
            return return_value
        },
        getEnemyStat(statName, statValue, slotIndex) { //stat = the name of the stat ie. "hp", "attack", "defense", etc.
            let currentStat = 0
            let modifier = this.mapper?.properties?.battle?.opponent?.active_pokemon?.modifiers[statName].value
            // console.log('Enemy Stat:', statValue)
            if (modifier == null) {
                return statValue
            }
            else if (this.mapper.properties.meta.state.value == `Battle` && this.mapper.properties.battle.opponent.party_position == slotIndex) {
                currentStat = this.mapper?.properties?.battle?.opponent?.team[slotIndex].stats[statName].value
                
                stageModification = this.stageModifiersData.stats[modifier]
                calculated_stats = Math.floor(currentStat * stageModification)
                if (calculated_stats == 0 || calculated_stats > 1500) { 
                    return statValue 
                } 
                else {
                    return calculated_stats
                }
            }
            else {
                return this.mapper?.properties?.battle?.opponent?.team[slotIndex].stats[statName].value
            }
        },
        enemyMove(slot, moveNumber) {
            if (this.mapper.properties.meta.state.value == `Battle` || this.mapper.properties.meta.state.value == `From Battle`) {
                return this.enemy_mon_static[slot].moves[moveNumber]
            }
            else {
                return
            }
        },
        getMove(moveNumber) {
            const state = this.mapper.properties.meta.state.value
            const species = this.mapper.properties.player.team[0].species.value
            const active_pokemonPv = this.mapper.properties.battle.player.active_pokemon.internals.personality_value.value
            const teamPokemonPv = this.mapper.properties.player.team[0].internals.personality_value.value
            if (state == `Battle` || state == `From Battle` || (state == `No Pokemon` && species != null && active_pokemonPv == teamPokemonPv)) {
                // return this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber]?.move?.value
                if (this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber - 1]?.move.value) {
                    return this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber - 1]?.move.value
                }
            }
            else if (state == `Overworld`) {
                // return this.mapper.properties.player.team[0]?.moves["move" + moveNumber]?.move.value
                if (this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.move.value) {
                    return this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.move.value
                }
            }
            else if (state == `No Pokemon`) {
                return
            }
        },
        getMoveType(x) {
            const move = this.platinum_moves[this.getMove(x)]?.Move
            if (move == 'Natural Gift') {
                return this.moveType(move)
            }
            else {
                return this.platinum_moves[this.getMove(x)]?.Type.toLowerCase()
            }
        },
        getMoveObject(moveNumber) {
            const state = this.mapper.properties.meta.state.value
            const species = this.mapper.properties.player.team[0].species.value
            const active_pokemonPv = this.mapper.properties.battle.player.active_pokemon.internals.personality_value.value
            const teamPokemonPv = this.mapper.properties.player.team[0].internals.personality_value.value
            if (state == `Battle` || state == `From Battle` || (state == `No Pokemon` && species != null && active_pokemonPv == teamPokemonPv)) {
                if (this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber - 1]?.move.value) {
                    return this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber - 1]
                }
            }
            else if (state == `Overworld`) {
                if (this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.move.value) {
                    return this.mapper.properties.player.team[0]?.moves[moveNumber - 1]
                }
            }
            else if (state == `No Pokemon`) {
                return {
                    move: {
                        value: null,
                    },
                    pp: null,
                    ppUp: null,
                }
            }
        },
        getPP(moveNumber) {
            const state = this.mapper.properties.meta.state.value
            const species = this.mapper.properties.player.team[0].species.value
            const active_pokemonPv = this.mapper.properties.battle.player.active_pokemon.internals.personality_value.value
            const teamPokemonPv = this.mapper.properties.player.team[0].internals.personality_value.value
            if (state == `Battle` || state == `From Battle` || (state == `No Pokemon` && species != null && active_pokemonPv == teamPokemonPv)) {
                return this.mapper.properties.battle.player.active_pokemon?.moves[moveNumber - 1]?.pp.value
            }
            else if (state == `Overworld`) {
                return this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.pp.value
            }
            else if (state == `No Pokemon`) {
                return
            }
        },
        getMoveProperty(move, property) {
            if (move) {
                return this.g4MoveData[move][property]
            }
        },
        arceus_plate_check() {
            const held_item = this.mapper.properties.player.team[0].held_item.value 
            switch (held_item) {
                case "Dread Plate":  return "Dark"
                case "Draco Plate":  return "Dragon"
                case "Earth Plate":  return "Ground"
                case "Fist Plate":   return "Fighting"
                case "Flame Plate":  return "Fire"
                case "Icicle Plate": return "Ice"
                case "Insect Plate": return "Bug"
                case "Iron Plate":   return "Steel"
                case "Meadow Plate": return "Grass"
                case "Mind Plate":   return "Psychic"
                case "Pixie Plate":  return "Fairy"
                case "Sky Plate":    return "Flying"
                case "Splash Plate": return "Water"
                case "Spooky Plate": return "Ghost"
                case "Stone Plate":  return "Rock"
                case "Toxic Plate":  return "Poison"
                case "Zap Plate":    return "Electric"
                default:             return "Normal"
            }
        },
        getSoloMonType(pkmn, type) { //type == type_1 or type_2
            // const species = pkmn
            const species = this.starter
            var held_item = ""
            if (this.starter == 'Arceus') {
                return this.arceus_plate_check()
            }
            if (this.mapper.properties.meta?.state?.value == `From Battle`) {
                return this.g4PokemonData[species][type]
            }
            if (this.mapper.properties.meta.state.value == `From Battle`) {
                return this.g4PokemonData[species][type]
            }
            if (this.mapper.properties.meta.state.value == `Battle`) {
                typeString = "type_1"
                if (type == "type_2") {
                    typeString = "type_2"
                    return this.mapper.properties.battle?.player?.active_pokemon[typeString]?.value
                }
                return this.mapper.properties.battle?.player?.active_pokemon[typeString]?.value
            }
            if (this.mapper.properties.meta?.state?.value == `No Pokemon` || this.mapper.properties.meta?.state?.value == `Overworld`) {
                return this.g4PokemonData[species][type]
            }
        },
        move_name(move_string) { //converts move strings so that they are formatted correctly
            if (move_string != undefined) {
                if (move_string.toLowerCase() == "vicegrip")     { return "ViceGrip" }
                if (move_string.toLowerCase() == "doubleslap")   { return "DoubleSlap" }
                if (move_string.toLowerCase() == "double-edge")  { return "Double-Edge" }
                if (move_string.toLowerCase() == "solarbeam")    { return "SolarBeam" }
                if (move_string.toLowerCase() == "extremespeed") { return "ExtremeSpeed" }
                if (move_string.toLowerCase() == "dynamicpunch") { return "DynamicPunch" }
                if (move_string.toLowerCase() == "thunderpunch") { return "ThunderPunch" }
                if (move_string.toLowerCase() == "bubblebeam")   { return "BubbleBeam" }
                if (move_string.toLowerCase() == "grasswhistle") { return "GrassWhistle" }
                if (move_string.toLowerCase() == "softboiled")   { return "Softboiled" }
                if (move_string.toLowerCase() == "sand-attack")  { return "Sand-Attack" }
                if (move_string.toLowerCase() == "mud-slap")     { return "Mud-Slap" }
                if (move_string.toLowerCase() == "featherdance") { return "FeatherDance" }
                if (move_string.toLowerCase() == "poisonpowder") { return "PoisonPowder" }
                if (move_string.toLowerCase() == "dragonbreath") { return "DragonBreath" }
                if (move_string.toLowerCase() == "ancientpower") { return "AncientPower" }
                if (move_string.toLowerCase() == "smellingsalt") { return "SmellingSalt" }
                if (move_string.toLowerCase() == "selfdestruct") { return "Selfdestruct" }
                if (move_string.toLowerCase() == "smokescreen")  { return "SmokeScreen" }
                if (move_string.toLowerCase() == "sonicboom")    { return "SonicBoom" }
                if (move_string.toLowerCase() == "will-o-wisp")  { return "Will-O-Wisp" }
                else { return move_string }
            }
            else { return move_string }
        },
        enemyDynamic(activePkmn, currentSlot) {
            if (activePkmn == currentSlot && this.mapper.properties.meta.state.value == "Battle") {
                return this.mapper?.properties?.battle?.opponent?.active_pokemon
            }
            else { 
                return this.mapper?.properties?.battle?.trainer?.team[activePkmn]
            }
        },

        //SPLITS
        currentSplit(splitData) {
            var arrayLength = splitData.length
            var split = splitData[arrayLength]["realtime.end"]
            return this.formatDuration(split)
        },
        lastSplit(splitData) {
            var arrayLength = splitData.length
            var splitNumber = arrayLength - 1
            var split = splitData[splitNumber]["realtime.end"]
            return this.formatDuration(split)
        },
        formatDuration(x) {
            if (x.startsWith("00:")) {
                x = x.substring(3)
            }
            if (x.startsWith(0)) {
                x = x.substring(1)
            }
            x = x.substring(0, x.length-4)
            return x
        },
        split(splitName, splits) {
            // console.log(splits)
            var split = splits.find(x => x.trainer_name === splitName)
            if (split == undefined) return
            return split["realtime.end.hours"] + ":" + split["realtime.end.minutes"] + ":" + split["realtime.end.seconds"]
        },
        split_image(trainer) {
            // Convert trainer name to image filename
            // Handle both original names (with prefixes) and display names (with numbers)
            if (!trainer) return ""
            let imageName = trainer
            // Remove numbers from names like "Rival 2" -> "Rival", "Cyrus 1" -> "Cyrus"
            // This handles display names that have numbers added
            const numberMatch = imageName.match(/^(.+?)\s+\d+$/)
            if (numberMatch) {
                imageName = numberMatch[1]
                // If we removed a number from "Cyrus 1", add back "Galactic Boss " prefix
                // since the image file is "Galactic Boss Cyrus.png"
                if (imageName === "Cyrus") {
                    imageName = "Galactic Boss Cyrus"
                }
            } else {
                // Remove "Leader " prefix (image files don't have this prefix)
                if (imageName.startsWith("Leader ")) {
                    imageName = imageName.substring(7)
                }
                // Remove "Elite Four " prefix (image files don't have this prefix)
                if (imageName.startsWith("Elite Four ")) {
                    imageName = imageName.substring(11)
                }
                // Remove "Commander " prefix (image files don't have this prefix)
                if (imageName.startsWith("Commander ")) {
                    imageName = imageName.substring(10)
                }
                // Keep "Galactic Boss " prefix because image file is "Galactic Boss Cyrus.png"
                // (don't remove it)
            }
            return imageName
        },
        format_display_name(trainer, occurrenceCount) {
            // Format the display name by removing prefixes and adding numbers where needed
            if (!trainer) return ""
            let displayName = trainer
            
            // Remove prefixes
            if (displayName.startsWith("Leader ")) {
                displayName = displayName.substring(7)
            } else if (displayName.startsWith("Commander ")) {
                displayName = displayName.substring(10)
            } else if (displayName.startsWith("Galactic Boss ")) {
                displayName = displayName.substring(14)
            }
            
            // Handle Rival numbering (skip first occurrence, number 2-6)
            if (displayName === "Rival") {
                if (occurrenceCount > 1) {
                    // occurrenceCount is 1-indexed, so for display we want 2-6
                    const displayNumber = occurrenceCount
                    if (displayNumber >= 2 && displayNumber <= 6) {
                        return `Rival ${displayNumber}`
                    }
                }
                // Skip first occurrence (don't display)
                return null
            }
            
            // Handle Cyrus numbering (1-3)
            if (displayName === "Cyrus") {
                if (occurrenceCount >= 1 && occurrenceCount <= 3) {
                    return `Cyrus ${occurrenceCount}`
                }
            }
            
            return displayName
        },

        curseType(x) {
            if (x == `Curse`) {
                return "???"
            }
            else {
                return x
            }
        },
        //AUTOMATION MOVEPOOL GRAPHIC
        dataSearch(dataObject, pointerValue) {
            if (!pointerValue) return ""
            const key = Object.keys(dataObject).find(x => x.toLowerCase() == pointerValue.toLowerCase())
            return dataObject[key] || "ERROR"
        },
        getMovepool(gen3PkmnData, moveData, tmhmMapping, species) {
            const pkmn = this.dataSearch(gen3PkmnData, species)
            let obj = {
                level: pkmn.level_up_learnset.map(x => {
                    return {
                        ...{Level: x[0]},
                        ...this.dataSearch(moveData, x[1]) //searching for index 1
                    }
                }), 
                tmhm: pkmn.tm_hm_learnset.map(x => {
                    return {
                        ...{tmhm: tmhmMapping.find(y => y.Move == x)?.tmhmIndex??"TM01"},
                        ...this.dataSearch(moveData, x)
                    }
                }),     
                tutor: pkmn.tutor_learnset.map(x => {
                    return this.dataSearch(moveData, x)
                }),    
                // egg: pkmn.egg_moves.map(x => {
                //     return this.dataSearch(moveData, x)
                // }),    
            }
            return obj
        }, 

        movepoolResize() {
            // console.log("movepool")
            let out = this.movepoolResizeCalc();
            if(this.mapper.properties.meta.state.value == "From Battle") {
                return out;
            }
            this.mapper.properties.player.team[0].species.change((newProp, oldProp) => {
                out = this.movepoolResizeCalc();
            })
            return out;
        },
        movepoolResizeCalc() {
            // console.log("calc")
            if(!this.game.dexData){ 
                return;
            }

            let small_line_height = 19;
            let resize_threshold = 20;
            this.movepoolDefaultFontSize = 14;
            this.movepoolDefaultLineHeight = 21;
            this.movepoolDefaultContainerHeight = 997-(this.movepoolDefaultLineHeight);
            let maxSize = this.movepoolDefaultContainerHeight / this.movepoolDefaultLineHeight;

            //calculate new sizes
            // Use displayedPokemonSpecies to get the correct species for movepool sizing
            // This ensures the movepool size is based on the selected evolution family member
            let currentStarter = this.displayedPokemonSpecies;
            if(currentStarter == undefined || currentStarter == null) {
                if(this.mapper.properties.player.team[0].species) {
                    currentStarter = this.mapper.properties.player.team[0].species.value;
                }
                else {
                    currentStarter = this.starter;
                }
            }

            let movepoolSize = this.game.dexData[currentStarter].tm_hm_learnset.length + this.game.dexData[currentStarter].levelup_moveset.length;
            
            if (this.show_tutor_moves) {
                movepoolSize = movepoolSize + this.game.dexData[currentStarter].tutor_learnset.length;
            }
            let correctedLineHeight = this.movepoolDefaultContainerHeight / movepoolSize;
            let fontShrinkFactor = 0.77; //make this bigger to shrink the font more. 0.5 was the default in gen1-3. 0 = no shrinking. 1 or above will be *tiny*
            //This is fairly arbitrary. This formula reduces the font size gradually based on the shrink factor
            let correctedFontSize = this.movepoolDefaultFontSize * Math.pow(correctedLineHeight / this.movepoolDefaultLineHeight, fontShrinkFactor); 

            if (movepoolSize > (maxSize)) {
                return "line-height: " + correctedLineHeight + "px; font-size: "+correctedFontSize+"px;";
            }
            else if (movepoolSize < resize_threshold) {
                return "line-height: " + small_line_height + "px; font-size: "+this.movepoolDefaultFontSize+"px;";
            }
            else if (movepoolSize < resize_threshold) {
                return "line-height: " + small_line_height + "px; font-size: "+this.movepoolDefaultFontSize+"px;";
            }
            else {
                return "line-height: " + correctedLineHeight + "px; font-size: "+this.movepoolDefaultFontSize+"px;";
            }
        },
        
        // MOVE ACCURACY
        getAccuracy(accuracy, move) {
            const weather   = this.mapper.properties.battle.field.weather.value
            const state     = this.mapper.properties.meta.state.value
            const held_item = this.mapper.properties.player.team[0].held_item.value
            if (accuracy == `-`) {
                return `—`
            }
            if (accuracy == `—`) {
                return `—`
            }
            if (this.mapper.properties.player?.team[0]?.ability?.value == 'No Guard') {
                return `—`
            }
            if (this.mapper.properties.player?.team[0]?.ability?.value == 'Compound Eyes') {
                accuracy = accuracy * 1.3
            }
            if (weather == 'Hail' && move == 'Blizzard' && state == 'Battle') {
                return `—`
            }
            if (state == `Overworld`) {
                let item_modifier = 1
                switch (held_item) {
                    case "Wide Lens": item_modifier = 4505/4096; break;
                    case "Zoom Lens": item_modifier = 4915/4096; break;
                    default: item_modifier = 1; break;
                }
                let calculated_accuracy = Math.floor(accuracy * item_modifier) <= 100 ? Math.floor(accuracy * item_modifier) : 100
                return calculated_accuracy
            }
            if (state == `Battle`) {
                let playerStage = this.mapper.properties.battle.player.active_pokemon.modifiers.accuracy?.value?.toString()
                let oppAStage = this.mapper.properties.battle.opponent.active_pokemon.modifiers.evasion?.value?.toString()
                let accuracyModifier = this.stageModifiersData["accuracy"][playerStage]
                let evasionModifier = this.stageModifiersData["evasion"][oppAStage]
                let modifiers = this.mapper.properties.battle.player.active_pokemon.modifiers
                let item_modifier = 1
                switch (held_item) {
                    case "Wide Lens": item_modifier = 4505/4096; break;
                    case "Zoom Lens": {
                        const player_speed = this.mapper.properties.battle.player.active_pokemon.stats.speed.value
                        const enemy_speed  = this.mapper.properties.battle.opponent.active_pokemon.stats.speed.value
                        if (player_speed < enemy_speed) { item_modifier = 4915/4096 }
                        else { item_modifier = 1 }
                        break;
                    }
                    default: item_modifier = 1; break;
                }
                let calculated_accuracy = Math.floor(accuracy * accuracyModifier * evasionModifier * item_modifier) <= 100 ? Math.floor(accuracy * accuracyModifier * evasionModifier * item_modifier) : 100
                if (calculated_accuracy == "err") {
                    // console.log(
                    //     accuracy,
                    //     playerStage,
                    //     oppAStage,
                    //     accuracyModifier,
                    //     evasionModifier,
                    //     calculated_accuracy,
                    //     state,
                    //     this.mapper.properties.meta.state_enemy.value,
                    // )
                }
                return calculated_accuracy
            }
            else return accuracy
        },
        
        //DAMAGE CALCULATION
        damageCalculation(userPkmnData, targetPkmnData, move) {
            if (this.mapper.properties.meta.state.value != `Battle`) { return "" }
            //Setup data for calculation
            var lvl = userPkmnData.level.value
            var userAttack = userPkmnData.attack.value
            var userSpecial = userPkmnData.special.value
            var userType1 = userPkmnData.type_1.value
            var userType2 = userPkmnData.type_2.value
            
            var targetDefense = targetPkmnData.defense.value
            var targetSpecial = targetPkmnData.special.value
            var targetMaxHp = targetPkmnData.hp_max.value
            var targetType1 = targetPkmnData.type_1.value
            var targetType2 = targetPkmnData.type_2.value
            var defenderScreen = undefined

            var moveData = this.gen1moves.find(x => x.Move.toUpperCase() === move)
            var moveType = moveData.Type
            var movePower = moveData.Power
            var moveCategory = moveData.Category
            
            var stab = 1
            var AttackingTypeEffectiveness = this.typeData.find(x => x.moveType === moveType)
            var critical = 1
            var screens = 1

            var userOffensiveStat = undefined
            var targetDefensiveStat = undefined

            var AttackingTypeEffectiveness = this.typeData.find(x => x.moveType === moveType)
            var type1 = AttackingTypeEffectiveness[targetType1]
            var type2 = AttackingTypeEffectiveness[targetType2]

            //Check values & update modifiers
            if (moveType == userType1 || moveType == userType2) {
                stab = 1.5
            }
            if (moveCategory == "Physical") {
                userOffensiveStat = userAttack
                targetDefensiveStat = targetDefense
                defenderScreen = targetPkmnData.effects.reflect.value
            }
            if (moveCategory == "Special") {
                userOffensiveStat = userSpecial
                targetDefensiveStat = targetSpecial
                defenderScreen = targetPkmnData.effects.lightscreen.value
            }
            if (moveCategory == "Status") {
                return ""
            }
            if (defenderScreen == true) {
                screens = .5
            }
            //Run damage calculation
            part1 = Math.floor(Math.floor((2 * lvl * critical)/5 + 2) * movePower * userOffensiveStat)
            part2 = Math.floor(part1/targetDefensiveStat)
            part3 = Math.floor(part2/50) + 2
            part4 = undefined
            if (targetType1 == targetType2) {
                part4 = Math.floor(Math.floor(Math.floor(part3 * stab) * type1) * screens)
            }
            else {
                part4 = Math.floor(Math.floor(Math.floor(Math.floor(part3 * stab) * type1) * type2) * screens)
            }
            //Results to return
            damageMin = Math.floor(part4 * (217/255))
            damageMax = part4
            minPercentage = Math.round((damageMin/targetMaxHp) * 100)
            maxPercentage = Math.round((damageMax/targetMaxHp) * 100)
            var recoilMin = 0
            var recoilMax = 0
            if (move == "TAKE DOWN" || move == "SUBMISSION" || move == "DOUBLE-EDGE") {
                recoilMin = Math.floor(damageMin * 0.25)
                recoilMax = Math.floor(damageMax * 0.25)
            }

            return [damageMin, damageMax, minPercentage, maxPercentage, recoilMin, recoilMax,]
        },
        speed_comparison(slotIndex, enemySpeedValue) {
            const state = this.mapper.properties.meta.state.value
            // Compare player's active pokemon speed with enemy pokemon speed
            const playerSpeed = this.mapper.properties?.battle?.player?.active_pokemon?.stats?.speed?.value || 0
            const enemySpeed = enemySpeedValue || 0
            
            let comparison
            if (playerSpeed > enemySpeed) {
                comparison = "Outspeeds"
            } else if (playerSpeed == enemySpeed) {
                comparison = "Speed-Tied"
            } else {
                comparison = "Underspeeds"
            }
            
            return { comparison }
        },
        svgColorClass(comparison, enemyPkmnData) {
            // Return appropriate CSS class based on speed comparison
            if (!comparison) return "grey-svg"
            
            if (comparison === "Outspeeds") {
                return "blue-svg"  // Player is faster
            } else if (comparison === "Speed-Tied") {
                return "yellow-svg"  // Speed tie
            } else if (comparison === "Underspeeds") {
                return "red-svg"  // Enemy is faster
            }
            
            return "grey-svg"  // Default fallback
        },
        
        // STAGE MULTIPLIERS
        enemyStatModification(activePkmn, currentSlot, statLabel, stat, modifier, pkmnData) {
            var modData = this.stageModifiersData.find(x => x.modType === "stat")
            var modified_stat = stat
            var status_paralysis = 1
            var status_burn = 1
            var mod_ability = 1
            var mod_weather = 1

            if (pkmnData.status1.value == "Paralyzed" && statLabel == "speed") { status_paralysis = .25 } // sets modifier for paralysis if the Pokemon is paralyzed
            if (pkmnData.status1.value == "Burned" && statLabel == "attack")   { status_burn = .25 }      // sets modifier for burn if the Pokemon is burned

            //ABILITIES
            //Guts
            if (pkmnData.ability?.value.toLowerCase() == "guts" && statLabel == "attack" && 
            (pkmnData.status1.value == "Burned" || pkmnData.status_condition.value == "Paralyzed" || pkmnData.status_condition.value == "Poisoned" || pkmnData.status_condition.value == "Badly Poisoned" || pkmnData.status_condition.value == "Badly Posioned")) {
                mod_ability = 1.5 
            }
            //Marvel Scale
            if (pkmnData.ability?.value.toLowerCase() == "marvel scale" && statLabel == "defense" && pkmnData.status_condition.value != null) {
                mod_ability = 1.5 
            }
            //Chlorophyll
            if (pkmnData.ability?.value.toLowerCase() == "chlorophyll" && statLabel == "speed" && this.mapper.properties.battle.field.weather.value == "Sun") {
                mod_weather = 2 
            }
            //Swift Swim
            if (pkmnData.ability?.value.toLowerCase() == "swift swim" && statLabel == "speed" && this.mapper.properties.battle.field.weather.value == "Rain") {
                mod_weather = 2 
            }
            //Torrent
            //Blaze
            //Overgrow

            //CALCULATES THE CORRECT STAT
            if (activePkmn == currentSlot && this.mapper.properties.meta.state.value == "Battle") {
                modified_stat = Math.floor(stat * modData[modifier] * status_paralysis * status_burn * mod_ability * mod_weather)
            }

            //RETURNS THE CORRECT VALUE
            if (this.enemyState == "Fainted" || this.mapper.properties.meta.state.value == "From Battle") {
                return stat
            }
            if (this.enemyState == "Pokemon" || this.enemyState == "Fainting") {
                return modified_stat
            }
            return modified_stat
        },
        paralysis(speed) {
            if (this.s1.status_condition.value == `Paralyzed`) {
                return Math.floor(speed * 0.25)
            }
            else {
                return speed
            }
        },
        martSelector() {
            if (this.mapper.properties.overworld.map_name.value == "CELADON_CITY - DEPARTMENT_STORE_5F") { return "EVs"}
            else {
                return null }
        },
        ability(ability, statname, statValue) {
            if (ability == `Hustle` && statname == `attack`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Huge Power` && statname == `attack`) {
                return Math.floor(statValue * 2)
            }
            else if (ability == `Marvel Scale` && this.s1.status_condition.value != null && statname == `defense`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Chlorophyll` && this.batt.field.weather.value == `Sun` && statname == `speed`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Swift Swin` && this.batt.field.weather.value == `Rain` && statname == `speed`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Guts` && statname == `attack` && (this.s1.status_condition.value == "Paralyzed" || this.s1.status_condition.value == "Poisoned" || this.s1.status_condition.value == "Burned")) {
                return Math.floor(statValue * 1.5)
            }
            else { 
                return statValue
            }
        },

        //REMOVES CAPITALIZATION (TACKLE -> Tackle) OR (Tail Whip -> Tail whip)
        capitalization_format(str) {
            if (str == null) { return "" }
            return str.toLowerCase().replace(/(^|\s|\-|\.)(\w)/g, function(match, p1, p2) {
              return p1 + p2.toUpperCase();
            });
        },
        getPokemonImageUrl: function (x) {
            if (x != null)
                return `images/overlay/${x.pokedexNumber}.png`
        },
        getStarterArt: function () {
            return `images/pokemon/${this.starter}.png`
        },
        getStarterImageUrl: function () {
            return `images/overlay/${this.starter}.png`
        },
        getStarterTypeTexture() {
            if (this.pick == true) {
                var type = this.gen3data.find(y => y.dexNumber === this.starter)
                return `images/elements/textures/${type.type1.toLowerCase()}.png`
            }
            else
                return `images/elements/textures/normal.png`
        },
        pascalCaseSpace(str) {
            let words = str.split(' ');
            for (let char of words) {
                words[words.indexOf(char)] = char.charAt(0).toUpperCase() + char.slice(1);
            }
            return words.join(' ');
        },
        pascalCaseDot(str) {
            let words = str.split('.');
            for (let char of words) {
                words[words.indexOf(char)] = char.charAt(0).toUpperCase() + char.slice(1);
            }
            return words.join(' ');
        },
        
        //TYPE ICONS FOR THE STARTER SELECTION
        starterTypeCheck() {
            if (this.pick == true)
                var starterType1 = this.gen3data.find(y => y.dexNumber === this.starter)
                var starterType2 = this.gen3data.find(y => y.dexNumber === this.starter)
                if (starterType2.type2 == null)
                    return true
                else   
                    return false
        },
        getStarterType1() {
            if (this.pick == true)
                var type = this.g4PokemonData[this.starter].type_1
                return `images/elements/types/${type.toLowerCase()}.png`
        },
        getStarterType2() {
            if (this.pick == true)
                var type = this.g4PokemonData[this.starter].type_2
                return `images/elements/types/${type.toLowerCase()}.png`
        },

        //BADGE GRAPHIC RECALL
        badgeGraphic(x) {
            if (x.value == true) {
                var badge = x.path.toString().substring(14)
                return `images/badges/${badge}.png`
            }
            else if (x.value == false) {   
                return null
            }
        },
        
        //GENERAL FUNCTIONS
        nullCheck(y) {
            if (y != null || y != undefined || y != "null")
                return y
            else
                return ""
            },
        pokemon(y, x) {
            if (y != null)
                var pkmnData = this.gen3data.find(x => x.dexNumber === y.toString())
                return pkmnData[x]
        },
        stageModifiers(y) {
            if (y === null) {
                return ""
            }
            else
                if (y > 0) {
                    return "+" + y.toString()
                }
                else
                    if (y < 0) {
                        return y.toString()
                    }
                    else
                        return ""
        },
        species(x) {
            if (x != null && x.value != null)
                return x.value.name
            else
                return null
        },
        abilityDescription(y) {
            return gen3abilities[y]
        },
        
        //DAMAGE CALCULATIONS
        damageRange(x, y, z) {
            level = this.mapper.properties.battle.player.active_pokemon.level.value
            attack = this.mapper.properties.battle.player.active_pokemon.attack.value
            defense = this.mapper.properties.battle.opponent.active_pokemon.defense.value
            specialA = this.mapper.properties.battle.player.active_pokemon.special.value
            specialD = this.mapper.properties.battle.opponent.active_pokemon.special.value
            power = x
            stab = 1.5
            type1 = y
            type2 = z
            const randomMax = 1
            const randomMin = 217 / 255
            damageMax = ((((((2 * level / 5) + 2) * power * attack) / defense) / 50) + 2) * stab * type1 * type2 * randomMax
            damageMin = ((((((2 * level / 5) + 2) * power * attack) / defense) / 50) + 2) * stab * type1 * type2 * randomMin
            return damageMin.toString() + "-" + damageMax.toString()
        },
        
        //GAMETIME FUNCTIONS
        gameTimeHM(h, m) {
            if (h <= 0) return m;
            if (m < 10) 
                m = "0" + m.toString();
            return `${h}:${m}`;
        },
        gameTimeHMS(h, m, s) {
            if (h <= 0) {
                if (m <= 0) return `${s}`;
                if (s < 10) s = "0" + s.toString();
                return `${m}:${s}`;
            }
            if (s < 10) s = "0" + s.toString();
            if (m < 10) m = "0" + m.toString();
            return `${h}:${m}:${s}`;
        },
        leadZero(y) {
            if (y < 10) return "0" + y.toString();
            return y;
        },
        
        //INVENTORY FUNCTIONS
        itemCheck(y) {
            if (y == "--End of list--") return " ";
            return y;
        },
        ifZero(y) {
            if (y != 0) return y;
            return " ";
        },
        nullToNone(y) {
            if (y == 0) 
                return "None"
            return y
        },
        nullToSpace(y) {
            if (y == 0) 
                return " "
            return y
        },
        sleep(ms) {
            return new Promise((res) => setTimeout(res, ms))
        },
        
        //EXPERIENCE FUNCTIONS
        growthRate() {
            var growthRate = this.g4PokemonData[this.starter].growth_rate
            if (growthRate == "GROWTH_MEDIUM_SLOW") {
                return "Medium Slow"
            }
            else if (growthRate == "GROWTH_MEDIUM_FAST") {
                return "Medium Fast"
            }
            else if (growthRate == "GROWTH_FAST") {
                return "Fast"
            }
            else if (growthRate == "GROWTH_SLOW") {
                return "Slow"
            }
            else if (growthRate == "GROWTH_FLUCTUATING") {
                return "Fluctuating"
            }
            else if (growthRate == "GROWTH_ERRATIC") {
                return "Erratic"
            }
            else {
                return this.g4PokemonData[this.starter].growth_rate
            }
        },
        calcExpStats(growthRate, exp) {
            const expTable = {
                "Erratic":     [0,15,52,122,237,406,637,942,1326,1800,2369,3041,3822,4719,5737,6881,8155,9564,11111,12800,14632,16610,18737,21012,23437,26012,28737,31610,34632,37800,41111,44564,48155,51881,55737,59719,63822,68041,72369,76800,81326,85942,90637,95406,100237,105122,110052,115015,120001,125000,131324,137795,144410,151165,158056,165079,172229,179503,186894,194400,202013,209728,217540,225443,233431,241496,249633,257834,267406,276458,286328,296358,305767,316074,326531,336255,346965,357812,367807,378880,390077,400293,411686,423190,433572,445239,457001,467489,479378,491346,501878,513934,526049,536557,548720,560922,571333,583539,591882,600000],
                "Fast":        [0,6,21,51,100,172,274,409,583,800,1064,1382,1757,2195,2700,3276,3930,4665,5487,6400,7408,8518,9733,11059,12500,14060,15746,17561,19511,21600,23832,26214,28749,31443,34300,37324,40522,43897,47455,51200,55136,59270,63605,68147,72900,77868,83058,88473,94119,100000,106120,112486,119101,125971,133100,140492,148154,156089,164303,172800,181584,190662,200037,209715,219700,229996,240610,251545,262807,274400,286328,298598,311213,324179,337500,351180,365226,379641,394431,409600,425152,441094,457429,474163,491300,508844,526802,545177,563975,583200,602856,622950,643485,664467,685900,707788,730138,752953,776239,800000],
                "Medium Fast": [0,8,27,64,125,216,343,512,729,1000,1331,1728,2197,2744,3375,4096,4913,5832,6859,8000,9261,10648,12167,13824,15625,17576,19683,21952,24389,27000,29791,32768,35937,39304,42875,46656,50653,54872,59319,64000,68921,74088,79507,85184,91125,97336,103823,110592,117649,125000,132651,140608,148877,157464,166375,175616,185193,195112,205379,216000,226981,238328,250047,262144,274625,287496,300763,314432,328509,343000,357911,373248,389017,405224,421875,438976,456533,474552,493039,512000,531441,551368,571787,592704,614125,636056,658503,681472,704969,729000,753571,778688,804357,830584,857375,884736,912673,941192,970299,1000000],
                "Medium Slow": [0,9,57,96,135,179,236,314,419,560,742,973,1261,1612,2035,2535,3120,3798,4575,5460,6458,7577,8825,10208,11735,13411,15244,17242,19411,21760,24294,27021,29949,33084,36435,40007,43808,47846,52127,56660,61450,66505,71833,77440,83335,89523,96012,102810,109923,117360,125126,133229,141677,150476,159635,169159,179056,189334,199999,211060,222522,234393,246681,259392,272535,286115,300140,314618,329555,344960,360838,377197,394045,411388,429235,447591,466464,485862,505791,526260,547274,568841,590969,613664,636935,660787,685228,710266,735907,762160,789030,816525,844653,873420,902835,932903,963632,995030,1027103,1059860],
                "Slow":        [0,10,33,80,156,270,428,640,911,1250,1663,2160,2746,3430,4218,5120,6141,7290,8573,10000,11576,13310,15208,17280,19531,21970,24603,27440,30486,33750,37238,40960,44921,49130,53593,58320,63316,68590,74148,80000,86151,92610,99383,106480,113906,121670,129778,138240,147061,156250,165813,175760,186096,196830,207968,219520,231491,243890,256723,270000,283726,297910,312558,327680,343281,359370,375953,393040,410636,428750,447388,466560,486271,506530,527343,548720,570666,593190,616298,640000,664301,689210,714733,740880,767656,795070,823128,851840,881211,911250,941963,973360,1005446,1038230,1071718,1105920,1140841,1176490,1212873,1250000],
                "Fluctuating": [0,4,13,32,65,112,178,276,393,540,745,967,1230,1591,1957,2457,3046,3732,4526,5440,6482,7666,9003,10506,12187,14060,16140,18439,20974,23760,26811,30146,33780,37731,42017,46656,50653,55969,60505,66560,71677,78533,84277,91998,98415,107069,114205,123863,131766,142500,151222,163105,172697,185807,196322,210739,222231,238036,250562,267840,281456,300293,315059,335544,351520,373744,390991,415050,433631,459620,479600,507617,529063,559209,582187,614566,639146,673863,700115,737280,765275,804997,834809,877201,908905,954084,987754,1035837,1071552,1122660,1160499,1214753,1254796,1312322,1354652,1415577,1460276,1524731,1571884,1640000]
            };

            // makes searching a bit easiser
            expTable["Erratic"][100]     = expTable["Erratic"][99] + 1;
            expTable["Fast"][100]        = expTable["Fast"][99] + 1;
            expTable["Medium Fast"][100] = expTable["Medium Fast"][99] + 1;
            expTable["Medium Slow"][100] = expTable["Medium Slow"][99] + 1;
            expTable["Slow"][100]        = expTable["Slow"][99] + 1;
            expTable["Fluctuating"][100] = expTable["Fluctuating"][99] + 1;
            const index = expTable[growthRate].findIndex(x => x > exp);
            const currLvlExp = expTable[growthRate][index - 1];
            const nextLvlExp = expTable[growthRate][index];
            const percentage = (exp - currLvlExp) / (nextLvlExp - currLvlExp) == NaN ? 0 : (exp - currLvlExp) / (nextLvlExp - currLvlExp)
            return {
                level: index,
                percent: percentage,
                nextLvlExp: nextLvlExp,
            };
        }, 
        expPercentageCalculation(x) {
            if ((x*100) > 100)
                return 100
            else if ((x*100) < 0)
                return 0
            else
                return x * 100
        },

        // MOVE MANAGEMENT
        movePower(y) { //y = move1.value
            if (y) {
                const state = this.mapper.properties.meta.state.value
                var move = this.generation4_moves_new[y]
                if (y == "Return") {
                    if (this.mapper.properties.player.team[0].friendship.value < 2.5)
                        var friendshipValue = 2.5 
                    else 
                        var friendshipValue = this.mapper.properties.player.team[0].friendship.value
                    var specialMovePower = Math.floor(friendshipValue/2.5)
                    return specialMovePower
                }
                else if ((y == "Flail" || y == "Reversal") && state == 'Overworld') {
                    var hpPercentage = this.mapper.properties.player.team[0].stats.hp.value / this.mapper.properties.player.team[0].stats.hp_max.value
                    if (hpPercentage >= .672) { return 20 }
                    else if (hpPercentage >= .344 && hpPercentage < .672) { return 40 }
                    else if (hpPercentage >= .203 && hpPercentage < .344) { return 80 }
                    else if (hpPercentage >= .1042 && hpPercentage < .203) { return 100 }
                    else if (hpPercentage >= .094 && hpPercentage < .1042) { return 150 }
                    else if (hpPercentage < .031) { return 200 }
                }
                else if ((y == "Flail" || y == "Reversal") && state == 'Battle') {
                    var hpPercentage = this.mapper.properties.battle.player.team[0].stats.hp.value / this.mapper.properties.battle.player.team[0].stats.hp_max.value
                    if (hpPercentage >= .6875) { return 20 }
                    else if (hpPercentage >= .344 && hpPercentage < .672) { return 40 }
                    else if (hpPercentage >= .203 && hpPercentage < .344) { return 80 }
                    else if (hpPercentage >= .1042 && hpPercentage < .203) { return 100 }
                    else if (hpPercentage >= .094 && hpPercentage < .1042) { return 150 }
                    else if (hpPercentage < .031) { return 200 }
                }
                else if ((y == "Water Spout" || y == "Eruption") && state == 'Overworld') {
                    var power = (150 * this.mapper.properties.player.team[0].stats.hp.value) / this.mapper.properties.player.team[0].stats.hp_max.value
                    if (power < 1) {
                        return 1
                    }
                    return Math.floor(power)
                }
                else if ((y == "Water Spout" || y == "Eruption") && state == 'Battle') {
                    var power = (150 * this.mapper.properties.battle.player.team[0].stats.hp.value) / this.mapper.properties.battle.player.team[0].stats.hp_max.value
                    if (power < 1) {
                        return 1
                    }
                    return Math.floor(power)
                }
                else if (y == "Frustration") {
                    if (this.mapper.properties.player.team[0].friendship.value > 252.5)
                        var friendshipValue = 252.5 
                    else 
                        var friendshipValue = this.mapper.properties.player.team[0].friendship.value
                    var specialMovePower = Math.floor((255-friendshipValue)/2.5)
                    return specialMovePower
                }
                else if (y == "Low Kick" || y == "Grass Knot") {
                    if (this.mapper.properties.meta.state.value == `Overworld` || this.mapper.properties.meta.state.value == `To Battle`) { return "—"}
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight < 10) { return 20 }
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight < 25) { return 40 }
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight < 50) { return 60 }
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight < 100) { return 80 }
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight < 200) { return 100 }
                    if (this.g4PokemonData[this.mapper.properties.battle.opponent.active_pokemon.species.value]?.weight >= 200) { return 120 }
                }
                else if (y == "Hidden Power") {
                    return this.hiddenPowerPowerCalc(this.mapper.properties.player.team[0])
                }
                else if (y == "Facade" && (this.s1.status_condition.value == "Paralyzed" || this.s1.status_condition.value == "Poisoned" || this.s1.status_condition.value == "Burned")) {
                    return move.power * 2
                }
                else if (y == "Gyro Ball") {
                    if (state != "Battle") { return "—" }
                    const user_speed = this.mapper.properties.battle.player.active_pokemon.stats.speed.value
                    const target_speed = this.mapper.properties.battle.opponent.active_pokemon.stats.speed.value
                    var base_power = Math.min(((25 * target_speed) / user_speed) + 1)
                    if (base_power > 150) { base_power = 150 }
                    return base_power
                }
                else if (y == "Natural Gift") {
                    if (this.mapper.properties.player.team[0].held_item.value == null) { return "—" }
                    var held_item = this.mapper.properties.player.team[0].held_item.value
                    power = this.natural_gift[held_item]?.power ?? "—"
                    return power
                }
                else if (y == "Punishment") {
                    var power = 60 // Starts at 60, increases by 20 for each positive stat change the enemy has, maxes out at 200
                    var stat_change_atk = this.mapper.properties.battle.opponent.active_pokemon.modifiers.attack.value > 0          ? this.mapper.properties.battle.opponent.active_pokemon.modifiers.attack.value          : 0
                    var stat_change_def = this.mapper.properties.battle.opponent.active_pokemon.modifiers.defense.value > 0         ? this.mapper.properties.battle.opponent.active_pokemon.modifiers.defense.value         : 0
                    var stat_change_spa = this.mapper.properties.battle.opponent.active_pokemon.modifiers.special_attack.value > 0  ? this.mapper.properties.battle.opponent.active_pokemon.modifiers.special.value         : 0
                    var stat_change_spd = this.mapper.properties.battle.opponent.active_pokemon.modifiers.special_defense.value > 0 ? this.mapper.properties.battle.opponent.active_pokemon.modifiers.special_defense.value : 0
                    var stat_change_spe = this.mapper.properties.battle.opponent.active_pokemon.modifiers.speed.value > 0           ? this.mapper.properties.battle.opponent.active_pokemon.modifiers.speed.value           : 0
                    var increases = stat_change_atk + stat_change_def + stat_change_spa + stat_change_spd + stat_change_spe
                    var power_boost = increases * 20
                    power += power_boost
                    if (power > 200) { power = 200 } // Ensure power does not exceed 200
                    return power
                }
                else if (y == "Fling") {
                    fling_power = this.get_fling_power()
                    return fling_power
                }

                let held_item_2 = this.mapper.properties.player.team[0].held_item.value
                if (held_item_2 == 'Wise Glasses' && move.category == 'Special') {
                    if (move.power != "—" && move.power != 0 && move.power != 1) {
                        return Math.floor(move.power * 1.1)
                    }
                }

                if (move.power == "—") { return "—"}
                if (move.power == 0) { return "—"}
                if (move.power == 1) { return "—"}
                else
                    if (move) return move.power
            }
            return null
        },
        get_fling_power(held_item_2) {
            let pokemon_data = this.mapper.properties.player.team[0]
            const state = this.mapper.properties.meta.state.value
            if (state == 'Battle') {
                pokemon_data = this.mapper.properties.battle.player.active_pokemon
            }
            const switch_item = pokemon_data.held_item.value
            switch (switch_item) {
                case "Master Ball"    : return "—";
                case "Ultra Ball"     : return "—";
                case "Great Ball"     : return "—";
                case "Poké Ball"      : return "—";
                case "Safari Ball"    : return "—";
                case "Ball"           : return "—";
                case "Dive Ball"      : return "—";
                case "Nest Ball"      : return "—";
                case "Repeat Ball"    : return "—";
                case "Timer Ball"     : return "—";
                case "Luxury Ball"    : return "—";
                case "Premier Ball"   : return "—";
                case "Dusk Ball"      : return "—";
                case "Heal Ball"      : return "—";
                case "Quick Ball"     : return "—";
                case "Cherish Ball"   : return "—";
                case "Potion"         : return 30;
                case "Antidote"       : return 30;
                case "Burn Heal"      : return 30;
                case "Ice Heal	Ice"  : return 30;
                case "Awakening"      : return 30;
                case "Paralyze Heal"  : return 30;
                case "Full Restore"   : return 30;
                case "Max Potion"     : return 30;
                case "Hyper Potion"   : return 30;
                case "Super Potion"   : return 30;
                case "Full Heal"      : return 30;
                case "Revive"         : return 30;
                case "Max Revive"     : return 30;
                case "Fresh Water"    : return 30;
                case "Soda Pop"       : return 30;
                case "Lemonade"       : return 30;
                case "Moomoo Milk"    : return 30;
                case "Energy Powder"  : return 30;
                case "Energy Root"    : return 30;
                case "Heal Powder"    : return 30;
                case "Revival Herb"   : return 30;
                case "Ether"          : return 30;
                case "Max Ether"      : return 30;
                case "Elixir"         : return 30;
                case "Max Elixir"     : return 30;
                case "Lava Cookie"    : return 30;
                case "Berry Juice"    : return 30;
                case "Sacred Ash"     : return 30;
                case "HP Up"          : return 30;
                case "Protein"        : return 30;
                case "Iron"           : return 30;
                case "Carbos"         : return 30;
                case "Calcium"        : return 30;
                case "Rare Candy"     : return 30;
                case "PP Up"          : return 30;
                case "Zinc"           : return 30;
                case "PP Max"         : return 30;
                case "Old Gateau"     : return 30;
                case "Guard Spec."    : return 30;
                case "Dire Hit"       : return 30;
                case "X Attack"       : return 30;
                case "X Defense"      : return 30;
                case "X Speed"        : return 30;
                case "X Accuracy"     : return 30;
                case "X Special"      : return 30;
                case "X Sp. Def"      : return 30;
                case "Poké Doll"      : return 30;
                case "Fluffy Tail"    : return 30;
                case "Blue Flute"     : return 30;
                case "Yellow Flute"   : return 30;
                case "Red Flute"      : return 30;
                case "Black Flute"    : return 30;
                case "White Flute"    : return 30;
                case "Shoal Salt"     : return 30;
                case "Shoal Shell"    : return 30;
                case "Red Shard"      : return 30;
                case "Blue Shard"     : return 30;
                case "Yellow Shard"   : return 30;
                case "Green Shard"    : return 30;
                case "Super Repel"    : return 30;
                case "Max Repel"      : return 30;
                case "Escape Rope"    : return 30;
                case "Repel"          : return 30;
                case "Sun Stone"      : return 30;
                case "Moon Stone"     : return 30;
                case "Fire Stone"     : return 30;
                case "Thunderstone"   : return 30;
                case "Water Stone"    : return 30;
                case "Leaf Stone"     : return 30;
                case "TinyMushroom"   : return 30;
                case "Big Mushroom"   : return 30;
                case "Pearl"          : return 30;
                case "Big Pearl"      : return 30;
                case "Stardust"       : return 30;
                case "Star Piece"     : return 30;
                case "Nugget"         : return 30;
                case "Heart Scale"    : return 30;
                case "Honey"          : return 30;
                case "Growth Mulch"   : return 30;
                case "Damp Mulch"     : return 30;
                case "Stable Mulch"   : return 30;
                case "Gooey Mulch"    : return 30;
                case "Root Fossil"    : return 100;
                case "Claw Fossil"    : return 100;
                case "Helix Fossil"   : return 100;
                case "Dome Fossil"    : return 100;
                case "Old Amber"      : return 100;
                case "Armor Fossil"   : return 100;
                case "Skull Fossil"   : return 100;
                case "Rare Bone"      : return 100;
                case "Shiny Stone"    : return 80;
                case "Dusk Stone"     : return 80;
                case "Dawn Stone"     : return 80;
                case "Oval Stone"     : return 80;
                case "Odd Keystone"   : return 80;
                case "Griseous Orb"   : return 60;
                case "Douse Drive"    : return 70;
                case "Shock Drive"    : return 70;
                case "Burn Drive"     : return 70;
                case "Chill Drive"    : return 70;
                case "Sweet Heart"    : return 30;
                case "Adamant Orb"    : return 60;
                case "Lustrous Orb"   : return 60;
                case "Greet Mail"     : return 0;
                case "Favored Mail"   : return 0;
                case "RSVP Mail"      : return 0;
                case "Thanks Mail"    : return 0;
                case "Inquiry Mail"   : return 0;
                case "Like Mail"      : return 0;
                case "Reply Mail"     : return 0;
                case "BridgeMail S"   : return 0;
                case "BridgeMail D"   : return 0;
                case "BridgeMail T"   : return 0;
                case "BridgeMail V"   : return 0;
                case "BridgeMail M"   : return 0;
                case "Cheri Berry"    : return 10;
                case "Chesto Berry"   : return 10;
                case "Pecha Berry"    : return 10;
                case "Rawst Berry"    : return 10;
                case "Aspear Berry"   : return 10;
                case "Leppa Berry"    : return 10;
                case "Oran Berry"     : return 10;
                case "Persim Berry"   : return 10;
                case "Lum Berry"      : return 10;
                case "Sitrus Berry"   : return 10;
                case "Figy Berry"     : return 10;
                case "Wiki Berry"     : return 10;
                case "Mago Berry"     : return 10;
                case "Aguav Berry"    : return 10;
                case "Iapapa Berry"   : return 10;
                case "Razz Berry"     : return 10;
                case "Bluk Berry"     : return 10;
                case "Nanab Berry"    : return 10;
                case "Wepear Berry"   : return 10;
                case "Pinap Berry"    : return 10;
                case "Pomeg Berry"    : return 10;
                case "Kelpsy Berry"   : return 10;
                case "Qualot Berry"   : return 10;
                case "Hondew Berry"   : return 10;
                case "Grepa Berry"    : return 10;
                case "Tamato Berry"   : return 10;
                case "Cornn Berry"    : return 10;
                case "Magost Berry"   : return 10;
                case "Rabuta Berry"   : return 10;
                case "Nomel Berry"    : return 10;
                case "Spelon Berry"   : return 10;
                case "Pamtre Berry"   : return 10;
                case "Watmel Berry"   : return 10;
                case "Durin Berry"    : return 10;
                case "Belue Berry"    : return 10;
                case "Occa Berry"     : return 10;
                case "Passho Berry"   : return 10;
                case "Wacan Berry"    : return 10;
                case "Rindo Berry"    : return 10;
                case "Yache Berry"    : return 10;
                case "Chople Berry"   : return 10;
                case "Kebia Berry"    : return 10;
                case "Shuca Berry"    : return 10;
                case "Coba Berry"     : return 10;
                case "Payapa Berry"   : return 10;
                case "Tanga Berry"    : return 10;
                case "Charti Berry"   : return 10;
                case "Kasib Berry"    : return 10;
                case "Haban Berry"    : return 10;
                case "Colbur Berry"   : return 10;
                case "Babiri Berry"   : return 10;
                case "Chilan Berry"   : return 10;
                case "Liechi Berry"   : return 10;
                case "Ganlon Berry"   : return 10;
                case "Salac Berry"    : return 10;
                case "Petaya Berry"   : return 10;
                case "Apicot Berry"   : return 10;
                case "Lansat Berry"   : return 10;
                case "Starf Berry"    : return 10;
                case "Enigma Berry"   : return 10;
                case "Micle Berry"    : return 10;
                case "Custap Berry"   : return 10;
                case "Jaboca Berry"   : return 10;
                case "Rowap Berry"    : return 10;
                case "BrightPowder"   : return 10; 
                case "White Herb"     : return 10;
                case "Macho Brace"    : return 60;
                case "Exp. Share"     : return 0;
                case "Quick Claw"     : return 80;
                case "Soothe Bell"    : return 10;
                case "Mental Herb"    : return 10;
                case "Choice Band"    : return 10;
                case "King's Rock"    : return 30;
                case "SilverPowder"   : return 10;
                case "Amulet Coin"    : return 30;
                case "Cleanse Tag"    : return 30;
                case "Soul Dew"       : return 30;
                case "DeepSeaTooth"   : return 90;
                case "DeepSeaScale"   : return 30;
                case "Smoke Ball"     : return 30;
                case "Everstone"      : return 30;
                case "Focus Band"     : return 10;
                case "Lucky Egg"      : return 30;
                case "Scope Lens"     : return 30;
                case "Metal Coat"     : return 30;
                case "Leftovers"      : return 10;
                case "Dragon Scale"   : return 30;
                case "Light Ball"     : return 30;
                case "Soft Sand"      : return 10;
                case "Hard Stone"     : return 100;
                case "Miracle Seed"   : return 30;
                case "BlackGlasses"   : return 30;
                case "Black Belt"     : return 30;
                case "Magnet"         : return 30;
                case "Mystic Water"   : return 30;
                case "Sharp Beak"     : return 50;
                case "Poison Barb"    : return 80;
                case "NeverMeltIce"   : return 30;
                case "Spell Tag"      : return 30;
                case "TwistedSpoon"   : return 30;
                case "Charcoal"       : return 30;
                case "Dragon Fang"    : return 70;
                case "Silk Scarf"     : return 10;
                case "Up-Grade"       : return 30;
                case "Shell Bell"     : return 30;
                case "Sea Incense"    : return 10;
                case "Lax Incense"    : return 10;
                case "Lucky Punch"    : return 40;
                case "Metal Powder"   : return 10;
                case "Thick Club"     : return 90;
                case "Stick"          : return "ERR";
                case "Red Scarf"      : return 0;
                case "Blue Scarf"     : return 0;
                case "Pink Scarf"     : return 0;
                case "Green Scarf"    : return 0;
                case "Yellow Scarf"   : return 0;
                case "Wide Lens"      : return 10;
                case "Muscle Band"    : return 10;
                case "Wise Glasses"   : return 10;
                case "Expert Belt"    : return 10;
                case "Light Clay"     : return 30;
                case "Life Orb"       : return 30;
                case "Power Herb"     : return 10;
                case "Toxic Orb"      : return 30;
                case "Flame Orb"      : return 30;
                case "Quick Powder"   : return 10;
                case "Focus Sash"     : return 10;
                case "Zoom Lens"      : return 10;
                case "Metronome"      : return 30;
                case "Iron Ball"      : return 130;
                case "Lagging Tail"   : return 10;
                case "Destiny Knot"   : return 10;
                case "Black Sludge"   : return 30;
                case "Rock"           : return 10;
                case "Smooth Rock"    : return 10;
                case "Heat Rock"      : return 60;
                case "Damp Rock"      : return 60;
                case "Grip Claw"      : return 90;
                case "Choice Scarf"   : return 10;
                case "Sticky Barb"    : return 80;
                case "Power Bracer"   : return 70;
                case "Power Belt"     : return 70;
                case "Power Lens"     : return 70;
                case "Power Band"     : return 70;
                case "Power Anklet"   : return 70;
                case "Power Weight"   : return 70;
                case "Shed Shell"     : return 10;
                case "Big Root"       : return 10;
                case "Choice Specs"   : return 10;
                case "Flame Plate"    : return 90;
                case "Splash Plate"   : return 90;
                case "Zap Plate"      : return 90;
                case "Meadow Plate"   : return 90;
                case "Icicle Plate"   : return 90;
                case "Fist Plate"     : return 90;
                case "Toxic Plate"    : return 90;
                case "Earth Plate"    : return 90;
                case "Sky Plate"      : return 90;
                case "Mind Plate"     : return 90;
                case "Insect Plate"   : return 90;
                case "Stone Plate"    : return 90;
                case "Spooky Plate"   : return 90;
                case "Draco Plate"    : return 90;
                case "Dread Plate"    : return 90;
                case "Iron Plate"     : return 90;
                case "Odd Incense"    : return 10;
                case "Rock Incense"   : return 10;
                case "Full Incense"   : return 10;
                case "Wave Incense"   : return 10;
                case "Rose Incense"   : return 10;
                case "Luck Incense"   : return 10;
                case "Pure Incense"   : return 10;
                case "Protector"      : return 80;
                case "Electirizer"    : return 80;
                case "Magmarizer"     : return 80;
                case "Dubious Disc"   : return 50;
                case "Reaper Cloth"   : return 10;
                case "Razor Claw"     : return 80;
                case "Razor Fang"     : return 30;
                case "TM01"           : return 0;
                case "TM02"           : return 0;
                case "TM03"           : return 0;
                case "TM04"           : return 0;
                case "TM05"           : return 0;
                case "TM06"           : return 0;
                case "TM07"           : return 0;
                case "TM08"           : return 0;
                case "TM09"           : return 0;
                case "TM10"           : return 0;
                case "TM11"           : return 0;
                case "TM12"           : return 0;
                case "TM13"           : return 0;
                case "TM14"           : return 0;
                case "TM15"           : return 0;
                case "TM16"           : return 0;
                case "TM17"           : return 0;
                case "TM18"           : return 0;
                case "TM19"           : return 0;
                case "TM20"           : return 0;
                case "TM21"           : return 0;
                case "TM22"           : return 0;
                case "TM23"           : return 0;
                case "TM24"           : return 0;
                case "TM25"           : return 0;
                case "TM26"           : return 0;
                case "TM27"           : return 0;
                case "TM28"           : return 0;
                case "TM29"           : return 0;
                case "TM30"           : return 0;
                case "TM31"           : return 0;
                case "TM32"           : return 0;
                case "TM33"           : return 0;
                case "TM34"           : return 0;
                case "TM35"           : return 0;
                case "TM36"           : return 0;
                case "TM37"           : return 0;
                case "TM38"           : return 0;
                case "TM39"           : return 0;
                case "TM40"           : return 0;
                case "TM41"           : return 0;
                case "TM42"           : return 0;
                case "TM43"           : return 0;
                case "TM44"           : return 0;
                case "TM45"           : return 0;
                case "TM46"           : return 0;
                case "TM47"           : return 0;
                case "TM48"           : return 0;
                case "TM49"           : return 0;
                case "TM50"           : return 0;
                case "TM51"           : return 0;
                case "TM52"           : return 0;
                case "TM53"           : return 0;
                case "TM54"           : return 0;
                case "TM55"           : return 0;
                case "TM56"           : return 0;
                case "TM57"           : return 0;
                case "TM58"           : return 0;
                case "TM59"           : return 0;
                case "TM60"           : return 0;
                case "TM61"           : return 0;
                case "TM62"           : return 0;
                case "TM63"           : return 0;
                case "TM64"           : return 0;
                case "TM65"           : return 0;
                case "TM66"           : return 0;
                case "TM67"           : return 0;
                case "TM68"           : return 0;
                case "TM69"           : return 0;
                case "TM70"           : return 0;
                case "TM71"           : return 0;
                case "TM72"           : return 0;
                case "TM73"           : return 0;
                case "TM74"           : return 0;
                case "TM75"           : return 0;
                case "TM76"           : return 0;
                case "TM77"           : return 0;
                case "TM78"           : return 0;
                case "TM79"           : return 0;
                case "TM80"           : return 0;
                case "TM81"           : return 0;
                case "TM82"           : return 0;
                case "TM83"           : return 0;
                case "TM84"           : return 0;
                case "TM85"           : return 0;
                case "TM86"           : return 0;
                case "TM87"           : return 0;
                case "TM88"           : return 0;
                case "TM89"           : return 0;
                case "TM90"           : return 0;
                case "TM91"           : return 0;
                case "TM92"           : return 0;
                case "HM01"           : return 0;
                case "HM02"           : return 0;
                case "HM03"           : return 0;
                case "HM04"           : return 0;
                case "HM05"           : return 0;
                case "HM06"           : return 0;
                case "Explorer Kit"   : return 0;
                case "Loot Sack"      : return 0;
                case "Rule Book"      : return 0;
                case "Poké Radar"     : return 0;
                case "Point Card"     : return 0;
                case "Journal"        : return 0;
                case "Seal Case"      : return 0;
                case "Fashion Case"   : return 0;
                case "Seal Bag"       : return 0;
                case "Pal Pad	Pal"  : return 0;
                case "Works Key"      : return 0;
                case "Old Charm"      : return 0;
                case "Galactic Key"   : return 0;
                case "Red Chain"      : return 0;
                case "Town Map"       : return 0;
                case "Vs. Seeker"     : return 0;
                case "Coin Case"      : return 0;
                case "Old Rod"        : return 0;
                case "Good Rod"       : return 0;
                case "Super Rod"      : return 0;
                case "Sprayduck"      : return 0;
                case "Poffin Case"    : return 0;
                case "Bicycle"        : return 0;
                case "Suite Key"      : return 0;
                case "Oak's Letter"   : return 0;
                case "Lunar Wing"     : return 0;
                case "Member Card"    : return 0;
                case "Azure Flute"    : return 0;
                case "S.S. Ticket"    : return 0;
                case "Contest Passho" : return 0;
                case "Magma Stone"    : return 0;
                case "Parcel"         : return 0;
                case "Coupon 1"       : return 0;
                case "Coupon 2"       : return 0;
                case "Coupon 3"       : return 0;
                case "Storage Key"    : return 0;
                case "Secret Potion"  : return 0;
                case "Vs. Recorder"   : return 0;
                case "Gracidea"       : return 0;
                case "Secret Key"     : return 0;
                case "Apricorn Box"   : return 0;
                case "Unown Report"   : return 0;
                case "Berry Pots"     : return 0;
                case "Dowsing MCHN"   : return 0;
                case "Blue Card"      : return 0;
                case "Slowpoke Tail"  : return 0;
                case "Clear Bell"     : return 0;
                case "Card Key"       : return 0;
                case "Basement Key"   : return 0;
                case "Squirt Bottle"  : return 0;
                case "Red Scale"      : return 0;
                case "Lost Item"      : return 0;
                case "Pass"           : return 0;
                case "Machine Part"   : return 0;
                case "Silver Wing"    : return 0;
                case "Rainbow Wing"   : return 0;
                case "Mystery Egg"    : return 0;
                case "Red Apricorn"   : return 0;
                case "Blu Apricorn"   : return 0;
                case "Ylw Apricorn"   : return 0;
                case "Grn Apricorn"   : return 0;
                case "Pnk Apricorn"   : return 0;
                case "Wht Apricorn"   : return 0;
                case "Blk Apricorn"   : return 0;
                case "Fast Ball"      : "—";
                case "Level Ball"     : "—";
                case "Lure Ball"      : "—";
                case "Heavy Ball"     : "—";
                case "Love Ball"      : "—";
                case "Friend Ball"    : "—";
                case "Moon Ball"      : "—";
                case "Sport Ball"     : "—";
                case "Park Ball"      : "—";
                case "Photo Album"    : return 0;
                case "GB Sounds"      : return 0;
                case "Tidal Bell"     : return 0;
                case "RageCandyBar"   : return 30;
                case "Data Card 01"   : return 0;
                case "Data Card 02"   : return 0;
                case "Data Card 03"   : return 0;
                case "Data Card 04"   : return 0;
                case "Data Card 05"   : return 0;
                case "Data Card 06"   : return 0;
                case "Data Card 07"   : return 0;
                case "Data Card 08"   : return 0;
                case "Data Card 09"   : return 0;
                case "Data Card 10"   : return 0;
                case "Data Card 11"   : return 0;
                case "Data Card 12"   : return 0;
                case "Data Card 13"   : return 0;
                case "Data Card 14"   : return 0;
                case "Data Card 15"   : return 0;
                case "Data Card 16"   : return 0;
                case "Data Card 17"   : return 0;
                case "Data Card 18"   : return 0;
                case "Data Card 19"   : return 0;
                case "Data Card 20"   : return 0;
                case "Data Card 21"   : return 0;
                case "Data Card 22"   : return 0;
                case "Data Card 23"   : return 0;
                case "Data Card 24"   : return 0;
                case "Data Card 25"   : return 0;
                case "Data Card 26"   : return 0;
                case "Data Card 27"   : return 0;
                case "Jade Orb"       : return 0;
                case "Lock Capsule"   : return 0;
                case "Red Orb IV"     : return 0;
                case "Blue Orb IV"    : return 0;
                case "Enigma Stone"   : return 0;
                case "Prism Scale"    : return 30;
                case "Eviolite"       : return 40;
                case "Float Stone"    : return 30;
                case "Rocky Helmet"   : return 60;
                case "Air Balloon"    : return 10;
                case "Red Card"       : return 10;
                case "Ring Target"    : return 10;
                case "Binding Band"   : return 30;
                case "Absorb Bulb"    : return 30;
                case "Cell Battery"   : return 30;
                case "Eject Button"   : return 30;
                case "Fire Gem"       : return 0;
                case "Water Gem"      : return 0;
                case "Electric Gem"   : return 0;
                case "Grass Gem"      : return 0;
                case "Ice Gem"        : return 0;
                case "Fighting Gem"   : return 0;
                case "Poison Gem"     : return 0;
                case "Ground Gem"     : return 0;
                case "Flying Gem"     : return 0;
                case "Psychic Gem"    : return 0;
                case "Bug Gem"        : return 0;
                case "Rock Gem"       : return 0;
                case "Ghost Gem"      : return 0;
                case "Dragon Gem"     : return 0;
                case "Dark Gem"       : return 0;
                case "Steel Gem"      : return 0;
                case "Normal Gem"     : return 0;
                case "Health Wing"    : return "ERR";
                case "Muscle Wing"    : return "ERR";
                case "Resist Wing"    : return "ERR";
                case "Genius Wing"    : return "ERR";
                case "Clever Wing"    : return "ERR";
                case "Swift Wing"     : return "ERR";
                case "Pretty Wing"    : return "ERR";
                case "Cover Fossil"   : return 100;
                case "Plume Fossil"   : return 100;
                case "Liberty Pass"   : return 0;
                case "Pass Orb"       : return 0;
                case "Dream Ball"     : return 0;
                case "Poké Toy"       : return 0;
                case "Prop Case"      : return 0;
                case "Dragon Skull"   : return 0;
                case "Balm Mushroom"  : return 30;
                case "Big Nugget"     : return 30;
                case "Pearl String"   : return 30;
                case "Comet Shard"    : return 30;
                case "Relic Copper"   : return 30;
                case "Relic Silver"   : return 30;
                case "Relic Gold"     : return 30;
                case "Relic Vase"     : return 30;
                case "Relic Band"     : return 30;
                case "Relic Statue"   : return 30;
                case "Relic Crown"    : return 30;
                case "Casteliacone"   : return 30;
                case "Dire Hit"       : return 30;
                case "X Speed"        : return 30;
                case "X Special"      : return 30;
                case "X Sp. Def"      : return 30;
                case "X Defend"       : return 30;
                case "X Attack"       : return 30;
                case "X Accuracy"     : return 30;
                case "X Speed"        : return 30;
                case "X Special"      : return 30;
                case "X Sp. Def"      : return 30;
                case "X Defend"       : return 30;
                case "X Attack"       : return 30;
                case "X Accuracy"     : return 30;
                case "X Speed"        : return 30;
                case "X Special"      : return 30;
                case "X Sp. Def"      : return 30;
                case "X Defend"       : return 30;
                case "X Attack"       : return 30;
                case "X Accuracy"     : return 30;
                case "Ability Urge"   : return 0;
                case "Item Drop"      : return 0;
                case "Item Urge"      : return 0;
                case "Reset Urge"     : return 0;
                case "Dire Hit 3"     : return 0;
                case "Light Stone"    : return 0;
                case "Dark Stone"     : return 0;
                case "TM93"           : return 0;
                case "TM94"           : return 0;
                case "TM95"           : return 0;
                case "Xtransceiver"   : return 0;
                case "God Stone"      : return 0;
                case "Gram 1"         : return 0;
                case "Gram 2"         : return 0;
                case "Gram 3"         : return 0;
                case "Xtransceiver"   : return 0;
                case "Medal Box"      : return 0;
                case "DNA Splicers"   : return 0;
                case "DNA Splicers"   : return 0;
                case "Permit"         : return 0;
                case "Oval Charm"     : return 0;
                case "Shiny Charm"    : return 0;
                case "Plasma Card"    : return 0;
                case "Grubby Hanky"   : return 0;
                case "Colress Machine": return 0;
                case "Dropped Item"   : return 0;
                case "Dropped Item"   : return 0;
                case "Reveal Glass"   : return 0;
                default: return 0;
            }
        },
        moveCategory(move) { //move = move.value
            if (move) {
                var move = this.generation4_moves_new[move]
                if (move) return move.category
            }
            return ""
        },
        moveCategoryIcon(move) { //move = move.value
            if (move) {
                var move = this.generation4_moves_new[move]
                if (move) return `images/damageCategory/${move.category.toLowerCase()}.png`
            }
            return ""
        },
        movepoolPower(moveObject) {
            if (this.mapper.properties.meta.state.value == "No Pokemon") {
                return moveObject.Power
            }
            if (moveObject.Move == `Hidden Power`) {
                return this.hiddenPowerPowerCalc(this.mapper.properties.player.team[0])
            }
            if (moveObject.Move == `Return`) {
                // if (this.mapper.properties.battle.player.team_count.value == 0) {
                //     return "-"
                // }
                return this.g3ReturnPowerCalc(this.mapper.properties.player.team[0])
            }
            if (moveObject.Move == `Frustration`) {
                // if (this.mapper.properties.battle.player.team_count.value == 0) {
                //     return "-"
                // }
                return this.g3FrustrationPowerCalc(this.mapper.properties.player.team[0])
            }
            else { return moveObject.Power }
        },
        movepoolTypeColor(moveObject) {
            if (moveObject.Move == `Hidden Power` && this.mapper.properties.meta.state.value == "No Pokemon") {
                return this.hidden_power_type
            }
            if (moveObject.Move == `Hidden Power` && this.mapper.properties.meta.state.value != "No Pokemon") {
                return this.hiddenPowerTypeCalc(this.mapper.properties.player.team[0])
            }
            if (this.mapper.properties.meta.state.value == "No Pokemon") {
                return moveObject.Type
            }
            if (moveObject.Type == `Curse`) {
                return "Curse"
            }
            return moveObject.Type
        },
        movepoolType(moveObject) {
            if (moveObject.Move == `Hidden Power` && this.mapper.properties.meta.state.value == "No Pokemon") {
                return this.hidden_power_type
            }
            if (moveObject.Move == `Hidden Power` && this.mapper.properties.meta.state.value != "No Pokemon") {
                return this.hiddenPowerTypeCalc(this.mapper.properties.player.team[0])
            }
            if (this.mapper.properties.meta.state.value == "No Pokemon") {
                return moveObject.Type
            }
            if (moveObject.Type == `Curse`) {
                return "???"
            }
            if (moveObject.Move == `Hidden Power`) {
                return this.hidden_power_type
            }
            return moveObject.Type
        },
        g3ReturnPowerCalc(slotNumber) {
            if (slotNumber.friendship.value < 2.5) { var friendshipValue = 2.5 }
            else { var friendshipValue = slotNumber.friendship.value }
            var specialMovePower = Math.floor(friendshipValue/2.5)
            return specialMovePower
        },
        g3FrustrationPowerCalc(slotNumber) {
            var friendshipValue = slotNumber.friendship.value
            var specialMovePower = Math.floor((255 - friendshipValue)/2.5)
            if (specialMovePower == 0) {
                specialMovePower = 1
            }
            return specialMovePower
        },
        weatherModifier(weather, move, moveType) {
            if (weather == "Sun" && moveType == "Water") {
                return .5
            }
            else if (weather == "Sun" && moveType == "Fire") {
                return 1.5
            }
            else if (weather == "Rain" && moveType == "Water") {
                return 1.5
            }
            else if (weather == "Rain" && moveType == "Fire") {
                return .5
            }
            else if (weather == "Rain" && move == "SolarBeam") {
                return .5
            }
            else if (weather == "Sandstorm") {
                return 1
            }
            else {
                return 1
            }
        },
        moveType(y) { //y = move1.value
            if (y == "Hidden Power") {
                var move = this.hiddenPowerTypeCalc(this.mapper.properties.player.team[0])
                return move
            }
            else if (y != null && y == "Weather Ball") {
                if (this.batt.field.weather.value == `Sun`) {
                    return "Fire" }
                if (this.batt.field.weather.value == `Sandstorm`) {
                    return "Rock" }
                if (this.batt.field.weather.value == `Rain`) {
                    return "Water" }
                if (this.batt.field.weather.value == `Hail`) {
                    return "Ice" }
                return "Normal"
            }
            else if (y == 'Natural Gift') {
                if (this.mapper.properties.player.team[0].held_item.value == null) { return "Normal" }
                var held_item = this.mapper.properties.player.team[0].held_item.value
                return this.natural_gift[held_item]?.type ?? "Normal"
            }
            else if (y) {
                var move = this.g4MoveData[y]
                if (move) return move.Type
            }
            return null
        },
        moveTypeIcon(y) { //y = move1.value
            if (y != null && y != undefined && y == "Hidden Power") {
                return `images/elements/type-icons/${this.hiddenPowerTypeCalc(this.mapper.properties.player.team[0])}.png`
            }
            else if (y != null && y == "Weather Ball") {
                var moveType = "Normal"
                if (this.batt.field.weather.value == `Sun`) {
                    moveType = "Fire" }
                if (this.batt.field.weather.value == `Sandstorm`) {
                    moveType = "Rock" }
                if (this.batt.field.weather.value == `Rain`) {
                    moveType = "Water" }
                if (this.batt.field.weather.value == `Hail`) {
                    moveType = "Ice" }
                return `images/elements/type-icons/${moveType}.png`
            }
            else if (y != null && y != undefined) {
                var move = this.gen3moves.find(x => x.Move.toLowerCase() === y.toLowerCase())
                var moveType = move[`Type`].toLowerCase()
                return `images/elements/type-icons/${moveType}.png`
            }
            else {
                return null
            }
        },
        // TYPE EFFECTIVENESS
        checkTypes(x, y) { //x = type1.value, y = type2.value
            if (x.value == y.value)
                return true
            else
                return false
        },
        
        stageModColor(x) {
            if (x == 0)
                return "rgb(0, 0, 0);"
            else if (x < 0)
                return "rgb(107, 0, 0);"
            else (x > 0)
                return "rgb(0, 66, 14);"
        },

        //y = mod stage, x = stat value
        stageMultiplier(y,x) { 
            // if (this.mapper.properties.battle.turnInfo.battleOutcome.bytes == 0 && y != 0 && y != null && y != undefined && this.mapper.properties.battle.yourPokemon.species != null) {
            if (this.mapper.properties.meta.state.value == "Battle") {
                var multiplier = this.stageModifiersData.find(x => x.modType === "stat")
                var statValue = Math.floor(x * multiplier[y.toString()])
                // if (statValue > 999) {
                //     return 999
                // }
                // else
                //     return statValue
                return statValue
            }
            else
                return x    
        },
        
        //x = stat modifier property (not the value of the property. [ex. battle.modStageAttack])
        // statLabelOpacity(modifier) {
        //     if (this.mapper.properties.player.team[0].internals.personality_value.value == null)
        //         return
        //     else if (this.mapper.properties.meta.state.value == "Battle" && this.mapper.properties.battle.outcome.value == null)
        //         if (modifier.value != 0)
        //             return `opacity: ${this.statLabelOpacityValue};`
        //     else
        //         return
        // },
        enemyStatLabelOpacity(modifier, slot) {
            // Return early if modifier is undefined/null to prevent .bytes access error
            if (!modifier || modifier.bytes === undefined)
                return
            // console.log(modifier.bytes, slot)
            modifier_table = {
                0x00: "-6", 
                0x01: "-5", 
                0x02: "-4", 
                0x03: "-3", 
                0x04: "-2", 
                0x05: "-1", 
                0x06: "0",
                0x07: "1",
                0x08: "2",
                0x09: "3",
                0x0A: "4",
                0x0B: "5",
                0x0C: "6",
                0x0D: "6",
            }
            // console.log(slot, modifier.bytes)
            modifier = modifier_table[modifier.bytes]
            if (this.mapper.properties.battle.opponent.party_position.value == slot) {
                if (this.mapper.properties.battle.opponent.team[0].internals.personality_value.value == null)
                    return
                else if (this.mapper.properties.meta.state.value == "Battle") {
                    if (modifier != "0")
                        return `opacity: ${this.statLabelOpacityValue};`
                }
            }
            else
                return
        },
        enemyStatusLabelOpacity(status, slot) {
            // Return early if status is undefined/null to prevent .bytes access error
            if (!status || status.bytes === undefined)
                return
            if (this.mapper.properties.battle.opponent.party_position.value == slot) {
                if (this.mapper.properties.battle.opponent.team[0].internals.personality_value.value == null)
                    return
                else if (this.mapper.properties.meta.state.value == "Battle") {
                    if (status.bytes != 0x00)
                        return `opacity: ${this.statLabelOpacityValue};`
                }
            }
            else
                return
        },
        statusOpacityLabel(status) {
            if (status) {
                return `opacity: ${this.statLabelOpacityValue};`
            }
            else
                return
        },
        getLSB(value) {
            return value & 1;
        },
        getSecondLSB(value) {
            return (value >> 1) & 1;
        },
        ivparser(fourByteIvBlock, ivName) { //ie: 0x00000000, "hp"
            function getBits(a, b, d) {
                return (a >> b) & ((1 << d) - 1);
            }
            switch (ivName) {
                case "hp":  return getBits(fourByteIvBlock, 0, 5);
                case "atk": return getBits(fourByteIvBlock, 5, 5);
                case "def": return getBits(fourByteIvBlock, 10, 5);
                case "spe": return getBits(fourByteIvBlock, 15, 5);
                case "spa": return getBits(fourByteIvBlock, 20, 5);
                case "spd": return getBits(fourByteIvBlock, 25, 5);
                case "egg": return getBits(fourByteIvBlock, 30, 1);
                case "ability": return getBits(fourByteIvBlock, 31, 1);
                default: return "ERROR";
            }
        },
        hiddenPowerTypeCalc(slot) {
            let ivHpBit  = slot.ivs.hp.value
            let ivAtkBit = slot.ivs.attack.value
            let ivDefBit = slot.ivs.defense.value
            let ivSpeBit = slot.ivs.speed.value
            let ivSpABit = slot.ivs.special_attack.value
            let ivSpDBit = slot.ivs.special_defense.value
            ivHpBit  = this.getLSB(ivHpBit)
            ivAtkBit = this.getLSB(ivAtkBit)
            ivDefBit = this.getLSB(ivDefBit)
            ivSpeBit = this.getLSB(ivSpeBit)
            ivSpABit = this.getLSB(ivSpABit)
            ivSpDBit = this.getLSB(ivSpDBit)
            type = this.hiddenPowerTypes[(Math.floor(((ivHpBit + (2 * ivAtkBit) + (4 * ivDefBit) + (8 * ivSpeBit) + (16 * ivSpABit) + (32 * ivSpDBit)) * 5)/21))]
            return type
        },
        hiddenPowerPowerCalc(slot) {
            let ivHpBit  = slot.ivs.hp.value
            let ivAtkBit = slot.ivs.attack.value
            let ivDefBit = slot.ivs.defense.value
            let ivSpeBit = slot.ivs.speed.value
            let ivSpABit = slot.ivs.special_attack.value
            let ivSpDBit = slot.ivs.special_defense.value
            ivHpBit  = this.getSecondLSB(ivHpBit)
            ivAtkBit = this.getSecondLSB(ivAtkBit)
            ivDefBit = this.getSecondLSB(ivDefBit)
            ivSpeBit = this.getSecondLSB(ivSpeBit)
            ivSpABit = this.getSecondLSB(ivSpABit)
            ivSpDBit = this.getSecondLSB(ivSpDBit)
            basePower = Math.floor((((ivHpBit + (2 * ivAtkBit) + (4 * ivDefBit) + (8 * ivSpeBit) + (16 * ivSpABit) + (32 * ivSpDBit)) * 40)/63) + 30 )
            return basePower
        },
        determineSTAB(x) { //x = move1.value
            var pkmnType1 = this.g4PokemonData[this.starter].type_1
            var pkmnType2 = this.g4PokemonData[this.starter].type_2
            if (this.starter == 'Arceus') {
                pkmnType1 = this.arceus_plate_check()
            }
            var moveType  = this.moveType(x)
            if (pkmnType1 == moveType || pkmnType2 == moveType)
                return 1.5
            else
                return 1
        }, 
        determineItemBoost(x, pkmn_object) { //x - move1.value
            if (pkmn_object.species.value == null) { return }
            if (pkmn_object.ability.value == 'Klutz') {
                return 1
            }
            var heldItemValue = pkmn_object.held_item?.value
            var itemType = this.typeBoostingItems[heldItemValue]
            if (itemType == this.moveType(x)) {
                return 1.2
            }
            else   
                return 1
        },
        abilityModifier(ability, attackingType, controller) {
            var healthPercentage = this.mapper.properties.battle[controller].active_pokemon.stats.hp / this.mapper.properties.battle[controller].active_pokemon.stats.hp_max
            if (healthPercentage <= .3) {
                if (ability == `Torrent` && attackingType == `Water`) {
                    return 1.5
                }
                else if (ability == `Blaze` && attackingType == `Fire`) {
                    return 1.5
                }
                else if (ability == `Overgrow` && attackingType == `Grass`) {
                    return 1.5
                }
                else if (ability == `Swarm` && attackingType == `Bug`) {
                    return 1.5
                }
                else {
                    return 1
                }
            }
            else {
                return 1
            }
        },
        burnModifier(x) {
            if (this.mapper.properties.meta.state.value == "No Pokemon") { return 1 }
            var attackingCategory = this.moveCategory(x)
            if (attackingCategory == "Physical" && this.solo_mon.status_condition?.value == `Burned` && this.mapper.properties.player.team[0].ability?.value != `Guts`) {
                return 0.5
                }
            else {
                return 1
            }
        },
        enemy_move_power(move_name, enemy_mon) { //y = move1.value
            const state = this.mapper.properties.meta.state.value
            if (state != 'Battle') { return }
            if (move_name) {
                var move = this.generation4_moves_new[move_name]
                if (move_name == "Return") {
                    if (enemy_mon.friendship.value < 2.5)
                        var friendshipValue = 2.5 
                    else 
                        var friendshipValue = enemy_mon.friendship.value
                    var specialMovePower = Math.floor(friendshipValue/2.5)
                    return specialMovePower
                }
                else if (move_name == "Flail" || move_name == "Reversal") {
                    var hpPercentage = enemy_mon.hp.value / enemy_mon.hp_max.value
                    if (hpPercentage >= .6875) { return 20 }
                    else if (hpPercentage >= .3542 && hpPercentage < .6875) { return 40 }
                    else if (hpPercentage >= .2083 && hpPercentage < .3542) { return 80 }
                    else if (hpPercentage >= .1042 && hpPercentage < .2083) { return 100 }
                    else if (hpPercentage >= .0417 && hpPercentage < .1042) { return 150 }
                    else if (hpPercentage < .0417) { return 200 }
                }
                else if (move_name == "Water Spout" || move_name == "Eruption") {
                    var power = (150 * enemy_mon.hp.value) / enemy_mon.hp_max.value
                    if (power < 1) {
                        return 1
                    }
                    return Math.floor(power)
                }
                else if (move_name == "Frustration") {
                    if (enemy_mon.friendship.value > 252.5)
                        var friendshipValue = 252.5 
                    else 
                        var friendshipValue = enemy_mon.friendship.value
                    var specialMovePower = Math.floor((255-friendshipValue)/2.5)
                    return specialMovePower
                }
                else if (move_name == "Low Kick" || move_name == "Grass Knot") {
                    if (this.mapper.properties.meta.state.value == `Overworld` || this.mapper.properties.meta.state.value == `To Battle`) { return "—"}
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight < 10) { return 20 }
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight < 25) { return 40 }
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight < 50) { return 60 }
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight < 100) { return 80 }
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight < 200) { return 100 }
                    if (this.g4PokemonData[this.mapper.properties.battle.player.active_pokemon.species.value]?.weight >= 200) { return 120 }
                }
                else if (move_name == "Hidden Power") {
                    return this.hiddenPowerPowerCalc(enemy_mon)
                }
                else if (move_name == "Facade" && (enemy_mon.status_condition.value == "Paralyzed" || enemy_mon.status_condition.value == "Poisoned" || enemy_mon.status_condition.value == "Burned")) {
                    return move.power * 2
                }
                else if (move_name == "Gyro Ball") {
                    const target_speed = this.mapper.properties.battle.player.active_pokemon.stats.speed.value
                    const user_speed = this.mapper.properties.battle.opponent.active_pokemon.stats.speed.value
                    var base_power = Math.min(((25 * target_speed) / user_speed) + 1)
                    if (base_power > 150) { base_power = 150 }
                    return base_power
                }
                if (move.power == "—") { return "—"}
                if (move.power == 0) { return "—"}
                else
                    if (move) return move.power
            }
            return null
        },
        enemy_effective_power(move_name, enemy_mon, slot) {
            if (this.mapper.properties.meta.state.value != 'Battle' || this.mapper.properties.meta.state.value != 'From Battle') { return }
            if (enemy_mon.species?.value == null) { return }
            switch(move_name) {
                case "Curse": return "—";
                case null: return;
                case undefined: return;
            }
            const species = enemy_mon.species.value
            const move_data = this.generation4_moves_new[move_name]
            const move_type = move_data.type
            const move_base_power = this.enemy_move_power(move_name, enemy_mon) ?? move_data.power
            if (move_base_power == 1) { return "—" }
            const move_category = move_data.category
            const user_type_1 = this.g4PokemonData[species].type_1
            const user_type_2 = this.g4PokemonData[species].type_2
            const target_type_1 = this.mapper.properties.battle.player.active_pokemon.type_1.value
            const target_type_2 = this.mapper.properties.battle.player.active_pokemon.type_2.value
            if (move_base_power == "—" || move_base_power == "-") { return "—" }
            var move_effective_power = move_base_power
            var modifier_effectiveness_1 = this.typeData.find(x => x.moveType == move_type)[target_type_1]
            var modifier_effectiveness_2 = target_type_2 && move_type && (target_type_1 != target_type_2) ? this.typeData.find(x => x.moveType == move_type)[target_type_2]
                : 1
            var modifier_stab = move_type == user_type_1 ? 1.5 
                : move_type == user_type_2 ? 1.5 
                : 1
            var modifier_ability = this.abilityModifier(this.mapper.properties.battle.opponent.active_pokemon.ability.value, move_type, 'opponent')
            if (this.mapper.properties.battle.player.active_pokemon.ability.value == 'Levitate' && move_type == 'Ground') {
                modifier_ability = 0 
            }
            var modifier_item = this.determineItemBoost(move_name, enemy_mon)
            var modifier_weather = this.weatherModifier(this.mapper.properties.battle.field.weather.value, move_name, move_type)
            var modifier_burn = 1
            if (move_category == "Physical" && enemy_mon.status_condition?.value == `Burned` && enemy_mon.ability?.value != `Guts`) {
                modifier_burn = 0.5
                }
            else {
                modifier_burn = 1
            }
            //Calculate effective power
            if (this.typeCalcs == true && this.mapper.properties.meta.state.value == "Battle" && this.mapper.properties.meta.state_enemy.value != "Battle Finished") { //Handles type effectiveness calculations in battle
                return Math.floor(move_base_power * modifier_stab * modifier_effectiveness_1 * modifier_effectiveness_2 * modifier_ability * modifier_item * modifier_weather * modifier_burn)
            }
        },
        typeEffectiveness(x) { //x = move1.value
            const state = this.mapper.properties.meta.state.value
            const species = this.starter
            var enemy_pokemon_data = this.mapper.properties.battle.opponent.active_pokemon

            if (x == "Curse") {
                return "—"
            }
            if (x == null || x == undefined) {
                return
            }
            var attackingType = this.moveType(x)
            var power = this.movePower(x)
            var defendingType1 = this.mapper.properties.battle.opponent.active_pokemon.type_1.value ?? "Normal"
            var defendingType2 = this.mapper.properties.battle.opponent.active_pokemon.type_2.value ?? "Normal"
            var defendingType1Effectiveness = 1
            var defendingType2Effectiveness = 1

            var player_ability_modifier = 1
            var player_ability = state == 'Battle' ? this.mapper.properties.battle.player.active_pokemon.ability.value : this.mapper.properties.player.team[0].ability.value
            if (player_ability == 'Normalize') {
                attackingType = 'Normal'
            }
            if (player_ability == "Iron Fist" && (x == 'Hammer Arm' || x == 'Sky Uppercut' || x == 'Ice Hammer' || x == 'Double Iron Bash' || x.includes("Punch"))) {
                player_ability_modifier = 1.2
            }

            var defendingType1Effectiveness = this.typeData.find(x => x.moveType == attackingType)[defendingType1]
            var pkmn_ability = this.mapper.properties.player.team[0].ability.value
            // if (defendingType1 && attackingType) {
            //     var defendingType1Effectiveness = this.typeEffectivenessArray[attackingType][defendingType1]
            // }
            if (state == 'Battle') {
                if (defendingType2 && attackingType && (defendingType1 != defendingType2)) {
                    var defendingType2Effectiveness = this.typeData.find(x => x.moveType == attackingType)[defendingType2]
                }

                // Filter ability
                if (enemy_pokemon_data?.ability.value == 'Filter' && defendingType1Effectiveness == 2) {
                    defendingType1Effectiveness = 1.5 
                }
                if (enemy_pokemon_data?.ability.value == 'Filter' && defendingType2Effectiveness == 2) {
                    defendingType2Effectiveness = 1.5 
                }

                // Solid Rock ability
                if (enemy_pokemon_data?.ability.value == 'Solid Rock' && defendingType1Effectiveness == 2) {
                    defendingType1Effectiveness = 1.5 
                }
                if (enemy_pokemon_data?.ability.value == 'Solid Rock' && defendingType2Effectiveness == 2) {
                    defendingType2Effectiveness = 1.5 
                }
            }

            if (pkmn_ability == 'Scrappy' && (attackingType == 'Fighting' || attackingType == 'Normal')) {
                if (defendingType1 == 'Ghost') {
                    defendingType1Effectiveness = 1
                }
                if (defendingType2 == 'Ghost') {
                    defendingType2Effectiveness = 1
                }
            }

            var stabModifier = this.determineSTAB(x)
            if (player_ability == "Adaptability") {
                stabModifier = 2
            }

            var ability = this.abilityModifier(this.mapper.properties.player.team[0].ability.value, attackingType, 'player')
            
            if (this.mapper.properties.battle.opponent.active_pokemon.ability.value == 'Levitate' && attackingType == 'Ground') {
                ability = 0 
            }
            if (enemy_pokemon_data?.ability.value == 'Storm Drain' && attackingType == 'Water') {
                ability = 0 
            }
            if (enemy_pokemon_data?.ability.value == 'Dry Skin' && attackingType == 'Water') {
                ability = 0 
            }
            if (enemy_pokemon_data?.ability.value == 'Lightningrod' && attackingType == 'Electric') {
                ability = 0 
            }
            if (enemy_pokemon_data?.ability.value == 'Flash Fire' && attackingType == 'Fire') {
                ability = 0 
            }
            if (enemy_pokemon_data?.ability.value == 'Heatproof' && attackingType == 'Fire') {
                ability = 0.5 
            }
            if (enemy_pokemon_data?.ability.value == 'Motor Drive' && attackingType == 'Electric') {
                ability = 0
            }
            var recklessMoves = [
                "Axe Kick",
                "Brave Bird",
                "Double-Edge",
                "Double Edge",
                "Flare Blitz",
                "Head Charge",
                "Head Smash",
                "High Jump Kick",
                "Jump Kick",
                "Submission",
                "Supercell Slam",
                "Take Down",
                "Wave Crash",
                "Wild Charge",
            ]
            if (enemy_pokemon_data?.ability.value == 'Reckless' && recklessMoves.includes(x)) {
                ability = 1.2
            }

            var player_item = ""
            var enemy_item = ""
            switch (state) {
                case "Battle": {
                    player_item = this.mapper.properties.battle.player.active_pokemon.held_item.value
                    enemy_item = this.mapper.properties.battle.opponent.active_pokemon.held_item.value
                    break
                }
                default: {
                    player_item = this.mapper.properties.player.team[0].held_item.value
                    break
                }
            }
            var itemBoost = this.determineItemBoost(x, this.mapper.properties.player.team[0])

            if (enemy_pokemon_data?.ability.value == 'Levitate' && attackingType == 'Ground' && enemy_item == "Iron Ball") {
                ability = 1 
            }
            if (attackingType == 'Ground' && defendingType1 == 'Flying' && enemy_item == "Iron Ball") {
                defendingType1Effectiveness = 1 
            }
            if (attackingType == 'Ground' && defendingType2 == 'Flying' && enemy_item == "Iron Ball") {
                defendingType2Effectiveness = 1 
            }

            if (species == 'Mime Jr.' && player_item == 'Odd Incense' && attackingType == "Psychic") {
                itemBoost = 1.2
            }
            else if (species == 'Bonsly' && player_item == 'Rock Incense' && attackingType == "Rock") {
                itemBoost = 1.2
            }
            else if (species == 'Budew' && player_item == 'Rose Incense' && attackingType == "Grass") {
                itemBoost = 1.2
            }
            else if (species == 'Azurill' && player_item == 'Sea Incense' && attackingType == "Water") {
                itemBoost = 1.2
            }
            else if (species == 'Mantyke' && player_item == 'Wave Incense' && attackingType == "Water") {
                itemBoost = 1.2
            }
            else if (player_item == null && x == 'Acrobatics') {
                itemBoost = 2
            }

            var weatherBoost = this.weatherModifier(this.mapper.properties.battle.field.weather.value, x, this.moveType(x))
            var burnModifier = this.burnModifier(x)
            // console.log("Type1:",defendingType1Effectiveness)
            // console.log("Type2:",defendingType2Effectiveness)
            if (pkmn_ability == "Tinted Lens") {
                var type_multiple = defendingType1Effectiveness * defendingType2Effectiveness
                if (type_multiple == 0) {}
                else if (type_multiple < 1) {
                    defendingType1Effectiveness = 1
                    defendingType2Effectiveness = type_multiple * 2
                }
            }
            if (power <= 60 && pkmn_ability == "Technician") {
                power = power * 1.5
            }
            // console.log("Recalculated:", defendingType2Effectiveness)
            if (this.typeCalcs == true && this.mapper.properties.meta.state.value == "Battle" && this.mapper.properties.meta.state_enemy.value != "Battle Finished") { //Handles type effectiveness calculations in battle
                if (power == "—") { return "—" }
                if (power == "-") { return "—" }
                return Math.floor(power * stabModifier * defendingType1Effectiveness * defendingType2Effectiveness * ability * itemBoost * weatherBoost * burnModifier * player_ability_modifier)
            }
            else //handles out of battle cases
                if (power == "—") { return power }
                if (power == "-") { return "—" }
                else 
                    return Math.floor(power * stabModifier * ability * itemBoost * burnModifier * player_ability_modifier)
        },
        split_diff_color(difference_string) {
            if (difference_string === "-")          { return "color: black" }
            if (difference_string === "+0:00")      { return "color: black" }
            if (difference_string.charAt(0) == "+") { return "color: red" }
            if (difference_string.charAt(0) == "-") { return "color: green" }
        },
        convertDurationToSeconds(duration) {
            const parts = duration.split(':').map(part => parseInt(part, 10));
            if (parts.length === 1) {
                return parts[0];
            } else if (parts.length === 2) {
                return parts[0] * 60 + parts[1];
            } else if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
        },
        convertSecondsToDuration(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
        
            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            } else if (minutes > 0) {
                return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
            } else {
                var seconds = remainingSeconds
                if (remainingSeconds < 10) { seconds = "0" + remainingSeconds.toString() }
                return `0:${String(seconds)}`
            }
        },
        async load_temp_splits() {
            const text = await loadCsvFile();
            const rows = text.split("\n").slice(1).filter(x => x !== '');
            const results = []
            for (const row of rows) {
                const columns = row.split(",");
                results.push({trainer: columns[2], time: columns[3]})
            }
            return results
        },
        async load_splits() {
            const text = await loadCsvFile();
            const rows = text.split("\n").slice(1).filter(x => x !== '');
            const results = []
            for (const row of rows) {
                const columns = row.split(",");
                results.push({trainer: columns[2], time: columns[3]})
            }
            this.previous_splits = results;
        },
    },
    

//--------- PROGRAM MOUNTED ---------------------------------------------------------------------------------------------------------------//
    mounted: async function () {
        const that = this
        this.mapper = new GameHookMapperClient()
        this.mapper.onMapperLoaded = (x) => this.ready = true
        this.mapper.onMapperUnloaded = (x) => this.ready = false
        this.mapper._debouceTimeout = 10
        // this.mapper.deboucePath("battle.player.active_pokemon.modifiers")
        this.mapper.deboucePath("battle.opponent.active_pokemon")
        this.mapper.deboucePath("battle.opponent.team")
        this.mapper.deboucePath("player.team.0.species") // TODO: requires testing
        await this.mapper.connect()
        this.updateTime()
        this.load_all_settings()
        this.pokemon_list = this.keys_function(g4PokemonData)

        // Initialize evolution family list
        this.updateEvolutionFamilyList();

        // Initial tracking of personality value and species
        this.last_known_personality_value = this.mapper.properties.player.team[0].internals.personality_value.value;
        this.last_known_species = this.mapper.properties.player.team[0].species.value;
        
        // Track personality value changes
        this.mapper.properties.player.team[0].internals.personality_value.change(async (newProp, oldProp) => {
            // Update tracked personality value
            this.last_known_personality_value = newProp.value;
        });

        // Species change handler - handles both normal species changes and evolution
        this.mapper.properties.player.team[0].species.change(async (newProp, oldProp) => {
            const currentPersonalityValue = this.mapper.properties.player.team[0].internals.personality_value.value;
            const state = this.mapper.properties.meta.state.value
            
            // Check if this is an evolution (same personality value, different species, evolution enabled)
            if (this.evolution == true && newProp.value != oldProp.value && 
                currentPersonalityValue === this.last_known_personality_value &&
                this.last_known_personality_value != null) {
                
                const evolution_family_raw = this.g4PokemonData?.[this.starter]?.evolution_family;
                if (evolution_family_raw && evolution_family_raw.length > 0) {
                    const evolution_family = evolution_family_raw.map(obj => obj.species).filter(s => s != null);
                    const evolved = evolution_family.includes(newProp.value);
                    
                    if (evolved == true) {
                        // Store old species for transition
                        const oldSpecies = this.starter;
                        const newSpecies = newProp.value;

                        this.stats_setting = "Base Stats";
                        
                        // Update starter
                        this.starter = newSpecies;
                        this.last_known_species = newSpecies;
                        
                        // Update the dropdown to the new evolved species
                        // This will trigger the watcher to load the new species' styles
                        this.selected_evolution_species = newSpecies;
                        
                        // Show base stats of new evolved species until next battle
                        this.show_evolved_base_stats = true;
                        this.evolved_species_for_stats = newSpecies;
                        
                        // Perform fade transition
                        await this.performEvolutionTransition(oldSpecies, newSpecies);
                        
                        // Update personality value tracking
                        this.last_known_personality_value = currentPersonalityValue;
                        return; // Don't process as normal species change
                    }
                }
            }
            
            // Normal species change handling (not an evolution)
            this.last_known_species = newProp.value;
            this.last_known_personality_value = currentPersonalityValue;
            
            if ((state == "Battle" || state == "From Battle") && this.mapper.properties.battle.player.pkmn_ram?.pokemon_0_ram?.stats.hp.value != 0) {
                this.starter = newProp.value
            }
            else if (state == "Overworld" && this.mapper.properties.overworld.map_index.value == 278 && newProp.value == 'Reshiram') {
                // Special handling for Reshiram
            }
            else if (state == "Overworld") {
                this.starter = newProp.value
            }
        })
        this.mapper.properties.player.team[0].level.change(async (newProp, oldProp) => {
            const map = this.mapper.properties.overworld.map_index.value
            if (newProp.value == 5 && map == 391) {
                this.write_byte_data(this.set_starter_stats_object)
            }
        })

        //EXP BAR ANIMATION FUNCTION
        /* exp bar initialization */ 
        {
            const function_logging = false
            const species = this.mapper.properties.player.team[0].species.value ?? this.starter;
            if (function_logging == true) { console.log(species) }
            const expPoints = (this.mapper.properties.meta.state.value == 'Battle' ? this.mapper.properties.battle.player.active_pokemon.exp.value :
                this.mapper.properties.player.team[0].exp.value) ?? 0;
            if (function_logging == true) { console.log(expPoints) }
            const growthRate = this.g4PokemonData[species].growth_rate;
            if (function_logging == true) { console.log(growthRate) }
            let expStats = this.calcExpStats(growthRate, expPoints);
            if (function_logging == true) { console.log(expStats) }
            const width = (expStats.percent * 100) + "%";
            if (this.$refs.expBar) {
                this.$refs.expBar.style.width = width
            }
            if (function_logging == true) { console.log(width) }

            this.expBarState.species = species;
            this.expBarState.expPoints = expPoints;
        }

        // Encounters
        this.mapper.properties.overworld.map_name.change(async (newProp) => {
            this.freezeEncounters();
        });

        // Resets
        if (this.selected_game == "Platinum" || this.selected_game == "Diamond and Pearl") {
            this.mapper.properties?.flags?.new_game_1.change(async (newProp, oldProp) => {
                // This should resolve the issue in Cynthia's chamber where the timer would restart when resetting against her
                if (newProp.value == true && parseInt(this.timer_formatted_time[0]) == 0) {
                    this.startTime()
                    if (this.set_rom_starter_automatically) { this.update_rom_starter_and_intro_mon(); }
                    this.attempt_number++
                }
                if (parseInt(this.timer_formatted_time[0]) > 0 && newProp.value == false && oldProp.value == true) {
                    this.blackout = false;
                    if (this.disallow_faults == false) { this.playerResets++ }
                    this.disallow_faults_function()
                }
            })
        }
        if (this.selected_game == "HeartGold and SoulSilver") {
            this.mapper.properties?.variables?.game_started.change(async (newProp, oldProp) => {
                if (newProp.value == 56150 && parseInt(this.timer_formatted_time[0]) == 0) {
                    this.startTime()
                    if (this.set_rom_starter_automatically) { this.update_rom_starter_and_intro_mon(); }
                    this.blackout = false;
                    this.attempt_number++
                }
                if (parseInt(this.timer_formatted_time[0]) > 0 && newProp.value != 0 && this.mapper.properties.overworld.map_name.value != 'Pokemon League - Map 7') { // TODO How do resets work in HGSS?
                    this.blackout = false;
                    if (this.disallow_faults == false) { this.playerResets++ }
                    this.disallow_faults_function()
                }
            })
        }
        //Blackouts
        this.mapper.properties.battle.player.team[0].stats.hp.change((newProp, oldProp) => {
            const state = this.mapper.properties.meta.state.value
            if (newProp.value == 0 && (state == `Battle`)) {
                this.blackout = true;
            }
        })
        this.mapper.properties.meta.state.change((newProp, oldProp) => {
            const game = this.mapper.properties.meta.game_name.value
            if (this.blackout == true) {
                if (game == 'Platinum' || game == 'Diamond and Pearl') {
                    if (newProp.value == "Overworld" && oldProp.value == "From Battle") {
                        if (this.disallow_faults == false) { this.blackout_counter++ }
                        this.blackout = false;
                        this.disallow_faults_function()
                    }
                }
                if (game == 'HeartGold and SoulSilver') {
                    if (newProp.value == "Overworld" && oldProp.value == "From Battle") {
                        if (this.disallow_faults == false) { this.blackout_counter++ }
                        this.blackout = false;
                        this.disallow_faults_function()
                    }
                }
            }

            // If we're showing evolved base stats and state changes to Battle (not from Battle),
            // hide the evolved base stats display
            if (this.show_evolved_base_stats && (newProp.value == "To Battle" || newProp.value == "Battle") && oldProp.value != "From Battle") {
                this.show_evolved_base_stats = false;
                this.stats_setting = "Automatic";
                this.evolved_species_for_stats = null;
            }
        });

        const setStartingStats = async () => {
            //256 * 25 * 10 = 70400, gives a clean starting point where modulo 25 and modulo 256 are both 0
            //this can really be anything divisible by 256 though
            var personalityValue = 70400 + this.natures[this.pkmnNature]["modulo_value"];
            if(this.pkmn_gender == "Male") {
                //31 and 225 are the breakpoints for 87% gender ratio pokemon
                personalityValue += 225;
            }
            //the odd/evenness may need to be flipped according to the selected ability
            //this code prevents abilities from swapping when the Pokemon evolves
            if (this.g4PokemonData[this.starter]?.abilities && 
                ((personalityValue % 2 == 0 && this.pkmn_ability == this.g4PokemonData[this.starter].abilities[1]) ||
                (personalityValue % 2 == 1 && this.pkmn_ability == this.g4PokemonData[this.starter].abilities[0]))) {
            //     these checks are trying to flip the odd/even by adding an odd number multiple of 25
            //     in order to not disturb the nature calc. It's trying to maintain the gender calc too.
                if (personalityValue % 256 <= 11 && this.pkmn_gender != "Male") {
                    personalityValue += 275; //adding 275 won't make the modulo exceed 31
                }
                else if (personalityValue % 256 > 11 && this.pkmn_gender != "Male") {
                    personalityValue += 1525; //1525 keeps the modulo between 0 and 31
                }
                else if (personalityValue % 256 <= 236 && this.pkmn_gender == "Male") {
                    personalityValue += 275; //adding 275 keeps the modulo between 225 and 255
                }
                else if (personalityValue % 256 > 236 && this.pkmn_gender == "Male") {
                    personalityValue += 1525; //1525 keeps the modulo between 225 and 255
                }
            }
            
            const ability   = this.pkmn_ability
            const species   = this.starter
            const pkmnData  = this.g4PokemonData[this.starter]
            const level     = 5
            const natures   = this.natures[this.pkmnNature]
            let player_starter = this.starter_choice

            //* IV BLOCK CALCULATION
            var hp_data       = this.hiddenpowers
            var pkmn_hp       = this.hidden_power_type  
            var pkmn_hp_index = this.hidden_power_index

            var ivHp  = hp_data[pkmn_hp][pkmn_hp_index][0]
            var ivAtk = hp_data[pkmn_hp][pkmn_hp_index][1]
            var ivDef = hp_data[pkmn_hp][pkmn_hp_index][2]
            var ivSpe = hp_data[pkmn_hp][pkmn_hp_index][3]
            var ivSpA = hp_data[pkmn_hp][pkmn_hp_index][4]
            var ivSpD = hp_data[pkmn_hp][pkmn_hp_index][5]

            //Calculates the Pokemon's starting stats with the desired DVs
            var hitpoints      = Math.floor((((2 * pkmnData.base_hp + ivHp + 0) * level)/100) + level + 10)
            var attack         = Math.floor(Math.floor(((((2 * pkmnData.base_atk + ivAtk + 0) * level)/100) + 5)) * natures["nature_attack"])
            var defense        = Math.floor(Math.floor(((((2 * pkmnData.base_def + ivDef + 0) * level)/100) + 5)) * natures["nature_defense"])
            var specialAttack  = Math.floor(Math.floor(((((2 * pkmnData.base_spc_atk + ivSpA + 0) * level)/100) + 5)) * natures["nature_specialAttack"])
            var specialDefense = Math.floor(Math.floor(((((2 * pkmnData.base_spc_def + ivSpD + 0) * level)/100) + 5)) * natures["nature_specialDefense"])
            var speed          = Math.floor(Math.floor(((((2 * pkmnData.base_spd + ivSpe + 0) * level)/100) + 5)) * natures["nature_speed"])

            if (this.legacy_starter_assignment) { 
                this.mapper.properties.player.starter.set(player_starter, false) 
            } //this needs to be turned off refilming Sudowoodo
            await Promise.all([
                //Set personality value & ablity
                this.mapper.properties.player.team[0].internals.personality_value.set(personalityValue, false), 
                this.mapper.properties.player.team[0].ability.set(ability, false), 
                this.mapper.properties.player.team[0].stats.hp.set(hitpoints, false), 
                this.mapper.properties.player.team[0].stats.hp_max.set(hitpoints, false), 
                this.mapper.properties.player.team[0].stats.attack.set(attack, false), 
                this.mapper.properties.player.team[0].stats.defense.set(defense, false), 
                this.mapper.properties.player.team[0].stats.special_attack.set(specialAttack, false), 
                this.mapper.properties.player.team[0].stats.special_defense.set(specialDefense, false), 
                this.mapper.properties.player.team[0].stats.speed.set(speed, false), 
                this.mapper.setBits([
                    {path: 'player.team.0.ivs.hp',              value: ivHp,  freeze: false},
                    {path: 'player.team.0.ivs.attack',          value: ivAtk, freeze: false},
                    {path: 'player.team.0.ivs.defense',         value: ivDef, freeze: false},
                    {path: 'player.team.0.ivs.speed',           value: ivSpe, freeze: false},
                    {path: 'player.team.0.ivs.special_attack',  value: ivSpA, freeze: false},
                    {path: 'player.team.0.ivs.special_defense', value: ivSpD, freeze: false},
                ]),
            ])
            if (species == 'Regirock' || species == 'Regice' || species == 'Registeel') {
                await Promise.all([
                    await this.mapper.properties.player.team[0].moves[0].pp.set(0, false),
                ])
            }
            if (species == 'Shaymin') {
                await Promise.all([
                    await this.mapper.properties.player.team[0].flags.fateful_encounter.set(true, false),
                ])
            }
        }
        this.mapper.properties.player.team[0].level.change(async (newProp) => {
            if (this.mapper.properties.meta.game_name.value == "Platinum" && newProp == 5 && this.mapper.properties.overworld?.map_name?.value == "Route 201 - Map 1") {
                await setStartingStats()
            }
            if (this.mapper.properties.meta.game_name.value == "HeartGold and SoulSilver" && newProp == 5 && this.mapper.properties.overworld?.map_index?.value == 61) {
                await setStartingStats()
            }
        });

        this.mapper.properties.player.starter.change(async (newProp) => {
            if (newProp.value != this.starter_choice && this.mapper.properties.meta.game_name.value == "HeartGold and SoulSilver" && this.mapper.properties.overworld?.map_index?.value == 61 && this.legacy_starter_assignment) {
                await Promise.all([
                    await this.mapper.properties.player.starter.set(this.starter_choice, false),
                ])
            }
        })

        //Styling for stats in case they go above 999
        const stat_size_3_digit = "56px"
        const stat_size_4_digit = "43px"
        if (document.getElementById("Atk") && this.get_stat()["Atk"].toString().length <= 3) { document.getElementById("Atk").style.fontSize = stat_size_3_digit }
        if (document.getElementById("Atk") && this.get_stat()["Atk"].toString().length >= 4) { document.getElementById("Atk").style.fontSize = stat_size_4_digit }
        if (document.getElementById("Def") && this.get_stat()["Def"].toString().length <= 3) { document.getElementById("Def").style.fontSize = stat_size_3_digit }
        if (document.getElementById("Def") && this.get_stat()["Def"].toString().length >= 4) { document.getElementById("Def").style.fontSize = stat_size_4_digit }
        if (document.getElementById("SpA") && this.get_stat()["SpA"].toString().length <= 3) { document.getElementById("SpA").style.fontSize = stat_size_3_digit }
        if (document.getElementById("SpA") && this.get_stat()["SpA"].toString().length >= 4) { document.getElementById("SpA").style.fontSize = stat_size_4_digit }
        if (document.getElementById("SpD") && this.get_stat()["SpD"].toString().length <= 3) { document.getElementById("SpD").style.fontSize = stat_size_3_digit }
        if (document.getElementById("SpD") && this.get_stat()["SpD"].toString().length >= 4) { document.getElementById("SpD").style.fontSize = stat_size_4_digit }
        if (document.getElementById("Spe") && this.get_stat()["Spe"].toString().length <= 3) { document.getElementById("Spe").style.fontSize = stat_size_3_digit }
        if (document.getElementById("Spe") && this.get_stat()["Spe"].toString().length >= 4) { document.getElementById("Spe").style.fontSize = stat_size_4_digit }
        this.mapper.properties.battle.player.active_pokemon.modifiers.attack.change(async () => {
            if (this.get_stat()["Atk"].toString().length <= 3) { document.getElementById("Atk").style.fontSize = stat_size_3_digit }
            if (this.get_stat()["Atk"].toString().length >= 4) { document.getElementById("Atk").style.fontSize = stat_size_4_digit }
        })
        this.mapper.properties.battle.player.active_pokemon.modifiers.defense.change(async () => {
            if (this.get_stat()["Def"].toString().length <= 3) { document.getElementById("Def").style.fontSize = stat_size_3_digit }
            if (this.get_stat()["Def"].toString().length >= 4) { document.getElementById("Def").style.fontSize = stat_size_4_digit }
        })
        this.mapper.properties.battle.player.active_pokemon.modifiers.special_attack.change(async () => {
            if (this.get_stat()["SpA"].toString().length <= 3) { document.getElementById("SpA").style.fontSize = stat_size_3_digit }
            if (this.get_stat()["SpA"].toString().length >= 4) { document.getElementById("SpA").style.fontSize = stat_size_4_digit }
        })
        this.mapper.properties.battle.player.active_pokemon.modifiers.special_defense.change(async () => {
            if (this.get_stat()["SpD"].toString().length <= 3) { document.getElementById("SpD").style.fontSize = stat_size_3_digit }
            if (this.get_stat()["SpD"].toString().length >= 4) { document.getElementById("SpD").style.fontSize = stat_size_4_digit }
        })
        this.mapper.properties.battle.player.active_pokemon.modifiers.speed.change(async () => {
            if (this.get_stat()["Spe"].toString().length <= 3) { document.getElementById("Spe").style.fontSize = stat_size_3_digit }
            if (this.get_stat()["Spe"].toString().length >= 4) { document.getElementById("Spe").style.fontSize = stat_size_4_digit }
        })

        //*Autosplitter
        const log_split = (x) => console.log(`Autosplitter - Battle Ended - Split: ${this.mapper.properties.battle.opponent.name.value} at ${this.timer_formatted_time[0]}${this.timer_formatted_time[1]} (Gametime: ${this.gametimeSplit})`)
        const autosplitter_process = (optional_trainer_data = null) => {
            // console.log("Checking if autosplitter is on...")
            if (this.autosplitter_toggle == true) {
                // console.log("Began Autosplitter Process")
                d = new Date()
                battle_end = Date.now()
                //values
                let gameTimeH = this.mapper.properties.game_time?.hours?.value
                let gameTimeM = this.mapper.properties.game_time?.minutes?.value
                let gameTimeS = this.mapper.properties.game_time?.seconds?.value
                let gameTimeF = 0
                
                //data to be collected with the autosplitter
                let date_string  = (d.getMonth() + 1) + "-" + d.getDate().toString().padStart(2, "0")
                let time_string  = d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0") + ":" + d.getSeconds().toString().padStart(2, "0")
                let player_name  = this.mapper.properties.player.name.value
                let pokemon      = this.starter
                let trainer_name = optional_trainer_data ? optional_trainer_data : this.get_trainer_name(this.mapper.properties.battle.opponent.name.value, this.mapper.properties.battle.opponent.id.value)
                let trainer_id           = this.mapper.properties.battle.opponent.id.value
                let location             = this.mapper.properties.overworld.map_name.value
                let total_pokemon        = this.mapper.properties.battle.opponent.team_count.value
                let real_time_total      = this.timer_formatted_time[0] + this.timer_formatted_time[1]
                let real_time_hmmss      = this.timer_formatted_time[0]
                let real_time_file_label = this.timer_formatted_time[2]
                let resets               = this.playerResets.toString()
                let blackouts            = this.blackout_counter.toString()
                let failures             = this.playerResets + this.blackout_counter
                let level                = this.mapper.properties.player.team[0].level.value.toString()
                let game_time            = this.gametimeSplit.toString()
                let battle_duration      = (battle_end - this.battle_start)/1000 
                let move1     = this.mapper.properties.player.team[0].moves[0].move.value
                let move2     = this.mapper.properties.player.team[0].moves[1].move.value
                let move3     = this.mapper.properties.player.team[0].moves[2].move.value
                let move4     = this.mapper.properties.player.team[0].moves[3].move.value
                let move1pp   = this.mapper.properties.player.team[0].moves[0].pp.value
                let move2pp   = this.mapper.properties.player.team[0].moves[1].pp.value
                let move3pp   = this.mapper.properties.player.team[0].moves[2].pp.value
                let move4pp   = this.mapper.properties.player.team[0].moves[3].pp.value
                let move1ppUp = this.mapper.properties.player.team[0].moves[0].pp_up.value
                let move2ppUp = this.mapper.properties.player.team[0].moves[1].pp_up.value
                let move3ppUp = this.mapper.properties.player.team[0].moves[2].pp_up.value
                let move4ppUp = this.mapper.properties.player.team[0].moves[3].pp_up.value
                let saves = 0
                let steps = 0
                let bonks = 0
                let trainerBattles = 0
                let wildBattles = 0
                let battleTurns = 0
                let playerTurns = 0
                let enemyTurns  = 0
                let itemsInBag  = 0
                let money       = 0
                let rivalTeam   = 0
                let statusCondition = this.mapper.properties.player.team[0].status_condition.value
                let type1           = this.g4PokemonData[this.starter].type_1
                let type2           = this.g4PokemonData[this.starter].type_2
                let experience      = this.mapper.properties.player.team[0].exp.value
                
                //deprecated properties
                let runIdentifier  = this.starter.toString() + this.attempt_number.toString()
                let trainerName    = trainer_name
                let RTHours        = this.time_h
                let RTMinutes      = this.time_m
                let RTSeconds      = this.time_s
                let RTMilliseconds = this.time_ms
                let startTime      = this.time_split_start
                let realTime       = this.padTime(this.time_h) + ":" + this.padTime(this.time_m) + ":" + this.padTime(this.time_s) + "." + this.padTime(this.time_ms)
                let gameTime       = this.padTime(gameTimeH) + ":" + this.padTime(gameTimeM) + ":" + this.padTime(gameTimeS) + "." + this.padTime(gameTimeF)

                let hp    = this.mapper.properties.player.team[0].stats.hp.value
                let maxHp = this.mapper.properties.player.team[0].stats.hp_max.value
                let atk   = this.mapper.properties.player.team[0].stats.attack.value
                let def   = this.mapper.properties.player.team[0].stats.defense.value
                let spA   = this.mapper.properties.player.team[0].stats.special_attack.value
                let spD   = this.mapper.properties.player.team[0].stats.special_defense.value
                let spe   = this.mapper.properties.player.team[0].stats.speed.value

                let statExp_hp  = this.mapper.properties.player.team[0].evs.hp.value
                let statExp_atk = this.mapper.properties.player.team[0].evs.attack.value
                let statExp_def = this.mapper.properties.player.team[0].evs.defense.value
                let statExp_spA = this.mapper.properties.player.team[0].evs.special_attack.value
                let statExp_spD = this.mapper.properties.player.team[0].evs.special_defense.value
                let statExp_spe = this.mapper.properties.player.team[0].evs.speed.value

                let iv_hp  = this.mapper.properties.player.team[0].ivs.hp.value
                let iv_atk = this.mapper.properties.player.team[0].ivs.attack.value
                let iv_def = this.mapper.properties.player.team[0].ivs.defense.value
                let iv_spA = this.mapper.properties.player.team[0].ivs.special_attack.value
                let iv_spD = this.mapper.properties.player.team[0].ivs.special_defense.value
                let iv_spe = this.mapper.properties.player.team[0].ivs.speed.value

                let mod_atk = this.mapper.properties.battle.player.active_pokemon.modifiers.attack.value
                let mod_def = this.mapper.properties.battle.player.active_pokemon.modifiers.defense.value
                let mod_spA = this.mapper.properties.battle.player.active_pokemon.modifiers.special_attack.value
                let mod_spD = this.mapper.properties.battle.player.active_pokemon.modifiers.special_defense.value
                let mod_spe = this.mapper.properties.battle.player.active_pokemon.modifiers.speed.value
                let mod_acc = this.mapper.properties.battle.player.active_pokemon.modifiers.accuracy.value
                let mod_eva = this.mapper.properties.battle.player.active_pokemon.modifiers.evasion.value

                let battle_atk = 0
                let battle_def = 0
                let battle_spA = 0
                let battle_spD = 0
                let battle_spe = 0
                
                //patch properties
                let patch_frameCount                 = 0
                let patch_oWFrameCount               = 0
                let patch_battleFrameCount           = 0
                let patch_menuFrameCount             = 0
                let patch_introsFrameCount           = 0
                let patch_saveCount                  = 0
                let patch_reloadCount                = 0
                let patch_clockResetCount            = 0
                let patch_stepsCount                 = 0
                let patch_stepsCountWalk             = 0
                let patch_stepsCountBike             = 0
                let patch_stepsCountSurf             = 0
                let patch_bonks                      = 0
                let patch_battles                    = 0
                let patch_trainerBattles             = 0
                let patch_wildBattles                = 0
                let patch_battlesFled                = 0
                let patch_failedRuns                 = 0
                let patch_totalDamageDealt           = 0
                let patch_actualDamageDealt          = 0
                let patch_totalDamageTaken           = 0
                let patch_actualDamageTaken          = 0
                let patch_ownMovesHit                = 0
                let patch_ownMovesMissed             = 0
                let patch_enemyMovesHit              = 0
                let patch_enemyMovesMissed           = 0
                let patch_ownMovesSE                 = 0
                let patch_ownMovesNVE                = 0
                let patch_enemyMovesSE               = 0
                let patch_enemyMovesNVE              = 0
                let patch_criticalsDealt             = 0
                let patch_oHKOsDealt                 = 0
                let patch_criticalsTaken             = 0
                let patch_oHKOsTaken                 = 0
                let patch_wasConfused                = 0
                let patch_enemyBecameConfused        = 0
                let patch_wasParalyzed               = 0
                let patch_enemyWasParalyzed          = 0
                let patch_wasBurned                  = 0
                let patch_enemyWasBurned             = 0
                let patch_wasFrozen                  = 0
                let patch_enemyWasFrozen             = 0
                let patch_wasPoisoned                = 0
                let patch_enemyWasPoisoned           = 0
                let patch_wasPoisonedBadly           = 0
                let patch_enemyWasPoisonedBadly      = 0
                let patch_fellAsleep                 = 0
                let patch_enemyFellAsleep            = 0
                let patch_playerTurnsConfused        = 0
                let patch_enemyTurnsConfused         = 0
                let patch_playerTurnsConfusedHitSelf = 0
                let patch_enemyTurnsConfusedHitSelf  = 0
                let patch_playerTurnsParalyzed       = 0
                let patch_enemyTurnsParalyzed        = 0
                let patch_playerTurnsParalyzedFully  = 0
                let patch_enemyTurnsParalyzedFully   = 0
                let patch_PlayerTurnsAsleep          = 0
                let patch_EnemyTurnsAsleep           = 0
                let patch_playerHpHealed             = 0
                let patch_enemyHpHealed              = 0
                let patch_playerPokemonFainted       = 0
                let patch_enemyPokemonFainted        = 0
                let patch_experienceGained           = 0
                let patch_switchout                  = 0
                let patch_moneyMade                  = 0
                let patch_moneySpent                 = 0
                let patch_moneyLost                  = 0
                let patch_itemsPickedUp              = 0
                let patch_itemsBought                = 0
                let patch_itemsSold                  = 0
                let patch_ballsThrown                = 0
                let patch_pokemonCaughtInBalls       = 0
                let patch_movesLearnt                = 0

                //definitions for what split data is logged to file
                let simple_data = [
                    player_name, pokemon, trainer_name, real_time_hmmss, 
                    resets, blackouts, level, game_time, battle_duration, 
                    move1, move2, move3, move4
                ]
                let full_data = simple_data
                if (this.scott_mode == true) {
                    full_data = [
                        date_string, time_string, player_name, pokemon, trainer_name, 
                        trainer_id, location, total_pokemon, real_time_total, 
                        real_time_hmmss, real_time_file_label, resets, blackouts, failures, 
                        level, game_time, battle_duration, move1, move2, move3, move4, 
                        saves, steps, bonks, trainerBattles, wildBattles, battleTurns, 
                        playerTurns, enemyTurns, itemsInBag, money, rivalTeam,
                        statusCondition, type1, type2, experience,
                        runIdentifier, this.starter, trainerName,
                        startTime, realTime, gameTime, level, this.playerResets,
                        RTHours, RTMinutes, RTSeconds, RTMilliseconds,
                        move1, move2, move3, move4, move1pp, move2pp, move3pp, move4pp, move1ppUp, move2ppUp, move3ppUp, move4ppUp,
                        hp, maxHp, atk, def, spA, spD, spe,
                        statExp_hp, statExp_atk, statExp_def, statExp_spA, statExp_spD, statExp_spe,
                        iv_hp, iv_atk, iv_def, iv_spA, iv_spD, iv_spe,
                        mod_atk, mod_def, mod_spA, mod_spD, mod_spe, mod_acc, mod_eva,
                        battle_atk, battle_def, battle_spA, battle_spD, battle_spe,
                        patch_frameCount, patch_oWFrameCount, patch_battleFrameCount, patch_menuFrameCount, patch_introsFrameCount,
                        patch_saveCount, patch_reloadCount, patch_clockResetCount,
                        patch_stepsCount, patch_stepsCountWalk, patch_stepsCountBike, patch_stepsCountSurf, patch_bonks,
                        patch_battles, patch_trainerBattles, patch_wildBattles, patch_battlesFled, patch_failedRuns,
                        patch_totalDamageDealt, patch_actualDamageDealt, patch_totalDamageTaken, patch_actualDamageTaken,
                        patch_ownMovesHit, patch_ownMovesMissed, patch_enemyMovesHit, patch_enemyMovesMissed, 
                        patch_ownMovesSE, patch_ownMovesNVE, patch_enemyMovesSE, patch_enemyMovesNVE, 
                        patch_criticalsDealt, patch_oHKOsDealt, patch_criticalsTaken, patch_oHKOsTaken,
                        patch_wasConfused, patch_enemyBecameConfused, patch_wasParalyzed, patch_enemyWasParalyzed, 
                        patch_wasBurned, patch_enemyWasBurned, patch_wasFrozen, patch_enemyWasFrozen,
                        patch_wasPoisoned, patch_enemyWasPoisoned, patch_wasPoisonedBadly, patch_enemyWasPoisonedBadly,
                        patch_fellAsleep, patch_enemyFellAsleep, patch_playerTurnsConfused, patch_playerTurnsConfusedHitSelf, 
                        patch_playerTurnsParalyzed, patch_playerTurnsParalyzedFully, patch_enemyTurnsConfused, patch_enemyTurnsConfusedHitSelf, 
                        patch_enemyTurnsParalyzed, patch_enemyTurnsParalyzedFully, patch_PlayerTurnsAsleep, patch_EnemyTurnsAsleep,
                        patch_playerHpHealed, patch_enemyHpHealed, 
                        patch_playerPokemonFainted, patch_enemyPokemonFainted, patch_experienceGained, patch_switchout,
                        patch_moneyMade, patch_moneySpent, patch_moneyLost,
                        patch_itemsPickedUp, patch_itemsBought, patch_itemsSold,
                        patch_ballsThrown, patch_pokemonCaughtInBalls,
                        patch_movesLearnt,
                        //new properties
                        blackouts, this.attempt_number, failures, rivalTeam
                    ]
                }

                let deprecated_data = []
                if (this.scott_mode == true) {
                    deprecated_data = [
                        runIdentifier, this.starter, trainerName,
                        startTime, realTime, gameTime, level, this.playerResets,
                        RTHours, RTMinutes, RTSeconds, RTMilliseconds,
                        move1, move2, move3, move4,
                        atk, def, spA, spD, spe,
                        mod_atk, mod_def, mod_spA, mod_spD, mod_spe, mod_acc, mod_eva,
                        battle_atk, battle_def, battle_spA, battle_spD, battle_spe,
                        patch_frameCount, patch_oWFrameCount, patch_battleFrameCount, patch_menuFrameCount, patch_introsFrameCount,
                        patch_saveCount, patch_reloadCount, patch_clockResetCount,
                        patch_stepsCount, patch_stepsCountWalk, patch_stepsCountBike, patch_stepsCountSurf, patch_bonks,
                        patch_battles, patch_trainerBattles, patch_wildBattles, patch_battlesFled, patch_failedRuns,
                        patch_totalDamageDealt, patch_actualDamageDealt, patch_totalDamageTaken, patch_actualDamageTaken,
                        patch_ownMovesHit, patch_ownMovesMissed, patch_enemyMovesHit, patch_enemyMovesMissed, 
                        patch_ownMovesSE, patch_ownMovesNVE, patch_enemyMovesSE, patch_enemyMovesNVE, 
                        patch_criticalsDealt, patch_oHKOsDealt, patch_criticalsTaken, patch_oHKOsTaken,
                        patch_wasConfused, patch_enemyBecameConfused, patch_wasParalyzed, patch_enemyWasParalyzed, 
                        patch_wasBurned, patch_enemyWasBurned, patch_wasFrozen, patch_enemyWasFrozen,
                        patch_wasPoisoned, patch_enemyWasPoisoned, patch_wasPoisonedBadly, patch_enemyWasPoisonedBadly,
                        patch_fellAsleep, patch_enemyFellAsleep, patch_playerTurnsConfused, patch_playerTurnsConfusedHitSelf, 
                        patch_playerTurnsParalyzed, patch_playerTurnsParalyzedFully, patch_enemyTurnsConfused, patch_enemyTurnsConfusedHitSelf, 
                        patch_enemyTurnsParalyzed, patch_enemyTurnsParalyzedFully,
                        patch_playerHpHealed, patch_enemyHpHealed, 
                        patch_playerPokemonFainted, patch_enemyPokemonFainted, patch_experienceGained, patch_switchout,
                        patch_moneyMade, patch_moneySpent, patch_moneyLost,
                        patch_itemsPickedUp, patch_itemsBought, patch_itemsSold,
                        patch_ballsThrown, patch_pokemonCaughtInBalls,
                        patch_movesLearnt,
                        //new properties
                        blackouts, this.attempt_number, failures, rivalTeam
                    ]
                }
                
                let simple_data_str = simple_data.join(",") + "\n";
                let full_data_str = full_data.join(",") + "\n";
                let deprecated_data_str = deprecated_data.join(",") + "\n";
                MyStorage["simple_data_str"] = simple_data_str
                MyStorage["full_data_str"] = full_data_str
                MyStorage["simple_data"] = simple_data
                MyStorage["deprecated_data_str"] = deprecated_data_str
                this.simple_data_str = simple_data_str
                this.full_data_str = full_data_str
                this.simple_data = simple_data
                this.deprecated_data_str = deprecated_data_str
                // console.log("Simple Data: ", simple_data)
                // console.log("Deprecated Data: ", deprecated_data_str)
            }
        }

        //write to file at the end of a key battle
        this.mapper.properties.meta.state.change(async (newProp, oldProp) => {
            // console.log(`State Changed to "${newProp.value}"`)
            // Reset right_ui to Automatic when entering Battle (unless it's a major trainer battle)
            if (newProp.value == "Battle" && this.automatic_post_battle_splits == true) {
                // Only reset if we're not currently showing splits for a major trainer
                // The split check happens below when 'From Battle' state is processed
                this.right_ui = "Automatic"
            }
            if (newProp.value != 'From Battle' || this.mapper.properties.battle.player.team[0].stats.hp.value == 0) { return }
            autosplitter_process()
            console.log('Autosplitter Attempted to Run')
            if (newProp.value == 'From Battle') {
                // console.log('Starting split log process')
                let trainer = this.mapper.properties.battle.opponent.name.value
                let id = this.mapper.properties.battle.opponent.id.value
                let gameName = 'Platinum'
                let game_name = 'Platinum'
                if (trainer == 'Pokemon Trainer -' || trainer == null || trainer == undefined) { return }
                if (this.mapper.properties.meta.game_name.value == 'HeartGold and SoulSilver') {
                    gameName = 'HGSS'
                    game_name = 'HeartGold and SoulSilver'
                }
                const splitFileName = this.getSplitFileName();

                //write full split data
                logData(gameName, this.full_data_str, this.attempt_number, splitFileName, "Full", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                
                //write deprecated split data
                // console.log("Autosplitter[this.game.gameName]:" + this.autosplitter[this.game.gameName])
                // console.log(this.autosplitter)
                // console.log("this.game:" + this.game)
                // console.log("this.game.gameName:" + this.game.gameName)
                // console.log("Trainer: " + trainer)
                if (this.autosplitter[this.game.gameName][trainer]) {
                    // console.log("Deprecated split attempted to be collected...")
                    logData(gameName, this.deprecated_data_str, this.attempt_number, splitFileName, "Deprecated", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                }
                
                //write simple split data
                const simpleSplit = () => {
                    log_split()
                    logData(gameName, this.simple_data_str, this.attempt_number, splitFileName, "Simple", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                    this.split_data.push(this.simple_data)
                    MyStorage["split_data"] = this.split_data
                    MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`] = {
                        ...MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`],
                        split_data: this.split_data
                    }
                    // Update current_splits so the split appears in the display
                    // simple_data format: [player_name, pokemon, trainer_name, real_time_hmmss, ...]
                    // current_splits format: [{trainer: ..., time: ...}, ...]
                    const trainerName = this.simple_data[2] // trainer_name is at index 2
                    const timeStr = this.simple_data[3]     // real_time_hmmss is at index 3
                    // For trainers that appear multiple times (Rival, Cyrus), always add as new entry
                    // For other trainers, update if exists, otherwise add new
                    if (trainerName === "Rival" || trainerName === "Cyrus") {
                        // Always add as new entry to track multiple instances
                        this.current_splits.push({trainer: trainerName, time: timeStr})
                    } else {
                        // Check if this trainer already exists in current_splits and update it, or add new
                        const existingIndex = this.current_splits.findIndex(s => s.trainer === trainerName)
                        if (existingIndex >= 0) {
                            this.current_splits[existingIndex].time = timeStr
                        } else {
                            this.current_splits.push({trainer: trainerName, time: timeStr})
                        }
                    }
                }
                if(this.game.splits.includes(trainer) && !this.game.finalBattle.includes(trainer)) {
                    // console.log("Simple split attempted to be collected...")
                    simpleSplit();
                    if (this.automatic_post_battle_splits == true) {
                        this.right_ui = "Splits"
                    }
                }
        
                if (this.game.champion.includes(trainer)) {
                    this.hallOfFameReset = true;
                    if (this.selected_game == "HeartGold and SoulSilver") {
                        this.kanto_badges = true;
                    }
                }

                //stop timer
                if (this.game.finalBattle.includes(trainer)) {
                    this.stopTime()
                    if (this.testRun == false) {
                        this.finished_run_count++
                    };
                    log_split();
                    
                    //use then so that logCopy doesn't touch any files until logData finishes
                    const splitFileName = this.getSplitFileName();
                    logData(gameName, this.simple_data_str, this.attempt_number, splitFileName, "Simple", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                    .then(() => {
                            // console.log("Run complete - moving attempt files to finished folder.")
                            logCopy(gameName, this.attempt_number, splitFileName, this.finished_run_count, this.evolution, splitFileName);
                        })
                        .catch(error => {
                            console.error("Error:", error);
                        });
                    this.split_data.push(this.simple_data)
                    MyStorage["split_data"] = this.split_data
                    MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`] = {
                        ...MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`],
                        split_data: this.split_data
                    }
                    // Update current_splits so the split appears in the display
                    // simple_data format: [player_name, pokemon, trainer_name, real_time_hmmss, ...]
                    // current_splits format: [{trainer: ..., time: ...}, ...]
                    const trainerName = this.simple_data[2] // trainer_name is at index 2
                    const timeStr = this.simple_data[3]     // real_time_hmmss is at index 3
                    // For trainers that appear multiple times (Rival, Cyrus), always add as new entry
                    // For other trainers, update if exists, otherwise add new
                    if (trainerName === "Rival" || trainerName === "Cyrus") {
                        // Always add as new entry to track multiple instances
                        this.current_splits.push({trainer: trainerName, time: timeStr})
                    } else {
                        // Check if this trainer already exists in current_splits and update it, or add new
                        const existingIndex = this.current_splits.findIndex(s => s.trainer === trainerName)
                        if (existingIndex >= 0) {
                            this.current_splits[existingIndex].time = timeStr
                        } else {
                            this.current_splits.push({trainer: trainerName, time: timeStr})
                        }
                    }
                    // console.log("Data transfer finished.")
                }
            }
        });

        this.mapper.properties.audio.save_sound.change(async (newProp, oldProp) => {
            if (this.mapper.properties.overworld.map_name.value == "Pokemon League - Map 16" && newProp.value == 36445048) { //magic number for Hall of Fame, may need to be updated with new versions of the patch
                const splitFileName = this.getSplitFileName();
                let gameName = 'Platinum'
                let game_name = 'Platinum'
                if (this.mapper.properties.meta.game_name.value == 'HeartGold and SoulSilver') {
                    gameName = 'HGSS'
                    game_name = 'HeartGold and SoulSilver'
                }
                
                autosplitter_process("Hall of Fame")
                    //write full split data
                logData(gameName, this.full_data_str, this.attempt_number, splitFileName, "Full", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                logData(gameName, this.deprecated_data_str, this.attempt_number, splitFileName, "Deprecated", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)

                //write simple split data
                const simpleSplit = () => {
                    log_split()
                    logData(gameName, this.simple_data_str, this.attempt_number, splitFileName, "Simple", this.testRun, this.scott_mode, this.evolution, splitFileName, this.refilming_mode)
                    this.split_data.push(this.simple_data)
                    MyStorage["split_data"] = this.split_data
                    MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`] = {
                        ...MyStorage[`${this.mapper.properties.meta.game_name.value}_${this.starter}`],
                        split_data: this.split_data
                    }
                    // Update current_splits so the split appears in the display
                    // simple_data format: [player_name, pokemon, trainer_name, real_time_hmmss, ...]
                    // current_splits format: [{trainer: ..., time: ...}, ...]
                    const trainerName = this.simple_data[2] // trainer_name is at index 2
                    const timeStr = this.simple_data[3]     // real_time_hmmss is at index 3
                    // For trainers that appear multiple times (Rival, Cyrus), always add as new entry
                    // For other trainers, update if exists, otherwise add new
                    if (trainerName === "Rival" || trainerName === "Cyrus") {
                        // Always add as new entry to track multiple instances
                        this.current_splits.push({trainer: trainerName, time: timeStr})
                    } else {
                        // Check if this trainer already exists in current_splits and update it, or add new
                        const existingIndex = this.current_splits.findIndex(s => s.trainer === trainerName)
                        if (existingIndex >= 0) {
                            this.current_splits[existingIndex].time = timeStr
                        } else {
                            this.current_splits.push({trainer: trainerName, time: timeStr})
                        }
                    }
                }
                simpleSplit()
            }
        });

        //EXP Bar Animation
        this.mapper.properties.player.team[0].exp.change(async (newProp, oldProp) => {
            // console.log("State - EXP Function 1", this.mapper.properties.meta.state.value, this.mapper.properties.player.team[0].exp.value)
            if (this.expBarAnimation == true) {
                // console.log("Exp Bar function got here (1)...")
                const species = this.mapper.properties.player.team[0].species.value ?? this.starter;
                const growthRate = this.g4PokemonData[species]?.growth_rate ?? this.g4PokemonData[this.starter].growth_rate;
                const expPoints = newProp.value;
                const newExpStats = this.calcExpStats(growthRate, expPoints);

                this.expBarState.species = species;
                this.expBarState.expPoints = expPoints;

                // console.log("exp changed", {species, growthRate, expPoints})

                this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
            }
        })
        this.mapper.properties.battle.player.active_pokemon.exp.change(async (newProp, oldProp) => {
            // console.log("State - EXP Function 2", this.mapper.properties.meta.state.value, this.mapper.properties.player.team[0].exp.value)
            if (this.mapper.properties.meta.state.value == "Battle") {
                if (this.expBarAnimation == true) {
                    // console.log("Exp Bar function got here (2)...")
                    const prevSpecies = this.expBarState.species;
                    const prevExpPoints = this.expBarState.expPoints;
                    const prevGrowthRate = this.g4PokemonData[prevSpecies].growth_rate;
                    const prevExpStats = this.calcExpStats(prevGrowthRate, prevExpPoints);

                    const newSpecies = this.mapper.properties.player.team[0].species.value;
                    const newExpPoints = newProp.value;
                    const newGrowthRate = this.g4PokemonData[newSpecies].growth_rate;
                    const newExpStats = this.calcExpStats(newGrowthRate, newExpPoints);

                    if (newExpPoints > 1640000) { return } // max exp is 1,640,000

                    this.expBarState.species = newSpecies;
                    this.expBarState.expPoints = newExpPoints;

                    // console.log("battle exp changed", 
                    //     {species: prevSpecies, expPoints: prevExpPoints, growthRate: prevGrowthRate},
                    //     {species: newSpecies, expPoints: newExpPoints, growthRate: newGrowthRate}
                    // )
                    
                    const animationMaxDuration = 500;
    
                    // did we switch out?
                    if (prevSpecies != newSpecies) {
                        // console.log("switched out");
                        // dont animate, just set newExpStats.percent
                        this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                    } 
                    // same pokemon but exp changed
                    else {
                        if (prevExpPoints == newExpPoints) { 
                            // console.log("exp unchanged", {prevExpPoints, newExpPoints});
                            return
                        }

                        if (prevExpStats.level == newExpStats.level) {
                            // console.log("same level", {prevExpStats, newExpStats});
                            let diffExp = newExpStats.percent - prevExpStats.percent
                            let animationDuration = Math.ceil(diffExp * animationMaxDuration)
                            // animate width to newExpStats.percent
                            this.$refs.expBar.style.transition = `width ${animationDuration}ms ease-in-out`;
                            this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                            await this.sleep(animationDuration + 50);
                        } else {
                            // console.log("level up", {prevExpStats, newExpStats});
                            let diffExp1 = 1 - prevExpStats.percent
                            let animationDuration1 = Math.ceil(diffExp1 * animationMaxDuration)
                            let diffExp2 = newExpStats.percent
                            let animationDuration2 = Math.ceil(diffExp2 * animationMaxDuration)
                            // animate width to 100%
                            this.$refs.expBar.style.transition = `width ${animationDuration1}ms ease-in`;
                            this.$refs.expBar.style.width = "100%";
                            await this.sleep(animationDuration1 + 50);
                            // dont animate, set width to 0%
                            this.$refs.expBar.style.transition = null;
                            this.$refs.expBar.style.width = "0%";
                            await this.sleep(50);
                            // animate width to newExpStats.percent
                            this.$refs.expBar.style.transition = `width ${animationDuration2}ms ease-out`;
                            this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                            await this.sleep(animationDuration2 + 50);
                        }
                    }
                    this.$refs.expBar.style.transition = null;
                }
            }
        })
        //keybinds
        keyhook.registerShortCut('F13', async () => { // Show IVs
            console.log("Key: F13 pressed: DVs displayed.")
            this.stats_setting = "IVs";
        });
        keyhook.registerShortCut('F14', async () => { // Show EVs
            console.log("Key: F14 pressed: Stat experience displayed.")
            if (this.stats_setting == "EVs") {
                this.stats_setting = "Detailed EVs";
                return
            }
            this.stats_setting = "EVs";
        });
        keyhook.registerShortCut('F15', async () => { // Show Base Stats
            console.log("Key: F15 pressed. Base Stats displayed.")
            this.stats_setting = "Base Stats";
        });
        keyhook.registerShortCut('F16', async () => { // Automatic
            console.log("Key: F16 pressed. Stats are displaying automatically now.")
            this.stats_setting = "Automatic";
        });

        keyhook.registerShortCut('F17', async () => { // Inventory
            console.log("Key: F17 pressed. Automatic battle graphics will be displayed.")
            this.right_panel = "Battle Graphic";
        });
        keyhook.registerShortCut('F18', async () => { // Trainer Graphic during Battle
            console.log("Key: F18 pressed. Inventory displayed.")
            this.right_panel = "Inventory";
        });
        keyhook.registerShortCut('F19', async () => { // Trainer Graphic during Battle
            console.log("Key: F19 pressed. Movepool displayed.")
            this.right_panel = "Movepool";
        });
        keyhook.registerShortCut('F20', async () => { // Trainer Graphic during Battle
            console.log(`Key: F20 pressed. Bonk counter displayed. (Bonk = ${this.bonk})`)
            this.bonk = !this.bonk;
        });



        //UNUSED F Keys
        keyhook.registerShortCut('F21', async () => { // Trainer Graphic during Battle
            console.log(`Key: F21 pressed. This shortcut is currently unused...`)
        });
        keyhook.registerShortCut('F22', async () => { // Trainer Graphic during Battle
            console.log(`Key: F22 pressed. This shortcut is currently unused...`)
        });



        keyhook.registerShortCut('F23', async () => { // Clear Timer and Metrics
            this.newRun()
        });
        keyhook.registerShortCut('F24', async () => { // Pause
            this.pauseUnpauseTime()
        });
    },
}).mount('#app')