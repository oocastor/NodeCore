import { Octokit } from "octokit";

async function getUserRepos() {
    let { pat } = global.CONFIG.findOne({ entity: "github" }).value;

    const octokit = new Octokit({
        auth: pat
    });

    let repos = [...(await octokit.request('GET /user/repos')).data].map(m => {
        return {
            name: m.name,
            uri: m.git_url,
            lang: m.language
        }
    });

    return repos;
}

export {
    getUserRepos
}