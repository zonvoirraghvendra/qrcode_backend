import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';



/**
 * Here is the our user schema which will be used to
 * validate the data sent to our database.
 */
const invitationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contact_no: {
    type: String,
    required: true,
  },
  invited_by: {
    type: String,
    required: true,
  },
  created_date: {
    type: Date,
    default: Date.now
  },
});

/**
 * This property will ensure our virtuals (including "id")
 * are set on the user when we use it.
 */
invitationSchema.set('toObject', { getters: true, virtuals: true });

/**
 * Never save the password directly onto the model,
 * always encrypt first.
 */
/*invitationSchema.pre('save', function preSave(this: any, next: () => {}) {
  
});*/


/**
 * Finally, we compile the schema into a model which we then
 * export to be used by our GraphQL resolvers.
 */

//userSchema.plugin(beautifyUnique);
invitationSchema.plugin(uniqueValidator);

export default mongoose.model('Invitation', invitationSchema);