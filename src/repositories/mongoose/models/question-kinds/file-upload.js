import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';

const fileUploadOptions = {
  validation: {
    allowedFileExtensions: [String],
    maximumNumberOfFiles: Number,
    maximumFileSize: Number,
  },
};

const fileUploadSchema = new Schema({
  options: fileUploadOptions,
});

registerQuestionKind('FileUpload', fileUploadSchema);
