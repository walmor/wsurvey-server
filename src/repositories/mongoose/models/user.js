import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import isEmail from 'validator/lib/isEmail';
import applyMethods from './utils/apply-methods';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    index: true,
    required: true,
    lowercase: true,
    validate: {
      validator: isEmail,
      message: 'Invalid email.',
    },
  },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  googleId: String,
  facebookId: String,
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const saltRounds = 9;
    if (this.password) {
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  next();
});

const userMethods = {
  async comparePassword(password) {
    if (!this.password) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  },
};

applyMethods(userSchema, userMethods);

const User = mongoose.model('User', userSchema);

export default User;
