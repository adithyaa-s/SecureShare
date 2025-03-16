# SecureShare - End-to-End Encrypted File Sharing System

SecureShare is a secure file sharing system that ensures end-to-end encryption, robust user authentication, and secure file transfers. It utilizes modern cryptography and security protocols to protect sensitive data.

![SecureShare Screenshot](/placeholder.svg?height=400&width=800)

## Features

- **End-to-End Encryption**: Files are encrypted in the browser before upload and only decrypted by authorized recipients
- **Secure Authentication**: JWT-based authentication with password hashing
- **Dark/Light Mode**: Fully responsive UI with theme support
- **File Access Control**: Set permissions for shared files
- **Secure File Storage**: Files are stored in encrypted form
- **Modern UI**: Responsive design that works on all devices

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Encryption**: Fernet symmetric encryption

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

### Setting Up the Database (Supabase)

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)

2. Create a new project and note your project URL and API keys

3. Set up the database tables by running the SQL script in the Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_type TEXT,
  encrypted BOOLEAN DEFAULT TRUE,
  encryption_key TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create file_shares table
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX idx_file_shares_user_id ON file_shares(user_id);
```
