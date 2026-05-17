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
    bIdSala.textContent = numSala;
    spanTiempo.textContent = "60";




    btnOk.addEventListener('click', function () {
        divInstrucciones.classList.add("invisible");
        fondo.classList.add("invisible");
    });

    //Etapa de Colocar barcos
    verificarEtapaColocacion(idSala);

    async function verificarEtapaColocacion(idSala) {
        let response = await fetch(`/battleship/inicio-partida?idSala=${idSala}`, {
            method: "GET"
        });

        if (response.ok) {
            battleship = await response.json();

            if (battleship.Etapa === "ColocandoBarcos" || battleship.Etapa === 0) {
                console.log(battleship);
                monitorearPartida();
            }
            // spanTurno.textContent = battleship.Turno;
            // spanTiempo.textContent = battleship.TiempoRestante;

        } else {
            window.location.href = "/battleship/";
        }
    }



    async function monitorearPartida() {
        let payload = {
            IdSala: idSala,
            TiempoCliente: battleship ? battleship.TiempoRestante : -1,
            EtapaCliente: battleship ? battleship.Etapa : 0,
            TurnoCliente: battleship ? battleship.Turno : "",
            FinalizadoCliente: battleship ? battleship.Finalizado : false
        };

        try {
            let response = await fetch("/battleship/escuchar-partida", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                battleship = await response.json();
                console.log(battleship);

                spanTurno.textContent = battleship.Turno;
                spanTiempo.textContent = battleship.TiempoRestante;


                if (battleship.Etapa === "Finalizado") {
                    console.log("El juego ha terminado.");
                    mostrarPantallaResultados(battleship.Ganador);
                    return;
                }
                else if (battleship.Etapa === "ColocandoBarcos" || battleship.Etapa === 0) {
                    activarEtapaColocacion();
                }
                else if (battleship.Etapa === "Jugando" || battleship.Etapa === 1) {
                    gestionarTurnoDeAtaque();
                }

                // 3. El ciclo continúa: Volvemos a escuchar inmediatamente el siguiente cambio
                setTimeout(() => monitorearPartida(idSala), 10);

            } else {
                window.location.href = "/battleship/";
            }
        } catch (error) {
            console.error("Error en Long Polling:", error);
            setTimeout(() => monitorearPartida(idSala), 2000); // Reintento 
        }
    }



    function activarEtapaColocacion() {
        console.log("fase de colocación");
    }
    function gestionarTurnoDeAtaque() { }



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


    //Hacer un clear de la tabla //
    btnReiniciar.addEventListener('click', function (e) {
        tablero.lastChild.remove();

        let tbody = tablero.appendChild("TBODY");

        for (var i = 0; i < 10; i++) {
            let tr = tbody.appendChild("TR");

            for (var i = 0; i < 10; i++) {
                tr.appendChild("TD");
            }
        }
    });
});