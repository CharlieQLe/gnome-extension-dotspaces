'use strict';

const { Gio } = imports.gi;

/**
 * Handles settings.
 */
var Settings = class Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";
    
    static initialize() {
        if (this._schema === undefined) this._schema = this.getNewSchema();
        print(this._schema);
    }

    static destroy() {
        if (this._schema !== undefined) this._schema.run_dispose();
    }

    static getNewSchema() {
        const extensionUtils = imports.misc.extensionUtils;
        return extensionUtils.getSettings(extensionUtils.getCurrentExtension().metadata['settings-schema']);
    }

    static getSchema() {
        return this._schema;
    }

    static onChanged(key, func) {
        this._schema.connect(`changed::${key}`, func);
    }

    static getKeys() {
        return [
            this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
            this.KEEP_ACTIVITIES,
            this.PANEL_SCROLL
        ];
    }

    static getBoolean(key) {
        return this._schema.get_boolean(key);
    }

    static setBoolean(key, value) {
        this._schema.set_boolean(key, value);
    }
}

/**
 * Stores signal data.
 */
 var SignalHandle = class SignalHandle {
    constructor(source, target) {
        this._source = source;
        this._target = target;
    }

    /**
     * Disconnect the signal.
     */
    disconnect() {
        this._source.disconnect(this._target);
    }
}

/**
 * Handles signals.
 */
var SignalHandler = class SignalHandler {
    constructor(bindTarget) {
        this._signals = [];
        this._bindTarget = bindTarget;
    }

    /**
     * Add a signal.
     * 
     * @param {*} source 
     * @param {String} event 
     * @param {Function} functionToRun 
     * @return {SignalHandle} The signal handle
     */
    add_signal(source, event, functionToRun) {
        let signal = new SignalHandle(source, source.connect(event, functionToRun.bind(this._bindTarget)));
        this._signals.push(signal);
        return signal;
    }

    /**
     * Remove a signal.
     * 
     * @param {SignalHandle} signal 
     * @returns {Boolean} True if successful, false otherwise.
     */
    remove_signal(signal) {
        let index = this._signals.indexOf(signal);
        if (index < 0) return false;
        this._signals.splice(index, 1)[0].disconnect();
        return true;
    }

    /**
     * Clear all signals.
     */
    clear_signals() {
        this._signals.forEach(this._disconnect_signal);
        this._signals = [];
    }

    /**
     * Disconnect the signal handle. 
     * 
     * @param {SignalHandle} signalHandle 
     */
    _disconnect_signal(signalHandle) {
        signalHandle.disconnect();
    }
}

/**
 * Handles icons.
 */
var IconHandler = class IconHandler {
    constructor() {
        this._names = [];
    }

    /**
     * Add an icon. If an icon already exists with the specified name, it is not replaced.
     * 
     * @param {String} name 
     * @param {String} path 
     */
    add_icon(name, path) {
        if (this[name]) return;
        this._names.push(name);
        this[name] = Gio.icon_new_for_string(path);
    }

    /**
     * Get the icon for the specified name.
     * 
     * @param {String} name 
     * @returns {Gio.Icon}
     */
    get_icon(name) {
        return this[name];
    }

    /**
     * Add and return an icon. If an icon already exists with the specified name, return the icon for that name.
     * 
     * @param {String} name 
     * @param {String} path 
     * @returns {Gio.Icon}
     */
    add_and_get_icon(name, path) {
        this.add_icon(name, path);
        return this[name];
    }

    /**
     * Remove the icon with the specified name.
     * 
     * @param {String} name 
     */
    remove_icon(name) {
        let i = this._names.indexOf(name);
        if (i >= 0) delete this[this._names.splice(i, 1)[0]];
    }

    /**
     * Remove all icons.
     */
    delete_all_icons() {
        this._names.forEach(s => delete this[s]);
        this._names = [];
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