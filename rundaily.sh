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
COURSEFILE="$BASEDIR/courses/courses_$(date -Idate).json"
cmd="nodejs $BASEDIR/toplevel.js $BASEDIR/studios.json $COURSEFILE"
echo "$cmd"
eval "$cmd"

if [[ -s $COURSEFILE ]]
then
  echo 'All done, removing previous later values'
  mongo aggregate --eval 'db.courses.remove({start: { $gt: new Date() } })'
  echo 'Inserting new ones'
  upsertfields="name,start,studio,style,postcode,timezone"
  mongoimport -c courses -d aggregate --file "$coursefile" --upsertFields "$upsertfields"
else
  echo 'Something went wrong, holding off on importing'
fi
