#!/bin/bash

LOG=logs/main.log

if [ $EUID != 0 ]; then
	echo "0"
	exit
fi

if [[ $steam_command == "steam-native" ]]; then
  library_path="$LD_LIBRARY_PATH:./bin"
else
  library_path="$(/home/rosnegaruda/.local/share/Steam/ubuntu12_32/steam-runtime/run.sh printenv LD_LIBRARY_PATH):./bin"
fi

$(which node || which nodejs) app >$LOG