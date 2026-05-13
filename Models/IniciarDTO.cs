using System;
using System.Collections.Generic;
using System.Text;

namespace Battleship_HTTP.Models
{
    public class IniciarDTO
    {
        public int Id { get; set; }
        public string Nombre { set; get; } = null!;

        public bool Listo { set; get; }
    }
}
