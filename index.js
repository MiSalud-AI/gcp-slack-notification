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

    let state = ''
    switch (build.status) {
        case 'SUCCESS':
            state += ':white_check_mark:'
            break;
        case 'WORKING':
            state += ':construction:'
            break;
        case 'FAILURE':
            state += ':fire:'
            break;
    }
    state += `CI/CD - ${build.projectId.toUpperCase()}`

    // This is not a repo
    if (repoName === undefined) {
        state += '\n'
        for (const [key, value] of Object.entries(build.substitutions)) {
            state += `${key}:${value}, `;
        }
        return {
            text: "CI/CD",
            mrkdwn: true,
            blocks: [
                {

                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: state,
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
                    text: `${state}\n${build.status.toLowerCase()} in build <${build.logUrl}|${build.id.split("-")[0]}> of ${repoName} - (${branchName}:${shortSHA})`,
                },
            }
        ]
    }
}