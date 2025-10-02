# Content Management System

A straightforward CMS built for managing blog articles with a tree-based navigation system. Built with Remix, Prisma, and Tailwind.

## What it does

This is a mini-CMS that lets you create and organize articles in a hierarchical structure. Think of it like a simple knowledge base or documentation system where you can group related articles together.

**Main features:**
- **Authentication** - Secure sign-in/sign-up with Supabase Auth
- Create, edit, and delete articles (authenticated users only)
- Organize articles by category with parent-child relationships
- Tree view sidebar for easy navigation
- Table view with search and filtering
- Auto-generates URL slugs from article titles
- Server-side rendering for better performance

## Tech choices

I went with Remix because it handles server/client data flow really well and the loader/action pattern makes sense for a CRUD app. Prisma makes database operations straightforward, and Supabase provides a free PostgreSQL instance that's easy to set up.

**Stack:**
- Remix + React for the framework
- Tailwind for styling (utility-first keeps things simple)
- Prisma as the ORM
- PostgreSQL via Supabase
- Can deploy to Vercel in a few clicks

## Getting started

### Requirements

You'll need Node.js 18 or higher and either npm or yarn. I'm using Supabase for the database, but you could use any PostgreSQL instance.

### Installation

Clone the repo and install dependencies:

\`\`\`bash
git clone <your-repo-url>
cd traibe-test
npm install
\`\`\`

### Supabase Setup

I'm using Supabase for both the database and authentication:

1. Head to [supabase.com](https://supabase.com) and create an account
2. Create a new project (pick any region)
3. **Get Database Connection:**
   - Go to Settings → Database
   - Copy the connection string (use "Direct Connection", not the pooler)
   - It should look like: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`
4. **Get Auth Keys:**
   - Go to Settings → API
   - Copy the "Project URL" and "anon public" key

