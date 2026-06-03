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
        private Dictionary<int, System.Timers.Timer> timersPorSala = new();
        Random r = new();

        public List<Nave> NavesElegir = new List<Nave>(){
            new Nave {IdNave = 1, Longitud = 2, SectoresRestantes = 2, Coordenadas = new List<Coordenada>(), Direccion = ""},   //PATRULLERO    //destroyer
            new Nave {IdNave = 2, Longitud = 3, SectoresRestantes = 3, Coordenadas = new List<Coordenada>(), Direccion = ""},   //SUBMARINO     //submarine
            new Nave {IdNave = 3, Longitud = 3, SectoresRestantes = 3, Coordenadas = new List<Coordenada>(), Direccion = ""},   //DESTRUCTOR    //cruiser
            new Nave {IdNave = 4, Longitud = 4, SectoresRestantes = 4, Coordenadas = new List<Coordenada>(), Direccion = ""},   //ACORAZADO     //battleship
            new Nave {IdNave = 5, Longitud = 5, SectoresRestantes = 5, Coordenadas = new List<Coordenada>(), Direccion = ""},   //PORTAAVIONES  //carrier
        };
        public void InicializarNuevaPartida(Sala sala)
        {
            sala.battleship = new Battleship
            {
                Etapa = Etapa.ColocarBarcos,
                TiempoRestante = 60
            };

            DetenerTimerSala(sala.Id);
            var timer = new System.Timers.Timer(1000);
            timer.AutoReset = true;

            timer.Elapsed += (sender, e) =>
            {
                TimerPartidaElapsed(sala);
            };

            timersPorSala[sala.Id] = timer;
            timer.Start();
        }

        private void TimerPartidaElapsed(Sala sala)
        {
            var bship = sala.battleship;
            if (bship == null) return;

            if (bship.TiempoRestante > 0)
            {
                bship.TiempoRestante--;
            }
            else if (bship.TiempoRestante == 0)
            {
                if (bship.Etapa == Etapa.Batalla)
                {
                    if (bship.TurnoId == sala.IdJugador1)
                    {
                        bship.TurnoId = sala.IdJugador2;
                        bship.Turno = sala.NombreJugador2;
                    }
                    else
                    {
                        bship.TurnoId = sala.IdJugador1;
                        bship.Turno = sala.NombreJugador1;
                    }

                    bship.TiempoRestante = 30;
                    bship.NumeroDisparos++;
                }
                else if (bship.Etapa == Etapa.Terminado)
                {
                    DetenerTimerSala(sala.Id);
                }
            }
        }

        public void DetenerTimerSala(int idSala)
        {
            if (timersPorSala.TryGetValue(idSala, out var timer))
            {
                timer.Stop();
                timer.Dispose();
                timersPorSala.Remove(idSala);
            }
        }

        public void DetenerTodosLosTimers()
        {
            foreach (var timer in timersPorSala.Values.ToList())
            {
                timer.Stop();
                timer.Dispose();
            }

            timersPorSala.Clear();
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
                    Coordenadas = new List<Coordenada>(),
                    Direccion = naveDto.Direccion ?? ""
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
                bship.TurnoId = r.Next(0, 2) == 0 ? sala.IdJugador1 : sala.IdJugador2;
                bship.Turno = bship.TurnoId == sala.IdJugador1 ? sala.NombreJugador1 : sala.NombreJugador2;
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
                    var direccion = "";
                    switch (direccionActual)
                    {
                        case 0: cambioFila = -1; direccion = "arriba"; break;
                        case 1: cambioColumna = 1; direccion = "derecha"; break;
                        case 2: cambioFila = 1; direccion = "abajo"; break;
                        case 3: cambioColumna = -1; direccion = "izquierda"; break;
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

                        trayectoTentativo.Insert(0, new Coordenada(f, c));
                    }

                    //Cabe y no choca
                    if (!chocaConOtroBarco)
                    {
                        Nave nuevaNave = new Nave()
                        {
                            IdNave = seleccionada.IdNave,
                            Longitud = seleccionada.Longitud,
                            SectoresRestantes = seleccionada.SectoresRestantes,
                            Coordenadas = trayectoTentativo,
                            Direccion = direccion
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


        public Sala? ProcesarAtaque(Sala sala, AtaqueDTO ataqueDto)
        {
            var bship = sala.battleship;

            if (bship == null || ataqueDto == null || bship.Etapa != Etapa.Batalla)
            {
                return null;
            }

            // Tomamr la coordenada del disparo
            var coordenadaDisparo = ataqueDto.Posicion;

            bool J1Atacando = sala.IdJugador1 == ataqueDto.IdJugador ? true : false;
            string? nombreAtacante = J1Atacando ? sala.NombreJugador1 : sala.NombreJugador2;

            if (bship.Turno != nombreAtacante) { return null; }

            //Elegir si atacar al jugador 1 o 2
            //tablero y lista de naves
            var cuadriculaDefensor = J1Atacando ? bship.CuadriculaJ2 : bship.CuadriculaJ1;
            var navesDefensor = J1Atacando ? bship.NavesRestantesJ2 : bship.NavesRestantesJ1;
            var casillaImpactada = cuadriculaDefensor.FirstOrDefault(x => x.Posicion.Fila == coordenadaDisparo.Fila && x.Posicion.Columna == coordenadaDisparo.Columna);

            if (casillaImpactada == null || (casillaImpactada.Estado != EstadoCasilla.Agua && casillaImpactada.Estado != EstadoCasilla.Nave)) return null;



            if (casillaImpactada.Estado == EstadoCasilla.Agua)
            {
                casillaImpactada.Estado = EstadoCasilla.AtaqueFallido;
                bship.TurnoId = J1Atacando ? sala.IdJugador2 : sala.IdJugador1;
                bship.Turno = J1Atacando ? sala.NombreJugador2 : sala.NombreJugador1;
            }
            else if (casillaImpactada.Estado == EstadoCasilla.Nave)
            {
                casillaImpactada.Estado = EstadoCasilla.AtaqueAcertado;
                bship.TurnoId = J1Atacando ? sala.IdJugador1 : sala.IdJugador2;
                bship.Turno = J1Atacando ? sala.NombreJugador1 : sala.NombreJugador2;


                // Buscar qué nave específica del defensor ocupaba esa coordenada para restarle un sector
                var naveGolpeada = navesDefensor.FirstOrDefault(x => x.Coordenadas != null && x.Coordenadas
                    .Any(c => c.Fila == coordenadaDisparo.Fila && c.Columna == coordenadaDisparo.Columna));

                if (naveGolpeada != null)
                {
                    naveGolpeada.SectoresRestantes--;

                    // actualizar todo a Hundida
                    if (naveGolpeada.SectoresRestantes == 0)
                    {
                        foreach (var coord in naveGolpeada.Coordenadas ?? new())
                        {
                            var casillaHundida = cuadriculaDefensor.FirstOrDefault(x => x.Posicion.Fila == coord.Fila && x.Posicion.Columna == coord.Columna);

                            if (casillaHundida != null)
                            {
                                casillaHundida.Estado = EstadoCasilla.NaveHundida;
                            }
                        }
                    }
                }
            }

            bship.NumeroDisparos++;

            // Verificar si todas las naves han sido destruidas
            if (navesDefensor.All(nave => nave.SectoresRestantes <= 0))
            {
                bship.Etapa = Etapa.Terminado;
                bship.Ganador = nombreAtacante;
                bship.Turno = null;
                DetenerTimerSala(sala.Id);
            }
            else
            {
                bship.TiempoRestante = 30;
            }

            return sala;
        }
    }
}
