using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Documents;

namespace Battleship_HTTP.Models
{
    public class Sala
    {
        public int Id { get; set; }
        public string? IdHash { get; set; }

        public string? IdJugador1 { set; get; }
        public string? NombreJugador1 { set; get; }
        public bool ListoJugador1 { get; set; }

        public string? IdJugador2 { set; get; }
        public string? NombreJugador2 { set; get; }
        public bool ListoJugador2 { get; set; } = false;
        public byte JugadoresListos { set; get; }
        public bool Publica { get; set; }

        public bool Llena => IdJugador1 != null && IdJugador2 != null;

        public bool Activa { set; get; }
    }
}
