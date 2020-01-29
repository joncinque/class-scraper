#!/usr/bin/env fish
cmd="env DISPLAY=:0 chromium-browser --disable-gpu --headless --remote-debugging-port=9222 &"
echo $cmd
eval $cmd
#cmd="ssh -L 0.0.0.0:9223:localhost:9222 localhost -N"
#echo $cmd
#eval $cmd
cmd="node chromegetcourse.js"
echo $cmd
eval $cmd
