'use strict';

const { Clutter, Gio, GObject, St } = imports.gi;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { Settings, SignalHandler, IconHandler } = Me.imports.common;

var DotspaceContainer = class DotspaceContainer extends imports.ui.panelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init(0.0, _('DotspaceContainer'));
        this.track_hover = false;

        // Get settings
        this._settings = new Settings();
        this._mutterSettings = new Gio.Settings({ schema: 'org.gnome.mutter' });
        
        // Create the icons
        this._iconActive = Gio.icon_new_for_string(`${Me.path}/icons/active-symbolic.svg`);
        this._iconInactiveOccupied = Gio.icon_new_for_string(`${Me.path}/icons/inactive-occupied-symbolic.svg`);
        this._iconInactiveUnoccupied = Gio.icon_new_for_string(`${Me.path}/icons/inactive-unoccupied-symbolic.svg`);
        this._iconDynamic = Gio.icon_new_for_string(`${Me.path}/icons/dynamic-symbolic.svg`);

        // Create the box to hold the dots 
	    this.dots = new St.BoxLayout({});
        this.add_child(this.dots);
	    this._update_dots();

        // Connect events
        this._settings.onChanged(Settings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES, this._update_dots);
        this._settings.onChanged(Settings.PANEL_SCROLL, _ => this._update_scroll(this._settings.getBoolean(Settings.PANEL_SCROLL)))
        this._signalHandler = new SignalHandler(this); 
        this._signalHandler.add_signal(global.workspace_manager, "active-workspace-changed", this._update_dots);
        this._signalHandler.add_signal(global.workspace_manager, "notify::n-workspaces", this._update_dots);
        this._signalHandler.add_signal(this._mutterSettings, "changed::dynamic-workspaces", this._update_dots);
        this._update_scroll(this._settings.getBoolean(Settings.PANEL_SCROLL));
    }

    /*
     * Handle destroy.
     */
    destroy() {
        // Disconnect events
        this._signalHandler.clear_signals()

        // Destroy dots
        this.dots.destroy();

        // Destroy settings
        this._settings.destroy();

        // Call original destroy
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
            const workspaceCount = global.workspace_manager.get_n_workspaces();
            if (this._settings.getBoolean(Settings.WRAP_WORKSPACES)) {
                index %= workspaceCount;
                if (index < 0) index += workspaceCount;
            } else {
                index = Math.min(Math.max(index, 0), workspaceCount);
            }
    
            // Change the workspace
            if (index >= 0 && index < workspaceCount) global.workspace_manager.get_workspace_by_index(index).activate(global.get_current_time());
        });
    }
    
    /*
     * Update the dot indicators.
     */
    _update_dots() {
        // Destroy all dots
        this.dots.destroy_all_children();

        // Get settings
        const ignoreInactiveOccupiedWorkspaces = this._settings.getBoolean(Settings.IGNORE_INACTIVE_OCCUPIED_WORKSPACES);
        const dynamicWorkspaces = this._mutterSettings.get_boolean('dynamic-workspaces');

        // Update workspace information
        const workspaceCount = global.workspace_manager.get_n_workspaces();

        // Get the number of windows that are on all workspaces
        const windowsOnAllWSCount = ignoreInactiveOccupiedWorkspaces ? 0 : global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspaceCount; i++) {
            // Get the current workspace
            const workspace = global.workspace_manager.get_workspace_by_index(i);

            // Check if this workspace is occupied by windows by getting the windows on a workspace then subtracting the windows that exist on all workspaces
            const isOccupied = !ignoreInactiveOccupiedWorkspaces && workspace.list_windows().length - windowsOnAllWSCount > 0;

            // Get if this is the dynamic workspace
            const isDynamic = dynamicWorkspaces && i === workspaceCount - 1;
            
            // Create the new workspace indicator
            const dotsContainer = new St.Bin({ visible: true, reactive: true, can_focus: false, track_hover: true });
            
            // Add the style class
            dotsContainer.add_style_class_name("dotspaces-indicator");

            // Default icon name and size
            let gicon = this._iconInactiveUnoccupied;
            let icon_size = 14;

            // Handle the active state
            if (workspace.active) {
                // Add the style class and set the icon
                dotsContainer.add_style_class_name("active");
                gicon = this._iconActive;

                // Toggle the overview on clicking the active workspace
                dotsContainer.connect('button-release-event', () => {
                    if (Main.overview._visible) Main.overview.hide();
                    else Main.overview.show();
                });
            } else {
                // Set the icon if this workspace is occupied
                if (isOccupied) gicon = this._iconInactiveOccupied;
                
                // Change workspace on clicking the desired workspace
                dotsContainer.connect('button-release-event', () => workspace.activate(global.get_current_time()));
            }

            // Handle the dynamic state
            if (isDynamic) {
                dotsContainer.add_style_class_name("dynamic");
                gicon = this._iconDynamic;
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