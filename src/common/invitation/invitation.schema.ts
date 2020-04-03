import Invitation from './invitation.model';
import User from '../user/user.model';
import {ApolloServer,UserInputError,gql} from 'apollo-server';
/*
const {
  ApolloServer,
  UserInputError,
  gql,
} = require('apollo-server');*/

/**
 * Export a string which contains our GraphQL type definitions.
 */
export const invitationTypeDefs = `

  type Invitation {
    id: ID!
    name: String!
    contact_no: String!
    invited_by: String
    created_date: String
    invited_by_user: User
  }

  input InvitationFilterInput {
    limit: Int
  }

  # Extending the root Query type.
  extend type Query {
    invitations(filter: InvitationFilterInput): [Invitation]
    invitation(id: String!): Invitation
  }

  # We do not need to check if any of the input parameters exist with a "!" character.
  # This is because mongoose will do this for us, and it also means we can use the same
  # input on both the "addInvitation" and "editInvitation" methods.
  input InvitationInput {
    name: String!
    contact_no: String!
    invited_by: String
  }

  # Extending the root Mutation type.
  extend type Mutation {
    addInvitation(input: InvitationInput!): Invitation
    editInvitation(id: String!, input: InvitationInput!): Invitation
    deleteInvitation(id: String!): Invitation
  }

`;

/**
 * Exporting our resolver functions. Note that:
 * 1. They can use async/await or return a Promise which
 *    Apollo will resolve for us.
 * 2. The resolver property names match exactly with the
 *    schema types.
 */
export const invitationResolvers = {
  Query: {
    async invitations(_, { filter = {} }) {
      const invitations: any[] = await Invitation.find({}, null, filter);
      // notice that I have ": any[]" after the "users" variable?
      // That is because I am using TypeScript but you can remove
      // this and it will work normally with pure JavaScript
      return invitations.map(invitation => invitation.toObject());
    },
    async invitation(_, { id }) {
      const invitation: any = await Invitation.findById(id);
      return invitation.toObject();
    },
  },
  Mutation: {
    async addInvitation(_, { input }) {
      try{
        const invitation: any = await Invitation.create(input);
        return invitation.toObject();
      }catch(e){
        throw new UserInputError(e.message, {
          invalidArgs: Object.keys(input),
        });
      }
    },
    async editInvitation(_, { id, input }) {
      const invitation: any = await Invitation.findByIdAndUpdate(id, input);
      return invitation.toObject();
    },
    async deleteUser(_, { id }) {
      const invitation: any = await Invitation.findByIdAndRemove(id);
      return invitation ? invitation.toObject() : null;
    },
  },
  Invitation: {
    async invited_by_user(invited_by_user: { invited_by: string }) {
      if (invited_by_user.invited_by) {
        const user: any = await User.findById(invited_by_user.invited_by);
        return user.toObject();
      }
      return null;
    }
  },
};
