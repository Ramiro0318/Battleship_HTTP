using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Security.Policy;
using System.Text;
using System.Text.Json;

namespace Battleship_HTTP.Services
{
    public class JuegoService
    {
        private bool encendido;
        private HttpListener servidor;

        public event Action<string>? MensajeError;
        public event Action<bool, string>? ToogleServidor;

        private readonly SalasService salasService;
        private readonly PartidaService partidaService;

        public JuegoService(SalasService salasService, PartidaService partidaService)
        {
            this.salasService = salasService;
            this.partidaService = partidaService;

            servidor = new HttpListener();
            string url = $"http://+:9090/battleship/";
            servidor.Prefixes.Add(url);
        }

        public void Iniciar()
        {
            encendido = true;
            servidor.Start();
            Thread mainThread = new Thread(Escuchar)
            {
                IsBackground = true,
            };
            mainThread.Start();
            ToogleServidor?.Invoke(encendido, "");
        }

        public async Task Detener()//Ahora es tarea asincrona
        {
            if (!encendido) return;

            encendido = false;

            try
            {
                string url = servidor.Prefixes.First(); //Obtiene la url
                using (HttpClient client = new HttpClient())
                {
                    await client.GetAsync(url);
                }
            }
            catch { }

            servidor.Stop();
            ToogleServidor?.Invoke(encendido, "ServidorDetenido");
        }

        public void Escuchar()
        {
            while (encendido)
            {
                try
                {
                    var context = servidor.GetContext();
                    if (!encendido)
                    {
                        context.Response.Close();//Cierra las peticiones cuando no se va apaga el servidor.
                        break;
                    }

                    Thread solicitud = new(() => ProcesarSolicitud(context))
                    {
                        IsBackground = true
                    };
                    solicitud.Start();
                }
                catch (Exception ex)
                {
                    if (encendido)
                    {
                        MensajeError?.Invoke($"{ex}");
                    }
                }
            }
        }

