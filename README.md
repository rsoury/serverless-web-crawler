# Serverless Web Crawler

Serverless Web Crawler that executes for an indefinite amount of time. Perfect for Crawling Jobs that last longer than a minute and only need to be executed once or twice a month.

This boilerplate library can be used to deploy a completely severless workflow to AWS that allows for multi-step web crawling.
It runs a web crawler in a Docker Container that is managed by AWS Fargate.
The AWS Fargate proceess is triggered in an AWS Step Functions Workflow.
This allows you to extend the workflow and prepare data for the Web Crawler or manipulate the data produced by the Web Crawler.

AWS Step Functions serve as a really good initiator for Fargate processes as they can be triggered by a schedule or a HTTP Request.
AWS Step Functions can also trigger Notifications via SNS for when processes fail or complete.
AWS Step Functions is also serverless by default, requiring no compute resources until it's executed.

## Getting Started

### Set up your environment file

1. Copy `.env.example` to `.env.development` or `.env.production` depending on which environment you're configuring
2. Add your values to the environment dotenv file.

#### Environment Variables vs Argument Parameters

It's important to distinguish between Environment and Argument parameters.  
Environment variables should configure how the crawler interfaces with its environment. This includes where it transmits data, which email is notified via SNS, which AWS Credentials to use, etc.  
Argument parameters should configure how the crawler operates. These are settings that directly change the way the crawler runs. This includes modifying how many concurrent browsers/requests are executed, whether TOR is used, which storage mechanism to use, etc.

### Local

In Development:

```shell
yarn dev -r screenshot -p url=https://www.webdoodle.com.au/ --with-ui
```

In Production:

```shell
yarn start -r screenshot -p url=https://www.webdoodle.com.au/ --with-ui
```

### Docker

The Docker Image will only work for a production environment. Be sure to configure your `.env.production` dotenv file before building your Docker Image

Build Docker Image

```shell
docker build -t serverless-web-crawl:latest .
```

Run Docker Container Locally

```shell
docker run --rm -it serverless-web-crawl:latest start -r screenshot -p url=https://www.webdoodle.com.au/ -s s3
```

#### AWS ECR Settings

To configure settings used to push the Docker Image to AWS ECR, please see `./bin/deploy_container.sh`

### Passing Parameters

To learn what parameters can be passed to the crawler, please see `./lib/constants`  
Environment variables are set here `./lib/constants/env.js`  
Argument parameters are set here `./lib/constants/args.js`

## Features

This repository is full of features to simplify getting started with a Serverless Web Crawl.

- Puppeteer Concurrency using `puppeteer-cluster`
- Puppeteer Addons using `puppeteer-extra`
- User Agent Masking
- Optionally use Tor Proxy (to really avoid detection)

## Building and Deploying Docker Image

Use the script provided: `./bin/deploy_container.sh`

## Developing a Crawl Script

Refer to the example Crawl Script that takes a Screenshot of the URL provided through a parameter - `./scripts/screenshot.js`  
Create new scripts by creating a new file in `./scripts/` folder, then exporting an `async function(){}` 

## Deploy to AWS

```shell
yarn deploy
```

