-- Nothing is callable without signing in.
revoke execute on all functions in schema public from anon, public;

-- Internal-only helpers: system/trigger use only, never callable by app users.
revoke execute on function
  public.write_audit(text, text, text, text),
  public.next_employee_code(),
  public.next_batch_no(),
  public.next_order_no(),
  public.next_coupon_no(),
  public.actor_label(),
  public.actor_role_label(),
  public.handle_new_user(),
  public.close_expired_batches(),
  public.tg_audit_batches(),
  public.tg_audit_orders(),
  public.tg_audit_collections(),
  public.tg_audit_employees(),
  public.tg_audit_points(),
  public.tg_audit_settings(),
  public.tg_collection_status(),
  public.tg_orders_touch(),
  public.tg_auto_sold_out(),
  public.tg_notify_batch_published(),
  public.tg_notify_order()
from anon, authenticated, public;

-- Intended, role-checked API surface for signed-in users.
grant execute on function
  public.has_role(uuid, public.app_role),
  public.my_roles(),
  public.is_staff(),
  public.my_employee_id(),
  public.remaining_litres(text),
  public.confirm_order(text, integer, text),
  public.cancel_order(text, text),
  public.adjust_order(text, integer, text),
  public.set_order_status(text, public.order_status, text, text),
  public.create_batch(integer, integer, numeric, integer, integer, integer, timestamptz, timestamptz, timestamptz, text, text[], text),
  public.set_batch_status(text, public.batch_status),
  public.record_collection(text, numeric, public.payment_method, text),
  public.mark_notifications_read()
to authenticated;

-- Keep future functions private by default.
alter default privileges in schema public revoke execute on functions from anon, public;
