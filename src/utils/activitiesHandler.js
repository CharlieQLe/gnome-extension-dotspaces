'use strict';

const Main = imports.ui.main;

/**
 * 
 * Toggle the display of the activities button.
 * 
 * @param {Boolean} display 
 */
function toggle_activities(display) {
    const activities_button = Main.panel.statusArea['activities'];
    if (activities_button) {
        if (display && !Main.sessionMode.isLocked) activities_button.container.show();
        else activities_button.container.hide();
    }
}