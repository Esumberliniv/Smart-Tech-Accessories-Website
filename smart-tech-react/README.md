# Smart Tech Accessories Website

An e-commerce web application for smart technology accessories, built with React, Vite, and Supabase.

## Tech Stack

- **Frontend:** React 19, React Router v7, Vite
- **Backend/Database:** Supabase (PostgreSQL, Auth)
- **Deployment:** Google Cloud Run via Cloud Build

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Esumberliniv/Smart-Tech-Accessories-Website.git
   cd Smart-Tech-Accessories-Website/smart-tech-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file from the example:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your Supabase credentials in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://yourproject.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## Deployment

The app is deployed to Google Cloud Run using Cloud Build with continuous deployment on pushes to `main`.

### Environment Variables (Cloud Build)

Set the following substitution variables in your Cloud Build trigger:

| Variable | Description |
|---|---|
| `_VITE_SUPABASE_URL` | Your Supabase project URL |
| `_VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Manual Build

```bash
npm run build
```

Output is generated in the `dist/` folder.
