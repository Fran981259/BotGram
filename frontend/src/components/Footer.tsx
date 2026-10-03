import Link from "next/link";
import { REPORTER_LIST, reporterInitials } from "@/lib/reporters";
import { BrandLogo } from "@/components/BrandLogo";

const CITIES = ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Aquidauana", "Jardim", "Naviraí", "Nova Andradina", "São Gabriel do Oeste", "Paranaíba", "Sidrolândia", "Chapadão do Sul", "Coxim"];

const EDITORIAS = [
  { label: "Política e Poder", href: "/categoria/politics" },
  { label: "Segurança e Justiça", href: "/categoria/security" },
  { label: "Economia", href: "/categoria/economy" },
  { label: "Agronegócio", href: "/categoria/agriculture" },
  { label: "Cotidiano e Clima", href: "/categoria/clima" },
  { label: "Esporte", href: "/categoria/sports" },
  { label: "Cultura e Entretenimento", href: "/categoria/culture" },
  { label: "Ciência e Tecnologia", href: "/categoria/tech" },
];

const INSTITUCIONAL = [
  { label: "Sobre Nós", href: "/sobre" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Contato", href: "/contato" },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-gold bg-accent-soil text-white">
      <div className="container-editorial grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo light />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
            Jornalismo sério sobre agronegócio, mercados e negócios regionais. Produzido em Mato Grosso do Sul, com apuração a partir de fontes públicas e da imprensa local de cada cidade.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-white/60">
            Acompanhamos as principais cidades do Estado:
            <span className="mt-1 block font-medium">{CITIES.join(" · ")}.</span>
          </p>
        </div>

        <nav aria-labelledby="footer-editorias">
          <h2 id="footer-editorias" className="border-b border-white/15 pb-2 text-xs font-black uppercase tracking-[0.18em] text-gold">Editorias</h2>
          <ul className="mt-3 space-y-0.5 text-sm">
            {EDITORIAS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 text-white/70 transition-colors hover:text-gold hover:underline hover:decoration-gold decoration-2 underline-offset-2">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-institucional">
          <h2 id="footer-institucional" className="border-b border-white/15 pb-2 text-xs font-black uppercase tracking-[0.18em] text-gold">Institucional</h2>
          <ul className="mt-3 space-y-0.5 text-sm">
            {INSTITUCIONAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 text-white/70 transition-colors hover:text-gold hover:underline hover:decoration-gold decoration-2 underline-offset-2">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-white/60">Redação em Campo Grande — MS.</p>
        </nav>

        <nav aria-labelledby="footer-colunistas">
          <h2 id="footer-colunistas" className="border-b border-white/15 pb-2 text-xs font-black uppercase tracking-[0.18em] text-gold">Colunistas</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {REPORTER_LIST.filter((r) => r.slug !== "redacao.cerrado")
              .slice(0, 7)
              .map((reporter) => (
                <li key={reporter.slug} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/20 text-[10px] font-bold text-gold-deep">
                    {reporterInitials(reporter.name)}
                  </span>
                  <Link href={`/reporter/${reporter.slug}`} className="inline-block min-w-0 truncate py-1.5 text-white/70 transition-colors hover:text-gold hover:underline hover:decoration-gold decoration-2 underline-offset-2">
                    {reporter.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/15">
        <div className="container-editorial flex flex-wrap items-center justify-between gap-4 py-5 text-xs text-white/55">
          <span>© {new Date().getFullYear()} Portal Cerrado. Todos os direitos reservados.</span>
          <span>Jornalismo local com rigor editorial.</span>
        </div>
      </div>
    </footer>
  );
}
