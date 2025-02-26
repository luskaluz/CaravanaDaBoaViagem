import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Função para alternar entre formulários de cadastro e login
const mostrarFormulario = (formulario) => {
  document.getElementById("form-cadastro").style.display = "none";
  document.getElementById("form-login").style.display = "none";
  document.getElementById(`form-${formulario}`).style.display = "flex";
};

// Função para atualizar a interface com base no estado de autenticação
const atualizarInterface = async (usuario) => {
  const divInfoUsuario = document.getElementById("info-usuario");
  const nomeUsuarioSpan = document.getElementById("nome-usuario");
  const emailUsuarioSpan = document.getElementById("email-usuario");
  const divBotoes = document.querySelector(".botoes");
  const formularioCadastro = document.getElementById("form-cadastro");
  const formularioLogin = document.getElementById("form-login");
  const formularioCaravana = document.getElementById("form-caravana");

  if (usuario) {
    try {
      const resposta = await fetch(`/user/${usuario.uid}`);
      const dados = await resposta.json();

      if (resposta.ok) {
        nomeUsuarioSpan.textContent = dados.nome;
      } else {
        nomeUsuarioSpan.textContent = "Usuário sem nome cadastrado.";
      }

      emailUsuarioSpan.textContent = usuario.email;
      divInfoUsuario.style.display = "block";
      divBotoes.style.display = "none";
      formularioCadastro.style.display = "none";
      formularioLogin.style.display = "none";

      // Mostrar formulário de caravana apenas para o admin
      if (usuario.email === "adm@adm.com") {
        formularioCaravana.style.display = "flex";
      } else {
        formularioCaravana.style.display = "none";
      }
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);
      alert("Erro ao carregar informações do usuário.");
    }
  } else {
    divInfoUsuario.style.display = "none";
    divBotoes.style.display = "";
    formularioCadastro.style.display = "flex";
    formularioLogin.style.display = "none";
    formularioCaravana.style.display = "none";
  }
};

// Função para cadastrar usuário
const cadastrar = async () => {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;
  const idade = document.getElementById("idade").value;

  console.log("Dados de cadastro:", { nome, email, senha, telefone, idade });

  try {
    const resposta = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, email, senha, telefone, idade }),
    });

    const dados = await resposta.json();
    if (resposta.ok) {
      alert("Usuário registrado com sucesso!");
      const usuarioCredential = await signInWithEmailAndPassword(auth, email, senha);
      console.log(usuarioCredential);
      const usuario = usuarioCredential.user;
      atualizarInterface(usuario);
    } else {
      alert("Erro ao registrar: " + dados.error);
    }
  } catch (error) {
    console.error("Erro ao registrar:", error);
    alert("Erro ao registrar: " + error.message);
  }
};

// Função para fazer login
const login = async () => {
  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  try {
    const usuarioCredential = await signInWithEmailAndPassword(auth, email, senha);
    const usuario = usuarioCredential.user;

    alert("Login bem-sucedido!");
    atualizarInterface(usuario);
  } catch (error) {
    alert("Erro ao fazer login: verifique email e/ou senha");
  }
};

// Função para fazer logout
const logout = async () => {
  try {
    await signOut(auth);
    alert("Usuário deslogado!");
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
  const imagens = document.getElementById("imagens").value.split(",");
  const descricao = document.getElementById("descricao").value;

  const usuario = auth.currentUser;

  if (!usuario) {
    alert("Você precisa estar logado como administrador para cadastrar uma caravana.");
    return;
  }

  try {
    const resposta = await fetch("/cadastrar-caravana", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: usuario.uid,  // Envia o UID do usuário logado
        local,
        preco,
        data,
        horarioSaida,
        imagens,
        descricao,
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

// Eventos de clique
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("botao-cadastro").addEventListener("click", cadastrar);
  document.getElementById("botao-login").addEventListener("click", login);
  document.getElementById("botao-logout").addEventListener("click", logout);
  document.getElementById("botao-cadastrar-caravana").addEventListener("click", cadastrarCaravana);

  document.getElementById("mostrar-cadastro").addEventListener("click", () => mostrarFormulario("cadastro"));
  document.getElementById("mostrar-login").addEventListener("click", () => mostrarFormulario("login"));
});

// Monitorar estado de autenticação
onAuthStateChanged(auth, (usuario) => {
  if (usuario) {
    console.log("Usuário logado:", usuario.uid, usuario.email);
  }
  atualizarInterface(usuario);
});