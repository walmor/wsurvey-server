import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';

const multipleChoiceOptions = {
  items: [
    {
      value: String,
      isOther: Boolean,
      _id: false,
    },
  ],
  shuffleOrder: Boolean,
};

const mutipleChoiceSchema = new Schema({
  options: multipleChoiceOptions,
});

registerQuestionKind('MultipleChoice', mutipleChoiceSchema);

export { multipleChoiceOptions };
