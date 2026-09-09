-- =====================================================================
-- Anwar Fresh — full backend schema
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'Employee','Factory Operator','Head Office Coordinator','Finance','System Admin'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'batch_status') then
    create type public.batch_status as enum ('Draft','Active','Paused','SoldOut','Closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'Confirmed','Packed','OutForDelivery','Delivered','Cancelled','NotCollected'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('Paid','Unpaid','Partial');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('Cash','bKash','Payroll deduction');
  end if;

  if not exists (select 1 from pg_type where typname = 'department') then
    create type public.department as enum
      ('Production','Finance','HR','Sales','IT','Admin','Procurement');
  end if;

  if not exists (select 1 from pg_type where typname = 'site') then
    create type public.site as enum ('Head Office – Gulshan','Savar Factory');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_kind') then
    create type public.notification_kind as enum (
      'BatchPublished','CutoffReminder','OrderConfirmed',
      'OrderCancelled','OutForDelivery','PaymentDue'
    );
  end if;
end
$$;

create table if not exists public.employees (
  id             text primary key,
  user_id        uuid unique references auth.users(id) on delete set null,
  name           text not null,
  company_email  text not null unique,
  phone          text not null default '',
  department     public.department not null,
  site           public.site not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.delivery_points (
  id               text primary key,
  name             text not null,
  address          text not null default '',
  coordinator_name text not null default '',
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.batches (
  batch_no         text primary key,
  production_date  timestamptz not null,
  product          text not null default 'Fresh Whole Milk',
  produced_litres  integer not null check (produced_litres >= 0),
  saleable_litres  integer not null check (saleable_litres >= 0),
  rate_per_litre   numeric(10,2) not null check (rate_per_litre > 0),
  min_order        integer not null default 1 check (min_order >= 1),
  max_order        integer not null default 10,
  employee_cap     integer not null default 10,
  booking_cutoff   timestamptz not null,
  delivery_date    timestamptz not null,
  delivery_window  text not null default '4:00 PM – 6:30 PM',
  delivery_points  text[] not null default '{}',
  note             text not null default '',
  status           public.batch_status not null default 'Draft',
  published_at     timestamptz,
  closed_at        timestamptz,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  constraint saleable_within_produced check (saleable_litres <= produced_litres),
  constraint max_at_least_min         check (max_order >= min_order),
  constraint cap_at_least_min         check (employee_cap >= min_order)
);

create unique index if not exists batches_one_open_batch
  on public.batches ((true)) where status in ('Active','Paused');

create table if not exists public.orders (
  order_no          text primary key,
  batch_no          text not null references public.batches(batch_no) on delete cascade,
  employee_id       text not null references public.employees(id) on delete restrict,
  litres            integer not null check (litres > 0),
  rate              numeric(10,2) not null check (rate > 0),
  amount            numeric(12,2) generated always as (litres * rate) stored,
  delivery_point_id text not null references public.delivery_points(id) on delete restrict,
  status            public.order_status not null default 'Confirmed',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists orders_one_active_per_employee
  on public.orders (batch_no, employee_id) where status <> 'Cancelled';

create index if not exists orders_batch_idx  on public.orders (batch_no);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_point_idx  on public.orders (delivery_point_id);

create table if not exists public.delivery_records (
  coupon_no      text primary key,
  order_no       text not null unique references public.orders(order_no) on delete cascade,
  recipient_name text not null,
  contact        text not null default '',
  date_time      timestamptz not null default now(),
  location       text not null default '',
  floor          text not null default '',
  quantity       integer not null check (quantity > 0),
  receiver_name  text not null default '',
  remarks        text not null default '',
  created_at     timestamptz not null default now()
);

create table if not exists public.collections (
  order_no         text primary key references public.orders(order_no) on delete cascade,
  amount_due       numeric(12,2) not null check (amount_due >= 0),
  amount_collected numeric(12,2) not null default 0 check (amount_collected >= 0),
  method           public.payment_method,
  reference        text not null default '',
  status           public.payment_status not null default 'Unpaid',
  collector_name   text not null default '',
  date             timestamptz,
  updated_at       timestamptz not null default now(),
  constraint collected_within_due check (amount_collected <= amount_due)
);

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name    text not null default 'System',
  actor_role    text not null default '',
  action        text not null,
  record        text not null,
  old_value     text not null default '—',
  new_value     text not null default '—',
  "timestamp"   timestamptz not null default now()
);

create index if not exists audit_log_time_idx on public.audit_log ("timestamp" desc);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  kind        public.notification_kind not null,
  audience    text not null default 'All',
  employee_id text references public.employees(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  "timestamp" timestamptz not null default now()
);

create index if not exists notifications_time_idx on public.notifications ("timestamp" desc);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create table if not exists public.app_settings (
  id                      boolean primary key default true check (id),
  default_rate            numeric(10,2) not null default 92,
  default_cutoff          time          not null default '13:00',
  default_employee_cap    integer       not null default 10,
  default_min_order       integer       not null default 1,
  default_max_order       integer       not null default 10,
  default_delivery_window text          not null default '4:00 PM – 6:30 PM',
  email_on_publish        boolean       not null default true,
  sms_before_cutoff       boolean       not null default false,
  auto_close_at_cutoff    boolean       not null default true,
  terms                   text          not null default
    'Milk is sold to employees at cost. Orders are binding after the daily cutoff and settled through payroll unless paid at collection.',
  updated_at              timestamptz   not null default now()
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.my_roles()
returns setof public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role <> 'Employee'
  );
$$;

create or replace function public.my_employee_id()
returns text
language sql stable security definer set search_path = public
as $$
  select id from public.employees where user_id = auth.uid();
$$;

create or replace function public.actor_label()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select e.name from public.employees e where e.user_id = auth.uid()),
    (select u.email from auth.users u where u.id = auth.uid()),
    'System'
  );
$$;

create or replace function public.actor_role_label()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select string_agg(role::text, ', ' order by role)
       from public.user_roles where user_id = auth.uid()),
    ''
  );
