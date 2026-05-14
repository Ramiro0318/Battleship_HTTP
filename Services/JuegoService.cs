using System;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.IO;
using System.Net;
using System.Security.Policy;
using System.Text;

namespace Battleship_HTTP.Services
{
    public class JuegoService
    {
        private bool encendido;
        private HttpListener servidor;

        public event Action<string>? MensajeError;
        public event Action<bool, string>? ToogleServidor;
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

            try
            {
                if (request.HttpMethod == "GET" && request.RawUrl == "/battleship/")
                {
                    EntregarRecurso(response, "Index.html");
                    
                }
                else if (request.RawUrl.StartsWith("/battleship/css/"))
                {
                    string archivo = Path.GetFileName(request.RawUrl);
                    EntregarRecurso(response, archivo);
                }
                else if (request.RawUrl.StartsWith("/battleship/js/"))
                {
                    string archivo = Path.GetFileName(request.RawUrl);
                    EntregarRecurso(response, archivo);
                }
                else //if
                {

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
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.StatusCode = 200;
            }
            else
            {
                response.StatusCode = 404;
            }
        }
    }
}
