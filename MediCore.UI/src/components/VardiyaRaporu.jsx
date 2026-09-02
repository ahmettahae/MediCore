import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, PenLine, ClipboardList, AlertTriangle, Printer, FileSpreadsheet } from 'lucide-react';
import { exportToCsv, printReport } from '../utils/exportUtils';
import { API_BASE } from '../config/api';

const VardiyaRaporu = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const [raporGecmisi, setRaporGecmisi] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');

  const [yeniRapor, setYeniRapor] = useState({
    teslimAlan: '',
    genelDurum: 'Sakin - Rutin İşleyiş',
    notlar: '',
    eksiklikler: ''
  });

  const getUnvan = (adSoyad) => {
    if (!adSoyad) return '';
    const found = personeller.find(p => p.adSoyad.toLowerCase() === adSoyad.toLowerCase());
    return found ? found.unvan : 'Sağlık Personeli';
  };

  const aktifKullanici = kullanici ? `${kullanici.ad} ${kullanici.soyad}` : '';
  const aktifKullaniciUnvan = kullanici?.rol === 'Bashekim' ? 'Başhekim' : kullanici?.rol === 'Bashemsire' ? 'Başhemşire' : kullanici?.rol === 'Yonetici' ? 'İdari Denetçi' : kullanici?.rol === 'Doktor' ? 'Kurum Hekimi' : 'Hemşire';

  const fetchPersoneller = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Personel`, { headers: getAuthHeaders() });
      if (res.ok) setPersoneller(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  const fetchRaporlar = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/VardiyaRaporu`, { headers: getAuthHeaders() });
      if (res.ok) setRaporGecmisi(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchRaporlar();
    fetchPersoneller();
  }, [fetchRaporlar, fetchPersoneller]);

  const handleExcelExport = () => {
    if (!raporGecmisi || raporGecmisi.length === 0) return;
    const headers = ['ID', 'Tarih', 'Teslim Eden', 'Teslim Alan', 'Genel Durum', 'Vardiya Notları', 'Kritik Uyarılar / Eksiklikler'];
    const rows = raporGecmisi.map(r => [
      r.id,
      r.tarih ? new Date(r.tarih).toLocaleString('tr-TR') : '',
      r.teslimEden || '',
      r.teslimAlan || '',
      r.genelDurum || '',
      r.notlar || '',
      r.eksiklikler || ''
    ]);
    exportToCsv(`MediCore_Vardiya_Teslim_Raporlari_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handlePdfPrint = () => {
    printReport('Resmi Vardiya Devir Teslim Raporu', 'vardiya-raporlari-listesi');
  };

  const handleRaporKaydet = async (e) => {
    e.preventDefault();
    if (!yeniRapor.teslimAlan || !yeniRapor.notlar) {
      showToast('Lütfen teslim alan personel ve takip notları alanlarını doldurun.', 'warning');
      return;
    }

    try {
      const gonderilecekRapor = {
        ...yeniRapor,
        teslimEden: aktifKullanici,
        eksiklikler: yeniRapor.eksiklikler || 'Yok'
      };

      const h = getAuthHeaders();
      const res = await fetch(`${API_BASE}/VardiyaRaporu`, {
        method: 'POST',
        headers: {
          ...h,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gonderilecekRapor)
      });
      if (res.ok) {
        setYeniRapor({ teslimAlan: '', genelDurum: 'Sakin - Rutin İşleyiş', notlar: '', eksiklikler: '' });
        fetchRaporlar();
        showToast('Vardiya teslim raporu kaydedildi ve imzalandı.', 'success');
      } else {
        showToast('Rapor kaydedilemedi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const raporSil = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/VardiyaRaporu/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchRaporlar();
        showToast('Teslim raporu silindi.', 'info');
      } else {
        showToast('Silme işlemi başarısız veya yetkiniz yok.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Sunucu hatası oluştu.', 'error');
    }
  };

  const filtrelenmisRaporlar = raporGecmisi.filter(r =>
    ((r.teslimAlan || '') + (r.teslimEden || '') + (r.notlar || '') + (r.genelDurum || '')).toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div className="space-y-3.5 font-sans text-primary pb-10 max-w-6xl mx-auto">
      {/* ── MONOKROM BAŞLIK & ARAMA ── */}
      <div className="bg-white rounded-xl border border-primary p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText size={20} strokeWidth={2} className="text-primary shrink-0" />
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
              Vardiya Devir Teslim & Nöbet Raporu
            </h1>
            <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
              Sağlık Personeli Devir Teslim Formu ve Geçmiş Kayıtlar
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={handleExcelExport}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet size={13} />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePdfPrint}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer size={13} />
            <span>Resmi PDF / Yazdır</span>
          </button>
          <div className="w-full sm:w-48">
            <input
              type="text"
              placeholder="Ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-300 text-xs font-bold text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ── YENİ RAPOR FORMU (5 Kolon) ── */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-primary p-3.5 shadow-2xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-primary border-b border-zinc-200 pb-1.5 mb-3 flex items-center gap-1.5">
            <PenLine size={13} strokeWidth={2.2} />
            <span>Yeni Nöbet Teslim Formu</span>
          </h2>

          <form className="space-y-2.5 text-xs" onSubmit={handleRaporKaydet}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">
                  Teslim Eden
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full h-8 rounded-lg border border-zinc-300 px-2 text-[11px] font-bold bg-zinc-100 text-zinc-600 focus:outline-none cursor-not-allowed"
                  value={`${aktifKullanici} (${aktifKullaniciUnvan})`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">
                  Teslim Alan
                </label>
                <select
                  required
                  className="w-full h-8 rounded-lg border border-zinc-400 px-2 text-[11px] font-bold bg-white focus:outline-none focus:border-primary cursor-pointer"
                  value={yeniRapor.teslimAlan}
                  onChange={(e) => setYeniRapor({ ...yeniRapor, teslimAlan: e.target.value })}
                >
                  <option value="">-- Personel Seçin --</option>
                  {personeller.map(p => (
                    <option key={p.id} value={p.adSoyad}>{p.adSoyad} ({p.unvan})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">
                Genel Vardiya Durumu
              </label>
              <select
                className="w-full h-8 rounded-lg border border-zinc-400 px-2 text-[11px] font-bold bg-white focus:outline-none focus:border-primary cursor-pointer"
                value={yeniRapor.genelDurum}
                onChange={(e) => setYeniRapor({ ...yeniRapor, genelDurum: e.target.value })}
              >
                <option value="Sakin - Rutin İşleyiş">Sakin - Rutin İşleyiş</option>
                <option value="Yoğun - Sürekli Takip Gerektirdi">Yoğun - Sürekli Takip Gerektirdi</option>
                <option value="Kritik - Acil Durumlar Yaşandı">Kritik - Acil Durumlar Yaşandı</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">
                Önemli Hastalar & Takip Notları
              </label>
              <textarea
                rows="3"
                className="w-full rounded-lg border border-zinc-400 p-2 text-xs font-medium bg-zinc-50 focus:outline-none focus:border-primary resize-none placeholder:text-zinc-400 font-sans"
                placeholder="Örn: 102 nolu hastanın tansiyonu takip edilecek..."
                value={yeniRapor.notlar}
                onChange={(e) => setYeniRapor({ ...yeniRapor, notlar: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">
                Eksiklikler / İlaç Malzeme İhtiyacı (Varsa)
              </label>
              <input
                type="text"
                className="w-full h-8 rounded-lg border border-zinc-300 px-2 text-xs font-medium bg-zinc-50 focus:outline-none focus:border-primary placeholder:text-zinc-400"
                placeholder="Varsa eksik araç, gereç veya stok..."
                value={yeniRapor.eksiklikler}
                onChange={(e) => setYeniRapor({ ...yeniRapor, eksiklikler: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full h-8 mt-1 rounded-lg bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-hover transition-colors cursor-pointer shadow-2xs"
            >
              Raporu Kaydet ve İmzala
            </button>
          </form>
        </div>

        {/* ── GEÇMİŞ RAPORLAR (7 Kolon) ── */}
        <div id="vardiya-raporlari-listesi" className="lg:col-span-7 bg-white rounded-xl border border-primary p-3.5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5 mb-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ClipboardList size={13} strokeWidth={2.2} />
              <span>Geçmiş Teslim Raporları ({filtrelenmisRaporlar.length})</span>
            </h2>
          </div>

          {filtrelenmisRaporlar.length === 0 ? (
            <div className="text-xs font-bold text-zinc-500 text-center py-8">
              Kayıtlı devir teslim raporu bulunamadı.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
              {filtrelenmisRaporlar.map((rapor) => {
                const edenUnvan = getUnvan(rapor.teslimEden);
                const alanUnvan = getUnvan(rapor.teslimAlan);
                return (
                  <div key={rapor.id} className="bg-zinc-50/80 rounded-lg border border-zinc-300 p-2.5 flex flex-col gap-1.5 hover:border-primary transition-colors">
                    {/* Üst: Tarih + Durum Rozeti */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase font-mono text-primary">
                          {new Date(rapor.tarih).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span className="text-[9px] font-bold bg-white px-1.5 py-0.2 rounded border border-zinc-300">
                          #{rapor.id}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded border bg-primary text-white border-primary font-mono">
                        {rapor.genelDurum.split(' - ')[0]}
                      </span>
                    </div>

                    {/* Teslim Eden → Alan */}
                    <div className="bg-white rounded border border-zinc-200 px-2 py-1 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-primary">{rapor.teslimEden}</span>
                        <span className="text-[9px] text-zinc-500 ml-1">({edenUnvan})</span>
                      </div>
                      <span className="text-zinc-400 font-black">→</span>
                      <div className="text-right">
                        <span className="font-bold text-primary">{rapor.teslimAlan}</span>
                        <span className="text-[9px] text-zinc-500 ml-1">({alanUnvan})</span>
                      </div>
                    </div>

                    {/* Notlar */}
                    <p className="text-[11px] font-medium text-zinc-800 leading-snug">
                      {rapor.notlar}
                    </p>

                    {/* Eksiklik Uyarısı */}
                    {rapor.eksiklikler && rapor.eksiklikler !== 'Yok' && (
                      <div className="text-[9px] font-bold uppercase bg-zinc-200 text-primary border border-zinc-400 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={10} strokeWidth={2.5} className="inline mr-0.5" /> {rapor.eksiklikler}
                      </div>
                    )}

                    {/* Sil Butonu */}
                    {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') && (
                      <button
                        onClick={() => raporSil(rapor.id)}
                        className="text-[10px] font-bold text-red-600 hover:underline self-end cursor-pointer"
                      >
                        Raporu Sil
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VardiyaRaporu;
