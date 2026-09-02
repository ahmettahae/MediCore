import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/errorUtils';
import { Sun, Moon } from 'lucide-react';
import MediCoreLogo from './MediCoreLogo';
import { API_BASE } from '../config/api';

const Login = () => {
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [geceModu, setGeceModu] = useState(() => {
    return localStorage.getItem('medicore_gece_modu') === 'true';
  });

  useEffect(() => {
    if (geceModu) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('medicore_gece_modu', geceModu);
  }, [geceModu]);

  // İlk giriş aktivasyon akışı için state'ler
  const [ilkGiris, setIlkGiris] = useState(false);
  const [ilkGirisTalebi, setIlkGirisTalebi] = useState(false);
  const [aktivasyonKodu, setAktivasyonKodu] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');

  const navigate = useNavigate();
  const { girisYap } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const cevap = await fetch(`${API_BASE}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EPosta: kullaniciAdi, Sifre: sifre })
      });

      if (cevap.ok) {
        const veri = await cevap.json();

        // Eğer ilk giriş ise aktivasyon adımına geçiş yap
        if (veri.ilkGiris || veri.IlkGiris) {
          setIlkGiris(true);
          setIlkGirisTalebi(false);
          setKullaniciAdi(veri.eposta || veri.EPosta || kullaniciAdi);
          setHata('');
          return;
        }

        const token = veri.token || veri.Token;
        const ad = veri.ad || veri.Ad;
        const soyad = veri.soyad || veri.Soyad;
        const rol = veri.rol || veri.Rol;
        girisYap(token, ad, soyad, rol);
        navigate('/');
      } else {
        const mesaj = await parseApiError(cevap, 'Kullanıcı adı veya şifre hatalı.');
        setHata(mesaj);
      }
    } catch {
      setHata('Sunucuya bağlanılamadı. API servisinin çalıştığından emin olun.');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setHata('');

    if (yeniSifre !== yeniSifreTekrar) {
      setHata('Girdiğiniz şifreler eşleşmiyor.');
      return;
    }

    if (yeniSifre.length < 4) {
      setHata('Güvenliğiniz için şifre en az 4 karakter olmalıdır.');
      return;
    }

    setYukleniyor(true);

    try {
      const cevap = await fetch(`${API_BASE}/Auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          EPosta: kullaniciAdi,
          Kod: aktivasyonKodu,
          YeniSifre: yeniSifre
        })
      });

      if (cevap.ok) {
        const veri = await cevap.json();
        const token = veri.token || veri.Token;
        const ad = veri.ad || veri.Ad;
        const soyad = veri.soyad || veri.Soyad;
        const rol = veri.rol || veri.Rol;
        girisYap(token, ad, soyad, rol);
        navigate('/');
      } else {
        const mesaj = await parseApiError(cevap, 'Aktivasyon kodu hatalı veya süresi geçmiş.');
        setHata(mesaj);
      }
    } catch {
      setHata('Sunucuya bağlanılamadı. API servisinin çalıştığından emin olun.');
    } finally {
      setYukleniyor(false);
    }
  };

  const hizliDoldur = (username, password = '123') => {
    setKullaniciAdi(username);
    setSifre(password);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 font-sans text-zinc-800">

      {/* 🏛️ MODERN MINIMALIST GİRİŞ KARTI (Yatay Düzen) */}
      <div className="premium-card w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-white">

        {/* ── SOL TARAF: MARKA & LOGO HERO ALANI (5 SÜTUN) ── */}
        <div className="md:col-span-5 bg-zinc-50/50 p-8 flex flex-col justify-between items-center text-center border-b md:border-b-0 md:border-r border-zinc-200 min-h-[380px] md:min-h-[500px]">
          <div></div>

          <div className="flex flex-col items-center my-auto space-y-6">
            <MediCoreLogo size="md" isDark={geceModu} />
            <div className="space-y-1 text-center">
              <h1 
                style={{ color: geceModu ? '#4F9CD9' : '#142A4A' }}
                className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center font-poppins select-none"
              >
                MediCore
              </h1>
              <p 
                style={{ color: geceModu ? '#8ECAE6' : '#3E5C76' }}
                className="text-[10.5px] font-bold uppercase tracking-[0.25em] font-poppins mt-0.5 select-none"
              >
                HASTA BAKIM SİSTEMİ
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            MediCore v1.0 • Enterprise Edition
          </div>
        </div>

        {/* ── SAĞ TARAF: GİRİŞ FORMU & KISAYOLLAR (7 SÜTUN) ── */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div>
            {!ilkGiris ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-xs font-bold ${ilkGirisTalebi ? 'text-emerald-600' : 'text-zinc-500'} uppercase tracking-wider font-mono`}>
                      {ilkGirisTalebi ? 'İlk Giriş Aktivasyonu' : 'Sisteme Giriş Yap'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {ilkGirisTalebi
                        ? 'Lütfen kayıtlı Kullanıcı Adınızı veya E-Postanızı girerek aktivasyon kodunuzu talep edin.'
                        : 'Lütfen kullanıcı kimlik bilgilerinizi giriniz.'}
                    </p>
                    {ilkGirisTalebi && (
                      <p className="mt-3 text-[10px] text-zinc-400 leading-relaxed font-mono">
                        Bilgi: Kullanıcı adınız unvan öneki (dr_ / hem_ / per_) ile isminizin baş harfleri ve soyisminizin birleşiminden oluşur (Örn: dr_moz, hem_akaya).
                      </p>
                    )}
                  </div>

                  {/* 🌙 Gece / Gündüz Modu Butonu (Giriş Yap ile Aynı Renk & Stilde) */}
                  <button
                    type="button"
                    onClick={() => setGeceModu(!geceModu)}
                    title={geceModu ? "Gündüz Moduna Geç" : "Gece Moduna Geç"}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-md shadow-primary/20 active:scale-95"
                  >
                    {geceModu ? (
                      <>
                        <Sun size={14} strokeWidth={2.2} className="text-white shrink-0" />
                        <span className="text-[10.5px] text-white font-mono font-bold">Gündüz</span>
                      </>
                    ) : (
                      <>
                        <Moon size={14} strokeWidth={2.2} className="text-white shrink-0" />
                        <span className="text-[10.5px] text-white font-mono font-bold">Gece</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hata Mesajı */}
                {hata && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 rounded-lg border border-red-200 animate-pulse">
                    <span className="font-bold">!</span>
                    <span>{hata}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Kullanıcı Adı / E-Posta
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: dr_aterol"
                      className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-zinc-400"
                      value={kullaniciAdi}
                      onChange={(e) => setKullaniciAdi(e.target.value)}
                    />
                  </div>

                  {!ilkGirisTalebi && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                        Şifre
                      </label>
                      <input
                        type="password"
                        placeholder="••••••"
                        className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-zinc-400"
                        value={sifre}
                        onChange={(e) => setSifre(e.target.value)}
                      />
                    </div>
                  )}

                  {/* GİRİŞ BUTONU */}
                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className={`w-full h-10 mt-2 ${ilkGirisTalebi ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' : 'bg-primary hover:bg-primary-hover shadow-primary/10'} text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-all duration-200 shadow-md disabled:opacity-50 cursor-pointer`}
                  >
                    {yukleniyor
                      ? 'İŞLEM YAPILIYOR...'
                      : (ilkGirisTalebi ? 'AKTİVASYON KODU GÖNDER' : 'GİRİŞ YAP')}
                  </button>

                  <div className="text-center pt-2">
                    {ilkGirisTalebi ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIlkGirisTalebi(false);
                          setHata('');
                          setKullaniciAdi('');
                          setSifre('');
                        }}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider font-mono cursor-pointer transition-colors"
                      >
                        ← Normal Giriş Ekranına Dön
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIlkGirisTalebi(true);
                          setHata('');
                          setSifre('');
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider font-mono cursor-pointer transition-colors"
                      >
                        İlk girişiniz mi? Hesabınızı aktive edin →
                      </button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      İlk Giriş & Şifre Aktivasyonu
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      Sistemde ilk kez oturum açtığınız tespit edilmiştir. Güvenliğiniz için kayıtlı iletişim bilgilerinize gönderilen <b>6 haneli geçici kodu (OTP)</b> ve kullanmak istediğiniz <b>yeni şifrenizi</b> tanımlayınız.
                    </p>
                  </div>

                  {/* 🌙 Gece / Gündüz Modu Butonu */}
                  <button
                    type="button"
                    onClick={() => setGeceModu(!geceModu)}
                    title={geceModu ? "Gündüz Moduna Geç" : "Gece Moduna Geç"}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 border border-zinc-300 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    {geceModu ? (
                      <>
                        <Sun size={13} strokeWidth={2} className="text-zinc-300 shrink-0" />
                        <span className="text-[10px] text-zinc-200 font-mono">Gündüz</span>
                      </>
                    ) : (
                      <>
                        <Moon size={13} strokeWidth={2} className="text-zinc-600 shrink-0" />
                        <span className="text-[10px] text-zinc-600 font-mono">Gece</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hata Mesajı */}
                {hata && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 rounded-lg border border-red-200">
                    <span className="font-bold">!</span>
                    <span>{hata}</span>
                  </div>
                )}

                <form onSubmit={handleActivate} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 font-mono">
                      Kullanıcı Hesabı (E-Posta)
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full h-10 px-3 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-500 cursor-not-allowed font-mono"
                      value={kullaniciAdi}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Geçici Aktivasyon Kodu (OTP)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Örn: 123456"
                      className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold tracking-widest text-center text-zinc-800 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-zinc-400 font-mono"
                      value={aktivasyonKodu}
                      onChange={(e) => setAktivasyonKodu(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                        Yeni Şifre
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••"
                        className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-zinc-400"
                        value={yeniSifre}
                        onChange={(e) => setYeniSifre(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                        Yeni Şifre (Tekrar)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••"
                        className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:outline-none focus:border-primary focus:bg-white transition-all duration-200 placeholder:text-zinc-400"
                        value={yeniSifreTekrar}
                        onChange={(e) => setYeniSifreTekrar(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ONAY BUTONU */}
                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="w-full h-10 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-all duration-200 shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
                  >
                    {yukleniyor ? 'İŞLEM YAPILIYOR...' : 'AKTİVASYONU TAMAMLA VE GİRİŞ YAP'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIlkGiris(false);
                        setHata('');
                        setSifre('');
                        setAktivasyonKodu('');
                        setYeniSifre('');
                        setYeniSifreTekrar('');
                      }}
                      className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider font-mono cursor-pointer transition-colors"
                    >
                      ← Giriş Ekranına Dön
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Hızlı Giriş Kısayol Kartları (Yalnızca Geliştirici Modunda Görünür) */}
          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-zinc-200">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 font-mono">
                <span>Hızlı Giriş Kısayolları</span>
                <span>Geliştirici Modu</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => hizliDoldur('a', '')}
                  className="p-1.5 bg-zinc-50 hover:bg-primary-light hover:text-primary border border-zinc-200 rounded-lg transition-all duration-200 text-center cursor-pointer group"
                >
                  <div className="text-[9px] font-bold text-zinc-700 group-hover:text-primary truncate">Başhekim</div>
                  <div className="text-[8px] text-zinc-500 font-mono mt-0.5">a</div>
                </button>

                <button
                  type="button"
                  onClick={() => hizliDoldur('bh', '')}
                  className="p-1.5 bg-zinc-50 hover:bg-primary-light hover:text-primary border border-zinc-200 rounded-lg transition-all duration-200 text-center cursor-pointer group"
                >
                  <div className="text-[9px] font-bold text-zinc-700 group-hover:text-primary truncate">Başhemşire</div>
                  <div className="text-[8px] text-zinc-500 font-mono mt-0.5">bh</div>
                </button>

                <button
                  type="button"
                  onClick={() => hizliDoldur('y', '')}
                  className="p-1.5 bg-zinc-50 hover:bg-primary-light hover:text-primary border border-zinc-200 rounded-lg transition-all duration-200 text-center cursor-pointer group"
                >
                  <div className="text-[9px] font-bold text-zinc-700 group-hover:text-primary truncate">Yönetici</div>
                  <div className="text-[8px] text-zinc-500 font-mono mt-0.5">y</div>
                </button>

                <button
                  type="button"
                  onClick={() => hizliDoldur('d', '')}
                  className="p-1.5 bg-zinc-50 hover:bg-primary-light hover:text-primary border border-zinc-200 rounded-lg transition-all duration-200 text-center cursor-pointer group"
                >
                  <div className="text-[9px] font-bold text-zinc-700 group-hover:text-primary truncate">Hekim</div>
                  <div className="text-[8px] text-zinc-500 font-mono mt-0.5">d</div>
                </button>

                <button
                  type="button"
                  onClick={() => hizliDoldur('h', '')}
                  className="p-1.5 bg-zinc-50 hover:bg-primary-light hover:text-primary border border-zinc-200 rounded-lg transition-all duration-200 text-center cursor-pointer group"
                >
                  <div className="text-[9px] font-bold text-zinc-700 group-hover:text-primary truncate">Hemşire</div>
                  <div className="text-[8px] text-zinc-500 font-mono mt-0.5">h</div>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Login;