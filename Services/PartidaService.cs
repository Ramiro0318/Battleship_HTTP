using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
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
        Random r = new();

        public List<Nave> NavesElegir = new List<Nave>(){
            new Nave {IdNave = 1, Longitud = 1, SectoresRestantes = 1, Coordenadas = new List<Coordenada>()},   //PATRULLERO 
            new Nave {IdNave = 2, Longitud = 1, SectoresRestantes = 1, Coordenadas = new List<Coordenada>()},   //SUBMARINO  
            new Nave {IdNave = 3, Longitud = 1, SectoresRestantes = 1, Coordenadas = new List<Coordenada>()},   //DESTRUCTOR
            new Nave {IdNave = 4, Longitud = 1, SectoresRestantes = 1, Coordenadas = new List<Coordenada>()},   //ACORAZADO
            new Nave {IdNave = 5, Longitud = 1, SectoresRestantes = 1, Coordenadas = new List<Coordenada>()},   //PORTAAVIONES
        };
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
                    //Sala.battleship.Etapa = Etapa.Batalla;
                    timer.Stop();
                }
            }
        }


        public void RegistrarTableroJugador(Sala sala, string idUsuario, List<NaveColocadaDTO> navesColocadas)
        {
            var bship = sala.battleship;
            if (bship == null) return;

            var ListaNaves = (sala.IdJugador1 == idUsuario) ? bship.NavesRestantesJ1 : bship.NavesRestantesJ2;
            //var ListaNaves = (partida.IdJugador1 == idUsuario) ? partida.battleship.CuadriculaJ1 : partida.battleship.CuadriculaJ2;

            if (ListaNaves == null) return;

            ListaNaves.Clear();

            foreach (var naveDto in navesColocadas)
            {
                var seleccionada = NavesElegir.First(x => x.IdNave == naveDto.IdNave);
                Nave nuevaNave = new Nave()
                {
                    IdNave = seleccionada.IdNave,
                    Longitud = seleccionada.Longitud,
                    SectoresRestantes = seleccionada.SectoresRestantes,
                    Coordenadas = new List<Coordenada>()
                };

                foreach (var coordenada in naveDto.Coordenadas ?? new())
                {
                    nuevaNave.Coordenadas.Add(new Coordenada
                    {
                        Fila = coordenada.Fila,
                        Columna = coordenada.Columna
                    });
                }

                ListaNaves.Add(nuevaNave);
                // Guardamos la nave en el tablero del servidor
                //tablero.Naves.Add(nuevaNave);
            }

            //Si se le acabó el tiempo
            if (ListaNaves.Count < 5)
            {
                RellenarNavesAleatorias(ListaNaves);
            }
            if (bship.NavesRestantesJ1.Count > 0 && bship.NavesRestantesJ2.Count > 0)
            {
                bship.Etapa = Etapa.Batalla;
                bship.TiempoRestante = 30;
                bship.Turno = r.Next(0, 2) == 0 ? sala.NombreJugador1 : sala.NombreJugador2;
            }
        }


        public void RellenarNavesAleatorias(List<Nave> ListaNaves)
        {
            var idsNoUsados = Enumerable.Range(1, 5).Where(id => !ListaNaves.Any(nave => nave.IdNave == id)).ToList();
            int maxTablero = 10;

            while (ListaNaves.Count < 5 && idsNoUsados.Count > 0)
            {
                var seleccionada = NavesElegir.First(x => x.IdNave == idsNoUsados.First());

                int inicioFila = r.Next(0, maxTablero);
                int inicioColumna = r.Next(0, maxTablero);
                int direccionInicial = r.Next(0, 4); // 0:Arriba, 1:Derecha, 2:Abajo, 3:Izquierda

                bool naveColocadaConExito = false;
                //Intentar todas las direcciones 
                for (int intento = 0; intento < 4; intento++)
                {
                    int direccionActual = (direccionInicial + intento) % 4;

                    int cambioFila = 0;
                    int cambioColumna = 0;

                    switch (direccionActual)
                    {
                        case 0: cambioFila = -1; break;
                        case 1: cambioColumna = 1; break;
                        case 2: cambioFila = 1; break;
                        case 3: cambioColumna = -1; break;
                    }

                    int filaFinal = inicioFila + (cambioFila * (seleccionada.Longitud - 1));
                    int columnaFinal = inicioColumna + (cambioColumna * (seleccionada.Longitud - 1));

                    if (filaFinal < 0 || filaFinal >= maxTablero || columnaFinal < 0 || columnaFinal >= maxTablero)
                    {
                        continue;
                    }


                    List<Coordenada> trayectoTentativo = new List<Coordenada>();
                    bool chocaConOtroBarco = false;

                    for (int i = 0; i < seleccionada.Longitud; i++)
                    {
                        int f = inicioFila + (cambioFila * i);
                        int c = inicioColumna + (cambioColumna * i);

                        // Preguntamos si ya hay un barco ocupando (f, c)
                        if (ListaNaves.Any(nave => nave.Coordenadas != null && nave.Coordenadas.Any(coord => coord.Fila == f && coord.Columna == c)))
                        {
                            chocaConOtroBarco = true;
                            break; //Rompe la validación de celdas
                        }

                        trayectoTentativo.Add(new Coordenada(f, c));
                    }

                    //Cabe y no choca
                    if (!chocaConOtroBarco)
                    {
                        Nave nuevaNave = new Nave()
                        {
                            IdNave = seleccionada.IdNave,
                            Longitud = seleccionada.Longitud,
                            SectoresRestantes = seleccionada.SectoresRestantes,
                            Coordenadas = trayectoTentativo
                        };

                        ListaNaves.Add(nuevaNave);
                        idsNoUsados.RemoveAt(0);
                        naveColocadaConExito = true;

                        break;
                    }
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