$$;

create sequence if not exists public.employee_seq  start 1023;
create sequence if not exists public.batch_seq     start 2410;
create sequence if not exists public.order_seq     start 8900;
create sequence if not exists public.coupon_seq    start 5000;

create or replace function public.next_employee_code() returns text
language sql volatile set search_path = public as $$ select 'EMP-'  || nextval('public.employee_seq'); $$;

create or replace function public.next_batch_no() returns text
language sql volatile set search_path = public as $$ select 'BATCH-'|| nextval('public.batch_seq'); $$;

create or replace function public.next_order_no() returns text
language sql volatile set search_path = public as $$ select 'ORD-'  || nextval('public.order_seq'); $$;

create or replace function public.next_coupon_no() returns text
language sql volatile set search_path = public as $$ select 'DC-'   || nextval('public.coupon_seq'); $$;

create or replace function public.write_audit(
  _action text, _record text, _old text, _new text
) returns void
language sql volatile security definer set search_path = public
as $$
  insert into public.audit_log (actor_user_id, actor_name, actor_role, action, record, old_value, new_value)
  values (auth.uid(), public.actor_label(), public.actor_role_label(), _action, _record, coalesce(_old,'—'), coalesce(_new,'—'));
$$;

create or replace function public.tg_audit_batches() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    perform public.write_audit('Created batch', new.batch_no, '—', new.status::text);
  elsif TG_OP = 'UPDATE' and old.status is distinct from new.status then
    perform public.write_audit('Changed batch status', new.batch_no, old.status::text, new.status::text);
  elsif TG_OP = 'UPDATE' then
    perform public.write_audit('Edited batch', new.batch_no,
      old.produced_litres || ' L / ৳' || old.rate_per_litre,
      new.produced_litres || ' L / ৳' || new.rate_per_litre);
  end if;
  return null;
