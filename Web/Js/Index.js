document.addEventListener('DOMContentLoaded', function () {
    //INDEX
    //ingresarNombre
    const btnCerrarSesion = document.querySelector("#cerrarSesion");
    const menus = document.querySelectorAll(".menu");
    const divIngreso = document.querySelector("#ingreso");
    const txtnombre = document.getElementById("nombreUsuario");
    const btnRegistrarNombre = document.querySelector("#ingresarNombre");
    const errorUsuario = document.querySelector("#errorIngreso");

    //Seleccionar manera de conectarse
    const divSeleccion = document.querySelector("#seleccion");
    const btnMatchmaking = document.querySelector("#matchmaking");
    const btnCrear = document.querySelector("#crearSala");
    const btnUnirse = document.querySelector("#unirseSala");

    //Ingresar numero de sala
    const divSala = document.querySelector("#sala");
    const txtNumSala = document.querySelector("#numeroSala");
    const errorNumSala = document.querySelector("#errorNumSala");
    const btnBuscar = document.querySelector("#buscar");

    //Esperar jugador e iniciar partida
    const lblNumSala = document.querySelector("#lblNum");
    const ddJugador1 = document.querySelector("#Jugador1")
    const ddJugador2 = document.querySelector("#Jugador2")
    const smlCountJugadores = document.querySelector("#countJugadores")
    const divEspera = document.querySelector("#espera");
    const btnListo = document.querySelector(".listo");



    //PARTIDA
    const divInstrucciones = document.querySelector("#instrucciones");
    const divResultados = document.querySelector("#resultados");
    const bIdSala = document.querySelector("#idSala");
    const spanTurno = document.querySelector("#turno");
    const spanTiempo = document.querySelector("#tiempoRestante");
    const TableJugador = document.querySelector("#tablaJugador");
    const divMovimientos = document.querySelector("#movmimiento");
    const divContenedor = document.querySelector("#contenedor");

    const btnOk = document.querySelector("#ok");

    const tablero = document.querySelector('#tablaJugador');


    let nombre, id, num;
    let ultimaPagina, paginaActual;


    nombre = localStorage.getItem("nombre") ?? "";
    id = localStorage.getItem("nombre") ?? "";
    num = localStorage.getItem("numeroSala") ?? "";

    if (nombre !== "" && id !== null) {
        btnCerrarSesion.classList.remove("invisible");
        divIngreso.classList.add("invisible");
        divSeleccion.classList.remove("invisible");
        ultimaPagina = divIngreso;
        paginaActual = divSeleccion;
    }
    if (num !== "") {
        //Reconectar
        reconectar();
    }


    btnCerrarSesion.addEventListener('click', () => {
        //Enviar el cerrar sesion
        errorUsuario.textContent = "";
        localStorage.removeItem("nombre");
        menus.forEach(m => m.classList.add("invisible"));
        divIngreso.classList.remove("invisible");
        btnCerrarSesion.classList.add("invisible");
    });

    btnRegistrarNombre.addEventListener('click', (e) => {
        e.preventDefault();
        nombre = txtnombre.value;
        if (nombre === "") {
            errorUsuario.textContent = "Ingresa un nombre";
        } else if (nombre.length >= 24) {
            errorUsuario.textContent = "El nombre excede la longitud permitida.";
        }
        else {
            localStorage.setItem("nombre", nombre);
            btnCerrarSesion.classList.remove("invisible");
            divIngreso.classList.add("invisible");
            divSeleccion.classList.remove("invisible");
            errorUsuario.textContent = "";
            ultimaPagina = divIngreso;
            paginaActual = divSeleccion;
        }
    });

    //Botones de seleccion de metodo
    btnMatchmaking.addEventListener('click', () => {
        buscarSala();
        divSeleccion.classList.add("invisible");
        divEspera.classList.remove("invisible");
        ultimaPagina = divSeleccion;
        paginaActual = divEspera;
    });

    btnCrear.addEventListener('click', () => {
        crearSala();
        divSeleccion.classList.add("invisible");
        divEspera.classList.remove("invisible");
        ultimaPagina = divSeleccion;
        paginaActual = divEspera;
    });

    btnUnirse.addEventListener('click', () => {
        divSeleccion.classList.add("invisible");
        divSala.classList.remove("invisible");
        errorNumSala.textContent = "";
        ultimaPagina = divSeleccion;
        paginaActual = divSala;
    });


    btnBuscar.addEventListener('click', (e) => {
        e.preventDefault();
        num = txtNumSala.value;
        errorNumSala.textContent = "";
        if (num === "" || num.length > 5) {
            errorNumSala.textContent = "Ingresa un numero de sala válido";
        }
        else {
            
            buscarSala(num); //tal vez necesito una flag
        }
    });

    document.querySelectorAll(".cancelar").forEach(btn => {
        btn.addEventListener("click", () => {
            ultimaPagina.classList.remove("invisible");
            paginaActual.classList.add("invisible");
        });
    });

    let listo = false;
    btnListo.addEventListener('click', () => {
        listo = !listo;
        btnListo.textContent = listo ? "Cancelar" : "Listo";
        enviarListo();

    });

    async function buscarSala(num) {
        nombre = localStorage.getItem("nombre");
        id = localStorage.getItem("IdUsuario");

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("IdUsuario", id);
        }
        if (!num) num = "";

        let public = num == "" ? true : false;

        let json = { Nombre: nombre, Id: id, NumSala: num, Listo: false, Publica : public };

        let response = await fetch("/battleship/sala", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "content-type": "application/json"
            }
        });

        if (response.ok) {
            let salaCreada = await response.json();
            actualizarMenu(salaCreada);
            escucharCambios(salaCreada.IdHash, salaCreada.JugadoresListos);
            divSala.classList.add("invisible");
            divEspera.classList.remove("invisible");
        }
        else {
            let errorObj = await response.json();
            errorNumSala.textContent = errorObj.Info;
        }
    }

    async function crearSala()
    {
        nombre = localStorage.getItem("nombre");
        id = localStorage.getItem("IdUsuario");

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("IdUsuario", id);
        }
        
        let json = { Nombre: nombre, Id: id, NumSala: num, Listo: false, Publica: false  }

        let response = await fetch("/battleship/crear-sala", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "content-type": "application/json"
            }
        });

        if (response.ok) {
            let salaCreada = await response.json();
            actualizarMenu(salaCreada);
            escucharCambios(salaCreada.IdHash, salaCreada.JugadoresListos);
        }
    }

    async function enviarListo() {

        let json = { NumSala: num, Id: id, Listo: listo };

        let response = await fetch("/battleship/actualizada", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "content-type": "application/json"
            }
        });

        if (response.ok) {
            let salaActualizada = await response.json();
            actualizarMenu(salaActualizada);
        }
    }







    function actualizarMenu(sala) {
        console.log(sala);
        num = sala.IdHash;
        localStorage.setItem("numeroSala", sala.IdHash);
        lblNumSala.textContent = `#${sala.IdHash}`;
        ddJugador1.textContent = sala.NombreJugador1;
        ddJugador2.textContent = sala.NombreJugador2;
        smlCountJugadores.textContent = `${sala.JugadoresListos} de 2 jugadores listos...`;

        if (sala.JugadoresListos === 2) {
            btnListo.disabled = true;
            btnListo.textContent = "Iniciando...";
            smlCountJugadores.textContent = "Iniciando en 3 segundos...";
        }
    }

    async function escucharCambios(numSala, listos) {
        let json = { NumSala: numSala, JugadoresListos: listos };

        let response = await fetch("/battleship/escuchar-cambio", {
            method: "POST",
            body: JSON.stringify(json),
            headers: { "content-type": "application/json" }
        });

        if (response.ok) {
            let salaActualizada = await response.json();

            console.log(salaActualizada);

            actualizarMenu(salaActualizada);

            if (salaActualizada.Activa) {
                console.log("¡Ambos listos! La batalla comienza.");
                window.location.href = '/battleship/partida';
                

            } else {
                escucharCambios(numSala, salaActualizada.JugadoresListos);
            }
        }
    }

    function reconectar() { }






    /////////////////////////////////////////////////////////////
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
});
