
const tablero = document.querySelector('#tablaJugador');

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
