import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import dns from 'node:dns';

// Fix for Node c-ares DNS resolution on macOS for SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log("Could not set custom DNS:", e.message);
}

const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/MONGODB_URI=["']?([^"'\r\n]+)/);
if (!match) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

const rawUri = match[1];
const client = new MongoClient(rawUri, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  console.log("SUCCESSFULLY_CONNECTED_TO_ATLAS!");
  const admin = client.db().admin();
  const dbs = await admin.listDatabases();
  console.log("Databases on cluster:", dbs.databases.map(d => d.name));
} catch (err) {
  console.error("CONN_ERROR:", err.message);
} finally {
  await client.close();
}
