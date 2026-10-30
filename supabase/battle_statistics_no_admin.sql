-- Exclude administrative test matches from public battle standings without deleting history.
create or replace function battle_private.statistics()
returns jsonb language plpgsql security definer set search_path='' as $$
declare mid text; records jsonb;
begin
 select id into mid from public.participants where user_id=auth.uid() and active;
 if mid is null then raise exception 'Войди в активный профиль участника' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'played_at',finished_at,'host_id',host_member_id,'guest_id',guest_member_id,'host_name',host_display,'guest_name',guest_display,'score_host',h,'score_guest',g,'topic',topic) order by finished_at desc,id),'[]'::jsonb) into records
 from (select m.*, (select count(*) from jsonb_array_elements(results) r where r->>'winner' in ('host','both')) h,
 (select count(*) from jsonb_array_elements(results) r where r->>'winner' in ('guest','both')) g
 from battle_private.matches m where status='finished' and host_member_id is not null and guest_member_id is not null and host_member_id<>guest_member_id
 and exists(select 1 from public.participants p where p.id=m.host_member_id and not p.is_admin)
 and exists(select 1 from public.participants p where p.id=m.guest_member_id and not p.is_admin)) scored where h<>g;
 return jsonb_build_object('viewer_id',mid,'matches',records);
end $$;
revoke all on function battle_private.statistics() from public,anon;
grant execute on function battle_private.statistics() to authenticated;
