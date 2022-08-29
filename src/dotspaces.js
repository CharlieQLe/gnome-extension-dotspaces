'use strict';

const { Clutter, Gio, GObject, St } = imports.gi;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SignalHandler } = Me.imports.signalHandler;
const { IconHandler } = Me.imports.iconHandler;

var DotspaceContainer = class DotspaceContainer extends imports.ui.panelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init(0.0, _('DotspaceContainer'));
        this.track_hover = false;

        // Get settings
        this._settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.dotspaces");
        this._mutterSettings = new Gio.Settings({ schema: 'org.gnome.mutter' });

        // Get setting values
        this._ignoreInactiveOccupiedWorkspaces = this._settings.get_boolean("ignore-inactive-occupied-workspaces");
        this._dynamicWorkspaces = this._mutterSettings.get_boolean('dynamic-workspaces');
        
        // Create the icons
        this._icons = new IconHandler();
        this._icons.add_icon("active", `${Me.path}/icons/active-symbolic.svg`);
        this._icons.add_icon("inactive-occupied", `${Me.path}/icons/inactive-occupied-symbolic.svg`);
        this._icons.add_icon("inactive-unoccupied", `${Me.path}/icons/inactive-unoccupied-symbolic.svg`);
        this._icons.add_icon("dynamic", `${Me.path}/icons/dynamic-symbolic.svg`);

        // Create the box to hold the dots 
	    this.dots = new St.BoxLayout({});
        this.add_child(this.dots);
	    this._update_dots();

        // Connect events
        this._signalHandler = new SignalHandler(this); 
        this._signalHandler.add_signal(global.workspace_manager, "active-workspace-changed", this._update_dots);
        this._signalHandler.add_signal(global.workspace_manager, "notify::n-workspaces", this._update_dots);
        this._signalHandler.add_signal(this._settings, "changed::ignore-inactive-occupied-workspaces", _ => {
            this._ignoreInactiveOccupiedWorkspaces = this._settings.get_boolean("ignore-inactive-occupied-workspaces");
            this._update_dots();
        });
        this._signalHandler.add_signal(this._settings, "changed::panel-scroll", _ => this._update_scroll(this._settings.get_boolean("panel-scroll")));
        this._signalHandler.add_signal(this._mutterSettings, "changed::dynamic-workspaces", _ => {
            this._dynamicWorkspaces = this._mutterSettings.get_boolean("dynamic-workspaces");
            this._update_dots();
        });
        this._update_scroll(this._settings.get_boolean("panel-scroll"));
    }

    /*
     * Handle destroy.
     */
    destroy() {
        // Disconnect events
        this._signalHandler.clear_signals()

        // Remove all icons
        this._icons.delete_all_icons();

        // Destroy
        this.dots.destroy();
        super.destroy();
    }

    /**
     * Update the scroll signal.
     * 
     * @param {Boolean} usePanel
     */
    _update_scroll(usePanel) {
        // Remove the existing scroll signal if it exists
        if (this._scrollSignal) this._signalHandler.remove_signal(this._scrollSignal);

        // Add the scroll signal to the panel or this
        this._scrollSignal = this._signalHandler.add_signal(usePanel ? Main.panel : this, 'scroll-event', (_, event) => {
            // Increment or decrement the index
            let index = global.workspace_manager.get_active_workspace_index();
            switch (event.get_scroll_direction()) {
                case Clutter.ScrollDirection.UP: index--; break;
                case Clutter.ScrollDirection.DOWN: index++; break;
            }
    
            // Modulo division to wrap the workspace index
            let workspace_count = global.workspace_manager.get_n_workspaces();
            index %= workspace_count;
            if (index < 0) index += workspace_count;
    
            // Change the workspace
            if (index >= 0 && index < workspace_count) global.workspace_manager.get_workspace_by_index(index).activate(global.get_current_time());
        });
    }
    
    /*
     * Update the dot indicators.
     */
    _update_dots() {
        // Destroy all dots
        this.dots.destroy_all_children();

        // Update workspace information
        let workspace_count = global.workspace_manager.get_n_workspaces();

        // Get the number of windows that are on all workspaces
        let windowsOnAllWSCount = this._ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspace_count; i++) {
            // Get the current workspace
            let workspace = global.workspace_manager.get_workspace_by_index(i);

            // Check if this workspace is occupied by windows by getting the windows on a workspace then subtracting the windows that exist on all workspaces
            let isOccupied = !this._ignoreInactiveOccupiedWorkspaces && workspace.list_windows().length - windowsOnAllWSCount > 0;

            // Get if this is the dynamic workspace
            let isDynamic = this._dynamicWorkspaces && i === workspace_count - 1;
            
            // Create the new workspace indicator
            let dotsContainer = new St.Bin({ visible: true, reactive: true, can_focus: false, track_hover: false });
            
            // Add the style class
            dotsContainer.add_style_class_name("dotspaces-indicator");

            // Default icon name and size
            let gicon = this._icons.get_icon("inactive-unoccupied");
            let icon_size = 14;

            // Handle the active state
            if (workspace.active) {
                dotsContainer.add_style_class_name("active");
                gicon = this._icons.get_icon("active");
                dotsContainer.connect('button-release-event', () => Main.overview.show());
            } else {
                if (isOccupied) gicon = this._icons.get_icon("inactive-occupied");
                dotsContainer.track_hover = true;
                dotsContainer.connect('button-release-event', () => workspace.activate(global.get_current_time()));
            }

            // Handle the dynamic state
            if (isDynamic) {
                dotsContainer.add_style_class_name("dynamic");
                gicon = this.iconDynamic;
                icon_size = workspace.active ? 12 : 8;
            }

            // Create the icon
            dotsContainer.icon = new St.Icon({ gicon: gicon, icon_size: icon_size });
	        dotsContainer.set_child(dotsContainer.icon);

            // Add actor
            this.dots.add_actor(dotsContainer);
        }
    }
}