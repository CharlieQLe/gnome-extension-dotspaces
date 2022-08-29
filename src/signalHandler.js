'use strict';

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
     * @param {*} functionToRun 
     */
    add_signal(source, event, functionToRun) {
        this._signals.push({
            source: source,
            target: source.connect(event, functionToRun.bind(this._bindTarget))
        });
    }

    /**
     * Clear all signals.
     */
    clear_signals() {
        this._signals.forEach(s => s.source.disconnect(s.target));
        this._signals = [];
    }
}