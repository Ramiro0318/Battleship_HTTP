using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.DirectoryServices.ActiveDirectory;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Security.Policy;
using System.Text;
using System.Windows.Documents;

namespace Battleship_HTTP.Services
{
    public class SalasService
    {

        public List<Sala> SalasList { get; set; } = new List<Sala>();

        Random r = new();
        private readonly PartidaService partidaService;

        public SalasService(PartidaService partidaService)
        {
            this.partidaService = partidaService;
        }

        public Sala SolicitarSala(string idJ, string nombreJ)
        {
            var salaDisponible = SalasList.Find(x => x.Publica && x.IdJugador2 == null);

            if (salaDisponible == null)
            {
                string idhash = "";

                do { idhash = r.Next(10000, 100000).ToString(); }
                while (SalasList.Any(x => x.IdHash == idhash));

                Sala sala = new Sala()
                {

                    Id = SalasList.Count == 0 ? 1 : SalasList.Max(x => x.Id) + 1,
                    IdHash = idhash,
                    IdJugador1 = idJ,
                    NombreJugador1 = nombreJ,
                    ListoJugador1 = false,
                    JugadoresListos = 0,
                    Publica = true,
                    Activa = false

                };

                SalasList.Add(sala);
                return sala;
            }
            else
            {
                salaDisponible.IdJugador2 = idJ;
                salaDisponible.NombreJugador2 = nombreJ;
                salaDisponible.JugadoresListos = (byte)(salaDisponible.ListoJugador1 == true ? 1 : 0);
                return salaDisponible;
            }
        }

        public Sala CrearSalaPrivada(string idJ, string nombreJ)
        {
            Sala sala = new Sala()
            {
                Id = SalasList.Count == 0 ? 1 : SalasList.Max(x => x.Id) + 1,
                IdHash = r.Next(10000, 100000).ToString(),
                IdJugador1 = idJ,
                NombreJugador1 = nombreJ,
                ListoJugador1 = false,
                JugadoresListos = 0,
                Publica = false,
                Activa = false
            };

            SalasList.Add(sala);
            return sala;
        }

        public Sala? UnirseSalaPrivada(string numS, string idJ, string nombreJ)
        {
            var salaUnirse = SalasList.Find(x => x.IdHash == numS && x.IdJugador2 == null);
            if (salaUnirse == null) return null;

            salaUnirse.IdJugador2 = idJ;
            salaUnirse.NombreJugador2 = nombreJ;
            salaUnirse.JugadoresListos = (byte)(salaUnirse.ListoJugador1 == true ? 1 : 0);

            return salaUnirse;
        }


        public Sala? ActualizarSala(string numSala, string id, bool listo)
        {
            var sala = SalasList.Find(x => x.IdHash == numSala);

            if (sala == null) return null;

            if (id == sala.IdJugador1)
            {
                sala.ListoJugador1 = listo;
            }
            else if (id == sala?.IdJugador2)
            {
                sala.ListoJugador2 = listo;
            }
            else return null;

            var listos = (sala.ListoJugador1 ? 1 : 0) + (sala.ListoJugador2 ? 1 : 0);
            sala.JugadoresListos = listos;

            if (listos == 2)
            {
                Task.Run(async () =>
                {
                    await Task.Delay(3000);

                    lock (SalasList)
                    {
                        partidaService.InicializarNuevaPartida(sala);
                        sala.Activa = true;
                        sala.ListoJugador1 = false;
                        sala.ListoJugador2 = false;
                        sala.JugadoresListos = 0;
                    }
                });
            }

            return sala;
        }


        public bool CancelarSala(Sala sala, string idJugador)
        {
            lock (SalasList)
            {
                if (sala == null) return false;

                if (idJugador == sala.IdJugador1)
                {
                    if (sala.IdJugador2 != null)
                    {
                        // 🔄 PROMOVER: Pasamos al Jugador 2 al puesto del Jugador 1
                        sala.IdJugador1 = sala.IdJugador2;
                        sala.NombreJugador1 = sala.NombreJugador2;
                        sala.ListoJugador1 = sala.ListoJugador2;

                        // Vaciamos el espacio del Jugador 2 para que quede libre para futuros emparejamientos
                        sala.IdJugador2 = null;
                        sala.NombreJugador2 = null;
                        sala.ListoJugador2 = false;
                    }
                    else
                    {
                        // Si no había Jugador 2, la sala se quedó totalmente vacía. La eliminamos.
                        SalasList.Remove(sala);
                        return true;
                    }
                }
                // CASO 2: El jugador que se sale es el Jugador 2
                else if (idJugador == sala.IdJugador2)
                {
                    // Vaciamos su espacio. Al quedar en null, 'SolicitarSala' la detectará de nuevo como disponible
                    sala.IdJugador2 = null;
                    sala.NombreJugador2 = null;
                    sala.ListoJugador2 = false;
                }

                sala.JugadoresListos = (sala.ListoJugador1 ? 1 : 0) + (sala.ListoJugador2 ? 1 : 0);

                return true;
            }
        }


        public Sala? BuscarSala(string numSala)
        {
            Sala? sala = null;
            lock (SalasList)
            {
                sala = SalasList.Find(x => x.IdHash == numSala);
            }
            return sala;
        }

        public Sala? BuscarSalaId(string id)
        {
            Sala? sala = null;
            lock (SalasList)
            {
                sala = SalasList.Find(x => x.Id == int.Parse(id));
            }
            return sala;
        }


        public Sala? RegistrarVotoRevancha(Sala sala, string idUsuario, bool revancha)
        {
            if (sala == null || sala.battleship == null) return null;

            lock (sala.battleship)
            {
                if (idUsuario == sala.IdJugador1)
                {
                    sala.battleship.RevanchaJ1 = revancha;
                }
                else if (idUsuario == sala.IdJugador2)
                {
                    sala.battleship.RevanchaJ2 = revancha;
                }

                if (sala.battleship.RevanchaJ1 && sala.battleship.RevanchaJ2)
                {
                    Task.Run(async () =>
                    {
                        await Task.Delay(3000);

                        lock (SalasList)
                        {
                            if (sala.battleship.RevanchaJ1 && sala.battleship.RevanchaJ2)
                            {
                                partidaService.InicializarNuevaPartida(sala);
                                sala.battleship.RevanchaJ1 = false;
                                sala.battleship.RevanchaJ2 = false;
                                sala.Activa = true;
                            }
                        }
                    });
                }
            }
            return sala;
        }

    }
}
