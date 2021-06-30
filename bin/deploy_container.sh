#!/bin/bash

# This script is using to build and push docker image to ECR repository

AWS_PROFILE=default
REGION=ap-southeast-2
REPO_NAME=serverless-web-crawl
TAG=latest

# A way to pass in options.
while getopts p:r:n:t: option
do
	case "${option}"
in
	p) AWS_PROFILE=${OPTARG};;
	r) REGION=${OPTARG};;
	n) REPO_NAME=${OPTARG};;
	t) TAG=${OPTARG};;
esac
done

echo "Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo "Repository: $REPO_NAME:$TAG"

# Get the account number associated with the current IAM credentials
ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)

if [ $? -ne 0 ]
then
    exit 255
fi


# If the repository doesn't exist in ECR, create it.
echo 'Checking repo existance...'
aws ecr describe-repositories --region $REGION --profile $AWS_PROFILE --repository-names "${REPO_NAME}" > /dev/null 2>&1

if [ $? -ne 0 ]
then
    echo "Repo $REPO_NAME doesn't exist, try to create a new one"
    aws ecr create-repository --region $REGION --profile $AWS_PROFILE --repository-name "${REPO_NAME}" > /dev/null
fi

echo 'Login to ECR Repository...'

AWS_ECR_PASSWORD=$(aws ecr get-login-password --region $REGION --profile $AWS_PROFILE)
docker login --username AWS --password $AWS_ECR_PASSWORD $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo 'Building and pushing docker image to ECR repository...'
docker build -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:$TAG .

if [ "$1" != "true" ]; then
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:$TAG
fi

echo 'Publish docker image completed'
