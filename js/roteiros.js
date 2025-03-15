import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBCp6XmixMcOTCeUYLwQgT62Yb_ZB2yrmw",
  authDomain: "projeto-caravana.firebaseapp.com",
  projectId: "projeto-caravana",
  storageBucket: "projeto-caravana.appspot.com",
  messagingSenderId: "109406579691",
  appId: "1:109406579691:web:fb554cb4a7663781c787ae",
  measurementId: "G-33W1PLKYV3",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variáveis globais para controle do popup
let imagensAtuais = [];
let indiceImagemAtual = 0;

// Função para formatar o preço como moeda brasileira (R$)
const formatarPreco = (preco) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
};

const abrirPopup = async (id) => {
  try {
    console.log(`Tentando buscar caravana com ID: ${id}`); // Log do ID da caravana
    const resposta = await fetch(`/caravanas/${id}`);

    // Verifica se a resposta é um JSON válido
    const contentType = resposta.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Resposta não é um JSON válido. Content-Type:", contentType);
      const textoResposta = await resposta.text(); // Lê o corpo da resposta como texto
      console.error("Conteúdo da resposta:", textoResposta); // Log do conteúdo da resposta
      throw new Error("Resposta não é um JSON válido.");
    }

    const caravana = await resposta.json(); // Converte a resposta para JSON
    console.log("Caravana recebida:", caravana); // Log da caravana recebida

    // Define o ID da caravana no popup
    document.getElementById("popup").setAttribute("data-caravana-id", id);

    // Atualiza o conteúdo do popup
    document.getElementById("popup-nome").textContent = caravana.local;
    document.getElementById("popup-descricao").textContent = caravana.descricao;

    // Verifica o status da caravana
    if (caravana.status === "notificacao") {
      // Oculta campos específicos para caravanas com status "notificacao"
      document.getElementById("popup-data").parentElement.style.display = "none"; // Oculta o campo Data de Saída
      document.getElementById("popup-horario").parentElement.style.display = "none"; // Oculta o campo Horário de Saída
      document.getElementById("popup-vagas-totais").parentElement.style.display = "none"; // Oculta o campo Vagas Totais
      document.getElementById("popup-vagas-disponiveis").parentElement.style.display = "none"; // Oculta o campo Vagas Disponíveis
      document.getElementById("comprar-ingressos-container").style.display = "none"; // Oculta o campo "Comprar ingressos"
      document.getElementById("popup-comprar").style.display = "none"; // Oculta o botão Comprar Ingresso
      document.getElementById("popup-assinar-notificacao").style.display = "block"; // Mostra o botão de assinar notificação
    } else if (caravana.status === "confirmada") {
      // Exibe todos os campos para caravanas confirmadas
      document.getElementById("popup-data").parentElement.style.display = "block"; // Exibe o campo Data de Saída
      document.getElementById("popup-horario").parentElement.style.display = "block"; // Exibe o campo Horário de Saída
      document.getElementById("popup-vagas-totais").parentElement.style.display = "block"; // Exibe o campo Vagas Totais
      document.getElementById("popup-vagas-disponiveis").parentElement.style.display = "block"; // Exibe o campo Vagas Disponíveis
      document.getElementById("comprar-ingressos-container").style.display = "flex"; // Exibe o campo "Comprar ingressos"
      document.getElementById("popup-comprar").style.display = "block"; // Exibe o botão Comprar Ingresso
      document.getElementById("popup-assinar-notificacao").style.display = "none"; // Oculta o botão de assinar notificação

      // Preenche os campos com os dados da caravana
      document.getElementById("popup-data").textContent = caravana.data || "N/A";
      document.getElementById("popup-horario").textContent = caravana.horarioSaida || "N/A";
      document.getElementById("popup-vagas-totais").textContent = caravana.vagasTotais || "N/A";

      // Trata o caso de "Vagas Disponíveis"
      const vagasDisponiveis = caravana.vagasDisponiveis ?? "N/A"; // Usa "N/A" se for null/undefined
      document.getElementById("popup-vagas-disponiveis").textContent = vagasDisponiveis === 0 ? 0 : vagasDisponiveis;

      // Destaca se não houver vagas
      const vagasDisponiveisElement = document.getElementById("popup-vagas-disponiveis");
      if (vagasDisponiveis === 0) {
        vagasDisponiveisElement.classList.add("sem-vagas");
      } else {
        vagasDisponiveisElement.classList.remove("sem-vagas");
      }
    }

    // Verifica se há imagens e exibe a primeira
    if (caravana.imagens && caravana.imagens.length > 0) {
      imagensAtuais = caravana.imagens; // Armazena as imagens para navegação
      indiceImagemAtual = 0; // Começa na primeira imagem
      document.getElementById("popup-imagem-principal").src = imagensAtuais[indiceImagemAtual];
    } else {
      // Se não houver imagens, exibe uma imagem padrão
      document.getElementById("popup-imagem-principal").src = "caminho/para/imagem_padrao.jpg";
    }

    // Exibe o popup
    document.getElementById("popup").style.display = "flex";
  } catch (error) {
    console.error("Erro ao abrir popup:", error);
    alert("Erro ao carregar detalhes da caravana.");
  }
};
// Função para navegar entre as imagens
const navegarImagem = (direcao) => {
  if (direcao === "anterior") {
    indiceImagemAtual = (indiceImagemAtual - 1 + imagensAtuais.length) % imagensAtuais.length;
  } else if (direcao === "proximo") {
    indiceImagemAtual = (indiceImagemAtual + 1) % imagensAtuais.length;
  }

  document.getElementById("popup-imagem-principal").src = imagensAtuais[indiceImagemAtual];
};

