using Battleship_HTTP.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;

namespace Battleship_HTTP.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        [ObservableProperty]
        private bool encendido;

        [ObservableProperty]
        private string? error = "";
        private readonly JuegoService service;
        public MainViewModel(JuegoService service)
        {
            this.service = service;
            service.ToogleServidor += Service_ToogleServidor;
            service.MensajeError += Service_MensajeError;
        }

        private void Service_MensajeError(string error)
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                Error = error;
            });
        }

        [RelayCommand]
        public async Task ToogleServidor()
        {
            if (!Encendido)
            {
                service.Iniciar();
            }
            else
            {
                await service.Detener();
            }
        }
        private void Service_ToogleServidor(bool encendido, string? mensaje)
        {
            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                Encendido = encendido;

                if (mensaje == "ServidorDetenido")
                {
                    Error = "";
                }
                else
                {
                    Error = mensaje;
                }
            });
        }
    }
}
