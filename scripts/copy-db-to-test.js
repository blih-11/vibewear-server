// Copies EVERY collection from your live database into a separate database
// called "<livename>_test" on the same cluster. The live database is only READ,
// never written to. Safe to run more than once (it replaces the test copy).
//
// Run from the vibewear-server folder:   node scripts/copy-db-to-test.js
import 'dotenv/config';
import mongoose from 'mongoose';

const liveUri = process.env.MONGO_URI;
if (!liveUri) { console.error('MONGO_URI missing from .env'); process.exit(1); }

// Work out the live DB name from the URI, then build the test one
const liveName = new URL(liveUri).pathname.replace('/', '') || 'vibewear';
const testName = `${liveName}_test`;
if (liveName.endsWith('_test')) {
  console.error(`Your .env already points at "${liveName}". Point MONGO_URI at the LIVE database for this step.`);
  process.exit(1);
}

const client = await mongoose.createConnection(liveUri).asPromise();
const live = client.useDb(liveName);
const test = client.useDb(testName);

const collections = await live.db.listCollections().toArray();
console.log(`Copying ${collections.length} collections: ${liveName} → ${testName}\n`);

for (const { name } of collections) {
  if (name.startsWith('system.')) continue;
  const docs = await live.db.collection(name).find({}).toArray();
  await test.db.collection(name).deleteMany({}); // fresh copy each run
  if (docs.length) await test.db.collection(name).insertMany(docs);
  console.log(`  ${name}: ${docs.length} documents`);
}

console.log(`\nDone. Test copy is "${testName}". The live "${liveName}" was not modified.`);
await client.close();
