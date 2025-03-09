require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const firebaseAdmin = require("firebase-admin");
const path = require("path");

const app = express();
const PORT = 5000;

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const auth = firebaseAdmin.auth();
const db = firebaseAdmin.firestore();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../")));

const validarDadosCadastro = (nome, email, telefone, idade) => {
  if (!nome || !email || !telefone || !idade) {
    return "Todos os campos são obrigatórios.";
  }

  // Regex para validar o formato do telefone: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  const regexTelefone = /^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;
  if (!regexTelefone.test(telefone)) {
    return "Telefone inválido. Use o formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.";
  }

  if (idade <= 18) {
    return "Você deve ser um adulto para realizar o cadastro.";
  }

  return null; // Retorna null se não houver erros
};


app.post("/register", async (req, res) => {
  const { uid, nome, email, telefone, idade } = req.body;

  console.log("Dados recebidos no backend:", { uid, nome, email, telefone, idade }); // Log dos dados recebidos

  const erroValidacao = validarDadosCadastro(nome, email, telefone, idade);
  if (erroValidacao) {
    return res.status(400).json({ error: erroValidacao });
  }

  try {
    // Salva os dados no Firestore
    await db.collection("users").doc(uid).set({
      nome,
      email,
      telefone,
      idade,
    });

    console.log("Dados salvos no Firestore:", { nome, email, telefone, idade });

    res.status(200).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao salvar no Firestore:", error);
    res.status(400).json({ error: "Erro ao salvar dados do usuário no Firestore." });
  }
});
// Rota para buscar dados do usuário
app.get("/user/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar informações do usuário." });
  }
});


const verificarAdmin = async (req, res, next) => {
  const { uid } = req.body;

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists || userDoc.data().email !== "adm@adm.com") {
      return res.status(403).json({ error: "Acesso negado. Somente administradores podem realizar esta ação." });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
    res.status(500).json({ error: "Erro ao verificar permissões." });
  }
};


// Rota para cadastrar caravanas
app.post("/cadastrar-caravana", async (req, res) => {
  const { uid, local, preco, data, horarioSaida, vagasTotais, imagens, descricao, confirmada } = req.body;

  if (!local || !preco || !data || !horarioSaida || !vagasTotais || !imagens || !descricao) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
      const caravanaRef = await db.collection("caravanas").add({
          local,
          preco,
          data,
          horarioSaida,
          vagasTotais,
          vagasDisponiveis: vagasTotais,
          imagens,
          descricao,
          confirmada: confirmada || false, // Padrão é false (não confirmada)
          exibirNoConfira: true, // Define como true para exibir na seção "Confira!"
      });

      res.status(200).json({ message: "Caravana cadastrada com sucesso!", id: caravanaRef.id });
  } catch (error) {
      console.error("Erro ao cadastrar caravana:", error);
      res.status(500).json({ error: "Erro ao cadastrar caravana." });
  }
});

app.get("/caravanas", async (req, res) => {
  try {
    const caravanasSnapshot = await db.collection("caravanas").get();
    const caravanas = [];

    caravanasSnapshot.forEach((doc) => {
      const data = doc.data();
      caravanas.push({ id: doc.id, ...data });
    });

    res.status(200).json(caravanas);
  } catch (error) {
    console.error("Erro ao buscar caravanas:", error);
    res.status(500).json({ error: "Erro ao buscar caravanas." });
  }
});

// Rota para buscar caravana por ID
app.get("/caravanas/:id", async (req, res) => {
  const { id } = req.params;

  try {
      const caravanaDoc = await db.collection("caravanas").doc(id).get();

      if (!caravanaDoc.exists) {
          return res.status(404).json({ error: "Caravana não encontrada." });
      }

      res.status(200).json(caravanaDoc.data());
  } catch (error) {
      console.error("Erro ao buscar caravana:", error);
      res.status(500).json({ error: "Erro ao buscar caravana." });
  }
});

app.delete("/caravanas/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.body; // UID do usuário logado

  try {
    // Verifica se o usuário é admin
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data().email !== "adm@adm.com") {
      return res.status(403).json({ error: "Acesso negado. Somente administradores podem excluir caravanas." });
    }

    // Exclui a caravana
    await db.collection("caravanas").doc(id).delete();
    res.status(200).json({ message: "Caravana excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir caravana:", error);
    res.status(500).json({ error: "Erro ao excluir caravana." });
  }
});

// Rota para comprar ingressos
app.post("/comprar-ingresso", async (req, res) => {
  const { caravanaId, usuarioId, usuarioEmail, quantidade } = req.body;

  try {
      const caravanaRef = db.collection("caravanas").doc(caravanaId);
      const caravanaDoc = await caravanaRef.get();

      if (!caravanaDoc.exists) {
          return res.status(404).json({ error: "Caravana não encontrada." });
      }

      const caravana = caravanaDoc.data();

      // Verifica se há vagas suficientes
      if (caravana.vagasDisponiveis < quantidade) {
          return res.status(400).json({ error: "Não há vagas suficientes." });
      }

      // Atualiza o número de vagas disponíveis
      await caravanaRef.update({
          vagasDisponiveis: caravana.vagasDisponiveis - quantidade,
      });

      // Registra o usuário como participante da caravana
      await db.collection("participantes").add({
          caravanaId,
          usuarioId,
          usuarioEmail,
          quantidade,
      });

      res.status(200).json({ message: "Ingresso(s) comprado(s) com sucesso!" });
  } catch (error) {
      console.error("Erro ao comprar ingresso:", error);
      res.status(500).json({ error: "Erro ao comprar ingresso." });
  }
});

app.post("/inscrever-viagem", async (req, res) => {
  const { caravanaId, usuarioEmail } = req.body;

  try {
    // Registra o email do usuário para a viagem não confirmada
    await db.collection("inscricoes").add({
      caravanaId,
      usuarioEmail,
    });

    res.status(200).json({ message: "Inscrição realizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao inscrever-se na viagem:", error);
    res.status(500).json({ error: "Erro ao inscrever-se na viagem." });
  }
});

app.put("/caravanas/:id", async (req, res) => {
  const { id } = req.params;
  const { local, preco, data, horarioSaida, vagasTotais, imagens, descricao, confirmada, exibirNoConfira } = req.body;

  try {
    const caravanaRef = db.collection("caravanas").doc(id);
    await caravanaRef.update({
      local,
      preco,
      data,
      horarioSaida,
      vagasTotais,
      imagens,
      descricao,
      confirmada,
      exibirNoConfira, // Atualiza o campo exibirNoConfira
    });

    res.status(200).json({ message: "Caravana atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar caravana:", error);
    res.status(500).json({ error: "Erro ao atualizar caravana." });
  }
});


app.get("/caravanas/:id/participantes", async (req, res) => {
  const { id } = req.params;

  try {
    const participantesSnapshot = await db.collection("participantes")
      .where("caravanaId", "==", id)
      .get();

    const participantes = [];
    for (const doc of participantesSnapshot.docs) {
      const participante = doc.data();
      // Busca o nome do usuário no Firestore
      const userDoc = await db.collection("users").doc(participante.usuarioId).get();
      if (userDoc.exists) {
        participante.nome = userDoc.data().nome; // Adiciona o nome ao objeto do participante
      }
      participantes.push(participante);
    }

    res.status(200).json(participantes);
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    res.status(500).json({ error: "Erro ao buscar participantes." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});