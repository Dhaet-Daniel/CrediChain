-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hash-based verification
CREATE INDEX IF NOT EXISTS idx_credentials_hash ON credentials(hash);

-- Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES credentials(id),
  verifier_name TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  result BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for credential verifications
CREATE INDEX IF NOT EXISTS idx_verifications_credential_id ON verifications(credential_id);

-- Seed data
INSERT INTO credentials (student_name, institution, degree, issue_date, hash, status)
VALUES 
('John Doe', 'University of Excellence', 'B.Sc. Computer Science', '2023-05-20', '0x7a8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p', 'active'),
('Jane Smith', 'Global Institute of Technology', 'M.A. Digital Arts', '2022-11-15', '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p', 'active'),
('Robert Johnson', 'State University', 'B.A. Economics', '2021-06-10', '0xdeadbeef1234567890abcdef12345678', 'active')
ON CONFLICT (hash) DO NOTHING;
