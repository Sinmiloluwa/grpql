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
    type AuthData {
        userId: ID!
        token: String!
        tokenExpiration: Int!
    }
    type PostData { 
        posts: [Post!]!
        totalPosts: Int!
    }
    input UserInput {
        email: String!
        password: String!
        username: String!
    }
    type Mutation {
        createUser(userInput: UserInput): User
        createPost(title: String!, content: String!, imageUrl: String!): Post
        updatePost(postId: ID!, title: String!, content: String!, imageUrl: String!): Post
        updateStatus(status: String!): User
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData
        getPosts(page: Int, perPage: Int): PostData
        getOnePost(postId: ID!): Post
        deletePost(postId: ID!): Boolean
        user: User
    }
    schema {
        query: RootQuery
        mutation: Mutation
    }
`)