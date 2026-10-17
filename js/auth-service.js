window.AuthService = (() => {
  async function signIn(email, password) { return window.DataService.signIn(email, password); }
  async function register(displayName, email, password) { return window.DataService.register(displayName, email, password); }
  async function signOut() { return window.DataService.signOut(); }
  async function getCurrentProfile() { return window.DataService.getCurrentProfile(); }
  return { signIn, register, signOut, getCurrentProfile };
})();
