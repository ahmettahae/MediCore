import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, RefreshCw, Search, ShieldAlert, ArrowLeft, ChevronLeft, ChevronRight, User, Shield, Activity, Globe, CheckCircle2, FileSpreadsheet, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { exportToCsv, printReport } from '../utils/exportUtils';
import { API_BASE } from '../config/api';

const SistemLoglari = () => {
  const { getAuthHeaders } = useAuth();
  const [loglar, setLoglar] = useState([]);
  const [islemTurleri, setIslemTurleri] = useState([]);
  const [toplamKayit, setToplamKayit] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  
  // Filtre durumları
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenIslemTuru, setSecilenIslemTuru] = useState('');
  const [limit, setLimit] = useState(20);
  
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [sayfa, limit, secilenIslemTuru]);

  const fetchLogs = async () => {
    setYukleniyor(true);
    setHata(null);
    const headers = getAuthHeaders ? getAuthHeaders() : {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('userToken')}`
    };

    try {
      let url = `${API_BASE}/Dashboard/aktivite-loglari?sayfa=${sayfa}&limit=${limit}`;
      if (aramaMetni.trim()) {
        url += `&arama=${encodeURIComponent(aramaMetni)}`;
      }
      if (secilenIslemTuru) {
        url += `&islemTuru=${encodeURIComponent(secilenIslemTuru)}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setLoglar(data.loglar);
        setToplamKayit(data.toplamKayit);
        setToplamSayfa(data.toplamSayfa);
        if (data.islemTurleri) {
          setIslemTurleri(data.islemTurleri);
        }
      } else {
        if (res.status === 403) {
          setHata('Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.');
        } else {
          setHata(`Aktivite logları yüklenirken hata oluştu (HTTP ${res.status}).`);
        }
      }
    } catch (err) {
      console.error('Aktivite log çekme hatası:', err);
      setHata('Sunucuya bağlanılamadı. API sunucusunun çalıştığından emin olun.');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleAramaSubmit = (e) => {
    e.preventDefault();
    setSayfa(1);
    fetchLogs();
  };

  const handleFiltreTemizle = () => {
    setAramaMetni('');
    setSecilenIslemTuru('');
    setSayfa(1);
    // State güncellemelerinden sonra fetchLogs tetiklenmesi için:
    setTimeout(() => fetchLogs(), 50);
  };

  const handleExcelExport = () => {
    if (!loglar || loglar.length === 0) return;
    const headers = ['ID', 'Tarih', 'Kullanıcı', 'Rol', 'İşlem Türü', 'Açıklama / Detay', 'IP Adresi'];
    const rows = loglar.map(l => [
      l.id,
      l.tarih ? new Date(l.tarih).toLocaleString('tr-TR') : '',
      l.kullanici || '',
      l.rol || '',
      l.islemTuru || '',
      l.detay || '',
      l.ipAdresi || ''
    ]);
    exportToCsv(`MediCore_Aktivite_Loglari_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handlePdfPrint = () => {
    printReport('Klinik & İdari Aktivite Geçmişi (Audit Trail)', 'sistem-loglari-tablo');
  };

  // İşlem Türü rozet renkleri
  const getIslemTuruStyle = (tur) => {
    switch (tur) {
      case 'Sistem Girişi':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Hasta Kaydı':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Hasta Güncelleme':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hasta Silme':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'İlaç Uygulama':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Vital Veri Girişi':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Hekim Muayenesi':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Hasta Sevk':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  // Rol etiket stilleri
  const getRolStyle = (rol) => {
    switch (rol) {
      case 'Bashekim':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Bashemsire':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Yonetici':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Doktor':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Hemsire':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-zinc-50 text-zinc-500 border-zinc-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* ── ÜST BAŞLIK BÖLÜMÜ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h2 className="text-lg font-black tracking-tight text-zinc-800 flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Klinik & İdari Aktivite Geçmişi
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium ml-7 mt-0.5">
            Hasta kayıtları, vital bulgular, ilaç uygulamaları ve kullanıcı girişlerini içeren resmi denetim günlüğü (Audit Trail).
          </p>
        </div>

        <div className="flex items-center gap-2 ml-7 sm:ml-0 font-mono flex-wrap">
          <button
            type="button"
            onClick={handleExcelExport}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet size={14} />
            <span>Excel'e Aktar</span>
          </button>
          <button
            type="button"
            onClick={handlePdfPrint}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer size={14} />
            <span>Yazdır / PDF</span>
          </button>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
            <span>KVKK Uyumlu</span>
          </span>
        </div>
      </div>

      {/* ── FİLTRELER BÖLÜMÜ ── */}
      <div className="bg-white p-3.5 border border-zinc-200 rounded-lg shadow-2xs space-y-3">
        <form onSubmit={handleAramaSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Arama İnput */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Personel adı, rol veya kayıt detaylarında ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-300 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary rounded-lg text-xs font-semibold placeholder-zinc-400 outline-hidden transition-all"
            />
          </div>

          {/* İşlem Türü Seçici */}
          <div>
            <select
              value={secilenIslemTuru}
              onChange={(e) => {
                setSecilenIslemTuru(e.target.value);
                setSayfa(1);
              }}
              className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-800 cursor-pointer outline-hidden focus:border-primary"
            >
              <option value="">Tüm İşlem Türleri</option>
              {islemTurleri.map((t, idx) => (
                <option key={idx} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer text-center"
            >
              Ara
            </button>
            <button
              type="button"
              onClick={handleFiltreTemizle}
              className="px-2.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Sıfırla
            </button>
          </div>
        </form>
      </div>

      {/* ── AUDIT TABLOSU BÖLÜMÜ ── */}
      {hata ? (
        <div className="premium-card p-8 text-center bg-red-50 border-red-200">
          <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600 mb-3">
            <ShieldAlert size={24} />
          </div>
          <h4 className="text-sm font-bold text-red-800">Erişim Yetkisi Hatası</h4>
          <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{hata}</p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden bg-white border border-zinc-200 flex flex-col shadow-2xs">
          {/* Liste Bilgi Çubuğu */}
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-zinc-500 text-[11px] font-bold">
            <span className="font-mono">EN YENİ İŞLEMLER EN ÜSTTEDİR</span>
            <span>Toplam {toplamKayit} işlem kaydı listeleniyor</span>
          </div>

          {/* Tablo Tasarımı */}
          <div id="sistem-loglari-tablo" className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500 font-bold text-[10px] tracking-wider font-sans">
                  <th className="px-4 py-2.5 w-40">ZAMAN DAMGASI</th>
                  <th className="px-4 py-2.5 w-44">İŞLEMİ YAPAN</th>
                  <th className="px-4 py-2.5 w-36">İŞLEM TÜRÜ</th>
                  <th className="px-4 py-2.5">İŞLEM DETAYI / AÇIKLAMA</th>
                  <th className="px-4 py-2.5 w-24">IP ADRESİ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans text-xs">
                {yukleniyor && loglar.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-zinc-400 font-medium">
                      <RefreshCw size={18} className="animate-spin inline mr-2 text-zinc-300" />
                      Aktivite kayıtları okunuyor...
                    </td>
                  </tr>
                ) : loglar.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-zinc-400 font-medium">
                      Kayıtlı aktivite bulunamadı.
                    </td>
                  </tr>
                ) : (
                  loglar.map((log, idx) => (
                    <tr key={log.id} className={`hover:bg-zinc-50/50 transition-colors ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                      {/* 1. Tarih */}
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {log.tarih ? new Date(log.tarih).toLocaleDateString('tr-TR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        }) : '—'}
                      </td>

                      {/* 2. Kullanıcı & Rol */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-zinc-400" />
                          <span className="font-bold text-zinc-800">{log.kullanici}</span>
                          <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded-sm border ${getRolStyle(log.rol)}`}>
                            {log.rol}
                          </span>
                        </div>
                      </td>

                      {/* 3. İşlem Türü */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase text-center w-full ${getIslemTuruStyle(log.islemTuru)}`}>
                          {log.islemTuru}
                        </span>
                      </td>

                      {/* 4. İşlem Detayı */}
                      <td className="px-4 py-3 text-zinc-700 leading-normal font-medium">
                        {log.detay}
                      </td>

                      {/* 5. IP Adresi */}
                      <td className="px-4 py-3 text-zinc-400 font-mono text-[10px]">
                        <div className="flex items-center gap-1">
                          <Globe size={10} className="text-zinc-300" />
                          <span>{log.ipAdresi || '::1'}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── SAYFALAMA (PAGINATION) BÖLÜMÜ ── */}
          {toplamSayfa > 1 && (
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <div className="text-[11px] font-medium text-zinc-500">
                Sayfa <span className="font-bold text-zinc-800">{sayfa}</span> / <span className="font-bold text-zinc-800">{toplamSayfa}</span> (Toplam {toplamKayit} Kayıt)
              </div>

              <div className="flex items-center gap-1">
                {/* Önceki Sayfa */}
                <button
                  type="button"
                  onClick={() => setSayfa(prev => Math.max(prev - 1, 1))}
                  disabled={sayfa === 1 || yukleniyor}
                  className="p-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Sayfa Butonları */}
                {Array.from({ length: toplamSayfa }, (_, idx) => idx + 1)
                  .filter(p => Math.abs(p - sayfa) <= 2 || p === 1 || p === toplamSayfa)
                  .map((p, idx, arr) => {
                    const isEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <div key={p} className="flex items-center">
                        {isEllipsis && <span className="px-1.5 text-zinc-400 font-bold">...</span>}
                        <button
                          type="button"
                          onClick={() => setSayfa(p)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            sayfa === p
                              ? 'bg-primary text-white shadow-xs'
                              : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}

                {/* Sonraki Sayfa */}
                <button
                  type="button"
                  onClick={() => setSayfa(prev => Math.min(prev + 1, toplamSayfa))}
                  disabled={sayfa === toplamSayfa || yukleniyor}
                  className="p-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SistemLoglari;
