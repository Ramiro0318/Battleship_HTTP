using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;

namespace Battleship_HTTP.Services
{
    public class SalasService
    {

        Salas Salas = new Salas();
        Random r = new();
        public Sala SolicitarSala(string idJ, string nombreJ)
        {
            var salaDisponible = Salas.SalasList.Find(x => x.Publica && x.IdJugador2 == null);

            if (salaDisponible == null)
            {

                Sala sala = new Sala()
                {

                    Id = Salas.SalasList.Count == 0 ? 1 : Salas.SalasList.Max(x => x.Id) + 1,
                    IdHash = r.Next(10000, 100000).ToString(),
                    IdJugador1 = idJ,
                    NombreJugador1 = nombreJ,
                    ListoJugador1 = false,
                    JugadoresListos = 0,
                    Publica = true,
                    Activa = false

                };

                Salas.SalasList.Add(sala);
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


        public Sala? ActualizarSala(string numSala, string id, bool listo)
        {
            var sala = Salas.SalasList.Find(x => x.IdHash == numSala);

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
            sala.JugadoresListos = (byte)listos;

            if (listos == 2)
            {
                sala.Activa = true;
            }
            return sala;
        }

        public Sala? BuscarSala(string numSala)
        {
            Sala? sala = null;
            lock (Salas.SalasList)
            {
                sala = Salas.SalasList.Find(x => x.IdHash == numSala);
            }
            return sala;
        }



    }
}
