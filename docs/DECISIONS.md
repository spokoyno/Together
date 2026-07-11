# Architecture decisions

## ADR-001 — PWA first

Первый запуск — mobile-first PWA, а не App Store/Google Play.

Причина: нулевой бюджет, единая кодовая база и тестирование по ссылке.

## ADR-002 — Supabase

Auth, PostgreSQL и Storage в одном сервисе с RLS.

## ADR-003 — No chat in Pre-MVP

Чат дорог по сложности и не нужен для проверки основного цикла.

## ADR-004 — Universal plans

Покупки, свидания и задачи сначала представлены одной сущностью `plans` с категориями.

## ADR-005 — Privacy over speed

Нельзя отключать RLS или использовать broad policies ради быстрого демо.
