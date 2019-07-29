#! /bin/bash

set -ex

DIR=$(dirname $0)

cd $DIR
source config

cd ..

sam deploy --template-file packaged.yaml --stack-name $PROJECT_NAME_STAGING --capabilities CAPABILITY_IAM
