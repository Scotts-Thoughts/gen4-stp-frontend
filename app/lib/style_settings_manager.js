/**
 * Style Settings Manager
 * 
 * Handles layered storage for Pokemon style settings:
 * - Default settings (ship with the app, stored in default_style_settings.js)
 * - User settings (stored in localStorage, override defaults)
 * 
 * In DEV mode: Style changes are saved to the defaults file
 * In PROD mode: Style changes are saved to localStorage as user overrides
 */

const fs = require('fs');
const path = require('path');

class StyleSettingsManager {
    constructor() {
        // Detect if running in development mode
        // In Electron, we can check if we're running from source vs packaged app
        this.isDev = this._detectDevMode();
        
        // Path to the default settings file
        this.defaultSettingsPath = path.join(__dirname, 'default_style_settings.js');
        
        // Load default settings
        this.defaultSettings = this._loadDefaultSettings();
        
        // Cache for user settings (loaded from localStorage)
        this.userSettingsCache = {};
        
        // List of style property keys that should use the layered system
        this.stylePropertyKeys = [
            'overlay_color',
            'ui_saturation',
            'imageXOffset',
            'imageYOffset',
            'imageScale',
            'imageFlip',
            'imageSat',
            'imageRotation',
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
            'backgroundSaturation',
            'pkmnNature',
            'pkmn_ability',
            'pkmn_gender',
            'hidden_power_type',
            'hidden_power_index',
            'frame'
        ];

        // The defaults as they are on disk, serialized the way _writeDefaultsFile writes them.
        // A write that would not change them is skipped (the split save at the end of every key
        // battle passes the same style values back in), and prod-mode user overrides are diffed
        // against them rather than against the in-memory defaults, which callers can mutate
        // through the object get() hands out.
        this._persistedJson = this._serializeDefaults();
        this._persistedDefaults = JSON.parse(this._persistedJson);

        // Defaults-file writer state
        this._writeTimer = null;
        this._writeInFlight = null;
        this._writeQueued = false;
        this._unloadHandlerRegistered = false;
        this._unloadFlushed = false;
    }
    
    /**
     * Detect if running in development mode
     */
    _detectDevMode() {
        try {
            // Check multiple indicators for dev mode
            let isPackaged = false;
            
            // 1. Try to get isPackaged from electron (works in main process)
            try {
                const { app } = require('@electron/remote') || require('electron');
                isPackaged = app?.isPackaged ?? false;
            } catch (e) {
                // If we can't access electron app, try other methods
            }
            
            // 2. Check NODE_ENV
            const nodeEnvDev = process.env.NODE_ENV === 'development';
            
            // 3. Check if running from node_modules/.bin/electron (common in dev)
            const execPath = process.execPath || '';
            const runningFromNodeModules = execPath.includes('node_modules');
            
            // 4. Check if we're in an asar archive (packaged apps use asar)
            const inAsar = __dirname.includes('.asar');
            
            // 5. Check for electron-builder's build artifacts
            const hasResourcesFolder = fs.existsSync(path.join(__dirname, '..', '..', 'resources'));
            
            // In dev mode if:
            // - NOT packaged OR
            // - Explicitly set to development OR  
            // - Running from node_modules (dev mode) OR
            // - NOT in an asar archive (dev mode doesn't package to asar)
            const isDev = !isPackaged || nodeEnvDev || runningFromNodeModules || !inAsar;

            return isDev;
        } catch (e) {
            // If we can't detect, default to production mode for safety
            console.warn('[StyleSettingsManager] Could not detect dev mode, defaulting to production:', e.message);
            return false;
        }
    }
    
    /**
     * Load default settings from the JS file
     */
    _loadDefaultSettings() {
        try {
            // Clear require cache to get fresh settings
            delete require.cache[require.resolve('./default_style_settings.js')];
            return require('./default_style_settings.js');
        } catch (e) {
            console.warn('[StyleSettingsManager] Could not load default settings:', e.message);
            return {};
        }
    }
    
    /**
     * Check if a storage key is for style settings (game_species format)
     */
    isStyleSettingsKey(key) {
        // Style settings keys follow the pattern:
        // "GameName_Species" (e.g., "Platinum_Chimchar")
        // "GameName_FullyEvolved-line-Species" (e.g., "Platinum_Infernape-line-Chimchar")
        // "FullyEvolved-line" (e.g., "Infernape-line") for family settings
        
        // Exclude known non-style keys
        const nonStyleKeys = [
            'starter', 'selected_game', 'playerName', 'playerId', 'playerResets',
            'blackout_counter', 'simple_data_str', 'full_data_str', 'deprecated_data_str',
            'simple_data', 'timer_startTimeOffset', 'timer_startTime', 'timer_pause',
            'timer_formatted_time', 'timer_pause_time', 'time_h', 'time_m', 'time_s',
            'time_ms', 'time_split_start', 'battle_start', 'current_splits', 'previous_splits'
        ];
        
        if (nonStyleKeys.includes(key)) {
            return false;
        }
        
        // Check if key contains underscore with game prefix pattern or is a line pattern
        const gamePattern = /^(Platinum|HeartGold and SoulSilver|Diamond and Pearl)_/;
        const linePattern = /-line$/;
        
        return gamePattern.test(key) || linePattern.test(key);
    }
    
