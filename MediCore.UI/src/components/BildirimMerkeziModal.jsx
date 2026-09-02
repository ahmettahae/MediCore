import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell, X, CheckCheck, Trash2, Siren, AlertTriangle,
  Info, CheckCircle2, ArrowRight, HeartPulse, Ambulance,
  Pill, Megaphone, CheckSquare, Sparkles, Check, CircleDot, Volume2
} from 'lucide-react';
import { playAlarmSound } from '../utils/sound';

const BildirimMerkeziModal = ({ acik, onKapat, isDark = false }) => {
  const navigate = useNavigate();
  const {
    bildirimler,
    okunmamisSayisi,
    okunduIsaretle,
    okunduDurumDegistir,
    tumunuOkunduIsaretle,
    bildirimSil,
    tumunuTemizle
  } = useNotifications();

  if (!acik) return null;

  const handleTikla = (b) => {
    okunduIsaretle(b.id);
    if (b.link) {
      navigate(b.link);
      onKapat();
    }
  };

  const zamanFormati = (isoStr) => {
    try {
      const d = new Date(isoStr);
      const farkDk = Math.floor((Date.now() - d.getTime()) / 60000);
      if (farkDk < 1) return 'Az önce';
      if (farkDk < 60) return `${farkDk} dk önce`;
      const farkSaat = Math.floor(farkDk / 60);
      if (farkSaat < 24) return `${farkSaat} sa önce`;
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Bildirim türüne ve içeriğine göre akıllı Lucide-React ikonu seçimi
  const getBildirimIkonu = (b) => {
    const metin = `${b.baslik || ''} ${b.mesaj || ''}`.toLowerCase();
    const neutralBadge = 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
    
    if (metin.includes('sevk') || metin.includes('112') || metin.includes('ambulans') || metin.includes('hastane')) {
      return { Ikon: Ambulance, badgeClass: neutralBadge };
    }
    if (metin.includes('nabız') || metin.includes('ateş') || metin.includes('tansiyon') || metin.includes('saturasyon') || metin.includes('vital')) {
      return { Ikon: HeartPulse, badgeClass: neutralBadge };
    }
    if (metin.includes('ilaç') || metin.includes('stok') || metin.includes('mar') || metin.includes('doz')) {
      return { Ikon: Pill, badgeClass: neutralBadge };
    }
    if (metin.includes('duyuru') || metin.includes('genelge')) {
      return { Ikon: Megaphone, badgeClass: neutralBadge };
    }
    if (metin.includes('görev') || metin.includes('teslim')) {
      return { Ikon: CheckSquare, badgeClass: neutralBadge };
    }

    // Fallback: Standart tip bazlı ikonlar
    if (b.tip === 'alert') {
      return { Ikon: Siren, badgeClass: neutralBadge };
    }
    if (b.tip === 'warning') {
      return { Ikon: AlertTriangle, badgeClass: neutralBadge };
    }
    if (b.tip === 'success') {
      return { Ikon: CheckCircle2, badgeClass: neutralBadge };
    }

    return { Ikon: Info, badgeClass: neutralBadge };
  };

  return (
    <div className="fixed inset-0 z-[9990] flex justify-end bg-black/40 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      {/* Arka plan tıklandığında kapat */}
      <div className="flex-1" onClick={onKapat} />

      {/* Sağ Yan Çekmece Paneli */}
      <div 
        style={{
          backgroundColor: isDark ? '#16222F' : '#FFFFFF',
          borderColor: isDark ? '#26334D' : '#E2E8F0',
          color: isDark ? '#F1F5F9' : '#0F172A'
        }}
        className="w-full max-w-md border-l shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200"
      >
        
        {/* ÜST BAŞLIK */}
        <div 
          style={{
            backgroundColor: isDark ? '#131C28' : '#F8FAFC',
            borderColor: isDark ? '#26334D' : '#E2E8F0'
          }}
          className="p-4 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span 
              style={{
                backgroundColor: isDark ? '#223347' : '#FFFFFF',
                borderColor: isDark ? '#2D445D' : '#CBD5E1',
                color: isDark ? '#F1F5F9' : '#1E293B'
              }}
              className="w-8 h-8 rounded-lg border flex items-center justify-center shadow-2xs"
            >
              <Bell size={15} strokeWidth={2.4} />
            </span>
            <div>
              <h2 
                style={{ color: isDark ? '#FFFFFF' : '#142A4A' }}
                className="text-sm font-black uppercase tracking-wide font-sans"
              >
                Bildirim Merkezi
              </h2>
              <span 
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                className="text-[11px] font-semibold font-sans"
              >
                {okunmamisSayisi > 0 ? `${okunmamisSayisi} Okunmamış Bildirim` : 'Tüm Bildirimler Güncel'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => playAlarmSound('alert')}
              style={{
                backgroundColor: isDark ? '#223347' : '#FFFFFF',
                borderColor: isDark ? '#2D445D' : '#CBD5E1',
                color: isDark ? '#F1F5F9' : '#334155'
              }}
              className="px-2 py-1 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
              title="Klinik Alarm Sesini Test Et"
            >
              <Volume2 size={13} strokeWidth={2.4} className="text-amber-500" />
              <span>Sesi Sına</span>
            </button>

            <button
              onClick={onKapat}
              style={{
                backgroundColor: isDark ? '#223347' : '#FFFFFF',
                borderColor: isDark ? '#2D445D' : '#CBD5E1',
                color: isDark ? '#E2E8F0' : '#475569'
              }}
              className="w-7 h-7 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Kapat"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* AKSİYON BUTONLARI */}
        {bildirimler.length > 0 && (
          <div 
            style={{
              backgroundColor: isDark ? '#1A2838' : '#F1F5F9',
              borderColor: isDark ? '#26334D' : '#E2E8F0'
            }}
            className="px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-bold font-sans"
          >
            <button
              onClick={tumunuOkunduIsaretle}
              style={{ color: isDark ? '#93C5FD' : '#3E5C76' }}
              className="hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <CheckCheck size={13} strokeWidth={2.4} /> Tümünü Okundu Say
            </button>
            <button
              onClick={tumunuTemizle}
              className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Trash2 size={12} strokeWidth={2.4} /> Temizle
            </button>
          </div>
        )}

        {/* BİLDİRİM LİSTESİ */}
        <div 
          style={{
            backgroundColor: isDark ? '#16222F' : '#F8FAFC'
          }}
          className="flex-1 overflow-y-auto p-3 space-y-2.5"
        >
          {bildirimler.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 font-sans">
              <div 
                style={{
                  borderColor: isDark ? '#2D445D' : '#CBD5E1',
                  color: isDark ? '#64748B' : '#94A3B8'
                }}
                className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center"
              >
                <Sparkles size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p 
                  style={{ color: isDark ? '#CBD5E1' : '#475569' }}
                  className="text-xs font-bold uppercase font-sans"
                >
                  Henüz Bildirim Yok
                </p>
                <p 
                  style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                  className="text-[11.5px] mt-0.5 font-medium"
                >
                  Canlı klinik alarmları ve duyurular burada listelenir.
                </p>
              </div>
            </div>
          ) : (
            bildirimler.map((b) => {
              const { Ikon, badgeClass } = getBildirimIkonu(b);

              return (
                <div
                  key={b.id}
                  onClick={() => handleTikla(b)}
                  style={{
                    backgroundColor: !b.okundu
                      ? (isDark ? '#1E2E40' : '#FFFFFF')
                      : (isDark ? '#131C28' : '#F1F5F9'),
                    borderColor: !b.okundu
                      ? (isDark ? '#3B82F6' : '#CBD5E1')
                      : (isDark ? '#26334D' : '#E2E8F0'),
                    borderLeftWidth: !b.okundu ? '4px' : '1px',
                    borderLeftColor: !b.okundu ? (isDark ? '#60A5FA' : '#3E5C76') : undefined
                  }}
                  className="p-3.5 rounded-xl border transition-all cursor-pointer relative group shadow-2xs hover:shadow-xs font-sans"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${badgeClass}`}>
                      <Ikon size={13} strokeWidth={2.4} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 
                          style={{
                            color: !b.okundu
                              ? (isDark ? '#FFFFFF' : '#0F172A')
                              : (isDark ? '#94A3B8' : '#475569'),
                            fontWeight: !b.okundu ? '700' : '600'
                          }}
                          className="text-xs truncate font-sans tracking-tight"
                        >
                          {b.baslik}
                        </h4>
                        <span 
                          style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                          className="text-[10px] font-mono shrink-0 font-medium"
                        >
                          {zamanFormati(b.tarih)}
                        </span>
                      </div>

                      <p 
                        style={{
                          color: !b.okundu
                            ? (isDark ? '#CBD5E1' : '#334155')
                            : (isDark ? '#64748B' : '#64748B')
                        }}
                        className="text-xs mt-1 whitespace-pre-line leading-relaxed font-sans font-normal"
                      >
                        {b.mesaj}
                      </p>

                      {b.link && (
                        <div 
                          style={{ color: isDark ? '#93C5FD' : '#3E5C76' }}
                          className="mt-2.5 flex items-center gap-1 text-[11px] font-bold font-sans group-hover:underline"
                        >
                          İlgili Masaya Git <ArrowRight size={11} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>

                    {/* Sağ Üst Aksiyon Butonları (Okundu/Okunmadı Toggle ve Sil) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Tek Tek Okundu / Okunmadı İşaretleme Butonu */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          okunduDurumDegistir(b.id);
                        }}
                        style={{
                          backgroundColor: isDark ? '#223347' : '#FFFFFF',
                          borderColor: isDark ? '#2D445D' : '#CBD5E1',
                          color: !b.okundu
                            ? (isDark ? '#93C5FD' : '#3E5C76')
                            : (isDark ? '#64748B' : '#94A3B8')
                        }}
                        className="w-6 h-6 rounded-md border flex items-center justify-center transition-colors hover:scale-105 shadow-2xs shrink-0 cursor-pointer"
                        title={!b.okundu ? "Okundu olarak işaretle" : "Okunmadı olarak işaretle"}
                      >
                        {!b.okundu ? (
                          <Check size={12} strokeWidth={2.6} />
                        ) : (
                          <CircleDot size={11} strokeWidth={2.4} />
                        )}
                      </button>

                      {/* Bildirimi Sil Butonu */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          bildirimSil(b.id);
                        }}
                        style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                        className="w-6 h-6 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Bildirimi Sil"
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>

                  {!b.okundu && (
                    <span 
                      style={{ backgroundColor: isDark ? '#60A5FA' : '#3E5C76' }}
                      className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse pointer-events-none" 
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ALT BİLGİ */}
        <div 
          style={{
            backgroundColor: isDark ? '#131C28' : '#FFFFFF',
            borderColor: isDark ? '#26334D' : '#E2E8F0',
            color: isDark ? '#64748B' : '#94A3B8'
          }}
          className="p-3 border-t text-center font-sans"
        >
          <span className="text-[10.5px] font-medium">
            MediCore Canlı Klinik WebSocket Ağı
          </span>
        </div>

      </div>
    </div>
  );
};

export default BildirimMerkeziModal;
