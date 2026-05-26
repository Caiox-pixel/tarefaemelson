const nome = document.getElementById("nome");
const descricao = document.getElementById("descricao");
const salvar = document.getElementById("salvar");
const lista = document.getElementById("lista");

const total = document.getElementById("total");
const pendentes = document.getElementById("pendentes");
const sincronizados = document.getElementById("sincronizados");

let atendimentos = JSON.parse(localStorage.getItem("atendimentos")) || [];

function atualizarTela(){

  lista.innerHTML = "";

  let totalPendentes = 0;
  let totalSync = 0;

  atendimentos.forEach((item) => {

    if(item.status === "pendente"){
      totalPendentes++;
    }

    if(item.status === "sincronizado"){
      totalSync++;
    }

    lista.innerHTML += `
      <div class="item">

        <h4>${item.nome}</h4>

        <p>${item.descricao}</p>

        <small>${item.data}</small>

        <div class="status ${
          item.status === "pendente"
          ? "pendente-texto"
          : "sync-texto"
        }">

          ${item.status}

        </div>

      </div>
    `;
  });

  total.innerText = atendimentos.length;
  pendentes.innerText = totalPendentes;
  sincronizados.innerText = totalSync;

  localStorage.setItem("atendimentos", JSON.stringify(atendimentos));
}

salvar.addEventListener("click", () => {

  if(nome.value === "" || descricao.value === ""){
    alert("Preencha os campos");
    return;
  }

  const novoAtendimento = {
    id: Date.now(),
    nome: nome.value,
    descricao: descricao.value,
    data: new Date().toLocaleString(),
    status: navigator.onLine
      ? "sincronizado"
      : "pendente"
  };

  atendimentos.push(novoAtendimento);

  atualizarTela();

  nome.value = "";
  descricao.value = "";

  alert("Atendimento salvo!");
});

function sincronizar(){

  atendimentos.forEach((item) => {

    if(item.status === "pendente"){

      item.status = "sincronizado";

    }

  });

  atualizarTela();

  alert("Sincronização concluída!");
}

window.addEventListener("online", sincronizar);

atualizarTela();

if("serviceWorker" in navigator){

  navigator.serviceWorker.register("./service-worker.js");

}