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
        }


        [RelayCommand]
        public void ToogleServidor()
        {
            if (!Encendido)
            {
                Encendido = true;
                Error = "";
            }
            else
            {
                Encendido = false;
                Error = "Servidor Apagado";
            }
        }
    }
}
