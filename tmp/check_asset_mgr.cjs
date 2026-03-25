const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://appuser:apppass@cluster0.e9d53ib.mongodb.net/?appName=Cluster0';

async function run() {
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log('--- Collections in "asset_manager" ---');
    const assetDb = conn.connection.useDb('asset_manager');
    const assetColls = await assetDb.db.listCollections().toArray();
    console.log(assetColls.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
