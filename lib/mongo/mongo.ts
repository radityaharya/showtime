import { MongoClient } from "mongodb";

const URL = process.env.MONGO_URL!;

const database = 'trakt_ical2';

export async function Collection(collection: string) {
  const client = await MongoClient.connect(URL)
  const db = client.db(database);
  const col = db.collection(collection);
  return col;
}