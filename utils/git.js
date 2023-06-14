import SimpleGit from "simple-git";

function cloneRepo(repo, dir) {
    return new Promise(async (res, rej) =>  {
        let path = global.CONFIG.findOne({ entity: "path" }).value;
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
        if(repo.extern == false || repo.extern == undefined) {
            //private repos
            let github = await global.CONFIG.findOne({ entity: "github" }).value;
            if(github.pat == "") {
                res({error: true, msg: "No github account credentials given", payload: null});
                return;
            }
            await git.clone(`https://${github.pat}@${repo.uri.replace("https://", "")}`, dir);
        } else {
            //external repos
            await git.clone(repo.uri, dir);
        }
    });
}

function pullRepo(dir) {
    return new Promise(async (res, rej) =>  {
        let path = global.CONFIG.findOne({ entity: "path" }).value;
        let git = SimpleGit({baseDir: `${path}/${dir}`, errors(err, result) {
            if(err) {
                res({error: true, msg: "Cannot update git repo", payload: null});
                return;
            }
            if(result.exitCode === 0) {
                res({error: false, msg: "Repo successfully updated", payload: null});
                return;
            }
        }});
        await git.pull();
    });
}

export {
    cloneRepo,
    pullRepo
}