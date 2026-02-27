# Carbon Credit Marketplace API Documentation

Base URL: `http://localhost:5000/api` (adjust port if necessary)

**Authentication:** Most endpoints (except login/register) require a Bearer token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication

### `POST /auth/register`
Register a new user.
*   **Input Body (JSON):**
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "securepassword",
      "role": "FARMER" // Can be FARMER, NGO, COMPANY, ADMIN
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    {
      "message": "Registration successful. Pending admin approval.",
      "userId": 1,
      "token": "eyJhbG..."
    }
    ```

### `POST /auth/login`
Authenticate an existing user.
*   **Input Body (JSON):**
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword"
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "eyJhb...",
      "user": {
        "id": 1,
        "email": "john@example.com",
        "role": "FARMER",
        "status": "ACTIVE"
      }
    }
    ```

---

## 2. User Profile & Settings

### `GET /profile/me`
Fetches the logged-in user's profile details.
*   **Expected Output (200 OK):**
    ```json
    {
      "profile": {
        "id": 1,
        "email": "john@example.com",
        "role": "FARMER",
        "status": "ACTIVE",
        ... (role specific fields like 'land_size', 'company_name', etc.)
      }
    }
    ```

### `PUT /profile/me`
Updates profile details (fields depend on user role).
*   **Input Body (JSON - Example for Farmer):**
    ```json
    {
      "phone": "9876543210",
      "location": "Punjab",
      "land_size": 10
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Profile updated successfully" }
    ```

### `POST /profile/kyc/upload`
Upload a KYC document for verification.
*   **Input (multipart/form-data):**
    *   `kyc_document`: The file to upload (PDF, PNG, JPG)
*   **Expected Output (200 OK):**
    ```json
    { "message": "KYC document uploaded successfully. Pending verification." }
    ```

### `GET /profile/kyc/status`
Check the status of the uploaded KYC document.
*   **Expected Output (200 OK):**
    ```json
    {
      "status": "PENDING" // PENDING, APPROVED, REJECTED
    }
    ```

### `POST /profile/bank-account` (Also supports PUT)
Set or update bank account details (for Farmers and NGOs).
*   **Input Body (JSON):**
    ```json
    {
      "bank_name": "State Bank",
      "bank_account": "123456789",
      "ifsc_code": "SBIN0001"
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Bank details updated" }
    ```

### `POST /profile/payment-method` (Also supports PUT)
Set or update payment method details (for Companies).
*   **Input Body (JSON):**
    ```json
    {
      "payment_method": "CREDIT_CARD"
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Payment method updated" }
    ```

### `POST /profile/terms/accept`
Accept platform terms and conditions.
*   **Expected Output (200 OK):**
    ```json
    { "message": "Terms accepted successfully" }
    ```

---

## 3. Carbon Activities (For Farmers)

### `POST /activities`
Submit a new carbon activity.
*   **Input Body (JSON):**
    ```json
    {
      "activity_type": "TREE_PLANTATION",
      "description": "Planted 200 trees",
      "area_covered": 4.5,
      "location": "Punjab, India"
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    {
      "message": "Activity submitted. Pending verification.",
      "activityId": 1
    }
    ```

### `GET /activities`
List all activities submitted by the logged-in farmer.
*   **Expected Output (200 OK):**
    ```json
    {
      "total": 1,
      "activities": [
        { "id": 1, "activity_type": "TREE_PLANTATION", "status": "APPROVED", ... }
      ]
    }
    ```

### `GET /activities/:id`
Get details of a specific activity.
*   **Expected Output (200 OK):**
    ```json
    { "activity": { "id": 1, ... } }
    ```

### `GET /activities/:id/estimate`
Calculate the estimated carbon credits for an activity based on its type and area.
*   **Expected Output (200 OK):**
    ```json
    {
      "activity_id": 1,
      "activity_type": "TREE_PLANTATION",
      "area_covered": 4.5,
      "estimated_credits": 22.5,
      "note": "Actual credits issued after admin verification"
    }
    ```

### `POST /activities/:id/proof`
Upload proof images or GPS coordinates for an activity.
*   **Input (multipart/form-data):**
    *   `proof_image`: File
    *   `gps`: "28.6139,77.2090" (optional)
*   **Expected Output (200 OK):**
    ```json
    { "message": "Proof uploaded successfully", ... }
    ```

---

## 4. NGO Carbon Projects (For NGOs)

### `POST /ngo/projects`
Submit a massive carbon project.
*   **Input Body (JSON):**
    ```json
    {
      "project_name": "Reforestation Initiative",
      "project_type": "REFORESTATION",
      "description": "Initiative describing massive tree planting",
      "location": "Rajasthan",
      "area_covered": 500
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    {
      "message": "Project submitted. Pending admin verification.",
      "projectId": 2
    }
    ```

