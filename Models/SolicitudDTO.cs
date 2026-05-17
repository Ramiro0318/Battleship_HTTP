using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class SolicitudDTO
    {
        public string Id { get; set; } = null!;
        public string Nombre { set; get; } = null!;
        public string? NumSala { set; get; }
        public bool? Publica { set; get; }
    }

    public class SolicitudActualizacionDTO
    {
        public string NumSala { set; get; } = null!;
        public string Id { set; get; } = null!;
        public bool Listo { set; get; }

    }

    public class SolicitudCambioDTO
    {
        public string NumSala { set; get; } = null!;
        public int Listos { set; get; }

    }

    public class SolicitudMonitoreoPartidaDTO
    {
        public string IdSala { get; set; } = "";
        public int TiempoCliente { get; set; }
        public int EtapaCliente { get; set; }
        public string TurnoCliente { get; set; } = "";
        public bool FinalizadoCliente { get; set; }

    }
}
