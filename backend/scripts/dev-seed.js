require('dotenv').config();
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const demoSeed = require('../src/services/demoSeed/demoSeedService');

const main = async () => {
  const reset = process.argv.includes('--reset');
  await connectDatabase();
  try {
    const result = await demoSeed.loadDemoData({ reset });
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'loaded') {
      console.log('\nDemo credentials (password: Demo@123):');
      result.users.forEach((u) => console.log(`  ${u.email} (${u.role})`));
    }
  } finally {
    await disconnectDatabase();
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
