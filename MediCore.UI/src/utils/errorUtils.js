/**
 * API'den dönen HTTP hata yanıtlarını kullanıcı dostu, anlaşılır Türkçe mesajlara dönüştürür.
 * .NET RFC-9110 ValidationProblemDetails JSON formatını temizler.
 * 
 * @param {Response} response - Fetch API Response nesnesi
 * @param {string} varsayilanMesaj - Hata çözülemezse gösterilecek genel mesaj
 * @returns {Promise<string>} Kullanıcıya gösterilecek temiz hata metni
 */
export async function parseApiError(response, varsayilanMesaj = 'İşlem sırasında bir hata oluştu.') {
  if (!response) return varsayilanMesaj;

  try {
    const rawText = await response.text();
    if (!rawText || !rawText.trim()) {
      return `İşlem başarısız (HTTP ${response.status}).`;
    }

    // JSON formatında mı kontrol et
    try {
      const data = JSON.parse(rawText);

      // 1. .NET RFC-9110 Validation Errors formatı: { errors: { field: ["msg1"] } }
      if (data.errors && typeof data.errors === 'object') {
        const errorList = [];
        for (const [field, messages] of Object.entries(data.errors)) {
          const fieldName = field.replace('$.', '').toLowerCase();
          
          if (Array.isArray(messages)) {
            messages.forEach(msg => {
              if (msg.includes('System.DateTime')) {
                if (fieldName.includes('gorevebaslama')) {
                  errorList.push('Göreve başlama tarihi geçersiz veya hatalı formatta.');
                } else if (fieldName.includes('dogum')) {
                  errorList.push('Doğum tarihi geçersiz veya hatalı formatta.');
                } else if (fieldName.includes('tarih')) {
                  errorList.push('Girilen tarih formatı geçersiz.');
                } else {
                  errorList.push('Tarih alanı geçersiz formatta.');
                }
              } else if (msg.includes('is required')) {
                errorList.push(`${field} alanı zorunludur.`);
              } else {
                errorList.push(msg);
              }
            });
          } else if (typeof messages === 'string') {
            errorList.push(messages);
          }
        }

        if (errorList.length > 0) {
          return errorList.join('\n');
        }
      }

      // 2. Özel API hata nesnesi: { message: "..." } veya { mesaj: "..." } veya { title: "..." }
      if (data.mesaj) return data.mesaj;
      if (data.message) return data.message;
      if (data.title && !data.title.includes('One or more validation errors')) return data.title;
      if (data.detail) return data.detail;

    } catch {
      // JSON değilse doğrudan düz metindir (ör: BadRequest("Geçersiz TC No"))
      return rawText.replace(/^"|"$/g, '').trim();
    }

    return rawText;
  } catch {
    return varsayilanMesaj;
  }
}
