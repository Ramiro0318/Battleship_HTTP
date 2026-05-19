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
    const divContenedor = document.querySelector("#contenedor");

    //Movimiento
    const divMovimientos = document.querySelector("#movimiento");
    const btnArriba = document.querySelector("#arriba").addEventListener("click", () => moverNave("arriba"));
    const btnAbajo = document.querySelector("#abajo").addEventListener("click", () => moverNave("abajo"));
    const btnIzquierda = document.querySelector("#izquierda").addEventListener("click", () => moverNave("izquierda"));
    const btnDerecha = document.querySelector("#derecha").addEventListener("click", () => moverNave("derecha"));

    const btnRotarDerecha = document.querySelector("#rotarDerecha").addEventListener("click", () => RotarNave("derecha"));
    const btnRotarIzquierda = document.querySelector("#rotarIzquierda").addEventListener("click", () => RotarNave("izquierda"));

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
    let naveSeleccionadaId = null;
    let naveSeleccionadaFila = null;
    let naveSeleccionadaCol = null;
    let naveDireccion = "derecha";

    if (!numSala || !idUsuario) {
        window.location.href = "/battleship/";
        return;
    }


    //Inicializar /////////////////////////////////////////////////////////////////////////////////
    bIdSala.textContent = numSala;
    spanTiempo.textContent = "60";


    btnOk.addEventListener('click', function () {
        divInstrucciones.classList.add("invisible");
        fondo.classList.add("invisible");
    });




    //Etapa de Colocar barcos /////////////////////////////////////////////////////////////////////
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


                        if (navesRecibidas) {
                            cargarDefensaServidor(navesRecibidas);
                        }
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








    //Colocacion/////////////////////////////////////////////////////////////////////////////////

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

        if (e.target.tagName == "DIV") {
            naveMoviendo = e.target;
            e.dataTransfer.setData("text/plain", e.target.id);
            console.log("arrastrando:", e.target.id);
        }
        else {
            e.preventDefault();
        }
    }


    const tbodyTablero = document.querySelector("#tablaJugador tbody");
    if (tbodyTablero) {
        //DRAG OVER
        tbodyTablero.addEventListener("dragover", dragOver);
        function dragOver(e) {
            e.preventDefault();
        }


        //DROP
        tbodyTablero.addEventListener("drop", drop);
        function drop(e) {
            e.preventDefault();

            let celdaDestino = e.target;

            if (celdaDestino.tagName === "IMG") {
                celdaDestino = celdaDestino.parentElement;
            }

            if (celdaDestino.tagName !== "TD") return;

            const idNave = e.dataTransfer.getData("text/plain");

            if (!naveMoviendo) return;

            const cuadritosBarco = naveMoviendo.querySelectorAll("img");
            const longitudBarco = cuadritosBarco.length;

            const filaInicial = celdaDestino.parentElement.sectionRowIndex;
            const columnaInicial = celdaDestino.cellIndex;

            let posicionesProyectadas = [];
            for (let i = 0; i < longitudBarco; i++) {
                posicionesProyectadas.push({
                    fila: filaInicial,
                    col: columnaInicial + i,
                    indiceCuerpo: i
                });
            }

            const dropPermitido = comprobarOcupadas(posicionesProyectadas, idNave);

            if (!dropPermitido) {
                console.warn(`[Drop Bloqueado] Fuera de límites o colisión en (${filaInicial}, ${columnaInicial}).`);
                return;
            }

            const filaActual = tbodyTablero.rows[filaInicial];

            cuadritosBarco.forEach((imgOriginal, indice) => {
                const columnaDestino = columnaInicial + indice;
                const celdaObjetivo = filaActual.cells[columnaDestino];

                const nuevoCuadrito = imgOriginal.cloneNode(true);
                nuevoCuadrito.id = idNave;

                nuevoCuadrito.style.width = "100%";
                nuevoCuadrito.style.height = "100%";
                nuevoCuadrito.style.display = "block";

                celdaObjetivo.innerHTML = "";
                celdaObjetivo.appendChild(nuevoCuadrito);
            });

            naveMoviendo.setAttribute("draggable", "false");

            console.log(`Nave ${idNave} colocada exitosamente desde la columna ${columnaInicial} hacia la izquierda.`);

            naveMoviendo = null;
        }

    }


    //MOVIMIENTO TRAS COLOCAR
    tbodyTablero.addEventListener("click", seleccionarBarcoEnTablero);
    function seleccionarBarcoEnTablero(e) {
        if (e.target.tagName !== "IMG") return;

        const idNave = e.target.id;

        tbodyTablero.querySelectorAll(".celda-seleccionada").forEach(celda => {
            celda.classList.remove("celda-seleccionada");
        });

        let celdasNave = [];

        for (let f = 0; f < tbodyTablero.rows.length; f++) {
            for (let c = 0; c < tbodyTablero.rows[f].cells.length; c++) {
                const celda = tbodyTablero.rows[f].cells[c];
                const img = celda.querySelector("img");

                // Si la celda tiene una imagen y coincide con el ID del barco tocado
                if (img && img.id === idNave) {
                    celdasNave.push({ celda, fila: f, col: c });
                }
            }
        }

        if (celdasNave.length === 0) return;

        // la punta columna más alta. //de menor a mayor
        celdasNave.sort((a, b) => a.col - b.col);

        const puntaDetectada = celdasNave[0];

        naveSeleccionadaId = idNave;
        naveSeleccionadaFila = puntaDetectada.fila;
        naveSeleccionadaCol = puntaDetectada.col;
        naveDireccion = "derecha";

        celdasNave.forEach((item, indice) => { item.celda.classList.add("celda-seleccionada");});

        console.log(`[Selección] Nave ${idNave} fija. Punta en (${naveSeleccionadaFila}, ${naveSeleccionadaCol}) apuntando a la ${naveDireccion}.`);
    }

    //MOVER
    function moverNave(direccionBoton) {
        if (!naveSeleccionadaId) return;
        if (direccionBoton !== "arriba" && direccionBoton !== "abajo" &&
            direccionBoton !== "izquierda" && direccionBoton !== "derecha") return;

        const fragmentosEnTablero = tbodyTablero.querySelectorAll(`img[id="${naveSeleccionadaId}"]`);
        const longitud = fragmentosEnTablero.length;

        if (longitud === 0) return;

        let imgsParaClonar = Array.from(fragmentosEnTablero);

        let nuevaFilaPunta = naveSeleccionadaFila;
        let nuevaColPunta = naveSeleccionadaCol;

        if (direccionBoton === "arriba") nuevaFilaPunta--;
        if (direccionBoton === "abajo") nuevaFilaPunta++;
        if (direccionBoton === "izquierda") nuevaColPunta--;
        if (direccionBoton === "derecha") nuevaColPunta++;

        let nuevasPosiciones = [];
        for (let i = 0; i < longitud; i++) {
            let f = nuevaFilaPunta;
            let c = nuevaColPunta;

            if (naveDireccion === "derecha") c = nuevaColPunta + i;
            if (naveDireccion === "izquierda") c = nuevaColPunta - i;
            if (naveDireccion === "abajo") f = nuevaFilaPunta + i;
            if (naveDireccion === "arriba") f = nuevaFilaPunta - i;

            nuevasPosiciones.push({ fila: f, col: c, indiceCuerpo: i });
        }

        const esPosible = comprobarOcupadas(nuevasPosiciones, naveSeleccionadaId);

        if (!esPosible) {
            console.warn(`[Movimiento] Bloqueado hacia la ${direccionBoton}.`);
            return;
        }

        fragmentosEnTablero.forEach(img => {
            const celdaVieja = img.parentElement;
            if (celdaVieja) {
                celdaVieja.innerHTML = "";
                celdaVieja.classList.remove("celda-seleccionada");
            }
        });

        nuevasPosiciones.forEach(pos => {
            const celdaObjetivo = tbodyTablero.rows[pos.fila].cells[pos.col];
            const nuevoCuadrito = imgsParaClonar[pos.indiceCuerpo].cloneNode(true);

            nuevoCuadrito.id = naveSeleccionadaId;
            nuevoCuadrito.style.width = "100%";
            nuevoCuadrito.style.height = "100%";
            nuevoCuadrito.style.display = "block";
            celdaObjetivo.classList.add("celda-seleccionada");

            celdaObjetivo.appendChild(nuevoCuadrito);
        });

        naveSeleccionadaFila = nuevaFilaPunta;
        naveSeleccionadaCol = nuevaColPunta;

        console.log(`[Movimiento] Éxito. Nueva punta en (${naveSeleccionadaFila}, ${naveSeleccionadaCol}).`);
    }

    //ROTAR
    function rotarNave(sentidoRotacion) {
        if (!naveSeleccionadaId) return;
        if (sentidoRotacion !== "derecha" && sentidoRotacion !== "izquierda") return;

        const divOriginal = document.getElementById(naveSeleccionadaId);
        const longitud = divOriginal.querySelectorAll("img").length;

        const direcciones = ["arriba", "derecha", "abajo", "izquierda"];
        let indiceActual = direcciones.indexOf(naveDireccion);

        let nuevaDireccion = naveDireccion;
        if (sentidoRotacion === "derecha") {
            // Giro horario: avanzar un espacio en la lista
            nuevaDireccion = direcciones[(indiceActual + 1) % 4];
        } else if (sentidoRotacion === "izquierda") {
            // Giro antihorario: retroceder un espacio (sumamos 4 para evitar números negativos)
            nuevaDireccion = direcciones[(indiceActual - 1 + 4) % 4];
        }

        let posicionesTransformadas = [];
        for (let i = 0; i < longitud; i++) {
            let f = naveSeleccionadaFila;
            let c = naveSeleccionadaCol;

            if (nuevaDireccion === "derecha") c = naveSeleccionadaCol - i;
            if (nuevaDireccion === "izquierda") c = naveSeleccionadaCol + i;
            if (nuevaDireccion === "abajo") f = naveSeleccionadaFila - i;
            if (nuevaDireccion === "arriba") f = naveSeleccionadaFila + i;

            posicionesTransformadas.push({ fila: f, col: c, indiceCuerpo: i });
        }

        const esPosible = comprobarOcupadas(posicionesTransformadas, naveSeleccionadaId);

        if (!esPosible) {
            console.warn(`[Rotación] Bloqueada hacia la ${sentidoRotacion}. No hay espacio o hay colisión.`);
            return;
        }

        const clonesViejos = tbodyTablero.querySelectorAll(`img[id="${naveSeleccionadaId}"]`);
        clonesViejos.forEach(img => {
            const celdaVieja = img.parentElement;
            if (celdaVieja) celdaVieja.innerHTML = "";
        });

        const imgsOriginales = divOriginal.querySelectorAll("img");

        let gradosCss = 0;
        if (nuevaDireccion === "derecha") gradosCss = 0;
        if (nuevaDireccion === "abajo") gradosCss = 90;
        if (nuevaDireccion === "izquierda") gradosCss = 180;
        if (nuevaDireccion === "arriba") gradosCss = 270;

        posicionesTransformadas.forEach(pos => {
            const celdaObjetivo = tbodyTablero.rows[pos.fila].cells[pos.col];
            const nuevoCuadrito = imgsOriginales[pos.indiceCuerpo].cloneNode(true);

            nuevoCuadrito.id = naveSeleccionadaId;
            nuevoCuadrito.style.width = "100%";
            nuevoCuadrito.style.height = "100%";
            nuevoCuadrito.style.display = "block";

            // Aplicamos los grados correspondientes para que la imagen tenga sentido visual
            nuevoCuadrito.style.transform = `rotate(${gradosCss}deg)`;

            celdaObjetivo.appendChild(nuevoCuadrito);
        });

        naveDireccion = nuevaDireccion;

        console.log(`[Rotación] Éxito. Nave ${naveSeleccionadaId} ahora apunta hacia: ${naveDireccion}`);
    }


    function comprobarOcupadas(posicionesDeseadas, idNave) {
        for (let coord of posicionesDeseadas) {

            if (coord.fila < 0 || coord.fila > 9 || coord.col < 0 || coord.col > 9) {
                console.warn(`[Aduana] Posición inválida: (${coord.fila}, ${coord.col}) está fuera del tablero.`);
                return false;
            }

            const celdaDestino = tbodyTablero.rows[coord.fila].cells[coord.col];
            const imgExistente = celdaDestino.querySelector("img");

            if (imgExistente && imgExistente.id !== idNave) {
                console.warn(`[Aduana] Colisión detectada en la celda (${coord.fila}, ${coord.col}) con la nave ID: ${imgExistente.id}`);
                return false;
            }
        }

        return true;
    }











    //Etapa de atacar/////////////////////////////////////////////////////////////////////////////
    // if (TableJugador) {
    //     TableJugador.addEventListener('click', function (event) {
    //         const celda = event.target;

    //         if (celda.tagName === 'TD') {
    //             if (celda.textContent === "") {
    //                 celda.textContent = "💥";
    //                 celda.style.fontSize = "20px";
    //                 celda.style.textAlign = "center";
    //                 celda.style.color = "blue";
    //             } else {
    //                 console.log("Esta celda ya fue atacada.");
    //             }
    //         }
    //     });
    // }

    function gestionarTurnoDeAtaque() {
        btnEnviar.classList.add("invisible");
        divMovimientos.classList.add("invisible");
        divContenedor.classList.add("invisible");
        tableroDefensa.style.display = "table";

        document.removeEventListener("dragstart", dragStart)
        tbodyTablero.removeEventListener("dragover", dragOver);
        tbodyTablero.removeEventListener("drop", drop);
    }



    function cargarDefensaServidor(navesList) {
        const tbodyDefensa = document.querySelector("#tablaDefensa tbody");
        if (!tbodyDefensa) return;

        const celdas = tbodyDefensa.querySelectorAll("td");
        celdas.forEach(celda => {
            celda.innerHTML = "";
            celda.removeAttribute("data-id-nave");
        });


        navesList.forEach(nave => {

            const imgOriginal = document.getElementById(nave.IdNave.toString());

            // Recorrer las coordenadas de la nave
            nave.Coordenadas.forEach(coord => {

                const fila = coord.Fila;
                const columna = coord.Columna;

                if (tbodyDefensa.rows[fila] && tbodyDefensa.rows[fila].cells[columna]) {
                    const celda = tbodyDefensa.rows[fila].cells[columna];

                    const imgBarco = document.createElement("img");

                    if (imgOriginal && imgOriginal.src) {
                        imgBarco.src = imgOriginal.src;
                    }

                    imgBarco.style.width = "100%";
                    imgBarco.style.height = "100%";
                    imgBarco.style.display = "block";
                    imgBarco.style.objectFit = "cover";

                    celda.appendChild(imgBarco);
                    celda.dataset.idNave = nave.IdNave;
                }
            });
        });
        if (tbodyTablero) {
            const barcosArrastrados = tbodyTablero.querySelectorAll("img");
            barcosArrastrados.forEach(img => img.remove());
        }
        console.log("Flota renderizada.");
    }





    //Etapa finalizar ///////////////////////////////////////////////////////////////////////////


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