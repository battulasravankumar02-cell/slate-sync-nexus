CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref TEXT NOT NULL UNIQUE,
  customer TEXT NOT NULL,
  city TEXT NOT NULL,
  sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  total NUMERIC NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'queued',
  courier TEXT,
  agent_id TEXT,
  sla_deadline TIMESTAMPTZ,
  pod_signature TEXT,
  return_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operations floor can read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Operations floor can create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Operations floor can update orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.po_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_ref TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  gstin TEXT,
  sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  gst NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.po_bills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.po_bills TO authenticated;
GRANT ALL ON public.po_bills TO service_role;
ALTER TABLE public.po_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operations floor can read po bills" ON public.po_bills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Operations floor can create po bills" ON public.po_bills FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Operations floor can update po bills" ON public.po_bills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.wms_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER orders_touch_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.wms_touch_updated_at();
CREATE TRIGGER po_bills_touch_updated_at BEFORE UPDATE ON public.po_bills FOR EACH ROW EXECUTE FUNCTION public.wms_touch_updated_at();

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.po_bills REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.po_bills;