// Função para fechar popup
const fecharPopup = () => {
  document.getElementById("popup").style.display = "none";
};

// Função para comprar ingressos
const comprarIngresso = async (caravanaId, quantidade) => {
  const usuario = auth.currentUser;

  if (!usuario) {
    alert("Você precisa estar logado para comprar ingressos.");
    return;
  }

  try {
    // Verifica se há vagas suficientes
    const respostaCaravana = await fetch(`/caravanas/${caravanaId}`);
    const caravana = await respostaCaravana.json();

    if (caravana.vagasDisponiveis < quantidade) {
      alert("Não há vagas suficientes para a quantidade de ingressos solicitada.");
      return;
    }

    // Registra o usuário como participante da caravana
    const respostaCompra = await fetch("/comprar-ingresso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caravanaId,
        usuarioId: usuario.uid,
        usuarioEmail: usuario.email, // Adiciona o email do usuário
        quantidade,
      }),
    });

    const dadosCompra = await respostaCompra.json();
    if (respostaCompra.ok) {
      alert(`Ingresso(s) comprado(s) com sucesso! Quantidade: ${quantidade}`);
      // Atualiza o número de vagas disponíveis no popup
      const vagasDisponiveis = caravana.vagasDisponiveis - quantidade;
      document.getElementById("popup-vagas-disponiveis").textContent = vagasDisponiveis;
    } else {
      alert("Erro ao comprar ingresso: " + dadosCompra.error);
    }
  } catch (error) {
    console.error("Erro ao comprar ingresso:", error);
    alert("Erro ao comprar ingresso: " + error.message);
  }
};

// Função para excluir caravana
const excluirCaravana = async (id) => {
  const usuario = auth.currentUser;

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
      exibirCaravanas(); // Atualiza a lista de caravanas após a exclusão
    } else {
      alert("Erro ao excluir caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao excluir caravana:", error);
    alert("Erro ao excluir caravana: " + error.message);
  }
};

const abrirPopupEdicao = (caravana) => {
  // Preenche o formulário de edição com os dados da caravana
  document.getElementById("editar-local").value = caravana.local;
  document.getElementById("editar-preco").value = caravana.preco || "";
  document.getElementById("editar-data").value = caravana.data || "";
  document.getElementById("editar-horarioSaida").value = caravana.horarioSaida || "";
  document.getElementById("editar-vagasTotais").value = caravana.vagasTotais || "";
  document.getElementById("editar-imagens").value = caravana.imagens ? caravana.imagens.join(",") : "";
  document.getElementById("editar-descricao").value = caravana.descricao;
  document.getElementById("editar-status").value = caravana.status || "notificacao";

  // Armazena o ID da caravana no popup de edição
  document.getElementById("popup-editar-caravana").setAttribute("data-caravana-id", caravana.id);

  // Exibe o popup de edição
  document.getElementById("popup-editar-caravana").style.display = "flex";
};

