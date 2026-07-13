-- Allow both partners to rate movies and mark dishes as cooked.

drop policy if exists "movie_entries_members_all" on public.movie_entries;
drop policy if exists "cooking_dishes_members_all" on public.cooking_dishes;

create policy "movie_entries_members_select"
on public.movie_entries for select to authenticated
using (public.is_couple_member(couple_id));

create policy "movie_entries_members_insert"
on public.movie_entries for insert to authenticated
with check (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "movie_entries_members_update"
on public.movie_entries for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "movie_entries_members_delete"
on public.movie_entries for delete to authenticated
using (public.is_couple_member(couple_id) and added_by = auth.uid());

create policy "cooking_dishes_members_select"
on public.cooking_dishes for select to authenticated
using (public.is_couple_member(couple_id));

create policy "cooking_dishes_members_insert"
on public.cooking_dishes for insert to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

create policy "cooking_dishes_members_update"
on public.cooking_dishes for update to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

create policy "cooking_dishes_members_delete"
on public.cooking_dishes for delete to authenticated
using (public.is_couple_member(couple_id) and created_by = auth.uid());
