using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class AtaqueDTO
    {
        public string IdSala { get; set; } = null!;
        public string IdJugador { get; set; } = null!;

        public Coordenada Posicion { get; set; }
    }
}
