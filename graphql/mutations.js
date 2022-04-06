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

export {
    mutationCreatePullRequestByInput,
    mutationAddAssigneesToAssignableByInput,
    mutationRequestReviewsByInput
}