        public void ProcesarSolicitud(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;

            var url = request.RawUrl ?? "";
            try
            {
                if (request.HttpMethod == "GET" && url == "/battleship/")
                {
                    EntregarRecurso(response, "Index.html");
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/sala")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var SolicitudSala = JsonSerializer.Deserialize<SolicitudDTO>(json);

                    if (SolicitudSala == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {
                        if (SolicitudSala.NumSala == "" && SolicitudSala.Publica == true)//Mathcmaking
                        {
                            var sala = salasService.SolicitarSala(SolicitudSala.Id, SolicitudSala.Nombre);
                            //Enviar respuesta
                            EnviarSala(response, sala);
                        }
                        else if (SolicitudSala.NumSala != null) //Unirse a Sala
                        {
                            var sala = salasService.UnirseSalaPrivada(SolicitudSala.NumSala, SolicitudSala.Id, SolicitudSala.Nombre);
                            //Enviar respuesta
                            if (sala == null)
                            {
                                EnviarInfo(response, "El numero de sala no es correcto", 404); //O está llena
                            }
                            else
                            {
                                EnviarSala(response, sala);
                            }
                        }
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/crear-sala")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var SolicitudCrear = JsonSerializer.Deserialize<SolicitudDTO>(json);

                    if (SolicitudCrear == null)
                    {
                        response.StatusCode = 400;
                    }
                    else //Crear sala privada
                    {
                        var sala = salasService.CrearSalaPrivada(SolicitudCrear.Id, SolicitudCrear.Nombre);
                        EnviarSala(response, sala);
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/actualizada")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitudActualizacion = JsonSerializer.Deserialize<SolicitudActualizacionDTO>(json);

                    if (solicitudActualizacion == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {
                        var sala = salasService.ActualizarSala(solicitudActualizacion.NumSala, solicitudActualizacion.Id, solicitudActualizacion.Listo);

                        if (sala == null)
                        {
                            response.StatusCode = 404;
                        }
                        else
                        {
                            EnviarSala(response, sala);
                        }
                    }

                }
                if (request.HttpMethod == "POST" && url == "/battleship/cancelar")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitud = JsonSerializer.Deserialize<SolicitudCancelacionDTO>(json);

                    if (solicitud == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {


                        var numSala = solicitud.NumSala;
                        var idJugador = solicitud.Id;
                        Sala? sala = salasService.BuscarSala(numSala);
                        if (sala != null)
                        {
                            bool cancelar = salasService.CancelarSala(sala, idJugador);

                            if (cancelar)
                            {
                                EnviarInfo(response, "Cancelar", 200);
                            }
                        }
                        else
                        {

                            EnviarInfo(response, "Sala no encontrada.", 404);
                        }


                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/escuchar-cambio")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitud = JsonSerializer.Deserialize<SolicitudCambioDTO>(json);

                    if (solicitud == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {

                        Sala? sala = salasService.BuscarSala(solicitud.NumSala);

                        if (sala == null)
                        {
                            response.StatusCode = 404;
                        }
                        else
                        {


                            // 📸 LA FOTO: Guardamos el estado exacto de la sala en el instante en que llegó la petición HTTP
                            string? idJ1Inicio = sala.IdJugador1;
                            string? idJ2Inicio = sala.IdJugador2;
                            int listosInicio = sala.JugadoresListos;
                            bool breakEspera = false;

                            while (!breakEspera)
                            {
                                sala = salasService.BuscarSala(solicitud.NumSala);

                                if (sala == null) { break; }
                                if (sala.Activa || sala.JugadoresListos != solicitud.Listos ||
                                    sala.IdJugador1 != idJ1Inicio || sala.IdJugador2 != idJ2Inicio)
                                {
                                    breakEspera = true;
                                }
                                else
                                {
                                    Thread.Sleep(500);
                                }
                            }
                            if (sala == null)
                            {
                                response.StatusCode = 404;
                            }
                            else
                            {

                                EnviarSala(response, sala);
                            }
                        }

                    }

                }
                else if (request.HttpMethod == "GET" && url == "/battleship/partida")
                {
                    EntregarRecurso(response, "Partida.html");
                }
                else if (request.HttpMethod == "GET" && url.StartsWith("/battleship/inicio-partida"))
                {
                    string idSala = request.QueryString["idSala"] ?? "";

                    Sala? sala = salasService.BuscarSalaId(idSala);

                    if (sala == null || sala.battleship == null)
                    {
                        EnviarInfo(response, "Partida no encontrada.", 404);
                    }
                    else
                    {
                        Battleship partida = sala.battleship;
                        EnviarBattleship(response, partida);
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/escuchar-partida")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitud = JsonSerializer.Deserialize<SolicitudMonitoreoPartidaDTO>(json);

                    if (solicitud == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {
                        Sala? sala = null;
                        bool breakEspera = false;
                        int maxIntentosDeEspera = 30;
                        int intentos = 0;

                        while (!breakEspera && intentos < maxIntentosDeEspera)
                        {
                            sala = salasService.BuscarSalaId(solicitud.IdSala);

                            if (sala == null || sala.battleship == null) { break; }

                            var partida = sala.battleship;
                            if ((int)partida.Etapa != solicitud.EtapaCliente)
                            {
                                breakEspera = true;
                                break;
                            }
                            if (partida.Etapa == Etapa.ColocarBarcos)
                            {
                                // En esta etapa solo monitoreamos cambios globales de preparación
                                if (partida.TiempoRestante != solicitud.TiempoCliente || (int)partida.Etapa != solicitud.EtapaCliente ||
                                    partida.Turno != solicitud.TurnoCliente)
                                {
                                    breakEspera = true;
                                }
                            }
                            else if (partida.Etapa == Etapa.Batalla)
                            {
                                if (partida.TiempoRestante != solicitud.TiempoCliente || partida.Turno != solicitud.TurnoCliente ||
                                    partida.NumeroDisparos != solicitud.NumeroDisparos)
                                {
                                    breakEspera = true;
                                }
                            }
                            else if (partida.Etapa == Etapa.Terminado)
                            {
                                if (partida.Revancha != solicitud.Revancha)
                                {
                                    breakEspera = true;
                                }
                            }
                            if (!breakEspera)
                            {
                                Thread.Sleep(500);
                                intentos++;
                            }
                        }
                        if (sala == null || sala.battleship == null)
                        {
                            EnviarInfo(response, "Partida no encontrada.", 404);
                        }
                        else
                        {


                            var partida = sala.battleship;

                            if (partida.Etapa == Etapa.Batalla)
                            {
                                //copia sanitizada
                                var partidaSanitizada = new Battleship
                                {
                                    Etapa = partida.Etapa,
                                    TiempoRestante = partida.TiempoRestante,
                                    TurnoId = partida.TurnoId,
                                    Turno = partida.Turno,
                                    Ganador = partida.Ganador,
                                    NumeroDisparos = partida.NumeroDisparos,
                                    RevanchaJ1 = partida.RevanchaJ1,
                                    RevanchaJ2 = partida.RevanchaJ2
                                };


                                if (sala.IdJugador1 == solicitud.IdUsuario)
                                {
                                    // El Jugador 1 ve sus barcos completos 
                                    partidaSanitizada.CuadriculaJ1 = partida.CuadriculaJ1;

                                    // Del Jugador 2 se ocultan las que están marcadas como nave
                                    partidaSanitizada.CuadriculaJ2 = partida.CuadriculaJ2
                                        .Select(c => new CuadriculaTablero(
                                            c.Posicion,
                                            c.Estado == EstadoCasilla.Nave ? EstadoCasilla.Agua : c.Estado
                                        )).ToList();

                                    partidaSanitizada.NavesRestantesJ1 = partida.NavesRestantesJ1;
                                }
                                else
                                {
                                    partidaSanitizada.CuadriculaJ2 = partida.CuadriculaJ2;
                                    partidaSanitizada.CuadriculaJ1 = partida.CuadriculaJ1
                                        .Select(c => new CuadriculaTablero(
                                            c.Posicion,
                                            c.Estado == EstadoCasilla.Nave ? EstadoCasilla.Agua : c.Estado
                                        )).ToList();
                                    partidaSanitizada.NavesRestantesJ2 = partida.NavesRestantesJ2;

                                }

                                EnviarBattleship(response, partidaSanitizada);
                            }
                            else   //Aqui sería el Etapa == Etapa.ColocandoBarcos
                            {
                                EnviarBattleship(response, partida);
                            }


                        }
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/enviar-naves")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitud = JsonSerializer.Deserialize<SolicitudTableroDTO>(json);

                    if (solicitud == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {
                        Sala? sala = salasService.BuscarSalaId(solicitud.IdSala);

                        if (sala == null || sala.battleship == null)
                        {
                            EnviarInfo(response, "Sala o partida no encontrada", 404);
                        }
                        else
                        {
                            partidaService.RegistrarTableroJugador(sala, solicitud.IdUsuario, solicitud.NavesColocadas);
                            response.StatusCode = 200;
                        }
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/procesar-ataque")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var ataque = JsonSerializer.Deserialize<AtaqueDTO>(json);

                    if (ataque == null)
                    {
                        response.StatusCode = 400;
                        EnviarInfo(response, "Ataque inválido", 400);
                    }
                    else
                    {
                        Sala? sala = salasService.BuscarSalaId(ataque.IdSala);

                        if (sala == null || sala.battleship == null)
                        {
                            EnviarInfo(response, "Sala no encontrada", 404);
                        }
                        else
                        {

                            // Validación de seguridad básica: ¿Es el turno de este jugador?
                            bool esJ1 = sala.IdJugador1 == ataque.IdJugador;
                            if (sala.battleship.TurnoId != ataque.IdJugador)
                            {
                                EnviarInfo(response, "No es tu turno de disparar.", 400);
                            }
                            else
                            {
                                partidaService.ProcesarAtaque(sala, ataque);
                                EnviarInfo(response, "Disparo procesado correctamente.", 200);
                            }
                        }
                    }
                }
                else if (request.HttpMethod == "POST" && url == "/battleship/votar-revancha")
                {
                    var buffer = new byte[request.ContentLength64];
                    request.InputStream.ReadExactly(buffer, 0, buffer.Length);
                    var json = Encoding.UTF8.GetString(buffer);

                    var solicitud = JsonSerializer.Deserialize<SolicitudRevancha>(json);

                    if (solicitud == null)
                    {
                        response.StatusCode = 400;
                    }
                    else
                    {
                        Sala? sala = salasService.BuscarSalaId(solicitud.IdSala);

                        if (sala == null || sala.battleship == null)
                        {
                            EnviarInfo(response, "Sala o partida no encontrada", 404);
                        }
                        else
                        {
                            salasService.RegistrarVotoRevancha(sala, solicitud.IdUsuario, solicitud.Revancha);
                            response.StatusCode = 200;

                        }
                    }
                }




                else if (url.StartsWith("/battleship/css/"))
                {
                    string archivo = Path.GetFileName(url);
                    EntregarRecurso(response, archivo);
                }
                else if (url.StartsWith("/battleship/js/"))
                {
                    string archivo = Path.GetFileName(url);
                    EntregarRecurso(response, archivo);
                }
                else if (url.StartsWith("/battleship/Resources/Images/"))
                {
                    string archivo = Path.GetFileName(url);
                    EntregarRecurso(response, archivo);
                }

            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                MensajeError?.Invoke($"{ex}");
            }
            finally
            {
                response.Close();
            }


        }



        private string GetMime(string ext)
        {
            switch (ext)
            {
                case "html": return "text/html";
                case "css": return "text/css";
                case "js": return "text/javascript";
                case "png": return "image/png";
                case "gif": return "image/gif";
            }
            return "";
        }
        private void EntregarRecurso(HttpListenerResponse response, string nombreArchivo)
        {
            var ext = Path.GetExtension(nombreArchivo).Replace(".", "");
            var mime = GetMime(ext);

            string ruta = "";
            if (ext == "png") ruta = Path.Combine($"Web/Resources/Images", nombreArchivo);
            else if (ext == "gif") ruta = Path.Combine($"Web/Resources/Images", nombreArchivo);
            else if (ext == "mp3") ruta = Path.Combine($"Web/Resources/Music", nombreArchivo);
            else ruta = Path.Combine($"Web/{ext}", nombreArchivo);


            if (File.Exists(ruta))
            {
                byte[] buffer = File.ReadAllBytes(ruta);
                response.ContentLength64 = buffer.Length;
                response.ContentType = mime;
                response.StatusCode = 200;
                response.OutputStream.Write(buffer, 0, buffer.Length);
            }
            else
            {
                response.StatusCode = 404;
            }
        }

        private void EnviarSala(HttpListenerResponse response, Sala sala)
        {
            var json = JsonSerializer.Serialize(sala);
            byte[] buffer = Encoding.UTF8.GetBytes(json);

            response.ContentLength64 = buffer.Length;
            response.ContentType = "application/json";
            response.StatusCode = 200;
            response.OutputStream.Write(buffer, 0, buffer.Length);

        }
        //Puedo hacerlo generico, pero me gusta tenerlos metodos separados
        private void EnviarBattleship(HttpListenerResponse response, Battleship partida)
        {
            var json = JsonSerializer.Serialize(partida);
            byte[] buffer = Encoding.UTF8.GetBytes(json);

            response.ContentLength64 = buffer.Length;
            response.ContentType = "application/json";
            response.StatusCode = 200;
            response.OutputStream.Write(buffer, 0, buffer.Length);
        }

        private void EnviarInfo(HttpListenerResponse response, string info, int statusCode)
        {
            var infoObj = new { Info = info };
            var jsonError = JsonSerializer.Serialize(infoObj);
            byte[] buffer = Encoding.UTF8.GetBytes(jsonError);

            response.ContentLength64 = buffer.Length;
            response.ContentType = "application/json";
            response.StatusCode = statusCode;
            response.OutputStream.Write(buffer, 0, buffer.Length);
        }
    }

}
