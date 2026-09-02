# 🏥 MediCore Klinik & Bakım Yönetim Sistemi — Canlıya Geçiş Kılavuzu (Production Deployment)

Bu belge, **MediCore (.NET 9 Web API + React Vite SPA + SignalR)** projesini canlı sunucuya (IIS, Nginx, Linux VM veya Docker) sorunsuz ve güvenli bir şekilde dağıtmanız için gereken tüm adımları içerir.

---

## 📁 1. Hazırlanan Canlı Yapılandırma Dosyaları

| Dosya | Görevi |
| :--- | :--- |
| **`MediCore.UI/.env`** | Yerel geliştirme ortamı değişkenleri (`http://localhost:5034/api`, `/hub/klinik`). |
| **`MediCore.UI/.env.production`** | Canlı ortam API ve WebSocket uç noktaları (`/api`, `/hub/klinik`). |
| **`MediCore.UI/src/config/api.js`** | Tüm React bileşenlerinin merkezi olarak bağlandığı dinamik API köprüsü. |
| **`MediCore.API/appsettings.Production.json`** | Canlı veritabanı, güvenli JWT anahtarı ve SMTP e-posta ayarları. |

---

## 🛠️ 2. Canlı Derleme Komutları (Build & Publish)

### A) Frontend (React SPA) Derlemesi
```bash
cd MediCore.UI
npm run build
```
> **Çıktı**: `MediCore.UI/dist` klasöründe sıkıştırılmış, optimize edilmiş statik web dosyaları oluşur.

### B) Backend (.NET 9 Web API) Yayınlama
```bash
cd MediCore.API
dotnet publish -c Release -o ../publish
```
> **Çıktı**: Proje kökündeki `publish/` klasöründe tek başına çalışabilir .NET 9 API paketi oluşur.

---

## 🌐 3. Sunucu Dağıtım Senaryoları

### Senaryo 1: Nginx + Linux (Önerilen)
Nginx yapılandırması (`/etc/nginx/sites-available/medicore`):

```nginx
server {
    listen 80;
    server_name medicore.tccb.gov.tr;

    # 1. Frontend (React SPA)
    location / {
        root /var/www/medicore/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Backend REST API
    location /api/ {
        proxy_pass http://localhost:5034/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. SignalR Real-Time WebSocket (Hayati Önem Taşır)
    location /hub/ {
        proxy_pass http://localhost:5034/hub/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Senaryo 2: Windows Server & IIS
1. **URL Rewrite Module** ve **Application Request Routing (ARR)** eklentilerini kurun.
2. `dist` klasörünü `C:\inetpub\wwwroot\medicore` altına koyun.
3. Backend için **.NET Core Hosting Bundle (v9.0)** kurup `publish/` klasörünü IIS Uygulaması (App Pool: No Managed Code) olarak başlatın.
4. IIS üzerinde **WebSocket Protocol** özelliğini Windows Features üzerinden aktif edin.

---

## 🔑 4. Canlı Öncesi Son Kontrol (Checklist)

- [x] **Dinamik API Köprüsü**: Kod içerisindeki sabit `localhost` linkleri temizlendi, `.env` ve `.env.production` entegre edildi.
- [x] **Typography & Renk Bütünlüğü**: Monokrom ikonlar, Geist font ailesi ve standart buton hiyerarşisi sağlandı.
- [x] **Master Test Denetimi**: 17 Sistem Audit Testi, 43 Frontend Route Testi ve 9 CRUD Mutasyon Testi %100 başarıyla geçti.
- [x] **Release Derleme**: Frontend Vite build (724ms) ve .NET 9 publish hatasız tamamlandı.
- [ ] **Canlı JWT & Şifre Değişimi**: Sunucuya yüklerken `appsettings.Production.json` içindeki `Jwt:Key` değerini güvenli rastgele bir şifre ile güncelleyin.
- [ ] **Admin Şifre Güncellemesi**: Canlıya geçtikten sonra ilk iş olarak `ahmet.erol` (Başhekim) hesabının şifresini güncelleyin.

---

🎉 **MediCore Hasta Bakım Sistemi Canlıya Çıkmaya Hazırdır!**
