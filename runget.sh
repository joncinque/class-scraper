#!/usr/bin/env bash
cmd="phantomjs --ssl-protocol=any --debug=false getcourse.js MBO 1991 Chelsea"
echo $cmd
eval $cmd
