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

app.use(express.json());
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

app.post("/cadastrar-caravana", async (req, res) => {
  const { local, preco, data, horarioSaida, vagasTotais, imagens, descricao, status } = req.body;

  // Campos obrigatórios
  if (!local || !descricao) {
    return res.status(400).json({ error: "Local e descrição são obrigatórios." });
  }

  try {
    const caravanaRef = await db.collection("caravanas").add({
      local,
      preco: preco === "nulo" ? null : preco, // Converte "nulo" para null
      data: data === "nulo" ? null : data, // Converte "nulo" para null
      horarioSaida: horarioSaida === "nulo" ? null : horarioSaida, // Converte "nulo" para null
      vagasTotais: vagasTotais === "nulo" ? null : parseInt(vagasTotais), // Converte "nulo" para null
      vagasDisponiveis: vagasTotais === "nulo" ? 0 : parseInt(vagasTotais), // Define como 0 se vagasTotais for "nulo"
      imagens: imagens || [], // Campo opcional (array vazio se não houver imagens)
      descricao,
      status: status || "notificacao", // Define como "notificacao" se estiver vazio
      exibirNoConfira: true,
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

app.get("/caravanas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const caravanaDoc = await db.collection("caravanas").doc(id).get();

    if (!caravanaDoc.exists) {
      return res.status(404).json({ error: "Caravana não encontrada." });
    }

    const caravana = caravanaDoc.data();
    res.status(200).json({ id: caravanaDoc.id, ...caravana });
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
  const { caravanaId, usuarioId, usuarioEmail, inscrever } = req.body;

  try {
    if (inscrever) {
      // Inscreve o usuário
      await db.collection("inscricoes").add({
        caravanaId,
        usuarioId,
        usuarioEmail,
      });
    } else {
      // Remove a inscrição do usuário
      const inscricaoSnapshot = await db.collection("inscricoes")
        .where("caravanaId", "==", caravanaId)
        .where("usuarioId", "==", usuarioId)
        .get();

      inscricaoSnapshot.forEach(async (doc) => {
        await doc.ref.delete();
      });
    }

    res.status(200).json({ message: "Inscrição atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar inscrição:", error);
    res.status(500).json({ error: "Erro ao atualizar inscrição." });
  }
});

app.put("/caravanas/:id", async (req, res) => {
  const { id } = req.params;
  const { local, preco, data, horarioSaida, vagasTotais, imagens, descricao, status } = req.body;

  console.log("Dados recebidos para atualização:", { id, local, preco, data, horarioSaida, vagasTotais, imagens, descricao, status });

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
      status,
    });

    console.log("Caravana atualizada com sucesso:", id);
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
      
      // Busca o nome e o telefone do usuário no Firestore
      const userDoc = await db.collection("users").doc(participante.usuarioId).get();
      if (userDoc.exists) {
        participante.nome = userDoc.data().nome; // Adiciona o nome ao objeto do participante
        participante.telefone = userDoc.data().telefone; // Adiciona o telefone ao objeto do participante
      }
      participantes.push(participante);
    }

    res.status(200).json(participantes);
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    res.status(500).json({ error: "Erro ao buscar participantes." });
  }
});

app.get("/caravanas-registradas/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const participantesSnapshot = await db.collection("participantes")
      .where("usuarioId", "==", usuarioId)
      .get();

    const caravanasRegistradas = [];
    for (const doc of participantesSnapshot.docs) {
      const participante = doc.data();
      const caravanaDoc = await db.collection("caravanas").doc(participante.caravanaId).get();
      if (caravanaDoc.exists) {
        const caravana = caravanaDoc.data();
        // Filtra caravanas que não estão canceladas
        if (caravana.status !== "cancelada") {
          caravanasRegistradas.push({ id: caravanaDoc.id, ...caravana });
        }
      }
    }

    res.status(200).json(caravanasRegistradas);
  } catch (error) {
    console.error("Erro ao buscar caravanas registradas:", error);
    res.status(500).json({ error: "Erro ao buscar caravanas registradas." });
  }
});