const fecharPopupEdicao = () => {
  document.getElementById("popup-editar-caravana").style.display = "none";
};

const salvarEdicao = async (id) => {
  const local = document.getElementById("editar-local").value;
  const preco = document.getElementById("editar-preco").value || null;
  const data = document.getElementById("editar-data").value || null;
  const horarioSaida = document.getElementById("editar-horarioSaida").value || null;
  const vagasTotais = parseInt(document.getElementById("editar-vagasTotais").value) || null;
  const imagens = document.getElementById("editar-imagens").value.split(",").filter(url => url.trim() !== "");
  const descricao = document.getElementById("editar-descricao").value;
  const status = document.getElementById("editar-status").value || "notificacao";

  console.log("Dados enviados para atualização:", {
    local,
    preco,
    data,
    horarioSaida,
    vagasTotais,
    imagens,
    descricao,
    status,
  });

  try {
    const resposta = await fetch(`/caravanas/${id}`, {
      method: "PUT",
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
      alert("Caravana atualizada com sucesso!");
      fecharPopupEdicao();

      // Recarrega a seção atual
      const secaoAtual = document.querySelector(".secao-ativa");
      if (secaoAtual) {
        const secaoId = secaoAtual.id;
        if (secaoId === "caravanas-todas-section") {
          carregarTodasCaravanas();
        } else if (secaoId === "caravanas-confirmadas-section") {
          carregarCaravanasConfirmadas();
        } else if (secaoId === "caravanas-nao-confirmadas-section") {
          carregarCaravanasNaoConfirmadas();
        } else if (secaoId === "caravanas-canceladas-section") {
          carregarCaravanasCanceladas();
        }
      }
    } else {
      alert("Erro ao atualizar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao atualizar caravana:", error);
    alert("Erro ao atualizar caravana: " + error.message);
  }
};
// Função para adicionar botões de admin
const adicionarBotoesAdmin = (card, caravana) => {
  const usuario = auth.currentUser;

  // Verifica se o usuário é o administrador
  if (usuario && usuario.email === "adm@adm.com") {
    const botoesContainer = document.createElement("div");
    botoesContainer.className = "botoes-admin";

    // Botão de editar
    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.addEventListener("click", () => abrirPopupEdicao(caravana));

    // Botão de excluir
    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.addEventListener("click", () => excluirCaravana(caravana.id));

    // Botão de ver participantes
    const botaoParticipantes = document.createElement("button");
    botaoParticipantes.textContent = "Ver Participantes";
    botaoParticipantes.className = "btn-participantes";
    botaoParticipantes.addEventListener("click", () => verParticipantes(caravana.id));

    // Adiciona os botões ao container
    botoesContainer.appendChild(botaoEditar);
    botoesContainer.appendChild(botaoExcluir);
    botoesContainer.appendChild(botaoParticipantes);

    // Adiciona o container de botões ao card
    card.appendChild(botoesContainer);
  }
};

// Função para ver participantes
const verParticipantes = async (caravanaId) => {
  try {
    const resposta = await fetch(`/caravanas/${caravanaId}/participantes`);
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

// Evento para salvar a edição
document.getElementById("botao-salvar-edicao").addEventListener("click", () => {
  const caravanaId = document.getElementById("popup-editar-caravana").getAttribute("data-caravana-id");
  if (!caravanaId) {
    alert("ID da caravana não encontrado.");
    return;
  }
  salvarEdicao(caravanaId);
});

// Evento para cancelar a edição
document.getElementById("botao-cancelar-edicao").addEventListener("click", fecharPopupEdicao);

// Função para exibir caravanas
const exibirCaravanas = async () => {
  try {
    const resposta = await fetch("/caravanas");
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-container");
    container.innerHTML = ""; // Limpa o container antes de adicionar os cards

    // Filtra caravanas que não estão canceladas
    const caravanasAtivas = caravanas.filter(caravana => caravana.status !== "cancelada");

    // Verifica o usuário logado
    const usuario = auth.currentUser;
    console.log("Usuário logado:", usuario ? usuario.email : "Nenhum usuário logado");

    caravanasAtivas.forEach((caravana) => {
      const card = document.createElement("div");
      card.className = "roteiro-card";

      // Verifica se o campo 'imagens' existe e tem pelo menos uma imagem
      const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "caminho/para/imagem_padrao.jpg";

      // Define o conteúdo do card com base no status da caravana
      if (caravana.status === "notificacao") {
        card.innerHTML = `
          <img src="${imagem}" alt="${caravana.local}" />
          <h4>${caravana.local}</h4>
          <p class="preco-destaque">Não confirmado</p> <!-- Substitui o valor da passagem por "Não confirmado" -->
          <button class="btn-ver-mais" data-id="${caravana.id}">Ver mais</button>
        `;
      } else if (caravana.status === "confirmada") {
        card.innerHTML = `
          <img src="${imagem}" alt="${caravana.local}" />
          <h4>${caravana.local}</h4>
          <p class="preco-destaque">${formatarPreco(caravana.preco)}</p> <!-- Exibe o valor da passagem -->
          <p><strong>Vagas Disponíveis:</strong> ${caravana.vagasDisponiveis }</p> <!-- Exibe o número de vagas disponíveis -->
          <button class="btn-ver-mais" data-id="${caravana.id}">Ver mais</button>
        `;
      }

      // Adiciona os botões de editar e excluir apenas para o administrador
      adicionarBotoesAdmin(card, caravana);

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao buscar caravanas:", error);
    alert("Erro ao carregar caravanas.");
  }
};

// Função para assinar notificação
const assinarNotificacao = async (caravanaId) => {
  const usuario = auth.currentUser;

  if (!usuario) {
    alert("Você precisa estar logado para assinar notificações.");
    return;
  }

  try {
    const resposta = await fetch("/inscrever-viagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caravanaId,
        usuarioId: usuario.uid,
        usuarioEmail: usuario.email,
        inscrever: true,
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Você foi inscrito para receber notificações sobre esta caravana!");
    } else {
      alert("Erro ao assinar notificação: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao assinar notificação:", error);
    alert("Erro ao assinar notificação: " + error.message);
  }
};

// Evento para assinar notificação
document.getElementById("popup-assinar-notificacao").addEventListener("click", () => {
  const caravanaId = document.getElementById("popup").getAttribute("data-caravana-id");
  assinarNotificacao(caravanaId);
});

// Monitora o estado de autenticação
onAuthStateChanged(auth, (user) => {
  console.log("Estado de autenticação alterado. Usuário:", user ? user.email : "Nenhum usuário logado");

  if (user) {
    // Usuário logado
    exibirCaravanas(); // Atualiza a lista de caravanas
  } else {
    // Usuário não logado
    exibirCaravanas(); // Atualiza a lista de caravanas (sem botões de admin)
  }
});

// Executa a exibição das caravanas ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  // Captura cliques nos botões "Ver mais"
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-ver-mais")) {
      const id = event.target.getAttribute("data-id");
      abrirPopup(id);
    }
  });

  // Evento para comprar ingressos
  document.getElementById("popup-comprar").addEventListener("click", () => {
    const caravanaId = document.getElementById("popup").getAttribute("data-caravana-id");
    const quantidade = parseInt(document.getElementById("quantidade-ingressos").value);

    if (quantidade < 1) {
      alert("A quantidade de ingressos deve ser pelo menos 1.");
      return;
    }

    comprarIngresso(caravanaId, quantidade);
  });

  // Eventos de navegação do popup
  document.getElementById("popup-anterior").addEventListener("click", () => navegarImagem("anterior"));
  document.getElementById("popup-proximo").addEventListener("click", () => navegarImagem("proximo"));
  document.getElementById("popup-fechar").addEventListener("click", fecharPopup);
});

// Event listener para fechar o popup de participantes
document.getElementById("botao-fechar-popup-participantes").addEventListener("click", () => {
document.getElementById("popup-ver-participantes").style.display = "none";
});

// Event listener para abrir o popup de participantes ao clicar no botão "Ver Participantes"
document.addEventListener("click", (event) => {
if (event.target.classList.contains("btn-ver-participantes")) {
  const caravanaId = event.target.dataset.caravanaId;
  verParticipantes(caravanaId);
}
});















