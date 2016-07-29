#!/usr/bin/env bash
cmd="phantomjs --ssl-protocol=any --ignore-ssl-errors=yes getclass.js"
echo $cmd
eval $cmd
