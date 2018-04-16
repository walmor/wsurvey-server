import mongoose from 'mongoose';
import { cloneDeep } from 'lodash';
import Form from './models/form';

const formRepository = {
  async create(form) {
    const doc = await Form.create(form);
    return Object.assign(form, doc.toObject());
  },

  async update(form) {
    const doc = await Form.findById(form.id);

    if (!doc) {
      throw new Error(`Could not find form with id: ${form.id}`);
    }

    const formClone = cloneDeep(form);

    formClone.questions.forEach((q) => {
      if (q.id) {
        q._id = q.id;
      }
    });

    doc.set(formClone);
    await doc.save();
    return Object.assign(form, doc.toObject());
  },

  async delete(formId) {
    const doc = await Form.findById(formId);

    if (!doc) {
      throw new Error(`Could not find form with id: ${formId}`);
    }

    await doc.update({ deleted: true });
  },

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await Form.findOne({ _id: id });

    if (doc) {
      return doc.toObject();
    }

    return null;
  },

  async find({
    page, pageSize, userId, search,
  }) {
    if (!userId) throw new Error('The user id is mandatory.');

    const skip = page * pageSize;

    const userFilter = { userId };
    let conditions = userFilter;

    if (search) {
      const regex = new RegExp(search, 'i');
      conditions = { $and: [userFilter, { $or: [{ title: regex }, { description: regex }] }] };
    }

    const totalCount = await Form.count(conditions);
    const formModels = await Form.find(conditions, null, { skip, limit: pageSize, sort: { createdAt: -1 } });
    const forms = formModels.map(fm => fm.toObject());

    return { totalCount, forms };
  },
};

export default formRepository;
