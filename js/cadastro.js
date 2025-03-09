import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Função para atualizar a interface com base no estado de autenticação
const atualizarInterface = (user) => {
  const botoes = document.querySelector(".botoes");
  const infoUsuario = document.getElementById("info-usuario");
  const nomeUsuario = document.getElementById("nome-usuario");
  const emailUsuario = document.getElementById("email-usuario");
  const formCaravana = document.getElementById("form-caravana");
  const formCadastro = document.getElementById("form-cadastro");
  const formLogin = document.getElementById("form-login");

  if (user) {
    // Usuário logado
    botoes.style.display = "none"; // Oculta os botões de cadastro/login
    infoUsuario.style.display = "block"; // Mostra as informações do usuário
    nomeUsuario.textContent = user.email; // Exibe o email do usuário
    emailUsuario.textContent = user.email;

    // Oculta os formulários de cadastro e login
    formCadastro.style.display = "none";
    formLogin.style.display = "none";

    // Mostra o formulário de caravana apenas para o admin
    if (user.email === "adm@adm.com") {
      formCaravana.style.display = "flex";
    } else {
      formCaravana.style.display = "none";
    }
  } else {
    // Usuário não logado
    botoes.style.display = "flex"; // Mostra os botões de cadastro/login
    infoUsuario.style.display = "none"; // Oculta as informações do usuário
    formCaravana.style.display = "none"; // Oculta o formulário de caravana
    mostrarFormulario("cadastro"); // Mostra o formulário de cadastro por padrão
  }
};

// Função para cadastrar usuário
const cadastrar = async () => {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;
  const idade = document.getElementById("idade").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    alert("Usuário cadastrado com sucesso!");
    atualizarInterface(user);
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
    alert("Login bem-sucedido!");
    atualizarInterface(user);
  } catch (error) {
    alert("Erro ao fazer login: " + error.message);
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

// Função para cadastrar caravana
const cadastrarCaravana = async () => {
  const local = document.getElementById("local").value;
  const preco = document.getElementById("preco").value;
  const data = document.getElementById("data").value;
  const horarioSaida = document.getElementById("horarioSaida").value;
  const vagasTotais = parseInt(document.getElementById("vagasTotais").value);
  const imagens = document.getElementById("imagens").value.split(",");
  const descricao = document.getElementById("descricao").value;
  const confirmada = document.getElementById("confirmada").checked;

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
        confirmada,
      }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Caravana cadastrada com sucesso!");
    } else {
      alert("Erro ao cadastrar caravana: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao cadastrar caravana:", error);
    alert("Erro ao cadastrar caravana: " + error.message);
  }
};

// Event Listeners
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

  // Monitora o estado de autenticação
  onAuthStateChanged(auth, (user) => {
    atualizarInterface(user);
  });
});