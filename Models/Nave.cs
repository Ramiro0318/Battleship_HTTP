using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class Nave
    {
        public int Longitud { get; set; }
        public int SectorsRestantes { get; set; }

        public List<Coordenada>? Coordenadas { get; set; }
    }

    public struct Coordenada
    {
        public int Fila { get; set; }
        public int Columna { get; set; }

        public Coordenada(int fila, int columna)
        {
            Fila = fila;
            Columna = columna;
        }
    }
}
