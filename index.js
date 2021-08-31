
const dateFormat = require('dateformat');
const { IncomingWebhook } = require('@slack/webhook');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
// Read a url from the environment variables

// Initialize
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

exports.subscribe = pubsubMessage => {
    // Print out the data from Pub/Sub, to prove that it worked
    const build = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
    if (build.status === 'WORKING' || build.status === 'SUCCESS' || build.status === 'FAILURE') {
        const message = generateSlackMessage(build);
        // console.log(`slack message ${message}`);
        (async () => {
            try {
                console.log(`build info ${JSON.stringify(build)}`);
                await webhook.send(message);
            } catch (err) {
                console.log(err); // TypeError: failed to fetch
            }
        })();
    }
}

const generateSlackMessage = (build) => {
    let repoName = build.substitutions.REPO_NAME;
    let shortSHA = build.substitutions.SHORT_SHA;
    let branchName = build.substitutions.BRANCH_NAME;


    let state = ""
    switch (build.status) {
        case 'SUCCESS':
            state = ':white_check_mark: *SUCCESS*'
            break;
        case 'WORKING':
            state = ':construction: *WORKING*'
            break;
        case 'FAILURE':
            state = ':fire: *FAILURE*'
            break;
    }

    // This is not a repo
    if (repoName === undefined) {
        let blah = `${state} \n`
        for (const [key, value] of Object.entries(build.substitutions)) {
            blah += `${key}: ${value}\n`;
        }
        return {
            text: "CI/CD",
            mrkdwn: true,
            blocks: [
                {

                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: blah,
                    },
                }
            ]
        }
    }

    return {
        text: "CI/CD",
        mrkdwn: true,
        blocks: [
            {

                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${state} \n${repoName} - <${build.logUrl}|${branchName}>:${shortSHA}`,
                },
            }
        ]
    }
}