export default function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: "Supabase credentials not configured" });
  }
  res.json({ supabaseUrl: url, supabaseAnonKey: key });
}
