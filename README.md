## Deploy 

```sh 
gcloud functions deploy slack-build-notification --set-env-vars=SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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 --entry-point=subscribe --runtime=nodejs14 --trigger-topic cloud-builds
```