### `GET /ngo/projects`
List all projects for the logged-in NGO.
*   **Expected Output (200 OK):**
    ```json
    { "total": 1, "projects": [ ... ] }
    ```

### `POST /ngo/projects/:id/aggregate-farmers`
Aggregate approved farmer activities into a single massive NGO project to generate bulk credits.
*   **Input Body (JSON):**
    ```json
    {
      "activity_ids": [1, 2, 3]
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "3 activities aggregated successfully into project.", "total_estimated_credits_added": 45.5 }
    ```

---

## 5. Wallet & Credits

### `GET /wallet/balance`
Get current user wallet active balance (available for sale/retirement).
*   **Expected Output (200 OK):**
    ```json
    { "wallet": { "balance": 150.00, "updated_at": "..." } }
    ```

### `GET /wallet/transactions`
Get the transaction history (credits earned, bought, sold, retired).
*   **Expected Output (200 OK):**
    ```json
    {
      "total": 5,
      "transactions": [ { "type": "CREDIT_EARNED", "amount": 25, "description": "...", "created_at": "..." } ]
    }
    ```

### `GET /wallet/credits`
Get currently owned active credit batches.
*   **Expected Output (200 OK):**
    ```json
    { "total_active_batches": 2, "credits": [ ... ] }
    ```

---

## 6. Marketplace Listings (Selling)

### `POST /listings`
Create a new marketplace listing (for Farmers/NGOs).
*   **Input Body (JSON):**
    ```json
    {
      "credit_type": "TREE_PLANTATION",
      "quantity": 50,
      "price_per_credit": 15.50,
      "location": "India"
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    { "message": "Listing created and pending admin approval", "listingId": 1 }
    ```

### `GET /listings`
Browse all Active marketplace listings (For Companies to buy). Optional query parameters: `?credit_type=&location=&min_price=&max_price=`
*   **Expected Output (200 OK):**
    ```json
    { "total": 10, "listings": [ ... ] }
    ```

### `PUT /listings/:id`
Update an active/pending listing.
*   **Input Body (JSON):**
    ```json
    { "price_per_credit": 16.00, "quantity_available": 45 }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Listing updated successfully" }
    ```

---

## 7. Orders & Escrow (Buying)

### `POST /orders`
Purchase carbon credits (Creates an escrow hold).
*   **Input Body (JSON):**
    ```json
    {
      "listing_id": 1,
      "quantity": 10
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    {
      "message": "Order placed successfully. Funds held in escrow.",
      "orderId": 1,
      "totalAmount": 155.00
    }
    ```

### `GET /orders`
List all orders for the current user (as a buyer or seller).
*   **Expected Output (200 OK):**
    ```json
    { "total": 2, "orders": [ ... ] }
    ```

### `PUT /orders/:id/confirm`
Confirm an order (Platform/Admin use) transferring credits to the buyer and releasing escrow.
*   **Expected Output (200 OK):**
    ```json
    { "message": "Order confirmed and credits transferred" }
    ```

---

## 8. Retirements & Certificates

### `POST /retirement`
Retire active credits from wallet to offset carbon footprint.
*   **Input Body (JSON):**
    ```json
    {
      "credits_to_retire": 10,
      "retirement_purpose": "2025 Corporate ESG Offset",
      "reporting_year": 2025
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    {
      "message": "Credits retired successfully",
      "retirementId": 1,
      "certificateNumber": "CERT-123456789-5"
    }
    ```

### `GET /retirement/:id/certificate`
Generate an immutable retirement certificate.
*   **Expected Output (200 OK):**
    ```json
    {
      "certificate": {
        "certificate_id": "CERT-123456789-5",
        "retired_by": "Green Corp",
        "credits_retired": 10,
        "purpose": "2025 Corporate ESG Offset"
      }
    }
    ```

---

## 9. Disputes

### `POST /disputes`
Raise a dispute on an order.
*   **Input Body (JSON):**
    ```json
    {
      "order_id": 1,
      "dispute_type": "PAYMENT_ISSUE",
      "description": "Never received the transferred credits."
    }
    ```
*   **Expected Output (201 Created):**
    ```json
    { "message": "Dispute raised successfully", "disputeId": 1 }
    ```

### `GET /disputes`
Get all disputes raised by the current user.
*   **Expected Output (200 OK):**
    ```json
    { "total": 1, "disputes": [ ... ] }
    ```

---

## 10. Admin Endpoints

All endpoints require an `ADMIN` role JWT (`Authorization: Bearer <token>`).

### `GET /admin/users`
Get all users on the platform. Returns a list of users.
*   **Expected Output (200 OK):**
    ```json
    { "total": 15, "users": [ ... ] }
    ```

### `GET /admin/users/pending`
Get users whose accounts are pending approval.
*   **Expected Output (200 OK):**
    ```json
    { "total": 3, "pendingUsers": [ ... ] }
    ```

