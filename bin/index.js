#!/usr/bin/env node
import {execSync} from 'child_process';

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
catch(error) {
    console.error(`The current directory might not be a git repo. ${error}`);
    process.exit(1) //mandatory (as per the Node.js docs)
}

let splitURL = new String(gitURL).split(':');
let orgPlusRepo = splitURL[1].split('/');
const org = orgPlusRepo[0];
const repo = orgPlusRepo[1].split('.')[0];

console.log(org);
console.log(repo);
