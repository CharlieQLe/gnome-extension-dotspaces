'use strict';

const { Adw, Gio, GLib, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { DotspaceSettings } = Me.imports.settings;

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
    const dotspaceSettings = DotspaceSettings.getNewSchema();
    const builder = new Gtk.Builder();
    
    // Add the ui file
    builder.add_from_file(`${Me.path}/ui/main.xml`);
    
    // Add the general settings
    window.add(builder.get_object('general'));

    // Bind settings to switches
    DotspaceSettings.getKeys().forEach(key => {
        const widget = builder.get_object(key.replaceAll('-', '_'));
        dotspaceSettings.bind(key, widget, 'active', Gio.SettingsBindFlags.DEFAULT);
    });
}