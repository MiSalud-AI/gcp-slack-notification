const { IncomingWebhook } = require('@slack/webhook');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
// Read a url from the environment variables

// Initialize
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

exports.subscribe = pubsubMessage => {
    // Print out the data from Pub/Sub, to prove that it worked
    const build = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
    if (build.status === 'WORKING' || build.status === 'SUCCESS' || build.status === 'FAILURE') {
        console.log(`build info ${JSON.stringify(build)}`);
        const message = generateSlackMessage(build);
        (async () => {
            try {
                await webhook.send(message);
            } catch (err) {
                console.log(err); // TypeError: failed to fetch
            }
        })();
    }
}

const generateSlackMessage = (build) => {
    let repoName = build.substitutions.REPO_NAME;
    // ignore none ci/cd builds
    if (repoName === undefined) {
        return
    }
    let triggerName = build.substitutions.TRIGGER_NAME;
    let shortSHA = build.substitutions.SHORT_SHA;
    let branchName = build.substitutions.BRANCH_NAME;
    let projectId = build.projectId.toLowerCase();
    let status = build.status.toLowerCase();
    let buildId = build.id.split("-")[0];

    // add status emoji
    let msg = ''
    switch (status) {
        case 'success':
            msg += ':gh-green:'
            break;
        case 'working':
            msg += ':construction:'
            break;
        case 'failure':
            msg += ':fire:'
            break;
    }

    // TODO: get build type (pr or deploy)

    msg += ` DEPLOY - `
    // add environment name
    if (projectId.includes("development")) {
        msg += "DEVELOPMENT"
    } else if (projectId.includes("qa")) {
        msg += "QA"
    } else if (projectId.includes("stage")) {
        msg += "STAGE"
    } else {
        msg += "PRODUCTION"
    }

    let repoURL = `https://github.com/MiSalud-AI/${repoName}/commits/${branchName}`
    return {
        mrkdwn: true,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${msg}\n${status} in build <${build.logUrl}|${triggerName}:${buildId}> of ${repoName} - (<${repoURL}|${branchName}:${shortSHA}>)`,
                },
            }
        ]
    }
}