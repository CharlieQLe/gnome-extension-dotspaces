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
        Settings.initialize();

        // Create the container
        this._dotspaces = new Dotspaces.DotspaceContainer();
        
        // Handle visibility of activities
        Settings.onChanged(Settings.KEEP_ACTIVITIES, _ => toggleActivities(Settings.getBoolean(Settings.KEEP_ACTIVITIES)))

        // Modify panel
        let position = 1;
        if (!Settings.getBoolean(Settings.KEEP_ACTIVITIES)) {
            toggleActivities(false);
            position = 0;
        }
        Main.panel.addToStatusArea(this._uuid, this._dotspaces, position, 'left');
    }

    disable() {
        this._dotspaces.destroy();
        this._dotspaces = null;
        toggleActivities(true);
        Settings.destroy();
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}