'use strict';

/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Dotspaces = Me.imports.dotspaces;
const Utils = Me.imports.utils;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._dotspaces = new Dotspaces.DotspaceContainer();
        this._settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.dotspaces");
        this._activities_signal = this._settings.connect("changed::keep-activities", _ => Utils.showActivities(this._settings.get_boolean("keep-activities")));

        // Hide activities
        let position = 1;
        if (!this._settings.get_boolean('keep-activities')) {
            Utils.showActivities(false);
            position = 0;
        }

        // Add the workspaces to the left side of the panel
        Main.panel.addToStatusArea(this._uuid, this._dotspaces, position, 'left');
    }

    disable() {
        this._dotspaces.destroy();
        this._dotspaces = null;
        if (this._activities_signal) {
            this._settings.disconnect(this._activities_signal);
        }
        Utils.showActivities(true);
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}