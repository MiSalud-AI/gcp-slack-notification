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
    // ignore none ci/cd builds
    if (repoName === undefined) {
        return
    }
    let shortSHA = build.substitutions.SHORT_SHA;
    let branchName = build.substitutions.BRANCH_NAME;

    // add status emoji
    let msg = ''
    switch (build.status) {
        case 'SUCCESS':
            msg += ':white_check_mark:'
            break;
        case 'WORKING':
            msg += ':construction:'
            break;
        case 'FAILURE':
            msg += ':fire:'
            break;
    }

    // TODO: get build type (pr or deploy)

    msg += ` CI/CD - `
    // add environment name
    if (build.projectId.toLowerCase().includes("development")) {
        msg += "DEVELOPMENT"
    } else if (build.projectId.toLowerCase().includes("qa")) {
        msg += "QA"
    } else if (build.projectId.toLowerCase().includes("stage")) {
        msg += "STAGE"
    } else {
        msg += "PRODUCTION"
    }

    // This is not a repo
    // if (repoName === undefined) {
    //     return
    //     msg += '\n'
    //     for (const [key, value] of Object.entries(build.substitutions)) {
    //         msg += `${key}:${value}, `;
    //     }
    //     return {
    //         text: "CI/CD",
    //         mrkdwn: true,
    //         blocks: [
    //             {

    //                 type: 'section',
    //                 text: {
    //                     type: 'mrkdwn',
    //                     text: msg,
    //                 },
    //             }
    //         ]
    //     }
    // }

    let repoURL = `https://github.com/MiSalud-AI/${repoName}/commits/${branchName}`
    return {
        text: "CI/CD",
        mrkdwn: true,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${msg}\n${build.status.toLowerCase()} in build <${build.logUrl}|#${build.id.split("-")[0]}> of ${repoName} - (<${repoURL}|${branchName}:${shortSHA}>)`,
                },
            }
        ]
    }
}