const { IncomingWebhook } = require('@slack/webhook');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
// Read a url from the environment variables

// Initialize
const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

exports.subscribe = pubsubMessage => {
    if (pubsubMessage.attributes.buildId){
        // Print out the data from Pub/Sub, to prove that it worked
        const build = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
        if (build.status === 'WORKING' || build.status === 'SUCCESS' || build.status === 'FAILURE' || build.status === 'CANCELLED') {
            console.log(`build info ${JSON.stringify(build)}`);
            const message = generateSlackMessage(build);
            (async () => {
                try {
                    await webhook.send(message);
                } catch (err) {
                    console.log(err); // TypeError: failed to fetch
                }
            })();
        } else {
            console.log(`build unknown status type ${JSON.stringify(build)}`);
        }
    } else if (pubsubMessage.attributes.eventType) {
        const event_type = pubsubMessage.attributes.eventType;
        const secretId = pubsubMessage.attributes.secretId.slice(30);
        const secretMetadata = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
        if (event_type === 'SECRET_VERSION_ADD' || event_type === "SECRET_VERSION_DESTROY") {
            console.log(`Event type ${event_type}. Metadata: ${JSON.stringify(secretMetadata)}`);
            const message = generateSecretSlackMessage(secretId, secretMetadata);
            (async () => {
                try {
                    await webhook.send(message);
                } catch (err) {
                    console.log(err); // TypeError: failed to fetch
                }
            })();
        } else {
            console.log(`secret unknown event type ${event_type}. Metadata: ${JSON.stringify(secretMetadata)}`);
        }
    }
}

const generateSecretSlackMessage = (secretId, secretMetadata) => {
    let version = secretMetadata.name.split("/")[5];
    let state = secretMetadata.state.toLowerCase();

    // add status emoji
    let msg = ':shushing_face:'

    msg += ` Secret - `
    // add environment name
    if (secretMetadata.name.includes("363532665815")) {
        msg += "DEVELOPMENT"
    } else if (secretMetadata.name.includes("997717717493")) {
        msg += "QA"
    } else if (secretMetadata.name.includes("834589263806")) {
        msg += "STAGE"
    } else if (secretMetadata.name.includes("805659935052")) {
        msg += "DEMO"
    } else {
        msg += "PRODUCTION"
    }

    let actionMsg
    switch (state) {
        case 'destroyed':
            actionMsg = `Version ${version} destroyed`
            break;
        case 'enabled':
            actionMsg = `New version ${version} added`
            break;
    }

    return {
        mrkdwn: true,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${msg}\n       *${secretId}* - ${actionMsg}`,
                },
            }
        ]
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
    let tagName = build.substitutions.TAG_NAME;
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
        case 'cancelled':
            msg += ':heavy_multiplication_x:'
            break;
    }

    // TODO: get build type (pr or deploy)

    msg += ` DEPLOY - `
    // add environment name
    if (projectId.includes("development")) {
        msg += "DEVELOPMENT"
    } else if (projectId.includes("qa2")) {
        msg += "QA2"
    } else if (projectId.includes("qa")) {
        msg += "QA" + (triggerName.includes("-2") ? "2" : triggerName.includes("-3") ? "3" : "1" ) // requested by luca
    } else if (projectId.includes("stage")) {
        msg += "STAGE"
    } else if (projectId.includes("demo")) {
        msg += "DEMO"
    } else {
        msg += "PRODUCTION"
    }

    let gitURL
    let gitText
    if (tagName == undefined) {
        gitURL = `https://github.com/MiSalud-AI/${repoName}/commits/${branchName}`
        gitText = `${branchName}:${shortSHA}`
    } else {
        gitURL = `https://github.com/MiSalud-AI/${repoName}/releases/tag/${tagName}`
        gitText = `${tagName}`
    }

    return {
        mrkdwn: true,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${msg}\nBuild ${triggerName} <${build.logUrl}|#${buildId}> (<${gitURL}|${gitText}>)`,
                },
            }
        ]
    }
}
