using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class Nave
    {
        public int IdNave { get; set; }
        public int Longitud { get; set; }
        public int SectoresRestantes { get; set; }

        public List<Coordenada>? Coordenadas { get; set; }
        //public string Direccion { get; set; } = "izquierda";
    }

}
