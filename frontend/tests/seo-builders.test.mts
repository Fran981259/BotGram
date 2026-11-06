/**
 * Testes dos builders JSON-LD de articleSeo.ts.
 * Executar: npx tsx frontend/tests/seo-builders.test.mts
 */

import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildCategoryItemListJsonLd } from '../src/lib/articleSeo.js';
import type { Article } from '../src/lib/api.js';

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failures++;
  } else {
    console.log(`  ok: ${message}`);
  }
}

const BASE = 'https://portalcerrado.com.br';

const article: Article = {
  id: 1,
  title: 'Incêndio no Pantanal bate recorde',
  slug: 'incendio-pantanal-recorde',
  summary: 'Área queimada supera todos os registros anteriores.',
  category: 'Meio Ambiente',
  published_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-02T08:00:00Z',
  image_url: `${BASE}/img/pantanal.jpg`,
  tags: ['pantanal', 'incêndio'],
  region: 'ms',
};

console.log('\nbuildArticleJsonLd');
{
  const ld = buildArticleJsonLd({
    article,
    canonicalUrl: `${BASE}/noticia/${article.slug}`,
    categoryLabel: article.category,
    imageUrl: article.image_url!,
    reporterName: 'Enzo Bianchi',
    reporterUrl: `${BASE}/reporter/enzo.bianchi`,
  });
  assert(ld['@type'] === 'NewsArticle', "@type deve ser NewsArticle");
  assert(ld.headline === article.title, "headline deve ser o título");
  assert(ld.description === article.summary, "description deve ser o summary");
  assert(ld.datePublished === article.published_at, "datePublished deve ser published_at");
  assert(ld.dateModified === article.updated_at, "dateModified deve ser updated_at");
  assert(ld.author.name === 'Enzo Bianchi', "author.name presente");
  assert(ld.author.url?.includes('enzo.bianchi'), "author.url presente");
  assert(Array.isArray(ld.image) && ld.image[0] === article.image_url, "image deve ser array com image_url");
  assert(ld.inLanguage === 'pt-BR', "inLanguage deve ser pt-BR");
  assert(ld.isAccessibleForFree === true, "isAccessibleForFree deve ser true");
  assert(Array.isArray(ld.keywords), "keywords deve ser array");
  assert(ld.keywords.includes('pantanal'), "keywords inclui tags");
  assert(ld.url === `${BASE}/noticia/${article.slug}`, "url igual ao canonicalUrl");
}

console.log('\nbuildArticleJsonLd (sem reporter URL)');
{
  const ld = buildArticleJsonLd({
    article,
    canonicalUrl: `${BASE}/noticia/${article.slug}`,
    categoryLabel: article.category,
    imageUrl: article.image_url!,
    reporterName: 'Repórter Genérico',
  });
  assert(ld.author.name === 'Repórter Genérico', "author.name sem URL");
  assert(ld.author.url === undefined, "author.url ausente quando não fornecido");
}

console.log('\nbuildBreadcrumbJsonLd');
{
  const ld = buildBreadcrumbJsonLd([
    { name: 'Portal Cerrado', url: BASE },
    { name: 'Meio Ambiente', url: `${BASE}/categoria/meio-ambiente` },
    { name: article.title, url: `${BASE}/noticia/${article.slug}` },
  ]);
  assert(ld['@type'] === 'BreadcrumbList', "@type deve ser BreadcrumbList");
  assert(Array.isArray(ld.itemListElement), "itemListElement deve ser array");
  assert(ld.itemListElement.length === 3, "deve ter 3 itens");
  assert(ld.itemListElement[0].position === 1, "primeira posição = 1");
  assert(ld.itemListElement[2].position === 3, "última posição = 3");
  assert(ld.itemListElement[1].name === 'Meio Ambiente', "nome do item preservado");
}

console.log('\nbuildCategoryItemListJsonLd');
{
  const articles: Article[] = [
    { ...article, id: 1 },
    { ...article, id: 2, slug: 'segundo-artigo', title: 'Segundo artigo' },
    { ...article, id: 3, slug: undefined, title: 'Sem slug' }, // deve ser ignorado
  ];
  const ld = buildCategoryItemListJsonLd(articles, 'Meio Ambiente', BASE);
  assert(ld['@type'] === 'ItemList', "@type deve ser ItemList");
  assert(Array.isArray(ld.itemListElement), "itemListElement deve ser array");
  assert(ld.itemListElement.length === 2, "artigo sem slug deve ser excluído");
  assert(ld.itemListElement[0].position === 1, "posição começa em 1");
  assert(ld.itemListElement[0].url.startsWith(BASE), "url contém BASE");
  assert(ld.name.includes('Meio Ambiente'), "name inclui categoria");
}

if (failures > 0) {
  console.error(`\n${failures} falha(s) encontrada(s).`);
  process.exit(1);
} else {
  console.log(`\nTodos os testes de builders JSON-LD passaram.`);
}
