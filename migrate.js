const db = require("./config/db");

async function runMigrations() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_id INT NOT NULL,
      seller_id INT NOT NULL,
      listing_id INT NOT NULL,
      credit_type VARCHAR(50) NOT NULL,
      credits_purchased DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      escrow_amount DECIMAL(15,2) DEFAULT 0,
      commission_deducted DECIMAL(15,2) DEFAULT 0,
      seller_payout DECIMAL(15,2) DEFAULT 0,
      status ENUM('ESCROW','CONFIRMED','COMPLETED','CANCELLED','REFUNDED') DEFAULT 'ESCROW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      released_at TIMESTAMP NULL
    )`,

        `CREATE TABLE IF NOT EXISTS disputes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      raised_by INT NOT NULL,
      dispute_type VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      status ENUM('OPEN','RESOLVED','CLOSED') DEFAULT 'OPEN',
      admin_resolution TEXT DEFAULT NULL,
      decision ENUM('FAVOUR_BUYER','FAVOUR_SELLER','SPLIT') NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL
    )`,

        `CREATE TABLE IF NOT EXISTS credit_retirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      credits_retired DECIMAL(10,2) NOT NULL,
      retirement_purpose VARCHAR(255) NOT NULL,
      reporting_year INT NOT NULL,
      certificate_id VARCHAR(100) NOT NULL UNIQUE,
      status ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

        `CREATE TABLE IF NOT EXISTS user_credits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL,
      credit_type VARCHAR(50) NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      source_type VARCHAR(50) NOT NULL,
      source_id INT NOT NULL,
      status VARCHAR(50) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

        `DROP TABLE IF EXISTS marketplace_listings`,

        `CREATE TABLE marketplace_listings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seller_id INT NOT NULL,
      credit_type VARCHAR(50) NOT NULL,
      quantity_available DECIMAL(10,2) NOT NULL,
      price_per_credit DECIMAL(15,2) NOT NULL,
      location VARCHAR(255) NULL,
      description TEXT NULL,
      status ENUM('ACTIVE','SOLD_OUT','CANCELLED','PENDING') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    ];

    for (const q of queries) {
        try {
            await db.execute(q);
            console.log("Executed: ", q.substring(0, 40) + "...");
        } catch (e) {
            console.error("Error executing: ", q.substring(0, 40));
            console.error(e.message);
        }
    }

    try {
        await db.execute(`ALTER TABLE marketplace_listings CHANGE farmer_id seller_id INT NOT NULL`);
        console.log("Renamed farmer_id to seller_id");
    } catch (e) {
        console.log("Could not change farmer_id to seller_id", e.message);
    }

    process.exit(0);
}

runMigrations();
