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
                InicializarCuadriculasMatriz(sala);

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




        public void InicializarCuadriculasMatriz(Sala sala)
        {
            var bship = sala.battleship;
            if (bship == null) return;

            bship.CuadriculaJ1.Clear();
            bship.CuadriculaJ2.Clear();

            //LLenar de agua
            for (int f = 0; f < 10; f++)
            {
                for (int c = 0; c < 10; c++)
                {
                    bship.CuadriculaJ1.Add(new CuadriculaTablero(new Coordenada(f, c), EstadoCasilla.Agua));
                    bship.CuadriculaJ2.Add(new CuadriculaTablero(new Coordenada(f, c), EstadoCasilla.Agua));
                }
            }
            var cantidadNaves = bship.NavesRestantesJ1.Count;
            var primeraCoordenada = bship.NavesRestantesJ1.FirstOrDefault()?.Coordenadas?.FirstOrDefault();

            foreach (var nave in bship.NavesRestantesJ1)
            {
                foreach (var coord in nave.Coordenadas ?? new())
                {
                    var casilla = bship.CuadriculaJ1.FirstOrDefault(x => x.Posicion.Fila == coord.Fila && x.Posicion.Columna == coord.Columna);
                    if (casilla != null)
                    {
                        casilla.Estado = EstadoCasilla.Nave; // Estado 1
                    }
                }
            }

            foreach (var nave in bship.NavesRestantesJ2)
            {
                foreach (var coord in nave.Coordenadas ?? new())
                {
                    var casilla = bship.CuadriculaJ2.FirstOrDefault(x => x.Posicion.Fila == coord.Fila && x.Posicion.Columna == coord.Columna);
                    if (casilla != null)
                    {
                        casilla.Estado = EstadoCasilla.Nave;
                    }
                }
            }
        }
    }
}
