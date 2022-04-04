#!/usr/bin/env node
import {execSync} from 'child_process';

console.log(`

██████╗██████╗ ███████╗ █████╗ ████████╗███████╗    ██████╗ ██████╗ 
██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██╔════╝    ██╔══██╗██╔══██╗
██║     ██████╔╝█████╗  ███████║   ██║   █████╗      ██████╔╝██████╔╝
██║     ██╔══██╗██╔══╝  ██╔══██║   ██║   ██╔══╝      ██╔═══╝ ██╔══██╗
╚██████╗██║  ██║███████╗██║  ██║   ██║   ███████╗    ██║     ██║  ██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝     ╚═╝  ╚═╝
                                                                     
`);

try {
    const gitData = execSync('git config --get remote.origin.url');
    console.log(`Git remote url: ${gitData}`);
}
catch(error) {
    console.error(`The current directory might not be a git repo. Error: ${error}`);
}