end $$;

drop trigger if exists audit_batches on public.batches;
create trigger audit_batches after insert or update on public.batches
  for each row execute function public.tg_audit_batches();

create or replace function public.tg_audit_orders() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    perform public.write_audit('Confirmed order', new.order_no, '—', new.litres || ' L');
  elsif old.status is distinct from new.status or old.litres is distinct from new.litres then
    perform public.write_audit('Updated order', new.order_no,
      old.litres || ' L / ' || old.status::text,
      new.litres || ' L / ' || new.status::text);
  end if;
  return null;
end $$;

drop trigger if exists audit_orders on public.orders;
create trigger audit_orders after insert or update on public.orders
  for each row execute function public.tg_audit_orders();

create or replace function public.tg_audit_collections() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit('Recorded payment', new.order_no,
    coalesce('৳' || (case when TG_OP='UPDATE' then old.amount_collected else 0 end), '—'),
    '৳' || new.amount_collected || ' (' || new.status::text || ')');
  return null;
end $$;

drop trigger if exists audit_collections on public.collections;
create trigger audit_collections after insert or update on public.collections
  for each row execute function public.tg_audit_collections();

create or replace function public.tg_audit_employees() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    perform public.write_audit('Added employee', new.id, '—', new.name);
  elsif old.active is distinct from new.active then
    perform public.write_audit(
      case when new.active then 'Activated employee' else 'Deactivated employee' end,
      new.id, case when old.active then 'Active' else 'Inactive' end,
             case when new.active then 'Active' else 'Inactive' end);
  else
    perform public.write_audit('Edited employee', new.id, old.name, new.name);
  end if;
  return null;
end $$;

drop trigger if exists audit_employees on public.employees;
create trigger audit_employees after insert or update on public.employees
  for each row execute function public.tg_audit_employees();

create or replace function public.tg_audit_points() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit(
    case when TG_OP = 'INSERT' then 'Added delivery point' else 'Edited delivery point' end,
    new.id, case when TG_OP='UPDATE' then old.name else '—' end, new.name);
  return null;
end $$;

drop trigger if exists audit_points on public.delivery_points;
create trigger audit_points after insert or update on public.delivery_points
  for each row execute function public.tg_audit_points();

create or replace function public.tg_audit_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit('Updated settings', 'app_settings',
    '৳' || old.default_rate || ' / cap ' || old.default_employee_cap,
    '৳' || new.default_rate || ' / cap ' || new.default_employee_cap);
  return null;
end $$;

drop trigger if exists audit_settings on public.app_settings;
create trigger audit_settings after update on public.app_settings
  for each row execute function public.tg_audit_settings();

create or replace function public.tg_collection_status() returns trigger
language plpgsql set search_path = public as $$
begin
  new.status := case
    when new.amount_collected <= 0                 then 'Unpaid'
    when new.amount_collected >= new.amount_due    then 'Paid'
    else 'Partial'
  end;
  if new.amount_collected <= 0 then
    new.method := null;
    new.date   := null;
  elsif new.date is null then
    new.date := now();
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists collection_status on public.collections;
create trigger collection_status before insert or update on public.collections
  for each row execute function public.tg_collection_status();

create or replace function public.tg_orders_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.tg_orders_touch();

create or replace function public.tg_auto_sold_out() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_remaining integer; v_min integer; v_status public.batch_status;
begin
  select b.status, b.min_order,
         b.saleable_litres - coalesce((
           select sum(o.litres) from public.orders o
           where o.batch_no = b.batch_no and o.status <> 'Cancelled'), 0)
    into v_status, v_min, v_remaining
  from public.batches b where b.batch_no = new.batch_no;

  if v_status = 'Active' and v_remaining < v_min then
    update public.batches set status = 'SoldOut' where batch_no = new.batch_no;
  elsif v_status = 'SoldOut' and v_remaining >= v_min then
    update public.batches set status = 'Active' where batch_no = new.batch_no;
  end if;
  return null;
