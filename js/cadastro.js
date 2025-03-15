import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCp6XmixMcOTCeUYLwQgT62Yb_ZB2yrmw",
  authDomain: "projeto-caravana.firebaseapp.com",
  projectId: "projeto-caravana",
  storageBucket: "projeto-caravana.appspot.com",
  messagingSenderId: "109406579691",
  appId: "1:109406579691:web:fb554cb4a7663781c787ae",
  measurementId: "G-33W1PLKYV3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função para alternar entre formulários de cadastro e login
const mostrarFormulario = (formulario) => {
  const formCadastro = document.getElementById("form-cadastro");
  const formLogin = document.getElementById("form-login");

  if (formulario === "cadastro") {
    formCadastro.style.display = "flex"; // Mostra o formulário de cadastro
    formLogin.style.display = "none";   // Oculta o formulário de login
  } else if (formulario === "login") {
    formCadastro.style.display = "none"; // Oculta o formulário de cadastro
    formLogin.style.display = "flex";    // Mostra o formulário de login
  }
};

// Função para cadastrar usuário
const cadastrar = async () => {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;
  const idade = document.getElementById("idade").value;

  // Valida o formato do telefone antes de enviar os dados
  if (!validarTelefone(telefone)) {
    alert("Telefone inválido. Use o formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.");
    return; // Interrompe a execução se o telefone estiver incorreto
  }

  try {
    // Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // Envia os dados do usuário para o backend (Firestore)
    const resposta = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.uid,
        nome,
        email,
        telefone,
        idade,
      }),
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      alert("Usuário cadastrado com sucesso!");
      await atualizarInterface(user); // Aguarda a atualização da interface
    } else {
      alert("Erro ao cadastrar usuário: " + dados.error);
    }
  } catch (error) {
    alert("Erro ao cadastrar: " + error.message);
  }
};

// Função para fazer login
const login = async () => {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    console.log("Usuário logado:", user.email); // Verifique o email no console
    alert("Login bem-sucedido!");
    await atualizarInterface(user);
  } catch (error) {
    alert("Erro ao fazer login: " + error.message);
  }
};

