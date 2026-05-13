using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class Battleship
    {
        public string? Turno { get; set; }
        public string? Ganador { get; set; }
        public bool Finalizado { get; set; }

        public string[,] CuadriculaJ1 { get; set; } = new string[10,10];
        public string[,] CuadriculaJ2 { get; set; } = new string[10,10];

        public List<Nave>? NavesRestantesJ1 { get; set; }
        public List<Nave>? NavesRestantesJ2 { get; set; }

    }


}
