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
    const divMovimientos = document.querySelector("#movmimiento");
    const divContenedor = document.querySelector("#contenedor");

    //Tablero
    const TableJugador = document.querySelector("#tablaJugador");
    const tableroDefensa = document.querySelector('#tablaDefensa');
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
    let defensaRenderizada = false;
    async function monitorearPartida() {
        let payload = {
            IdSala: idSala,
            IdUsuario: idUsuario,
            TiempoCliente: battleship ? battleship.TiempoRestante : -1,
            EtapaCliente: battleship ? battleship.Etapa : 0,
            TurnoCliente: battleship ? battleship.Turno : "",
            FinalizadoCliente: battleship ? battleship.Finalizado : false,
            NumeroDisparos: battleship ? battleship.NumeroDisparos : 0
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
                    if (!defensaRenderizada) {
                        defensaRenderizada = true;



                        let navesRecibidas = (battleship.NavesRestantesJ1 && battleship.NavesRestantesJ1.length > 0)
                            ? battleship.NavesRestantesJ1 : battleship.NavesRestantesJ2;
                        gestionarTurnoDeAtaque();


                        if (navesRecibidas) {
                            cargarDefensaServidor(navesRecibidas);
                        }

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
            const fila = celdaPadre.parentElement.sectionRowIndex;
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
    document.addEventListener("dragstart", dragStart);

    function dragStart(e) {

        if (e.target.tagName == "IMG") {
            naveMoviendo = e.target;
            console.log("arrastrando:", e.target.id);
        }
        else {
            e.preventDefault();
        }
    }

    //DRAG SOBRE TABLERO

    const tbodyTablero = document.querySelector("#tablaJugador tbody");
    if (tbodyTablero) {
        tbodyTablero.addEventListener("dragover", dragOver);
        function dragOver(e) {
            e.preventDefault();
        }

        tbodyTablero.addEventListener("drop", drop);
        function drop(e) {
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
        }

    }








    //Etapa de atacar//////////////////////////////////////////////////////////////
    if (TableJugador) {
        TableJugador.addEventListener('click', function (event) {
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
        divContenedor.classList.add("invisible");
        tableroDefensa.style.display = "table";

        document.removeEventListener("dragStart", dragStart)
        tbodyTablero.removeEventListener("dragover", dragOver);
        tbodyTablero.removeEventListener("drop", drop);
    }



    function cargarDefensaServidor(navesList) {
        const tbodyDefensa = document.querySelector("#tablaDefensa tbody");
        const celdasDefensa = document.querySelectorAll("#tablaDefensa tbody td");
        if (!tbodyDefensa) return;

        const celdas = tbodyDefensa.querySelectorAll("td");
        celdas.forEach(celda => {
            celda.textContent = "";
            celda.removeAttribute("data-id-nave");
        });

        navesList.forEach(nave => {
            // Recorrer las coordenadas de la nave
            nave.Coordenadas.forEach(coord => {
                const fila = coord.Fila;
                const columna = coord.Columna;

                if (tbodyDefensa.rows[fila] && tbodyDefensa.rows[fila].cells[columna]) {
                    const celda = tbodyDefensa.rows[fila].cells[columna];

                    celda.textContent = "🚢";
                    celda.style.textAlign = "center";
                    celda.style.fontSize = "20px";

                    // Opcional: Le puedes poner un atributo data o id para saber qué nave es
                    celda.dataset.idNave = nave.IdNave;
                }
            });
        });
        console.log("Flota de defensa cargada e inicializada desde el servidor.");
    }





    //Etapa finalizar ///////////////////////////////////////////////////////////////////


    //Hacer un clear de la tabla //
    btnReiniciar.addEventListener('click', function (e) {
        // Buscamos el tbody real de la tabla y lo vaciamos de golpe
        const tbodyAtaque = document.querySelector("#tablaJugador tbody");
        const tbodyDefensa = document.querySelector("#tablaDefensa tbody");

        if (tbodyAtaque) tbodyAtaque.innerHTML = "";
        if (tbodyDefensa) tbodyDefensa.innerHTML = "";

        // Volvemos a regenerar las celdas vacías para el nuevo juego
        for (let f = 0; f < 10; f++) {
            let trA = document.createElement("tr");
            let trD = document.createElement("tr");

            for (let c = 0; c < 10; c++) {
                trA.appendChild(document.createElement("td"));
                trD.appendChild(document.createElement("td"));
            }
            tbodyAtaque.appendChild(trA);
            tbodyDefensa.appendChild(trD);
        }
    });
});