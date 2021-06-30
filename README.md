# Serverless Web Crawler

Serverlessly run a Web Crawler job for an indefinite amount of time.
Perfect for Crawling Jobs that are greater than a minute and only need to be executed a once or twice a month.

This boilerplate library can be used to deploy a completely severless workflow to AWS that allows for multi-step web crawling.
It runs a web crawler in a Docker Container that is managed by AWS Fargate.
The AWS Fargate proceess is triggered in an AWS Step Functions Workflow.
This allows you to extend the workflow and prepare data for the Web Crawler or manipulate the data produced by the Web Crawler.

AWS Step Functions serve as a really good initiator for Fargate processes as they can be triggered by a schedule or a HTTP Request.
AWS Step Functions can also trigger Notifications via SNS for when processes fail or complete.
AWS Step Functions is also serverless by default, requiring no compute resources until it's executed.

## Getting Started

```
yarn start -r screenshot -p url=http://google.com --with-ui
```

## Features

This repository is full of features to simplify getting started with a Serverless Web Crawl.

- Puppeteer Concurrency using `puppeteer-cluster`
- Puppeteer Addons using `puppeteer-extra`
- User Agent Masking
- Optionally use Tor Proxy (to really avoid detection)

## Building and Deploying Docker Image

Use the script provided: `./bin/deploy_container.sh`

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
    - sns: ${self:resources.Outputs.NotificationsTopic.Value}
  FAILED:
    - sns: ${self:resources.Outputs.NotificationsTopic.Value}
  TIMED_OUT:
    - sns: ${self:resources.Outputs.NotificationsTopic.Value}
  SUCCEEDED:
    - sns: ${self:resources.Outputs.NotificationsTopic.Value}
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
