-- =========================================================
-- Admin write RPCs
-- =========================================================
create or replace function public.upsert_employee(
  p_id text,
  p_name text,
  p_email text,
  p_phone text,
  p_department department,
  p_site site,
  p_active boolean default true
) returns public.employees
language plpgsql
security definer
set search_path = public
as $$
declare v_id text; v_row public.employees;
begin
  if not public.has_role(auth.uid(), 'System Admin') then
    raise exception 'Only a System Admin can manage employees';
  end if;
  v_id := coalesce(nullif(trim(p_id), ''), public.next_employee_code());
  insert into public.employees (id, name, company_email, phone, department, site, active)
  values (v_id, p_name, lower(trim(p_email)), coalesce(p_phone, ''), p_department, p_site, coalesce(p_active, true))
  on conflict (id) do update
    set name = excluded.name,
        company_email = excluded.company_email,
        phone = excluded.phone,
        department = excluded.department,
        site = excluded.site,
        active = excluded.active
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.set_employee_active(p_id text, p_active boolean)
returns public.employees
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.employees;
begin
  if not public.has_role(auth.uid(), 'System Admin') then
    raise exception 'Only a System Admin can manage employees';
  end if;
  update public.employees set active = p_active where id = p_id returning * into v_row;
  if v_row is null then raise exception 'Employee % not found', p_id; end if;
  return v_row;
end;
$$;

create or replace function public.upsert_delivery_point(
  p_id text,
  p_name text,
  p_address text,
  p_coordinator_name text,
  p_active boolean default true
) returns public.delivery_points
language plpgsql
security definer
set search_path = public
as $$
declare v_id text; v_row public.delivery_points;
begin
  if not public.has_role(auth.uid(), 'System Admin') then
    raise exception 'Only a System Admin can manage delivery points';
  end if;
  v_id := coalesce(
    nullif(trim(p_id), ''),
    'dp-' || regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g')
  );
  insert into public.delivery_points (id, name, address, coordinator_name, active)
  values (v_id, p_name, coalesce(p_address, ''), coalesce(p_coordinator_name, ''), coalesce(p_active, true))
  on conflict (id) do update
    set name = excluded.name,
        address = excluded.address,
        coordinator_name = excluded.coordinator_name,
        active = excluded.active
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.save_settings(
  p_default_rate numeric,
  p_default_cutoff time,
  p_default_employee_cap integer,
  p_default_min_order integer,
  p_default_max_order integer,
  p_default_delivery_window text,
  p_email_on_publish boolean,
  p_sms_before_cutoff boolean,
  p_auto_close_at_cutoff boolean,
  p_terms text
) returns public.app_settings
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.app_settings;
begin
  if not public.has_role(auth.uid(), 'System Admin') then
    raise exception 'Only a System Admin can change settings';
  end if;
  insert into public.app_settings (id) values (true) on conflict (id) do nothing;
  update public.app_settings set
    default_rate = p_default_rate,
    default_cutoff = p_default_cutoff,
    default_employee_cap = p_default_employee_cap,
    default_min_order = p_default_min_order,
    default_max_order = p_default_max_order,
    default_delivery_window = p_default_delivery_window,
    email_on_publish = p_email_on_publish,
    sms_before_cutoff = p_sms_before_cutoff,
    auto_close_at_cutoff = p_auto_close_at_cutoff,
    terms = p_terms,
    updated_at = now()
  where id = true
  returning * into v_row;
  return v_row;
end;
$$;

-- Setup-only helper: run from the SQL editor to grant a role.
create or replace function public.grant_role(p_email text, p_role app_role)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then raise exception 'No account found for %', p_email; end if;
  insert into public.user_roles (user_id, role) values (v_uid, p_role)
  on conflict (user_id, role) do nothing;
  return format('%s now has the %s role', p_email, p_role);
end;
$$;

revoke all on function public.grant_role(text, app_role) from public, anon, authenticated;
grant execute on function public.upsert_employee(text, text, text, text, department, site, boolean) to authenticated;
grant execute on function public.set_employee_active(text, boolean) to authenticated;
grant execute on function public.upsert_delivery_point(text, text, text, text, boolean) to authenticated;
grant execute on function public.save_settings(numeric, time, integer, integer, integer, text, boolean, boolean, boolean, text) to authenticated;

