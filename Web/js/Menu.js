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
    const btnCancelarBuscar = document.querySelector(".cancelar_buscar");

    //Esperar jugador e iniciar partida
    const lblNumSala = document.querySelector("#lblNum");
    const ddJugador1 = document.querySelector("#Jugador1")
    const ddJugador2 = document.querySelector("#Jugador2")
    const divCountJugadores = document.querySelector(".contenedor_char")
    const smlCountJugadores = document.querySelector("#countJugadores")
    const divEspera = document.querySelector("#espera");
    const btnListo = document.querySelector(".listo");






    //variables
    let nombre, id, num;
    let ultimaPagina, paginaActual;


    nombre = localStorage.getItem("nombre") ?? "";
    id = localStorage.getItem("IdUsuario") ?? "";
    num = localStorage.getItem("numeroSala") ?? "";

    if (nombre !== "" && id !== "") {
        btnCerrarSesion.classList.remove("invisible");
        divIngreso.classList.add("invisible");
        divSeleccion.classList.remove("invisible");
        ultimaPagina = divIngreso;
        paginaActual = divSeleccion;
    }
    if (num !== "") {
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
    });


    btnCrear.addEventListener('click', () => {
        crearSala();
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

        let publica = num == "" ? true : false;

        let json = { Nombre: nombre, Id: id, NumSala: num, Listo: false, Publica: publica };

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

            if (num === "") {
                ultimaPagina = divSeleccion;
                divSeleccion.classList.add("invisible");
            } else {
                ultimaPagina = divSala;
                divSala.classList.add("invisible");
            }

            paginaActual = divEspera;
            divEspera.classList.remove("invisible");
        }
        else {
            let errorObj = await response.json();
            errorNumSala.textContent = errorObj.Info;
        }
    }


    async function crearSala() {
        nombre = localStorage.getItem("nombre");
        id = localStorage.getItem("IdUsuario");

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("IdUsuario", id);
        }

        let json = { Nombre: nombre, Id: id, NumSala: num, Listo: false, Publica: false }

        let response = await fetch("/battleship/crear-sala", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "content-type": "application/json"
            }
        });

        if (response.ok) {
            let salaCreada = await response.json();

            divSeleccion.classList.add("invisible");
            divEspera.classList.remove("invisible");
            ultimaPagina = divSeleccion;
            paginaActual = divEspera;

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
        else {
            alert("No se pudo crear la sala.")
        }
    }


    const btnsCancelar = document.querySelectorAll(".cancelar");

    btnsCancelar.forEach(btn => {
        btn.addEventListener("click", cancelar);
    });

    btnCancelarBuscar.addEventListener("click", () => {
        ultimaPagina.classList.remove("invisible");
        paginaActual.classList.add("invisible");
    });

    async function cancelar() {

        let json = { NumSala: num, Id: id };

        let response = await fetch("/battleship/cancelar", {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "content-type": "application/json"
            }
        });

        if (response.ok) {
            listo = false;
            btnListo.textContent = "Listo";

            ultimaPagina.classList.remove("invisible");
            paginaActual.classList.add("invisible");

            if (ultimaPagina === divSala) {
                paginaActual = divSala;
                ultimaPagina = divSeleccion;
            }
            else if (ultimaPagina === divSeleccion) {
                paginaActual = divSeleccion;
                ultimaPagina = divIngreso;
            }
        }
    }


    function actualizarMenu(sala) {
        console.log(sala);
        num = sala.IdHash;
        localStorage.setItem("numeroSala", sala.IdHash);
        localStorage.setItem("idSala", sala.Id);
        lblNumSala.textContent = `#${sala.IdHash}`;
        ddJugador1.textContent = sala.NombreJugador1;
        ddJugador2.textContent = sala.NombreJugador2;
        smlCountJugadores.textContent = `${sala.JugadoresListos}`;

        if (sala.JugadoresListos === 2) {
            btnListo.disabled = true;
            btnsCancelar.forEach(btn => btn.disabled = true);
            btnListo.textContent = "Iniciando...";

            while (divCountJugadores.firstChild) {
                divCountJugadores.removeChild(divCountJugadores.firstChild);
            }

            texto = "Iniciando...";
            [...texto].forEach((char, index) => {

                const small = document.createElement("small");
                small.classList.add("char");
                small.innerHTML = char === " " ? "&nbsp;" : char;
                small.style.animationDelay = `${index * 0.05}s`;

                divCountJugadores.appendChild(small);
            });
        }
        else {
            btnListo.disabled = false;
            btnsCancelar.forEach(btn => btn.disabled = false);
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
        else {
            if (response.status === 404) {
                console.warn("La sala dejó de existir o fue eliminada.");
            } else {
                console.error("Ocurrió un error inesperado en el servidor:", response.status);
            }
        }
    }

    function reconectar() { }

});