### `PATCH /admin/users/:id/approve`
Approve a pending user account (Farmer, NGO, Company).
*   **Expected Output (200 OK):**
    ```json
    { "message": "User approved successfully" }
    ```

### `GET /admin/activities/pending`
Get pending farmer carbon activities undergoing verification.
*   **Expected Output (200 OK):**
    ```json
    { "total": 5, "activities": [ ... ] }
    ```

### `PATCH /admin/activities/:id/approve`
Approve a farmer’s activity and mint credits to their wallet.
*   **Input Body (JSON):**
    ```json
    { "credits_issued": 25.5 }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Activity approved and credits issued" }
    ```

### `GET /admin/ngo/projects/pending`
Get pending massive NGO carbon projects.
*   **Expected Output (200 OK):**
    ```json
    { "total": 2, "projects": [ ... ] }
    ```

### `PATCH /admin/ngo/projects/:id/approve`
Approve an NGO project and issue bulk credits.
*   **Input Body (JSON):**
    ```json
    { "credits_issued": 500 }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Project approved and credits issued" }
    ```

### `GET /admin/listings/pending`
Get pending marketplace listings waiting to go LIVE.
*   **Expected Output (200 OK):**
    ```json
    { "total": 4, "listings": [ ... ] }
    ```

### `PATCH /admin/listings/:id/approve`
Approve a marketplace listing (making it HIGHLY visible to buyers).
*   **Expected Output (200 OK):**
    ```json
    { "message": "Listing approved and is now active on the marketplace" }
    ```

### `GET /admin/escrow`
View all orders currently held in the safety ESCROW vault.
*   **Expected Output (200 OK):**
    ```json
    { "total_in_escrow": 15, "orders": [ ... ] }
    ```

### `PATCH /admin/escrow/:id/release`
Release escrow funds to the seller (completes the order lifecycle).
*   **Expected Output (200 OK):**
    ```json
    { "message": "Escrow released to seller successfully" }
    ```

### `GET /admin/disputes`
View all platform disputes spanning all users.
*   **Expected Output (200 OK):**
    ```json
    { "total": 2, "disputes": [ ... ] }
    ```

### `PATCH /admin/disputes/:id/resolve`
Admin officially resolves a dispute.
*   **Input Body (JSON):**
    ```json
    {
      "resolution": "Refunded buyer due to undelivered credits.",
      "decision": "FAVOUR_BUYER" // Or "FAVOUR_SELLER"
    }
    ```
*   **Expected Output (200 OK):**
    ```json
    { "message": "Dispute resolved successfully" }
    ```

---

## 11. Reports & Analytics (Admin Only)

All analytics endpoints require an `ADMIN` role JWT.

### `GET /admin/reports/dashboard`
Get global high-level platform KPIs.
*   **Expected Output (200 OK):**
    ```json
    {
      "active_users": 120,
      "total_credits_minted": 50000,
      "total_credits_retired": 15000,
      "total_trading_volume": 250000.50
    }
    ```

### `GET /admin/reports/credits-issued`
Analytics on minted carbon credits (Farmer vs NGO breakdown).
*   **Expected Output (200 OK):**
    ```json
    {
      "summary": { "farmer_credits_total": 500, "ngo_credits_total": 45000, "grand_total": 45500 },
      "farmer_activity_credits": [ ... ],
      "ngo_project_credits": [ ... ]
    }
    ```

### `GET /admin/reports/marketplace`
Analytics on marketplace trading volumes, escrow holds, and generated commissions.
*   **Expected Output (200 OK):**
    ```json
    {
      "summary": {
        "total_orders": 450,
        "gross_revenue": 250000.50,
        "total_commission": 12500.02
      },
      "monthly_breakdown": [ ... ]
    }
    ```

### `GET /admin/reports/users`
Analytics on user acquisition broken down by role and status.
*   **Expected Output (200 OK):**
    ```json
    {
      "totals": { "total_users": 150, "active": 120 },
      "by_role_and_status": [ ... ],
      "recent_signups": [ ... ]
    }
    ```

### `GET /admin/reports/commission`
Detailed breakdown of the 5% platform fee revenue over time.
*   **Expected Output (200 OK):**
    ```json
    {
      "summary": { "total_commission_earned": 12500.02, "commission_rate": "5%" },
      "monthly_commission": [ ... ]
    }
    ```

### `GET /admin/reports/compliance`
Platform health security checks (double-selling risks, stale escrows).
*   **Expected Output (200 OK):**
    ```json
    {
      "listing_health": { "active_listings": 45, "sold_out_listings": 120 },
      "stale_escrow_orders": [ ... ],
      "dispute_summary": { "open_disputes": 2 },
      "aggregated_activities": { "total_aggregated": 0, "records": [] }
    }
    ```
