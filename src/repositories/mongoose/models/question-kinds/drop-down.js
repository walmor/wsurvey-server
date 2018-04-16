import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';
import { multipleChoiceOptions } from './multiple-choice';

const dropDownSchema = new Schema({
  options: multipleChoiceOptions,
});

registerQuestionKind('DropDown', dropDownSchema);
