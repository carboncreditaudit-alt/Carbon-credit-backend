SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs, carbon_activities, carbon_credits, companies, credit_retirements, credit_transfers, credit_wallets, wallet_transactions, disputes, farmers, kyc_documents, marketplace_listings, ngos, orders, transactions, user_credits, user_kyc, users, ngo_projects, project_farmers;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'FARMER', 'NGO', 'COMPANY') NOT NULL,
  status ENUM('PENDING', 'ACTIVE', 'SUSPENDED') DEFAULT 'PENDING',
  terms_accepted TINYINT(1) DEFAULT 0,
  rejection_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  land_size DECIMAL(10,2) NULL,
  location VARCHAR(255) NULL,
  bank_account VARCHAR(100) NULL,
  bank_name VARCHAR(100) NULL,
  ifsc_code VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ngos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  organization_name VARCHAR(255) NULL,
  registration_number VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  bank_account VARCHAR(100) NULL,
  bank_name VARCHAR(100) NULL,
  ifsc_code VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  esg_document_url VARCHAR(255) NULL,
  payment_method VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE kyc_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE carbon_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NULL,
  area_covered DECIMAL(10,2) NOT NULL,
  location VARCHAR(255) NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROOF_REQUESTED') DEFAULT 'PENDING',
  estimated_credits DECIMAL(10,2) DEFAULT 0,
  proof_image_url VARCHAR(255) NULL,
  proof_gps VARCHAR(100) NULL,
  admin_note TEXT NULL,
  rejection_reason TEXT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ngo_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_id INT NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL,
  description TEXT NULL,
  location VARCHAR(255) NOT NULL,
  area_covered DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED') DEFAULT 'PENDING',
  rejection_reason TEXT NULL,
  estimated_credits DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_farmers (
  project_id INT NOT NULL,
  activity_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, activity_id),
  FOREIGN KEY (project_id) REFERENCES ngo_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES carbon_activities(id) ON DELETE CASCADE
);

CREATE TABLE credit_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet_id INT NOT NULL,
  transaction_type ENUM('CREDIT', 'DEBIT') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wallet_id) REFERENCES credit_wallets(id) ON DELETE CASCADE
);

CREATE TABLE marketplace_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  credit_type VARCHAR(50) NOT NULL,
  quantity_available DECIMAL(10,2) NOT NULL,
  price_per_credit DECIMAL(15,2) NOT NULL,
  location VARCHAR(255) NULL,
  description TEXT NULL,
  status ENUM('PENDING', 'ACTIVE', 'SOLD_OUT', 'CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE orders (
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
  status ENUM('ESCROW', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'ESCROW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  released_at TIMESTAMP NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id) ON DELETE CASCADE
);

CREATE TABLE disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  raised_by INT NOT NULL,
  dispute_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('OPEN', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
  admin_resolution TEXT DEFAULT NULL,
  decision ENUM('FAVOUR_BUYER', 'FAVOUR_SELLER', 'SPLIT') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_credits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  credit_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE credit_retirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  credits_retired DECIMAL(10,2) NOT NULL,
  retirement_purpose VARCHAR(255) NOT NULL,
  reporting_year INT NOT NULL,
  certificate_id VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
