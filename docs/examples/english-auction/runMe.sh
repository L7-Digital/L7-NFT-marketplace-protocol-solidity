#!/bin/bash

set -x -e

if [ "$1" = "success" ]; then
    node ./4a-seller-accepts-offer-on-time.js
fi

if [ "$1" = "expired" ]; then
    node ./4b-seller-accepts-offer-out-of-time.js
fi