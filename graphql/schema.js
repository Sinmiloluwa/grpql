import { buildSchema } from "graphql";

export default buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        author: User!
        createdAt: String!
        updatedAt: String!
    }
    type User {
        _id: ID!
        email: String!
        password: String
        username: String
        status: String
        posts: [Post!]
    }
    input UserInput {
        email: String!
        password: String!
        username: String!
    }
    type Mutation {
        createUser(userInput: UserInput): User
    }
    schema {
        mutation: Mutation
    }
`)