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
const clientMutationId = 'create-pr';
const getRemoteGitUrlCommand = 'git config --get remote.origin.url';
const getCurrentGitBranchCommand = 'git branch --show-current';
const getFirstCommit = 'git log --oneline | tail -1';

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

//#region Get Last Commit
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

let assigneeId = '';
if(userDetails) {
    console.log(JSON.stringify(userDetails));
    if(userDetails.hasOwnProperty("user")) {
        if (userDetails["user"].hasOwnProperty("id")) {
            assigneeId = userDetails["user"]["id"];
            console.log(`AssigneeId: ${assigneeId}`);
        }    
    }
}
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
const mutationAddAssigneesToAssignableByInput = `
    mutation addAssigneesToAssignableByInput($input: AddAssigneesToAssignableInput!) {
        addAssigneesToAssignable(input: $input) {
            clientMutationId
            assignable {
                assignees(first: 10) {
                    nodes {
                        id
                        email
                        login
                    }
                }
            }
        }
    }
`;

const addAssigneesToAssignable = await graphqlWithAuth(mutationAddAssigneesToAssignableByInput, 
    {
        input: {
            clientMutationId: `${clientMutationId}`,
            assignableId: `${pullRequestId}`,
            assigneeIds: [
                `${assigneeId}`
            ]
          }
    }
);

if(addAssigneesToAssignable){
    console.log(JSON.stringify(addAssigneesToAssignable));
}
//#endregion

//#region Request Reviews By Pull Request Id
const mutationRequestReviewsByInput = `
    mutation requestReviewsByInput($input: RequestReviewsInput!) {
        requestReviews(input: $input) {
            clientMutationId
            pullRequest {
                id
                body
                createdAt
            }
        }
    }
`;

const requestReviews = await graphqlWithAuth(mutationRequestReviewsByInput, 
    {
        input: {
            clientMutationId: `${clientMutationId}`,
            pullRequestId: `${pullRequestId}`,
            userIds: [
                `${assigneeId}`
            ]
          }
    }
);

if(requestReviews){
    console.log(JSON.stringify(requestReviews));
}

//#endregion