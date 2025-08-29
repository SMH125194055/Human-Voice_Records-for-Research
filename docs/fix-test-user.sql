-- Insert test user into auth.users table
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'test@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Test User"}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user profile
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    created_at,
    updated_at
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'test@example.com',
    'Test User',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

