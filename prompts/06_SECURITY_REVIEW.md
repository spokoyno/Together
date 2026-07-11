# Prompt: security review

Review this repository as a privacy-sensitive application for couples.

Do not edit files first.

Check:
- Supabase RLS coverage;
- authorization versus authentication;
- cross-couple data leakage;
- invitation token handling;
- Storage bucket policies;
- environment variable exposure;
- server/client component boundaries;
- unsafe logs;
- input validation;
- account unlinking and deletion;
- export authorization;
- abuse risks around mood, location and relationship data.

Rank findings:
- Critical
- High
- Medium
- Low

For each finding provide:
- affected file or SQL policy;
- realistic impact;
- minimal fix;
- test proving the fix.

Do not claim security is guaranteed after automated review.
