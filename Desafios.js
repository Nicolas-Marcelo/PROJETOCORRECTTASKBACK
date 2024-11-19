const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

const colecaoDesafio = db.collection('desafios');
const colecaoSolucao = db.collection('solucoes');

// ESTA MARAVILINDA ROTA PEGA TODOS OS DESAFIOS EXISTENTES
router.get('/', async (req, res) => {
  try {
    const desafiosSnapshot = await colecaoDesafio.get();

    const desafios = desafiosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataLimite: doc.data().dataLimite?.toDate ? doc.data().dataLimite.toDate() : null,
    }));

    res.status(200).json(desafios);
  } catch (error) {
    console.error('Erro ao obter desafios:', error.message);
    res.status(500).json({ message: 'Erro ao obter desafios' });
  }
});


// JÁ ESTÁ PEGA APENAS O ID ESPEFIFICO PARA MOSTRAR OS DETALHES DO DESAFIO
router.get('/:id', async (req, res) => {
  try {
    const desafioId = req.params.id;
    const desafioDoc = await colecaoDesafio.doc(desafioId).get();

    const desafioData = desafioDoc.data();
    desafioData.dataLimite = desafioData.dataLiminote?.toDate ? desafioData.dataLimite.toDate() : null;

    const solucoesDetalhadas = [];
    if (desafioData.solucoes && Array.isArray(desafioData.solucoes)) {
      for (const solucaoId of desafioData.solucoes) {
        const solucaoDoc = await db.collection('solucoes').doc(solucaoId).get();
        if (solucaoDoc.exists) {
          solucoesDetalhadas.push({ id: solucaoDoc.id, ...solucaoDoc.data() });
        }
      }
    }

    res.status(200).json({
      id: desafioDoc.id,
      ...desafioData,
      solucoes: solucoesDetalhadas,
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do desafio:', error);
    res.status(500).json({ message: 'Erro ao obter detalhes do desafio' });
  }
});


// JÁ ESTÁ DELETA O NEGOCINHO LÁ PELO ID
router.delete('/:id', async (req, res) => {
  try {
    const desafioId = req.params.id;

    await colecaoDesafio.doc(desafioId).delete();

    res.status(200).json({ message: 'Desafio excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir desafio:', error);
    res.status(500).json({ message: 'Erro ao excluir desafio' });
  }
});

// ESTA ROTA EDITA O DESAFIO
router.put('/:id', async (req, res) => {
  const desafioId = req.params.id;  
  const { desafio, recompensa, dataLimite, descricao } = req.body;

  try {
    const desafioRef = colecaoDesafio.doc(desafioId);

    await desafioRef.update({
      desafio,
      recompensa,
      dataLimite,
      descricao,
    });

    res.status(200).json({ message: 'Desafio atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar desafio:', error);
    res.status(500).json({ error: 'Erro ao atualizar o desafio' });
  }
});

// ROTA PARA ADICIONAR SOLUCOES NO DESAFIO
router.post('/:id/solucoes', async (req, res) => {
  try {
    const desafioId = req.params.id;
    const { solucao } = req.body;

    const desafioRef = colecaoDesafio.doc(desafioId);
    const solucaoComInfo = {
      solucao: solucao,
    };

    await desafioRef.update({
      solucoes: admin.firestore.FieldValue.arrayUnion(solucaoComInfo),
    });

    res.status(200).json({ message: 'Solução adicionada com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar solução:', error);
    res.status(500).json({ message: 'Erro ao adicionar solução' });
  }
});

// ROTA PARA CRIAR UM NOVO DESAFIO
router.post('/adicionardesafios', async (req, res) => {
  try {
    const { desafio, recompensa, dataLimite, descricao, comunicacao, criterios, autorId } = req.body;

    const novoDesafio = {
      desafio,
      recompensa,
      dataLimite: dataLimite ? new Date(dataLimite) : null,
      descricao,
      comunicacao,
      criterios: Array.isArray(criterios) ? criterios : [],
      autorId,
    };

    await colecaoDesafio.add(novoDesafio);

    res.status(200).json({ message: 'Desafio adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar desafio:', error);
    res.status(500).json({ message: 'Erro ao adicionar desafio' });
  }
});

// ROTA PARA BUSCAR AS SOLUCOES DE UM ID EM ESPECIFICO --- TERMINAR
router.get('/solucoes/:userId', async (req, res) => {
  try {
      const userId = req.params.userId;
      const solucoesRef = db.collection('solucoes');
      const solucoesSnapshot = await solucoesRef.where('userId', '==', userId).get();

      if (solucoesSnapshot.empty) {
          return res.status(404).json({ message: 'Nenhuma solução encontrada para este usuário' });
      }

      const solucoes = [];
      for (const doc of solucoesSnapshot.docs) {
          const solucaoData = doc.data();
          const desafioId = solucaoData.desafioId;
          const desafioDoc = await db.collection('desafios').doc(desafioId).get();
          
          if (desafioDoc.exists) {
              solucoes.push({
                  solucao: solucaoData,
                  desafio: desafioDoc.data(),
              });
          }
      }

      res.status(200).json(solucoes);
  } catch (error) {
      res.status(500).json({ error: error.message });
      console.log('Um pequeninito erro', error)
  }
});

module.exports = router;