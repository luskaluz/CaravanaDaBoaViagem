

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Função para formatar o preço como moeda brasileira (R$)
const formatarPreco = (preco) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
};

// Função para carregar o carrossel
const carregarCarrossel = async () => {
  try {
    const resposta = await fetch("/caravanas");
    const caravanas = await resposta.json();

    console.log("Dados recebidos:", caravanas); // Verifique os dados no console

    // Filtra apenas as viagens confirmadas
    const viagensConfirmadas = caravanas.filter((caravana) => caravana.confirmada);

    // Seleciona o container do carrossel
    const container = document.getElementById("carrossel-container");
    container.innerHTML = ""; // Limpa o container antes de adicionar os slides

    // Adiciona cada viagem como um slide no carrossel
    viagensConfirmadas.forEach((caravana) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide card";

      // Usa a primeira imagem da lista de imagens (ou uma imagem padrão)
      const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "./images/imagem_padrao.jpg";

      // Estrutura do card no carrossel
      slide.innerHTML = `
        <img src="${imagem}" alt="${caravana.local}" class="card-imagem" />
        <h4 class="card-titulo">${caravana.local}</h4>
        <p class="card-preco">${formatarPreco(caravana.preco)}</p>
      `;

      container.appendChild(slide);
    });

    // Inicializa o Swiper (carrossel)
    new Swiper(".swiper", {
      loop: true, // Permite loop infinito
      pagination: {
        el: ".swiper-pagination", // Adiciona paginação
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next", // Botão de próximo
        prevEl: ".swiper-button-prev", // Botão de anterior
      },
    });
  } catch (error) {
    console.error("Erro ao carregar carrossel:", error);
    alert("Erro ao carregar o carrossel. Tente novamente mais tarde.");
  }
};

const carregarViagensNaoConfirmadas = async () => {
  try {
      const resposta = await fetch("/caravanas");
      const caravanas = await resposta.json();

      // Filtra apenas as viagens não confirmadas que devem aparecer no "Confira"
      const viagensNaoConfirmadas = caravanas.filter(
          (caravana) => !caravana.confirmada && caravana.exibirNoConfira
      );

      // Seleciona o container de eventos
      const container = document.getElementById("eventos-container");
      container.innerHTML = ""; // Limpa o container antes de adicionar os eventos

      // Adiciona cada viagem não confirmada como um card
      viagensNaoConfirmadas.forEach((caravana) => {
          const card = document.createElement("div");
          card.className = "evento-card";

          // Usa a primeira imagem da lista de imagens (ou uma imagem padrão)
          const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "./images/imagem_padrao.jpg";

          // Estrutura do card
          card.innerHTML = `
              <img src="${imagem}" alt="${caravana.local}" class="evento-card-imagem">
              <div class="evento-card-conteudo">
                  <h3 class="evento-card-nome">${caravana.local}</h3>
                  <button onclick="abrirPopupConfira('${caravana.id}')">Ver Detalhes</button>
              </div>
          `;

          container.appendChild(card);
      });
  } catch (error) {
      console.error("Erro ao carregar viagens não confirmadas:", error);
      alert("Erro ao carregar viagens não confirmadas. Tente novamente mais tarde.");
  }
};

// Função para abrir o popup com detalhes da caravana
window.abrirPopupConfira = async (id) => {
  try {
      const resposta = await fetch(`/caravanas/${id}`);
      const caravana = await resposta.json();

      // Preenche o popup com os dados da caravana
      document.getElementById("popup-confira-nome").textContent = caravana.local;
      document.getElementById("popup-confira-descricao").textContent = caravana.descricao;

      // Exibe a primeira imagem (se houver)
      if (caravana.imagens && caravana.imagens.length > 0) {
          document.getElementById("popup-confira-imagem-principal").src = caravana.imagens[0];
      }

      // Exibe o popup
      document.getElementById("popup-confira").style.display = "flex";
  } catch (error) {
      console.error("Erro ao abrir popup:", error);
      alert("Erro ao carregar detalhes da caravana.");
  }
};

const fecharPopupConfira = () => {
  document.getElementById("popup-confira").style.display = "none";
};

document.getElementById("popup-confira-fechar").addEventListener("click", fecharPopupConfira);
document.getElementById("popup-confira-notificar").addEventListener("click", () => {
  alert("Você será notificado quando esta viagem for confirmada!");
  fecharPopupConfira();
});


// Função para inscrever o usuário para receber notificações
const inscreverParaNotificacao = async (caravanaId) => {
  const usuario = auth.currentUser;

  if (!usuario) {
    alert("Você precisa estar logado para se inscrever para notificações.");
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
        usuarioEmail: usuario.email,
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Inscrição realizada com sucesso! Você receberá uma notificação quando a viagem for confirmada.");
    } else {
      alert("Erro ao se inscrever: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao se inscrever:", error);
    alert("Erro ao se inscrever. Tente novamente mais tarde.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  carregarCarrossel();
  carregarViagensNaoConfirmadas();
});
document.getElementById("popup-confira-fechar").addEventListener("click", fecharPopupConfira);
document.getElementById("popup-confira-notificar").addEventListener("click", () => {
    alert("Você será notificado quando esta viagem for confirmada!");
    fecharPopupConfira();
});