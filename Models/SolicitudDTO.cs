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
        public bool Listo { set; get; }
    }
}