If you prefer running PostgreSQL locally (you'll still need Supabase for auth):

\`\`\`bash
brew install postgresql@14
brew services start postgresql@14
createdb cms_db
\`\`\`

### Environment variables

Copy the example env file:

\`\`\`bash
cp .env.example .env
\`\`\`

Then edit `.env` and add your Supabase credentials:

\`\`\`env
DATABASE_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
\`\`\`

### Run migrations

This creates the User and Article tables in your database:

\`\`\`bash
npx prisma generate
npx prisma migrate dev
\`\`\`

Optional but recommended - seed with sample data:

\`\`\`bash
npm run db:seed
\`\`\`

This creates a default user and 7 sample articles across 3 categories so you can see how the tree structure works.

### Start the server

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:5173](http://localhost:5173). You'll need to sign up to create an account, then you can start creating articles.

## Project structure

Here's how things are organized:

\`\`\`
app/
├── routes/
│   ├── _index.tsx              # Main table view
│   ├── articles.$id.tsx        # Single article page
│   ├── articles.$id.delete.tsx # Delete handler
│   ├── articles.new.tsx        # New article form (auth required)
│   ├── editor.tsx              # Editor with tree nav (auth required)
│   ├── login.tsx               # Login page
│   ├── signup.tsx              # Sign up page
│   └── logout.tsx              # Logout handler
├── lib/
│   ├── db.server.ts            # Prisma client
│   ├── auth.server.ts          # Auth utilities
│   ├── supabase.server.ts      # Supabase server client
│   ├── supabase.client.ts      # Supabase browser client
│   └── utils.ts                # Helper functions
└── styles/
    └── tailwind.css            # Custom styles

prisma/
├── schema.prisma               # Database schema (User + Article)
└── seed.ts                     # Sample data
\`\`\`

## How to use it

### Getting Started

1. **Sign Up:** Visit `/signup` to create an account with your email and password
2. **Confirm Email:** Check your email inbox for a confirmation link from Supabase (check spam folder if needed)
3. **Sign In:** After confirming your email, sign in at `/login`
4. **Create Articles:** After signing in, you'll see the editor and new article options

### Creating articles

Click the "New Article" button (only visible when logged in). Fill in a title, pick a category, and write your content. The URL slug gets generated automatically from the title.

### Editing

You can edit from the table view by clicking "Edit", or use the `/editor` page which has a tree sidebar. The tree view is handy when you have lots of articles - you can expand categories and see the parent-child structure.

**Note:** Only authenticated users can create or edit articles. Reading articles is public.

### Tree navigation

Categories are the top level, articles without parents sit directly under them, and child articles are nested. Click the arrow to expand/collapse a category. When you click an article in the tree, it loads in the editor.

### Deleting

Hit delete from the table view. It'll ask for confirmation. If you delete a parent article, its children get deleted too (cascade delete).

## Deployment

I've set this up to deploy easily on Vercel:

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

Then:
1. Go to [vercel.com](https://vercel.com) and import your repo
2. Add your `DATABASE_URL` as an environment variable
3. Update the build command to: `npx prisma generate && npx prisma migrate deploy && npm run build`
4. Deploy

Vercel should auto-detect that it's a Remix app. Make sure your Supabase database is accessible from Vercel's servers.

You could also use Fly.io, Railway, or Render - they all work fine with Remix.

## Database schema

The schema has two main models - User and Article:

\`\`\`prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  articles  Article[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Article {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String   @db.Text
  category  String
  parentId  String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Article?  @relation("ArticleTree", fields: [parentId], references: [id], onDelete: Cascade)
  children  Article[] @relation("ArticleTree")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

**Key relationships:**
- Each article has an author (User) - cascade delete if user is removed
- Articles can have a parent article (self-referencing) - cascade delete for tree structure
- User authentication is handled by Supabase Auth, but user records are stored in our database

## Routes

Here's what each route does:

**Public routes:**
- `GET /` - Shows all articles in a table
- `GET /articles/:id` - Displays a single article
- `GET /login` - Login page
- `GET /signup` - Sign up page
- `POST /login` - Handles authentication
- `POST /signup` - Creates new user account
- `POST /logout` - Signs out the user

**Protected routes (require authentication):**
- `GET /articles/new` - Form to create new article
- `POST /articles/new` - Handles article creation
- `GET /editor?article=:id` - Editor page with tree nav
- `POST /editor` - Handles updates
- `POST /articles/:id/delete` - Deletes an article

## Customization

The styles are in `app/styles/tailwind.css`. I've set up some utility classes like `.btn-primary` that you can modify:

\`\`\`css
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg;
}
\`\`\`

To add database fields, edit `prisma/schema.prisma` and run:

\`\`\`bash
npx prisma migrate dev --name your_change_name
\`\`\`

## Common issues

**Can't connect to database**

Double-check your `DATABASE_URL` in `.env`. If you're using Supabase, make sure you grabbed the direct connection string, not the pooler URL. Also verify your Supabase project is active.

**Migration errors**

Try resetting (only in development):

\`\`\`bash
npx prisma migrate reset
\`\`\`

**Build fails**

Clear everything and reinstall:

\`\`\`bash
rm -rf node_modules .cache build
npm install
npm run dev
\`\`\`

## Authentication Details

The authentication system uses Supabase Auth with the following flow:

1. **Sign Up:** Creates a user in Supabase Auth and sends a confirmation email
2. **Email Confirmation:** Users must click the link in their email to verify their account (check spam folder if not received)
3. **Sign In:** After email confirmation, validates credentials via Supabase Auth and creates a session
4. **Session Management:** Sessions are stored in HTTP-only cookies for security
5. **Protected Routes:** Server-side checks using `requireAuth()` before loading/action execution
6. **Auto User Sync:** When authenticated users access the app, we automatically create/sync their User record in our database

**Security features:**
- Email verification required before login
- HTTP-only cookies (not accessible to JavaScript)
- Server-side authentication checks
- Protected routes redirect to login
- Session validation on every request
- Cascade delete ensures data integrity

**Important Notes:**
- By default, Supabase requires email confirmation before users can sign in
- Users will receive a confirmation email upon signup - they must click the link to activate their account
- If email confirmation is disabled in Supabase settings, users can sign in immediately after signup
- Confirmation emails are sent from Supabase - ensure your Supabase project's email settings are configured

## Notes

This CMS now includes full authentication! The requirements were to show CRUD operations, a table view, and a tree-based editor - all working together in a Remix app with user authentication.

Current features implemented:
✅ User authentication with Supabase Auth (email/password)
✅ Protected routes for creating/editing articles
✅ Public article viewing
✅ User-article relationships
✅ Session management

If you wanted to extend this further, you could add:
- OAuth providers (Google, GitHub, etc.)
- A proper rich text editor (TipTap or similar)
- Image uploads via Supabase Storage
- Role-based permissions (admin, editor, viewer)
- Tags/categories as separate entities
- Full-text search
- Pagination for large article lists

---

Built for the EdTech Full-Stack Engineer test project.
