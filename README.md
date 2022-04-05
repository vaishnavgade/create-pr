# create-pr
A nodejs CLI tool to open Pull Request based on present working directory's git repo, branch and first commit of the branch

### Setup:

- Update **.env.example** file with your own values and rename it to **.env**
- Obtain a Github Personal Access Token for graphql using either [general](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql#authenticating-with-graphql) or [enterpise](https://docs.github.com/en/enterprise-cloud@latest/graphql/guides/managing-enterprise-accounts#1-authenticate-with-your-personal-access-token) 
- To be able to run **create-pr** command from any directory, execute `npm install -g .`