using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Entities;

namespace MediCore.API.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // Tabloların varlığını garanti et
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""IlacUygulamalari"" (
                    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_IlacUygulamalari"" PRIMARY KEY AUTOINCREMENT,
                    ""HastaId"" INTEGER NOT NULL,
                    ""HastaIlacId"" INTEGER NOT NULL,
                    ""IlacId"" INTEGER NOT NULL,
                    ""UygulayanKullaniciId"" INTEGER NULL,
                    ""UygulayanKullaniciAd"" TEXT NULL,
                    ""Tarih"" TEXT NOT NULL,
                    ""Ogun"" TEXT NOT NULL,
                    ""Durum"" TEXT NOT NULL,
                    ""UygulamaZamani"" TEXT NULL,
                    ""Aciklama"" TEXT NULL
                );

                CREATE TABLE IF NOT EXISTS ""HekimMuayeneleri"" (
                    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_HekimMuayeneleri"" PRIMARY KEY AUTOINCREMENT,
                    ""HastaId"" INTEGER NOT NULL,
                    ""DoktorId"" INTEGER NULL,
                    ""DoktorAd"" TEXT NOT NULL,
                    ""MuayeneTarihi"" TEXT NOT NULL,
                    ""Sikayet"" TEXT NOT NULL,
                    ""KlinikBulgular"" TEXT NOT NULL,
                    ""Tani"" TEXT NOT NULL,
                    ""TedaviPlani"" TEXT NOT NULL,
                    ""DiyetVeBakimOnerisi"" TEXT NULL,
                    ""ReceteOzeti"" TEXT NULL,
                    ""KontrolTarihi"" TEXT NULL,
                    ""Durum"" TEXT NOT NULL
                );
            ");

            // Admin hesabını zorla güncelle
            var adminKullanici = context.Kullanicilar.FirstOrDefault(k => k.EPosta == "admin");
            if (adminKullanici != null)
            {
                adminKullanici.Ad = "Ahmet Taha";
                adminKullanici.Soyad = "Erol";
                context.SaveChanges();
            }

            // Her aktif hastanın en az 2 ilacı olduğundan emin ol
            if (context.Hastalar.Any() && context.Ilaclar.Any())
            {
                var ilacListesi = context.Ilaclar.Take(8).ToList();
                var aktifSakinler = context.Hastalar.Where(h => h.Durum == "Aktif" || h.Durum == "Kurumda").ToList();
                var rndm = new Random(42);

                foreach (var h in aktifSakinler)
                {
                    var hastaninIlacSayisi = context.HastaIlaclari.Count(hi => hi.HastaId == h.Id);
                    if (hastaninIlacSayisi < 2)
                    {
                        var atanacaklar = ilacListesi.OrderBy(x => rndm.Next()).Take(2 - hastaninIlacSayisi).ToList();
                        foreach (var i in atanacaklar)
                        {
                            context.HastaIlaclari.Add(new HastaIlac
                            {
                                HastaId = h.Id,
                                IlacId = i.Id,
                                Dozaj = "1x1 (Günde 1 Adet)",
                                KullanimSikligi = "Tok Karnına",
                                KullanimSekli = "Ağızdan (Oral)",
                                BaslangicTarihi = DateTime.Today.AddDays(-10)
                            });
                        }
                    }
                }
                context.SaveChanges();
            }

            // Eğer HekimMuayeneleri boşsa örnek viziteler ekle
            if (context.Hastalar.Any() && !context.HekimMuayeneleri.Any())
            {
                var doktor = context.Doktorlar.FirstOrDefault();
                var hastalarList = context.Hastalar.Where(h => h.Durum == "Aktif").Take(5).ToList();

                foreach (var h in hastalarList)
                {
                    context.HekimMuayeneleri.Add(new HekimMuayene
                    {
                        HastaId = h.Id,
                        DoktorId = doktor?.Id,
                        DoktorAd = doktor != null ? $"Dr. {doktor.Ad} {doktor.Soyad}" : "Dr. Mehmet Öz",
                        MuayeneTarihi = DateTime.Now.AddDays(-1),
                        Sikayet = "Rutin sabah hekim vizitesi kontrolü.",
                        KlinikBulgular = "Genel durumu iyi, oryante, koopere. Solunum sesleri doğal.",
                        Tani = h.Hastalik ?? "Kronik Geriatrik Takip",
                        TedaviPlani = "Mevcut ilaç tedavisine devam edilecek. Tansiyon takibi sürdürülecek.",
                        DiyetVeBakimOnerisi = "Tuzsuz diyet ve günlük yürüyüş egzersizi.",
                        Durum = "Stabil"
                    });
                }
                context.SaveChanges();
            }

            // Eğer veritabanında hastalar, ilaçlar ve kurum hekimi doluysa yeniden çalıştırma
            if (context.Hastalar.Any() && context.Ilaclar.Any() && context.Doktorlar.Any())
            {
                return;
            }

            // Verileri Sıfırla (Temiz Kurum Model Kurulumu)
            context.HastaIlaclari.RemoveRange(context.HastaIlaclari);
            context.HemsireNotlari.RemoveRange(context.HemsireNotlari);
            context.VitalBulgular.RemoveRange(context.VitalBulgular);
            context.IlacStoklari.RemoveRange(context.IlacStoklari);
            context.HastahaneSevkleri.RemoveRange(context.HastahaneSevkleri);
            context.Hastalar.RemoveRange(context.Hastalar);
            context.Doktorlar.RemoveRange(context.Doktorlar);
            context.Ilaclar.RemoveRange(context.Ilaclar);
            context.Kullanicilar.RemoveRange(context.Kullanicilar);
            context.Personeller.RemoveRange(context.Personeller);
            context.SaveChanges();

            var hash = "$2a$11$hhsH2tzcnPpnTAJmJnitQOl8WmTnb8cpMnfictcF1VLdkObbJerKy"; // Admin@123 veya 123

            var localRnd = new Random(42);
            // ── 1. KULLANICILAR (Başhekim, Başhemşire, Yönetici, Hekimler ve Hemşireler) ─────
            var kullanicilar = new List<Kullanici>
            {
                new Kullanici { Ad = "Ahmet Taha", Soyad = "Erol", SifreHash = hash, Rol = "Bashekim", EPosta = "dr_aterol", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Başhemşire", Soyad = "Fatma", SifreHash = hash, Rol = "Bashemsire", EPosta = "hem_bashemsire", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Yönetici", Soyad = "Denetçi", SifreHash = hash, Rol = "Yonetici", EPosta = "yonetici_denetci", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Hemsire", Soyad = "Hemsire", SifreHash = "", Rol = "Hemsire", EPosta = "hem_hhemsire", SifreBelirlendi = false, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Fatma", Soyad = "Yıldız", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_fyildiz", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Elif", Soyad = "Demir", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_edemir", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Zeynep", Soyad = "Yılmaz", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_zyilmaz", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Hatice", Soyad = "Kaya", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_hkaya", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Merve", Soyad = "Şahin", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_msahin", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Ayşe", Soyad = "Kaya", SifreHash = hash, Rol = "Hemsire", EPosta = "hem_akaya", SifreBelirlendi = true, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Mehmet", Soyad = "Öz", SifreHash = "", Rol = "Doktor", EPosta = "dr_moz", SifreBelirlendi = false, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Canan", Soyad = "Dağdeviren", SifreHash = "", Rol = "Doktor", EPosta = "dr_cdagdeviren", SifreBelirlendi = false, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Ali Rıza", Soyad = "Can", SifreHash = "", Rol = "Doktor", EPosta = "dr_arcan", SifreBelirlendi = false, TcKimlikNo = GenerateValidTcNo(localRnd) },
                new Kullanici { Ad = "Selin", Soyad = "Yılmaz", SifreHash = "", Rol = "Doktor", EPosta = "dr_syilmaz", SifreBelirlendi = false, TcKimlikNo = GenerateValidTcNo(localRnd) }
            };
            context.Kullanicilar.AddRange(kullanicilar);
            context.SaveChanges();

            // ── 2. KURUM HEKİMLERİ VE UZMAN DOKTORLAR ───────────────────────
            var doktorlarListesi = new List<Doktor>
            {
                new Doktor
                {
                    Ad = "Mehmet",
                    Soyad = "Öz",
                    TcKimlikNo = GenerateValidTcNo(localRnd),
                    DogumTarihi = new DateTime(1975, 4, 12),
                    Cinsiyet = "Erkek",
                    Telefon = "05321112233",
                    EPosta = "d",
                    UzmanlikAlani = "Kurum Hekimliği & Acil Müdahale Uzmanı",
                    SicilNo = "DR-10492",
                    CalistigiBirim = "Hasta Bakım Merkezi Hekimliği",
                    GoreveBaslamaTarihi = new DateTime(2015, 2, 1),
                    KullaniciAdi = "dr_moz",
                    Sifre = "123",
                    Durum = "Aktif"
                },
                new Doktor
                {
                    Ad = "Canan",
                    Soyad = "Dağdeviren",
                    TcKimlikNo = GenerateValidTcNo(localRnd),
                    DogumTarihi = new DateTime(1980, 8, 20),
                    Cinsiyet = "Kadın",
                    Telefon = "05332223344",
                    EPosta = "canan.dagdeviren@medicore.com",
                    UzmanlikAlani = "Kardiyoloji Uzmanı",
                    SicilNo = "DR-10501",
                    CalistigiBirim = "Kardiyoloji & Kalp Sağlığı Birimi",
                    GoreveBaslamaTarihi = new DateTime(2018, 5, 10),
                    KullaniciAdi = "dr_cdagdeviren",
                    Sifre = "123",
                    Durum = "Aktif"
                },
                new Doktor
                {
                    Ad = "Ali Rıza",
                    Soyad = "Can",
                    TcKimlikNo = GenerateValidTcNo(localRnd),
                    DogumTarihi = new DateTime(1978, 11, 5),
                    Cinsiyet = "Erkek",
                    Telefon = "05343334455",
                    EPosta = "ali.can@medicore.com",
                    UzmanlikAlani = "Nöroloji & Demans Uzmanı",
                    SicilNo = "DR-10620",
                    CalistigiBirim = "Nöroloji & Beyin Sağlığı Birimi",
                    GoreveBaslamaTarihi = new DateTime(2017, 9, 15),
                    KullaniciAdi = "dr_arcan",
                    Sifre = "123",
                    Durum = "Aktif"
                },
                new Doktor
                {
                    Ad = "Selin",
                    Soyad = "Yılmaz",
                    TcKimlikNo = GenerateValidTcNo(localRnd),
                    DogumTarihi = new DateTime(1983, 3, 28),
                    Cinsiyet = "Kadın",
                    Telefon = "05354445566",
                    EPosta = "selin.yilmaz@medicore.com",
                    UzmanlikAlani = "Dahiliye & Geriatri Uzmanı",
                    SicilNo = "DR-10755",
                    CalistigiBirim = "Geriatrik Bakım Birimi",
                    GoreveBaslamaTarihi = new DateTime(2019, 11, 1),
                    KullaniciAdi = "dr_syilmaz",
                    Sifre = "123",
                    Durum = "Aktif"
                }
            };
            context.Doktorlar.AddRange(doktorlarListesi);
            context.SaveChanges();

            // ── 3. HASTALAR (42 Bakım Merkezi Sakini) ───────────────────────
            var hastalar = new List<Hasta>();
            var erkekIsimleri = new[] { "Ahmet", "Mehmet", "Mustafa", "Ali", "Hüseyin", "Hasan", "İbrahim", "İsmail", "Osman", "Murat", "Ömer", "Yusuf", "Emre", "Hakan", "Oğuz", "Cem", "Orhan", "Eren", "Kaan", "Serdar", "Kadir" };
            var kadinIsimleri = new[] { "Fatma", "Ayşe", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Büşra", "Hacer", "Yasemin", "Hülya", "Derya", "Seda", "Sevgi", "Sibel", "Şerife", "Gönül", "Nalan", "Deniz", "Aysel", "Nesrin" };
            var soyisimler = new[] { "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özcan", "Şimşek", "Ünal" };

            var hastaliklar = new[] {
                "Hipertansiyon & Tip 2 Diyabet", "Kronik Obstrüktif Akciğer Hastalığı (KOAH)", "Alzheimer Evre 2 (Ağır Bakım)",
                "Koroner Arter Hastalığı", "Kalp Yetersizliği & Aritmi", "Parkinson Hastalığı", "Osteoporoz & Bel Fıtığı",
                "Kronik Böbrek Yetmezliği", "Romatoit Artrit", "Serebrovasküler Olay (İnme Sonrası Bakım)",
                "Demans & Uyku Bozukluğu", "Ateroskleroz", "Astım Bronşiale", "Major Depresyon & Anksiyete",
                "Kalça Protezi Sonrası Bakım", "Post-Op Genel Bakım Hastası"
            };

            var alerjiler = new[] { "Yok", "Penisilin", "Aspirin & NSAİİ", "Sülfonamid", "Polen & Toz", "Laktoz İntoleransı", "Yok", "Lateks", "Yok" };

            var rnd = new Random(42);

            for (int i = 1; i <= 42; i++)
            {
                bool isErkek = i % 2 == 1;
                string ad = isErkek ? erkekIsimleri[rnd.Next(erkekIsimleri.Length)] : kadinIsimleri[rnd.Next(kadinIsimleri.Length)];
                string soyad = soyisimler[rnd.Next(soyisimler.Length)];

                int yas = rnd.Next(65, 95);
                var dogumTarihi = DateTime.Today.AddYears(-yas).AddDays(rnd.Next(1, 360));

                int odaNum = 100 + (i / 2);
                int yatakNum = (i % 2) + 1;

                string durum = "Aktif";
                if (i == 5 || i == 12 || i == 28) durum = "Hastanede"; // 3 hasta şu an hastanede sevkli
                else if (i == 40 || i == 41 || i == 42) durum = "Taburcu";

                hastalar.Add(new Hasta
                {
                    HastaNo = $"H-2026-{(i):D3}",
                    TcKimlikNo = GenerateValidTcNo(rnd),
                    Ad = ad,
                    Soyad = soyad,
                    DogumTarihi = dogumTarihi,
                    Cinsiyet = isErkek ? "Erkek" : "Kadın",
                    Telefon = $"05{rnd.Next(30, 55):D2}{rnd.Next(100, 999):D3}{rnd.Next(10, 99):D2}",
                    HastaYakiniAd = isErkek ? $"Oğlu/Kızı {ad} Yıl" : $"Yakını {ad} Can",
                    HastaYakiniTelefon = $"05{rnd.Next(30, 55):D2}{rnd.Next(100, 999):D3}{rnd.Next(10, 99):D2}",
                    OdaNo = odaNum.ToString(),
                    YatakNo = yatakNum.ToString(),
                    Hastalik = hastaliklar[rnd.Next(hastaliklar.Length)],
                    AlerjiBilgisi = alerjiler[rnd.Next(alerjiler.Length)],
                    GirisTarihi = DateTime.Now.AddDays(-rnd.Next(10, 500)),
                    CikisTarihi = durum == "Taburcu" ? DateTime.Now.AddDays(-rnd.Next(1, 30)) : null,
                    Durum = durum
                });
            }
            context.Hastalar.AddRange(hastalar);
            context.SaveChanges();

            // ── 4. İLAÇLAR (95 Gerçekçi Rutin ve Acil Müdahale İlacı) ──────────
            var ilacKatalogu = new (string Ad, string EtkenMadde, string Form, string Uretici, int Kritik)[]
            {
                ("Parol 500 mg", "Parasetamol", "Tablet", "Atabay", 20),
                ("Arveles 25 mg", "Dexketoprofen", "Tablet", "Ulagay", 15),
                ("Augmentin BID 1000 mg", "Amoksisilin + Klavulanik Asit", "Tablet", "GSK", 10),
                ("Coraspin 100 mg", "Asetilsalisilik Asit", "Tablet", "Bayer", 30),
                ("Nexium 40 mg", "Esomeprazol", "Kapsül", "AstraZeneca", 15),
                ("Pantpas 40 mg", "Pantoprazol", "Tablet", "Takeda", 15),
                ("Beloc ZOK 50 mg", "Metoprolol Succinate", "Tablet", "AstraZeneca", 25),
                ("Glucophage 1000 mg", "Metformin HCl", "Tablet", "Merck", 20),
                ("Ventolin İnhaler 100 mcg", "Salbutamol", "İnhaler", "GSK", 10),
                ("Adrenalin 1 mg/ml (Acil Kiti)", "Epinefrin", "Ampul", "Biofarma", 5),
                ("Atropin Sülfat 1 mg (Acil Kiti)", "Atropin", "Ampul", "Deva", 5),
                ("Diazem 10 mg/2 ml (Acil Kiti)", "Diazepam", "Ampul", "Deva", 5),
                ("Cordarone 150 mg (Acil Kiti)", "Amiodaron", "Ampul", "Sanofi", 5),
                ("Novalgin 500 mg", "Metamizol Sodyum", "Ampul", "Sanofi", 15),
                ("Buscopan Plus", "Hiyosin-N-Butilbromür + Parasetamol", "Tablet", "Boehringer Ingelheim", 12),
                ("Cipro 500 mg", "Siprofloksasin", "Tablet", "Biofarma", 10),
                ("Devit-3 Oral Damla", "Kolekalsiferol (D3 Vit)", "Damla", "Deva", 20),
                ("Benexol B12", "B1, B6, B12 Vitamini", "Tablet", "Bayer", 15),
                ("Voltaren Emulgel %1", "Diklofenak Diatilamin", "Merhem", "Novartis", 10),
                ("Lustral 50 mg", "Sertralin", "Tablet", "Pfizer", 10),
                ("Norvasc 5 mg", "Amlodipin", "Tablet", "Pfizer", 20),
                ("Plavix 75 mg", "Klopidogrel", "Tablet", "Sanofi", 12),
                ("Lasix 40 mg", "Furosemid", "Tablet", "Sanofi", 20),
                ("Lasix 20 mg/2 ml (Acil Kiti)", "Furosemid", "Ampul", "Sanofi", 10),
                ("Gaviscon Double Action", "Sodyum Aljinat", "Şurup", "Reckitt Benckiser", 15),
                ("Prednol 16 mg", "Metilprednizolon", "Tablet", "Mustafa Nevzat", 10),
                ("Prednol-L 40 mg (Acil Kiti)", "Metilprednizolon", "Ampul", "Mustafa Nevzat", 8),
                ("Duphalac Şurup", "Laktüloz", "Şurup", "Abbott", 15)
            };

            var ilaclar = new List<Ilac>();
            long barkodBaslangic = 8699500000000;

            foreach (var item in ilacKatalogu)
            {
                barkodBaslangic += rnd.Next(1, 15);
                ilaclar.Add(new Ilac
                {
                    Barkod = barkodBaslangic.ToString(),
                    Ad = item.Ad,
                    EtkenMadde = item.EtkenMadde,
                    Form = item.Form,
                    UreticiFirma = item.Uretici,
                    KritikStokSeviyesi = item.Kritik
                });
            }
            context.Ilaclar.AddRange(ilaclar);
            context.SaveChanges();

            // ── 5. İLAÇ STOKLARI ──────────────────────────────────────────────
            var stoklar = new List<IlacStok>();
            int partiSayac = 1001;

            foreach (var ilac in ilaclar)
            {
                int partiSayisi = rnd.Next(1, 3);
                for (int p = 0; p < partiSayisi; p++)
                {
                    stoklar.Add(new IlacStok
                    {
                        IlacId = ilac.Id,
                        PartiNo = $"LOT-2026-{partiSayac++}",
                        Adet = rnd.Next(15, 120),
                        SonKullanmaTarihi = DateTime.Today.AddMonths(rnd.Next(3, 24)),
                        GirisTarihi = DateTime.Today.AddDays(-rnd.Next(1, 60))
                    });
                }
            }
            context.IlacStoklari.AddRange(stoklar);
            context.SaveChanges();

            // ── 6. HASTANEYE SEVK KAYITLARI (Sevk Geçmişi & Aktif Sevkler) ───
            var sevkler = new List<HastahaneSevk>
            {
                new HastahaneSevk
                {
                    HastaId = hastalar[4].Id,
                    SevkEdilenHastane = "Ankara Şehir Hastanesi",
                    SevkNedeni = "Ani Gelişen Hipotansiyon & Solunum Yetmezliği",
                    SevkTipi = "Acil (112 Ambulans)",
                    DoktorNotu = "Hastanın SpO₂ değeri %84'e düştü. Kurum hekimi Dr. Mehmet Öz tarafından acil oksijen ve 112 sevki uygun görüldü.",
                    SevkEdenKullaniciId = kullanicilar[0].Id,
                    SevkEdenAd = "Dr. Mehmet Öz",
                    Durum = "Sevk Edildi",
                    SevkTarihi = DateTime.Now.AddHours(-18)
                },
                new HastahaneSevk
                {
                    HastaId = hastalar[11].Id,
                    SevkEdilenHastane = "Hacettepe Üniversitesi Tıp Fakültesi Hastanesi",
                    SevkNedeni = "Kalça Ağrısı & Şüpheli Kırık (Düşme Sonrası)",
                    SevkTipi = "Acil (112 Ambulans)",
                    DoktorNotu = "Yataktan kalkarken düşme öyküsü. Sağ kalçada aşırı hassasiyet. X-Ray kontrolü için acil sevk.",
                    SevkEdenKullaniciId = kullanicilar[1].Id,
                    SevkEdenAd = "Ayşe Kaya",
                    Durum = "Sevk Edildi",
                    SevkTarihi = DateTime.Now.AddDays(-1)
                },
                new HastahaneSevk
                {
                    HastaId = hastalar[27].Id,
                    SevkEdilenHastane = "Gazi Üniversitesi Hastanesi",
                    SevkNedeni = "Yüksek Ateş & Akut Enfeksiyon (Septik Tablo Şüphesi)",
                    SevkTipi = "Acil (112 Ambulans)",
                    DoktorNotu = "Ateş 39.4 °C. Antibiyotik tedavisine yanıt alınamadı. İleri tetkik ve IV sıvı/tedavi için sevk edildi.",
                    SevkEdenKullaniciId = kullanicilar[0].Id,
                    SevkEdenAd = "Dr. Mehmet Öz",
                    Durum = "Sevk Edildi",
                    SevkTarihi = DateTime.Now.AddDays(-2)
                },
                new HastahaneSevk
                {
                    HastaId = hastalar[1].Id,
                    SevkEdilenHastane = "Ankara Numune Hastanesi",
                    SevkNedeni = "Diyabetik Ayak Pansumanı & Rutin Kontrol",
                    SevkTipi = "Poliklinik Kontrolü",
                    DoktorNotu = "Yara bakım poliklinik kontrolü için planlı sevk.",
                    SevkEdenKullaniciId = kullanicilar[1].Id,
                    SevkEdenAd = "Ayşe Kaya",
                    Durum = "Geri Döndü",
                    SevkTarihi = DateTime.Now.AddDays(-5),
                    GeriDonusTarihi = DateTime.Now.AddDays(-5).AddHours(6),
                    GeriDonusNotu = "Yara debritmanı yapıldı. Pansuman yenilendi. İlaç reçetesi düzenlendi, bakım merkezine geri döndü."
                }
            };
            context.HastahaneSevkleri.AddRange(sevkler);
            context.SaveChanges();

            // ── 7. HEMŞİRE RUTİN NOTLARI & VİTAL BULGULARI ────────────────────
            var notlar = new List<HemsireNotu>();
            var vitaller = new List<VitalBulgu>();
            var hemsireler = kullanicilar.Where(k => k.Rol == "Hemsire").ToList();
            var aktifHastalar = hastalar.Where(h => h.Durum == "Aktif").ToList();

            foreach (var h in aktifHastalar.Take(25))
            {
                var hemsire = hemsireler[rnd.Next(hemsireler.Count)];
                notlar.Add(new HemsireNotu
                {
                    HastaId = h.Id,
                    KullaniciId = hemsire.Id,
                    Not = "Sabah rutin bakım ve vital kontroller yapıldı. İlaçları tok karnına içirildi. Genel durumu iyi.",
                    Tarih = DateTime.Now.AddHours(-rnd.Next(1, 12))
                });

                vitaller.Add(new VitalBulgu
                {
                    HastaId = h.Id,
                    KullaniciId = hemsire.Id,
                    NabizBPM = rnd.Next(68, 88),
                    TansiyonSistol = rnd.Next(115, 138),
                    TansiyonDiyastol = rnd.Next(72, 88),
                    AtesC = Math.Round((decimal)(36.2 + (rnd.NextDouble() * 0.8)), 1),
                    SoluSayisi = rnd.Next(14, 20),
                    SaturasyonYuzdesi = rnd.Next(96, 100),
                    Tarih = DateTime.Now.AddHours(-rnd.Next(1, 8))
                });
            }
            context.HemsireNotlari.AddRange(notlar);
            context.VitalBulgular.AddRange(vitaller);
            context.SaveChanges();

            // ── 8. NÖBET TAKVİMİ (1 Tam Yıl: 365 Gün Hemşire + Doktor Nöbet Kayıtları) ────────
            context.Nobetler.RemoveRange(context.Nobetler);
            context.SaveChanges();

            var nobetler = new List<Nobet>();
            var hemsireKullanicilar = kullanicilar.Where(k => k.Rol == "Hemsire").ToList();
            var doktorlar = context.Doktorlar.ToList();
            var baslangicTarihi = new DateTime(2026, 1, 1);
            var bitisTarihi = new DateTime(2026, 12, 31);

            for (var tarih = baslangicTarihi; tarih <= bitisTarihi; tarih = tarih.AddDays(1))
            {
                var h1 = hemsireKullanicilar[rnd.Next(hemsireKullanicilar.Count)];
                var h2 = hemsireKullanicilar[rnd.Next(hemsireKullanicilar.Count)];
                var h3 = hemsireKullanicilar[rnd.Next(hemsireKullanicilar.Count)];

                nobetler.Add(new Nobet
                {
                    HemsireAd = h1.Ad,
                    HemsireSoyad = h1.Soyad,
                    HemsireTelefon = $"053{rnd.Next(1000000, 9999999)}",
                    VardiyaTuru = "Gündüz",
                    BaslangicSaati = new TimeSpan(8, 0, 0),
                    BitisSaati = new TimeSpan(16, 0, 0),
                    NobetTarihi = tarih,
                    Aktif = true
                });

                nobetler.Add(new Nobet
                {
                    HemsireAd = h2.Ad,
                    HemsireSoyad = h2.Soyad,
                    HemsireTelefon = $"053{rnd.Next(1000000, 9999999)}",
                    VardiyaTuru = "Akşam",
                    BaslangicSaati = new TimeSpan(16, 0, 0),
                    BitisSaati = new TimeSpan(23, 59, 59),
                    NobetTarihi = tarih,
                    Aktif = true
                });

                nobetler.Add(new Nobet
                {
                    HemsireAd = h3.Ad,
                    HemsireSoyad = h3.Soyad,
                    HemsireTelefon = $"053{rnd.Next(1000000, 9999999)}",
                    VardiyaTuru = "Gece",
                    BaslangicSaati = new TimeSpan(0, 0, 0),
                    BitisSaati = new TimeSpan(8, 0, 0),
                    NobetTarihi = tarih,
                    Aktif = true
                });
            }
            context.Nobetler.AddRange(nobetler);
            context.SaveChanges();

            // ── 9. PERSONELLER ────────────────────────────────────────────────
            var personellerListesi = new List<Personel>
            {
                new Personel { AdSoyad = "Fatma Yıldız", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05333334455", Durum = "Mesaide", Vardiya = "Gündüz (08:00 - 16:00)" },
                new Personel { AdSoyad = "Elif Demir", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05344445566", Durum = "Mesaide", Vardiya = "Akşam (16:00 - 24:00)" },
                new Personel { AdSoyad = "Zeynep Yılmaz", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05355556677", Durum = "Mesaide", Vardiya = "Gece (00:00 - 08:00)" },
                new Personel { AdSoyad = "Hatice Kaya", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05366667788", Durum = "Mesaide", Vardiya = "Gündüz (08:00 - 16:00)" },
                new Personel { AdSoyad = "Merve Şahin", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05377778899", Durum = "Mesaide", Vardiya = "Akşam (16:00 - 24:00)" },
                new Personel { AdSoyad = "Ayşe Kaya", Unvan = "Hemşire", Cinsiyet = "Kadın", Telefon = "05388889900", Durum = "Mesaide", Vardiya = "Gece (00:00 - 08:00)" }
            };
            context.Personeller.AddRange(personellerListesi);
            context.SaveChanges();

            // ── 11. TEST VERİSİ ARTIKLARINI TEMİZLEME (DATA SANITIZATION) ────────
            var testHastalar = context.Hastalar.Where(h => h.Ad.StartsWith("Test") || h.Soyad.StartsWith("Deneme")).ToList();
            if (testHastalar.Any())
            {
                context.Hastalar.RemoveRange(testHastalar);
                context.SaveChanges();
            }
        }

        private static string GenerateValidTcNo(Random rnd)
        {
            int[] digits = new int[11];
            digits[0] = rnd.Next(1, 10);
            for (int i = 1; i < 9; i++)
            {
                digits[i] = rnd.Next(0, 10);
            }

            int oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
            int evenSum = digits[1] + digits[3] + digits[5] + digits[7];

            int tenthDigit = ((oddSum * 7) - evenSum) % 10;
            if (tenthDigit < 0) tenthDigit += 10;

            digits[9] = tenthDigit;

            int sumOfFirstTen = 0;
            for (int i = 0; i < 10; i++)
            {
                sumOfFirstTen += digits[i];
            }
            digits[10] = sumOfFirstTen % 10;

            return string.Join("", digits);
        }
    }
}
