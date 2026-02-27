/**
 * Carbon Credit Marketplace — Full API Test Suite
 * Run: node test_apis.js
 * Node 18+ required (uses built-in fetch)
 */

const BASE = "http://localhost:5001/api";

// ─── Colour helpers ──────────────────────────────────────────────
const fs = require("fs");
fs.writeFileSync("test_run.log", "");
const log = (msg) => {
    fs.appendFileSync("test_run.log", msg + "\n");
};

const g = (s) => s;
const r = (s) => s;
const y = (s) => s;
const b = (s) => s;

let passed = 0, failed = 0;
const issues = [];

// ─── Core request helper ─────────────────────────────────────────
async function req(method, path, body, token, expectStatus = 200) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
        const res = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        const ok = res.status === expectStatus;
        if (ok) {
            passed++;
            log(g(`  ✔ ${method} ${path}  [${res.status}]`));
        } else {
            failed++;
            const msg = `FAIL ${method} ${path}  → expected ${expectStatus}, got ${res.status}: ${JSON.stringify(data).substring(0, 120)}`;
            issues.push(msg);
            log(r(`  ✘ ${msg}`));
        }
        return { status: res.status, data, ok };
    } catch (err) {
        failed++;
        const msg = `ERROR ${method} ${path} → ${err.message}`;
        issues.push(msg);
        log(r(`  ✘ ${msg}`));
        return { status: 0, data: {}, ok: false };
    }
}

