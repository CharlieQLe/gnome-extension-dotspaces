# DOTSPACES

## What is this?

A simple workspace indicator extension for the GNOME Desktop Environment. It displays each workspace as a dot. Empty workspaces are represented by the unselected radio button icon (```radio-symbolic```), the current workspace is represented as a dot (```media-record-symbolic```), and occupied but non-active workspaces are represented as a selected radio button (```radio-checked-symbolic```). These icons are based off of the stock GNOME 42 icons, other icons have *not been tested*.

This even allows switching workspaces by simply scrolling over the panel! This likely conflicts with other extensions that also use the scroll wheel on the panel for other functions, so it is recommended to 

This does ***not*** have drag-and-drog workspaces for workspace management without the overview. This is a simple way to see the number of work

## What versions of GNOME does DOTSPACES support?

At the moment, it has only been tested with GNOME 42.

## How do I install?

Tar packages and an extension page are not available yet. However, the source can be used by cloning this repository like so:

```
git clone https://github.com/CharlieQLe/dotspaces.git $HOME/.local/share/gnome-shell/extensions/dotspaces@charlieqle/
```

After cloning the repository, simply log out and log back in and it should show up in the Extensions application!

## TO-DO

* Refactor implementation to be more optimized (?)
* Add a settings page
    * Add the option to hide the icons of non-active, occupied workspaces
    * Add the option to keep the Activities button
    * Add the option to limit the workspace scrolling to the dotspaces container
    * Add the option to use different icons
* Publish on [extensions.gnome.org](https://extensions.gnome.org/)
