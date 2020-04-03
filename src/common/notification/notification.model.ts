import mongoose from 'mongoose';
import User from '../user/user.model';


/**
 * Here is the our user schema which will be used to
 * validate the data sent to our database.
 */
const notificationSchema = new mongoose.Schema({  
  
  voterId: {
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
  voter_ip_address: {
    type: String,
    required: true,
  },
  cashier_ip_address: {
    type: String,
    required: true,
  },
  transaction_id: {
    type: String,
  },
  payment_id: {
    type: String,
  },
  created_date: {
    type: Date,
    default: Date.now,
    expires: 120
  },
  status: {
    type: String,
  },
  type: {
    type: [{
      type: String,
      enum: ['cashier_confirm', 'voter_confirm']
    }],
    default: 'voter_confirm'
  },
  request_type: {
    type: [{
      type: String,
      enum: ['send', 'request']
    }],
    default: 'send'
  }
}).index({"created_date": 1 }, { expireAfterSeconds: 120 } );

//notificationSchema.


/**
 * This property will ensure our virtuals (including "id")
 * are set on the user when we use it.
 */
notificationSchema.set('toObject', { getters: true, virtuals: true });

/**
 * Never save the password directly onto the model,
 * always encrypt first.
 */




/**
 * Finally, we compile the schema into a model which we then
 * export to be used by our GraphQL resolvers.
 */
export default mongoose.model('Notification', notificationSchema);
