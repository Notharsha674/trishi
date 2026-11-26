// Public Supabase config. Publishable key is intentionally safe to share with RLS.
// IMPORTANT: Never put secret API keys, Resend API keys, invite codes or emails here.
window.TRISHI_RESPONSE_CONFIG = Object.freeze({
  supabaseUrl: "https://wxykjurpzrxikugqyrgp.supabase.co",
  publishableKey: "sb_publishable__QUoMRKbIez0RYbPxsPrNw_lSgX13E1",
  functionName: "submit-birthday",
  submissionsEnabled: false // Set true ONLY after setting the private invite code and owner permissions
});
