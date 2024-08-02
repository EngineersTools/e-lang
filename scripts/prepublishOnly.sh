#!/usr/bin/env bash
# /scripts/prepublishOnly.sh

# make a copy of the manifest to swap back in
cp package.json package.json.real

# give vsce a manifest it views as "valid"
# replace:  "name" : "@eng-tools/e-lang",
# with    :  "name" : "e-lang",

sed --regexp-extended '/"name"\s*:/ s#@[a-zA-Z\\-]+/##' package.json.real > package.json

# or maybe prefix with npx
vsce package

# now that it's built, restore the manifest to the one we'll use to publish
mv package.json.real package.json