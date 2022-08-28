const Main = imports.ui.main;

/**
 * 
 * Toggle the display of the activities button.
 * 
 * @param {Boolean} show 
 */
function showActivities(show) {
    const activities_button = Main.panel.statusArea['activities'];
    if (activities_button) {
        if (show && !Main.sessionMode.isLocked) {
            activities_button.container.show();
        } else {
            activities_button.container.hide();
        }
    }
}