const { Clutter, Gio, GObject, St } = imports.gi;
const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const { SignalHandler } = Me.imports.signal_handler;

var DotspaceContainer = class DotspaceContainer extends imports.ui.panelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init(0.0, _('DotspaceContainer'));
        this.track_hover = false;

        // Get Mutter settings
        this.mutterSettings = new Gio.Settings({ schema: 'org.gnome.mutter' });

        // Create the box to hold the dots 
	    this.dots = new St.BoxLayout({});
        this.add_child(this.dots);
	    this._update_dots();

        // Connect events
        this._signalHandler = new SignalHandler(this); 
        this._signalHandler.add_signal(global.workspace_manager, 'active-workspace-changed', this._update_dots);
        this._signalHandler.add_signal(global.workspace_manager, 'notify::n-workspaces', this._update_dots);
        this._signalHandler.add_signal(Main.panel, 'scroll-event', this._cycle_workspaces);
    }

    /*
     * Handle destroy.
     */
    destroy() {
        // Disconnect events
        this._signalHandler.clear_signals()

        // Destroy
        this.dots.destroy();
        super.destroy();
    }

    /*
     * Update the dot indicators.
     */
    _update_dots() {
        // Destroy all dots
        this.dots.destroy_all_children();

        // Update workspace information
        let workspace_count = global.workspace_manager.get_n_workspaces();

        // Check if dynamic workspaces are enabled 
        const isDynamicWorkspacesEnabled = this.mutterSettings.get_boolean('dynamic-workspaces');

        // Get the number of windows that are on all workspaces
        let windowsOnAllWSCount = global.display.list_all_windows().filter(w => w.is_on_all_workspaces() && w.get_wm_class() !== "Gnome-shell").length;

        // Create dots
        for (let i = 0; i < workspace_count; i++) {
            let workspace = global.workspace_manager.get_workspace_by_index(i);

            // Check if this workspace is occupied by windows by getting the windows on a workspace then subtracting the windows that exist on all workspaces
            let isOccupied = workspace.list_windows().length - windowsOnAllWSCount > 0;

            // Get if this is the dynamic workspace
            let isDynamic = isDynamicWorkspacesEnabled && i === workspace_count - 1;
            
            // Create the new workspace indicator
            let dotsContainer = new St.Bin({ visible: true, reactive: true, can_focus: false, track_hover: false });
            
            // Add the style class
            dotsContainer.add_style_class_name("dotspaces-indicator");

            // Default icon name and size
            let icon_name = "radio-symbolic";
            let icon_size = 14;

            // Handle the active state
            if (workspace.active) {
                dotsContainer.add_style_class_name("active");
                icon_name = "media-record-symbolic";
                icon_size = 16;
                dotsContainer.connect('button-release-event', () => Main.overview.show());
            } else {
                if (isOccupied) {
                    icon_name = "radio-checked-symbolic";
                }
                dotsContainer.track_hover = true;
                dotsContainer.connect('button-release-event', () => this._change_workspace(i));
            }

            // Handle the dynamic state
            if (isDynamic) {
                dotsContainer.add_style_class_name("dynamic");
                icon_name = "list-add-symbolic";
                icon_size = workspace.active ? 12 : 8;
            }

            // Create the icon
            dotsContainer.icon = new St.Icon({ icon_name: icon_name, icon_size: icon_size });
	        dotsContainer.set_child(dotsContainer.icon);

            // Add actor
            this.dots.add_actor(dotsContainer);
        }
    }

    /**
     * Change the workspace to the workspace of the specified index.
     * 
     * @param {Number} index 
     */
    _change_workspace(index) {
        global.workspace_manager.get_workspace_by_index(index).activate(global.get_current_time());
    }

    /**
     * Handles cycling through workspaces with the scroll-wheel.
     * 
     * @param {*} _ 
     * @param {Clutter.Event} event 
     */
    _cycle_workspaces(_, event) {
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
        if (index >= 0 && index < workspace_count) this._change_workspace(index);
    }
}