-- =========================================================
-- Seed data
-- =========================================================
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

insert into public.delivery_points (id, name, address, coordinator_name, active) values
  ('dp-gulshan', 'Head Office – Gulshan', 'Ground floor lobby, Anwar Tower, Gulshan Avenue', 'Nusrat Jahan', true),
  ('dp-savar', 'Factory Gate – Savar', 'Gate 2 security desk, Savar dairy unit', 'Kamal Hossain', true),
  ('dp-ctg', 'Regional Office – Chattogram', 'Reception, Agrabad C/A', 'Imran Kabir', true),
  ('dp-ashulia', 'Depot – Ashulia', 'Cold store counter, Ashulia depot', 'Sultana Razia', true)
on conflict (id) do nothing;

insert into public.employees (id, name, company_email, phone, department, site, active) values
  ('EMP-1001', 'Rahim Uddin', 'rahim.uddin@anwaragro.com', '+8801710000001', 'Production', 'Savar Factory', true),
  ('EMP-1002', 'Nusrat Jahan', 'nusrat.jahan@anwaragro.com', '+8801710000002', 'Admin', 'Head Office – Gulshan', true),
  ('EMP-1003', 'Kamal Hossain', 'kamal.hossain@anwaragro.com', '+8801710000003', 'Production', 'Savar Factory', true),
  ('EMP-1004', 'Fatima Akter', 'fatima.akter@anwaragro.com', '+8801710000004', 'Finance', 'Head Office – Gulshan', true),
  ('EMP-1005', 'Shakil Ahmed', 'shakil.ahmed@anwaragro.com', '+8801710000005', 'IT', 'Head Office – Gulshan', true),
  ('EMP-1006', 'Ayesha Siddika', 'ayesha.siddika@anwaragro.com', '+8801710000006', 'HR', 'Head Office – Gulshan', true),
  ('EMP-1007', 'Tanvir Rahman', 'tanvir.rahman@anwaragro.com', '+8801710000007', 'Sales', 'Head Office – Gulshan', true),
  ('EMP-1008', 'Sultana Razia', 'sultana.razia@anwaragro.com', '+8801710000008', 'Procurement', 'Savar Factory', true),
  ('EMP-1009', 'Imran Kabir', 'imran.kabir@anwaragro.com', '+8801710000009', 'Sales', 'Head Office – Gulshan', true),
  ('EMP-1010', 'Mahmuda Khatun', 'mahmuda.khatun@anwaragro.com', '+8801710000010', 'Finance', 'Head Office – Gulshan', true),
  ('EMP-1011', 'Arif Chowdhury', 'arif.chowdhury@anwaragro.com', '+8801710000011', 'Production', 'Savar Factory', true),
  ('EMP-1012', 'Sharmin Sultana', 'sharmin.sultana@anwaragro.com', '+8801710000012', 'HR', 'Savar Factory', true),
  ('EMP-1013', 'Jahidul Islam', 'jahidul.islam@anwaragro.com', '+8801710000013', 'IT', 'Savar Factory', true),
  ('EMP-1014', 'Nazmul Haque', 'nazmul.haque@anwaragro.com', '+8801710000014', 'Procurement', 'Head Office – Gulshan', true),
  ('EMP-1015', 'Rubina Yasmin', 'rubina.yasmin@anwaragro.com', '+8801710000015', 'Admin', 'Head Office – Gulshan', true),
  ('EMP-1016', 'Sabbir Alam', 'sabbir.alam@anwaragro.com', '+8801710000016', 'Production', 'Savar Factory', false),
  ('EMP-1017', 'Farhana Islam', 'farhana.islam@anwaragro.com', '+8801710000017', 'Sales', 'Head Office – Gulshan', true),
  ('EMP-1018', 'Mizanur Rahman', 'mizanur.rahman@anwaragro.com', '+8801710000018', 'Production', 'Savar Factory', true),
  ('EMP-1019', 'Taslima Begum', 'taslima.begum@anwaragro.com', '+8801710000019', 'HR', 'Head Office – Gulshan', true),
  ('EMP-1020', 'Ashraful Haque', 'ashraful.haque@anwaragro.com', '+8801710000020', 'IT', 'Head Office – Gulshan', true),
  ('EMP-1021', 'Nadia Sharmin', 'nadia.sharmin@anwaragro.com', '+8801710000021', 'Finance', 'Head Office – Gulshan', false),
  ('EMP-1022', 'Rezaul Karim', 'rezaul.karim@anwaragro.com', '+8801710000022', 'Procurement', 'Savar Factory', true)
