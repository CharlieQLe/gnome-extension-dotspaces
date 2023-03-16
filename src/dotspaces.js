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

    _init(index, settings) {
        super._init({
            visible: true,
            reactive: true,
            can_focus: false,
            track_hover: true
        });        

        // Set the settings
        this._settings = settings;

        // Get the workspace to watch
        this._workspace = global.workspace_manager.get_workspace_by_index(index);

        // Set the icon
        this._icon = null;

        // Add style classes
        this.add_style_class_name("panel-button");
        this.add_style_class_name("dotspaces-indicator");

        // Signals
        this.connect('destroy', () => {
            if (this._notifyActiveSignal) this._workspace.disconnect(this._notifyActiveSignal);
            if (this._notifyNWindowsSignal) this._workspace.disconnect(this._notifyNWindowsSignal);
        });
        this._notifyNWindowsSignal = this._workspace.connect_after('notify::n-windows', _ => this.Update());
        this._notifyActiveSignal = this._workspace.connect_after('notify::active', this.Update.bind(this));

        // Update icons
        this.Update();
    }

    Update() {
        if (this._buttonSignal) this.disconnect(this._buttonSignal);

        // Check if this workspace is occupied
        const invalidWindowCount = this._workspace.list_windows().filter(w => w.is_on_all_workspaces() || w.is_skip_taskbar()).length;
        const isOccupied = !this._settings.ignoreInactiveOccupiedWorkspaces && this._workspace.n_windows - invalidWindowCount > 0;

        // Add style classes
        if (isOccupied) this.add_style_class_name("occupied");
        else this.remove_style_class_name("occupied");

        // Default gicon settings
        let giconName = "inactive-unoccupied";
        let giconSize = 14;

        // Handle active workspace
        if (this._workspace.active) {
            giconName = "active";
            this.add_style_pseudo_class("active");
            this._buttonSignal = this.connect('button-release-event', () => {
                if (Main.overview._visible) Main.overview.hide();
                else Main.overview.show();
            });
        } else {
            if (isOccupied) giconName = "inactive-occupied";
            this.remove_style_pseudo_class("active");
            this._buttonSignal = this.connect('button-release-event', () => this._workspace.activate(global.get_current_time()));
        }
        
        // Handle dynamic (last if dynamic) workspace
        if (this._settings.dynamicWorkspaces && index === global.workspace_manager.get_n_workspaces() - 1) {
            this.add_style_class_name("dynamic");
            giconName = "dynamic";
            giconSize = 12;
        } else this.remove_style_class_name("dynamic");

        // Create or set the icon  
        const gicon = Gio.Icon.new_for_string(`${Me.path}/icons/${giconName}-symbolic.svg`);
        if (this._icon == null) {
            this._icon = new St.Icon({ gicon: gicon, icon_size: giconSize });
            this.set_child(this._icon);
        } else this._icon.set_gicon(gicon);
    }
}

var DotspaceContainer = class DotspaceContainer extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init({
            track_hover: true,
            reactive: true
        });

        this._dots = [];
        
        // Get settings
        this._dotspaceSettings = new DotspaceSettings();
        this._mutterSettings = new MutterSettings();
        
        // Create the box to hold the dots 
        this.add_style_class_name("panel-button");
	    this.add_style_class_name("dotspaces-container");
        
        // Handle scroll event
        const scrollEventSource = this._dotspaceSettings.panelScroll ? Main.panel : this;
        this._scrollEventId = scrollEventSource.connect("scroll-event", this._OnScroll.bind(this));

        // Handle setting events
        this._dotspaceSettings.onChangedIgnoreInactiveOccupiedWorkspaces(this._RebuildDots.bind(this));
        this._dotspaceSettings.onChangedHideDotsOnSingle(this._RebuildDots.bind(this));
        this._mutterSettings.onChangedDynamicWorkspaces(this._RebuildDots.bind(this));
        
        // Handle workspace events
        this._notifyNWorkspacesId = global.workspace_manager.connect_after("notify::n-workspaces", this._RebuildDots.bind(this));

        // Handle destroy event
        this.connect("destroy", () => {
            if (this._notifyNWorkspacesId) global.workspace_manager.disconnect(this._notifyNWorkspacesId);
            if (this._scrollEventId) scrollEventSource.disconnect(this._scrollEventId);
        });

        // Rebuild dots
	    this._RebuildDots();
    }

    /**
     * Handle the scroll event.
     * 
     * @param {*} _ 
     * @param {Clutter.Event} event 
     */
    _OnScroll(_, event) {
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
    _RebuildDots() {
        // Destroy all dots
        this.destroy_all_children();
        this._dots = []

        // Get settings
        const dynamicWorkspacesEnabled = this._mutterSettings.dynamicWorkspaces;
        
        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Create dots
        for (let i = 0; i < workspaceCount; i++) {
            const dot = new DotIndicator(i, this._dotspaceSettings);
            this.add_actor(dot);
            this._dots.push(dot);
        }

        // Toggle visibility
        this.visible = !this._dotspaceSettings.hideDotsOnSingle || (!dynamicWorkspacesEnabled && workspaceCount > 1) || (dynamicWorkspacesEnabled && workspaceCount > 2);
    }
}