const listingModel = require("../models/listingModel");

// ─── POST /api/listings ───────────────────────────────────────
exports.createListing = async (req, res) => {
    const { userId, role } = req.user;

    if (!["FARMER", "NGO"].includes(role))
        return res.status(403).json({ message: "Only Farmers and NGOs can create listings" });

    const { credit_type, quantity, price_per_credit, use_market_price, location, description } = req.body;

    if (!credit_type || !quantity || !location)
        return res.status(400).json({ message: "credit_type, quantity, and location are required" });

    if (!price_per_credit && !use_market_price)
        return res.status(400).json({ message: "Provide a price_per_credit or set use_market_price to true" });

    try {
        const listingId = await listingModel.createListing(userId, req.body);
        res.status(201).json({
            message: "Listing created. Pending admin approval.",
            listingId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create listing" });
    }
};

// ─── GET /api/listings ────────────────────────────────────────
// Supports filters: ?credit_type=&location=&min_price=&max_price=&seller_role=
exports.getListings = async (req, res) => {
    try {
        const filters = {
            credit_type: req.query.credit_type,
            location: req.query.location,
            min_price: req.query.min_price,
            max_price: req.query.max_price,
            seller_role: req.query.seller_role,  // FARMER or NGO
        };
        const listings = await listingModel.getActiveListings(filters);
        res.json({ total: listings.length, listings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch listings" });
    }
};

// ─── GET /api/listings/:id ────────────────────────────────────
exports.getListingById = async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });
        res.json({ listing });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch listing" });
    }
};

// ─── PUT /api/listings/:id ────────────────────────────────────
exports.updateListing = async (req, res) => {
    const { userId, role } = req.user;

    try {
        const listing = await listingModel.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.seller_id !== userId)
            return res.status(403).json({ message: "You can only update your own listings" });

        if (listing.status === "CANCELLED")
            return res.status(400).json({ message: "Cannot update a cancelled listing" });

        await listingModel.updateListing(req.params.id, req.body);
        res.json({ message: "Listing updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update listing" });
    }
};

// ─── DELETE /api/listings/:id ────────────────────────────────
exports.cancelListing = async (req, res) => {
    const { userId } = req.user;

    try {
        const listing = await listingModel.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.seller_id !== userId)
            return res.status(403).json({ message: "You can only cancel your own listings" });

        if (listing.status === "CANCELLED")
            return res.status(400).json({ message: "Listing is already cancelled" });

        await listingModel.cancelListing(req.params.id);
        res.json({ message: "Listing cancelled successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to cancel listing" });
    }
};
