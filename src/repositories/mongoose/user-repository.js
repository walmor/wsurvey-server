import mongoose from 'mongoose';
import User from './models/user';

async function findOneToObject(conditions) {
  const user = await User.findOne(conditions);
  return user ? user.toObject() : user;
}

const userRepository = {
  async create(user) {
    const doc = await User.create(user);
    return Object.assign(user, doc.toObject());
  },

  async update(user) {
    const doc = await User.findById(user.id);

    if (!doc) {
      throw new Error(`Could not find user with id: ${user.id}`);
    }

    doc.set(user);
    await doc.save();
    return Object.assign(user, doc.toObject());
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await User.findOne({ _id: id });

    if (doc) {
      return doc.toObject();
    }

    return null;
  },

  async findByEmail(email) {
    return findOneToObject({ email });
  },

  async findByEmailAndPassword(email, password) {
    let user = await this.findByEmail(email);

    if (user && (await user.comparePassword(password)) === false) {
      user = null;
    }

    return user;
  },

  async findByFacebookId(facebookId) {
    return findOneToObject({ facebookId });
  },

  async findByGoogleId(googleId) {
    return findOneToObject({ googleId });
  },

  async isEmailAvailable(email) {
    const count = await User.count({ email });
    return count === 0;
  },
};

export default userRepository;
