using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Timers;
using System.Windows.Controls.Primitives;

namespace Battleship_HTTP.Services
{
    public class PartidaService
    {
        Sala Sala = new();
        System.Timers.Timer timer = new System.Timers.Timer(1000);

        public void InicializarNuevaPartida(Sala sala)
        {
            sala.battleship = new Battleship
            {
                Turno = sala.NombreJugador1,
                Etapa = Etapa.ColocarBarcos,
                TiempoRestante = 60
            };

            Sala = sala;
            timer.Elapsed += timer_Elapsed;
            timer.AutoReset = true;
            timer.Enabled = true;
        }

        private void timer_Elapsed(object? sender, ElapsedEventArgs e)
        {
            if (Sala.battleship != null)
            {
                if (Sala.battleship.TiempoRestante > 0)
                {

                    Sala.battleship.TiempoRestante--;
                }
                else if (Sala.battleship.TiempoRestante == 0)
                {
                    Sala.battleship.Etapa = Etapa.Batalla;
                    timer.Stop();
                }
            }
        }




        //        // ¿Queda alguna otra casilla del jugador 1 con la Nave 3 que siga en estado "Nave"?
        //        bool sigueVivoBarco = partida.CuadriculaJ1.Any(c => c.NaveId == 3 && c.Estado == EstadoCasilla.Nave);

        //if (!sigueVivoBarco)
        //{
        //    // ¡Hundido! Buscas todas las casillas con NaveId == 3 y las pasas a EstadoCasilla.NaveHundida
        //    foreach(var c in partida.CuadriculaJ1.Where(c => c.NaveId == 3))
        //    {
        //        c.Estado = EstadoCasilla.NaveHundida;
        //    }
        //}



        //Metodo provisional.
        //#region
        //private void EnviarBattleshipSanitizado(HttpListenerResponse response, Battleship partida, string idUsuarioSolicitante, Sala sala)
        //{
        //    // 1. Identificamos el rol de quien hace la petición HTTP
        //    bool esJugador1 = (idUsuarioSolicitante == sala.IdJugador1);

        //    // 2. Creamos copias limpias para el envío por red
        //    List<CudriculaTablero> cuadricula1ParaEnviar = new();
        //    List<CudriculaTablero> cuadricula2ParaEnviar = new();

        //    // Sanitizar Tablero del J1
        //    foreach (var casilla in partida.CuadriculaJ1)
        //    {
        //        // Si hay una nave pero pregunta el J2 (el rival), se le enmascara como Agua
        //        if (casilla.Estado == EstadoCasilla.Nave && !esJugador1)
        //        {
        //            cuadricula1ParaEnviar.Add(new CudriculaTablero(casilla.Posicion, EstadoCasilla.Agua));
        //        }
        //        else
        //        {
        //            cuadricula1ParaEnviar.Add(casilla); // Pasa intacto (Agua, AtaqueFallido, AtaqueAcertado, NaveHundida, o es su propio mapa)
        //        }
        //    }

        //    // Sanitizar Tablero del J2
        //    foreach (var casilla in partida.CuadriculaJ2)
        //    {
        //        // Si hay una nave pero pregunta el J1 (el rival), se le enmascara como Agua
        //        if (casilla.Estado == EstadoCasilla.Nave && esJugador1)
        //        {
        //            cuadricula2ParaEnviar.Add(new CudriculaTablero(casilla.Posicion, EstadoCasilla.Agua));
        //        }
        //        else
        //        {
        //            cuadricula2ParaEnviar.Add(casilla);
        //        }
        //    }

        //    // 3. Empaquetamos el objeto seguro (Respetando tu Opción A + Opción B)
        //    var partidaSegura = new
        //    {
        //        Turno = partida.Turno,
        //        Ganador = partida.Ganador,
        //        Finalizado = partida.Finalizado,
        //        TiempoRestante = partida.TiempoRestante,
        //        Etapa = partida.Etapa,
        //        CuadriculaJ1 = cuadricula1ParaEnviar,
        //        CuadriculaJ2 = cuadricula2ParaEnviar,

        //        // ¡Aquí está tu decisión! Las naves del rival van estrictamente nulas, las tuyas se envían si las ocupas
        //        NavesRestantesJ1 = esJugador1 ? partida.NavesRestantesJ1 : null,
        //        NavesRestantesJ2 = !esJugador1 ? partida.NavesRestantesJ2 : null
        //    };

        //    // 4. Despachamos los bytes por HTTP
        //    var json = JsonSerializer.Serialize(partidaSegura);
        //    byte[] buffer = Encoding.UTF8.GetBytes(json);

        //    response.ContentLength64 = buffer.Length;
        //    response.ContentType = "application/json";
        //    response.StatusCode = 200;
        //    response.OutputStream.Write(buffer, 0, buffer.Length);
        //    response.OutputStream.Close(); // Cerramos el stream para liberar el hilo de red
        //}
        //#endregion
    }
}
