const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.jira') });

function getJiraConfig() {
    const host = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_USER_EMAIL;
    const apiToken = process.env.token;
    const projectKey = process.env.JIRA_PROJECT_KEY;

    if (!host || !email || !apiToken) {
        throw new Error('Required configuration in .env.jira is missing');
    }

    return { host, email, apiToken, projectKey };
}

const axios = require('axios');

class JiraClient {
    constructor(config) {
        this.config = config;
        this.client = axios.create({
            baseURL: `${config.host}/rest/api/3`,
            auth: {
                username: config.email,
                password: config.apiToken
            }
        });
    }

    async getIssue(key) {
        return this.client.get(`/issue/${key}`);
    }
}

async function main() {
    try {
        const config = getJiraConfig();
        const client = new JiraClient(config);
        const issueKey = process.argv[2] || 'GEI-264';
        
        console.log(`\nFetching ${issueKey} from ${config.host}...\n`);
        const response = await client.getIssue(issueKey);
        const issue = response.data;

        console.log(`=== Issue: ${issue.key} ===`);
        console.log(`Summary: ${issue.fields.summary}`);
        console.log(`Type:    ${issue.fields.issuetype?.name}`);
        console.log(`Status:  ${issue.fields.status?.name}`);

        if (issue.fields.description) {
            console.log(`\nDescription (ADF):\n${JSON.stringify(issue.fields.description, null, 2)}`);
        } else {
            console.log(`\nDescription: None`);
        }
    } catch (err) {
        const errorMsg = err.response?.data?.errorMessages || err.response?.data?.message || err.message;
        console.error('Error fetching issue:', errorMsg);
        if (err.response?.status === 401) {
            console.error('\nAuthentication failed. Please check your token and email in .env.jira');
        }
    }
}

main();
