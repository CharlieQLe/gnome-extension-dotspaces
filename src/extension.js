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
const { Settings, toggleActivities } = Me.imports.common;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._settings = new Settings();

        // Handle visibility of activities
        this._settings.onChanged(Settings.KEEP_ACTIVITIES, () => this._updateDotspaces());

        // Modify panel
        this._updateDotspaces();
    }

    disable() {
        if (this._dotspaces) {
            this._dotspaces.destroy();
            this._dotspaces = null;
        }
        toggleActivities(true);
        this._settings.destroy();
    }

    _updateDotspaces() {
        this._dotspaces?.destroy();
        this._dotspaces = new Dotspaces.DotspaceContainer();
        let position = 0;
        if (this._settings.getBoolean(Settings.KEEP_ACTIVITIES)) {
            toggleActivities(true);
            position = 1;
        } else toggleActivities(false);
        Main.panel.addToStatusArea(this._uuid, this._dotspaces, position, 'left');
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
