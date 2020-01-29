#!/usr/bin/env fish

echo 'Starting Chrome'
set cmd 'env DISPLAY=:0 chromium-browser --disable-gpu --headless --remote-debugging-port=9222'
echo "$cmd"
eval "$cmd &"
sleep 5

set pid (pgrep -f "chromium-browser")
echo "$pid"

set basedir (dirname "$0")
echo 'Gathering and scraping classes'
mkdir -p "$basedir/courses"
set date (date -Idate)
set coursefile "$basedir/courses/courses_$date.json"
set cmd "node $basedir/toplevel.js $basedir/studios.json $coursefile"
echo "$cmd"
eval "$cmd"

if test -e $coursefile
  echo 'All done, removing previous later values'
  node sendtomongo.js $coursefile
else
  echo 'Something went wrong, holding off on importing'
end

echo "Killing chrome"
kill -9 $pid