app.get("/caravanas-notificacoes/:usuarioEmail", async (req, res) => {
  const { usuarioEmail } = req.params;

  try {
    // Busca as inscrições do usuário
    const inscricoesSnapshot = await db.collection("inscricoes")
      .where("usuarioEmail", "==", usuarioEmail)
      .get();

    const caravanasNotificacoes = [];
    for (const doc of inscricoesSnapshot.docs) {
      const inscricao = doc.data();
      const caravanaDoc = await db.collection("caravanas").doc(inscricao.caravanaId).get();
      if (caravanaDoc.exists) {
        const caravana = caravanaDoc.data();
        // Filtra apenas caravanas com status "notificacao"
        if (caravana.status === "notificacao") {
          caravanasNotificacoes.push({ id: caravanaDoc.id, ...caravana });
        }
      }
    }

    res.status(200).json(caravanasNotificacoes);
  } catch (error) {
    console.error("Erro ao buscar caravanas para notificações:", error);
    res.status(500).json({ error: "Erro ao buscar caravanas para notificações." });
  }
});

app.get("/caravanas-notificacoes/:usuarioEmail", async (req, res) => {
  const { usuarioEmail } = req.params;

  try {
    // Busca as inscrições do usuário
    const inscricoesSnapshot = await db.collection("inscricoes")
      .where("usuarioEmail", "==", usuarioEmail)
      .get();

    const caravanasNotificacoes = [];
    for (const doc of inscricoesSnapshot.docs) {
      const inscricao = doc.data();
      const caravanaDoc = await db.collection("caravanas").doc(inscricao.caravanaId).get();
      if (caravanaDoc.exists) {
        caravanasNotificacoes.push({ id: caravanaDoc.id, ...caravanaDoc.data() });
      }
    }

    res.status(200).json(caravanasNotificacoes);
  } catch (error) {
    console.error("Erro ao buscar caravanas para notificações:", error);
    res.status(500).json({ error: "Erro ao buscar caravanas para notificações." });
  }
});

app.get("/verificar-inscricao/:caravanaId/:usuarioId", async (req, res) => {
  const { caravanaId, usuarioId } = req.params;

  try {
    const inscricaoSnapshot = await db.collection("inscricoes")
      .where("caravanaId", "==", caravanaId)
      .where("usuarioId", "==", usuarioId)
      .get();

    res.status(200).json({ inscrito: !inscricaoSnapshot.empty });
  } catch (error) {
    console.error("Erro ao verificar inscrição:", error);
    res.status(500).json({ error: "Erro ao verificar inscrição." });
  }
});

app.put("/confirmar-caravana/:id", async (req, res) => {
  const { id } = req.params;
  const { preco, data, horarioSaida, vagasTotais, status } = req.body;

  try {
    const caravanaRef = db.collection("caravanas").doc(id);

    // Verifica se a caravana existe
    const caravanaDoc = await caravanaRef.get();
    if (!caravanaDoc.exists) {
      return res.status(404).json({ message: "Caravana não encontrada." });
    }
 
    // Atualiza os campos e o status
    await caravanaRef.update({
      preco,
      data,
      horarioSaida,
      vagasTotais,
      vagasDisponiveis: vagasTotais, // Define as vagas disponíveis como o total de vagas
      status,
      exibirNoConfira: false,
    });

    res.status(200).json({ message: "Caravana confirmada com sucesso!" });
  } catch (error) {
    console.error("Erro ao confirmar caravana:", error);
    res.status(500).json({ error: "Erro ao confirmar caravana." });
  }
});

// Endpoint para cancelar uma caravana
app.put("/cancelar-caravana/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Tentando cancelar caravana com ID: ${id}`);

    // Referência ao documento da caravana no Firestore
    const caravanaRef = db.collection("caravanas").doc(id);

    // Verifica se a caravana existe
    const caravanaDoc = await caravanaRef.get();
    if (!caravanaDoc.exists) {
      console.log("Caravana não encontrada no Firestore.");
      return res.status(404).json({ message: "Caravana não encontrada." });
    }

    // Atualiza o status da caravana para "cancelada"
    await caravanaRef.update({
      status: "cancelada",
    });

    console.log("Caravana cancelada com sucesso.");

    res.status(200).json({ message: "Caravana cancelada com sucesso!" });
  } catch (error) {
    console.error("Erro ao cancelar caravana:", error);
    res.status(500).json({ message: "Erro ao cancelar caravana.", error: error.message });
  }
});


app.get("/caravanas-por-status/:status", async (req, res) => {
  const { status } = req.params;
  console.log(`Recebida requisição para caravanas com status: ${status}`);

  try {
    const caravanasSnapshot = await db.collection("caravanas")
      .where("status", "==", status)
      .get();

    const caravanas = [];
    caravanasSnapshot.forEach((doc) => {
      caravanas.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Caravanas encontradas: ${caravanas.length}`);
    res.status(200).json(caravanas);
  } catch (error) {
    console.error("Erro ao buscar caravanas por status:", error);
    res.status(500).json({ error: "Erro ao buscar caravanas por status." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});