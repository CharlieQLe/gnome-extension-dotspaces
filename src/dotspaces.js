'use strict';

const { Clutter, Gio, GObject, St } = imports.gi;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { DotspaceSettings, MutterSettings } = Me.imports.common;

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
        this._dots.destroy_all_children();

        // Get settings
        const ignoreInactiveOccupiedWorkspaces = this._dotspaceSettings.ignoreInactiveOccupiedWorkspaces;
        const hideDotsOnSingle = this._dotspaceSettings.hideDotsOnSingle;
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;
        
        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Get the number of windows that are on all workspaces
        const windowsOnAllWSCount = ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspaceCount; i++) {
            // Create the new workspace indicator
            const dotIndicator = new St.Bin({ visible: true, reactive: true, can_focus: false, track_hover: true });

            // Get the current workspace
            const workspace = global.workspace_manager.get_workspace_by_index(i);

            // Check if this workspace is occupied by windows by getting the windows on a workspace then subtracting the windows that exist on all workspaces
            const isOccupied = !ignoreInactiveOccupiedWorkspaces && workspace.list_windows().length - windowsOnAllWSCount > 0;

            // Get if this is the dynamic workspace
            const isDynamic = dynamicWorkspacesEnabled && i === workspaceCount - 1;

            // Initial style, icon name, and function
            dotIndicator.add_style_class_name("panel-button");
            dotIndicator.add_style_class_name("dotspaces-indicator");
            let giconName = "inactive-unoccupied";
            let giconSize = 14;

            // Add the occupied style class
            if (isOccupied) dotIndicator.add_style_class_name("occupied");

            // Handle the active state
            if (workspace.active) {
                // Add the style class and set the icon name
                dotIndicator.add_style_pseudo_class("active");
                giconName = "active";

                // Toggle the overview on clicking the active workspace
                dotIndicator.connect('button-release-event', () => {
                    if (Main.overview._visible) Main.overview.hide();
                    else Main.overview.show();
                });
            } else {
                // Set the icon name if this workspace is occupied
                if (isOccupied) giconName = "inactive-occupied";

                // Change workspace on clicking the desired workspace
                dotIndicator.connect('button-release-event', () => workspace.activate(global.get_current_time()));
            }

            // Set the style class, icon name, and icon size if this is the dynamic workspace
            if (isDynamic) {
                dotIndicator.add_style_class_name("dynamic");
                giconName = "dynamic";
                giconSize = 12;
            }

            // Create the icon  
            dotIndicator.icon = new St.Icon({ gicon: Gio.icon_new_for_string(`${Me.path}/icons/${giconName}-symbolic.svg`), icon_size: giconSize });
            dotIndicator.set_child(dotIndicator.icon);

            // Add actor
            this._dots.add_actor(dotIndicator);
        }

        // Toggle visibility
        this.visible = !hideDotsOnSingle || (!dynamicWorkspacesEnabled && workspaceCount > 1) || (dynamicWorkspacesEnabled && workspaceCount > 2);
    }
}