end $$;

drop trigger if exists auto_sold_out on public.orders;
create trigger auto_sold_out after insert or update of litres, status on public.orders
  for each row execute function public.tg_auto_sold_out();

create or replace function public.tg_notify_batch_published() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'Active' and (TG_OP = 'INSERT' or old.status is distinct from 'Active') then
    insert into public.notifications (kind, audience, title, body)
    values ('BatchPublished','All','Fresh milk available today',
            'Batch ' || new.batch_no || ' is live at ৳' || new.rate_per_litre || '/L — book before the cut-off.');
  end if;
  return null;
end $$;

drop trigger if exists notify_batch_published on public.batches;
create trigger notify_batch_published after insert or update of status on public.batches
  for each row execute function public.tg_notify_batch_published();

create or replace function public.tg_notify_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.notifications (kind, audience, employee_id, title, body)
    values ('OrderConfirmed','Employee', new.employee_id,
            'Order ' || new.order_no || ' confirmed',
            new.litres || ' L reserved. You will collect it at your chosen point.');
  elsif new.status = 'OutForDelivery' and old.status is distinct from new.status then
    insert into public.notifications (kind, audience, employee_id, title, body)
    values ('OutForDelivery','Employee', new.employee_id,
            'Order ' || new.order_no || ' is on the way',
            'Your milk has left the store — please collect it from your delivery point.');
  elsif new.status = 'Cancelled' and old.status is distinct from new.status then
    insert into public.notifications (kind, audience, employee_id, title, body)
    values ('OrderCancelled','Employee', new.employee_id,
            'Order ' || new.order_no || ' cancelled',
            'The litres are back in the pool.');
  end if;
  return null;
end $$;

drop trigger if exists notify_order on public.orders;
create trigger notify_order after insert or update of status on public.orders
  for each row execute function public.tg_notify_order();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_emp text;
begin
  select id into v_emp from public.employees
   where lower(company_email) = lower(new.email);

  if v_emp is null then
    v_emp := public.next_employee_code();
    insert into public.employees (id, user_id, name, company_email, department, site)
    values (v_emp, new.id,
            coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
            new.email, 'Admin', 'Head Office – Gulshan');
  else
    update public.employees set user_id = new.id where id = v_emp;
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, 'Employee')
  on conflict (user_id, role) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.remaining_litres(_batch_no text)
returns integer
language sql stable security definer set search_path = public
as $$
  select greatest(0, b.saleable_litres - coalesce((
      select sum(o.litres) from public.orders o
      where o.batch_no = b.batch_no and o.status <> 'Cancelled'), 0))::int
  from public.batches b where b.batch_no = _batch_no;
$$;

create or replace function public.confirm_order(
  p_batch_no text,
  p_litres integer,
  p_delivery_point_id text
) returns public.orders
language plpgsql volatile security definer set search_path = public
as $$
declare
  b public.batches;
  v_emp text;
  v_remaining integer;
  v_order public.orders;
  v_no text;
