'use strict';

const { Adw, Gio, GLib, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { Settings } = Me.imports.constants;

/**
 * Like `extension.js` this is used for any one-time setup like translations.
 *
 * @param {ExtensionMeta} meta - An extension meta object, described below.
 */
function init(meta) { }

/**
 * This function is called when the preferences window is first created to fill
 * the `Adw.PreferencesWindow`.
 *
 * This function will only be called by GNOME 42 and later. If this function is
 * present, `buildPrefsWidget()` will never be called.
 *
 * @param {Adw.PreferencesWindow} window - The preferences window
 */
function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.dotspaces");
    const builder = new Gtk.Builder();
    
    // Add the ui file
    builder.add_from_file(`${Me.path}/ui/main.xml`);
    
    // Add the general settings
    window.add(builder.get_object('general'));

    // Bind settings to switches
    Settings.ALL_TOGGLES.forEach(key => {
        const widget = builder.get_object(key.replaceAll('-', '_'));
        settings.bind(key, widget, 'active', Gio.SettingsBindFlags.DEFAULT);
    });
}