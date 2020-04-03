import jwt from 'jsonwebtoken';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
//import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from 'graphql-tools';
import { merge } from 'lodash';
import fs from 'fs';
import https from 'https';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import rootTypeDefs from './root';
import { userResolvers, userTypeDefs } from './common/user/user.schema';
import {
  workspaceResolvers,
  workspaceTypeDefs,
} from './common/workspace/workspace.schema';
import { paymentResolvers, paymentTypeDefs } from './common/payment/payment.schema';
import { invitationResolvers, invitationTypeDefs } from './common/invitation/invitation.schema';
import { notificationResolvers, notificationTypeDefs } from './common/notification/notification.schema';
import { contactResolvers, contactTypeDefs } from './common/contact/contact.schema';
import User from './common/user/user.model';
import config from './config';

/**
 * Connect to the mongodb database using
 * the mongoose library.
 */
mongoose.connect(
  config.mongodb.uri,
  { useNewUrlParser: true }
);

/**
 * Declare the schema which the will hold our
 * GraphQL types and resolvers.
 */
const schema = makeExecutableSchema({
  typeDefs: [rootTypeDefs, userTypeDefs, workspaceTypeDefs, invitationTypeDefs,paymentTypeDefs,notificationTypeDefs,contactTypeDefs],
  resolvers: merge(userResolvers, workspaceResolvers, invitationResolvers, paymentResolvers, notificationResolvers, contactResolvers),
});

const configurations = {
  // Note: You may need sudo to run on port 443
  production: { ssl: true, port: 4000, hostname: 'rewardcharly.com' },
  development: { ssl: false, port: 4000, hostname: 'localhost' }
}

const environment = 'development';
const config1 = configurations[environment];

/**
 * Create the server which we will send our
 * GraphQL queries to.
 */
const apollo = new ApolloServer({
  schema,
  formatError(error) {
   // console.log(error);
    return error;
  },
  async context({ req }) {
    const token = req && req.headers && req.headers.authorization;
    if (token) {
      const data: any = jwt.verify(token, config.token.secret);
      const user = data.id ? await User.findById(data.id) : null;
      return { user };
    }
  },
});


const app = express();
apollo.applyMiddleware({ app,cors: {
    origin: '*',      // <- allow request from all domains
    credentials: true} });

// Create the HTTPS or HTTP server, per configuration
var server
if (config1.ssl) {
  // Assumes certificates are in a .ssl folder off of the package root. Make sure 
  // these files are secured.
  server = https.createServer(
    {
      key: fs.readFileSync('/etc/letsencrypt/live/rewardcharly.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/rewardcharly.com/fullchain.pem')
    },
    app
  )
} else {
  server = http.createServer(app)
}

server.listen({ port: config1.port }, () =>
  console.log(
    '🚀 Server ready at',
    `http${config1.ssl ? 's' : ''}://${config1.hostname}:${config1.port}${apollo.graphqlPath}`
  )
)