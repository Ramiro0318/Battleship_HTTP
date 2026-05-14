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
            Error = error;
        }

        [RelayCommand]
        public void ToogleServidor()
        {
            if (!Encendido)
            {
                //Error = "";
                service.Iniciar();
            }
            else
            {
                service.Detener();
            }
        }
        private void Service_ToogleServidor(bool encendido, string? mensaje)
        {
            Encendido = encendido;
            Error = mensaje;
        }
    }
}
