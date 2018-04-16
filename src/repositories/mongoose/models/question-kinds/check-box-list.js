import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';
import { multipleChoiceOptions } from './multiple-choice';

const checkBoxListOptions = {
  ...multipleChoiceOptions,
  ...{
    validation: {
      kind: {
        type: String,
        enum: ['atLeast', 'atMost', 'exactly'],
      },
      argument: Number,
      errorMessage: String,
    },
  },
};

const checkBoxListSchema = new Schema({
  options: checkBoxListOptions,
});

registerQuestionKind('CheckBoxList', checkBoxListSchema);
