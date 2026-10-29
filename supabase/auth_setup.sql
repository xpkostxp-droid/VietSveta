-- Applied remotely with migration member_pin_auth_and_admin. No credentials in this file.
alter table public.participants add column is_admin boolean not null default false;
insert into public.participants(id,display_name,is_admin) values ('konstantin','Константин',true);
create schema app_private;
revoke all on schema app_private from public,anon,authenticated;
grant usage on schema app_private to service_role;
create table app_private.credentials (
 participant_id text primary key references public.participants(id),
 email text not null, auth_password text not null, pin_hash text not null,
 failures integer not null default 0, locked_until timestamptz
);
alter table app_private.credentials enable row level security;
revoke all on app_private.credentials from public,anon,authenticated;
grant all on app_private.credentials to service_role;
create function public.set_member_credentials(p_id text,p_user uuid,p_email text,p_password text,p_pin text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 if p_pin !~ '^[0-9]{4}$' then raise exception 'invalid pin'; end if;
 insert into app_private.credentials(participant_id,email,auth_password,pin_hash)
 values(p_id,p_email,p_password,extensions.crypt(p_pin,extensions.gen_salt('bf',10)))
 on conflict(participant_id) do update set email=excluded.email,auth_password=excluded.auth_password,pin_hash=excluded.pin_hash,failures=0,locked_until=null;
 update public.participants set user_id=p_user where id=p_id;
 if not found then raise exception 'participant missing'; end if;
end $$;
revoke all on function public.set_member_credentials(text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.set_member_credentials(text,uuid,text,text,text) to service_role;
create function public.verify_member_pin(p_id text,p_pin text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c app_private.credentials%rowtype;
begin
 select * into c from app_private.credentials where participant_id=p_id for update;
 if not found or not exists(select 1 from public.participants where id=p_id and active) then return jsonb_build_object('error','invalid'); end if;
 if c.locked_until > now() then return jsonb_build_object('error','locked'); end if;
 if c.locked_until is not null then c.failures:=0; end if;
 if p_pin !~ '^[0-9]{4}$' or extensions.crypt(p_pin,c.pin_hash) <> c.pin_hash then
  update app_private.credentials set failures=c.failures+1,locked_until=case when c.failures+1>=5 then now()+interval '15 minutes' else null end where participant_id=p_id;
  return jsonb_build_object('error',case when c.failures+1>=5 then 'locked' else 'invalid' end);
 end if;
 update app_private.credentials set failures=0,locked_until=null where participant_id=p_id;
 return jsonb_build_object('email',c.email,'password',c.auth_password);
end $$;
revoke all on function public.verify_member_pin(text,text) from public,anon,authenticated;
grant execute on function public.verify_member_pin(text,text) to service_role;
create function public.reset_member_pin(p_id text,p_pin text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
 if p_pin !~ '^[0-9]{4}$' then raise exception 'invalid pin'; end if;
 update app_private.credentials set pin_hash=extensions.crypt(p_pin,extensions.gen_salt('bf',10)),failures=0,locked_until=null where participant_id=p_id;
 if not found then raise exception 'participant missing'; end if;
end $$;
revoke all on function public.reset_member_pin(text,text) from public,anon,authenticated;
grant execute on function public.reset_member_pin(text,text) to service_role;
-- Merge individual storage keys under a row lock, preserving concurrent unrelated changes.
create function public.sync_learning_state(p_entries jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); current_data jsonb; item record; stamp bigint;
begin
 if uid is null or not exists(select 1 from public.participants where user_id=uid and active) then raise exception 'unauthorized' using errcode='42501'; end if;
 if jsonb_typeof(p_entries)<>'object' or octet_length(p_entries::text)>900000 then raise exception 'invalid state'; end if;
 insert into public.learning_state(user_id) values(uid) on conflict(user_id) do nothing;
 select data into current_data from public.learning_state where user_id=uid for update;
 for item in select * from jsonb_each(p_entries) loop
  if item.key !~ '^(vietCards\.|vietSveta\.|vietsveta\.)' or length(item.key)>180 or jsonb_typeof(item.value)<>'object' or jsonb_typeof(item.value->'modified')<>'number' or not(item.value ? 'value') then raise exception 'invalid entry'; end if;
  stamp := (item.value->>'modified')::bigint;
  if stamp<0 or stamp>extract(epoch from now())*1000+300000 then raise exception 'invalid timestamp'; end if;
  if not(current_data ? item.key) or stamp > coalesce((current_data->item.key->>'modified')::bigint,0) then current_data:=jsonb_set(current_data,array[item.key],item.value); end if;
 end loop;
 update public.learning_state set data=current_data,revision=revision+1,updated_at=now() where user_id=uid;
 return current_data;
end $$;
revoke all on function public.sync_learning_state(jsonb) from public,anon;
grant execute on function public.sync_learning_state(jsonb) to authenticated;
-- Scores are private by RLS. Only the Edge Function can produce a cross-user leaderboard;
-- its server-side participant filter excludes is_admin=true regardless of request data.
-- Applied separately as document_credentials_service_policy.
create policy credentials_service_only on app_private.credentials for all to service_role using (true) with check (true);
