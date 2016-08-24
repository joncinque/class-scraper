#!/usr/bin/env bash
cmd="phantomjs --load-images=false --web-security=false --ssl-protocol=any --ignore-ssl-errors=true getcourse.js MBO 23194"
echo $cmd
eval $cmd
