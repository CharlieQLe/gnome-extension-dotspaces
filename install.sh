#!/bin/bash

EXTENSION_PATH="$HOME/.local/share/gnome-shell/extensions"
EXTENSION_NAME="dotspaces@charlieqle"

rm -r "$EXTENSION_PATH/$EXTENSION_NAME" 2> /dev/null
cp -r "$EXTENSION_NAME" "$EXTENSION_PATH" && echo "Log out and log back in to load extension!"

