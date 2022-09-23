'use strict';

const { Gio } = imports.gi;

/**
 * Handles settings.
 */
var Settings = class Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";
    static WRAP_WORKSPACES = "wrap-workspaces";
    
    static getNewSchema() {
        const extensionUtils = imports.misc.extensionUtils;
        return extensionUtils.getSettings(extensionUtils.getCurrentExtension().metadata['settings-schema']);
    }

    static getKeys() {
        return [
            this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
            this.KEEP_ACTIVITIES,
            this.PANEL_SCROLL,
            this.WRAP_WORKSPACES
        ];
    }
    
    constructor() {
        this._schema = Settings.getNewSchema();
    }
    
    destroy() {
        this._schema.run_dispose();
    }

    getSchema() {
        return this._schema;
    }

    onChanged(key, func) {
        this._schema.connect(`changed::${key}`, func);
    }

    getBoolean(key) {
        return this._schema.get_boolean(key);
    }

    setBoolean(key, value) {
        this._schema.set_boolean(key, value);
    }
}

/**
 * 
 * Toggle the display of the activities button.
 * 
 * @param {Boolean} display 
 */
function toggleActivities(display) {
    const main = imports.ui.main;
    const activities_button = main.panel.statusArea['activities'];
    if (activities_button) {
        if (display && !main.sessionMode.isLocked) activities_button.container.show();
        else activities_button.container.hide();
    }
}