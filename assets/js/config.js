/* ============================================================
   ByJooy - configuration

   The Studio dashboard saves straight into this GitHub repository.
   There is no server and no database. When she saves a piece, the
   dashboard writes the photos and the catalogue file as one commit,
   and GitHub Pages republishes the site a minute or two later.

   Point these at whichever repo the site is published from.
   ============================================================ */
window.BYJOOY_CONFIG = {
  // GitHub repository the site is served from
  REPO_OWNER: 'zaddywebbuilds',
  REPO_NAME:  'byjooyfashion',
  REPO_BRANCH: 'main',

  // Where the dashboard reads and writes the catalogue
  DATA_PATH: 'data/products.json',
  ORDERS_PATH: 'data/orders.json',
  IMAGE_DIR: 'assets/img',
  VIDEO_DIR: 'assets/video/pieces',

  // WhatsApp number, international format, no plus sign
  WHATSAPP: '2349038800195'
};
