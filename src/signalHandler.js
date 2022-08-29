'use strict';

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
        if (index < 0) {
            return false;
        }
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