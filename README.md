## Deploy 

Manually deploy
```sh 
# replace SLACK_WEBHOOK_URL
gcloud functions deploy slack-build-notification --set-env-vars=SLACK_WEBHOOK_URL=SLACK_WEBHOOK_URL --entry-point=subscribe --runtime=nodejs14 --trigger-topic cloud-builds
```

https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values?_ga=2.8598129.-533156821.1628693106