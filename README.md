## Deploy 

```sh 
# replace SLACK_WEBHOOK_URL
gcloud functions deploy slack-build-notification --set-env-vars=SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL --entry-point=subscribe --runtime=nodejs14 --trigger-topic cloud-builds
```