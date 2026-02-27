const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const orderController = require("../controllers/orderController");

// All order routes require authentication
router.use(authMiddleware);

// POST   /api/orders              → Initiate purchase (Company only)
router.post("/", orderController.createOrder);

// GET    /api/orders              → List own orders (buyer or seller)
router.get("/", orderController.getMyOrders);

// GET    /api/orders/:id          → Order detail
router.get("/:id", orderController.getOrderById);

// PUT    /api/orders/:id/confirm  → Confirm transaction (buyer or admin)
router.put("/:id/confirm", orderController.confirmOrder);

// PUT    /api/orders/:id/cancel   → Cancel order (buyer or admin)
router.put("/:id/cancel", orderController.cancelOrder);

module.exports = router;
