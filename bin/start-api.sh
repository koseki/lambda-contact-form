#! /bin/bash

echo
echo "You need to execute 'sam build' when you change the code."
echo

set -ex

DIR=$(dirname $0)

cd $DIR
source config
cd ..
ABSPATH=$(pwd)

sam build
sam local start-api --env-vars env.json --static-dir $ABSPATH/static
