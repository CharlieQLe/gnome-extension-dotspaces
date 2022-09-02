'use strict';

var Settings = class Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";

    static ALL_TOGGLES = [
        this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
        this.KEEP_ACTIVITIES,
        this.PANEL_SCROLL
    ];
};