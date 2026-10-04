import Link from "next/link";
import { REPORTER_LIST, reporterInitials } from "@/lib/reporters";
import { BrandLogo } from "@/components/BrandLogo";

const CITIES = ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Aquidauana", "Jardim", "Naviraí", "Nova Andradina", "São Gabriel do Oeste", "Paranaíba", "Sidrolândia", "Chapadão do Sul", "Coxim"];

const EDITORIAS = [
  { label: "Política", href: "/categoria/politics" },
  { label: "Segurança e Justiça", href: "/categoria/security" },
  { label: "Economia", href: "/categoria/economy" },
  { label: "Agronegócio", href: "/categoria/agriculture" },
  { label: "Cotidiano e Clima", href: "/categoria/clima" },
  { label: "Cultura", href: "/categoria/culture" },
  { label: "Ciência e Tecnologia", href: "/categoria/tech" },
  { label: "Esporte", href: "/categoria/sports" },
];

const INSTITUCIONAL = [
  { label: "Sobre Nós", href: "/sobre" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos de uso", href: "/termos" },
];

/**
 * Footer — quatro colunas sobre verde profundo.
 *
 * A referência tem: marca + descrição curta, editorias, institucional, e uma
 * quarta coluna de contato com telefone, e-mail e endereço. Aqui a quarta
 * coluna é a lista de assinaturas, porque telefone, e-mail e endereço não
 * existem no projeto — e a regra de dados reais vale acima da correspondência
 * visual. Nenhum contato foi inventado para preencher a coluna.
 *
 * O que muda em relação à versão anterior:
 *   - a régua dourada de 2px no topo saiu, e no lugar dela há um filete de 1px
 *     na cor da linha, que é o que separa a referência;
 *   - as colunas recebem divisória vertical no desktop, como a referência;
 *   - a linha de copyright é compacta e divide o espaço em dois lados.
 */
export default function Footer() {
  return (
    <footer className="mt-6 border-t border-line bg-green-deep text-white">
      <div className="container-editorial grid gap-8 py-9 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        <div className="lg:border-r lg:border-white/12 lg:pr-8">
          <BrandLogo light />
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/70">
            Jornalismo independente, com foco no desenvolvimento do Centro-Oeste,
            no agronegócio, na sustentabilidade e nas pessoas que constroem o
            Brasil real.
          </p>
          <p className="mt-4 text-[11px] leading-relaxed text-white/50">
            Acompanhamos as principais cidades do Estado:
            <span className="mt-1 block font-medium text-white/65">{CITIES.slice(0, 8).join(" · ")}.</span>
          </p>
        </div>

        <nav aria-labelledby="footer-editorias" className="lg:border-r lg:border-white/12 lg:px-8">
          <h2 id="footer-editorias" className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            Editorias
          </h2>
          <ul className="mt-3 grid gap-0.5 text-[13px] sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1">
            {EDITORIAS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 text-white/75 transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-institucional" className="lg:border-r lg:border-white/12 lg:px-8">
          <h2 id="footer-institucional" className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            Institucional
          </h2>
          <ul className="mt-3 grid gap-0.5 text-[13px] sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1">
            {INSTITUCIONAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 text-white/75 transition-colors hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contato" className="inline-block py-1.5 text-white/75 transition-colors hover:text-gold">
                Fale com a redação
              </Link>
            </li>
          </ul>
          <p className="mt-5 text-[11px] leading-relaxed text-white/50">
            Redação em Campo Grande — MS.
          </p>
        </nav>

        <nav aria-labelledby="footer-colunistas" className="lg:pl-8">
          <h2 id="footer-colunistas" className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">
            Assinaturas
          </h2>
          <ul className="mt-3 grid gap-1 text-[13px] sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1">
            {REPORTER_LIST.filter((r) => r.slug !== "redacao.cerrado")
              .slice(0, 7)
              .map((reporter) => (
                <li key={reporter.slug}>
                  <Link href={`/reporter/${reporter.slug}`} className="inline-flex min-w-0 items-center gap-2 py-1 text-white/75 transition-colors hover:text-gold">
                    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[9px] font-bold text-gold">
                      {reporterInitials(reporter.name)}
                    </span>
                    <span className="truncate">{reporter.name}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/12">
        <div className="container-editorial flex flex-wrap items-center justify-between gap-3 py-4 text-[11px] text-white/50">
          <span>© {new Date().getFullYear()} Portal Cerrado. Todos os direitos reservados.</span>
          <span className="font-semibold uppercase tracking-[0.14em] text-gold/80">
            Do Cerrado para um Brasil mais forte
          </span>
        </div>
      </div>
    </footer>
  );
}