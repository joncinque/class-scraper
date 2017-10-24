#!/usr/bin/env bash
echo 'Starting Chrome'
cmd='google-chrome --disable-gpu --headless --remote-debugging-port=9222 &'
echo "$cmd"
eval "$cmd"

pid=$!
echo $pid

echo 'Gathering and scraping classes'
cmd='nodejs toplevel.js studios.json courses.json'
echo "$cmd"
eval "$cmd"

echo 'Killing Chrome'
kill -9 $pid

echo 'Uploading mongo import file'
sshpass -p "$PASSWORD" scp courses.json aggregate@"$IP":/home/aggregate/courses.json


echo 'All done, import into the database'
sshpass -p "$PASSWORD" ssh aggregate@"$IP" mongoimport -c courses -d aggregate --file /home/aggregate/courses.json --upsertFields name,start,studio,style,postcode,timezone
