using Battleship_HTTP.Services;
using Battleship_HTTP.ViewModels;
using System.Configuration;
using System.Data;
using System.Windows;
using System.Windows.Automation.Provider;
using System.Xml.Serialization;

namespace Battleship_HTTP
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private void OnStartup(object sender, StartupEventArgs e) 
        {
            // 1. Instanciar el servicio de lógica
            JuegoService service = new JuegoService();

            // 3. Instanciar el ViewModel y pasarle ambos servicios
            var vm = new MainViewModel(service);

            // 4. Crear la ventana y le asignamos el VM manualmente
            var mainWindow = new MainWindow();
            mainWindow.DataContext = vm;

            mainWindow.Show();
        }

    }

}
