revoke all on function public.upsert_employee(text, text, text, text, department, site, boolean) from public, anon;
revoke all on function public.set_employee_active(text, boolean) from public, anon;
revoke all on function public.upsert_delivery_point(text, text, text, text, boolean) from public, anon;
revoke all on function public.save_settings(numeric, time, integer, integer, integer, text, boolean, boolean, boolean, text) from public, anon;

grant execute on function public.upsert_employee(text, text, text, text, department, site, boolean) to authenticated;
grant execute on function public.set_employee_active(text, boolean) to authenticated;
grant execute on function public.upsert_delivery_point(text, text, text, text, boolean) to authenticated;
grant execute on function public.save_settings(numeric, time, integer, integer, integer, text, boolean, boolean, boolean, text) to authenticated;
