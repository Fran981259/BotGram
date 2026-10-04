import Link from "next/link";
import { Suspense } from "react";
import { MarketBar } from "@/components/markets/MarketBar";
import { DesktopNav } from "@/components/NavMenu";
import { MobileMenu } from "@/components/home/MobileMenu";
import { formatCampoGrandeDate } from "@/lib/time";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Barra utilitária: data e edição.
 *
 * Só entra o que o projeto REAL entrega. Não há integração de clima no
 * Portal, e o plano §33 é explícito sobre não fabricar dado de produção — um
 * "28°C" inventado seria pior que a ausência do dado. A referência mostra
 * temperatura e capital na barra; aqui eles não existem, e a barra mostra o
 * que existe: data, cidade de origem e um link para a editoria do Estado.
 *
 * A data é calculada no servidor, no fuso de Campo Grande, reaproveitando o
 * utilitário de `lib/time`.
 */
function UtilityBar() {
  const today = formatCampoGrandeDate(new Date().toISOString(), {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-green-deep text-white">
      <div className="container-editorial flex min-h-8 items-center gap-3 py-1">
        <p className="min-w-0 truncate text-[11px] font-semibold text-white/80">
          {/* capitalizar só a primeira letra: `first-letter` respeita o texto real */}
          <span className="first-letter:uppercase">{today}</span>
          <span className="hidden text-white/55 sm:inline"> · Campo Grande · MS</span>
        </p>
        <Link
          href="/categoria/general"
          className="ml-auto shrink-0 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold transition-colors hover:text-white"
        >
          Editoria do Estado
        </Link>
      </div>
    </div>
  );
}

/*
 * Busca do cabeçalho.
 *
 * A referência traz só o ícone de lupa, e é o que resolve um problema medido
 * aqui: com o campo visível, a navegação não cabia na faixa única e a marca
 * acabava POR CIMA dos primeiros itens — "Portal Cerrado" e "Política" se
 * sobrepunham.
 *
 * A busca continua acessível pelo formulário, com campo visível na página
 * `/busca`, que é onde a digitação acontece. No cabeçalho, o ícone leva para
 * lá — que é o comportamento da referência.
 */
function SearchAction() {
  return (
    <Link
      href="/busca"
      aria-label="Buscar no Portal Cerrado"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-none text-accent-soil transition-colors hover:text-gold-deep"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
    </Link>
  );
}

/**
 * Header — masthead em UMA faixa.
 *
 * Antes eram duas: logo/busca/CTA numa linha, e a navegação numa segunda linha
 * separada por um filete. A referência põe as três zonas na mesma linha —
 * marca à esquerda, navegação centralizada, busca e CTA à direita — e é essa
 * linha única que dá ao topo a proporção de jornal, em vez de painel.
 *
 * Consequência mensurável: a navegação deixou de ser uma faixa horizontal
 * própria, e a "régua" colorida de três cores sob o cabeçalho saiu. A
 * separação agora é um filete de 1px, que é o que a referência usa.
 *
 * Nenhuma seção foi inventada: `DesktopNav` continua com o mesmo `CAPITAL_MENU`
 * e as mesmas rotas reais. O que mudou foi o peso tipográfico — a referência
 * usa texto corrido com sublinhado no item ativo, e não pílula preta em caixa
 * alta, que era a nossa leitura de "menu de sistema".
 */
export default function Header() {
  return (
    <>
      <UtilityBar />

      {/* Nem a barra de cotações nem este fallback são `sticky`: ambos rolam
          com a página. */}
      <Suspense
        fallback={
          <div className="bg-green-deep text-white" role="status" aria-label="Carregando cotações">
            <div className="container-editorial flex items-center gap-3 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Cotações em atualização…</span>
            </div>
          </div>
        }
      >
        <MarketBar />
      </Suspense>

      <header className="relative z-30 border-b border-line bg-surface">
        <div className="container-editorial">
          <div className="flex items-center gap-4 py-3.5 xl:gap-6">
            <div className="shrink-0 lg:hidden">
              <MobileMenu />
            </div>

            {/* `shrink-0` é obrigatório aqui, não cosmético: sem ele a marca é
                a única peça flexível da linha e encolhe por baixo da navegação
                quando os rótulos são longos. */}
            <div className="shrink-0">
              <BrandLogo />
            </div>

            <Suspense fallback={<div className="hidden min-w-0 flex-1 xl:block" />}>
              <div className="hidden min-w-0 flex-1 xl:flex">
                <DesktopNav />
              </div>
            </Suspense>

            <div className="ml-auto flex shrink-0 items-center gap-3 xl:gap-5">
              <SearchAction />
              {/*
                O CTA completo fica a partir de `sm`. Em 393px ele não cabia na
                linha com o botão de menu, a marca e a busca: a soma dava 539px de
                conteúdo num espaço de 357px, e o documento inteiro passava a ter
                609px de `scrollWidth` contra 393px de `clientWidth`. Abaixo de
                `sm` a ação continua existindo — dentro do menu, em
                `MobileMenu` — e o cabeçalho continua Offerindo a mesma rota.
              */}
              <Link
                href="/contato"
                className="hidden shrink-0 rounded-none bg-accent-soil px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-green-deep sm:inline-block"
              >
                Fale com a redação
              </Link>
            </div>
          </div>

          {/*
            Abaixo de `xl` a navegação não cabe na mesma linha sem espremer os
            rótulos até ficarem ilegíveis. Ela ganha uma segunda linha —
            simples, com filete — em vez de ser espremida. Acima de `xl` ela
            volta para a linha única, que é o desenho da referência.
          */}
          <div className="border-t border-line py-1.5 xl:hidden">
            <Suspense fallback={null}>
              <DesktopNav />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}