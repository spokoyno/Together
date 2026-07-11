# Environment variables

## Public browser variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_` означает, что значение может попасть в браузер. Поэтому там нельзя хранить секреты.

## Never commit

- `.env.local`;
- service role key;
- database password;
- Supabase access token;
- Vercel token;
- GitHub personal access token.

## Where to get values

Supabase Dashboard → Project Settings / API:
- Project URL;
- publishable key.

Vercel Dashboard → Project → Settings → Environment Variables:
- добавить те же публичные значения для нужных окружений.

Не проси Cursor извлекать секреты из буфера обмена или снимков экрана.
