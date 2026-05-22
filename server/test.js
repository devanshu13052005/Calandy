
const { Client } = require('pg');

const client = new Client({
  connectionString:"postgresql://postgres.tfakhjjxnoxymdniuibk:tayaldevanshu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
});

client.connect()
  .then(() => {
    console.log("DATABASE CONNECTED");
    return client.end();
  })
  .catch(err => {
    console.error("DB ERROR:");
    console.error(err);
  });