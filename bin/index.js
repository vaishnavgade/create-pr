#!/usr/bin/env node
import { execSync } from 'child_process';
import { graphql } from '@octokit/graphql';

const gitHubPAT = '';

// console.log(`

// ██████╗██████╗ ███████╗ █████╗ ████████╗███████╗    ██████╗ ██████╗ 
// ██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗
// ██║     ██████╔╝█████╗  ███████║   ██║   █████╗      ██████╔╝██████╔╝
// ██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝      ██╔═══╝ ██╔══██╗
// ╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗    ██║     ██║  ██║
//  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝  ╚═╝

// `);

let gitURL = '';
try {
    gitURL = execSync('git config --get remote.origin.url');
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

const graphqlWithAuth = graphql.defaults({
    baseUrl: "https://api.github.com",
    headers: {
        authorization: `Bearer ${gitHubPAT}`,
    },
});

// const repository = await graphqlWithAuth(`
// {
//     viewer {
//         login
//     }
// }
// `);

// const query = `{
//     repository(owner: "octokit", name: "graphql.js") {
//       issues(last: 3) {
//         edges {
//           node {
//             title
//           }
//         }
//       }
//     }
//   }`;


// const { repository } = await graphqlWithAuth(query);
// console.log(JSON.stringify(repository));

const query = `
query lastIssues($owner: String!, $repo: String!, $num: Int = 3) {
  repository(owner: $owner, name: $repo) {
    issues(last: $num) {
      edges {
        node {
          title
        }
      }
    }
  }
}
`;

const lastIssues = await graphqlWithAuth(query,
    {
        owner: `${owner}`,
        repo: `${repo}`
    }
);

console.log(JSON.stringify(lastIssues));
