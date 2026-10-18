import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-center font-sans">
      <div className="max-w-xl bg-white p-10 md:p-16 rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl border border-red-100 mb-6">
          🧭
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
          Página não encontrada
        </h1>
        
        <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
          Parece que o campo de férias que procura mudou de sítio ou o link está quebrado. Volte à base e descubra centenas de novas opções para este verão.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link 
            href="/pt" 
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest text-sm"
          >
            Página Principal
          </Link>
          <Link 
            href="/pt/pesquisa" 
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-8 py-4 rounded-xl transition-all uppercase tracking-widest text-sm"
          >
            Fazer Pesquisa
          </Link>
        </div>
      </div>
    </main>
  );
}