using Battleship_HTTP.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.IO;
using System.Net;
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

        public void Detener()
        {
            encendido = false;
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
                    Thread solicitud = new(() => ProcesarSolicitud(context))
                    {
                        IsBackground = true
                    };
                    solicitud.Start();
                }
                catch (HttpListenerException hhtpex)
                {
                    MensajeError?.Invoke($"{hhtpex}");
                }
                catch (Exception ex)
                {
                    MensajeError?.Invoke($"{ex}");
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
                        Sala? sala = null;
                        bool breakEspera = false;
                        while (!breakEspera)
                        {
                            sala = salasService.BuscarSala(solicitud.NumSala);

                            if (sala == null) { break; }
                            if (sala.Activa || sala.JugadoresListos != solicitud.Listos || sala.Llena)
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

                            if (partida.TiempoRestante != solicitud.TiempoCliente || (int)partida.Etapa != solicitud.EtapaCliente ||
                            partida.Turno != solicitud.TurnoCliente || partida.Finalizado != solicitud.FinalizadoCliente)
                            {
                                breakEspera = true;
                            }
                            else
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
                            EnviarBattleship(response, sala.battleship);
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
            //else if (request.RawUrl.StartsWith("/battleship/images/"))
            //{
            //    string archivo = request.RawUrl.Replace("/battleship/", "");
            //    string ruta = Path.Combine("Web", archivo);

            //    ServirArchivo(response, ruta, "image/png");
            //}
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
                case "js": return "text/js";
                case "png": return "image/png";
            }
            return "";
        }
        private void EntregarRecurso(HttpListenerResponse response, string nombreArchivo)
        {
            var ext = Path.GetExtension(nombreArchivo).Replace(".", "");
            var mime = GetMime(ext);
            
            string ruta = "";
            if (ext == "png")   ruta = Path.Combine($"Web/Resources/Images", nombreArchivo);
            else if (ext == "mp3")  ruta = Path.Combine($"Web/Resources/Music", nombreArchivo);
            else    ruta = Path.Combine($"Web/{ext}", nombreArchivo);


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