begin
  v_emp := public.my_employee_id();
  if v_emp is null then
    raise exception 'No employee record is linked to your account.' using errcode = '28000';
  end if;

  if not exists (select 1 from public.employees where id = v_emp and active) then
    raise exception 'Your account is not currently eligible to book.' using errcode = '42501';
  end if;

  select * into b from public.batches where batch_no = p_batch_no for update;
  if not found then
    raise exception 'That batch does not exist.' using errcode = 'P0002';
  end if;

  if b.status <> 'Active' then
    raise exception 'Bookings are not open — the batch is %.', b.status using errcode = 'P0001';
  end if;

  if now() >= b.booking_cutoff then
    raise exception 'Bookings closed at the cut-off time for today.' using errcode = 'P0001';
  end if;

  if p_litres < b.min_order then
    raise exception 'Minimum order is % L.', b.min_order using errcode = 'P0001';
  end if;

  if p_litres > least(b.max_order, b.employee_cap) then
    raise exception 'You can book at most % L today.', least(b.max_order, b.employee_cap) using errcode = 'P0001';
  end if;

  if not (p_delivery_point_id = any (b.delivery_points)) then
    raise exception 'That collection point is not available for this batch.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.orders
    where batch_no = p_batch_no and employee_id = v_emp and status <> 'Cancelled'
  ) then
    raise exception 'You already have an order on this batch. Cancel it first.' using errcode = '23505';
  end if;

  v_remaining := public.remaining_litres(p_batch_no);
  if v_remaining < p_litres then
    raise exception 'Only % L are left — lower your quantity and try again.', v_remaining using errcode = 'P0001';
  end if;

  v_no := public.next_order_no();

  insert into public.orders (order_no, batch_no, employee_id, litres, rate, delivery_point_id, status)
  values (v_no, p_batch_no, v_emp, p_litres, b.rate_per_litre, p_delivery_point_id, 'Confirmed')
  returning * into v_order;

  insert into public.collections (order_no, amount_due, amount_collected)
  values (v_no, v_order.amount, 0);

  return v_order;
end $$;

create or replace function public.cancel_order(p_order_no text, p_reason text)
returns public.orders
language plpgsql volatile security definer set search_path = public
as $$
declare o public.orders; b public.batches; v_emp text; v_staff boolean;
begin
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required to cancel an order.' using errcode = 'P0001';
  end if;

  select * into o from public.orders where order_no = p_order_no for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;

  select * into b from public.batches where batch_no = o.batch_no;
  v_emp   := public.my_employee_id();
  v_staff := public.is_staff();

  if not v_staff then
    if o.employee_id is distinct from v_emp then
      raise exception 'You can only cancel your own order.' using errcode = '42501';
    end if;
    if now() >= b.booking_cutoff then
      raise exception 'The cut-off has passed — contact the Head Office Coordinator.' using errcode = 'P0001';
    end if;
  end if;

  if o.status in ('Delivered','Cancelled') then
    raise exception 'A % order cannot be cancelled.', o.status using errcode = 'P0001';
  end if;

  update public.orders set status = 'Cancelled' where order_no = p_order_no returning * into o;
  delete from public.collections where order_no = p_order_no;
  perform public.write_audit('Cancelled order — ' || p_reason, p_order_no, 'Confirmed', 'Cancelled');
  return o;
end $$;

create or replace function public.adjust_order(
  p_order_no text, p_litres integer, p_reason text
) returns public.orders
language plpgsql volatile security definer set search_path = public
as $$
declare o public.orders; b public.batches; v_remaining integer; v_old integer;
begin
  if not public.is_staff() then
    raise exception 'Only staff can adjust an order.' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reason is required to adjust an order.' using errcode = 'P0001';
  end if;

  select * into o from public.orders where order_no = p_order_no for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;

  select * into b from public.batches where batch_no = o.batch_no for update;

  v_old := o.litres;
  v_remaining := public.remaining_litres(o.batch_no) + o.litres;
  if p_litres > v_remaining then
    raise exception 'Only % L are available for this order.', v_remaining using errcode = 'P0001';
  end if;
  if p_litres < b.min_order then
    raise exception 'Minimum order is % L.', b.min_order using errcode = 'P0001';
  end if;

  update public.orders set litres = p_litres where order_no = p_order_no returning * into o;
  update public.collections set amount_due = o.amount where order_no = p_order_no;
  perform public.write_audit('Adjusted order — ' || p_reason, p_order_no,
                             v_old || ' L', p_litres || ' L');
  return o;
end $$;