// ─── Test runner ─────────────────────────────────────────────────
async function run() {
    log(b("\n═══════════════════════════════════════════════════"));
    log(b("  Carbon Credit Marketplace — API Test Suite"));
    log(b("═══════════════════════════════════════════════════\n"));

    // === 0. HEALTH CHECK ============================================
    log(y("── 0. Health Check"));
    await req("GET", "/../", null, null, 200);

    // ── 1. AUTH ─────────────────────────────────────────────────────
    log(y("\n── 1. Auth — Register & Login"));

    const ts = Date.now();
    const farmerEmail = `farmer_${ts}@test.com`;
    const ngoEmail = `ngo_${ts}@test.com`;
    const companyEmail = `company_${ts}@test.com`;
    const adminEmail = `admin_${ts}@test.com`;
    const pass = "Test@1234";

    // Register users
    const farmerReg = await req("POST", "/auth/register", { email: farmerEmail, password: pass, role: "FARMER", profile: { land_size: 5, location: "Punjab" } }, null, 201);
    const ngoReg = await req("POST", "/auth/register", { email: ngoEmail, password: pass, role: "NGO", profile: { org_name: "GreenNGO", registration_number: "NGO123" } }, null, 201);
    const companyReg = await req("POST", "/auth/register", { email: companyEmail, password: pass, role: "COMPANY", profile: { company_name: "EcoTech Ltd" } }, null, 201);
    const adminReg = await req("POST", "/auth/register", { email: adminEmail, password: pass, role: "ADMIN" }, null, 201);

    // Extract user IDs from register response
    const farmerId = farmerReg.data?.userId;
    const ngoId = ngoReg.data?.userId;
    const companyId = companyReg.data?.userId;

    // Login Admin ONLY first
    const adminLogin = await req("POST", "/auth/login", { email: adminEmail, password: pass }, null, 200);
    const aT = adminLogin.data?.token;

    if (!aT) {
        log(r("\n  ⛔ Admin login failed. Aborting."));
        printSummary(); return;
    }

    // ── 3. ADMIN — User Verification ────────────────────────────────
    log(y("\n── 3. Admin — User Verification"));
    await req("GET", "/admin/users/pending", null, aT, 200);
    await req("GET", "/admin/users", null, aT, 200);
    await req("GET", `/admin/users/${farmerId}`, null, aT, 200);

    // Approve users so they can operate
    await req("PATCH", `/admin/users/${farmerId}/approve`, null, aT, 200);
    await req("PATCH", `/admin/users/${ngoId}/approve`, null, aT, 200);
    await req("PATCH", `/admin/users/${companyId}/approve`, null, aT, 200);

    // NOW Login other users
    const farmerLogin = await req("POST", "/auth/login", { email: farmerEmail, password: pass }, null, 200);
    const ngoLogin = await req("POST", "/auth/login", { email: ngoEmail, password: pass }, null, 200);
    const companyLogin = await req("POST", "/auth/login", { email: companyEmail, password: pass }, null, 200);

    // Extract their tokens
    const fT = farmerLogin.data?.token;
    const nT = ngoLogin.data?.token;
    const cT = companyLogin.data?.token;

    if (!fT) {
        log(r("\n  ⛔ Farmer login failed. Aborting remaining tests."));
        printSummary(); return;
    }

    // ── 2. PROFILE ──────────────────────────────────────────────────
    log(y("\n── 2. Profile & KYC"));
    await req("GET", "/profile/me", null, fT, 200);
    await req("PUT", "/profile/me", { phone: "9876543210" }, fT, 200);
    await req("GET", "/profile/kyc/status", null, fT, 404);
    await req("POST", "/profile/terms/accept", null, fT, 200);

    // ── 4. CARBON ACTIVITY ──────────────────────────────────────────
    log(y("\n── 4. Carbon Activity (Farmer)"));
    const activityRes = await req("POST", "/activities", {
        activity_type: "TREE_PLANTATION",
        description: "Planted 200 trees",
        area_covered: 4,
        location: "Punjab, India"
    }, fT, 201);
    const activityId = activityRes.data?.activityId;

    await req("GET", "/activities", null, fT, 200);
    await req("GET", `/activities/${activityId}`, null, fT, 200);
    await req("GET", `/activities/${activityId}/estimate`, null, fT, 200);

    // Admin — approve activity
    log(y("\n── 4b. Admin — Activity Verification"));
    await req("GET", "/admin/activities/pending", null, aT, 200);
    await req("PATCH", `/admin/activities/${activityId}/approve`, null, aT, 200);

    // ── 5. NGO CARBON PROJECTS ──────────────────────────────────────
    log(y("\n── 5. NGO Carbon Projects"));
    const projectRes = await req("POST", "/ngo/projects", {
        project_name: "Rajasthan Reforestation",
        project_type: "REFORESTATION",
        description: "10,000 trees",
        location: "Rajasthan, India",
        area_covered: 50
    }, nT, 201);
    const projectId = projectRes.data?.projectId;

    await req("GET", "/ngo/projects", null, nT, 200);
    await req("GET", `/ngo/projects/${projectId}`, null, nT, 200);
    await req("POST", `/ngo/projects/${projectId}/aggregate-farmers`, { activity_ids: [activityId] }, nT, 200);

    // Admin — approve NGO project
    log(y("\n── 5b. Admin — NGO Project Verification"));
    await req("GET", "/admin/ngo/projects/pending", null, aT, 200);
    await req("PATCH", `/admin/ngo/projects/${projectId}/approve`, null, aT, 200);

    // ── 6. WALLET ───────────────────────────────────────────────────
    log(y("\n── 6. Wallet & Credits"));
    await req("GET", "/wallet/balance", null, fT, 200);
    await req("GET", "/wallet/transactions", null, fT, 200);
    await req("GET", "/wallet/credits", null, fT, 200);
    await req("GET", `/admin/wallet/${farmerId}`, null, aT, 200);

    // ── 7. MARKETPLACE LISTINGS ─────────────────────────────────────
    log(y("\n── 7. Marketplace Listings"));
    const listingRes = await req("POST", "/listings", {
        credit_type: "TREE_PLANTATION",
        quantity: 10,
        price_per_credit: 500,
        location: "Punjab, India",
        description: "Verified credits"
    }, fT, 201);
    const listingId = listingRes.data?.listingId;

    await req("GET", "/listings", null, null, 200); // public
    await req("GET", `/listings/${listingId}`, null, null, 200);
    await req("GET", "/listings?credit_type=TREE_PLANTATION", null, null, 200);
    await req("GET", "/listings?seller_role=FARMER", null, null, 200);

    // Admin — approve listing
    console.log(y("\n── 7b. Admin — Listing Verification"));
    await req("GET", "/admin/listings/pending", null, aT, 200);
    await req("PATCH", `/admin/listings/${listingId}/approve`, null, aT, 200);

    await req("PUT", `/listings/${listingId}`, { price_per_credit: 600, quantity_available: 10, description: "Updated" }, fT, 200);

    // ── 8. PURCHASES & ESCROW ────────────────────────────────────────
    console.log(y("\n── 8. Purchases & Escrow"));
    const orderRes = await req("POST", "/orders", { listing_id: listingId, quantity: 2 }, cT, 201);
    const orderId = orderRes.data?.orderId;

    await req("GET", "/orders", null, cT, 200);
    await req("GET", `/orders/${orderId}`, null, cT, 200);
    await req("PUT", `/orders/${orderId}/confirm`, null, cT, 200);

    // Admin escrow
    await req("GET", "/admin/escrow", null, aT, 200);
    await req("PATCH", `/admin/escrow/${orderId}/release`, null, aT, 200);

    // ── 9. CREDIT RETIREMENT ─────────────────────────────────────────
    console.log(y("\n── 9. Credit Retirement & Certificates"));
    const retireRes = await req("POST", "/retirement", {
        credits_to_retire: 1,
        retirement_purpose: "Net Zero 2025",
        reporting_year: 2025
    }, cT, 201);
    const retirementId = retireRes.data?.retirementId;

    await req("GET", "/retirement", null, cT, 200);
    await req("GET", `/retirement/${retirementId}`, null, cT, 200);
    await req("GET", `/retirement/${retirementId}/certificate`, null, cT, 200);
    await req("GET", `/retirement/${retirementId}/esg-report`, null, cT, 200);
    await req("GET", "/admin/retirements", null, aT, 200);

    // ── 10. DISPUTES ──────────────────────────────────────────────────
    console.log(y("\n── 10. Disputes"));
    const disputeRes = await req("POST", "/disputes", {
        order_id: orderId,
        dispute_type: "CREDIT_TRANSFER",
        description: "Test dispute — credit transfer delay"
    }, cT, 201);
    const disputeId = disputeRes.data?.disputeId;

    await req("GET", "/disputes", null, cT, 200);
    await req("GET", `/disputes/${disputeId}`, null, cT, 200);

    // Admin resolve
    await req("GET", "/admin/disputes", null, aT, 200);
    await req("PATCH", `/admin/disputes/${disputeId}/resolve`, {
        resolution: "Verified — credits transferred successfully",
        decision: "FAVOUR_BUYER"
    }, aT, 200);

    // ── 11. REPORTS ────────────────────────────────────────────────
    console.log(y("\n── 11. Reports & Analytics"));
    await req("GET", "/admin/reports/dashboard", null, aT, 200);
    await req("GET", "/admin/reports/credits-issued", null, aT, 200);
    await req("GET", "/admin/reports/marketplace", null, aT, 200);
    await req("GET", "/admin/reports/users", null, aT, 200);
    await req("GET", "/admin/reports/commission", null, aT, 200);
    await req("GET", "/admin/reports/compliance", null, aT, 200);

    // ── EDGE CASES ──────────────────────────────────────────────────
    console.log(y("\n── Edge Cases"));
    await req("POST", "/activities", { activity_type: "TREE_PLANTATION", area_covered: 1, location: "X" }, cT, 403); // company → forbidden
    await req("POST", "/listings", { credit_type: "X", quantity: 5, location: "Y", price_per_credit: 100 }, cT, 403); // company → forbidden
    await req("POST", "/retirement", { credits_to_retire: 1, retirement_purpose: "test" }, fT, 403); // farmer → forbidden
    await req("POST", "/orders", { listing_id: 1, quantity: 5 }, fT, 403); // farmer → forbidden
    await req("POST", "/auth/login", { email: "wrong@x.com", password: "wrong" }, null, 404);
    await req("GET", `/listings/99999`, null, null, 404); // non-existent listing

    printSummary();
}

function printSummary() {
    console.log(b("\n═══════════════════════════════════════════════════"));
    console.log(b("  RESULTS"));
    console.log(b("═══════════════════════════════════════════════════"));
    console.log(g(`  ✔ Passed: ${passed}`));
    console.log(r(`  ✘ Failed: ${failed}`));
    if (issues.length > 0) {
        console.log(y("\n  Issues Found:"));
        issues.forEach((i, n) => console.log(r(`    ${n + 1}. ${i}`)));
    } else {
        console.log(g("\n  ✅ All tests passed! No issues found."));
    }
    console.log(b("═══════════════════════════════════════════════════\n"));
}

run().catch(console.error);
