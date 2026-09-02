import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Parantezli Unvan Eklerini Otomatik Temizleyen Yardımcı Fonksiyon (Örn: "Yılmaz (Sorumlu Müdür)" -> "Yılmaz")
const cleanNameStr = (str) => (str ? str.replace(/\s*\(.*?\)/g, '').trim() : '');

export const AuthProvider = ({ children }) => {
  const [kullanici, setKullanici] = useState(null); // { ad, soyad, rol, eposta }
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          const rawAd = localStorage.getItem('kullaniciAd') || '';
          const rawSoyad = localStorage.getItem('kullaniciSoyad') || '';
          setKullanici({
            ad: cleanNameStr(rawAd),
            soyad: cleanNameStr(rawSoyad),
            rol: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
            eposta: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || ''
          });
        } else {
          localStorage.clear();
        }
      } catch {
        localStorage.clear();
      }
    }
    setYukleniyor(false);
  }, []);

  const girisYap = (token, ad, soyad, rol) => {
    const cleanedAd = cleanNameStr(ad);
    const cleanedSoyad = cleanNameStr(soyad);

    localStorage.setItem('userToken', token);
    localStorage.setItem('kullaniciAd', cleanedAd);
    localStorage.setItem('kullaniciSoyad', cleanedSoyad);
    localStorage.setItem('kullaniciRol', rol);
    setKullanici({ ad: cleanedAd, soyad: cleanedSoyad, rol });
  };

  const cikisYap = () => {
    localStorage.clear();
    setKullanici(null);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
  });

  return (
    <AuthContext.Provider value={{ kullanici, yukleniyor, girisYap, cikisYap, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
