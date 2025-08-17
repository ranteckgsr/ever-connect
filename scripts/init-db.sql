-- Initialize database schema for EverConnect
-- This mimics the production RDS database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    storage_location TEXT,
    s3_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert test data (optional - comment out if not needed)
-- Password is 'Test123!' hashed with bcrypt
INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, file_name, storage_location)
VALUES 
    ('testuser1', 'Test', 'User', 'test1@example.com', '+15551234567', '$2a$10$YourHashedPasswordHere', 'test-file.pdf', 'user-files/1/test-file.pdf'),
    ('testuser2', 'Demo', 'Account', 'demo@example.com', '+15559876543', '$2a$10$YourHashedPasswordHere', 'demo-file.pdf', 'user-files/2/demo-file.pdf')
ON CONFLICT DO NOTHING;