const mongoose = require('mongoose');
const Client = require('./models/Client');
const Labour = require('./models/Labour');
const Admin = require('./models/Admin');

const mongoUri = "mongodb://quicklaboure_db_user:Labour%401313@ac-uqszb3b-shard-00-00.zusheco.mongodb.net:27017,ac-uqszb3b-shard-00-01.zusheco.mongodb.net:27017,ac-uqszb3b-shard-00-02.zusheco.mongodb.net:27017/QuickLabour_data?ssl=true&replicaSet=atlas-11hsge-shard-0&authSource=admin&appName=Cluster0";

async function run() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const phone = "9463602132";
  const client = await Client.findOne({ phone });
  if (client) {
    console.log("Found in Client collection:", client.fullName);
  }
  const worker = await Labour.findOne({ phone });
  if (worker) {
    console.log("Found in Labour (Worker) collection:", worker.fullName);
  }
  const admin = await Admin.findOne({ phone });
  if (admin) {
    console.log("Found in Admin collection:", admin.fullName);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
