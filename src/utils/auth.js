export async function authenticate(req, reply,  roles = []) {
  
  const User = req.session.get('user');
  if (!req.session.get('user')) {
    return reply.redirect('/?error=Accès non autorisé');
  }

  if (!User || (roles.length && !roles.includes(User.role))) {
      return reply.redirect('/?error=Accès interdit');
  }
}
