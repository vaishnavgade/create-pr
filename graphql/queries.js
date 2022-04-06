const queryUserByLogin = `
    query userByLogin($login: String!) {
        user(login: $login) {
            id
            email
            login
        }
    }
`;

const queryRepositoryByOwnerAndName = `
    query repositoryByOwnerAndName($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
            id
            description
            createdAt
        }
    }
`;

export {
    queryUserByLogin,
    queryRepositoryByOwnerAndName
};