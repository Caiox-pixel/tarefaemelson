const btnSalvar = document.getElementById("btn");
    const btnExibir = document.getElementById("btn2");
    const btnClaro = document.getElementById("btn3");
    const btnEscuro = document.getElementById("btn4");

    const texto = document.getElementById("texto");
    const resultado = document.getElementById("resultado");


    btnSalvar.addEventListener("click", () => {

      localStorage.setItem("dados", texto.value);

      alert("Dados salvos offline!");
      texto.value = "";
    });


    btnExibir.addEventListener("click", () => {

      const dados = localStorage.getItem("dados");

      if(dados){
        resultado.innerText = "Dado salvo: " + dados;
      } else {
        resultado.innerText = "Nenhum dado encontrado.";
      }

    });

    // MODO CLARO
    btnClaro.addEventListener("click", () => {
      document.body.classList.remove("dark");
    });

    // MODO ESCURO
    btnEscuro.addEventListener("click", () => {
      document.body.classList.add("dark");
    });