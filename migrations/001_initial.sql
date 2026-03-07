-- CONCH Platform Database Schema
-- Version 1.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    public_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on users email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Conches table
CREATE TABLE IF NOT EXISTS conches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state JSONB NOT NULL DEFAULT '{}',
    story TEXT NOT NULL,
    lineage UUID[] DEFAULT '{}',
    intent VARCHAR(500) NOT NULL DEFAULT '',
    era INTEGER NOT NULL DEFAULT 1,
    owner VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"owner": "Admin", "readers": [], "writers": [], "inheritors": []}',
    signature VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conches
CREATE INDEX IF NOT EXISTS idx_conches_owner ON conches(owner);
CREATE INDEX IF NOT EXISTS idx_conches_created_at ON conches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conches_state ON conches USING GIN(state);
CREATE INDEX IF NOT EXISTS idx_conches_permissions ON conches USING GIN(permissions);

-- Conch links table (for graph connections)
CREATE TABLE IF NOT EXISTS conch_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES conches(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES conches(id) ON DELETE CASCADE,
    link_type VARCHAR(100) NOT NULL DEFAULT 'related',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, target_id, link_type)
);

-- Create indexes for conch links
CREATE INDEX IF NOT EXISTS idx_conch_links_source ON conch_links(source_id);
CREATE INDEX IF NOT EXISTS idx_conch_links_target ON conch_links(target_id);

-- Conch events table (for audit trail)
CREATE TABLE IF NOT EXISTS conch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conch_id UUID NOT NULL REFERENCES conches(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    old_state JSONB,
    new_state JSONB,
    actor VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for events
CREATE INDEX IF NOT EXISTS idx_conch_events_conch_id ON conch_events(conch_id);
CREATE INDEX IF NOT EXISTS idx_conch_events_created_at ON conch_events(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_conches_updated_at BEFORE UPDATE ON conches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample conch for testing
INSERT INTO conches (id, state, story, lineage, intent, era, owner, permissions, signature)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '{"type": "genesis", "symbolism": "spiral"}'::jsonb,
    'The first Conch - the genesis of all memory. In the beginning, there was the spiral, and the spiral was the Conch.',
    ARRAY[]::uuid[],
    'To be the foundation of all future Conches',
    1,
    'system',
    '{"owner": "Admin", "readers": [{"subject": "*", "level": "Read", "expires_at": null}], "writers": [], "inheritors": []}'::jsonb,
    'genesis_signature'
) ON CONFLICT (id) DO NOTHING;
