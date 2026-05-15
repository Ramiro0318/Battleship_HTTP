document.addEventListener('DOMContentLoaded', function () {
    const divIngreso = document.querySelector("#ingreso");
    const divSeleccionar = document.querySelector("#seleccion");
    const divSala = document.querySelector("#sala");
    const divEspera = document.querySelector("#espera");

    const btnRegistrarNombre = document.querySelector("#ingresarNombre");
    const btnMatchmaking = document.querySelector("#matchmaking");
    const btnCrear = document.querySelector("#crearSala");
    const btnUnirse = document.querySelector("#unirseSala");

    
    const divInstrucciones = document.querySelector("#instrucciones");
    const divResultados = document.querySelector("#resultados");
    const bIdSala = document.querySelector("#idSala");
    const spanTurno = document.querySelector("#turno");
    const spanTiempo = document.querySelector("#tiempoRestante");
    const TableJugador = document.querySelector("#tablaJugador");
    const divMovimientos = document.querySelector("#movmimiento");
    const divContenedor = document.querySelector("#contenedor");


    const btnOk = document.querySelector("#ok");
    const btnsIniciar = document.querySelectorAll(".iniciar");
    const btnSalir = document.querySelector("#salir");

    const tablero = document.querySelector('#tablaJugador');
    let nombre;


    if (true) {

    }

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
