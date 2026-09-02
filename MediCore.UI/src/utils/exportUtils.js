/**
 * MediCore Dışa Aktarma & Raporlama Yardımcı Araçları
 */

/**
 * Verileri UTF-8 BOM ile Excel uyumlu CSV formatında indirir.
 * @param {string} filename - İndirilecek dosya adı (ör. 'aktivite_loglari.csv')
 * @param {string[]} headers - Sütun başlıkları dizisi (ör. ['Tarih', 'Kullanıcı', 'Rol', 'İşlem', 'Detay'])
 * @param {Array<Array<string|number>>} rows - Satır verileri dizisi
 */
export const exportToCsv = (filename, headers, rows) => {
  if (!rows || rows.length === 0) return;

  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  let csvContent = '\uFEFF'; // Excel'in Türkçe UTF-8 karakterleri (İ, ş, ğ, Ç, Ö, Ü) tam tanıması için BOM haritası
  csvContent += headers.map(escapeCell).join(';') + '\r\n';

  rows.forEach((row) => {
    csvContent += row.map(escapeCell).join(';') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Belirli bir sayfa veya elementi resmi başlık ve imza blokları ile PDF/Yazdır penceresine aktarır.
 * @param {string} title - Rapor Başlığı
 * @param {string} elementId - Yazdırılacak elementin DOM ID'si (opsiyonel)
 */
export const printReport = (title = 'MediCore Klinik Raporu', elementId = null) => {
  if (elementId) {
    const printElement = document.getElementById(elementId);
    if (printElement) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <meta charset="utf-8" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { font-family: sans-serif; padding: 20px; background: #fff !important; }
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body class="bg-white p-6 text-zinc-800">
              <div class="border-b border-zinc-300 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <h1 class="text-xl font-black tracking-tight text-zinc-900">${title}</h1>
                  <p class="text-xs text-zinc-500 font-mono mt-1">MediCore Klinik & Bakım Yönetim Sistemi | Resmi Belge</p>
                </div>
                <div class="text-right text-xs font-mono text-zinc-500">
                  Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>${printElement.innerHTML}</div>
              <div class="mt-12 pt-6 border-t border-zinc-200 grid grid-cols-2 gap-8 text-xs font-mono">
                <div class="text-center border-t border-dashed border-zinc-400 pt-2">
                  <p class="font-bold text-zinc-800">Raporu Düzenleyen / Teslim Eden</p>
                  <p class="text-[10px] text-zinc-500 mt-6">İmza / Kaşe</p>
                </div>
                <div class="text-center border-t border-dashed border-zinc-400 pt-2">
                  <p class="font-bold text-zinc-800">Kontrol Eden / Teslim Alan</p>
                  <p class="text-[10px] text-zinc-500 mt-6">İmza / Kaşe</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        return;
      }
    }
  }

  // Varsayılan sayfa yazdırma
  window.print();
};
