'use strict';

var Settings = class Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";

    static initialize() {
        this._settings = imports.misc.extensionUtils.getSettings("org.gnome.shell.extensions.dotspaces");
    }

    static destroy() {
        this._settings.run_dispose();
    }

    static changed(key, func) {
        this._settings.connect(`changed::${key}`, func);
    }

    static changedBoolean(key, func) {
        this._settings.connect(`changed::${key}`, _ => func(getBoolean(key)));
    }

    static getSettings() {
        return this._settings;
    }

    static getAllToggleKeys() {
        return [
            this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
            this.KEEP_ACTIVITIES,
            this.PANEL_SCROLL
        ];
    }

    static getBoolean(key) {
        return this._settings.get_boolean(key);
    }

    static setBoolean(key, value) {
        this._settings.set_boolean(key, value);
    }
};