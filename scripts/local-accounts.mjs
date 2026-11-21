#!/usr/bin/env node
// Used by dev-local.sh, on the local stack only. Creates or reuses a local admin account and
// a demo person who has sent two products for review. Prints the admin's user id.
const [url, anon] = process.argv.slice(2);
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url ?? '') || !anon) {
  console.error('Usage: local-accounts.mjs <local API URL> <anon key>');
  process.exit(1);
}

async function request(path, { token = anon, body } = {}) {
  const res = await fetch(`${url}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, data };
}

/** Signs in, or signs up first. Local email confirmation is off (supabase/config.toml). */
async function account(email, password) {
  const signIn = await request('/auth/v1/token?grant_type=password', { body: { email, password } });
  if (signIn.ok) return signIn.data;
  const signUp = await request('/auth/v1/signup', { body: { email, password } });
  if (!signUp.ok || !signUp.data.access_token) {
    throw new Error(`Couldn't create ${email}: ${JSON.stringify(signUp.data)}`);
  }
  return signUp.data;
}

async function rpc(token, fn, body) {
  const { ok, data } = await request(`/rest/v1/rpc/${fn}`, { token, body });
  if (!ok) throw new Error(`${fn}: ${JSON.stringify(data)}`);
  return data;
}

const admin = await account('admin@beautyshelf.local', 'ShelfAdmin2026');
const sender = await account('sender@beautyshelf.local', 'ShelfSender2026');
const token = sender.access_token;

const existing = await request('/rest/v1/catalog_submissions?select=id&limit=1', { token });
if (!existing.ok) throw new Error(`The admin migration isn't applied: ${JSON.stringify(existing.data)}`);

if (existing.data.length === 0) {
  const products = [
    { p_brand_name: 'Merit', p_name: 'The Minimalist Foundation Stick', p_category: 'makeup', p_variant_label: 'Clay', note: 'Sold at my local shop' },
    { p_brand_name: 'Charlotte Tilbury', p_name: 'Matte Revolution Lipstick', p_category: 'makeup', p_variant_label: 'Red Carpet Red', note: null },
  ];
  for (const { note, ...product } of products) {
    const itemId = await rpc(token, 'create_personal_product', { ...product, p_status: 'owned' });
    const { data } = await request(`/rest/v1/library_items?select=personal_product_id&id=eq.${itemId}`, { token });
    await rpc(token, 'submit_personal_product', {
      p_personal_product_id: data[0].personal_product_id,
      p_note: note,
    });
  }
}

console.log(admin.user.id);
