import { MongoClient, Db } from "mongodb";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const uri = process.env.MONGODB_URI || "";
let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }
  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  }
  await client.connect();
  db = client.db("eduflow");
  return db;
}
