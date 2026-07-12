-- Ensure authenticated role can use chat tables (some hosted projects miss default grants).

grant select, insert on table public.messages to authenticated;

grant select, insert, delete on table public.chat_saved_messages to authenticated;

grant select, insert, update, delete on table public.chat_notes to authenticated;

grant select, insert, update on table public.chat_read_state to authenticated;

grant select, insert, delete, update on table public.push_subscriptions to authenticated;
