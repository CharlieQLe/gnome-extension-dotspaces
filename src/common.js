'use strict';

const { Gio } = imports.gi;

/**
 * Handles settings.
 */
var DotspaceSettings = class DotspaceSettings {
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
        this._schema = DotspaceSettings.getNewSchema();
    }

    get schema() {
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

    get ignoreInactiveOccupiedWorkspaces() {
        return this.getBoolean(DotspaceSettings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES);
    }

    get keepActivities() {
        return this.getBoolean(DotspaceSettings.KEEP_ACTIVITIES);
    }

    get panelScroll() {
        return this.getBoolean(DotspaceSettings.PANEL_SCROLL);
    }

    get wrapWorkspaces() {
        return this.getBoolean(DotspaceSettings.WRAP_WORKSPACES);
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