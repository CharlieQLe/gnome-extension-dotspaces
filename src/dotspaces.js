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
        this.track_hover = false;

        // Get settings
        this._dotspaceSettings = new DotspaceSettings();
        this._mutterSettings = new MutterSettings();
        
        // Create the box to hold the dots 
	    this._dots = new St.BoxLayout({});
        this.add_child(this._dots);
	    this._rebuild_dots();

        // Connect events
        const scrollEventSource = this._dotspaceSettings.panelScroll ? Main.panel : this;
        this._dotspaceSettings.onChangedIgnoreInactiveOccupiedWorkspaces(this._update_dots.bind(this));
        this._activeWorkspaceChangedId = global.workspace_manager.connect("active-workspace-changed", this._update_dots.bind(this));
        this._notifyNWorkspacesId = global.workspace_manager.connect("notify::n-workspaces", this._update_dots.bind(this));
        this._scrollEventId = scrollEventSource.connect("scroll-event", this._on_scroll.bind(this));
        this._mutterSettings.onChangedDynamicWorkspaces(this._update_dots.bind(this));
        this.connect("destroy", () => {
            if (this._activeWorkspaceChangedId) global.workspace_manager.disconnect(this._activeWorkspaceChangedId);
            if (this._notifyNWorkspacesId) global.workspace_manager.disconnect(this._notifyNWorkspacesId);
            if (this._scrollEventId) scrollEventSource.disconnect(this._scrollEventId);
            this._dots.destroy();
        });
    }

    _get_icon(name) {
        return Gio.icon_new_for_string(`${Me.path}/icons/${name}-symbolic.svg`);
    }

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

    /**
     * Update the dot indicators, rebuilding if necessary.
     */
    _update_dots() {
        print('updating!');

        // Get children
        const children = this._dots.get_children();

        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // If there are too many children, rebuild
        if (children.length > workspaceCount) {
            this._rebuild_dots();
            return;
        }

        // Get settings
        const ignoreInactiveOccupiedWorkspaces = this._dotspaceSettings.ignoreInactiveOccupiedWorkspaces;
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;

        // Get the number of windows that are on all workspaces
        const windowsOnAllWSCount = ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Handle the existing children
        children.forEach((dotsContainer, index) => {
            // Remove style classes
            dotsContainer.set_style_class_name(null);

            // Remove children
            dotsContainer.destroy_all_children();

            // Remove signal
            if (dotsContainer.releaseSignalId !== null) dotsContainer.disconnect(dotsContainer.releaseSignalId);
                            
            // Get the dot data
            const data = this._handle_workspace_dot(index, ignoreInactiveOccupiedWorkspaces, dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount);

            // Set the style class
            data.styleClasses.forEach(styleClass => dotsContainer.add_style_class_name(styleClass));

            // Create the icon
            dotsContainer.icon = new St.Icon({ gicon: data.gicon, icon_size: data.giconSize });
            dotsContainer.set_child(dotsContainer.icon);

            // Connect signal
            dotsContainer.releaseSignalId = dotsContainer.connect('button-release-event', data.buttonReleaseFunc);
        });

        // Add more dots if needed
        for (let i = children.length; i < workspaceCount; i++) {
            this._dots.add_actor(this._build_dot(i, dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount));
        }
    }
    /*
     * Rebuild the dot indicators.
     */
    _rebuild_dots() {
        print('rebuilding!');

        // Destroy all dots
        this._dots.destroy_all_children();

        // Get settings
        const ignoreInactiveOccupiedWorkspaces = this._dotspaceSettings.ignoreInactiveOccupiedWorkspaces;
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;

        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Get the number of windows that are on all workspaces
        const windowsOnAllWSCount = ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspaceCount; i++) {
            this._dots.add_actor(this._build_dot(i, ignoreInactiveOccupiedWorkspaces, dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount));
        }
    }

    /**
     * Build a dot indicator.
     * 
     * @param {number} index 
     * @param {boolean} ignoreInactiveOccupiedWorkspaces
     * @param {boolean} dynamicWorkspacesEnabled 
     * @param {number} workspaceCount 
     * @param {number} windowsOnAllWSCount 
     * @returns St.Bin
     */
    _build_dot(index, ignoreInactiveOccupiedWorkspaces, dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount) {
        // Create the new workspace indicator
        const dotsContainer = new St.Bin({ visible: true, reactive: true, can_focus: false, track_hover: true });
            
        // Get the dot data
        const data = this._handle_workspace_dot(index, ignoreInactiveOccupiedWorkspaces, dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount);

        // Set the style class
        data.styleClasses.forEach(styleClass => dotsContainer.add_style_class_name(styleClass));

        // Create the icon  
        dotsContainer.icon = new St.Icon({ gicon: data.gicon, icon_size: data.giconSize });
        dotsContainer.set_child(dotsContainer.icon);

        // Connect signal
        dotsContainer.releaseSignalId = dotsContainer.connect('button-release-event', data.buttonReleaseFunc);

        return dotsContainer;
    }
    
    /**
     * Return dotspace information.
     * 
     * @param {number} index 
     * @param {boolean} ignoreInactiveOccupiedWorkspaces
     * @param {boolean} dynamicWorkspacesEnabled 
     * @param {number} workspaceCount 
     * @param {number} windowsOnAllWSCount 
     * @returns 
     */
    _handle_workspace_dot(index, ignoreInactiveOccupiedWorkspaces,  dynamicWorkspacesEnabled, workspaceCount, windowsOnAllWSCount) {
        // Get the current workspace
        const workspace = global.workspace_manager.get_workspace_by_index(index);

        // Check if this workspace is occupied by windows by getting the windows on a workspace then subtracting the windows that exist on all workspaces
        const isOccupied = !ignoreInactiveOccupiedWorkspaces && workspace.list_windows().length - windowsOnAllWSCount > 0;

        // Get if this is the dynamic workspace
        const isDynamic = dynamicWorkspacesEnabled && index === workspaceCount - 1;

        // Initial data
        const styleClasses = ["dotspaces-indicator"];
        let giconName = "inactive-unoccupied";
        let giconSize = 14;
        let buttonReleaseFunc = null;

        // Handle the active state
        if (workspace.active) {
            // Add the style class and set the icon name
            styleClasses.push("active");
            giconName = "active";

            // Toggle the overview on clicking the active workspace
            buttonReleaseFunc = () => {
                if (Main.overview._visible) Main.overview.hide();
                else Main.overview.show();
            };
        } else {
            // Set the style class and icon name if this workspace is occupied
            if (isOccupied) {
                styleClasses.push("occupied");
                giconName = "inactive-occupied";
            }

            // Change workspace on clicking the desired workspace
            buttonReleaseFunc = () => workspace.activate(global.get_current_time());
        }

        // Set the style class, icon name, and icon size if this is the dynamic workspace
        if (isDynamic) {
            styleClasses.push("dynamic");
            giconName = "dynamic";
            giconSize = workspace.active ? 12 : 8;
        }

        return {
            styleClasses: styleClasses,
            gicon: this._get_icon(giconName),
            giconSize: giconSize,
            buttonReleaseFunc: buttonReleaseFunc,
        };
    }
}