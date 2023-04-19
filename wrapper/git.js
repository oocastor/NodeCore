import SimpleGit from "simple-git";

function cloneRepo(repo, name) {
    return new Promise(async (res, rej) =>  {
        let path = await global.CONFIG.findOne({ entity: "path" }).value;
        let git = SimpleGit({baseDir: path, errors(err, result) {
            if(err) {
                res({error: true, msg: "Cannot clone git repo", payload: null});
                return;
            }
            if(result.exitCode === 0) {
                res({error: false, msg: "Repo successfully cloned", payload: null});
                return;
            }
        }});
        await git.clone(repo.uri, name);
    });
}

export {
    cloneRepo
}