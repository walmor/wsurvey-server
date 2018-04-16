import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';

const linearScaleOptions = {
  lowerScaleLimit: { type: Number, default: 0 },
  lowerScaleLabel: String,
  upperScaleLimit: { type: Number, default: 5 },
  upperScaleLabel: String,
};

const linearScaleSchema = new Schema({
  options: linearScaleOptions,
});

registerQuestionKind('LinearScale', linearScaleSchema);
