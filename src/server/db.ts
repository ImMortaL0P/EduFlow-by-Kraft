import { MongoClient, Db } from "mongodb";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const uri = process.env.MONGODB_URI || "";
let client: MongoClient | null = null;
let db: Db | null = null;

function getDirectUri(srvUri: string): string | null {
  try {
    const credsMatch = srvUri.match(/\/\/([^@]+)@/);
    if (!credsMatch) return null;
    const creds = credsMatch[1];
    if (srvUri.includes("brushbackend.l3ulyho.mongodb.net")) {
      return `mongodb://${creds}@ac-igeo8hh-shard-00-00.l3ulyho.mongodb.net:27017,ac-igeo8hh-shard-00-01.l3ulyho.mongodb.net:27017,ac-igeo8hh-shard-00-02.l3ulyho.mongodb.net:27017/eduflow?ssl=true&replicaSet=atlas-4qt688-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  } catch {}
  return null;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }

  // Prefer direct multi-shard URI if available to avoid DNS SRV resolution failures (EBADRESP/ECONNREFUSED)
  const directUri = getDirectUri(uri);
  const candidateUris = directUri ? [directUri, uri] : [uri];

  let lastError: any = null;
  for (const targetUri of candidateUris) {
    try {
      const c = new MongoClient(targetUri, {
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000,
      });
      await c.connect();
      client = c;
      db = client.db("eduflow");
      return db;
    } catch (err: any) {
      lastError = err;
      console.warn(`[MongoDB] Connection attempt failed:`, err.message);
    }
  }

  throw lastError || new Error("Failed to connect to MongoDB Atlas");
}
