import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PersonelListesi from './PersonelListesi';
import DoktorListesi from './DoktorListesi';
import { X, Users, Stethoscope } from 'lucide-react';

const KadroYonetimi = () => {
  const location = useLocation();
  const [aktifSekme, setAktifSekme] = useState(location.pathname === '/doktorlar' ? 'hekimler' : 'personel');
  const [aramaMetni, setAramaMetni] = useState('');

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & ARAMA & SEKME SEÇİCİ ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Kurum Kadro & Personel Yönetimi
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Hekimler, Hemşireler ve Bakım Personeli
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder={aktifSekme === 'personel' ? "Personel veya Görev Ara..." : "Hekim veya Branş Ara..."}
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

          {/* Sekme Butonları */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAktifSekme('personel')}
              className={`h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                aktifSekme === 'personel'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300'
              }`}
            >
              <span className="flex items-center gap-1.5"><Users size={12} strokeWidth={2.2} /> Sağlık &amp; Bakım</span>
            </button>
            <button
              type="button"
              onClick={() => setAktifSekme('hekimler')}
              className={`h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                aktifSekme === 'hekimler'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300'
              }`}
            >
              <span className="flex items-center gap-1.5"><Stethoscope size={12} strokeWidth={2.2} /> Hekim Kadrosu</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SEÇİLİ SEKME İÇERİĞİ ── */}
      <div>
        {aktifSekme === 'personel' ? (
          <PersonelListesi gomulu={true} disAramaMetni={aramaMetni} />
        ) : (
          <DoktorListesi gomulu={true} disAramaMetni={aramaMetni} />
        )}
      </div>
    </div>
  );
};

export default KadroYonetimi;
