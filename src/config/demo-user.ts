/**
 * Sample signed-in user for the CP-Meiji Smart Agent Management UI.
 *
 * Clerk is not wired up in this environment (no publishable key), so
 * `useUser()` resolves to `undefined` and the sidebar profile renders empty.
 * This is the single place to edit the sample identity — swap it for the real
 * session object once an auth provider is connected.
 *
 * The shape intentionally matches what `UserAvatarProfile` expects
 * (`imageUrl`, `fullName`, `emailAddresses`) so that component stays unchanged.
 */
export const DEMO_USER = {
  /** Set to '' to fall back to initials derived from `fullName`. */
  imageUrl: '/profile.jpg',
  fullName: 'วราภรณ์ ด้วงมี',
  emailAddresses: [{ emailAddress: 'waraporn.d@cpmeiji.co.th' }],
  role: 'เอเยนต์',
  cvCode: '9999999999'
};
