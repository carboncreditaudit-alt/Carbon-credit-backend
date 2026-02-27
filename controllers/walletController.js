const walletModel = require("../models/walletModel");

// ─── GET /api/wallet/balance ───────────────────────────────────
exports.getBalance = async (req, res) => {
    const { userId } = req.user;
    try {
        const wallet = await walletModel.getWallet(userId);
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });

        res.json({
            user_id: wallet.user_id,
            balance: parseFloat(wallet.balance || 0), // Carbon credits
            fiat_balance: parseFloat(wallet.fiat_balance || 0), // USD
            updated_at: wallet.updated_at,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch wallet balance" });
    }
};

// ─── GET /api/wallet/transactions ─────────────────────────────
exports.getTransactions = async (req, res) => {
    const { userId } = req.user;
    try {
        const transactions = await walletModel.getTransactions(userId);
        res.json({ total: transactions.length, transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
};

// ─── GET /api/wallet/credits ───────────────────────────────────
exports.getOwnedCredits = async (req, res) => {
    const { userId } = req.user;
    try {
        const credits = await walletModel.getOwnedCredits(userId);
        res.json({ total: credits.length, credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch owned credits" });
    }
};

// ─── GET /api/admin/wallet/:userId (Admin only) ───────────────
exports.getAdminWallet = async (req, res) => {
    const targetUserId = req.params.userId;
    try {
        const wallet = await walletModel.getWalletAdmin(targetUserId);
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found for this user" });

        const transactions = await walletModel.getTransactions(targetUserId);

        res.json({
            wallet,
            recent_transactions: transactions.slice(0, 10),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch wallet" });
    }
};