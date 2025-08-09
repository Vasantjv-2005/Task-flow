# 📌 Full Stack App with Supabase Integration

## 🚀 Overview  
The app supports **real-time data**, **secure authentication**, and **role-based access control** using Supabase's Row Level Security (RLS) policies.

---

## 🛠 Tech Stack
- **Frontend**: V0.dev (React + TailwindCSS)
- **Backend / Database**: Supabase (PostgreSQL, Authentication, Storage)
- **Real-Time Updates**: Supabase Realtime
- **Auth**: Email & Password authentication (Supabase Auth)

---

## ✨ Features
- ✅ **User Authentication** (Sign up, Sign in, Sign out)
- ✅ **Profiles Table** linked to Supabase Auth
- ✅ **Tasks / Boards CRUD**
- ✅ **Row Level Security** for private user data
- ✅ **Real-Time Sync** between users
- ✅ **File Storage** for profile pictures or uploads

---

## 📂 Database Schema (Supabase)
### `profiles` table
| Column       | Type      | Notes                                  |
|--------------|-----------|----------------------------------------|
| id           | uuid      | Primary key, references `auth.users.id`|
| username     | text      | Unique username                        |
| avatar_url   | text      | URL to profile picture                  |
| created_at   | timestamptz | Default: `now()`                      |

### `tasks` table
| Column       | Type      | Notes                                  |
|--------------|-----------|----------------------------------------|
| id           | uuid      | Primary key                            |
| title        | text      | Task title                             |
| description  | text      | Task details                           |
| user_id      | uuid      | Foreign key → `profiles.id`            |
| created_at   | timestamptz | Default: `now()`                      |

---

## 🔐 Supabase Security (RLS Policies)
Row Level Security is **enabled** for sensitive tables with policies:
- **profiles**: A user can only read and update their own profile.
- **tasks**: A user can only read, update, and delete their own tasks.

---

## 📦 Installation & Setup

### 1️⃣ Clone the repository
```bash
https://github.com/Vasantjv-2005/Task-flow.git

