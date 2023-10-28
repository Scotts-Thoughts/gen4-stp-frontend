//TODO Overlay
//TODO Graphics
// 4) Exp bar bottom right corner
//TODO GameHook
// 2) Do a test run to verify that everything is working as intended
//TODO Debugging
// 1) Fix an issue where the solo Pokemon stats are glitched following a successful battle
// 2) Fix an issue where the enemy Pokemon stats are glitched when the screen transitions back to the overworld
//TODO Setup

const app = Vue.createApp({
    data() {
        return {
            ready: false,
            mapper: null,
            state: "No Pokemon",

            // POKEMON CONFIG (components) ---------------------------------------------------------------------//
            starter: "Torterra",
            overlayName: "",
            growth_rate: "Medium Slow",
            hidden_power_type: "Dark",

            // USER CONFIG (components) ------------------------------------------------------------------------// 
            typeCalcs: true,

            //CSS styling values
            statLabelOpacityValue: 0.1, //used when a stage modifier is applied

            //DATA ---------------------------------------------------------------------------------------------//
            g4MoveData: g4MoveData,
            g4tmhmMapping: g4tmhmMapping,
            g4PokemonData: g4PokemonData,
            stageModifiersData: stageModifiersData,
            typeEffectivenessArray: typeEffectivenessArray,
            typeData: typeData,
            typeBoostingItems: typeBoostingItems,
            platinumTrainers: platinumTrainers,
            hiddenPowerTypes: hiddenPowerTypes,
            natures: natures,

            //LOOPS
            badges: ["badge1","badge2","badge3","badge4","badge5","badge6","badge7","badge8",],
            badgeBoosts: ["badge1", "badge3", "badge5", "badge7"],
            moves: ["move1","move2","move3","move4",],
            pkmnSlots: [0, 1, 2, 3, 4, 5],

            //VARIABLES THAT TRACK IN GAME PROGRESS ------------------------------------------------------------//
            playerId: -1,
            resets:   0,
            trainerBattles: 0,
            wildEncounters: 0,

            //STATE MANAGEMENT ---------------------------------------------------------------------------------//
            gameStarted:  true, //tracks if the player has a save game or not
            playerID: 999,
            prevSpecies: undefined,
            prevExpPoints: 0,
            expDebounceTimeoutId: -1,
            expBarAnimation: true,
            slotTimingFix: false,
            enemyModColour: [0, "background: #d84444;"],
            enemyState: "Pokemon",
            field_array: ["Reflect", 0],
            last_initiated_field_effect: "Reflect",
        }
    },
    computed: {
        battlePokemonCrop() {
            const totalPokemon = this.mapper.properties.battle.opponentA.teamCount.value;
            const heights = {
              1: "233px",
              2: "399px",
              3: "566px",
              4: "733px",
              5: "898px",
              6: "1080px"
            };
            return `height: ${heights[totalPokemon]};`;
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
            if (this.mapper.properties.battle.opponentA) {
                return this.mapper.properties.battle.opponentA
            }
        },
        oppB() {
            if (this.mapper.properties.battle.opponentB) {
                return this.mapper.properties.battle.opponentB
            }
        },
        ally() {
            if (this.mapper.properties.battle.ally) {
                return this.mapper.properties.battle.ally
            }
        },
        trainerData() {
            if (this.mapper.properties.meta.gameName.value == "Platinum") { return this.platinumTrainers }
            else if (this.mapper.meta.gameName == "HeartGold and SoulSilver") { return }
            else { return }
        },
        solo_mon() {
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper?.properties?.battle?.player?.activePokemon
            }
            else if (this.mapper.properties.meta.state.value == `No Pokemon` || this.mapper?.properties?.player?.team[0]?.species?.value == null || this.mapper?.properties?.battle?.player?.teamCount?.value == 0) {
                // var data = this.dexDataRubySapphireEmerald[this.starterString]
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
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper.properties.battle.player.activePokemon.moves
            }
            if (this.mapper.properties.meta.state.value == `Overworld`) {
                return this.mapper.properties.player.team[0].moves
            }
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return
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
            return this.remakeTrainers[this.mapper.properties.battle.trainer.opponentId.value]
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
            return this.mapper?.properties?.battle?.enemyPokemon
        },
        s1dynamic() {
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper?.properties?.battle?.yourPokemon
            }
            else {
                return this.mapper?.properties?.player?.team[0]
            }
        },
        typeHeaderColor() {
            return
            // if (this.mapper.properties.meta.state.value == `Battle`) { return this.mapper.properties.battle.yourPokemon.type2.value }
            // if (this.mapper.properties.meta.state.value == `Overworld`) { return this.dexDataRubySapphireEmerald[this.mapper.properties.player.team[0].species.value].type_2 }
            // if (this.mapper.properties.meta.state.value == `No Pokemon`) { return this.dexDataRubySapphireEmerald[this.starterString].type_2}
            // else { return }
            // else { return this.dexDataRubySapphireEmerald[this.starterString].type_2}
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
                fieldArray[5] = this.batt.field.weatherCount.value
                fieldArray[6] = true
            }
            if (this.batt.field.player.statusReflect.value == true) {
                fieldArray[2] = "Reflect"
                fieldArray[3] = this.batt.field.player.reflectCount.value
                fieldArray[6] = true
            }
            if (this.batt.field.player.statusLightScreen.value == true) {
                fieldArray[0] = "Light Screen"
                fieldArray[1] = this.batt.field.player.lightScreenCount.value
                fieldArray[6] = true
            }
            return fieldArray
        },
        //SELECT THE RELEVANT FIELD MOVE
        field_selector() {
            var reflect = [this.batt.field.player?.reflectCount?.value, this.batt.field?.player?.statusReflect?.value, "Reflect"]
            var lightscreen = [this.batt.field?.player?.lightScreenCount?.value, this.batt.field?.player?.statusLightScreen?.value, "Light Screen"]
            var safeguard = [this.batt.field?.player?.safeguardCount?.value, this.batt.field?.player?.statusSafeguard?.value, "Safeguard"]
            var weather = [this.batt.field?.weatherCount?.value, this.weather_boolean, this.pascalCaseSpace(this.capitalization_format(this.batt.field?.weather?.value?.toLowerCase()))]
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
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_MEDIUM_SLOW`) { return "Medium Slow" }
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_MEDIUM_FAST`) { return "Medium Fast" }
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_SLOW`) { return "Slow" }
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_FAST`) { return "Fast" }
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_FLUCTUATING`) { return "Fluctuating" }
            if (this.dexDataRubySapphireEmerald[this.starterString].growth_rate == `GROWTH_ERRATIC`) { return "Erratic" }
        },
        field_effect_array() {
            var effect_array = [
                ["Reflect", false, 0,],
                ["Light Screen", false, 0,],
                ["Safeguard", false, 0,],
                [this.mapper.properties.battle.field.weather.value, false, 0,],
            ]
            if (this.mapper.properties.meta.state.value == `Battle`) {
                effect_array[0][1] = this.batt.field.player.statusReflect?.value
                effect_array[0][2] = this.batt.field.player.reflectCount?.value
                effect_array[1][1] = this.batt.field.player.statusLightScreen?.value
                effect_array[1][2] = this.batt.field.player.lightScreenCount?.value
                effect_array[2][1] = this.batt.field.player.statusSafeguard?.value
                effect_array[2][2] = this.batt.field.player.safeguardCount?.value
                effect_array[3][1] = this.batt.field.weather?.value
                effect_array[3][2] = this.batt.field.weatherCount?.value
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
            let evHp = this.mapper.properties.player.team[0].evs.hp.value
            let evAtk = this.mapper.properties.player.team[0].evs.attack.value
            let evDef = this.mapper.properties.player.team[0].evs.defense.value
            let evSpe = this.mapper.properties.player.team[0].evs.speed.value
            let evSpA = this.mapper.properties.player.team[0].evs.specialAttack.value
            let evSpD = this.mapper.properties.player.team[0].evs.specialDefense.value
            let sum = evHp + evAtk + evDef + evSpe + evSpA + evSpD
            return {
                totalEvs: sum,
                maximumEvs: 510,
                remaining: 510 - sum,
                percentage: this.decimalToPercentage(sum/510)
            }
        },
    },
    methods: { 
        enemyFaint(slotIndex) {
            let fainted = false
            if (this.mapper.properties.battle.opponentA.updatingTeam[slotIndex].stats.hp.value == 0) {
                fainted = true
            }
            if (fainted == true) {
                return "opacity: .35; filter: grayscale(100%);"
            }
            else {
                return
            }
        },
        getTrainerGraphic() {
            if (this.mapper.properties.meta.state == `Battle`) {
                let graphic = `images/trainers/roark.png`
                let trainer = this.mapper.properties.battle.opponentA.trainer.value
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
                }
                return {
                    state: true,
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
            pid = this.mapper.properties.player.team[0].internals.personalityValue
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return ""
            }
            else {
                return this.getNature(pid)
            }
        },
        getSoloFriendship() {
            friendship = this.mapper.properties.player.team[0].friendship.value
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return ""
            }
            else {
                return friendship + "/255"
            }
        },
        statusConditionConverter(statusCondition) {
            if (statusCondition) {
                if (this.mapper.properties.meta.generation.value == 1) {
                    return
                }
                if (this.mapper.properties.meta.generation.value == 2) {
                    return
                }
                if (this.mapper.properties.meta.generation.value == 3) {
                    return
                }
                if (this.mapper.properties.meta.generation.value == 4) {
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
        getMoveCategory(category) {
            if (category == "Physical") { return [category, "Physical"] }
            if (category == "Special") { return [category, "Special"] }
            if (category == "Status") { return [category, "Status"] }
        },
        getStat(stat) { //stat = the name of the stat ie. "hp", "attack", "defense", etc.
            let currentStat = 0
            if (this.mapper.properties.meta.state.value == `Battle` && this.mapper.properties.battle.outcome.value == 0) {
                currentStat = this.mapper?.properties?.battle?.player?.activePokemon?.stats[stat].value
                modifier = this.mapper?.properties?.battle?.player?.activePokemon?.modifiers[stat].value
                stageModification = this.stageModifiersData.stats[modifier]
                return Math.floor(currentStat * stageModification)
            }
            else if (this.mapper.properties.meta.state.value == `No Pokemon` || this.mapper?.properties?.player?.team[0]?.species?.value == null || this.mapper?.properties?.battle?.player?.teamCount?.value == 0) {
                // return this.g4PokemonData.stats[stat]
            }
            else {
                return this.mapper?.properties?.player?.team[0].stats[stat]
            }
        },
        getEnemyStat(statName, statValue, slotIndex) { //stat = the name of the stat ie. "hp", "attack", "defense", etc.
            let currentStat = 0
            if (this.mapper.properties.meta.state.value == `Battle` && this.mapper.properties.battle.opponentA.partyPos == slotIndex) {
                currentStat = this.mapper?.properties?.battle?.opponentA?.team[slotIndex].stats[statName].value
                modifier = this.mapper?.properties?.battle?.opponentA?.activePokemon?.modifiers[statName].value
                stageModification = this.stageModifiersData.stats[modifier]
                return Math.floor(currentStat * stageModification)
            }
            else {
                return this.mapper?.properties?.battle?.opponentA?.team[slotIndex].stats[statName].value
            }
        },
        enemyMove(slot, moveNumber) {
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper.properties.battle.opponentA.team[slot].moves[moveNumber].move.value
            }
            else {
                return
            }
        },
        getMove(moveNumber) {
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return
            }
            if (this.mapper.properties.meta.state.value == `Battle`) {
                // return this.mapper.properties.battle.player.activePokemon?.moves[moveNumber]?.move?.value
                return this.mapper.properties.battle.player.activePokemon?.moves[moveNumber - 1]?.move.value
            }
            if (this.mapper.properties.meta.state.value == `Overworld`) {
                // return this.mapper.properties.player.team[0]?.moves["move" + moveNumber]?.move.value
                return this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.move.value
            }
        },
        getPP(moveNumber) {
            if (this.mapper.properties.meta.state.value == `No Pokemon`) {
                return
            }
            if (this.mapper.properties.meta.state.value == `Battle`) {
                return this.mapper.properties.battle.player.activePokemon?.moves[moveNumber - 1]?.pp.value
            }
            if (this.mapper.properties.meta.state.value == `Overworld`) {
                return this.mapper.properties.player.team[0]?.moves[moveNumber - 1]?.pp.value
            }
        },
        getMoveProperty(move, property) {
            if (move) {
                return this.g4MoveData[move][property]
            }
        },
        getSoloMonType(pkmn, type) { //type == type_1 or type_2
            if (this.mapper.properties.meta?.stateEnemy?.value == `Battle Finished`) {
                return this.g4PokemonData[pkmn][type]
            }
            if (this.mapper.properties.battle.outcome.value > 0) {
                return this.g4PokemonData[pkmn][type]
            }
            if (this.mapper.properties.meta.state.value == `Battle` && this.mapper.properties.battle.outcome.value == 0) {
                typeString = "type1"
                if (type == "type_2") {
                    typeString = "type2"
                    return this.mapper.properties.battle?.player?.activePokemon[typeString]?.value
                }
                return this.mapper.properties.battle?.player?.activePokemon[typeString]?.value
            }
            if (this.mapper.properties.meta?.state?.value == `No Pokemon` || this.mapper.properties.meta?.state?.value == `Overworld`) {
                return this.g4PokemonData[pkmn][type]
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
                return this.mapper?.properties?.battle?.enemyPokemon
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
                level: pkmn.levelup_moveset.map(x => {
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
                // tutor: pkmn.tutor_learnset.map(x => {
                //     return this.dataSearch(moveData, x)
                // }),    
                // egg: pkmn.egg_moves.map(x => {
                //     return this.dataSearch(moveData, x)
                // }),    
            }
            return obj
        }, 
        
        // MOVE ACCURACY
        getAccuracy(accuracy) {
            if (accuracy == `-`) {
                return `-`
            }
            if (accuracy == `—`) {
                return `—`
            }
            if (this.mapper.properties.meta.state.value == `Battle`) {
                let playerStage = this.mapper.properties.battle.player.activePokemon.modifiers.accuracy?.value.toString()
                let oppAStage = this.mapper.properties.battle.opponentA.activePokemon.modifiers.accuracy?.value.toString()
                let accuracyModifier = this.stageModifiersData["accuracy"][playerStage]
                let evasionModifier = this.stageModifiersData["evasion"][oppAStage]
                return Math.floor(accuracy * accuracyModifier * evasionModifier)
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
            var userType1 = userPkmnData.type1.value
            var userType2 = userPkmnData.type2.value
            
            var targetDefense = targetPkmnData.defense.value
            var targetSpecial = targetPkmnData.special.value
            var targetMaxHp = targetPkmnData.maxHp.value
            var targetType1 = targetPkmnData.type1.value
            var targetType2 = targetPkmnData.type2.value
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
                defenderScreen = targetPkmnData.effects.lightScreen.value
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
        speedComparison(playerPkmnData, enemyPkmnData) {
            var playerSpeed = playerPkmnData.speed.value
            var enemySpeed = enemyPkmnData.speed.value
            if (playerSpeed > enemySpeed) {
                return "Outspeeds"
            }
            if (playerSpeed == enemySpeed) {
                return "Speed-Tied"
            }
            if (playerSpeed < enemySpeed) {
                return "Underspeeds"
            }
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
            (pkmnData.status1.value == "Burned" || pkmnData.status1.value == "Paralyzed" || pkmnData.status1.value == "Poisoned" || pkmnData.status1.value == "Badly Poisoned" || pkmnData.status1.value == "Badly Posioned")) {
                mod_ability = 1.5 
            }
            //Marvel Scale
            if (pkmnData.ability?.value.toLowerCase() == "marvel scale" && statLabel == "defense" && pkmnData.status1.value != null) {
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
            if (this.s1.statusCondition.value == `Paralyzed`) {
                return Math.floor(speed * 0.25)
            }
            else {
                return speed
            }
        },
        martSelector() {
            if (this.mapper.properties.overworld.mapName.value == "CELADON_CITY - DEPARTMENT_STORE_5F") { return "EVs"}
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
            else if (ability == `Marvel Scale` && this.s1.statusCondition.value != null && statname == `defense`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Chlorophyll` && this.batt.turnInfo.battleWeather.value == `Sun` && statname == `speed`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Swift Swin` && this.batt.turnInfo.battleWeather.value == `Rain` && statname == `speed`) {
                return Math.floor(statValue * 1.5)
            }
            else if (ability == `Guts` && statname == `attack` && (this.s1.statusCondition.value == "Paralyzed" || this.s1.statusCondition.value == "Poisoned" || this.s1.statusCondition.value == "Burned")) {
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
                var type = this.dexDataRubySapphireEmerald[this.starterString].type_1
                return `images/elements/types/${type.toLowerCase()}.png`
        },
        getStarterType2() {
            if (this.pick == true)
                var type = this.dexDataRubySapphireEmerald[this.starterString].type_2
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
            level = this.mapper.properties.battle.yourPokemon.level.value
            attack = this.mapper.properties.battle.yourPokemon.attack.value
            defense = this.mapper.properties.battle.enemyPokemon.defense.value
            specialA = this.mapper.properties.battle.yourPokemon.special.value
            specialD = this.mapper.properties.battle.enemyPokemon.special.value
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
            var growthRate = this.dexDataRubySapphireEmerald[this.starterString].growth_rate
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
                return this.dexDataRubySapphireEmerald[starterString].growth_rate
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
            return {
                level: index,
                percent: (exp - currLvlExp) / (nextLvlExp - currLvlExp),
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
                var move = this.g4MoveData[y]
                if (y == "Return") {
                    if (this.mapper.properties.player.team[0].friendship.value < 2.5)
                        var friendshipValue = 2.5 
                    else 
                        var friendshipValue = this.mapper.properties.player.team[0].friendship.value
                    var specialMovePower = Math.floor(friendshipValue/2.5)
                    return specialMovePower
                }
                else if (y == "Flail" || y == "Reversal") {
                    var hpPercentage = this.mapper.properties.player.team[0].hp.value / this.mapper.properties.player.team[0].maxHp.value
                    if (hpPercentage >= .6875) { return 20 }
                    else if (hpPercentage >= .3542 && hpPercentage < .6875) { return 40 }
                    else if (hpPercentage >= .2083 && hpPercentage < .3542) { return 80 }
                    else if (hpPercentage >= .1042 && hpPercentage < .2083) { return 100 }
                    else if (hpPercentage >= .0417 && hpPercentage < .1042) { return 150 }
                    else if (hpPercentage < .0417) { return 200 }
                }
                else if (y == "Water Spout" || y == "Eruption") {
                    var power = (150 * this.mapper.properties.player.team[0].hp.value) / this.mapper.properties.player.team[0].maxHp.value
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
                    var specialMovePower = Math.floor(255-friendshipValue/2.5)
                    return specialMovePower
                }
                else if (y == "Low Kick") {
                    if (this.mapper.properties.meta.state.value == `Overworld` || this.mapper.properties.meta.state.value == `To Battle`) { return `-`}
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight < 10) { return 20 }
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight < 25) { return 40 }
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight < 50) { return 60 }
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight < 100) { return 80 }
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight < 200) { return 100 }
                    if (this.dexDataRubySapphireEmerald[this.batt.enemyPokemon.species.value]?.weight >= 200) { return 120 }
                }
                else if (y == "Hidden Power") {
                    return this.hiddenPowerPowerCalc(this.mapper.properties.player.team[0])
                }
                else if (y == "Facade" && (this.s1.statusCondition.value == "Paralyzed" || this.s1.statusCondition.value == "Poisoned" || this.s1.statusCondition.value == "Burned")) {
                    return move.Power * 2
                }
                else
                    if (move) return move.Power
            }
            return null
        },
        moveCategory(move) { //move = move.value
            if (move) {
                var move = this.g4MoveData[move]
                if (move) return move.Category
            }
            return ""
        },
        moveCategoryIcon(move) { //move = move.value
            if (move) {
                var move = this.g4MoveData[move]
                if (move) return `images/damageCategory/${move.Category.toLowerCase()}.png`
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
                if (this.mapper.properties.battle.player.teamCount.value == 0) {
                    return "-"
                }
                return this.g3ReturnPowerCalc(this.mapper.properties.player.team[0])
            }
            if (moveObject.Move == `Frustration`) {
                if (this.mapper.properties.battle.player.teamCount.value == 0) {
                    return "-"
                }
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
                if (this.batt.turnInfo.battleWeather.value == `Sun`) {
                    return "Fire" }
                if (this.batt.turnInfo.battleWeather.value == `Sandstorm`) {
                    return "Rock" }
                if (this.batt.turnInfo.battleWeather.value == `Rain`) {
                    return "Water" }
                if (this.batt.turnInfo.battleWeather.value == `Hail`) {
                    return "Ice" }
                return "Normal"
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
                if (this.batt.turnInfo.battleWeather.value == `Sun`) {
                    moveType = "Fire" }
                if (this.batt.turnInfo.battleWeather.value == `Sandstorm`) {
                    moveType = "Rock" }
                if (this.batt.turnInfo.battleWeather.value == `Rain`) {
                    moveType = "Water" }
                if (this.batt.turnInfo.battleWeather.value == `Hail`) {
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
        statLabelOpacity(modifier) {
            if (this.mapper.properties.player.team[0].internals.personalityValue.value == null)
                return
            else if (this.mapper.properties.meta.state.value == "Battle")
                if (modifier.value != 0)
                    return `opacity: ${this.statLabelOpacityValue};`
            else
                return
        },
        enemyStatLabelOpacity(modifier, slot) {
            if (this.mapper.properties.battle.opponentA.partyPos.value == slot) {
                if (this.mapper.properties.battle.opponentA.team[0].internals.personalityValue.value == null)
                    return
                else if (this.mapper.properties.meta.state.value == "Battle") {
                    if (modifier.value != 0)
                        return `opacity: ${this.statLabelOpacityValue};`
                }
            }
            else
                return
        },
        enemyStatusLabelOpacity(status, slot) {
            if (this.mapper.properties.battle.opponentA.partyPos.value == slot) {
                if (this.mapper.properties.battle.opponentA.team[0].internals.personalityValue.value == null)
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
                case "hp": return getBits(fourByteIvBlock, 0, 5);
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
            let ivHpBit = 0 
            let ivAtkBit = 0
            let ivDefBit = 0
            let ivSpeBit = 0
            let ivSpABit = 0
            let ivSpDBit = 0
            if (slot.ivs.ivEggAbilityBlock) {
                ivHpBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "hp")
                ivAtkBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "atk")
                ivDefBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "def")
                ivSpeBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spe")
                ivSpABit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spa")
                ivSpDBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spd")
            }
            else {
                ivHpBit = slot.ivs.hp.value 
                ivAtkBit = slot.ivs.attack.value
                ivDefBit = slot.ivs.defense.value
                ivSpeBit = slot.ivs.speed.value
                ivSpABit = slot.ivs.specialAttack.value
                ivSpDBit = slot.ivs.specialDefense.value
            }
            ivHpBit = this.getLSB(ivHpBit) 
            ivAtkBit = this.getLSB(ivAtkBit) 
            ivDefBit = this.getLSB(ivDefBit)
            ivSpeBit = this.getLSB(ivSpeBit) 
            ivSpABit = this.getLSB(ivSpABit) 
            ivSpDBit = this.getLSB(ivSpDBit) 
            type = this.hiddenPowerTypes[(Math.floor(((ivHpBit + (2 * ivAtkBit) + (4 * ivDefBit) + (8 * ivSpeBit) + (16 * ivSpABit) + (32 * ivSpDBit)) * 5)/21))]
            return type
        },
        hiddenPowerPowerCalc(slot) {
            let ivHpBit = 0 
            let ivAtkBit = 0
            let ivDefBit = 0
            let ivSpeBit = 0
            let ivSpABit = 0
            let ivSpDBit = 0
            if (slot.ivs.ivEggAbilityBlock) {
                ivHpBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "hp")
                ivAtkBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "atk")
                ivDefBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "def")
                ivSpeBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spe")
                ivSpABit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spa")
                ivSpDBit = this.ivparser(slot.ivs.ivEggAbilityBlock.value, "spd")
            }
            else {
                ivHpBit = slot.ivs.hp.value 
                ivAtkBit = slot.ives.attack.value
                ivDefBit = slot.ives.defense.value
                ivSpeBit = slot.ives.speed.value
                ivSpABit = slot.ives.specialAttack.value
                ivSpDBit = slot.ives.specialDefense.value
            }
            ivHpBit = this.getSecondLSB(ivHpBit) 
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
            var moveType = this.moveType(x)
            if (pkmnType1 == moveType || pkmnType2 == moveType)
                return 1.5
            else
                return 1
        }, 
        determineItemBoost(x) { //x - move1.value
            var heldItemValue = this.mapper.properties.player.team[0].heldItem.value
            var itemType = this.typeBoostingItems[heldItemValue]
            if (itemType == this.moveType(x)) {
                return 1.2
            }
            else   
                return 1
        },
        abilityModifier(ability, attackingType) {
            var healthPercentage = this.mapper.properties.battle.player.activePokemon.stats.hp / this.mapper.properties.battle.player.activePokemon.stats.maxHp
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
            var attackingCategory = this.moveCategory(x)
            if (attackingCategory == "Physical" && this.solo_mon.statusCondition.value == `Burned` && this.mapper.properties.player.team[0].ability.value != `Guts`) {
                return 0.5
                }
            else {
                return 1
            }
        },

        typeEffectiveness(x) { //x = move1.value
            if (x == "Curse") {
                return "—"
            }
            if (x == null || x == undefined) {
                return
            }
            var attackingType = this.moveType(x)
            var power = this.movePower(x)
            var defendingType1 = this.mapper.properties.battle.opponentA.activePokemon.type1.value
            var defendingType2 = this.mapper.properties.battle.opponentA.activePokemon.type2.value
            var defendingType1Effectiveness = 1
            var defendingType2Effectiveness = 1
            var defendingType1Effectiveness = this.typeEffectivenessArray[attackingType]
            if (defendingType1 && attackingType) {
                var defendingType1Effectiveness = this.typeEffectivenessArray[attackingType][defendingType1]
            }
            if (defendingType2 && attackingType && (defendingType1 != defendingType2)) {
                var defendingType2Effectiveness = this.typeEffectivenessArray[attackingType][defendingType2]
            }
            var stabModifier = this.determineSTAB(x)
            var ability = this.abilityModifier(this.mapper.properties.player.team[0].ability.value, attackingType)
            var itemBoost = this.determineItemBoost(x)
            var weatherBoost = this.weatherModifier(this.mapper.properties.battle.weather.weather.value, x, this.moveType(x))
            var burnModifier = this.burnModifier(x)
            if (this.typeCalcs == true && this.mapper.properties.meta.state.value == "Battle") { //Handles type effectiveness calculations in battle
                if (power == "—") { return power }
                return Math.floor(power * stabModifier * defendingType1Effectiveness * defendingType2Effectiveness * ability * itemBoost * weatherBoost * burnModifier)

            }
            else //handles out of battle cases
                if (power == "—") { return power }
                else 
                    return Math.floor(power * stabModifier * ability * itemBoost * burnModifier)
        },
    },
    

//--------- PROGRAM MOUNTED ---------------------------------------------------------------------------------------------------------------//
    mounted: async function () {
        const that = this
        this.mapper = new GameHookMapperClient()
        this.mapper.onConnected = (x) => this.ready = true
        this.mapper.onDisconnected = (x) => this.ready = false
        await this.mapper.connect()

        //EXP BAR ANIMATION FUNCTION
        var species = this.mapper.properties.player.team[0].species.value??this.starter;
        var growthRate = this.g4PokemonData[this.starter].growth_rate;
        var expStats = this.calcExpStats(growthRate, this.mapper.properties.player.team[0].expPoints.value);
        this.$refs.expBar.style.width = (expStats.percent * 100) + "%";
        this.prevSpecies = species

        this.mapper.properties.player.team[0].expPoints.change(async (newProp, oldProp) => {
            if (this.expBarAnimation == true) {
                const currSpecies = this.mapper.properties.player.team[0].species.value;
                const oldExpStats = this.calcExpStats(growthRate, oldProp.value);
                const newExpStats = this.calcExpStats(growthRate, newProp.value);
                const animationMaxDuration = 500
                var animationDuration = 200
                debugger

                if (oldProp.value == newProp.value) { return }
                // did we switch out?
                // there is still a bug here. what if we changed to the same species?
                if (this.mapper.properties.meta.state.value == `Overworld` || this.mapper.properties.meta.state.value == "No Pokemon") {
                    this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                    // console.log((newExpStats.percent * 100) + "%")
                }
                else if (this.prevSpecies != currSpecies) {
                    // update prevSpecies

                    this.prevSpecies = currSpecies; 
                    // dont animate, just set newExpStats.percent
                    this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                } 
                // same pokemon but exp changed
                else {
                    var diffExp1 = 1 - oldExpStats.percent
                    var animationDuration = Math.ceil(diffExp1 * animationMaxDuration)
                    if (oldExpStats.level == newExpStats.level) {
                        // animate width to newExpStats.percent
                        this.$refs.expBar.style.transition = `width ${animationDuration}ms ease-in-out`;
                        this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                        await this.sleep(250);
                    } else {
                        // animate width to 100%
                        this.$refs.expBar.style.transition = `width ${animationDuration}ms ease-in`;
                        this.$refs.expBar.style.width = "100%";
                        await this.sleep(250);
                        // dont animate, set width to 0%
                        this.$refs.expBar.style.transition = null;
                        this.$refs.expBar.style.width = "0%";
                    }
                }
                this.$refs.expBar.style.transition = null;
            }
        })
        this.mapper.properties.battle.player.activePokemon.expPoints.change(async (newProp, oldProp) => {
            if (this.expBarAnimation == true) {
                const currSpecies = this.mapper.properties.player.team[0].species.value;
                const oldExpStats = this.calcExpStats(growthRate, oldProp.value);
                const newExpStats = this.calcExpStats(growthRate, newProp.value);
                const animationMaxDuration = 500
                var animationDuration = 200
                debugger

                if (oldProp.value == newProp.value) { return }
                // did we switch out?
                // there is still a bug here. what if we changed to the same species?
                if (this.mapper.properties.meta.state.value == `Overworld` || this.mapper.properties.meta.state.value == "No Pokemon") {
                    this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                    // console.log((newExpStats.percent * 100) + "%")
                }
                else if (this.prevSpecies != currSpecies) {
                    // update prevSpecies

                    this.prevSpecies = currSpecies; 
                    // dont animate, just set newExpStats.percent
                    this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                } 
                // same pokemon but exp changed
                else {
                    var diffExp1 = 1 - oldExpStats.percent
                    var animationDuration = Math.ceil(diffExp1 * animationMaxDuration)
                    if (oldExpStats.level == newExpStats.level) {
                        // animate width to newExpStats.percent
                        this.$refs.expBar.style.transition = `width ${animationDuration}ms ease-in-out`;
                        this.$refs.expBar.style.width = (newExpStats.percent * 100) + "%";
                        await this.sleep(250);
                    } else {
                        // animate width to 100%
                        this.$refs.expBar.style.transition = `width ${animationDuration}ms ease-in`;
                        this.$refs.expBar.style.width = "100%";
                        await this.sleep(250);
                        // dont animate, set width to 0%
                        this.$refs.expBar.style.transition = null;
                        this.$refs.expBar.style.width = "0%";
                    }
                }
                this.$refs.expBar.style.transition = null;
            }
        })
    },
}).mount('#app')