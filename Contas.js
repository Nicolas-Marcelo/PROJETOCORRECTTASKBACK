const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { getAuth } = require('firebase-admin/auth');
const verificarSessao = require('./middleware/verificarSessao');

router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    const infoToken = await getAuth().verifyIdToken(idToken);
    const uid = infoToken.uid;
    const email = infoToken.email;

    const userRef = db.collection('usuarios').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        questionarioCompleto: false,
        email: email,
      });
      console.log('Novo usuário criado');
      res.cookie('session', idToken, { httpOnly: true });
      res.status(200).json({ uid, questionarioCompleto: false });
      axios.defaults.withCredentials = true;
    } else {
      res.cookie('session', idToken, { httpOnly: true });
      res.status(200).json({ uid, questionarioCompleto: userDoc.data().questionarioCompleto });
    }
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    res.status(500).json({ message: 'Erro ao autenticar usuário', error: error.message });
  }
});

router.get('/user', verificarSessao, async (req, res) => {
  try {
    const uid = req.user.uid;

    const userRef = db.collection('usuarios').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const userData = userDoc.data();
    res.status(200).json({
      uid: userDoc.id,
      email: userData.email,
      questionarioCompleto: userData.questionarioCompleto,
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ message: 'Erro ao obter dados do usuário', error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.status(200).json({ message: 'Logout efetuado com sucesso' });
});

router.post('/completar-questionario', async (req, res) => {
  try {
    const { uid } = req.body;
    const userRef = db.collection('usuarios').doc(uid);
    await userRef.update({ questionarioCompleto: true });
    res.status(200).json({ message: 'Questionário marcado como completo' });
  } catch (error) {
    console.error('Erro ao marcar questionário como completo:', error);
    res.status(500).json({ message: 'Erro ao atualizar questionário' });
  }
});

router.post('/enviar-questionario', verificarSessao, async (req, res) => {
  const {
    userId,
    email,
    displayName,
    nomeCompletoUsuario,
    CPFUsuario,
    dataNascimentoUsuario,
    tipoConta,
    listaExperiencias,
    listaConhecimentos,
  } = req.body;

  try {
    const usuarioRef = db.collection('usuarios').doc(userId);

    await usuarioRef.set({
      email,
      displayName,
      questionarioCompleto: true,
      nomeCompletoUsuario,
      CPFUsuario,
      dataNascimentoUsuario,
      tipoConta,
    });

    if (Array.isArray(listaExperiencias)) {
      await usuarioRef.update({
        experienciasUsuario: admin.firestore.FieldValue.arrayUnion(...listaExperiencias),
      });
    } else {
      console.log("listaExperiencias não é um array válido.");
    }

    if (Array.isArray(listaConhecimentos)) {
      await usuarioRef.update({
        conhecimentoUsuario: admin.firestore.FieldValue.arrayUnion(...listaConhecimentos),
      });
    } else {
      console.log("listaConhecimentos não é um array válido.");
    }

    res.status(200).send({ message: 'Questionário enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar questionário:', error);
    res.status(500).send({ error: 'Erro ao enviar questionário' });
  }
});

router.put('/editar-usuario', verificarSessao, async (req, res) => {
  try {
    const { uid, nomeCompleto, CPF, dataNascimento, tipoConta, experiencias, conhecimentos } = req.body;

    if (!uid || !nomeCompleto || !CPF) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const userRef = db.collection('usuarios').doc(uid);
    await userRef.update({
      nomeCompleto,
      CPF,
      dataNascimento,
      tipoConta,
      experiencias,
      conhecimentos
    });

    res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;