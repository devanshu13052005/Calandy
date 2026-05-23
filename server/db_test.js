const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.tfakhjjxnoxymdniuibk:tayaldevanshu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

async function run() {
  await client.connect();
  console.log("Connected to DB");

  const schedules = await client.query("SELECT * FROM availability_schedules");
  console.log("\n--- SCHEDULES ---");
  console.log(schedules.rows);

  const overrides = await client.query("SELECT * FROM date_overrides");
  console.log("\n--- DATE OVERRIDES ---");
  console.log(overrides.rows);

  const rules = await client.query("SELECT * FROM availability_rules LIMIT 10");
  console.log("\n--- RULES (LIMIT 10) ---");
  console.log(rules.rows);

  await client.end();
}

run().catch(console.error);
