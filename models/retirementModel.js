const db = require("../config/db");

// ─── Retire credits ───────────────────────────────────────────
exports.retireCredits = async (userId, data) => {
    const { credits_to_retire, retirement_purpose, project_name, reporting_year } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check wallet balance
        const [wallets] = await conn.execute(
            `SELECT balance FROM credit_wallets WHERE user_id = ? FOR UPDATE`,
            [userId]
        );
        const wallet = wallets[0];
        if (!wallet || wallet.balance < credits_to_retire) {
            throw new Error("INSUFFICIENT_BALANCE");
        }

        // 2. Generate unique certificate number
        const certNumber = `CERT-${Date.now()}-${userId}`;

        // 3. Create retirement record
        const [result] = await conn.execute(
            `INSERT INTO credit_retirements
         (user_id, credits_retired, retirement_purpose,
          reporting_year, certificate_id, status)
       VALUES (?, ?, ?, ?, ?, 'VERIFIED')`,
            [
                userId,
                credits_to_retire,
                retirement_purpose,
                reporting_year || new Date().getFullYear(),
                certNumber,
            ]
        );

        // 4. Deduct from wallet
        await conn.execute(
            `UPDATE credit_wallets
       SET balance = balance - ?
       WHERE user_id = ?`,
            [credits_to_retire, userId]
        );

        // 5. Mark user_credits as RETIRED (FIFO: oldest first)
        const [activeCredits] = await conn.execute(
            `SELECT id, quantity FROM user_credits
       WHERE owner_id = ? AND status = 'ACTIVE'
       ORDER BY created_at ASC`,
            [userId]
        );

        let remaining = parseFloat(credits_to_retire);
        for (const credit of activeCredits) {
            if (remaining <= 0) break;
            if (credit.quantity <= remaining) {
                await conn.execute(
                    `UPDATE user_credits SET status = 'RETIRED' WHERE id = ?`,
                    [credit.id]
                );
                remaining -= credit.quantity;
            } else {
                // Partial retirement: split the record
                await conn.execute(
                    `UPDATE user_credits SET quantity = quantity - ? WHERE id = ?`,
                    [remaining, credit.id]
                );
                remaining = 0;
            }
        }

        await conn.commit();
        return { retirementId: result.insertId, certificateNumber: certNumber };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── List own retirements ─────────────────────────────────────
exports.getRetirementsByUser = async (userId) => {
    const [rows] = await db.execute(
        `SELECT id, credits_retired, retirement_purpose,
            reporting_year, certificate_id, status, created_at
     FROM credit_retirements
     WHERE user_id = ?
     ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

// ─── Get single retirement ────────────────────────────────────
exports.getRetirementById = async (retirementId) => {
    const [rows] = await db.execute(
        `SELECT r.*, u.email, u.role
     FROM credit_retirements r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
        [retirementId]
    );
    return rows[0];
};

// ─── Get company profile (for certificate) ────────────────────
exports.getCompanyProfile = async (userId) => {
    const [rows] = await db.execute(
        `SELECT u.email, c.company_name
     FROM users u
     JOIN companies c ON c.user_id = u.id
     WHERE u.id = ?`,
        [userId]
    );
    return rows[0];
};

// ─── All retirements audit log (admin) ────────────────────────
exports.getAllRetirements = async () => {
    const [rows] = await db.execute(
        `SELECT r.id, r.credits_retired, r.retirement_purpose,
            r.reporting_year, r.certificate_id, r.status, r.created_at,
            u.email, u.role
     FROM credit_retirements r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC`
    );
    return rows;
};
