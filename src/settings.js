'use strict';

const { Gio } = imports.gi;

var Settings = class Settings {
    constructor(schema) {
        this._schema = schema;
    }

    get schema() { 
        return this._schema;
    }

    onChanged(key, func) { 
        this._schema.connect(`changed::${key}`, func); 
    }

    getBoolean(key) { 
        return this._schema.get_boolean(key); 
    }

    setBoolean(key, value) { 
        this._schema.set_boolean(key, value); 
    }
}

/**
 * Handles settings for this extension.
 */
var DotspaceSettings = class DotspaceSettings extends Settings {
    static IGNORE_INACTIVE_OCCUPIED_WORKSPACES = "ignore-inactive-occupied-workspaces";
    static KEEP_ACTIVITIES = "keep-activities";
    static PANEL_SCROLL = "panel-scroll";
    static WRAP_WORKSPACES = "wrap-workspaces";
    static HIDE_DOTS_ON_SINGLE = "hide-dots-on-single";
    
    static getNewSchema() {
        const extensionUtils = imports.misc.extensionUtils;
        return extensionUtils.getSettings(extensionUtils.getCurrentExtension().metadata['settings-schema']);
    }

    static getKeys() {
        return [
            this.IGNORE_INACTIVE_OCCUPIED_WORKSPACES,
            this.KEEP_ACTIVITIES,
            this.PANEL_SCROLL,
            this.WRAP_WORKSPACES,
            this.HIDE_DOTS_ON_SINGLE
        ];
    }
    
    constructor() { 
        super(DotspaceSettings.getNewSchema()); 
    }

    get ignoreInactiveOccupiedWorkspaces() {
        return this.getBoolean(DotspaceSettings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES);
    }

    get keepActivities() {
        return this.getBoolean(DotspaceSettings.KEEP_ACTIVITIES);
    }

    get panelScroll() {
        return this.getBoolean(DotspaceSettings.PANEL_SCROLL);
    }

    get wrapWorkspaces() {
        return this.getBoolean(DotspaceSettings.WRAP_WORKSPACES);
    }

    get hideDotsOnSingle() {
        return this.getBoolean(DotspaceSettings.HIDE_DOTS_ON_SINGLE);
    }

    onChangedIgnoreInactiveOccupiedWorkspaces(func) {
        this.onChanged(DotspaceSettings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES, func);
    }

    onChangedKeepActivities(func) {
        this.onChanged(DotspaceSettings.KEEP_ACTIVITIES, func);
    }

    onChangedPanelScroll(func) {
        this.onChanged(DotspaceSettings.PANEL_SCROLL, func);
    }

    onChangedHideDotsOnSingle(func) {
        this.onChanged(DotspaceSettings.HIDE_DOTS_ON_SINGLE, func);
    }
}

/**
 * Handles settings for Mutter.
 */
var MutterSettings = class MutterSettings extends Settings {
    static DYNAMIC_WORKSPACES = "dynamic-workspaces";
    
    static getNewSchema() {
        return new Gio.Settings({ schema: 'org.gnome.mutter' });
    }

    constructor() {
        super(MutterSettings.getNewSchema());
    }

    get dynamicWorkspaces() {
        return this.getBoolean(MutterSettings.DYNAMIC_WORKSPACES);
    }

    onChangedDynamicWorkspaces(func) {
        this.onChanged(MutterSettings.DYNAMIC_WORKSPACES, func);
    }
}
