// lib/mongodb.js
import { MongoClient } from "mongodb";
import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const uri = process.env.MONGODB_URI;
let cached = global._mongo;

if (!cached) {
  cached = global._mongo = { mongoClientPromise: null, mongooseConn: null };
}

if (!cached.mongoClientPromise) {
  const client = new MongoClient(uri);
  cached.mongoClientPromise = client.connect();
}

async function connectMongoose() {
  if (cached.mongooseConn) return cached.mongooseConn;
  mongoose.set("strictQuery", false);
  cached.mongooseConn = await mongoose.connect(uri, {});
  return cached.mongooseConn;
}

export default cached.mongoClientPromise; // resolves to connected MongoClient
export { connectMongoose };
