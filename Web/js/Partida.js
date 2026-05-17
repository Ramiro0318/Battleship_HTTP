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
    const btnEnviar = document.querySelector('#enviarNaves');

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

            if (battleship.Etapa === 0) {
                console.log(battleship);
                monitorearPartida();
            }
            // spanTurno.textContent = battleship.Turno;
            // spanTiempo.textContent = battleship.TiempoRestante;

        } else {
            window.location.href = "/battleship/";
        }
    }



    let tableroEnviado = false;
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


                if (battleship.Etapa === 0) {
                    if (!tableroEnviado && battleship.TiempoRestante > 0) {
                        console.log("etapa de colocacion")
                        btnEnviar.disabled = false;
                    }
                    if (battleship.TiempoRestante == 0 && !tableroEnviado) {
                        enviarNavesPosicionadas();
                    }
                }
                else if (battleship.Etapa === 1) {
                    tableroEnviado = false;
                    if (!tableroEnviado) {
                        gestionarTurnoDeAtaque();

                    }
                }
                else if (battleship.Etapa === 2) {
                    console.log("El juego ha terminado.");
                    mostrarPantallaResultados(battleship.Ganador);
                    return;
                }

                setTimeout(monitorearPartida, 200);

            } else {
                window.location.href = "/battleship/";
            }
        } catch (error) {
            console.error("Error en Long Polling:", error);
            setTimeout(monitorearPartida, 2000);
        }
    }





    // Etapa de colocacion///////////////////////////////////////////////////////////

    btnEnviar.addEventListener("click", enviarNavesPosicionadas);
    async function enviarNavesPosicionadas() {
        tableroEnviado = true;
        btnEnviar.disabled = true;

        const navesEnTablero = document.querySelectorAll("#tablaJugador tbody td img");
        let navesList = [];


        navesEnTablero.forEach(img => {
            const celdaPadre = img.parentElement;
            const fila = celdaPadre.parentElement.rowIndex;
            const columna = celdaPadre.cellIndex;

            let naveDTO = {
                IdNave: parseInt(img.id),
                Coordenadas: [
                    { "Fila": fila, "Columna": columna }
                ]
            };

            navesList.push(naveDTO);
        });
        let json = {
            IdSala: idSala,
            IdUsuario: idUsuario,
            NavesColocadas: navesList
        };
        try {
            let response = await fetch("/battleship/enviar-naves", {
                method: "POST",
                body: JSON.stringify(json),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                console.log("Tablero guardado con éxito en el servidor.");
            } else {
                console.error("El servidor rechazó la configuración del tablero.");
                //Creo que deberiamos regresarlo a la sala
            }
        } catch (error) {
            console.error("Error de red al enviar las naves:", error);
        }
    }


    //DRAG
    let naveMoviendo = null;
    document.addEventListener("dragstart", function (e) {

        if (e.target.tagName == "IMG") {
            naveMoviendo = e.target;
            console.log("arrastrando:", e.target.id);
        }
        else {
            e.preventDefault();
        }
    });

    //DRAG SOBRE TABLERO

    const tbodyTablero = document.querySelector("#tablaJugador tbody");
    if (tbodyTablero) {
        tbodyTablero.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        tbodyTablero.addEventListener("drop", function (e) {
            e.preventDefault();

            const celdaDestino = e.target

            if (e.target.tagName == "TD") {
                if (celdaDestino.children.length === 0) {
                    celdaDestino.appendChild(naveMoviendo);


                }
                else {
                    console.log("Casilla ocupada");
                }

            }
        });
    }








    //Etapa de atacar//////////////////////////////////////////////////////////////
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

    function gestionarTurnoDeAtaque() {
        btnEnviar.classList.add("invisible");
        divMovimientos.classList.add("invisible");
    }



    //Finalizar ///////////////////////////////////////////////////////////////////


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