You can execute the deployed API (if you've used a HTTP event to trigger the state machine) like so:

```shell
curl https://5jh0zty1c3.execute-api.ap-southeast-2.amazonaws.com/prod/ -X POST -d '{"command": "start --run screenshot --params url=https://www.webdoodle.com.au/ --concurrency 1 --storage s3"}'
```

## Example State Machine Definition

```yaml
id: Crawl
events:
  - http:
      path: "/"
      method: "POST"
  # - schedule:
  #     rate: rate(24 hours)
  #     enabled:
  #       # ${self:custom.scheduleEnabled.${opt:stage, self:provider.stage}, false}
  #       false
  #     input:
  #       executionId.$: $$.Execution.Id
  #       executionName.$: $$.Execution.Name
notifications:
  ABORTED:
    - sns: !Ref WebCrawlNotificationsTopic
  FAILED:
    - sns: !Ref WebCrawlNotificationsTopic
  TIMED_OUT:
    - sns: !Ref WebCrawlNotificationsTopic
  SUCCEEDED:
    - sns: !Ref WebCrawlNotificationsTopic
role:
  Fn::GetAtt: [StateMachinePassRole, Arn]
definition:
  Comment: "Serverless Web Crawl"
  StartAt: PullProducts
  States:
    PullProducts:
      Type: Task
      Resource: "arn:aws:states:::ecs:runTask.sync"
      Parameters:
        LaunchType: "FARGATE"
        Cluster: "#{ECSCluster}"
        TaskDefinition: "#{FargateTaskDefinition}"
        NetworkConfiguration:
          AwsvpcConfiguration:
            Subnets:
              - "#{PublicSubnetOne}"
              - "#{PublicSubnetTwo}"
            AssignPublicIp: ENABLED
        Overrides:
          ContainerOverrides:
            - Name: "#{ServiceName}"
              Command:
                - start
                - --run
                - products
                - --cloud
                - --concurrency
                - "6"
                - --tor
              Environment:
                - Name: EXECUTION_ID
                  Value.$: $$.Execution.Id
                - Name: EXECUTION_NAME
                  Value.$: $$.Execution.Name
      Next: Check
    Check:
      Type: Task
      Resource:
        Fn::GetAtt: [checkCrawl, Arn]
      Parameters:
        executionId.$: "$$.Execution.Id"
        executionName.$: "$$.Execution.Name"
        storeId.$: "$$.Execution.Name"
      ResultPath: "$.check"
      Next: DetermineActionOnProducts
    FailedToPullProducts:
      Type: Fail
      Cause: "No products pulled."
    DetermineActionOnProducts:
      Type: Choice
      Choices:
        - Variable: "$.check"
          NumericEquals: 0
          Next: FailedToPullProducts
      Default: Enrich
    Enrich:
      Type: Parallel
      Branches:
        - StartAt: ProductAttributes
          States:
            ProductAttributes:
              Type: Task
              Resource: "arn:aws:states:::ecs:runTask.sync"
              Parameters:
                LaunchType: "FARGATE"
                Cluster: "#{ECSCluster}"
                TaskDefinition: "#{FargateTaskDefinition}"
                NetworkConfiguration:
                  AwsvpcConfiguration:
                    Subnets:
                      - "#{PublicSubnetOne}"
                      - "#{PublicSubnetTwo}"
                    AssignPublicIp: ENABLED
                Overrides:
                  ContainerOverrides:
                    - Name: "#{ServiceName}"
                      Command:
                        - start
                        - --run
                        - product/attributes
                        - --cloud
                        - --concurrency
                        - "6"
                        - --tor
                      Environment:
                        - Name: EXECUTION_ID
                          Value.$: $$.Execution.Id
                        - Name: EXECUTION_NAME
                          Value.$: $$.Execution.Name
              End: true
        - StartAt: ProductPages
          States:
            ProductPages:
              Type: Task
              Resource: "arn:aws:states:::ecs:runTask.sync"
              Parameters:
                LaunchType: "FARGATE"
                Cluster: "#{ECSCluster}"
                TaskDefinition: "#{FargateTaskDefinition}"
                NetworkConfiguration:
                  AwsvpcConfiguration:
                    Subnets:
                      - "#{PublicSubnetOne}"
                      - "#{PublicSubnetTwo}"
                    AssignPublicIp: ENABLED
                Overrides:
                  ContainerOverrides:
                    - Name: "#{ServiceName}"
                      Command:
                        - start
                        - --run
                        - product/pages
                        - --cloud
                        - --concurrency
                        - "6"
                        - --tor
                      Environment:
                        - Name: EXECUTION_ID
                          Value.$: $$.Execution.Id
                        - Name: EXECUTION_NAME
                          Value.$: $$.Execution.Name
              Next: ProductSearchResults
            ProductSearchResults:
              Type: Task
              Resource: "arn:aws:states:::ecs:runTask.sync"
              Parameters:
                LaunchType: "FARGATE"
                Cluster: "#{ECSCluster}"
                TaskDefinition: "#{FargateTaskDefinition}"
                NetworkConfiguration:
                  AwsvpcConfiguration:
                    Subnets:
                      - "#{PublicSubnetOne}"
                      - "#{PublicSubnetTwo}"
                    AssignPublicIp: ENABLED
                Overrides:
                  ContainerOverrides:
                    - Name: "#{ServiceName}"
                      Command:
                        - start
                        - --run
                        - product/search-results
                        - --cloud
                        - --concurrency
                        - "6"
                      Environment:
                        - Name: DISABLE_TOR_PROXY
                          Value: "true"
                        - Name: EXECUTION_ID
                          Value.$: $$.Execution.Id
                        - Name: EXECUTION_NAME
                          Value.$: $$.Execution.Name
              End: true
      Next: Merge
    Merge:
      Type: Task
      Resource: "arn:aws:states:::ecs:runTask.sync"
      Parameters:
        LaunchType: "FARGATE"
        Cluster: "#{ECSCluster}"
        TaskDefinition: "#{FargateTaskDefinition}"
        NetworkConfiguration:
          AwsvpcConfiguration:
            Subnets:
              - "#{PublicSubnetOne}"
              - "#{PublicSubnetTwo}"
            AssignPublicIp: ENABLED
        Overrides:
          ContainerOverrides:
            - Name: "#{ServiceName}"
              Command:
                - start
                - --run
                - merge
                - --cloud
              Environment:
                - Name: DISABLE_TOR_PROXY
                  Value: "true"
                - Name: EXECUTION_ID
                  Value.$: $$.Execution.Id
                - Name: EXECUTION_NAME
                  Value.$: $$.Execution.Name
              Cpu: 256
              Memory: 512
      Retry:
        - ErrorEquals:
            - "States.TaskFailed"
          IntervalSeconds: 60
          MaxAttempts: 3
          BackoffRate: 5
      Next: PrepareData
    PrepareData:
      Type: Task
      Resource: arn:aws:states:::states:startExecution
      Parameters:
        Input:
          parentExecutionId.$: "$$.Execution.Id"
          parentExecutionName.$: "$$.Execution.Name"
        StateMachineArn: ${self:resources.Outputs.InventorySyncDataPrepare.Value}
      End: true
```
