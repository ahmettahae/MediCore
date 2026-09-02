using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace MediCore.API.Hubs
{
    public class KlinikHub : Hub
    {
        // Bu metot istemcilerden el sıkışma sonrası genel bir bildirim göndermek için de kullanılabilir
        public async Task SendNotification(string baslik, string mesaj, string tip)
        {
            await Clients.All.SendAsync("ReceiveNotification", baslik, mesaj, tip);
        }
    }
}
