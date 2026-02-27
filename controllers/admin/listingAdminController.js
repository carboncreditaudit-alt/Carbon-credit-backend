const listingModel = require("../../models/listingModel");

// GET /api/admin/listings/pending
exports.getPendingListings = async (req, res) => {
    try {
        const listings = await listingModel.getPendingListings();
        res.json({ total: listings.length, listings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch pending listings" });
    }
};

// PATCH /api/admin/listings/:id/approve
exports.approveListing = async (req, res) => {
    try {
        const listing = await listingModel.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        if (listing.status !== "PENDING")
            return res.status(400).json({ message: `Listing is already ${listing.status}` });

        await listingModel.approveListing(req.params.id);
        res.json({ message: "Listing approved and now visible on marketplace" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Approval failed" });
    }
};

// PATCH /api/admin/listings/:id/reject
exports.rejectListing = async (req, res) => {
    const { reason } = req.body;

    try {
        const listing = await listingModel.getListingById(req.params.id);
        if (!listing) return res.status(404).json({ message: "Listing not found" });

        await listingModel.rejectListing(req.params.id, reason || "No reason provided");
        res.json({
            message: "Listing rejected",
            reason: reason || "No reason provided",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Rejection failed" });
    }
};
