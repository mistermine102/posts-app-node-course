const { buildSchema } = require('graphql')

module.exports = buildSchema(` 
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User
        createdAt: String!
        updatedAt: String!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        status: String!
        posts: [Post!]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    input PostEditInputData {
        _id: ID!, 
        title: String!, 
        content: String!, 
        imageUrl: String!
    }

    input PostDeleteInputData {
        _id: ID!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): Post!
        updatePost(postInput: PostEditInputData): Post!
        deletePost(postInput: PostDeleteInputData): Post!
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        getPosts(page: Int!): PostData!
        getPost(id: ID!): Post!
        getStatus(userId: ID!): String!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)