    /**
     * Get a value with layered lookup: user override -> default
     */
    get(key) {
        // For non-style keys, just return from localStorage directly
        if (!this.isStyleSettingsKey(key)) {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        }
        
        // Get user override from localStorage
        const userRaw = localStorage.getItem(`user_${key}`);
        const userValue = userRaw ? JSON.parse(userRaw) : null;
        
        // Get default value
        const defaultValue = this.defaultSettings[key] || null;
        
        // Merge: user overrides take precedence
        if (userValue === null && defaultValue === null) {
            return null;
        }
        
        if (userValue === null) {
            return defaultValue;
        }
        
        if (defaultValue === null) {
            return userValue;
        }
        
        // Both exist - merge with user values taking precedence
        return { ...defaultValue, ...userValue };
    }
    
    /**
     * Set a value, handling dev vs prod mode
     */
    set(key, value) {
        // For non-style keys, just save to localStorage directly
        if (!this.isStyleSettingsKey(key)) {
            if (value === undefined || value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
            return;
        }
        
        if (this.isDev) {
            // In dev mode, save to default settings file
            this._saveToDefaults(key, value);
        } else {
            // In prod mode, save to localStorage as user override
            this._saveToUserStorage(key, value);
        }
    }
    
    /**
     * Save to default settings file (dev mode)
     */
    _saveToDefaults(key, value) {
        // Update in-memory defaults
        if (value === undefined || value === null) {
            delete this.defaultSettings[key];
        } else {
            // Only persist style fields — callers pass the whole game-state blob
            // for a given key (including split_data, timers, counters), and
            // letting that through bloats the defaults file into the megabytes.
            const styleOnly = {};
            for (const prop of this.stylePropertyKeys) {
                if (prop in value) {
                    styleOnly[prop] = value[prop];
                }
            }
            this.defaultSettings[key] = {
                ...(this.defaultSettings[key] || {}),
                ...styleOnly
            };
        }

        // Debounce the file write — the defaults file is huge and rewriting it
        // on every slider tick blocks the main thread. Flush after idle instead.
        this._scheduleWriteDefaultsFile();

        // Also update localStorage for immediate use (but as defaults, not user overrides)
        localStorage.setItem(key, JSON.stringify(this.defaultSettings[key]));
    }

    /**
     * Debounced wrapper around _writeDefaultsFile.
     * Coalesces rapid changes (e.g. slider drags) into a single disk write.
     */
    _scheduleWriteDefaultsFile() {
        if (this._writeTimer) {
            clearTimeout(this._writeTimer);
        }
        if (!this._unloadHandlerRegistered && typeof window !== 'undefined') {
            // Flush synchronously on app close so we don't drop the last edits
            window.addEventListener('beforeunload', () => {
                if (this._writeTimer) {
                    clearTimeout(this._writeTimer);
                    this._writeTimer = null;
                }
                this._writeDefaultsFileSync();
            });
            this._unloadHandlerRegistered = true;
        }
        this._writeTimer = setTimeout(() => {
            this._writeTimer = null;
            this._writeDefaultsFile();
        }, 500);
    }
    
    /**
     * Save to user storage (prod mode)
     */
    _saveToUserStorage(key, value) {
        if (value === undefined || value === null) {
            localStorage.removeItem(`user_${key}`);
        } else {
            // Only save the properties that differ from the defaults as shipped
            const defaultValue = this._persistedDefaults[key] || {};
            const userOverrides = {};
            
            // Find properties that differ from default
            for (const prop in value) {
                if (JSON.stringify(value[prop]) !== JSON.stringify(defaultValue[prop])) {
                    userOverrides[prop] = value[prop];
                }
            }
            
            if (Object.keys(userOverrides).length > 0) {
                localStorage.setItem(`user_${key}`, JSON.stringify(userOverrides));
            } else {
                // No differences, remove user override
                localStorage.removeItem(`user_${key}`);
            }
        }
        
        // Also update the main key for immediate use
        localStorage.setItem(key, JSON.stringify(value));
    }
    
    _serializeDefaults() {
        return JSON.stringify(this.defaultSettings, null, 4);
    }

    _renderDefaultsFile(json) {
        return `/**
 * Default Style Settings
 * 
 * This file contains the default Pokemon art and background texture settings
 * for each game-species pairing. These settings ship with the app and provide
 * aesthetically pleasing defaults out of the box.
 * 
 * In DEVELOPMENT mode (npm run dev):
 *   - Style changes are saved to this file automatically
 *   - This allows developers to curate and refine default settings
 * 
 * In PRODUCTION mode (built app):
 *   - These defaults are loaded first
 *   - User overrides are stored in localStorage and take precedence
 *   - Users can reset to defaults by clearing their local overrides
 * 
 * AUTO-GENERATED - DO NOT EDIT MANUALLY (unless you know what you're doing)
 * Last updated: ${new Date().toISOString()}
 */

const DEFAULT_STYLE_SETTINGS = ${json};

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DEFAULT_STYLE_SETTINGS;
}
`;
    }

    _markPersisted(json) {
        this._persistedJson = json;
        this._persistedDefaults = JSON.parse(json);
    }

    /**
     * Write default settings to the JS file: off the renderer thread, and never half-written
     * (a temp file is renamed over the real one). Skipped when nothing changed since the last
     * write. Overlapping requests coalesce into one follow-up write.
     */
    _writeDefaultsFile() {
        if (this._writeInFlight) {
            this._writeQueued = true;
            return this._writeInFlight;
        }

        const json = this._serializeDefaults();
        if (json === this._persistedJson) {
            return Promise.resolve();
        }

        const tmpPath = `${this.defaultSettingsPath}.${process.pid}.tmp`;
        this._writeInFlight = fs.promises.writeFile(tmpPath, this._renderDefaultsFile(json), 'utf8')
            .then(() => {
                // The unload flush already wrote newer content; don't rename this older copy over it.
                if (this._unloadFlushed) return fs.promises.unlink(tmpPath);
                return fs.promises.rename(tmpPath, this.defaultSettingsPath)
                    .then(() => this._markPersisted(json));
            })
            .catch((e) => {
                // The edits stay in memory and go out with the next write (or the unload flush).
                console.error('[StyleSettingsManager] Failed to write default settings file:', e.message);
                fs.promises.unlink(tmpPath).catch(() => {});
            })
            .then(() => {
                this._writeInFlight = null;
                if (this._writeQueued) {
                    this._writeQueued = false;
                    this._writeDefaultsFile();
                }
            });

        return this._writeInFlight;
    }

    /** Synchronous variant for the unload flush, where an async write would never finish. */
    _writeDefaultsFileSync() {
        this._unloadFlushed = true;
        const json = this._serializeDefaults();
        if (json === this._persistedJson) {
            return;
        }

        const tmpPath = `${this.defaultSettingsPath}.${process.pid}.sync.tmp`;
        try {
            fs.writeFileSync(tmpPath, this._renderDefaultsFile(json), 'utf8');
            fs.renameSync(tmpPath, this.defaultSettingsPath);
            this._markPersisted(json);
        } catch (e) {
            console.error('[StyleSettingsManager] Failed to write default settings file:', e.message);
            try { fs.unlinkSync(tmpPath); } catch (_) {}
        }
    }
    
    /**
     * Reset a specific key to defaults (remove user overrides)
     */
    resetToDefaults(key) {
        localStorage.removeItem(`user_${key}`);
        
        // Restore the default value to the main key
        const defaultValue = this.defaultSettings[key];
        if (defaultValue) {
            localStorage.setItem(key, JSON.stringify(defaultValue));
        } else {
            localStorage.removeItem(key);
        }
    }
    
    /**
     * Reset all style settings to defaults
     */
    resetAllToDefaults() {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        
        // Remove all user_ prefixed keys (user overrides)
        keys.forEach(key => {
            if (key.startsWith('user_') && this.isStyleSettingsKey(key.replace('user_', ''))) {
                localStorage.removeItem(key);
            }
        });
        
        // Restore defaults
        Object.keys(this.defaultSettings).forEach(key => {
            localStorage.setItem(key, JSON.stringify(this.defaultSettings[key]));
        });
    }
    
    /**
     * Export current localStorage settings to be used as new defaults
     * This is useful for migrating existing settings to the defaults file
     */
    exportCurrentAsDefaults() {
        const exported = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (this.isStyleSettingsKey(key) && !key.startsWith('user_')) {
                try {
                    const value = JSON.parse(localStorage.getItem(key));
                    if (value && typeof value === 'object') {
                        // Only include style-related properties
                        const styleValue = {};
                        this.stylePropertyKeys.forEach(prop => {
                            if (prop in value) {
                                styleValue[prop] = value[prop];
                            }
                        });
                        if (Object.keys(styleValue).length > 0) {
                            exported[key] = styleValue;
                        }
                    }
                } catch (e) {
                    // Skip invalid entries
                }
            }
        });
        
        return exported;
    }
    
    /**
     * Import settings into defaults (dev mode) or user settings (prod mode)
     */
    importSettings(settings) {
        Object.keys(settings).forEach(key => {
            this.set(key, settings[key]);
        });
    }
    
    /**
     * Check if user has any overrides for a key
     */
    hasUserOverrides(key) {
        return localStorage.getItem(`user_${key}`) !== null;
    }
    
    /**
     * Get only the user overrides for a key
     */
    getUserOverrides(key) {
        const raw = localStorage.getItem(`user_${key}`);
        return raw ? JSON.parse(raw) : null;
    }
    
    /**
     * Get only the default value for a key
     */
    getDefault(key) {
        return this.defaultSettings[key] || null;
    }
}

// Export singleton instance
const styleSettingsManager = new StyleSettingsManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = styleSettingsManager;
}

