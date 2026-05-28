"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LanguageSwitcher({ lang }: { lang: string }) {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();

  const getRedirectedPath = (novoIdioma: string) => {
    if (!pathname) return `/${novoIdioma}`;
    
    const segmentos = pathname.split('/');
    segmentos[1] = novoIdioma; // Troca 'pt' por 'en' e vice-versa
    
    const newPath = segmentos.join('/');
    const params = searchParams.toString();
    
    return params ? `${newPath}?${params}` : newPath;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '13px', fontWeight: 'bold' }}>
      <Link href={getRedirectedPath('pt')} style={{ color: lang === 'pt' ? '#047857' : '#9ca3af', textDecoration: 'none' }}>PT</Link>
      <span style={{ color: '#e5e7eb' }}>|</span>
      <Link href={getRedirectedPath('en')} style={{ color: lang === 'en' ? '#047857' : '#9ca3af', textDecoration: 'none' }}>EN</Link>
    </div>
  );
}