using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public enum Etapa { ColocarBarcos, Batalla, Terminado };
    public enum EstadoCasilla { Agua, Nave, AtaqueFallido, AtaqueAcertado, NaveHundida }
    public class Battleship
    {
        public string? Turno { get; set; }
        public string? Ganador { get; set; }
        public bool Finalizado { get; set; }
        public int TiempoRestante { get; set; }
        public List<CuadriculaTablero> CuadriculaJ1 { get; set; } = new();
        public List<CuadriculaTablero> CuadriculaJ2 { get; set; } = new();

        public List<Nave>? NavesRestantesJ1 { get; set; }
        public List<Nave>? NavesRestantesJ2 { get; set; }
        public Etapa Etapa { get; set; } = Etapa.ColocarBarcos;

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

    public class CuadriculaTablero
    {
        public Coordenada Posicion { get; set; }
        public EstadoCasilla Estado { get; set; }

        public CuadriculaTablero(Coordenada posicion, EstadoCasilla estado)
        {
            Posicion = posicion;
            Estado = estado;
        }
    }
}
