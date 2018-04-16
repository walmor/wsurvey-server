import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';
import { paragraphOptions } from './paragraph';

const shortAnswerOptions = {
  ...paragraphOptions,
  ...{ mask: String },
};

const shortAnswerSchema = new Schema({
  options: shortAnswerOptions,
});

const ShortAnswer = registerQuestionKind('ShortAnswer', shortAnswerSchema);

export default ShortAnswer;
