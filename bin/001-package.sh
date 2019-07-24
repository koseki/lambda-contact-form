#! /bin/bash

set -ex

DIR=$(dirname $0)

cd $DIR
source config

cd ../lambda-contact-form/
npm clean-install --production

cd ..
sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket $S3_BUCKET_NAME

set +ex

echo
echo "Execute 002-deploy.sh"
echo