create or replace function public.set_order_status(
  p_order_no text,
  p_status public.order_status,
  p_receiver_name text default null,
  p_remarks text default null
) returns public.orders
language plpgsql volatile security definer set search_path = public
as $$
declare o public.orders; e public.employees; dp public.delivery_points;
begin
  if not public.is_staff() then
    raise exception 'Only staff can update fulfillment status.' using errcode = '42501';
  end if;

  select * into o from public.orders where order_no = p_order_no for update;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;

  if o.status = 'Cancelled' then
    raise exception 'A cancelled order cannot be progressed.' using errcode = 'P0001';
  end if;

  if p_status = 'Delivered' and coalesce(trim(p_receiver_name), '') = '' then
    raise exception 'Record who received the milk before marking it delivered.' using errcode = 'P0001';
  end if;

  update public.orders set status = p_status where order_no = p_order_no returning * into o;

  if p_status = 'Delivered' then
    select * into e  from public.employees      where id = o.employee_id;
    select * into dp from public.delivery_points where id = o.delivery_point_id;

    insert into public.delivery_records
      (coupon_no, order_no, recipient_name, contact, date_time, location, quantity, receiver_name, remarks)
    values
      (public.next_coupon_no(), o.order_no, e.name, e.phone, now(),
       dp.name, o.litres, trim(p_receiver_name), coalesce(p_remarks, ''))
    on conflict (order_no) do update
      set receiver_name = excluded.receiver_name,
          remarks       = excluded.remarks,
          date_time     = excluded.date_time;
  end if;

  return o;
end $$;

create or replace function public.create_batch(
  p_produced integer,
  p_saleable integer,
  p_rate numeric,
  p_min_order integer,
  p_max_order integer,
  p_employee_cap integer,
  p_production_date timestamptz,
  p_booking_cutoff timestamptz,
  p_delivery_date timestamptz,
  p_delivery_window text,
  p_delivery_points text[],
  p_note text
) returns public.batches
language plpgsql volatile security definer set search_path = public
as $$
declare b public.batches;
begin
  if not (public.has_role(auth.uid(),'Factory Operator') or public.has_role(auth.uid(),'System Admin')) then
    raise exception 'Only the Factory Operator can create a batch.' using errcode = '42501';
  end if;
  if p_booking_cutoff <= p_production_date then
    raise exception 'The cut-off must be after the production time.' using errcode = 'P0001';
  end if;
  if p_delivery_date < p_booking_cutoff then
    raise exception 'Delivery cannot be scheduled before the cut-off.' using errcode = 'P0001';
  end if;
  if array_length(p_delivery_points, 1) is null then
    raise exception 'Choose at least one collection point.' using errcode = 'P0001';
  end if;

  insert into public.batches (
    batch_no, production_date, produced_litres, saleable_litres, rate_per_litre,
    min_order, max_order, employee_cap, booking_cutoff, delivery_date,
    delivery_window, delivery_points, note, status, created_by)
  values (
    public.next_batch_no(), p_production_date, p_produced, p_saleable, p_rate,
    p_min_order, p_max_order, p_employee_cap, p_booking_cutoff, p_delivery_date,
    p_delivery_window, p_delivery_points, coalesce(p_note,''), 'Draft', auth.uid())
  returning * into b;

  return b;
end $$;

create or replace function public.set_batch_status(
  p_batch_no text, p_status public.batch_status
) returns public.batches
language plpgsql volatile security definer set search_path = public
as $$
declare b public.batches;
begin
  if not (public.has_role(auth.uid(),'Factory Operator') or public.has_role(auth.uid(),'System Admin')) then
    raise exception 'Only the Factory Operator can change batch status.' using errcode = '42501';
  end if;

  select * into b from public.batches where batch_no = p_batch_no for update;
  if not found then raise exception 'Batch not found.' using errcode = 'P0002'; end if;

  if b.status = 'Closed' then
    raise exception 'A closed batch is final and cannot be reopened.' using errcode = 'P0001';
  end if;
  if b.status = 'Draft' and p_status not in ('Active','Closed') then
    raise exception 'A draft batch can only be published or discarded.' using errcode = 'P0001';
  end if;

  update public.batches
     set status       = p_status,
         published_at = case when p_status = 'Active' and b.published_at is null then now() else b.published_at end,
         closed_at    = case when p_status = 'Closed' then now() else b.closed_at end
   where batch_no = p_batch_no
  returning * into b;

  return b;
