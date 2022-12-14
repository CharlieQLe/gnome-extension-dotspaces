# DOTSPACES

## What is this?

A simple workspace indicator extension for the GNOME Desktop Environment. It displays each workspace as a dot. Empty workspaces are represented as a ring, the current workspace is represented as a filled circle, and occupied but non-active workspaces are represented as a ring with a dot in the center. If dynamic workspaces are enabled, the last workspace is represented as a plus.

This even allows switching workspaces by simply scrolling over the panel! This can be disabled in favor of simply scrolling over the set of workspaces itself.

This does ***not*** and ***will not*** have drag-and-drop workspaces for workspace management without the overview. This is a **simple** way to see and switch between all of the workspaces.

## What versions of GNOME does DOTSPACES support?

At the moment, it has only been tested with GNOME 42 and 43.

## How do I install?

This can be installed from [extensions.gnome.org]() at the following link: [https://extensions.gnome.org/extension/5347/dotspaces/]()

Tar packages are not available yet.

The source can be used by cloning this repository and running the install script like so:

```
git clone https://github.com/CharlieQLe/gnome-extension-dotspaces.git
sh install.sh
```

After the installation, simply log out and log back in and it should show up in the Extensions application!
