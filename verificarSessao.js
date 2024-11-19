const { getAuth } = require('firebase-admin/auth');

const verificarSessao = async (req, res, next) => {
  try {
    const idToken = req.cookies.session;

    if (!idToken) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = verificarSessao;
