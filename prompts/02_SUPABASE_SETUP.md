# Prompt: configure Supabase safely

Read:
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`

Do not request or reveal my database password, service role key or access token.

Guide me through:
1. Creating a Supabase project.
2. Finding the Project URL and publishable key.
3. Creating `.env.local`.
4. Applying the migration in SQL Editor.
5. Applying seed data.
6. Configuring email/password authentication.
7. Setting localhost and Vercel redirect URLs.
8. Verifying all public tables have RLS enabled.
9. Testing with two linked users and one unrelated user.
10. Confirming the unrelated user cannot read plans, moods, memories, answers or events.

Before changing any SQL:
- Identify the problem.
- Explain how the policy works.
- Provide a reversible migration.
- Avoid broad policies such as `using (true)` for authenticated users.
