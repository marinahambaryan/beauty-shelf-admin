# Beauty Shelf admin

The console for running Beauty Shelf: review products people send in, edit the catalogue, and look after accounts. It's a Next.js app next to the mobile app and uses the same Supabase project.

| Page | What it does |
|---|---|
| Review | Products people sent in. Add one to the catalogue, link it to something already there, or reject it with a reason. |
| Products | Search, add and edit catalogue products, images, shades and sizes. Archive what shouldn't appear in search. |
| Brands | Add, rename, and delete brands with no products. |
| People | Find accounts, see totals, suspend, restore, delete, give or remove admin access. |
| Activity | A record of every change made here. |

## How access works

- The console holds **no service-role key**, only the public URL and key the app ships with. People sign in with their normal Beauty Shelf email and password.
- Admins are rows in `public.admins`. Every read and write is an `admin_*` database function that checks this table itself, so the interface isn't what protects the data.
- Suspending and deleting accounts need the service role, so they run in the `admin-users` Edge Function, which checks the caller first.
- **Libraries stay private.** Products added manually reach an admin only when their owner sends them with `submit_personal_product`. Admins see totals for a person, never what's in their library, and not their display name. A submitted photo is readable while it waits for review, and it never goes into the catalogue.

The migration, Edge Function and database tests live in the app repo (`supabase/`), so there is one migration history. See D22 in its `docs/DECISIONS.md`.

## Run it locally

With OrbStack running:

```bash
npm run dev:local
```

This starts the local Supabase stack if needed, applies new migrations, serves the `admin-users` function, adds a local admin and two products to review, and opens the console on http://localhost:3100. Sign in as `admin@beautyshelf.local` with `ShelfAdmin2026`. It keeps your local data and doesn't touch the hosted project.

`npm run check` runs types, lint and a production build. Run `npm run test:db` in `beauty-shelf` for the database tests.

## Hosted project

In `beauty-shelf`:

```bash
npx supabase db push
npx supabase functions deploy admin-users
```

Then add the first admin in the SQL editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the hosted values, from `eas.json`. Deploy the console somewhere private to you. Search engines are told not to index it, and anyone who reaches it still needs an admin account.
