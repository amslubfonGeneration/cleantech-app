export const validators = {
  register: ({ email, password, name }) => {
    if (!email || !password || !name) return { ok: false, error: 'Champs requis manquants' };
    if (!/.+@.+\..+/.test(email)) return { ok: false, error: 'Email invalide' };
    if (password.length < 6) return { ok: false, error: 'Mot de passe trop court' };
    return { ok: true };
  }
};
