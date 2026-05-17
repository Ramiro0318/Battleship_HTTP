document.addEventListener('DOMContentLoaded', function () {

    //PARTIDA
    //Aceptar instrucciones
    const divInstrucciones = document.querySelector("#instrucciones");
    const btnOk = document.querySelector("#ok");
    const fondo = document.querySelector("#fondo");

    //HUD
    const bIdSala = document.querySelector("#bidSala");
    const spanTurno = document.querySelector("#turno");
    const spanTiempo = document.querySelector("#tiempoRestante");
    const TableJugador = document.querySelector("#tablaJugador");
    const divMovimientos = document.querySelector("#movmimiento");
    const divContenedor = document.querySelector("#contenedor");

    //Tablero
    const tablero = document.querySelector('#tablaJugador');

    //FinPartida
    const divResultados = document.querySelector("#resultados");
    const txtNumSalaResultados = document.querySelector("#numSalaResultados");
    const txtGanador = document.querySelector("#Ganador");
    const btnReiniciar = document.querySelector("#reiniciar");
    const btnSalir = document.querySelector("#salir");

    //ahora son constantes
    const nombre = localStorage.getItem("nombre") ?? "";
    const idUsuario = localStorage.getItem("IdUsuario") ?? "";
    const numSala = localStorage.getItem("numeroSala") ?? "";
    const idSala = localStorage.getItem("idSala") ?? "";


    let battleship;

    if (!numSala || !idUsuario) {
        window.location.href = "/battleship/";
        return;
    }


    //Inicializar
    //Hacer un clear de la tabla //
    bIdSala.textContent = numSala;
    //Timer = 60


    //Etapa de Colocar barcos

    btnOk.addEventListener('click', function () {
        divInstrucciones.classList.add("invisible");
        fondo.classList.add("invisible");
    });

    verificarEtapaColocacion(idSala);

    async function verificarEtapaColocacion(idSala) {
        let response = await fetch(`/battleship/estado-partida?idSala=${idSala}`, {
            method: "GET"
        });

        if (response.ok) {
            battleship = await response.json();

            if (battleship.Etapa === "ColocandoBarcos" || battleship.Etapa === 0) {
                console.log("fase de colocación");
                activarEtapaColocacion();
            }
            spanTurno.textContent = battleship.Turno;
            spanTiempo.textContent = battleship.TiempoRestante;

        } else {
            window.location.href = "/battleship/";
        }

        
    }

    function activarEtapaColocacion(tiempoLimiteISO) {
        spanTurno.textContent = "Acomoda tus naves...";
        iniciarCronometro(tiempoLimiteISO);
    }




    //Etapa de atacar
    if (tablero) {
        tablero.addEventListener('click', function (event) {
            const celda = event.target;

            if (celda.tagName === 'TD') {
                if (celda.textContent === "") {
                    celda.textContent = "💥";
                    celda.style.fontSize = "20px";
                    celda.style.textAlign = "center";
                    celda.style.color = "blue";
                } else {
                    console.log("Esta celda ya fue atacada.");
                }
            }
        });
    }

    //Finalizar

});