import jwt from 'jsonwebtoken';
import User from './user.model';
import Payment from '../payment/payment.model';
import config from '../../config';
import Workspace from '../workspace/workspace.model';
import { ApolloServer, UserInputError, gql } from 'apollo-server';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { WriteStream } from "fs-capacitor";
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLBoolean 
} = require('graphql')
//const { GraphQLUpload } = require('graphql-upload')
const path = require("path");
const fs = require('fs');
const { GraphQLUpload } = require('apollo-upload-server');




/*
const {
  ApolloServer,
  UserInputError,
  gql,
} = require('apollo-server');*/

/**
 * Export a string which contains our GraphQL type definitions.
 */


export const userTypeDefs = `
  
  enum AllowedUserType {
    voter
    cashier
    admin
    sponsor
    customer
  }

  type AuthPayload {
    token: String
    user: User
  }

  type User {
    id: ID!
    workspaceId: String
    workspace: Workspace
    email: String!
    contact_no: String!
    password: String!
    firstName: String!
    # Last name is not a required field so it does not need a "!" at the end.
    lastName: String
    profile_image: String
    company_name: String
    created_by: String
    created_date: String
    user_type: [AllowedUserType]
    total_trans: [Payment]
  }

  input UserFilterInput {
    limit: Int
  }

  # Extending the root Query type.
  extend type Query {
    users(filter: UserFilterInput,user_type: String): [User]
    usersByType(user_type: String!): [User]
    user(id: String!): User
    getQrCode(id: String!): User
  }

  # We do not need to check if any of the input parameters exist with a "!" character.
  # This is because mongoose will do this for us, and it also means we can use the same
  # input on both the "addUser" and "editUser" methods.
  input UserInput {
    email: String
    contact_no: String!
    password: String
    firstName: String
    lastName: String
    profile_image: String
    workspaceId: String
    user_type: [AllowedUserType]
    company_name: String
    created_by: String
    created_date: String
  }

  scalar Upload
  type File {
    id: ID!
    path: String!
    filename: String!
    mimetype: String!
    encoding: String!
  }

  # Extending the root Mutation type.
  extend type Mutation {
    addUser(input: UserInput!): User
    editUser(id: String!, input: UserInput!): User
    deleteUser(id: String!): User
    loginUser(email: String!, password: String!): AuthPayload
    singleUpload(file: Upload!): File!
    uploadFile(file: Upload!): File!
    uploadSingleFile(file: Upload!,userId: String!): File!

  }

`;

/**
 * Exporting our resolver functions. Note that:
 * 1. They can use async/await or return a Promise which
 *    Apollo will resolve for us.
 * 2. The resolver property names match exactly with the
 *    schema types.
 */
export const userResolvers = {
  Upload: GraphQLUpload,

  Query: {
    async users(_, { filter = {},user_type = null }) {

      if(user_type){
        const users: any[] = await User.find({'user_type': user_type}, null, filter);
        return users.map(user => user.toObject());
      }else{
        const users: any[] = await User.find({}, null, filter);
        return users.map(user => user.toObject());
      }
      // notice that I have ": any[]" after the "users" variable?
      // That is because I am using TypeScript but you can remove
      // this and it will work normally with pure JavaScript
    },
    async usersByType(_, { user_type }) {
      const users: any[] = await User.find({}, null, {});
      // notice that I have ": any[]" after the "users" variable?
      // That is because I am using TypeScript but you can remove
      // this and it will work normally with pure JavaScript
      return users.map(user => user.toObject());
    },
    async user(_, { id }) {
      const user: any = await User.findById(id);
      return user.toObject();
    },
    async getQrCode(_, { id }) {
      const user: any = await User.findById(id);
      return user.toObject();
    },
  },
  Mutation: {
    async addUser(_, { input }) {
      try{
        const user: any = await User.create(input);
        return user.toObject();
      }catch(e){
        throw new UserInputError(e.message, {
          invalidArgs: Object.keys(input),
        });
      }
    },
    async editUser(_, { id, input }) {
      const user: any = await User.findByIdAndUpdate(id, input);
      return user.toObject();
    },
    async deleteUser(_, { id }) {
      const user: any = await User.findByIdAndRemove(id);
      return user ? user.toObject() : null;
    },
    async loginUser(_, { email, password }) {
      
      const user: any = await User.findOne({ email });
      if (!user) {
        throw new Error('No such user found')
      }
      if(user){
        const match: boolean = await user.comparePassword(password);
        if (!match) {
          throw new Error('Invalid password')
        }
        if (match) {
          const token = jwt.sign({ id: user.id }, config.token.secret);
         
          return {
                  token,
                  user,
                }
        }
        throw new Error('Not Authorised.');
      }
      throw new Error('Not Authorised.');
    },
    uploadSingleFile: async (root, { file,userId }) => {
      const user: any = await User.findById(userId);
      const userInfo =  user.toObject();
      const { createReadStream, filename } = await file; 
      const ext = path.extname(filename);  
     // const newName = fs.renameSync('sample.txt', 'sample_old.txt');
      const new_filename = userInfo.firstName+"-"+userId+ext;
      await new Promise(res =>
        createReadStream()
          .pipe(createWriteStream(path.join(__dirname, "../../../photos", new_filename)))
          .on("close", res)
      );

     const user1: any = await User.findByIdAndUpdate(userId, {'profile_image': new_filename});
     file.filename = new_filename;
      return file;
   },
    
  },
  User: {
    async workspace(user: { workspaceId: string }) {
      if (user.workspaceId) {
        const workspace: any = await Workspace.findById(user.workspaceId);
        return workspace.toObject();
      }
      return null;
    },
    async total_trans(user: { id : string }) {
      if(user.id){
        const payments: any[] = await Payment.find({'cashier_id': user.id});
        return payments.map(payment => payment.toObject());
      }
      return null;
    },
  }
};
