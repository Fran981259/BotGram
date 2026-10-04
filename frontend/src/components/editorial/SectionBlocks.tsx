import Link from "next/link";

/**
 * SectionHeader — cabeçalho de seção padronizado.
 *
 * Fonte única para títulos de seção editoriais, com título escalando por
 * `clamp()` em vez de degraus fixos.
 */
export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel = "ver mais",
  id,
  dark = false,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  dark?: boolean;
  /** `h1` só na home, quando o cabeçalho é o título principal da seção. */
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={`flex items-end justify-between gap-4 border-b-2 pb-2 ${dark ? "border-white/25" : "border-charcoal"}`}>
      <div>
        {eyebrow && <p className={`eyebrow ${dark ? "eyebrow-light" : ""}`}>{eyebrow}</p>}
        <Heading
          id={id}
          className={`mt-1 text-balance font-display font-bold ${
            dark ? "text-white" : "text-text-primary"
          } text-[clamp(1.35rem,2vw,1.9rem)] leading-tight`}
        >
          {title}
        </Heading>
      </div>
      {href && (
        <Link
          href={href}
          className={`-my-2 inline-block shrink-0 py-2 text-xs font-bold uppercase tracking-wider underline decoration-gold decoration-2 underline-offset-4 transition-colors hover:text-gold-deep ${dark ? "text-gold" : "text-accent-leaf"}`}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * NewsroomCtaBlock — chamada da redação.
 *
 * ── A INCONSISTÊNCIA QUE ESTA PEÇA CARREGAVA ────────────────────────────────
 *
 * O componente se chamava `NewsletterBlock`, o rótulo dizia "Newsletter" e o
 * texto prometia "Resumo das principais notícias de Mato Grosso do Sul, direto
 * no seu e-mail". Não existe inscrição em newsletter: não há endpoint, não há
 * lista, e a rota de contato nunca leu endereço nenhum. O leitor podia crer que
 * o endereço tinha sido guardado.
 *
 * A referência aprovada mostra uma faixa de newsletter com campo de e-mail. Não
 * há como reproduzi-la sem inventar a funcionalidade — e a regra de dados reais
 * vale acima da semelhança visual. O que foi aproveitado da referência é a
 * FORMA: faixa horizontal, fundo claro, ícone circular dourado à esquerda,
 * rótulo pequeno, manchete em serifa, e uma única chamada forte à direita.
 *
 * ── O QUE A FAIXA DIZ AGORA ──────────────────────────────────────────────────
 *
 * O que o bloco de fato faz: leva o leitor à página de contato da redação.
 * Uma pauta, uma correção, uma sugestão, uma parceria. Tudo isso existe e é
 * atendido. Não há campo de e-mail, e não há promessa de nada que não exista.
 *
 * Quando existir endpoint de assinatura, isto vira um formulário de verdade, com
 * o campo de volta — e o texto volta a falar em assinatura, porque aí passa a
 * ser verdade.
 */
export function NewsroomCtaBlock({
  eyebrow = "Fale com a redação",
  title = "Participe do Portal Cerrado",
  description = "Envie uma pauta, correção, sugestão ou parceria para a nossa redação.",
  dark = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <section
      aria-labelledby="newsroom-cta-heading"
      className={`border-y-2 px-5 py-6 sm:px-8 sm:py-8 ${
        dark ? "border-gold/40 bg-charcoal" : "border-accent-soil/15 bg-paper-alt"
      }`}
    >
      <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-charcoal"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="5" width="19" height="14" rx="1" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </span>

          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-gold" : "text-gold-deep"}`}>
              {eyebrow}
            </p>
            <h2
              id="newsroom-cta-heading"
              className={`mt-1 text-balance font-display text-xl font-bold leading-tight sm:text-2xl ${
                dark ? "text-white" : "text-text-primary"
              }`}
            >
              {title}
            </h2>
            <p className={`mt-1.5 max-w-xl text-sm leading-relaxed ${dark ? "text-white/75" : "text-text-muted"}`}>
              {description}
            </p>
          </div>
        </div>

        <Link
          href="/contato"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-none bg-accent-soil px-6 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-deep"
        >
          Falar com a redação
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
