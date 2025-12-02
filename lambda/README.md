# EventBridge Configuration

## staging-governor-discord

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload

```json
{
  "source": "aws.events",
  "functionType": "runDiscordGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-governor-discord

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runDiscordGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-governor-ai

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `1 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runAiGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-governor-ai

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `1 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runAiGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-addAllItemsToAiQueue

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Cron-based schedule`
- Rate expression: `0 3 * * ? *` (02:00 every day)
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "addAllItemsToAiQueue"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-addAllItemsToAiQueue

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Cron-based schedule`
- Rate expression: `0 2 * * ? *` (02:00 every day)
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "addAllItemsToAiQueue"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-addAllItemsToForumQueue

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Cron-based schedule`
- Rate expression: `30 0 * * ? *` (00:30 every day)
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "addAllItemsToForumQueue"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-addAllItemsToForumQueue

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Cron-based schedule`
- Rate expression: `30 0 * * ? *` (00:00 every day)
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "addAllItemsToForumQueue"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-governor-forum

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runForumGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-governor-forum

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runForumGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-lambda-stats

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runLambdaStats"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-lambda-stats

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runLambdaStats"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-governor-shell-users

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `6 hours`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runShellUserGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-governor-shell-users

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `6 hours`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runShellUserGovernor"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`

## staging-refresh-user-project-scores

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `staging-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runRefreshUserProjectScores"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA`

## prod-refresh-user-project-scores

- Occurrence: `Recurring schedule`
- Time zone: `UTC`
- Schedule type: `Rate-based schedule`
- Rate expression: `10 minutes`
- Flexible time window: `Off`
- Target API: `AWS Lambda - Invoke`
- Invoke: `prod-lambda`
- Payload:

```json
{
  "source": "aws.events",
  "functionType": "runRefreshUserProjectScores"
}
```

- Execution role: `Amazon_EventBridge_Scheduler_LAMBDA_Prod`