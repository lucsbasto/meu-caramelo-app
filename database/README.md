# Local Docker DB and Supabase-Ready Migrations

This project runs locally on Docker/Postgres now, while keeping migrations in `supabase/migrations` for later Supabase adoption.

## 1. Start database

```bash
npm run db:up
```

## 2. Apply migrations

```bash
npm run db:migrate
```

## 3. Reset local database

```bash
npm run db:reset
```

## 4. Move to Supabase later

Keep using SQL files in `supabase/migrations`; they are written to be portable to Supabase migration flow.