on conflict (id) do nothing;

-- Today's open batch
insert into public.batches (
  batch_no, production_date, product, produced_litres, saleable_litres, rate_per_litre,
  min_order, max_order, employee_cap, booking_cutoff, delivery_date, delivery_window,
  delivery_points, note, status, published_at
) values (
  'BATCH-2409',
  date_trunc('day', now()) + interval '6 hours',
  'Fresh Whole Milk', 640, 600, 92, 1, 10, 10,
  date_trunc('day', now()) + interval '23 hours 30 minutes',
  date_trunc('day', now()) + interval '16 hours',
  '4:00 PM – 6:30 PM',
  array['dp-gulshan','dp-savar'],
  'Chilled at 4°C. Please bring your own carry bag.',
  'Active',
  date_trunc('day', now()) + interval '7 hours'
) on conflict (batch_no) do nothing;

-- Nine days of closed history
insert into public.batches (
  batch_no, production_date, product, produced_litres, saleable_litres, rate_per_litre,
  min_order, max_order, employee_cap, booking_cutoff, delivery_date, delivery_window,
  delivery_points, note, status, published_at, closed_at
)
select
  'BATCH-' || (2408 - d)::text,
  date_trunc('day', now()) - (d + 1) * interval '1 day' + interval '6 hours',
  'Fresh Whole Milk',
  (array[620,660,585,700,640,610,675,595,655])[d + 1],
  (array[580,610,555,660,600,575,640,560,620])[d + 1],
  (array[90,90,88,92,92,90,92,88,92])[d + 1],
  1, 10, 10,
  date_trunc('day', now()) - (d + 1) * interval '1 day' + interval '13 hours',
  date_trunc('day', now()) - (d + 1) * interval '1 day' + interval '16 hours',
  '4:00 PM – 6:30 PM',
  array['dp-gulshan','dp-savar'],
  'Chilled at 4°C.',
  'Closed',
  date_trunc('day', now()) - (d + 1) * interval '1 day' + interval '7 hours',
  date_trunc('day', now()) - (d + 1) * interval '1 day' + interval '19 hours'
from generate_series(0, 8) as d
on conflict (batch_no) do nothing;

-- Today's orders
insert into public.orders (order_no, batch_no, employee_id, litres, rate, delivery_point_id, status, created_at, updated_at)
select
  'ORD-' || (8801 + s.n)::text,
  'BATCH-2409',
  s.emp,
  s.litres,
  92,
  s.dp,
  s.status::order_status,
  date_trunc('day', now()) + s.hour * interval '1 hour' + ((s.n * 7) % 60) * interval '1 minute',
  date_trunc('day', now()) + s.hour * interval '1 hour' + ((s.n * 7) % 60) * interval '1 minute'
from (values
  (0,'EMP-1001',4,'dp-savar','Confirmed',9),
  (1,'EMP-1004',2,'dp-gulshan','Confirmed',9),
  (2,'EMP-1007',6,'dp-gulshan','Packed',10),
  (3,'EMP-1002',3,'dp-gulshan','Confirmed',10),
  (4,'EMP-1003',5,'dp-savar','Packed',10),
  (5,'EMP-1005',2,'dp-gulshan','Confirmed',11),
  (6,'EMP-1008',8,'dp-savar','OutForDelivery',11),
  (7,'EMP-1010',3,'dp-gulshan','Confirmed',11),
  (8,'EMP-1011',4,'dp-savar','Confirmed',12),
  (9,'EMP-1013',1,'dp-savar','Confirmed',12),
  (10,'EMP-1014',5,'dp-gulshan','Packed',12),
  (11,'EMP-1015',2,'dp-gulshan','Confirmed',13),
  (12,'EMP-1017',7,'dp-gulshan','Confirmed',13),
  (13,'EMP-1018',3,'dp-savar','Confirmed',14),
  (14,'EMP-1019',2,'dp-gulshan','Cancelled',14),
  (15,'EMP-1020',6,'dp-gulshan','Confirmed',15),
  (16,'EMP-1022',4,'dp-savar','Confirmed',15)
) as s(n, emp, litres, dp, status, hour)
on conflict (order_no) do nothing;

