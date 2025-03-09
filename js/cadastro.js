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

// Função para atualizar a interface com base no estado de autenticação
const atualizarInterface = async (user) => {
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
    alert("Login bem-sucedido!");
    await atualizarInterface(user); 
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

const validarTelefone = (telefone) => {
  const regexTelefone = /^\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/;
  return regexTelefone.test(telefone);
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