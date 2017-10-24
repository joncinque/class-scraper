#!/usr/bin/env bash

echo 'Check if chrome needs to be started'
cmd="google-chrome --disable-gpu --headless --remote-debugging-port=9222"
rc=$(pgrep -fc "$cmd")
if [[ $rc -lt 1 ]]
then
  echo 'Starting Chrome'
  echo "$cmd"
  eval "$cmd" &
  sleep 5
fi

pid=$(pgrep -f "$cmd")
echo "$pid"

BASEDIR=$(dirname "$0")
echo 'Gathering and scraping classes'
mkdir -p "$BASEDIR/courses"
coursefile="$BASEDIR/courses/courses_$(date -Idate).json"
cmd="nodejs $BASEDIR/toplevel.js $BASEDIR/studios.json $coursefile"
echo "$cmd"
eval "$cmd"

echo 'All done, import into the database'
upsertfields="name,start,studio,style,postcode,timezone"
mongoimport -c courses -d aggregate --file "$coursefile" --upsertFields "$upsertfields"
