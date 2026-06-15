import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongoServer;

export const connectTestDb = async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "6.0.14" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const clearTestDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

export const disconnectTestDb = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
