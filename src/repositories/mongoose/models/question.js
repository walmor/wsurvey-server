import mongoose from 'mongoose';
import applyMethods from './utils/apply-methods';

const { Schema } = mongoose;

const options = {
  discriminatorKey: 'kind',
};

const questionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    required: { type: Boolean, default: false },
  },
  options,
);

questionSchema.pre('save', function (next) {
  if (!this.kind) {
    next(new Error('The property kind is required.'));
  }

  const kinds = Object.keys(questionSchema.discriminators);

  // if we're here, it's because the kind property didn't
  // match any discriminator key. So, we can throw an error.
  let errorMsg = 'The property "kind" has an invalid value.';
  errorMsg += ` It must be one of the following values: ${kinds}`;

  next(new Error(errorMsg));
});

applyMethods(questionSchema, {});

const Question = mongoose.model('Question', questionSchema);

export { questionSchema as default, Question };
