// Função para buscar e exibir caravanas
// Função para buscar e exibir caravanas
const exibirCaravanas = async () => {
  try {
    const resposta = await fetch("/caravanas");
    const caravanas = await resposta.json();

    const container = document.getElementById("caravanas-container");
    container.innerHTML = ""; // Limpa o container antes de adicionar os cards

    caravanas.forEach((caravana) => {
      const card = document.createElement("div");
      card.className = "caravana-card";

      // Verifica se o campo 'imagens' existe e tem pelo menos uma imagem
      const imagem = caravana.imagens && caravana.imagens.length > 0 ? caravana.imagens[0] : "caminho/para/imagem_padrao.jpg";

      card.innerHTML = `
        <h3>${caravana.local}</h3>
        <img src="${imagem}" alt="${caravana.local}" />
        <p><strong>Data:</strong> ${caravana.data}</p>
        <p><strong>Preço:</strong> ${caravana.preco}</p>
        <button onclick="abrirPopup('${caravana.id}')">Ver mais</button>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao buscar caravanas:", error);
    alert("Erro ao carregar caravanas.");
  }
};
  
  // Função para abrir popup com detalhes da caravana
  const abrirPopup = async (id) => {
    try {
      const resposta = await fetch(`/caravanas/${id}`);
      const caravana = await resposta.json();
  
      const popup = document.createElement("div");
      popup.className = "popup";
  
      popup.innerHTML = `
        <div class="popup-content">
          <h2>${caravana.local}</h2>
          <p><strong>Preço:</strong> ${caravana.preco}</p>
          <p><strong>Data:</strong> ${caravana.data}</p>
          <p><strong>Horário de Saída:</strong> ${caravana.horarioSaida}</p>
          <p><strong>Descrição:</strong> ${caravana.descricao}</p>
          <div class="imagens">
            ${caravana.imagens.map((img) => `<img src="${img}" alt="${caravana.local}" />`).join("")}
          </div>
          <button onclick="fecharPopup()">Fechar</button>
        </div>
      `;
  
      document.body.appendChild(popup);
    } catch (error) {
      console.error("Erro ao abrir popup:", error);
      alert("Erro ao carregar detalhes da caravana.");
    }
  };
  
  // Função para fechar popup
  const fecharPopup = () => {
    const popup = document.querySelector(".popup");
    if (popup) {
      popup.remove();
    }
  };
  
  // Carregar caravanas ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    exibirCaravanas();
  });