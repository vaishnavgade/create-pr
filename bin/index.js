#!/usr/bin/env node
import 'dotenv/config';
import { execSync } from 'child_process';
import { graphql } from '@octokit/graphql';
import * as queries from '../graphql/queries.js';
import * as mutations from '../graphql/mutations.js';

console.log(`

██████╗██████╗ ███████╗ █████╗ ████████╗███████╗    ██████╗ ██████╗ 
██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗
██║     ██████╔╝█████╗  ███████║   ██║   █████╗      ██████╔╝██████╔╝
██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝      ██╔═══╝ ██╔══██╗
╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗    ██║     ██║  ██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝  ╚═╝

`);

//#region constants
const clientMutationId = 'create-pr';
const getRemoteGitUrlCommand = 'git config --get remote.origin.url';
const getCurrentGitBranchCommand = 'git branch --show-current';

const graphqlWithAuth = graphql.defaults({
    baseUrl: `${process.env.GITHUB_GRAPHQL_URL}`,
    headers: {
        authorization: `Bearer ${process.env.GITHUBPAT}`,
    },
});
//#endregion

//#region Get Owner and Repo values
let gitURL = '';
try {
    gitURL = execSync(getRemoteGitUrlCommand);
    console.log(`Git remote url: ${gitURL}`);
}
catch (error) {
    console.error(`The current directory might not be a git repo. ${error}`);
    process.exit(1) // mandatory (as per the Node.js docs)
}

let splitURL = new String(gitURL).split(':');
let ownerPlusRepo = splitURL[1].split('/');
const owner = ownerPlusRepo[0];
const repo = ownerPlusRepo[1].split('.')[0];

console.log(`owner: ${owner}`);
console.log(`repo/name: ${repo}`);

//#endregion

//#region Get Current Directory Git Branch
let gitBranch = '';
try {
    gitBranch = execSync(getCurrentGitBranchCommand);
    // remove leading newline so it won't be an issue while using this value in queries/mutations
    gitBranch = new String(gitBranch).replace(/(\n)/gm, "");
    console.log(`Git Branch: ${gitBranch}`);
}
catch (error) {
    console.error(`The current directory might not be a git repo. ${error}`);
    process.exit(1) // mandatory (as per the Node.js docs)
}
//#endregion

//#region Get first Commit
let getFirstCommit = `git log ${process.env.BASE_BRANCH_NAME}...${gitBranch} --oneline | tail -1`;
let firstCommit = '';
try {
    firstCommit = new String(execSync(getFirstCommit));
    console.log(`First Commit of current branch: ${firstCommit}`);
}
catch (error) {
    console.error(`Error while trying to get first commit. ${error}`);
    process.exit(1) // mandatory (as per the Node.js docs)
}
//#endregion

//#region Get User(s) Id(s) to be used as Assignee(s)/Reviewer(s)
const assigneeLogins = process.env.ASSIGNEE_LOGINS.split('|');
let assigneeIds = new Array(assigneeLogins.length);

for (let index = 0; index < assigneeLogins.length; index++) {
    assigneeIds[index] = await getUserIdsByLogin(assigneeLogins[index]);
}

const reviewerLogins = process.env.REVIEWERS_LOGINS.split('|');
let reviewerIds = new Array(reviewerLogins.length);

for (let index = 0; index < reviewerLogins.length; index++) {
    reviewerIds[index] = await getUserIdsByLogin(reviewerLogins[index]);    
}
//#endregion

//#region Get RepositoryId using Owner and Repo Name
const repoDetails = await graphqlWithAuth(queries.queryRepositoryByOwnerAndName,
    {
        owner: `${owner}`,
        name: `${repo}`
    }
);

let repositoryId = '';
if(repoDetails) {
    console.log(JSON.stringify(repoDetails));
    if (repoDetails.hasOwnProperty("repository")) {
        if (repoDetails["repository"].hasOwnProperty("id")) {
            repositoryId = repoDetails["repository"]["id"];
            console.log(`RepositoryId: ${repositoryId}`);
        }
    }
}
//#endregion

//#region Get PullRequestId and Create Pull Request using Git Branch, RepositoryId
const createdPullRequest = await graphqlWithAuth(mutations.mutationCreatePullRequestByInput, 
    {
        input: {
            baseRefName: `${process.env.BASE_BRANCH_NAME}`,
            clientMutationId: `${clientMutationId}`,
            headRefName: `${gitBranch}`,
            repositoryId: `${repositoryId}`,
            title: `${firstCommit}`
          }
    }
);

let pullRequestId = '';
if(createdPullRequest) {
    console.log(JSON.stringify(createdPullRequest));
    if(createdPullRequest.hasOwnProperty("createPullRequest")) {
        if (createdPullRequest["createPullRequest"].hasOwnProperty("pullRequest")) {
            if (createdPullRequest["createPullRequest"]["pullRequest"].hasOwnProperty("id")) { 
                pullRequestId = createdPullRequest["createPullRequest"]["pullRequest"]["id"];
                console.log(`PullRequestId: ${pullRequestId}`);
            }
        }    
    }
}
//#endregion

//#region Add Assignee to Pull Request
const addAssigneesToAssignable = await graphqlWithAuth(mutations.mutationAddAssigneesToAssignableByInput, 
    {
        input: {
            clientMutationId: `${clientMutationId}`,
            assignableId: `${pullRequestId}`,
            assigneeIds: assigneeIds
          }
    }
);

if(addAssigneesToAssignable){
    console.log(JSON.stringify(addAssigneesToAssignable));
}
//#endregion

//#region Request Reviews By Pull Request Id
const requestReviews = await graphqlWithAuth(mutations.mutationRequestReviewsByInput, 
    {
        input: {
            clientMutationId: `${clientMutationId}`,
            pullRequestId: `${pullRequestId}`,
            userIds: reviewerIds
          }
    }
);

if(requestReviews){
    console.log(JSON.stringify(requestReviews));
}
//#endregion

async function getUserIdsByLogin(login) 
{
    const userDetails = await graphqlWithAuth(queries.queryUserByLogin,
        {
            login: `${login}`
        }
    );

    if (userDetails) {
        console.log(JSON.stringify(userDetails));
        if (userDetails.hasOwnProperty("user")) {
            if (userDetails["user"].hasOwnProperty("id")) {
                console.log(`AssigneeId for ${login}: ${userDetails["user"]["id"]}`);
                return userDetails["user"]["id"];
            }
        }
    }
}