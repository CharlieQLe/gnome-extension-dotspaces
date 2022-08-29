'use strict';

const { Adw, Gio, GLib, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

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
    const _settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.dotspaces");
    
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    group.add(_createToggleRow(_settings, "Ignore Inactive Occupied Workspaces", "ignore-inactive-occupied-workspaces"));
    group.add(_createToggleRow(_settings, "Keep Activities", "keep-activities"));
    group.add(_createToggleRow(_settings, "Switch Workspaces By Panel Scroll", "panel-scroll"));

    window.add(page);
}

function _createToggleRow(settings, title, setting_name) {
    const row = new Adw.ActionRow({ title: title });
    const toggle = new Gtk.Switch({
        active: settings.get_boolean(setting_name),
        valign: Gtk.Align.CENTER,
    })
    settings.bind(setting_name, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
    row.add_suffix(toggle);
    row.activatable_widget = toggle;
    return row;
}