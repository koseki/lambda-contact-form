#! /bin/bash

set -ex

DIR=$(dirname $0)

cd $DIR
source config
cd ..

sam build
sam local invoke -e event.json --env-vars env.json