-- Past orders across the three most recent closed batches
with spec as (
  select bi, i
  from generate_series(0, 2) as bi, generate_series(0, 11) as i
  where i < 10 + bi
), rows as (
  select
    s.bi,
    s.i,
    'BATCH-' || (2408 - s.bi)::text as batch_no,
    (array[90,90,88])[s.bi + 1] as rate,
    'EMP-' || (1001 + ((s.i * 3 + s.bi) % 22))::text as emp,
    ((s.i * 2 + s.bi) % 8) + 1 as litres,
    case when s.i % 2 = 0 then 'dp-gulshan' else 'dp-savar' end as dp,
    case when s.i % 9 = 4 then 'NotCollected' else 'Delivered' end as status,
    date_trunc('day', now()) - (s.bi + 1) * interval '1 day'
      + (9 + s.i % 4) * interval '1 hour' + ((s.i * 11) % 60) * interval '1 minute' as at
  from spec s
)
insert into public.orders (order_no, batch_no, employee_id, litres, rate, delivery_point_id, status, created_at, updated_at)
select
  'ORD-' || (8700 + row_number() over (order by bi, i))::text,
  batch_no, emp, litres, rate, dp, status::order_status, at, at
from rows
on conflict (order_no) do nothing;

-- Delivery coupons for delivered past orders
insert into public.delivery_records (coupon_no, order_no, recipient_name, contact, date_time, location, floor, quantity, receiver_name, remarks)
select
  'DC-' || (2400 + row_number() over (order by o.order_no))::text,
  o.order_no,
  e.name,
  e.phone,
  o.created_at + interval '9 hours',
  dp.name,
  case when dp.id = 'dp-gulshan' then 'Floor ' || (3 + (o.litres % 6))::text else 'Factory store' end,
  o.litres,
  e.name,
  'Collected on time'
from public.orders o
join public.employees e on e.id = o.employee_id
join public.delivery_points dp on dp.id = o.delivery_point_id
where o.status = 'Delivered'
on conflict (coupon_no) do nothing;

-- Payment records for delivered past orders
insert into public.collections (order_no, amount_due, amount_collected, method, reference, collector_name, date)
select
  o.order_no,
  o.amount,
  case when r % 5 = 0 then 0 when r % 7 = 0 then round(o.amount / 2) else o.amount end,
  case
    when r % 5 = 0 then null
    else (array['Cash','bKash','Payroll deduction'])[(r % 3) + 1]::payment_method
  end,
  'REF-' || (4100 + r)::text,
  case when r % 2 = 0 then 'Fatima Akter' else 'Mahmuda Khatun' end,
  o.created_at + interval '9 hours'
from (
  select o.*, (row_number() over (order by o.order_no))::int as r
  from public.orders o where o.status = 'Delivered'
) o
on conflict (order_no) do nothing;

insert into public.notifications (kind, audience, title, body, timestamp) values
  ('BatchPublished', 'All', 'Fresh milk available today', 'Batch BATCH-2409 is live at ৳92/L — book before the cut-off.', date_trunc('day', now()) + interval '7 hours'),
  ('CutoffReminder', 'All', 'Bookings close soon', 'A few hours left to book today''s milk.', date_trunc('day', now()) + interval '11 hours'),
  ('PaymentDue', 'Finance', 'Outstanding collections', 'Some delivered orders are still unpaid.', date_trunc('day', now()) - interval '1 day' + interval '20 hours');
