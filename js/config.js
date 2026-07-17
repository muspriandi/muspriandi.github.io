/* ============================================================
 * ✏️  EDIT ME — section configuration
 *
 * Each section gets its own Sqids alphabet and minimum ID
 * length. This single config drives BOTH the interactive UI
 * and the automation query API (?type=&action=&value=).
 *
 * Rules for each alphabet:
 *   - at least 3 characters, all unique
 *   - encode & decode only match when the alphabet is the same
 *
 * The `type` used in the automation URL is the section name
 * lowercased with spaces removed, e.g.
 *   "Catalog Category" -> type=catalogcategory
 *   "Item"             -> type=item
 *   "Variant"          -> type=variant
 * ============================================================ */
var SECTIONS = [
  {
    name: 'Catalog Category',
    color: '#4f46e5', // indigo
    alphabet: 'pV2D7ZbzRPSulJdgNctvFq1KGhfH54wsUETn6oQr8Bi3mMACa09exYOkLyXjWI',
    minLength: 16,
  },
  {
    name: 'Item',
    color: '#0d9488', // teal
    alphabet: 'qQAh6OedzXGJHiTn3WE0vK7yNCtl8c5UmfsLoxgjYPDIuMS1kwF492aVRpZrbB',
    minLength: 16,
  },
  {
    name: 'Variant',
    color: '#d97706', // amber
    alphabet: '70lMmTAPvUjuGLrORNeHS84ca9hsgynDkxJVpCwfKEZib1qXdz3t52Q6FoYIWB',
    minLength: 16,
  },
];
