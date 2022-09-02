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
const { toggle_activities } = Me.imports.utils.activitiesHandler;
const { Settings } = Me.imports.constants;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        Settings.initialize();
        Settings.changedBoolean(Settings.KEEP_ACTIVITIES, state => toggle_activities(state));

        this._dotspaces = new Dotspaces.DotspaceContainer();
        
        // Hide activities
        let position = 1;
        if (!Settings.getBoolean(Settings.KEEP_ACTIVITIES)) {
            toggle_activities(false);
            position = 0;
        }

        // Add the workspaces to the left side of the panel
        Main.panel.addToStatusArea(this._uuid, this._dotspaces, position, 'left');
    }

    disable() {
        this._dotspaces.destroy();
        this._dotspaces = null;
        toggle_activities(true);
        Settings.destroy();
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}