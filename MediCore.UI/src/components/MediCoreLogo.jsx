import React, { useState, useEffect } from 'react';

/**
 * 🏥 MediCore Resmi Kurumsal Logo Bileşeni
 * - Gündüz modu: /medicore_logo_user.png (renkli kurumsal logo)
 * - Gece modu:   /medicore_logo_dark.png (koyu arka planlı gece logosu)
 */
const MediCoreLogo = ({ 
  size = 'md', 
  className = '',
  isDark
}) => {
  const sizeClasses = {
    xs: 'w-[150px] h-[75px]',
    sm: 'w-[220px] h-[110px]',
    md: 'w-[300px] h-[150px]',
    lg: 'w-[400px] h-[200px]',
    xl: 'w-[600px] h-[300px]'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const [geceModu, setGeceModu] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  const aktifKoyu = isDark !== undefined ? isDark : geceModu;

  useEffect(() => {
    if (isDark !== undefined) return;
    const observer = new MutationObserver(() => {
      setGeceModu(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [isDark]);

  const logoSrc = aktifKoyu ? '/medicore_logo_dark.png' : '/medicore_logo_user.png';
  const blendMode = aktifKoyu ? 'mix-blend-normal' : 'mix-blend-multiply';

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <div className={`relative ${currentSize}`}>
        <img
          src={logoSrc}
          alt="MediCore Hasta Bakım Sistemi"
          className={`w-full h-full object-contain ${blendMode}`}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default MediCoreLogo;
