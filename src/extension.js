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
const { DotspaceSettings } = Me.imports.settings;

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
    }

    enable() {
        this._dotspaceSettings = new DotspaceSettings();

        // Handle visibility of activities
        this._dotspaceSettings.onChangedKeepActivities(this._updateDotspaces.bind(this));
        this._dotspaceSettings.onChangedPanelScroll(this._updateDotspaces.bind(this));

        // Modify panel
        this._updateDotspaces();
    }

    disable() {
        if (this._dotspaces) {
            Main.panel._leftBox.remove_child(this._dotspaces);
            this._dotspaces.destroy();
            this._dotspaces = null;
        }
        ToggleActivities(true);
        this._dotspaceSettings = null;
    }

    _updateDotspaces() {
        this._dotspaces?.destroy();
        this._dotspaces = new Dotspaces.DotspaceContainer();
        let position = 0;
        if (this._dotspaceSettings.keepActivities) {
            ToggleActivities(true);
            position = 1;
        } else ToggleActivities(false);
        Main.panel._leftBox.insert_child_at_index(this._dotspaces, position);
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}

/**
 * Toggle the display of the activities button.
 * 
 * @param {Boolean} display
 */
 function ToggleActivities(display) {
    const activities_button = Main.panel.statusArea['activities'];
    if (activities_button) {
        if (display && !Main.sessionMode.isLocked) activities_button.container.show();
        else activities_button.container.hide();
    }
}