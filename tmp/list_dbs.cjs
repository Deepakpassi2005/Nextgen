const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://appuser:apppass@cluster0.e9d53ib.mongodb.net/?appName=Cluster0';

async function run() {
  try {
    const conn = await mongoose.connect(mongoURI);
    const admin = new mongoose.mongo.Admin(conn.connection.db);
    const dbs = await admin.listDatabases();
    console.log('--- Databases ---');
    console.log(JSON.stringify(dbs.databases.map(db => db.name), null, 2));
    
    // Check "test" db collections
    console.log('--- Collections in "test" ---');
    const testDb = conn.connection.useDb('test');
    const testColls = await testDb.db.listCollections().toArray();
    console.log(testColls.map(c => c.name));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
