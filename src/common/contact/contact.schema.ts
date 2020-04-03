import Contact from './contact.model';
import User from '../user/user.model';
import mongoose from 'mongoose';
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
export const contactTypeDefs = `

  type Contact {
    id: ID!
    userId: String!
    contact_id: String!
    created_date: String
  }

 
  type Contact1 {
    _id: ID!,
    userId: String!,
    contact_id: String!,
    created_date: String!,
    userss: User

  }

  input ContactFilterInput {
    limit: Int
    keywords: String
    userId: String
  }

  # Extending the root Query type.
  extend type Query {
    contacts(filter: ContactFilterInput): [Contact1]
    contact(id: String!): Contact
  }

  # We do not need to check if any of the input parameters exist with a "!" character.
  # This is because mongoose will do this for us, and it also means we can use the same
  # input on both the "addContact" and "editContact" methods.
  input ContactInput {
    userId: String!
    contact_id: String!
  }

  # Extending the root Mutation type.
  extend type Mutation {
    addContact(input: ContactInput!): Contact
    editContact(id: String!, input: ContactInput!): Contact
    deleteContact(id: String!): Contact
  }

`;

/**
 * Exporting our resolver functions. Note that:
 * 1. They can use async/await or return a Promise which
 *    Apollo will resolve for us.
 * 2. The resolver property names match exactly with the
 *    schema types.
 */
export const contactResolvers = {
  Query: {
    async contacts(_, { filter = { limit: 10, keywords: '', userId: '' } }) {

       var castUserId =  mongoose.Types.ObjectId(filter.userId);

      if(filter.keywords != ''){
        var contacts: any[] = await Contact.aggregate([
          {
            "$lookup": {
                "from": "users",
                "localField": "contact_id",
                "foreignField": "_id",
                "as": "userss"
            },
          },
          { "$unwind": "$userss" },
          { "$match": { $and : [ 
                  { 
                    $or: [ 
                          { "userss.email": filter.keywords },
                          { "userss.contact_no": filter.keywords },
                          { "userss.firstName": filter.keywords },
                          { "userss.lastName": filter.keywords } 
                        ]
                  },
                  { 
                   "userId": castUserId
                 }
                ]}
           },
          { "$limit": filter.limit }
         
       ]);
      }else{
        var contacts: any[] = await Contact.aggregate([
          { "$match": { "userId": castUserId } },
          {
            "$lookup": {
                "from": "users",
                "localField": "contact_id",
                "foreignField": "_id",
                "as": "userss"
            },
          },
          { "$unwind": "$userss" },
          { "$limit": filter.limit }
         
       ]);
     
      }
        const notifications1: any[] = contacts;
        return notifications1;
     // return contacts.map(contact => contact.toObject());
    },
    async contact(_, { id }) {
      const contact: any = await Contact.findById(id);
      return contact.toObject();
    },
  },
  Mutation: {
    async addContact(_, { input }) {
      try{
        const contact: any = await Contact.create(input);
        return contact.toObject();
      }catch(e){
        throw new UserInputError(e.message, {
          invalidArgs: Object.keys(input),
        });
      }
    },
    async editContact(_, { id, input }) {
      const contact: any = await Contact.findByIdAndUpdate(id, input);
      return contact.toObject();
    },
    async deleteContact(_, { id }) {
      const contact: any = await Contact.findByIdAndRemove(id);
      return contact ? contact.toObject() : null;
    },
  },
  Contact1: {
    async userss(contact: { contact_id: string }) {
      if (contact.contact_id) {
        const user: any = await User.findById(contact.contact_id);
        return user.toObject();
      }
      return null;
    }
  },
};
