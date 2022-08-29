'use strict';

const { Gio } = imports.gi;

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