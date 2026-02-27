const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const walletController = require("../controllers/walletController");

// All wallet routes require auth
router.use(authMiddleware);

// GET /api/wallet/balance       → own credit balance
router.get("/balance", walletController.getBalance);

// GET /api/wallet/transactions  → full transaction history
router.get("/transactions", walletController.getTransactions);

// GET /api/wallet/credits       → list active owned credits with metadata
router.get("/credits", walletController.getOwnedCredits);

module.exports = router;
