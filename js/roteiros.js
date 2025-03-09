
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

// Função para abrir popup com detalhes da caravana
const abrirPopup = async (id) => {
  try {
    const resposta = await fetch(`/caravanas/${id}`);
    const caravana = await resposta.json();

    // Atualiza o conteúdo do pop-up
    document.getElementById("popup-nome").textContent = caravana.local;
    document.getElementById("popup-descricao").textContent = caravana.descricao;

    // Oculta número de lugares e botão de compra se a viagem não estiver confirmada
    if (!caravana.confirmada) {
      document.getElementById("popup-vagas-totais").style.display = "none";
      document.getElementById("popup-vagas-disponiveis").style.display = "none";
      document.getElementById("quantidade-ingressos").style.display = "none";
      document.getElementById("popup-comprar").style.display = "none";
    } else {
      document.getElementById("popup-vagas-totais").style.display = "block";
      document.getElementById("popup-vagas-disponiveis").style.display = "block";
      document.getElementById("quantidade-ingressos").style.display = "block";
      document.getElementById("popup-comprar").style.display = "block";
      document.getElementById("popup-vagas-totais").textContent = caravana.vagasTotais || "N/A";
      document.getElementById("popup-vagas-disponiveis").textContent = caravana.vagasDisponiveis || "N/A";
    }

    // Exibe o pop-up
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


// Função para abrir o pop-up de edição
const abrirPopupEdicao = (caravana) => {
  // Preenche o formulário de edição com os dados da caravana
  document.getElementById("editar-local").value = caravana.local;
  document.getElementById("editar-preco").value = caravana.preco;
  document.getElementById("editar-data").value = caravana.data;
  document.getElementById("editar-horarioSaida").value = caravana.horarioSaida;
  document.getElementById("editar-vagasTotais").value = caravana.vagasTotais;
  document.getElementById("editar-imagens").value = caravana.imagens.join(",");
  document.getElementById("editar-descricao").value = caravana.descricao;
  document.getElementById("editar-confirmada").checked = caravana.confirmada;

  // Armazena o ID da caravana no pop-up de edição
  document.getElementById("popup-editar-caravana").setAttribute("data-caravana-id", caravana.id);

  // Exibe o pop-up de edição
  document.getElementById("popup-editar-caravana").style.display = "flex";
};

// Função para fechar o pop-up de edição
const fecharPopupEdicao = () => {
  document.getElementById("popup-editar-caravana").style.display = "none";
};

// Função para salvar as alterações da caravana
const salvarEdicao = async (id) => {
  const local = document.getElementById("editar-local").value;
  const preco = document.getElementById("editar-preco").value || null;
  const data = document.getElementById("editar-data").value || null;
  const horarioSaida = document.getElementById("editar-horarioSaida").value || null;
  const vagasTotais = parseInt(document.getElementById("editar-vagasTotais").value) || null;
  const imagens = document.getElementById("editar-imagens").value.split(",");
  const descricao = document.getElementById("editar-descricao").value;
  const confirmada = document.getElementById("editar-confirmada").checked;
  const exibirNoConfira = document.getElementById("editar-exibir-no-confira").checked; // Certifique-se de que esse campo existe no formulário

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
        confirmada,
        exibirNoConfira, // Certifique-se de que esse campo está sendo enviado
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana atualizada com sucesso!");
      fecharPopupEdicao();
      exibirCaravanas(); // Atualiza a lista de caravanas
    } else {
      alert("Erro ao atualizar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao atualizar caravana:", error);
    alert("Erro ao atualizar caravana: " + error.message);
  }
};
const adicionarBotoesAdmin = (card, caravana) => {
  const usuario = auth.currentUser;

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

      // Adiciona os botões ao container
      botoesContainer.appendChild(botaoEditar);
      botoesContainer.appendChild(botaoExcluir);

      // Adiciona o container de botões ao card
      card.appendChild(botoesContainer);
  }
};

document.getElementById("botao-salvar-edicao").addEventListener("click", () => {
  // Recupera o ID da caravana do pop-up de edição
  const caravanaId = document.getElementById("popup-editar-caravana").getAttribute("data-caravana-id");

  if (!caravanaId) {
    alert("ID da caravana não encontrado.");
    return;
  }

  // Chama a função para salvar a edição
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

    // Verifica o usuário logado
    const usuario = auth.currentUser;
    console.log("Usuário logado:", usuario ? usuario.email : "Nenhum usuário logado");

    caravanas.forEach((caravana) => {
      const card = document.createElement("div");
      card.className = "roteiro-card";

      // Verifica se o campo 'imagens' existe e tem pelo menos uma imagem
      const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "caminho/para/imagem_padrao.jpg";

      card.innerHTML = `
        <img src="${imagem}" alt="${caravana.local}" />
        <h4>${caravana.local}</h4>
        <p class="preco-destaque">${formatarPreco(caravana.preco)}</p>
        <button class="btn-ver-mais" data-id="${caravana.id}">Ver mais</button>
      `;

      // Adiciona os botões de editar e excluir apenas para o administrador
      adicionarBotoesAdmin(card, caravana);

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao buscar caravanas:", error);
    alert("Erro ao carregar caravanas.");
  }
};

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