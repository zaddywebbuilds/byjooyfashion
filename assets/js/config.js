/* ============================================================
   ByJooy - backend configuration

   Fill these two values in once, from your Supabase project:
     Supabase dashboard -> Project Settings -> API
       URL      -> SUPABASE_URL
       anon key -> SUPABASE_ANON_KEY

   The anon key is meant to be public. It can only do what the
   database policies allow, which is: read published products, and
   nothing else unless you are signed in. See SETUP.md.

   Until these are filled in, the site runs on the bundled catalogue
   in products.js and the admin dashboard will say it is not connected.
   ============================================================ */
window.BYJOOY_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // WhatsApp number in international format, no plus sign
  WHATSAPP: '2349038800195'
};

window.BYJOOY_CONFIG.isConnected = function () {
  var c = window.BYJOOY_CONFIG;
  return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
};
