import fs from "fs";
import sqlite3 from "sqlite3";

// SQLite database initialization
const db = new sqlite3.Database(".cache/cache.db");

// const currentCacheFile = "../.cache/conditionv1-100.json";
// const tableName = "conditionv1100";
const currentCacheFile = "../.cache/conditionv2-100.json";
const tableName = "conditionv2100";
// const currentCacheFile = ".cache/freebetv1-100.json";
// const tableName = "freebetv1100";
// const currentCacheFile = ".cache/ipfsmatchdetails-100.json";
// const tableName = "ipfsmatchdetails100";
// const currentCacheFile = ".cache/lpv1-100.json";
// const tableName = "lpv1100";
// const currentCacheFile = ".cache/lpv1bet-100.json";
// const tableName = "lpv1bet100";
// const currentCacheFile = ".cache/lpv1nodewithdrawview-100.json";
// const tableName = "lpv1nodewithdrawview100";
// const currentCacheFile = ".cache/token-100.json";
// const tableName = "token100";

// Read data from JSON file
const jsonData = fs.readFileSync(currentCacheFile, "utf8");
const dataObj = JSON.parse(jsonData);

// Function to migrate data into SQLite database
function migrateData() {
  db.serialize(() => {
    // Create table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        data TEXT
      )
    `);

    // Insert data into the table
    const stmt = db.prepare(
      `INSERT INTO ${tableName} (id, data) VALUES (?, ?)`
    );
    Object.keys(dataObj).forEach((id) => {
      const data = JSON.stringify(dataObj[id]);
      stmt.run(id, data);
    });
    stmt.finalize();

    console.log("Data migrated successfully!");
  });
}

// Call the migration function
migrateData();
