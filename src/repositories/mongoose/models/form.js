import mongoose from 'mongoose';
import questionSchema from './question';
import applyMethods from './utils/apply-methods';

const { Schema } = mongoose;

const formSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  enabled: { type: Boolean, default: true },
  deleted: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
    set() {
      return this.createdAt;
    },
  },
  questions: [questionSchema],
});

applyMethods(formSchema, {});

const Form = mongoose.model('Form', formSchema);

export { Form as default, formSchema };
