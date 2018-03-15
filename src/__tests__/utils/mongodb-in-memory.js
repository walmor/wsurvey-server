import mongoose from 'mongoose';
import MongodbMemoryServer from 'mongodb-memory-server';

// May require additional time for downloading MongoDB binaries
jest.setTimeout(60000);

let mongoServer;

async function init() {
  mongoServer = new MongodbMemoryServer();

  const mongoUri = await mongoServer.getConnectionString();
  return mongoose.connect(mongoUri);
}

async function stop() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

async function clearDatabase() {
  const modelNames = mongoose.modelNames();

  await Promise.all(modelNames.map(async (name) => {
    await mongoose.model(name).remove({});
  }));
}

export { init, stop, clearDatabase };