end $$;

create or replace function public.record_collection(
  p_order_no text,
  p_amount_collected numeric,
  p_method public.payment_method,
  p_reference text
) returns public.collections
language plpgsql volatile security definer set search_path = public
as $$
declare c public.collections; o public.orders;
begin
  if not (public.has_role(auth.uid(),'Finance') or public.has_role(auth.uid(),'System Admin')) then
    raise exception 'Only Finance can record a collection.' using errcode = '42501';
  end if;

  select * into o from public.orders where order_no = p_order_no;
  if not found then raise exception 'Order not found.' using errcode = 'P0002'; end if;
  if o.status = 'Cancelled' then
    raise exception 'A cancelled order has nothing to collect.' using errcode = 'P0001';
  end if;
  if p_amount_collected > o.amount then
    raise exception 'Collected amount cannot exceed the ৳% due.', o.amount using errcode = 'P0001';
  end if;
  if p_amount_collected > 0 and p_method is null then
    raise exception 'Record how the payment was made.' using errcode = 'P0001';
  end if;

  insert into public.collections (order_no, amount_due, amount_collected, method, reference, collector_name)
  values (p_order_no, o.amount, p_amount_collected, p_method, coalesce(p_reference,''), public.actor_label())
  on conflict (order_no) do update
    set amount_due       = excluded.amount_due,
        amount_collected = excluded.amount_collected,
        method           = excluded.method,
        reference        = excluded.reference,
        collector_name   = excluded.collector_name
  returning * into c;

  return c;
end $$;

create or replace function public.close_expired_batches() returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare n integer := 0;
begin
  if not (select auto_close_at_cutoff from public.app_settings where id) then
    return 0;
  end if;
  with done as (
    update public.batches set status = 'Closed', closed_at = now()
     where status in ('Active','Paused','SoldOut') and now() >= booking_cutoff
    returning 1)
  select count(*) into n from done;
  return n;
end $$;

create or replace function public.mark_notifications_read() returns void
language sql volatile security definer set search_path = public
as $$
  insert into public.notification_reads (notification_id, user_id)
  select n.id, auth.uid() from public.notifications n
  on conflict do nothing;
$$;

create or replace view public.batch_stats
with (security_invoker = true) as
select
  b.batch_no,
  b.production_date,
  b.status,
  b.produced_litres,
  b.saleable_litres,
  b.rate_per_litre,
  coalesce(sum(o.litres) filter (where o.status <> 'Cancelled'), 0)::int              as booked_litres,
  coalesce(sum(o.litres) filter (where o.status = 'Delivered'), 0)::int               as delivered_litres,
  coalesce(sum(o.litres) filter (where o.status = 'NotCollected'), 0)::int            as not_collected_litres,
  count(*) filter (where o.status = 'Cancelled')::int                                 as cancelled_orders,
  count(distinct o.employee_id) filter (where o.status <> 'Cancelled')::int           as ordering_employees,
  greatest(0, b.saleable_litres - coalesce(sum(o.litres) filter (where o.status <> 'Cancelled'), 0))::int
                                                                                      as remaining_litres,
  greatest(0, b.saleable_litres - coalesce(sum(o.litres) filter (where o.status <> 'Cancelled'), 0))::int
                                                                                      as unsold_litres,
  coalesce(sum(o.amount) filter (where o.status <> 'Cancelled'), 0)                   as gross_value,
  case when b.saleable_litres > 0
       then round(100.0 * coalesce(sum(o.litres) filter (where o.status = 'Delivered'), 0) / b.saleable_litres)
       else 0 end::int                                                                as sell_through_pct
