import mongoose from 'mongoose';
import config from './config';

export default async function startDatabase() {
  const { db } = config;
  const uri = `mongodb://${db.user}:${db.password}@${db.host}:${db.port}/${db.name}?authSource=${db.authSource}`;

  return mongoose.connect(uri);
}
