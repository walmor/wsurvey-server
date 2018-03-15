import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import isEmail from 'validator/lib/isEmail';

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
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.findByEmail = function (email, callback) {
  return this.findOne({ email }, callback);
};

userSchema.statics.findByEmailAndPassword = async function (email, password, callback) {
  const cb = callback || function () {};

  try {
    let user = await this.findByEmail(email);

    if (user && (await user.comparePassword(password)) === false) {
      user = null;
    }

    cb(null, user);
    return user;
  } catch (e) {
    cb(e, null);
    throw e;
  }
};

userSchema.statics.findByFacebookId = function (facebookId, callback) {
  return this.findOne({ facebookId }, callback);
};

userSchema.statics.findByGoogleId = function (googleId, callback) {
  return this.findOne({ googleId }, callback);
};

const User = mongoose.model('User', userSchema);

export default User;
