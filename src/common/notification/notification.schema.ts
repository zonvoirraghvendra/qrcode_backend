import Notification from './notification.model';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

import User from '../user/user.model';

/**
 * Export a string which contains our GraphQL type definitions.
 */
export const notificationTypeDefs = `
  
  enum AllowedType {
    voter_confirm
    cashier_confirm
    admin
    sponsor
    customer
  }

  enum RequestType {
    send
    request
  }

  type Notification {
    id: ID!
    voterId: String! # voter id
    amount: String!
    status: String
    cashier_id: String!
    voter_ip_address: String!
    cashier_ip_address: String!
    transaction_id: String
    payment_id: String
    created_date: String
    type: [AllowedType]
    request_type: [RequestType]
    user: User
    cashier: User
  }

  input NotificationFilterInput {
    limit: Int
  }

  type Nt{
    _id: ID
    voterId: String! # voter id
    amount: String!
    status: String
    cashier_id: String!
    voter_ip_address: String!
    cashier_ip_address: String!
    transaction_id: String
    payment_id: String
    created_date: String
    type: [AllowedType]
    request_type: [RequestType]
    user: User
    cashier: User
  }

  # Extending the root Query type.
  extend type Query {
    notifications(filter: NotificationFilterInput): [Notification]
    notification(id: String!): Notification
    getVoterConfirmNotification(voterId: String!, ip_address: String!): [Nt]
    getCashierConfirmNotification(cashier_id: String!, ip_address: String!): [Nt]
  }

  # We do not need to check if any of the input parameters exist with a "!" character.
  # This is because mongoose will do this for us, and it also means we can use the same
  # input on bPaymentoth the "addUser" and "editUser" methods.
  input NotificationInput {
    voterId: String!
    amount: String!
    cashier_id: String!
    voter_ip_address: String!
    cashier_ip_address: String!
    transaction_id: String
    payment_id: String
    created_date: String
    type: [AllowedType]
    request_type: [RequestType]
  }

  # Extending the root Mutation type.
  extend type Mutation {
    addNotification(input: NotificationInput!): Notification
    editNotification(id: String!, input: NotificationInput!): Notification
    
  }

`;

/**
 * Exporting our resolver functions. Note that:
 * 1. They can use async/await or return a Promise which
 *    Apollo will resolve for us.
 * 2. The resolver property names match exactly with the
 *    schema types.
 */
export const notificationResolvers = {
  Query: {
    async notifications(_, { filter = {} }) {
      const notifications: any[] = await Notification.find({}, null, filter);
      return notifications.map(notification => notification.toObject());
    },
    async notification(_, { id }) {
      const notification: any = await Notification.findById(id);
      return notification.toObject();
    },
    async getVoterConfirmNotification(_, { voterId ,ip_address }){
    
      let query = {
          created_date: { // 2 minutes ago (from now)
              $gt: new Date(new Date().getTime() - 1000 * 60 * 2)
          },
          voter_ip_address :  ip_address,
          voterId :  voterId,
          type :  'voter_confirm' 
      }
      let projection = {
          _id: 0,
          amount: 1,
          cashier_id: 1,
      }
      const notifications1: any[] = await Notification.find(query,{},{sort: {created_date: -1},limit: 1});
      return notifications1;
      return notifications1.map(notification => notification.toObject());
    },
    async getCashierConfirmNotification(_, { cashier_id ,ip_address }){
    
      let query = {
          created_date: { // 2 minutes ago (from now)
              $gt: new Date(new Date().getTime() - 1000 * 60 * 2)
          },
          cashier_ip_address :  ip_address,
          cashier_id :  cashier_id,
          type :  'cashier_confirm'
      }
      let projection = {
          _id: 0,
          amount: 1,
          cashier_id: 1,
      }
      const notifications1: any[] = await Notification.find(query,{},{sort: {created_date: -1}});
      return notifications1;
      return notifications1.map(notification => notification.toObject());
    }
  },
  Mutation: {
    async addNotification(_, { input }) {
      //findByIdAndRemove
      let query = {
        created_date: { // 2 minutes ago (from now)
            $gt: new Date(new Date().getTime() - 1000 * 60 * 2)
        },
      }
      let projection = {
          _id: 0,
          amount: 1,
          cashier_id: 1,
      }
      Notification.deleteMany(query);

      const notification: any =  await Notification.create(input);
      return notification;
    },
    async editNotification(_, { id, input }) {
      const notification: any = await Notification.findByIdAndUpdate(id, input);
      return notification.toObject();
    },
  },
  Notification: {
    async user(notification: { voterId: string }) {
      if (notification.voterId) {
        const user: any = await User.findById(notification.voterId);
        return user.toObject();
      }
      return null;
    },
    async cashier(notification: { cashier_id: string }) {
      if (notification.cashier_id) {
        const user: any = await User.findById(notification.cashier_id);
        return user.toObject();
      }
      return null;
    },
  },
  Nt: {
    async user(notification: { voterId: string }) {
      if (notification.voterId) {
        const user: any = await User.findById(notification.voterId);
        return user.toObject();
      }
      return null;
    },
    async cashier(notification: { cashier_id: string }) {
      if (notification.cashier_id) {
        const user: any = await User.findById(notification.cashier_id);
        return user.toObject();
      }
      return null;
    },
  },
 
};
