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

        SalasService salasService = new SalasService();
        public JuegoService()
        {
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
                        if (SolicitudSala.NumSala == "")//Mathcmaking
                        {
                            var sala = salasService.SolicitarSala(SolicitudSala.Id, SolicitudSala.Nombre);
                            //Enviar respuesta
                            EnviarSala(response, sala);
                        }
                        else
                        {


                        }
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
                        //Sala? sala = null;
                        bool breakEspera = false;
                        var sala = salasService.BuscarSala(solicitud.NumSala);
                        while (!breakEspera)
                        {
                            if (sala == null) { break; }
                            if (sala.Activa || sala.JugadoresListos != solicitud.Listos)
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




                if (request.HttpMethod == "POST" && url == "/battleship/partida")
                {
                    EntregarRecurso(response, "Index.html");
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
            }
            return "";
        }
        private void EntregarRecurso(HttpListenerResponse response, string nombreArchivo)
        {
            var ext = Path.GetExtension(nombreArchivo).Replace(".", "");
            var mime = GetMime(ext);
            string ruta = Path.Combine($"Web/{ext}", nombreArchivo);

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

        private void EnviarInfo(string info)
        {

        }
    }
}
