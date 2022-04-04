#!/usr/bin/env node
import 'dotenv/config';
import { execSync } from 'child_process';
import { graphql } from '@octokit/graphql';

console.log(`

██████╗██████╗ ███████╗ █████╗ ████████╗███████╗    ██████╗ ██████╗ 
██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗
██║     ██████╔╝█████╗  ███████║   ██║   █████╗      ██████╔╝██████╔╝
██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝      ██╔═══╝ ██╔══██╗
╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗    ██║     ██║  ██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝  ╚═╝

`);

//#region constants
const getRemoteGitUrlCommand = 'git config --get remote.origin.url';
const getCurrentGitBranchCommand = 'git branch --show-current';

const graphqlWithAuth = graphql.defaults({
    baseUrl: "https://api.github.com",
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

console.log(owner);
console.log(repo);

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

//#region Get User(s) Id(s) to be used as Assignees/Reviewers
const queryUserByLogin = `
    query userByLogin($login: String!) {
        user(login: $login) {
            id
            email
            login
        }
    }
`;

const userDetails = await graphqlWithAuth(queryUserByLogin,
    {
        login: 'vaishnavgade'
    }
);

console.log(JSON.stringify(userDetails));
//#endregion

//#region Get RepositoryId using Owner and Repo Name
const queryRepositoryByOwnerAndName = `
    query repositoryByOwnerAndName($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
            id
            description
            createdAt
        }
    }
`;

const repoDetails = await graphqlWithAuth(queryRepositoryByOwnerAndName,
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
const mutationCreatePullRequestByInput = `
    mutation createPullRequestByInput($input: CreatePullRequestInput!) {
        createPullRequest(input: $input) {
            clientMutationId
            pullRequest {
                id
                body
                createdAt
            }
        }
    }
`;

const createdPullRequest = await graphqlWithAuth(mutationCreatePullRequestByInput, 
    {
        input: {
            baseRefName: "main",
            clientMutationId: "create-pr",
            headRefName: `${gitBranch}`,
            repositoryId: `${repositoryId}`,
            title: "create-pr from local branch" 
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