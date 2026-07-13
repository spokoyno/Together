-- Avatar uploads under avatars/{user_id}/ in couple-media bucket.

create policy "couple_media_avatar_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] = 'avatars'
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or (storage.foldername(name))[2]::uuid in (
      select cm2.user_id
      from public.couple_members cm1
      join public.couple_members cm2 on cm1.couple_id = cm2.couple_id
      where cm1.user_id = auth.uid()
    )
  )
);

create policy "couple_media_avatar_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "couple_media_avatar_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "couple_media_avatar_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'couple-media'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);
