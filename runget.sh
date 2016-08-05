#!/usr/bin/env bash
cmd="phantomjs --load-images=false --web-security=false --ssl-protocol=any --ignore-ssl-errors=true getcourse.js"
echo $cmd
eval $cmd