const buscarDadosUsuario = async (uid) => {
  try {
    const resposta = await fetch(`/user/${uid}`);
    const dados = await resposta.json();

    if (resposta.ok) {
      return dados; // Retorna os dados do usuário (nome, email, telefone, idade)
    } else {
      console.error("Erro ao buscar dados do usuário:", dados.error);
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return null;
  }
};

// Função para fazer logout
const logout = async () => {
  try {
    await signOut(auth);
    alert("Logout realizado com sucesso!");
    atualizarInterface(null);
  } catch (error) {
    alert("Erro ao fazer logout: " + error.message);
  }
};

const cadastrarCaravana = async () => {
  const local = document.getElementById("local").value;
  const preco = document.getElementById("preco").value || null; // Campo opcional
  const data = document.getElementById("data").value || null; // Campo opcional
  const horarioSaida = document.getElementById("horarioSaida").value || null; // Campo opcional
  const vagasTotais = parseInt(document.getElementById("vagasTotais").value) || null; // Campo opcional
  const imagens = document.getElementById("imagens").value.split(",").filter(url => url.trim() !== "") || []; // Campo opcional
  const descricao = document.getElementById("descricao").value;
  const status = document.getElementById("status").value || "notificacao"; // Define como "notificacao" se estiver vazio

  // Validação dos campos obrigatórios
  if (!local || !descricao) {
    alert("Local e descrição são obrigatórios.");
    return;
  }

  try {
    const resposta = await fetch("/cadastrar-caravana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        local,
        preco,
        data,
        horarioSaida,
        vagasTotais,
        imagens,
        descricao,
        status,
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana cadastrada com sucesso!");
      fecharPopupCriarCaravana();
      carregarTodasCaravanas();
    } else {
      alert("Erro ao cadastrar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao cadastrar caravana:", error);
    alert("Erro ao cadastrar caravana: " + error.message);
  }
};

// Função para validar telefone
const validarTelefone = (telefone) => {
  const regexTelefone = /^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;
  return regexTelefone.test(telefone);
};

// Função para carregar caravanas registradas
const carregarCaravanasRegistradas = async (usuarioId) => {
  try {
    const resposta = await fetch(`/caravanas-registradas/${usuarioId}`);
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-registradas");
    if (!container) {
      console.error("Elemento 'caravanas-registradas' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container antes de adicionar os cards

    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar caravanas registradas:", error);
    alert("Erro ao carregar caravanas registradas.");
  }
};

// Função para carregar caravanas com notificações
const carregarCaravanasNotificacoes = async (usuarioEmail) => {
  try {
    const resposta = await fetch(`/caravanas-notificacoes/${usuarioEmail}`);
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-notificacoes");
    if (!container) {
      console.error("Elemento 'caravanas-notificacoes' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container

    // Título da seção
    const tituloPrincipal = document.createElement("h2");
    tituloPrincipal.textContent = "Caravanas com Notificações";
    container.appendChild(tituloPrincipal);

    // Container dos cards
    const cardContainer = document.createElement("div");
    cardContainer.className = "grid-caravanas";

    // Adiciona os cards ao container
    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      cardContainer.appendChild(card);
    });

    container.appendChild(cardContainer);

    // Exibe a seção de caravanas
    document.getElementById("caravanas-notificacoes-section").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar caravanas com notificações:", error);
    alert("Erro ao carregar caravanas com notificações.");
  }
};

const abrirPopupCriarCaravana = () => {
  document.getElementById("popup-criar-caravana").style.display = "flex";
};

const fecharPopupCriarCaravana = () => {
  document.getElementById("popup-criar-caravana").style.display = "none";
};

// Função para atualizar a interface do usuário
const atualizarInterface = async (user) => {
  const botoes = document.querySelector(".botoes");
  const infoUsuario = document.getElementById("info-usuario");
  const nomeUsuario = document.getElementById("nome-usuario");
  const emailUsuario = document.getElementById("email-usuario");
  const adminNavegacao = document.getElementById("admin-navegacao");
  const usuarioNavegacao = document.getElementById("usuario-navegacao");
  const formCadastro = document.getElementById("form-cadastro");
  const formLogin = document.getElementById("form-login");

  if (user) {
    // Usuário logado
    botoes.style.display = "none"; // Oculta os botões de cadastro/login
    infoUsuario.style.display = "block";

    // Busca os dados do usuário no backend
    const dadosUsuario = await buscarDadosUsuario(user.uid);

    if (dadosUsuario) {
      nomeUsuario.textContent = dadosUsuario.nome; // Exibe o nome do usuário
      emailUsuario.textContent = user.email; // Exibe o email do usuário
    } else {
      nomeUsuario.textContent = "Usuário"; // Valor padrão se o nome não for encontrado
      emailUsuario.textContent = user.email;
    }

    // Oculta os formulários de cadastro e login
    formCadastro.style.display = "none";
    formLogin.style.display = "none";

    // Mostra os botões do admin apenas para o admin
    if (user.email === "adm@adm.com") {
      adminNavegacao.style.display = "block"; // Exibe os botões do admin
      usuarioNavegacao.style.display = "none"; // Oculta os botões do usuário comum
    } else {
      adminNavegacao.style.display = "none"; // Oculta os botões do admin
      usuarioNavegacao.style.display = "block"; // Exibe os botões do usuário comum
    }

    // Carrega as caravanas registradas e as caravanas com notificações
    carregarCaravanasRegistradas(user.uid);
    carregarCaravanasNotificacoes(user.email);
  } else {
    // Usuário não logado
    botoes.style.display = "flex"; // Mostra os botões de cadastro/login
    infoUsuario.style.display = "none"; // Oculta as informações do usuário
    adminNavegacao.style.display = "none"; // Oculta os botões do admin
    usuarioNavegacao.style.display = "none"; // Oculta os botões do usuário comum
    mostrarFormulario("cadastro"); // Mostra o formulário de cadastro por padrão

    // Oculta as seções de caravanas
    document.getElementById("caravanas-registradas-section").style.display = "none";
    document.getElementById("caravanas-notificacoes-section").style.display = "none";
  }
};

const confirmarCaravana = async () => {
  const preco = document.getElementById("confirmar-preco").value;
  const data = document.getElementById("confirmar-data").value;
  const horarioSaida = document.getElementById("confirmar-horarioSaida").value;
  const vagasTotais = parseInt(document.getElementById("confirmar-vagasTotais").value);

  // Validação dos campos
  if (!preco || !data || !horarioSaida || !vagasTotais) {
    alert("Todos os campos são obrigatórios para confirmar a caravana.");
    return; // Interrompe a execução se algum campo estiver vazio
  }

  try {
    const resposta = await fetch(`/confirmar-caravana/${caravanaIdParaConfirmar}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preco,
        data,
        horarioSaida,
        vagasTotais,
        status: "confirmada", // Atualiza o status para "confirmada"
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana confirmada com sucesso!");
      fecharPopupConfirmarCaravana();

      // Recarrega a seção atual
      const secaoAtual = document.querySelector(".secao-ativa");
      if (secaoAtual) {
        const secaoId = secaoAtual.id;
        if (secaoId === "caravanas-nao-confirmadas-section") {
          carregarCaravanasNaoConfirmadas(); // Recarrega caravanas não confirmadas
        } else if (secaoId === "caravanas-todas-section") {
          carregarTodasCaravanas(); // Recarrega todas as caravanas
        }
      }
    } else {
      alert("Erro ao confirmar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao confirmar caravana:", error);
    alert("Erro ao confirmar caravana: " + error.message);
  }
};

const cancelarCaravana = async (id) => {
  try {
    const resposta = await fetch(`/cancelar-caravana/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana cancelada com sucesso!");

      // Recarrega a seção atual
      const secaoAtual = document.querySelector(".secao-ativa");
      if (secaoAtual) {
        const secaoId = secaoAtual.id;
        if (secaoId === "caravanas-confirmadas-section") {
          carregarCaravanasConfirmadas(); // Recarrega caravanas confirmadas
        } else if (secaoId === "caravanas-todas-section") {
          carregarTodasCaravanas(); // Recarrega todas as caravanas
        }
      }
    } else {
      alert("Erro ao cancelar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao cancelar caravana:", error);
    alert("Erro ao cancelar caravana: " + error.message);
  }
};

const verParticipantes = async (id) => {
  try {
    const resposta = await fetch(`/caravanas/${id}/participantes`);
    const participantes = await resposta.json();

    if (participantes.length === 0) {
      alert("Nenhum participante registrado nesta caravana.");
      return;
    }

    // Exibe os participantes no popup
    const participantesLista = document.getElementById("participantes-lista");
    participantesLista.innerHTML = participantes.map((p) => `
      <div class="participante">
        <p><strong>Nome:</strong> ${p.nome || "N/A"}</p>
        <p><strong>Email:</strong> ${p.usuarioEmail}</p>
        <p><strong>Telefone:</strong> ${p.telefone || "N/A"}</p>
        <p><strong>Ingressos Comprados:</strong> ${p.quantidade}</p>
      </div>
    `).join("");

    // Abre o popup
    document.getElementById("popup-ver-participantes").style.display = "flex";
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    alert("Erro ao carregar participantes.");
  }
};

// Função para carregar todas as caravanas
const carregarTodasCaravanas = async () => {
  try {
    const secaoTodas = document.getElementById("caravanas-todas-section");

    // Carrega as caravanas
    const resposta = await fetch("/caravanas");
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-todas-container");
    if (!container) {
      console.error("Elemento 'caravanas-todas-container' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container

    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      container.appendChild(card);
    });

    // Exibe a seção de todas as caravanas
    exibirSecao("caravanas-todas-section");
  } catch (error) {
    console.error("Erro ao carregar todas as caravanas:", error);
    alert("Erro ao carregar todas as caravanas.");
  }
};

// Função para carregar caravanas confirmadas
const carregarCaravanasConfirmadas = async () => {
  try {
    const secaoConfirmadas = document.getElementById("caravanas-confirmadas-section");

    // Carrega as caravanas confirmadas
    const resposta = await fetch("/caravanas-por-status/confirmada");
    const caravanas = await resposta.json();

    // Filtra apenas caravanas confirmadas
    const caravanasConfirmadas = caravanas.filter((caravana) => caravana.status === "confirmada");

    // Limpa os containers antes de adicionar os cards
    document.getElementById("caravanas-confirmadas-cheias-container").innerHTML = "";
    document.getElementById("caravanas-confirmadas-mais50-container").innerHTML = "";
    document.getElementById("caravanas-confirmadas-menos50-container").innerHTML = "";
    document.getElementById("caravanas-confirmadas-vazias-container").innerHTML = "";

    // Categoriza as caravanas por ocupação
    caravanasConfirmadas.forEach((caravana) => {
      const participantesAtuais = caravana.vagasTotais - caravana.vagasDisponiveis;
      const ocupacaoPercentual = (participantesAtuais / caravana.vagasTotais) * 100;

      const card = criarCardCaravana(caravana);

      if (ocupacaoPercentual === 100) {
        // Caravanas com 100% de ocupação
        document.getElementById("caravanas-confirmadas-cheias-container").appendChild(card);
      } else if (ocupacaoPercentual >= 50) {
        // Caravanas com 50% ou mais de ocupação
        document.getElementById("caravanas-confirmadas-mais50-container").appendChild(card);
      } else if (ocupacaoPercentual > 0) {
        // Caravanas com menos de 50% de ocupação
        document.getElementById("caravanas-confirmadas-menos50-container").appendChild(card);
      } else {
        // Caravanas vazias (0% de ocupação)
        document.getElementById("caravanas-confirmadas-vazias-container").appendChild(card);
      }
    });

    // Exibe a seção de caravanas confirmadas
    exibirSecao("caravanas-confirmadas-section");
  } catch (error) {
    console.error("Erro ao carregar caravanas confirmadas:", error);
    alert("Erro ao carregar caravanas confirmadas.");
  }
};

// Função para carregar caravanas não confirmadas
const carregarCaravanasNaoConfirmadas = async () => {
  try {
    const secaoNaoConfirmadas = document.getElementById("caravanas-nao-confirmadas-section");

    // Carrega as caravanas não confirmadas
    const resposta = await fetch("/caravanas-por-status/notificacao");
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-nao-confirmadas-container");
    if (!container) {
      console.error("Elemento 'caravanas-nao-confirmadas-container' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container

    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      container.appendChild(card);
    });

    // Exibe a seção de caravanas não confirmadas
    exibirSecao("caravanas-nao-confirmadas-section");
  } catch (error) {
    console.error("Erro ao carregar caravanas não confirmadas:", error);
    alert("Erro ao carregar caravanas não confirmadas.");
  }
};

const carregarCaravanasCanceladas = async () => {
  try {
    const secaoCanceladas = document.getElementById("caravanas-canceladas-section");

    // Carrega as caravanas canceladas
    const resposta = await fetch("/caravanas-por-status/cancelada");
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-canceladas-container");
    if (!container) {
      console.error("Elemento 'caravanas-canceladas-container' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container

    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      container.appendChild(card);
    });

    // Exibe a seção de caravanas canceladas
    exibirSecao("caravanas-canceladas-section");
  } catch (error) {
    console.error("Erro ao carregar caravanas canceladas:", error);
    alert("Erro ao carregar caravanas canceladas.");
  }
};

const criarCardCaravana = (caravana) => {
  const card = document.createElement("div");
  card.className = "roteiro-card";

  const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "caminho/para/imagem_padrao.jpg";

  // Calcula o número de participantes e a porcentagem de ocupação
  const participantesAtuais = caravana.vagasTotais - caravana.vagasDisponiveis;
  const ocupacaoPercentual = caravana.vagasTotais > 0 ? ((participantesAtuais / caravana.vagasTotais) * 100).toFixed(2) : 0;

  card.innerHTML = `
    <img src="${imagem}" alt="${caravana.local}" />
    <h4>${caravana.local}</h4>
    <p>Data: ${caravana.data || "Não definida"}</p>
    <p>Horário de Saída: ${caravana.horarioSaida || "Não definido"}</p>
    <p>Preço: ${caravana.preco || "Não definido"}</p>
    <p>Vagas Totais: ${caravana.vagasTotais || "Não definidas"}</p>
    <p>Vagas Disponíveis: ${caravana.vagasDisponiveis || "Não definidas"}</p>
    <p>Participantes Atuais: ${participantesAtuais}</p>
    <p class="ocupacao">Ocupação: ${ocupacaoPercentual}%</p>
    <p>Status: ${caravana.status}</p>
    ${caravana.status === "notificacao" ? `
      <button class="btn-confirmar" data-caravana-id="${caravana.id}">Confirmar</button>
      <button class="btn-cancelar" data-caravana-id="${caravana.id}">Cancelar</button>
    ` : ''}
    ${caravana.status === "confirmada" ? `
      <button class="btn-cancelar" data-caravana-id="${caravana.id}">Cancelar</button>
      <button class="btn-ver-participantes" data-caravana-id="${caravana.id}">Ver Integrantes</button>
    ` : ''}
    ${caravana.status === "cancelada" ? `
      <button class="btn-excluir" data-caravana-id="${caravana.id}">Excluir</button>
    ` : ''}
  `;

  // Adiciona eventos aos botões
  if (caravana.status === "notificacao") {
    card.querySelector(".btn-confirmar").addEventListener("click", () => {
      abrirPopupConfirmarCaravana(caravana.id);
    });
    card.querySelector(".btn-cancelar").addEventListener("click", () => {
      cancelarCaravana(caravana.id);
    });
  } else if (caravana.status === "confirmada") {
    card.querySelector(".btn-cancelar").addEventListener("click", () => {
      cancelarCaravana(caravana.id);
    });
    card.querySelector(".btn-ver-participantes").addEventListener("click", () => {
      verParticipantes(caravana.id);
    });
  } else if (caravana.status === "cancelada") {
    card.querySelector(".btn-excluir").addEventListener("click", () => {
      excluirCaravana(caravana.id);
    });
  }

  return card;
};

const carregarCaravanas = async () => {
  try {
    const resposta = await fetch("/caravanas");
    if (!resposta.ok) {
      throw new Error(`Erro ao buscar caravanas: ${resposta.statusText}`);
    }

    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-container");
    if (!container) {
      console.error("Elemento 'caravanas-container' não encontrado.");
      return;
    }

    container.innerHTML = ""; // Limpa o container antes de adicionar os cards

    caravanas.forEach((caravana) => {
      const card = criarCardCaravana(caravana);
      container.appendChild(card);
    });

    // Exibe a seção de caravanas
    document.getElementById("caravanas-section").style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar caravanas:", error);
    alert("Erro ao carregar caravanas.");
  }
};

const exibirSecao = (secaoId) => {
  const secoes = [
    "caravanas-todas-section",
    "caravanas-confirmadas-section",
    "caravanas-nao-confirmadas-section",
    "caravanas-canceladas-section",
    "caravanas-registradas-section",
    "caravanas-notificacoes-section",
  ];

  secoes.forEach((id) => {
    const secao = document.getElementById(id);
    if (secao) {
      // Se a seção já estiver aberta, não faz nada
      if (id === secaoId && secao.style.display !== "block") {
        secao.style.display = "block"; // Abre a seção
        secao.classList.add("secao-ativa"); // Adiciona a classe para identificar a seção ativa
      } else if (id !== secaoId) {
        secao.style.display = "none"; // Fecha as outras seções
        secao.classList.remove("secao-ativa"); // Remove a classe das outras seções
      }
    }
  });
};

let caravanaIdParaConfirmar; // Variável global para armazenar o ID da caravana a ser confirmada

const abrirPopupConfirmarCaravana = (id) => {
  caravanaIdParaConfirmar = id; // Armazena o ID da caravana
  document.getElementById("popup-confirmar-caravana").style.display = "flex";
};

const fecharPopupConfirmarCaravana = () => {
  document.getElementById("popup-confirmar-caravana").style.display = "none";
  caravanaIdParaConfirmar = null; // Limpa o ID da caravana
};

const excluirCaravana = async (id) => {
  const usuario = auth.currentUser;

  // Verifica se o usuário é o administrador
  if (!usuario || usuario.email !== "adm@adm.com") {
    alert("Apenas o administrador pode excluir caravanas.");
    return;
  }

  try {
    const resposta = await fetch(`/caravanas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: usuario.uid, // Envia o UID do usuário logado
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana excluída com sucesso!");
      carregarCaravanasCanceladas(); // Recarrega as caravanas canceladas após a exclusão
    } else {
      alert("Erro ao excluir caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao excluir caravana:", error);
    alert("Erro ao excluir caravana: " + error.message);
  }
};

// Event listener para o botão de confirmar caravana
document.getElementById("botao-confirmar-caravana").addEventListener("click", confirmarCaravana);

// Event listener para fechar o pop-up de confirmação
document.getElementById("botao-fechar-popup-confirmar").addEventListener("click", fecharPopupConfirmarCaravana);

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Botões para alternar entre cadastro e login
  document.getElementById("mostrar-cadastro").addEventListener("click", () => mostrarFormulario("cadastro"));
  document.getElementById("mostrar-login").addEventListener("click", () => mostrarFormulario("login"));

  // Botões de cadastro, login e logout
  document.getElementById("botao-cadastro").addEventListener("click", cadastrar);
  document.getElementById("botao-login").addEventListener("click", login);
  document.getElementById("botao-logout").addEventListener("click", logout);

  // Botão para cadastrar caravana
  document.getElementById("botao-cadastrar-caravana").addEventListener("click", cadastrarCaravana);

  // Botões do admin
  const adminNavegacao = document.getElementById("admin-navegacao");
  if (adminNavegacao) {
    document.getElementById("btn-todas").addEventListener("click", carregarTodasCaravanas);
    document.getElementById("btn-confirmadas").addEventListener("click", carregarCaravanasConfirmadas);
    document.getElementById("btn-nao-confirmadas").addEventListener("click", carregarCaravanasNaoConfirmadas);
    document.getElementById("btn-canceladas").addEventListener("click", carregarCaravanasCanceladas);
    document.getElementById("btn-nova-caravana").addEventListener("click", abrirPopupCriarCaravana);
  }

  // Botões do usuário comum
  const usuarioNavegacao = document.getElementById("usuario-navegacao");
  if (usuarioNavegacao) {
    document.getElementById("btn-caravanas-registradas").addEventListener("click", () => {
      const usuarioId = auth.currentUser?.uid;
      if (usuarioId) {
        carregarCaravanasRegistradas(usuarioId);
        exibirSecao("caravanas-registradas-section");
      }
    });

    document.getElementById("btn-caravanas-notificacoes").addEventListener("click", () => {
      const usuarioEmail = auth.currentUser?.email;
      if (usuarioEmail) {
        carregarCaravanasNotificacoes(usuarioEmail);
        exibirSecao("caravanas-notificacoes-section");
      }
    });

    document.getElementById("btn-caravanas-canceladas").addEventListener("click", () => {
      carregarCaravanasCanceladas();
      exibirSecao("caravanas-canceladas-section");
    });
  }

  // Botão para fechar o popup de criar caravana
  document.getElementById("botao-fechar-popup").addEventListener("click", fecharPopupCriarCaravana);

  // Monitora o estado de autenticação
  onAuthStateChanged(auth, (user) => {
    atualizarInterface(user);
  });

  // Event listeners para botões dentro dos cards
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-confirmar")) {
      const caravanaId = event.target.dataset.caravanaId;
      abrirPopupConfirmarCaravana(caravanaId); // Abre o pop-up de confirmação
    } else if (event.target.classList.contains("btn-cancelar")) {
      const caravanaId = event.target.dataset.caravanaId;
      cancelarCaravana(caravanaId);
    } else if (event.target.classList.contains("btn-ver-participantes")) {
      const caravanaId = event.target.dataset.caravanaId;
      verParticipantes(caravanaId);
    }
  });

  // Botão para fechar o popup de participantes
  document.getElementById("botao-fechar-popup-participantes").addEventListener("click", () => {
    document.getElementById("popup-ver-participantes").style.display = "none";
  });
});