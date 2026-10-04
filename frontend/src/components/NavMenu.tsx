"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

type Sub = { label: string; slug: string };
type MenuItem = { label: string; href?: string; subs?: Sub[]; highlight?: boolean };

/**
 * Menu principal, plano e por nome de editoria.
 *
 * Antes eram oito itens de topo, alguns de duas ou três palavras, e quatro deles
 * agrupavam sub-editorias em um menu suspenso. Medido a 1440px: o conteúdo do
 * menu dava 801px contra 694px disponíveis, e como a barra é `justify-center` o
 * excesso transbordava dos DOIS lados — 65px à esquerda, por cima da marca.
 * "Portal Cerrado" e "Política" ficavam impressos um sobre o outro.
 *
 * A referência aprovada resolve isso do mesmo jeito que a referência resolve: menu plano,
 * com o nome curto da editoria. São nove itens de uma palavra, somando 655px
 * contra os 694px disponíveis — e sobra folga para a marca crescer.
 *
 * O que sai do topo do menu: os subgrupos (Ciência, Educação, Clima,
 * Entretenimento, Saúde). Eles continuam existindo como rotas, continuam no
 * rodapé e continuam alcançáveis pelas páginas de editoria — o que muda é que
 * o cabeçalho deixa de ser um índice completo do acervo e passa a ser a lista
 * das editorias de capa, que é o papel dele num jornal.
 *
 * Rótulos longos continuam em dois lugares onde há espaço: o rodapé
 * ("Segurança e Justiça", "Cotidiano e Clima") e o título de cada página de
 * editoria.
 */
export const CAPITAL_MENU: MenuItem[] = [
  { label: "Política", href: "/categoria/politics" },
  { label: "Segurança", href: "/categoria/security" },
  { label: "Economia", href: "/categoria/economy" },
  { label: "Agronegócio", href: "/categoria/agriculture" },
  { label: "Tecnologia", href: "/categoria/tech" },
  { label: "Saúde", href: "/categoria/health" },
  { label: "Geral", href: "/categoria/general" },
  { label: "Cultura", href: "/categoria/culture" },
  { label: "Esportes", href: "/categoria/sports" },
];

/**
 * Peso do item de navegação.
 *
 * Antes: caixa alta, `font-black`, `tracking-wider`, e o item ativo virava
 * uma pílula verde preenchida. Isso é linguagem de menu de sistema — é
 * exatamente o que a referência não faz. Lá o menu é texto corrido em corpo
 * pequeno, com um sublinhado curto no item ativo.
 */
const linkCls = (on: boolean) =>
  `relative whitespace-nowrap px-1.5 py-2 text-[13px] font-semibold transition-colors after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:transition-colors ${
    on
      ? "text-accent-soil after:bg-gold"
      : "text-text-muted after:bg-transparent hover:text-text-primary hover:after:bg-line"
  }`;

function DesktopLinks() {
  const path = usePathname();
  const active = path.startsWith("/categoria/") ? path.split("/")[2] : path === "/" ? null : "";
  return (
    <>
      <Link href="/" aria-current={active === null ? "page" : undefined} className={linkCls(active === null)}>
        Início
      </Link>
      {CAPITAL_MENU.map((item, idx) => {
        if (item.href) {
          const slug = item.href.split("/").pop() || "";
          const on = active === slug;
          return (
            <Link key={item.label} href={item.href} aria-current={on ? "page" : undefined} className={linkCls(on)}>
              {item.label}
            </Link>
          );
        }
        const subs = item.subs || [];
        const moreOn = subs.some((s) => s.slug === active);
        const alignRight = idx >= CAPITAL_MENU.length - 3;
        return (
          <div key={item.label} className="group relative">
            <button aria-haspopup="true" className={`${linkCls(moreOn)} inline-flex cursor-pointer items-center gap-1 bg-transparent`}>
              {item.label}
              <svg width="10" height="6" viewBox="0 0 10 6" className="transition-transform group-hover:rotate-180" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            <div className={`invisible absolute top-full z-50 w-64 translate-y-2 rounded-none border border-line bg-surface p-2 opacity-0 shadow-[0_18px_50px_-16px_rgba(22,26,22,0.35)] transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${alignRight ? "right-0" : "left-0"}`}>
              {subs.map((s) => {
                const on = active === s.slug;
                return (
                  <Link
                    key={s.label}
                    href={`/categoria/${s.slug}`}
                    aria-current={on ? "page" : undefined}
                    className={`block px-3 py-2 text-[12px] font-bold uppercase tracking-wider transition-colors ${on ? "bg-accent-soil text-white" : "text-text-muted hover:bg-black/5 hover:text-text-primary"}`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function DesktopNav() {
  /*
    `justify-center` só a partir de `xl`, e `overflow-x-auto` em toda largura.

    A barra é centralizada por padrão porque é o que a referência faz, mas
    centralizar um conteúdo mais largo que a caixa transborda dos DOIS LADOS — e
    o transbordo da esquerda passava por cima da marca. Abaixo de `xl` a barra
    alinha à esquerda e vira rolável: nove itens de editoria dão 655px contra
    357px disponíveis em um celular de 393px, e sem isso o documento inteiro
    media 553px de `scrollWidth` contra 393px de `clientWidth`.
  */
  return (
    <nav className="no-scrollbar relative flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-surface after:to-transparent xl:justify-center xl:after:hidden" aria-label="Editorias">
      <Suspense>
        <DesktopLinks />
      </Suspense>
    </nav>
  );
}
