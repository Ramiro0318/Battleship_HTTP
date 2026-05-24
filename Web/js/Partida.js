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

    const btnRotarDerecha = document.querySelector("#rotarDerecha").addEventListener("click", () => rotarNave("derecha"));
    const btnRotarIzquierda = document.querySelector("#rotarIzquierda").addEventListener("click", () => rotarNave("izquierda"));

    //Tablero
    const TableJugador = document.querySelector("#tablaJugador");
    const tableroDefensa = document.querySelector('#tablaDefensa');
    const btnEnviar = document.querySelector('#enviarNaves');

    //FinPartida
    const divResultados = document.querySelector("#resultados");
    const txtNumSalaResultados = document.querySelector("#numSalaResultados");
    const txtGanador = document.querySelector("#ganador");
    const txtRevancha = document.querySelector("#revancha");
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
                //console.log(battleship);
                monitorearPartida();
            }
        } else {
            window.location.href = "/battleship/";
        }
    }



    let tableroEnviado = false;
    let defensaRenderizada = false;
    let resultadoMostrado = false;

    async function monitorearPartida() {
        let payload = {
            IdSala: idSala,
            IdUsuario: idUsuario,
            TiempoCliente: battleship ? battleship.TiempoRestante : -1,
            EtapaCliente: battleship ? battleship.Etapa : 0,
            TurnoCliente: battleship ? battleship.Turno : "",
            FinalizadoCliente: battleship ? battleship.Finalizado : false,
            NumeroDisparos: battleship ? battleship.NumeroDisparos : 0,
            Revancha: battleship ? battleship.Revancha : 0
        };

        try {

            let response = await fetch("/battleship/escuchar-partida", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            });


            if (response.ok) {
                battleship = await response.json();

                //console.log(battleship);

                spanTurno.textContent = battleship.Turno;
                spanTiempo.textContent = battleship.TiempoRestante;

                if (battleship.Etapa === 0) {
                    if (resultadoMostrado) {
                        prepararNuevoJuego();
                    }
                    resultadoMostrado = false;
                    if (!tableroEnviado && battleship.TiempoRestante > 0) {
                        console.log("etapa de colocacion")
                        //btnEnviar.disabled = false;
                    }
                    if (battleship.TiempoRestante == 0 && !tableroEnviado) {
                        enviarNavesPosicionadas();
                    }
                }
                else if (battleship.Etapa === 1) {


                    tableroEnviado = false;
                    if (!defensaRenderizada) {
                        defensaRenderizada = true;

                        console.log(battleship.NavesRestantesJ1);
                        console.log(battleship.NavesRestantesJ2);

                        let navesRecibidas = (battleship.NavesRestantesJ1 && battleship.NavesRestantesJ1.length > 0)
                            ? battleship.NavesRestantesJ1 : battleship.NavesRestantesJ2;


                        if (navesRecibidas) {
                            cargarDefensaServidor(navesRecibidas);
                        }
                        gestionarTurnoDeAtaque();

                    }
                    if (defensaRenderizada) {
                        recibirAtaque(battleship);
                    }

                }
                else if (battleship.Etapa === 2) {
                    defensaRenderizada = false;
                    if (!resultadoMostrado) {
                        resultadoMostrado = true;
                        console.log("El juego ha terminado.");
                        mostrarPantallaResultados(battleship);
                    }
                    actualizarRechancha(battleship);
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
            const idNave = parseInt(img.id);

            let naveEncontrada = navesList.find(nave => nave.IdNave === idNave);


            if (naveEncontrada) {
                naveEncontrada.Coordenadas.push({ "Fila": fila, "Columna": columna });
            } else {
                let naveDTO = {
                    IdNave: idNave,
                    Coordenadas: [
                        { "Fila": fila, "Columna": columna }
                    ]
                };
                navesList.push(naveDTO);
            }
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
            naveMoviendo.style.display = "none";
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

        celdasNave.forEach((item, indice) => { item.celda.classList.add("celda-seleccionada"); });

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

        const fragmentosEnTablero = tbodyTablero.querySelectorAll(`img[id="${naveSeleccionadaId}"]`);
        const longitud = fragmentosEnTablero.length;

        if (longitud === 0) return;

        let imgsParaClonar = Array.from(fragmentosEnTablero);

        if (naveDireccion === "izquierda" || naveDireccion === "arriba") {
            imgsParaClonar.reverse();
        }

        const direcciones = ["arriba", "derecha", "abajo", "izquierda"];
        let indiceActual = direcciones.indexOf(naveDireccion);

        let nuevaDireccion = naveDireccion;
        if (sentidoRotacion === "derecha") {
            nuevaDireccion = direcciones[(indiceActual + 1) % 4];   //Sentido de las manecillas
        } else if (sentidoRotacion === "izquierda") {
            nuevaDireccion = direcciones[(indiceActual - 1 + 4) % 4];
        }

        let nuevasPosiciones = [];
        for (let i = 0; i < longitud; i++) {
            let f = naveSeleccionadaFila; // La punta se queda en su misma fila y columna
            let c = naveSeleccionadaCol;

            // ¡Alineado con moverNave!: El cuerpo se expande con los signos unificados
            if (nuevaDireccion === "derecha") c = naveSeleccionadaCol + i;
            if (nuevaDireccion === "izquierda") c = naveSeleccionadaCol - i;
            if (nuevaDireccion === "abajo") f = naveSeleccionadaFila + i;
            if (nuevaDireccion === "arriba") f = naveSeleccionadaFila - i;

            nuevasPosiciones.push({ fila: f, col: c, indiceCuerpo: i });
        }

        const esPosible = comprobarOcupadas(nuevasPosiciones, naveSeleccionadaId);

        if (!esPosible) {
            console.warn(`[Rotación] Bloqueada hacia la ${sentidoRotacion}. Fuera de límites o colisión.`);
            return;
        }

        fragmentosEnTablero.forEach(img => {
            const celdaVieja = img.parentElement;
            if (celdaVieja) {
                celdaVieja.innerHTML = "";
                celdaVieja.classList.remove("celda-seleccionada");
            }
        });


        let grados = 0;
        if (nuevaDireccion === "derecha") grados = 0;
        if (nuevaDireccion === "abajo") grados = 90;
        if (nuevaDireccion === "izquierda") grados = 180;
        if (nuevaDireccion === "arriba") grados = 270;

        nuevasPosiciones.forEach(pos => {
            const celdaObjetivo = tbodyTablero.rows[pos.fila].cells[pos.col];
            const nuevoCuadrito = imgsParaClonar[pos.indiceCuerpo].cloneNode(true);

            nuevoCuadrito.id = naveSeleccionadaId;
            nuevoCuadrito.style.width = "100%";
            nuevoCuadrito.style.height = "100%";
            nuevoCuadrito.style.display = "block";

            // Aplicar la rotación
            nuevoCuadrito.style.transform = `rotate(${gradosCss}deg)`;

            celdaObjetivo.appendChild(nuevoCuadrito);
            celdaObjetivo.classList.add("celda-seleccionada");
        });

        naveDireccion = nuevaDireccion;

        console.log(`[Rotación] Éxito. Nave ${naveSeleccionadaId} ahora apunta hacia la ${naveDireccion}.`);
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


    function gestionarTurnoDeAtaque() {
        btnEnviar.classList.add("invisible");
        divMovimientos.classList.add("invisible");
        divContenedor.classList.add("invisible");
        tableroDefensa.style.display = "table";

        document.removeEventListener("dragstart", dragStart)
        tbodyTablero.removeEventListener("dragover", dragOver);
        tbodyTablero.removeEventListener("drop", drop);

        tbodyTablero.querySelectorAll(".celda-seleccionada").forEach(celda => {
            celda.classList.remove("celda-seleccionada");
        });


        if (TableJugador) {
            TableJugador.addEventListener('click', function (event) {
                const celda = event.target;

                if (celda.tagName === 'TD') {
                    if (battleship.TurnoId !== idUsuario) {
                        console.warn("No es tu turno de atacar.");
                        return;
                    }

                    const fila = celda.parentElement.sectionRowIndex;
                    const columna = celda.cellIndex;

                    if (celda.dataset.marcado === "true") {
                        console.log("Esta casilla ya fue atacada.");
                        return;
                    }

                    enviarAtaqueAlServidor(fila, columna, celda);
                }
            });
        }
    }



    function cargarDefensaServidor(navesList) {
        const tbodyDefensa = document.querySelector("#tablaDefensa tbody");
        if (!tbodyDefensa) return;

        const celdas = tbodyDefensa.querySelectorAll("td");
        celdas.forEach(celda => {
            celda.innerHTML = "";
            celda.removeAttribute("data-id-nave");
        });

        //No entiendo por qué no se puede usar in indice regular, se reinicia en cada ciclo
        //:c
        let contadoresPorNave = {};
        console.log(navesList);

        navesList.forEach(nave => {
            const idActual = nave.IdNave;
            let fragmentosOrigen = tbodyTablero.querySelectorAll(`img[id="${idActual}"]`);

            if (fragmentosOrigen.length === 0) {
                const contenedorOriginal = document.querySelector(`#contenedor > div[id="${idActual}"]`);
                fragmentosOrigen = contenedorOriginal.querySelectorAll("img");
            }

            if (contadoresPorNave[idActual] === undefined) {
                contadoresPorNave[idActual] = 0;
            }

            let fragmentos = Array.from(fragmentosOrigen).reverse();

            let grados = 0;
            if (nave.Direccion === "izquierda") grados = 0;
            if (nave.Direccion === "arriba") grados = 90;
            if (nave.Direccion === "derecha") grados = 180;
            if (nave.Direccion === "abajo") grados = 270;

            nave.Coordenadas.forEach((coord) => {
                const fila = coord.Fila;
                const columna = coord.Columna;

                if (tbodyDefensa.rows[fila] && tbodyDefensa.rows[fila].cells[columna]) {
                    const celda = tbodyDefensa.rows[fila].cells[columna];
                    const imgBarco = document.createElement("img");

                    // Sacar el índice acumulado real para esta nave
                    let iReal = contadoresPorNave[idActual];

                    if (fragmentos[iReal]) {
                        imgBarco.src = fragmentos[iReal].src;
                        imgBarco.style.transform = `rotate(${grados}deg)`;
                    }

                    imgBarco.style.width = "100%";
                    imgBarco.style.height = "100%";
                    imgBarco.style.display = "block";
                    imgBarco.style.objectFit = "cover";

                    celda.appendChild(imgBarco);
                    celda.dataset.idNave = idActual;

                    contadoresPorNave[idActual]++;
                }
            });
        });
        if (tbodyTablero) {
            const barcosArrastrados = tbodyTablero.querySelectorAll("img");
            barcosArrastrados.forEach(img => img.remove());
        }
        console.log("Flota renderizada.");
    }


    async function enviarAtaqueAlServidor(fila, columna, celda) {
        // Marcamos la celda localmente para evitar doble clic rápido antes de recibir la respuesta
        celda.dataset.marcado = "true";

        let ataqueDTO = {
            IdSala: idSala,
            IdJugador: idUsuario,
            Posicion: { Fila: fila, Columna: columna }
        };

        try {
            let response = await fetch("/battleship/procesar-ataque", {
                method: "POST",
                body: JSON.stringify(ataqueDTO),
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                console.log("Disparo enviado con éxito. Esperando sincronización...");
            } else {
                console.error("El servidor rechazó el disparo.");
                celda.removeAttribute("data-marcado");
            }
        } catch (error) {
            console.error("Error de red al enviar el ataque:", error);
            celda.removeAttribute("data-marcado");
        }
    }




    async function recibirAtaque(bship) {
        spanTurno.textContent = bship.Turno;
        const soyJugador1 = (bship.NavesRestantesJ1 && bship.NavesRestantesJ1.length > 0);

        const CuadriculaDefensa = soyJugador1 ? bship.CuadriculaJ1 : bship.CuadriculaJ2;
        const cuadrículaAtaque = soyJugador1 ? bship.CuadriculaJ2 : bship.CuadriculaJ1;

        // 1. Actualizar el tablero de ATAQUE
        if (cuadrículaAtaque) {
            cuadrículaAtaque.forEach(casilla => {
                const f = casilla.Posicion.Fila;
                const c = casilla.Posicion.Columna;
                const td = TableJugador.querySelector(`tbody tr:nth-child(${f + 1}) td:nth-child(${c + 1})`);

                if (td) {
                    const img = document.createElement("img");
                    img.classList.add("efecto-ataque");


                    if (casilla.Estado === 2) { img.src = "/battleship/Resources/Images/hitstar1.gif"; td.dataset.marcado = "true"; } // AtaqueFallido
                    if (casilla.Estado === 3) { img.src = "/battleship/Resources/Images/hitstar1.gif"; td.dataset.marcado = "true"; } // AtaqueAcertado
                    if (casilla.Estado === 4) { img.src = "/battleship/Resources/Images/hitstar1.gif"; td.dataset.marcado = "true"; } // NaveHundida

                    if (casilla.Estado === 2 || casilla.Estado === 3 || casilla.Estado === 4) {
                        td.innerHTML = "";
                        td.appendChild(img);
                    }
                }
            });
        }

        if (CuadriculaDefensa) {
            CuadriculaDefensa.forEach(casilla => {

                const f = casilla.Posicion.Fila;
                const c = casilla.Posicion.Columna;
                const td = tableroDefensa.querySelector(`tbody tr:nth-child(${f + 1}) td:nth-child(${c + 1})`);

                if (td) {
                    const efectoViejo = td.querySelector(".efecto-ataque");
                    const img = document.createElement("img");
                    img.classList.add("efecto-ataque");
                    if (casilla.Estado === 2) { if (efectoViejo) efectoViejo.remove(); img.src = "/battleship/Resources/Images/hitstar1.gif"; }
                    if (casilla.Estado === 3) { if (efectoViejo) efectoViejo.remove(); img.src = "/battleship/Resources/Images/hitstar1.gif"; }
                    if (casilla.Estado === 4) { if (efectoViejo) efectoViejo.remove(); img.src = "/battleship/Resources/Images/hitstar1.gif"; }

                    if (casilla.Estado === 2 || casilla.Estado === 3 || casilla.Estado === 4) {
                        td.appendChild(img);
                    }
                }
            });
        }

        battleship = bship;
    }



    //Etapa finalizar ///////////////////////////////////////////////////////////////////////////

    function mostrarPantallaResultados(bship) {
        divResultados.classList.remove("invisible");
        fondo.classList.remove("invisible");
        txtGanador.textContent = bship.Ganador;
        txtNumSalaResultados.textContent = "sala # " + numSala;
        txtRevancha.textContent = "";

    }

    function actualizarRechancha(bship) {
        if (bship.Revancha == 0) {
            txtRevancha.textContent = "";
        }
        if (bship.Revancha == 1) {
            txtRevancha.textContent = "Esperando revancha";
        }
        if (bship.Revancha == 2) {
            txtRevancha.textContent = "Reiniciando partida.";
            btnReiniciar.disabled = true;
        }
    }




    let votoRevancha = false;

    btnReiniciar.addEventListener('click', MandarRevancha);
    async function MandarRevancha() {
        votoRevancha = !votoRevancha;

        if (votoRevancha) {
            btnReiniciar.textContent = "Cancelar";
        } else {
            btnReiniciar.textContent = "Volver a jugar";
        }
        try {
            await fetch("/battleship/votar-revancha", {
                method: "POST",
                body: JSON.stringify({
                    IdSala: idSala,
                    IdUsuario: idUsuario,
                    Revancha: votoRevancha
                }),
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            console.error("Error al procesar revancha:", error);
        }
    };


    btnSalir.addEventListener('click', function () {
        window.location.href = "/battleship/";
        return;
    });







    function prepararNuevoJuego() {
        tableroEnviado = false;
        defensaRenderizada = false;
        resultadoMostrado = false;
        votoRevancha = false;
        naveSeleccionadaId = null;
        naveSeleccionadaFila = null;
        naveSeleccionadaCol = null;
        naveDireccion = "derecha";
        btnReiniciar.textContent = "Volver a jugar";
        btnReiniciar.disabled = false;

        divResultados.classList.add("invisible");
        fondo.classList.add("invisible");

        divMovimientos.classList.remove("invisible");
        divContenedor.classList.remove("invisible");
        btnEnviar.classList.remove("invisible");
        btnEnviar.disabled = false;

        tableroDefensa.style.display = "none";

        reiniciarTablero();

        document.addEventListener("dragstart", dragStart);
        if (tbodyTablero) {
            tbodyTablero.addEventListener("dragover", dragOver);
            tbodyTablero.addEventListener("drop", drop);
        }

        document.querySelectorAll(".contenedor-nave").forEach(barco => {
            barco.style.display = "flex";
            barco.setAttribute("draggable", "true");
        });
    }


    //Hacer un clear de la tabla //
    function reiniciarTablero() {
        const tbodyAtaque = document.querySelector("#tablaJugador tbody");
        const tbodyDefensa = document.querySelector("#tablaDefensa tbody");

        if (tbodyAtaque) tbodyAtaque.innerHTML = "";
        if (tbodyDefensa) tbodyDefensa.innerHTML = "";

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
    }




});