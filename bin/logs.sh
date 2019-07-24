#! /bin/bash

cd $(dirname $0)
source config

sam logs --profile $1 -n $PROJECT_NAME --region $2
