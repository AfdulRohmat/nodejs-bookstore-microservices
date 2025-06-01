// review-service/src/graphql/typeDefs.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime

  type User {
    id:       String!
    username: String!
    email:    String!
  }

  type Book {
    id:     String!
    title:  String!
    author: String!
  }

  type Review {
    id:        String!
    userId:    String!
    bookId:    String!
    rating:    Int!
    comment:   String!

    user:      User!
    book:      Book!

    createdAt: DateTime!
    modifiedAt: DateTime!
    deletedAt: DateTime
    createdBy: String
    modifiedBy: String
    deletedBy: String
  }

  type Query {
    reviews(bookId: String!): [Review!]!
    review(id: String!): Review
  }

  type Mutation {

    createReview(
      bookId: String!
      rating: Int!
      comment: String!
    ): Review!

    updateReview(
      id: String!
      rating: Int
      comment: String
    ): Review!

    deleteReview(id: String!): Review!
  }
`;
