# Prompt: configure Git and GitHub

Inspect `.gitignore` before doing anything.

Guide me through creating a PRIVATE GitHub repository and connecting this local project.

Requirements:
- Confirm `.env.local`, `.vercel` and secret files are ignored.
- Check staged files for accidental credentials before every first push.
- Use `main` as the protected release branch.
- Create a first commit with a clear message.
- Recommend feature branches in the form `feature/<name>`.
- Explain how to recover from a bad local AI change using Git without deleting unrelated work.
- Never suggest force-pushing unless you explain the risk and I explicitly request it.
