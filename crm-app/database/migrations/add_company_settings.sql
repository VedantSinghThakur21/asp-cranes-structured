-- Create company_settings table for storing company information and letterhead
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'ASP Cranes Pvt. Ltd.',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    gst_number VARCHAR(50),
    letterhead_url TEXT,
    letterhead_position JSONB DEFAULT '{"x": 0, "y": 0, "width": "100%", "height": "auto", "opacity": 0.1, "zIndex": -1}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company settings
INSERT INTO company_settings (
    company_name, 
    address, 
    phone, 
    email, 
    website,
    gst_number,
    is_active
) VALUES (
    'ASP Cranes Pvt. Ltd.',
    'Industrial Area, Pune, Maharashtra 411019',
    '+91 99999 88888',
    'sales@aspcranes.com',
    'www.aspcranes.com',
    '07XXXXX1234X1XX',
    true
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_settings_updated_at();