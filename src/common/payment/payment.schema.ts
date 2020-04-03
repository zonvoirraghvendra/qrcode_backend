import Payment from './payment.model';
import User from '../user/user.model';
const stripe = require('stripe')('sk_test_lAWkG4gnvAXhsUGwgAMIzTYS000Bw5CsHs');

/**
 * Export a string which contains our GraphQL type definitions.
 */
export const paymentTypeDefs = `

  type Payment {
    id: ID!
    userId: String!
    amount: String!
    balance_transaction: String
    status: String
    email: String
    stripe_customer_id: String
    cashier_id: String!
    currency: String
    card_number: String!
    exp_month: String!
    exp_year: String!
    cvc: String!
    user: User
    cashier: User
  }

  type ReturnPay{
    amount: String
  }

  input PaymentFilterInput {
    limit: Int
  }


  # Extending the root Query type.
  extend type Query {
    payments(filter: PaymentFilterInput): [Payment]
    transactions(filter: PaymentFilterInput): [Payment]
    payment(id: String!): Payment
    transaction(id: String!): Payment
    transactionByCashierId(cashier_id: String!): [Payment]
    transactionByUserId(userId: String!): [Payment]
    balance(userId: String!): [ReturnPay]
    hello: String
  }

  # We do not need to check if any of the input parameters exist with a "!" character.
  # This is because mongoose will do this for us, and it also means we can use the same
  # input on both the "addUser" and "editUser" methods.
  input PaymentInput {
    userId: String!
    amount: String!
    cashier_id: String!
    card_number: String!
    exp_month: String!
    exp_year: String!
    cvc: String!
  }

  # Extending the root Mutation type.
  extend type Mutation {
    addPayment(input: PaymentInput!): Payment
    editPayment(id: String!, input: PaymentInput!): Payment
    
  }

`;

/**
 * Exporting our resolver functions. Note that:
 * 1. They can use async/await or return a Promise which
 *    Apollo will resolve for us.
 * 2. The resolver property names match exactly with the
 *    schema types.
 */
export const paymentResolvers = {
  Query: {
    async payments(_, { filter = {} }) {
      const payments: any[] = await Payment.find({}, null, filter);
      return payments.map(payment => payment.toObject());
    },
    async payment(_, { id }) {
      const payment: any = await Payment.findById(id);
      return payment.toObject();
    },
    async transactions(_, { filter = {} }) {
      const payments: any[] = await Payment.find({}, null, filter);
      return payments.map(payment => payment.toObject());
    },
    async transaction(_, { id }) {
      const payment: any = await Payment.findById(id);
      return payment.toObject();
    },
    async transactionByCashierId(_, { cashier_id }) {
      const payments: any[] = await Payment.find({cashier_id: cashier_id}, null, {});
      //console.log(payments);
      return payments.map(payment => payment.toObject());
    },
    async transactionByUserId(_, { userId }) {
      const payments: any[] = await Payment.find({userId: userId}, null, {});
      //console.log(payments);
      return payments.map(payment => payment.toObject());
    },
    async balance(_, { userId }) {
      const payments: any[] = await Payment.find({userId: userId}, null, {});
      //console.log(payments);
      var paymentss = await Payment.aggregate([{
          $group: { _id : null, sum : { $sum: "$amount" } }
      }]);

      console.log(paymentss);
      return payments.map(payment => payment.toObject());
    },
    hello: () => { return 'Hello world!' }
  },
  Mutation: {
    async addPayment(_, { input }) {

      var payment12 = [];
      let amount = input.amount*100;
      const user: any = await User.findById(input.userId);
      let chargeResponse =  stripe.tokens.create({
          card: {
            number: input.card_number,
            exp_month: input.exp_month,
            exp_year: input.exp_year,
            cvc: input.cvc,
          },
        }).then(token =>
      
      stripe.customers.create({
      name: user.firstName, // customer email
      email: user.email, // customer email
      source: token.id // token for the card
      }))
      .then(customer =>
      stripe.charges.create({ // charge the customer
      amount: amount,
      source: customer.default_source,
      description: "Sample Charge",
      currency: "inr",
      customer: customer.id,
      shipping: {
        address: {
          city: 'Lucknow',
          country: 'India',
          line1: 'Gomti Nagar',
          postal_code: '226001',
          state: 'UP',
        },
        name: user.firstName
      }
      }))
      .then( async function(charge) {
        input.balance_transaction = charge.balance_transaction;
        input.status = charge.status;
        input.stripe_customer_id = charge.customer;
        input.email = user.email;
        input.currency = charge.currency;
        const payment1: any =  await Payment.create(input);
        const payment: any =  await Payment.findById(payment1.id);
        const resolvedProm = Promise.resolve(payment);
        return resolvedProm;
       
      }).then( async function(charge_response) {
          return charge_response;
      }).catch((err) => {
          // charge failed. Alert user that charge failed somehow

          switch (err.type) {
            case 'StripeCardError':
            // A declined card error
            console.log(err.message); // => e.g. "Your card's expiration year is invalid."
            break;
            case 'StripeInvalidRequestError':
            // Invalid parameters were supplied to Stripe's API
            break;
            case 'StripeAPIError':
            // An error occurred internally with Stripe's API
            break;
            case 'StripeConnectionError':
            // Some kind of error occurred during the HTTPS communication
            break;
            case 'StripeAuthenticationError':
            // You probably used an incorrect API key
            break;
            case 'StripeRateLimitError':
            // Too many requests hit the API too quickly
            break;
          }
      }); 
      
      return chargeResponse;
    },
    async editPayment(_, { id, input }) {
      const payment: any = await Payment.findByIdAndUpdate(id, input);
      return payment.toObject();
    },
  },
  Payment: {
    async user(payment: { userId: string }) {
      if (payment.userId) {
        const user: any = await User.findById(payment.userId);
        return user.toObject();
      }
      return null;
    },
    async cashier(payment: { cashier_id: string }) {
      if (payment.cashier_id) {
        const user: any = await User.findById(payment.cashier_id);
        return user.toObject();
      }
      return null;
    },
  },
 
};
