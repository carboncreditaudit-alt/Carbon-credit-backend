const db = require("./config/db");
const fs = require("fs");

async function runSchema() {
    const sql = fs.readFileSync("schema.sql", "utf-8");
    // Split by semicolon, ignoring empty
    const queries = sql.split(";").map(q => q.trim()).filter(q => q.length > 0);

    for (const q of queries) {
        try {
            await db.execute(q);
            console.log("Executed: ", q.substring(0, 40) + "...");
        } catch (e) {
            console.error("Error executing: ", q.substring(0, 40));
            console.error(e.message);
        }
    }
    process.exit(0);
}

runSchema().catch(console.error);
