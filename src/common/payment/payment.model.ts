import mongoose from 'mongoose';
import User from '../user/user.model';


/**
 * Here is the our user schema which will be used to
 * validate the data sent to our database.
 */
const paymentSchema = new mongoose.Schema({
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  cashier_id: {
    type: String,
    required: true,
  },
  balance_transaction: {
    type: String,
  },
  status: {
    type: String,
  },
  email: {
    type: String,
  },
  stripe_customer_id: {
    type: String,
  },
  currency: {
    type: String,
  },
  card_number: {
    type: String,
    required: true
  },
  exp_month: {
    type: String,
    required: true
  },
  exp_year: {
    type: String,
    required: true
  },
  cvc: {
    type: String,
    required: true
  },

  
});

/**
 * This property will ensure our virtuals (including "id")
 * are set on the user when we use it.
 */
paymentSchema.set('toObject', { getters: true, virtuals: true });

/**
 * Never save the password directly onto the model,
 * always encrypt first.
 */




/**
 * Finally, we compile the schema into a model which we then
 * export to be used by our GraphQL resolvers.
 */
export default mongoose.model('Payment', paymentSchema);
