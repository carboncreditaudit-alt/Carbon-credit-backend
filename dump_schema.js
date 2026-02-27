const db = require("./config/db");
const fs = require("fs");

async function dump() {
    let out = "";
    const [tables] = await db.execute("SHOW TABLES");
    for (const t of tables) {
        const tableName = Object.values(t)[0];
        const [cols] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);
        out += `\n--- ${tableName} ---\n`;
        out += cols.map(c => c.Field).join(", ") + "\n";
    }
    fs.writeFileSync("schema_dump.txt", out);
    process.exit(0);
}

dump().catch(console.error);
