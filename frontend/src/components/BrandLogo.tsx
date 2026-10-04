import Link from "next/link";

export function BrandLogo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const ink = light ? "#f7f5ef" : "#173b20";
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Portal Cerrado — página inicial">
      <svg aria-hidden="true" viewBox="0 0 64 64" className={compact ? "h-9 w-9" : "h-10 w-10 sm:h-12 sm:w-12"} fill="none">
        <path d="M31.5 31.5v24M31.5 43c-6-7-12-8-17-8M31.5 48c6-8 12-10 18-10M31.5 37c3-8 8-13 15-15M31.5 38c-3-8-8-13-15-15" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M31 7c-9 0-18 6-20 14 7-2 13-1 18 3 4-5 10-7 17-5C44 12 38 7 31 7Z" fill="#b8923a" />
        <path d="M22 56h20" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`font-display text-[1.5rem] font-bold tracking-[-0.045em] sm:text-[2rem] ${light ? "text-canvas" : "text-text-primary"}`}>
          Portal <span className={light ? "text-gold" : "text-accent-soil"}>Cerrado</span>
        </span>        {/*
          A assinatura some abaixo de `sm`. No celular ela custava ~26px de altura
          e, somada ao CTA "Fale com a redação" completo na mesma linha, fazia o
          documento inteiro transbordar: medido 609px de `scrollWidth` contra 393
          de `clientWidth` a 393px de largura. O nome da marca continua inteiro;
          o que some é o complemento decorativo.
        */}
        {!compact && (
          <span className={`mt-1 hidden text-[8px] font-bold uppercase tracking-[0.17em] sm:block ${light ? "text-white/60" : "text-text-muted"}`}>
            Informação que conecta o Brasil real
          </span>
        )}
      </span>
    </Link>
  );
}