from public.batches b
left join public.orders o on o.batch_no = b.batch_no
group by b.batch_no;

create or replace view public.collection_summary
with (security_invoker = true) as
select
  o.batch_no,
  coalesce(sum(c.amount_due), 0)                        as total_due,
  coalesce(sum(c.amount_collected), 0)                  as total_collected,
  coalesce(sum(c.amount_due - c.amount_collected), 0)   as outstanding
from public.collections c
join public.orders o on o.order_no = c.order_no
group by o.batch_no;

alter table public.employees          enable row level security;
alter table public.user_roles         enable row level security;
alter table public.delivery_points    enable row level security;
alter table public.batches            enable row level security;
alter table public.orders             enable row level security;
alter table public.delivery_records   enable row level security;
alter table public.collections        enable row level security;
alter table public.audit_log          enable row level security;
alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;
alter table public.app_settings       enable row level security;

drop policy if exists employees_self_read on public.employees;
create policy employees_self_read on public.employees for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists employees_admin_write on public.employees;
create policy employees_admin_write on public.employees for all to authenticated
  using (public.has_role(auth.uid(),'System Admin'))
  with check (public.has_role(auth.uid(),'System Admin'));

drop policy if exists roles_read on public.user_roles;
create policy roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'System Admin'));

drop policy if exists roles_admin_write on public.user_roles;
create policy roles_admin_write on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'System Admin'))
  with check (public.has_role(auth.uid(),'System Admin'));

drop policy if exists points_read on public.delivery_points;
create policy points_read on public.delivery_points for select to authenticated using (true);

drop policy if exists points_admin_write on public.delivery_points;
create policy points_admin_write on public.delivery_points for all to authenticated
  using (public.has_role(auth.uid(),'System Admin'))
  with check (public.has_role(auth.uid(),'System Admin'));

drop policy if exists batches_read on public.batches;
create policy batches_read on public.batches for select to authenticated
  using (public.is_staff() or status <> 'Draft');

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated
  using (public.is_staff() or employee_id = public.my_employee_id());

drop policy if exists coupons_read on public.delivery_records;
create policy coupons_read on public.delivery_records for select to authenticated
  using (public.is_staff()
      or exists (select 1 from public.orders o
                 where o.order_no = delivery_records.order_no
                   and o.employee_id = public.my_employee_id()));

drop policy if exists collections_read on public.collections;
create policy collections_read on public.collections for select to authenticated
  using (public.has_role(auth.uid(),'Finance')
      or public.has_role(auth.uid(),'System Admin')
      or public.has_role(auth.uid(),'Head Office Coordinator')
      or exists (select 1 from public.orders o
                 where o.order_no = collections.order_no
                   and o.employee_id = public.my_employee_id()));

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated
  using (public.is_staff());

drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select to authenticated
  using (audience = 'All'
      or employee_id = public.my_employee_id()
      or exists (select 1 from public.user_roles ur
                 where ur.user_id = auth.uid() and ur.role::text = notifications.audience));

drop policy if exists notif_reads_own on public.notification_reads;
create policy notif_reads_own on public.notification_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to authenticated using (true);

drop policy if exists settings_admin_write on public.app_settings;
create policy settings_admin_write on public.app_settings for update to authenticated
  using (public.has_role(auth.uid(),'System Admin'))
  with check (public.has_role(auth.uid(),'System Admin'));

alter table public.orders        replica identity full;
alter table public.batches       replica identity full;
alter table public.collections   replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.orders';        exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.batches';       exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.collections';   exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.notifications'; exception when others then null; end;
end
$$;

grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.employees, public.delivery_points, public.notification_reads, public.user_roles to authenticated;
grant update on public.app_settings to authenticated;
grant execute on all functions in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
