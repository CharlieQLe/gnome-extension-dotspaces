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