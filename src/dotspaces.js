'use strict';

const { Clutter, Gio, GObject, St } = imports.gi;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { DotspaceSettings, MutterSettings } = Me.imports.settings;

class DotIndicator extends St.Bin {
    static {
        GObject.registerClass(this);
    }

    _init(index, windowsOnAllWSCount, dynamicWorkspacesEnabled, ignoreInactiveOccupiedWorkspaces) {
        super._init({
            visible: true,
            reactive: true,
            can_focus: false,
            track_hover: true
        });

        // Get the workspace to watch
        this._workspace = global.workspace_manager.get_workspace_by_index(index);
        
        // Check if this workspace is occupied
        const isOccupied = !ignoreInactiveOccupiedWorkspaces && this._workspace.list_windows().length - windowsOnAllWSCount > 0;
        
        // Add style classes
        this.add_style_class_name("panel-button");
        this.add_style_class_name("dotspaces-indicator");
        if (isOccupied) this.add_style_class_name("occupied");

        // Default gicon settings
        let giconName = "inactive-unoccupied";
        let giconSize = 14;

        // Handle active workspace
        if (this._workspace.active) {
            giconName = "active";
            this.add_style_pseudo_class("active");
            this.connect('button-release-event', toggleOverview);
        } else this.connect('button-release-event', this.activate_workspace.bind(this));
        
        // Handle dynamic (last if dynamic) workspace
        if (dynamicWorkspacesEnabled && index === global.workspace_manager.get_n_workspaces() - 1) {
            this.add_style_class_name("dynamic");
            giconName = "dynamic";
            giconSize = 12;
        }

        // Create the icon  
        this._icon = new St.Icon({ gicon: Gio.icon_new_for_string(`${Me.path}/icons/${giconName}-symbolic.svg`), icon_size: giconSize });
        this.set_child(this._icon);
    }

    activate_workspace() {
        this._workspace.activate(global.get_current_time());
    }
}

var DotspaceContainer = class DotspaceContainer extends imports.ui.panelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init(0.0, _('DotspaceContainer'));
        this.track_hover = true;

        // Get settings
        this._dotspaceSettings = new DotspaceSettings();
        this._mutterSettings = new MutterSettings();
        
        // Create the box to hold the dots 
	    this._dots = new St.BoxLayout({});
        this._dots.add_style_class_name("dotspaces-container");
        this._dots.add_style_class_name("panel-button");
        this.add_child(this._dots);

        // Handle scroll event
        const scrollEventSource = this._dotspaceSettings.panelScroll ? Main.panel : this;
        this._scrollEventId = scrollEventSource.connect("scroll-event", this._on_scroll.bind(this));

        // Handle setting events
        this._dotspaceSettings.onChangedIgnoreInactiveOccupiedWorkspaces(this._rebuild_dots.bind(this));
        this._dotspaceSettings.onChangedHideDotsOnSingle(this._rebuild_dots.bind(this));
        this._mutterSettings.onChangedDynamicWorkspaces(this._rebuild_dots.bind(this));
        
        // Handle workspace events
        this._activeWorkspaceChangedId = global.workspace_manager.connect("active-workspace-changed", this._rebuild_dots.bind(this));
        this._notifyNWorkspacesId = global.workspace_manager.connect("notify::n-workspaces", this._rebuild_dots.bind(this));

        // Handle destroy event
        this.connect("destroy", () => {
            if (this._activeWorkspaceChangedId) global.workspace_manager.disconnect(this._activeWorkspaceChangedId);
            if (this._notifyNWorkspacesId) global.workspace_manager.disconnect(this._notifyNWorkspacesId);
            if (this._scrollEventId) scrollEventSource.disconnect(this._scrollEventId);
            this._dots.destroy();
        });

        // Rebuild dots
	    this._rebuild_dots();
    }

    /**
     * Handle the scroll event.
     * 
     * @param {*} _ 
     * @param {Clutter.Event} event 
     */
    _on_scroll(_, event) {
        // Increment or decrement the index
        let index = global.workspace_manager.get_active_workspace_index();
        switch (event.get_scroll_direction()) {
            case Clutter.ScrollDirection.UP: index--; break;
            case Clutter.ScrollDirection.DOWN: index++; break;
        }

        // Modulo division to wrap the workspace index
        const workspaceCount = global.workspace_manager.get_n_workspaces();
        if (this._dotspaceSettings.wrapWorkspaces) {
            index %= workspaceCount;
            if (index < 0) index += workspaceCount;
        } else index = Math.min(Math.max(index, 0), workspaceCount);
        
        // Change the workspace
        if (index >= 0 && index < workspaceCount) global.workspace_manager.get_workspace_by_index(index).activate(global.get_current_time());
    }

    /*
     * Rebuild the dot indicators.
     */
    _rebuild_dots() {
        // Destroy all dots
        this._dots?.destroy_all_children();

        // Get settings
        const ignoreInactiveOccupiedWorkspaces = this._dotspaceSettings.ignoreInactiveOccupiedWorkspaces;
        const hideDotsOnSingle = this._dotspaceSettings.hideDotsOnSingle;
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;
        
        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Get the number of windows that are on all workspaces
        const windowsOnAllWSCount = ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspaceCount; i++) this._dots.add_actor(new DotIndicator(i, windowsOnAllWSCount, dynamicWorkspacesEnabled, ignoreInactiveOccupiedWorkspaces));
        
        // Toggle visibility
        this.visible = !hideDotsOnSingle || (!dynamicWorkspacesEnabled && workspaceCount > 1) || (dynamicWorkspacesEnabled && workspaceCount > 2);
    }
}

/**
 * Toggle the overview
 */
function toggleOverview() {
    if (Main.overview._visible) Main.overview.hide();
    else Main.overview.show();
}