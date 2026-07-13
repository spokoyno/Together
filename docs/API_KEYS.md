# API-ключи для внешних каталогов

## Уже подключено

### TMDB (фильмы, сериалы, мультсериалы)

1. Зарегистрируйтесь на [themoviedb.org](https://www.themoviedb.org/signup)
2. В настройках аккаунта → **API** → создайте API Key (v3)
3. Добавьте в `.env.local`:

```env
TMDB_API_KEY=ваш_ключ_v3
```

Используется в: `/memories/movies`, `/memories/series`, `/memories/cartoons`

---

## Нужно подключить для игр

### RAWG

1. Зарегистрируйтесь на [rawg.io/apidocs](https://rawg.io/apidocs)
2. В личном кабинете скопируйте **API Key**
3. Добавьте в `.env.local`:

```env
RAWG_API_KEY=ваш_ключ_rawg
```

4. Перезапустите dev-сервер (`npm run dev`)

Без ключа панель «Игры» покажет подсказку, поиск не заработает.

---

## Без ключа

### AniList (аниме)

Панель `/memories/anime` использует публичный GraphQL API [AniList](https://anilist.co/graphiql). Ключ не нужен.

---

## Проверка

После добавления ключей откройте панель и введите запрос в поиск. Если ключ неверный — в интерфейсе появится ошибка, в логах сервера — 502 от route handler.

Для production добавьте те же переменные в Vercel → Project → Settings → Environment Variables.
