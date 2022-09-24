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
const { DotspaceSettings, toggleActivities } = Me.imports.common;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._dotspaceSettings = new DotspaceSettings();

        // Handle visibility of activities
        this._dotspaceSettings.onChanged(DotspaceSettings.KEEP_ACTIVITIES, this._updateDotspaces.bind(this));
        this._dotspaceSettings.onChanged(DotspaceSettings.PANEL_SCROLL, this._updateDotspaces.bind(this));

        // Modify panel
        this._updateDotspaces();
    }

    disable() {
        if (this._dotspaces) {
            this._dotspaces.destroy();
            this._dotspaces = null;
        }
        toggleActivities(true);
    }

    _updateDotspaces() {
        this._dotspaces?.destroy();
        this._dotspaces = new Dotspaces.DotspaceContainer();
        let position = 0;
        if (this._dotspaceSettings.keepActivities) {
            toggleActivities(true);
            position = 1;
        } else toggleActivities(false);
        Main.panel.addToStatusArea(this._uuid, this._dotspaces, position, 'left');
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
