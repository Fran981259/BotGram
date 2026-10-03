import Link from "next/link";

/**
 * SectionHeader — cabeçalho de seção padronizado.
 *
 * Extrai uma família do plano §7. Já existia em `home/SectionHeading.tsx` com
 * comportamento equivalente; este é o tamanho canônico, com título escalando
 * por `clamp()` em vez de degraus fixos.
 *
 * Os dois coexistem durante a migração: páginas fora do redesign ainda
 * importam o caminho antigo, e este é o destino.
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
    <div className="flex items-end justify-between gap-4 border-b-2 border-charcoal pb-2">
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
          className="-my-2 inline-block shrink-0 py-2 text-xs font-bold uppercase tracking-wider text-accent-leaf underline decoration-gold decoration-2 underline-offset-4 transition-colors hover:text-gold-deep"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * NewsletterBlock — chamada de assinatura.
 *
 * Não posts para lista: um link de e-mail, como pede a WCAG 2.5.3. O campo
 * opcional aceita a proporção; sem ele, o bloco assume a largura do container.
 */
export function NewsletterBlock({
  eyebrow = "Newsletter",
  title = "Acompanhe o Cerrado",
  description = "Resumo das principais notícias de Mato Grosso do Sul, direto no seu e-mail.",
  dark = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  action?: string;
  dark?: boolean;
}) {
  return (
    <section
      aria-labelledby="newsletter-heading"
      className={`rounded-lg border p-6 sm:p-8 ${
        dark ? "border-white/15 bg-charcoal" : "border-black/10 bg-surface"
      }`}
    >
      <p className={`eyebrow ${dark ? "eyebrow-light" : ""}`}>{eyebrow}</p>
      <h2
        id="newsletter-heading"
        className={`mt-1 text-balance font-display text-[clamp(1.4rem,2vw,2rem)] font-bold leading-tight ${
          dark ? "text-white" : "text-text-primary"
        }`}
      >
        {title}
      </h2>
      <p className={`mt-2 max-w-xl text-sm leading-relaxed ${dark ? "text-white/75" : "text-text-muted"}`}>
        {description}
      </p>

        {/*
          Não há inscrição em newsletter, e o destino nunca leu o endereço: a
          rota de contato descarta o parâmetro. Um campo de e-mail com o botão
          "Assinar" prometia uma assinatura que não existe — e o leitor podia
          crer que o endereço tinha sido guardado.

          Virou chamada de contato, que é o que o bloco de fato faz. Quando
          existir endpoint de assinatura, aqui volta um formulário de verdade.
        */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            href="/contato"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded bg-accent-leaf px-6 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-charcoal"
          >
            Falar com a redação
            <span aria-hidden="true">→</span>
          </Link>
          <p className={`text-xs leading-relaxed ${dark ? "text-white/70" : "text-text-muted"}`}>
            Sugestão, correção ou parceria: a resposta sai pela redação.
          </p>
        </div>
    </section>
  );
}