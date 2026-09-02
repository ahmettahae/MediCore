import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorUtils';
import { X, BarChart2, Printer, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { API_BASE } from '../config/api';

const API = `${API_BASE}/Ilac`;

const BOS_FORM = {
  barkod: '', ad: '', etkenMadde: '', form: '',
  ureticiFirma: '', kritikStokSeviyesi: 10
};

const FORM_SECENEK = ['Tablet', 'Kapsül', 'Şurup', 'Ampul', 'Flakon', 'Merhem', 'Damla', 'İnhaler', 'Patch', 'Diğer'];

const SortIcon = ({ alan, siralaAlan, siralaYon }) => {
  if (siralaAlan !== alan) return <ArrowUpDown size={12} className="text-zinc-400 shrink-0" />;
  return siralaYon === 'asc' 
    ? <ArrowUp size={12} className="text-primary shrink-0" />
    : <ArrowDown size={12} className="text-primary shrink-0" />;
};

// FormInput bileşeni ana bileşenin dışında tanımlanır ki React her state değişiminde input odağını (focus) kaybetmesin
const FormInput = ({ label, value, onChange, type = 'text', required = false, placeholder = '', ...rest }) => (
  <div>
    <label className="block text-[11px] font-black text-primary uppercase mb-1">{label}</label>
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      className="w-full h-9 px-2 border border-primary rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black placeholder:font-normal bg-white"
      value={value ?? ''}
      onChange={onChange}
      {...rest}
    />
  </div>
);

const IlacListesi = () => {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const baslangicArama = queryParams.get('q') || '';

  const [ilaclar, setIlaclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState(baslangicArama);
  const [modalMod, setModalMod] = useState(null); // null | 'ekle' | 'duzenle'
  const [silOnayId, setSilOnayId] = useState(null);
  const [filtreStok, setFiltreStok] = useState('Tümü');
  const [filtreForm, setFiltreForm] = useState('Tümü');
  const [form, setForm] = useState(BOS_FORM);
  const [suAn, setSuAn] = useState(new Date());

  // Kolon Sıralama Durumu
  const [siralaAlan, setSiralaAlan] = useState('ad'); // 'ad', 'barkod', 'toplamStok', 'enYakinSkt', 'ureticiFirma'
  const [siralaYon, setSiralaYon] = useState('asc'); // 'asc' | 'desc'

  const navigate = useNavigate();
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setAramaMetni(queryParams.get('q') || '');
  }, [queryParams]);

  useEffect(() => {
    const timer = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ilaclaGetir = useCallback(async (ara = '', showLoading = true) => {
    if (showLoading) setYukleniyor(true);
    try {
      const url = ara ? `${API}?ara=${encodeURIComponent(ara)}` : API;
      const cevap = await fetch(url, { headers: getAuthHeaders() });
      if (cevap.status === 401) { navigate('/login'); return; }
      if (cevap.ok) {
        const data = await cevap.json();
        setIlaclar(Array.isArray(data) ? data : []);
      } else {
        setIlaclar([]);
      }
    } catch (e) {
      console.error(e);
      setIlaclar([]);
      showToast('İlaçlar yüklenirken hata oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders, navigate, showToast]);

  useEffect(() => { ilaclaGetir('', true); }, [ilaclaGetir]);

  useEffect(() => {
    const t = setTimeout(() => ilaclaGetir(aramaMetni, false), 400);
    return () => clearTimeout(t);
  }, [aramaMetni, ilaclaGetir]);

  const handleFormDegis = (alan, deger) => {
    setForm(prev => ({ ...prev, [alan]: deger }));
  };

  const handleKaydet = async (e) => {
    e.preventDefault();
    const isEdit = modalMod === 'duzenle';
    const payload = { ...form, kritikStokSeviyesi: parseInt(form.kritikStokSeviyesi, 10) || 0 };

    try {
      const cevap = await fetch(isEdit ? `${API}/${form.id}` : API, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (cevap.ok) {
        setModalMod(null);
        setForm(BOS_FORM);
        ilaclaGetir(aramaMetni, false);
        showToast(isEdit ? 'İlaç bilgileri başarıyla güncellendi.' : 'Yeni ilaç başarıyla kaydedildi.', 'success');
      } else {
        const errMesaj = await parseApiError(cevap, 'İlaç kaydedilemedi.');
        showToast('İşlem başarısız: ' + errMesaj, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Sunucu bağlantı hatası oluştu.', 'error');
    }
  };

  const handleSil = async (id) => {
    try {
      const cevap = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (cevap.ok) { 
        setSilOnayId(null); 
        ilaclaGetir(aramaMetni, false); 
        showToast('İlaç ve ilişkili stok kayıtları silindi.', 'info');
      } else {
        const errMesaj = await parseApiError(cevap, 'Silme işlemi gerçekleştirilemedi.');
        showToast(errMesaj, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Silme işleminde hata oluştu.', 'error');
    }
  };

  const stokHizliDegistir = async (e, ilacId, miktar) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    // Optimistic UI Güncellemesi
    setIlaclar(prevIlaclar => prevIlaclar.map(i => {
      if (i.id === ilacId) {
        const yeniStok = Math.max(0, i.toplamStok + miktar);
        return {
          ...i,
          toplamStok: yeniStok,
          kritikMi: yeniStok <= i.kritikStokSeviyesi
        };
      }
      return i;
    }));

    const hedefIlac = ilaclar.find(i => i.id === ilacId);
    const ilacAdi = hedefIlac ? hedefIlac.ad : 'İlaç';

    try {
      await fetch(`${API_BASE}/IlacStok/hizli-degisim`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ilacId, miktar })
      });
      showToast(`${ilacAdi} stoku ${miktar > 0 ? '+1 arttırıldı' : '-1 azaltıldı'}.`, 'success', 2500, `stok_${ilacId}`);
    } catch (err) {
      console.error(err);
      ilaclaGetir(aramaMetni);
      showToast('Stok güncellenirken hata oluştu.', 'error');
    }
  };

  const duzenlemeAc = (ilac) => {
    setForm({
      id: ilac.id, barkod: ilac.barkod || '', ad: ilac.ad || '',
      etkenMadde: ilac.etkenMadde || '', form: ilac.form || '',
      ureticiFirma: ilac.ureticiFirma || '', kritikStokSeviyesi: ilac.kritikStokSeviyesi
    });
    setModalMod('duzenle');
  };

  const siralamayiDegistir = (alan) => {
    if (siralaAlan === alan) {
      setSiralaYon(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSiralaAlan(alan);
      setSiralaYon('asc');
    }
  };

  const ilacListesiArray = Array.isArray(ilaclar) ? ilaclar : [];

  // İstatistik Sayaçları
  const toplamCesit = ilacListesiArray.length;
  const toplamKutu = ilacListesiArray.reduce((toplam, i) => toplam + (i.toplamStok || 0), 0);
  const kritikSayisi = ilacListesiArray.filter(i => i.toplamStok > 0 && i.toplamStok <= i.kritikStokSeviyesi).length;
  const tukenenSayisi = ilacListesiArray.filter(i => i.toplamStok === 0).length;

  const siralanmisVeFiltrelenmisIlaclar = useMemo(() => {
    return ilacListesiArray
      .filter(i => {
        // Stok Filtresi
        let sUyum = true;
        if (filtreStok === 'Normal') {
          sUyum = i.toplamStok > i.kritikStokSeviyesi;
        } else if (filtreStok === 'Kritik') {
          sUyum = i.toplamStok > 0 && i.toplamStok <= i.kritikStokSeviyesi;
        } else if (filtreStok === 'StokYok') {
          sUyum = i.toplamStok === 0;
        }

        // Form Filtresi
        let fUyum = filtreForm === 'Tümü' || (i.form && i.form.toLowerCase() === filtreForm.toLowerCase());

        return sUyum && fUyum;
      })
      .sort((a, b) => {
        let valA = a[siralaAlan];
        let valB = b[siralaAlan];

        if (siralaAlan === 'toplamStok') {
          valA = a.toplamStok || 0;
          valB = b.toplamStok || 0;
          return siralaYon === 'asc' ? valA - valB : valB - valA;
        }

        if (siralaAlan === 'enYakinSkt') {
          valA = a.enYakinSkt ? new Date(a.enYakinSkt).getTime() : Infinity;
          valB = b.enYakinSkt ? new Date(b.enYakinSkt).getTime() : Infinity;
          return siralaYon === 'asc' ? valA - valB : valB - valA;
        }

        valA = (valA || '').toString().toLocaleLowerCase('tr-TR');
        valB = (valB || '').toString().toLocaleLowerCase('tr-TR');

        if (siralaYon === 'asc') {
          return valA.localeCompare(valB, 'tr-TR');
        } else {
          return valB.localeCompare(valA, 'tr-TR');
        }
      });
  }, [ilacListesiArray, filtreStok, filtreForm, siralaAlan, siralaYon]);

  // Excel / CSV Export İşlevi (UTF-8 BOM ile Türkçe Karakter Uyumlu)
  const excelExportYap = () => {
    if (siralanmisVeFiltrelenmisIlaclar.length === 0) {
      showToast('Dışa aktarılacak ilaç kaydı bulunamadı.', 'warning');
      return;
    }

    const basliklar = ['Barkod', 'İlaç Adı', 'Etken Madde', 'Form', 'Üretici Firma', 'Mevcut Stok', 'Kritik Stok Eşiği', 'Stok Durumu', 'En Yakın SKT'];
    const satirlar = siralanmisVeFiltrelenmisIlaclar.map(i => [
      `"${i.barkod || '-'}"`,
      `"${i.ad || ''}"`,
      `"${i.etkenMadde || '-'}"`,
      `"${i.form || '-'}"`,
      `"${i.ureticiFirma || '-'}"`,
      i.toplamStok || 0,
      i.kritikStokSeviyesi || 0,
      `"${i.toplamStok === 0 ? 'Stok Yok' : i.toplamStok <= i.kritikStokSeviyesi ? 'Kritik' : 'Normal'}"`,
      `"${i.enYakinSkt ? new Date(i.enYakinSkt).toLocaleDateString('tr-TR') : '-'}"`
    ]);

    const csvIcerik = '\uFEFF' + [basliklar.join(';'), ...satirlar.map(s => s.join(';'))].join('\r\n');
    const blob = new Blob([csvIcerik], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const tarihStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `MediCore_Ilac_Stok_Listesi_${tarihStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('İlaç stok listesi Excel/CSV formatında indirildi.', 'success');
  };

  // Yazdır / PDF Çıktısı
  const yazdir = () => {
    window.print();
  };

  const getSktDurumu = (enYakinSkt) => {
    if (!enYakinSkt) return { metin: 'Parti Yok', badge: 'bg-slate-100 text-primary/50 border-primary/20' };
    const bugun = new Date();
    const skt = new Date(enYakinSkt);
    const farkGun = Math.ceil((skt - bugun) / (1000 * 60 * 60 * 24));

    if (farkGun < 0) {
      return { metin: 'SKT DOLMUŞ', badge: 'bg-primary text-white border-primary font-black' };
    }
    if (farkGun <= 30) {
      return { metin: `${farkGun} gün kaldı`, badge: 'bg-amber-300 text-primary border-primary font-black' };
    }
    return { 
      metin: skt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }), 
      badge: 'bg-slate-50 text-primary border-primary/30' 
    };
  };

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      
      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Ecza Dolabı & İlaç Stok Listesi
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Toplam {toplamCesit} İlaç Çeşidi • {toplamKutu} Kutu Stok
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder="İlaç, Barkod veya Etken Ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full h-6 text-xs font-bold text-primary bg-transparent focus:outline-none placeholder:text-zinc-400"
            />
            {aramaMetni && (
              <button 
                type="button" 
                onClick={() => setAramaMetni('')}
                className="text-[10px] font-bold text-zinc-400 hover:text-primary px-1 cursor-pointer"
              >
              <X size={11} strokeWidth={2.5} />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={excelExportYap}
            className="h-8 px-2.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            title="Excel formatında indir"
          >
            <BarChart2 size={14} strokeWidth={2.2} />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={yazdir}
            className="h-8 px-2.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            title="Yazdır"
          >
            <Printer size={14} strokeWidth={2.2} />
            <span>Yazdır</span>
          </button>

          {kullanici?.rol === 'Bashekim' && (
            <button
              onClick={() => { setForm(BOS_FORM); setModalMod('ekle'); }}
              className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center shrink-0 cursor-pointer shadow-2xs"
            >
              + Yeni İlaç
            </button>
          )}
        </div>
      </div>

      {/* ── 2. MİNİ ÖZET İSTATİSTİK SAYAÇLARI ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="bg-white rounded-xl border border-primary p-3 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 font-mono tracking-wider">Kayıtlı İlaç</span>
          <div className="text-xl font-black text-primary font-mono mt-1">{toplamCesit} <span className="text-xs font-normal text-zinc-500">Çeşit</span></div>
        </div>

        <div className="bg-white rounded-xl border border-primary p-3 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 font-mono tracking-wider">Toplam Stok</span>
          <div className="text-xl font-black text-primary font-mono mt-1">{toplamKutu} <span className="text-xs font-normal text-zinc-500">Kutu</span></div>
        </div>

        <div className="bg-white rounded-xl border border-primary p-3 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-primary font-mono tracking-wider">Kritik Stok</span>
          <div className="text-xl font-black text-primary font-mono mt-1">
            {kritikSayisi} <span className="text-xs font-normal text-zinc-500">İlaç</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary p-3 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 font-mono tracking-wider">Tükenenler</span>
          <div className="text-xl font-black text-primary font-mono mt-1">
            {tukenenSayisi} <span className="text-xs font-normal text-zinc-500">İlaç</span>
          </div>
        </div>
      </div>

      {/* ── 3. FİLTRE BARI ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-primary p-2 shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stok Durum Filtresi */}
          <select
            value={filtreStok}
            onChange={(e) => setFiltreStok(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Stoklar</option>
            <option value="Normal">Normal Stok</option>
            <option value="Kritik">Kritik Stok</option>
            <option value="StokYok">Stok Yok</option>
          </select>

          {/* Form Filtresi */}
          <select
            value={filtreForm}
            onChange={(e) => setFiltreForm(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Formlar</option>
            {FORM_SECENEK.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="text-[11px] font-mono font-bold px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-300 text-zinc-700">
          <b>{siralanmisVeFiltrelenmisIlaclar.length}</b> İlaç
        </div>
      </div>

      {/* ── 4. KURUMSAL İLAÇ TABLOSU (LİSTE GÖRÜNÜMÜ) ── */}
      <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {yukleniyor ? (
            <div className="text-center py-16 text-zinc-500 font-mono text-xs animate-pulse uppercase">İlaç Listesi Yükleniyor...</div>
          ) : siralanmisVeFiltrelenmisIlaclar.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Kayıtlı ilaç bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left font-sans border-collapse">
              <thead className="bg-zinc-100/90 text-primary text-[10px] font-black uppercase tracking-wider border-b border-primary select-none">
                <tr>
                  {/* Barkod */}
                  <th 
                    onClick={() => siralamayiDegistir('barkod')}
                    className="px-3 py-2.5 border-r border-zinc-300 w-28 whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors font-mono"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Barkod</span>
                      <SortIcon alan="barkod" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* İlaç Adı */}
                  <th 
                    onClick={() => siralamayiDegistir('ad')}
                    className="px-3.5 py-2.5 border-r border-zinc-300 min-w-[180px] cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>İlaç Adı</span>
                      <SortIcon alan="ad" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* Etken Madde */}
                  <th 
                    onClick={() => siralamayiDegistir('etkenMadde')}
                    className="px-3 py-2.5 border-r border-zinc-300 min-w-[140px] cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Etken Madde</span>
                      <SortIcon alan="etkenMadde" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* Form */}
                  <th 
                    onClick={() => siralamayiDegistir('form')}
                    className="px-2.5 py-2.5 border-r border-zinc-300 w-20 text-center cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Form</span>
                      <SortIcon alan="form" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* Üretici */}
                  <th 
                    onClick={() => siralamayiDegistir('ureticiFirma')}
                    className="px-3 py-2.5 border-r border-zinc-300 min-w-[130px] cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Üretici</span>
                      <SortIcon alan="ureticiFirma" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* Hızlı Stok */}
                  <th 
                    onClick={() => siralamayiDegistir('toplamStok')}
                    className="px-3 py-2.5 border-r border-zinc-300 w-36 text-center whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors font-mono"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Stok / Eşik</span>
                      <SortIcon alan="toplamStok" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* En Yakın SKT */}
                  <th 
                    onClick={() => siralamayiDegistir('enYakinSkt')}
                    className="px-3 py-2.5 border-r border-zinc-300 w-28 text-center whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors font-mono"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>En Yakın SKT</span>
                      <SortIcon alan="enYakinSkt" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  {/* Durum */}
                  <th className="px-3 py-2.5 border-r border-zinc-300 w-24 text-center whitespace-nowrap font-mono">
                    Durum
                  </th>

                  {/* İşlem */}
                  <th className="px-3 py-2.5 text-right w-40 print:hidden">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {siralanmisVeFiltrelenmisIlaclar.map((ilac, idx) => {
                  const sktBilgi = getSktDurumu(ilac.enYakinSkt);
                  const isStokYok = ilac.toplamStok === 0;
                  const isKritik = !isStokYok && ilac.toplamStok <= ilac.kritikStokSeviyesi;

                  return (
                    <tr key={ilac.id} className={`hover:bg-zinc-50 transition-colors ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                      
                      {/* Barkod */}
                      <td className="px-3 py-2 font-mono text-xs font-bold border-r border-zinc-200 whitespace-nowrap text-zinc-600">
                        {ilac.barkod || '—'}
                      </td>

                      {/* İlaç Adı */}
                      <td className="px-3.5 py-2 font-bold text-primary border-r border-zinc-200">
                        <button
                          onClick={() => navigate(`/ilaclar/${ilac.id}`)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {ilac.ad}
                        </button>
                      </td>

                      {/* Etken Madde */}
                      <td className="px-3 py-2 font-medium text-zinc-700 border-r border-zinc-200 text-[11px]">
                        {ilac.etkenMadde || '—'}
                      </td>

                      {/* Form */}
                      <td className="px-2.5 py-2 text-center border-r border-zinc-200 whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono bg-zinc-100 text-zinc-800 border border-zinc-300">
                          {ilac.form || '—'}
                        </span>
                      </td>

                      {/* Üretici */}
                      <td className="px-3 py-2 font-medium text-zinc-600 border-r border-zinc-200 text-[11px] truncate max-w-[130px]">
                        {ilac.ureticiFirma || '—'}
                      </td>

                      {/* Hızlı Stok Yönetimi */}
                      <td className="px-2.5 py-1.5 border-r border-zinc-200 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => stokHizliDegistir(e, ilac.id, -1)}
                                disabled={ilac.toplamStok <= 0}
                                title="1 adet azalt"
                                className="w-5 h-5 rounded border border-zinc-300 bg-zinc-100 hover:bg-primary-hover hover:text-white text-zinc-800 font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed shrink-0"
                              >
                                -
                              </button>
                              
                              <div className="flex flex-col items-center min-w-[48px] font-mono">
                                <span className="font-bold text-primary text-xs">{ilac.toplamStok}</span>
                                <span className="text-[8px] text-zinc-400">EŞİK: {ilac.kritikStokSeviyesi}</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => stokHizliDegistir(e, ilac.id, 1)}
                                title="1 adet arttır"
                                className="w-5 h-5 rounded border border-zinc-300 bg-zinc-100 hover:bg-primary-hover hover:text-white text-zinc-800 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
                              >
                                +
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center min-w-[48px] font-mono">
                              <span className="font-bold text-primary text-xs">{ilac.toplamStok}</span>
                              <span className="text-[8px] text-zinc-400">EŞİK: {ilac.kritikStokSeviyesi}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* En Yakın SKT */}
                      <td className="px-3 py-2 border-r border-zinc-200 text-center whitespace-nowrap font-mono">
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                          {sktBilgi.metin}
                        </span>
                      </td>

                      {/* Durum Rozeti */}
                      <td className="px-3 py-2 border-r border-zinc-200 text-center whitespace-nowrap font-mono">
                        {isStokYok ? (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-primary text-white">
                            YOK
                          </span>
                        ) : isKritik ? (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-zinc-200 text-primary border border-zinc-400">
                            KRİTİK
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-zinc-100 text-zinc-700 border border-zinc-300">
                            YETERLİ
                          </span>
                        )}
                      </td>

                      {/* İşlem Butonları */}
                      <td className="px-3 py-2 text-right whitespace-nowrap print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/ilaclar/${ilac.id}`)}
                            className="px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            Stok
                          </button>
                          {kullanici?.rol === 'Bashekim' && (
                            <>
                              <button
                                onClick={() => duzenlemeAc(ilac)}
                                className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => setSilOnayId(ilac.id)}
                                className="px-2 py-1 bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              >
                                Sil
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── İLAÇ EKLEME / DÜZENLEME MODALI ── */}
      {modalMod && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-primary rounded-none shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b-2 border-primary flex justify-between items-center bg-primary text-white">
              <h3 className="font-black uppercase tracking-widest text-sm">
                {modalMod === 'ekle' ? '+ YENİ İLAÇ EKLE' : 'İLAÇ DÜZENLE'}
              </h3>
              <button onClick={() => setModalMod(null)} className="text-white/70 hover:text-white font-black cursor-pointer"><X size={14} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleKaydet} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormInput 
                    label="İlaç Adı *" 
                    value={form.ad} 
                    onChange={(e) => handleFormDegis('ad', e.target.value)} 
                    placeholder="Örn: Parol 500mg Tablet"
                    required 
                  />
                </div>
                <FormInput 
                  label="Etken Madde" 
                  value={form.etkenMadde} 
                  onChange={(e) => handleFormDegis('etkenMadde', e.target.value)} 
                  placeholder="Örn: Parasetamol" 
                />
                <div>
                  <label className="block text-[11px] font-black text-primary uppercase mb-1">Form</label>
                  <select
                    className="w-full h-9 px-2 border border-primary rounded-none text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black bg-white"
                    value={form.form}
                    onChange={(e) => handleFormDegis('form', e.target.value)}
                  >
                    <option value="">Seçin</option>
                    {FORM_SECENEK.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <FormInput 
                  label="Üretici Firma" 
                  value={form.ureticiFirma} 
                  onChange={(e) => handleFormDegis('ureticiFirma', e.target.value)} 
                  placeholder="Örn: Atabay"
                />
                <FormInput 
                  label="Barkod" 
                  value={form.barkod} 
                  onChange={(e) => handleFormDegis('barkod', e.target.value)} 
                  placeholder="8699..."
                />
                <FormInput 
                  label="Kritik Stok Seviyesi" 
                  value={form.kritikStokSeviyesi} 
                  onChange={(e) => handleFormDegis('kritikStokSeviyesi', e.target.value)} 
                  type="number" 
                  min="0" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-primary">
                <button type="button" onClick={() => setModalMod(null)}
                  className="px-5 py-2 border border-primary bg-white hover:bg-slate-100 text-primary font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer">
                  İPTAL
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-primary hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer">
                  {modalMod === 'ekle' ? 'KAYDET' : 'GÜNCELLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SİLME ONAY MODALI ── */}
      {silOnayId && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-primary rounded-none shadow-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-black text-primary mb-2 uppercase tracking-widest">İlacı Sil</h3>
            <p className="text-primary/70 text-xs font-bold mb-6">Bu ilacın tüm stok kayıtları da silinecek. Emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setSilOnayId(null)}
                className="flex-1 py-2 border border-primary bg-white hover:bg-slate-100 text-primary font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer">
                VAZGEÇ
              </button>
              <button onClick={() => handleSil(silOnayId)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-800 text-white font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer">
                EVET, SİL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IlacListesi;
