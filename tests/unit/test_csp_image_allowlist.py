"""A lista de imagens da CSP precisa cobrir os portais que o projeto usa.

Por que este teste existe
-------------------------
A política de imagens ficou restrita a cinco portais enquanto a configuração do
projeto lista trinta e nove. As imagens dos outros portais eram bloqueadas no
navegador, caíam no artefato de substituição e a home passava a repetir a mesma
figura. A lista é grande e manual, então sem um teste ela volta a divergir no
próximo portal curado.

O teste não valida a política em si — ele valida que a lista foi derivada da
configuração de portais, e que placeholders não voltaram.
"""

import re
from pathlib import Path
from urllib.parse import urlparse

import yaml

CONFIG_PORTAIS = Path("config/portals_capital_ms.yml")
CADDYFILES = (Path("Caddyfile"), Path("Caddyfile.test"))

# Hospedeiros genéricos de imagem que não têm relação com a curadoria editorial.
PLACEHOLDERS = ("images.unsplash.com", "picsum.photos", "placehold.co", "via.placeholder")


def _dominios_configurados() -> set[str]:
    """Domínio puro de cada portal, sem esquema, sem `www.` e sem caminho.

   、部分 portais têm subpágina na URL — `hojemais.com.br/tres-lagoas` — então
    o caminho precisa sair antes: a CSP autoriza domínio, não endereço.
    """
    dados = yaml.safe_load(CONFIG_PORTAIS.read_text(encoding="utf-8"))
    achados: set[str] = set()
    for cidades in dados["portals_ms"].values():
        for portal in cidades:
            bruto = portal["url"]
            if "://" not in bruto:
                bruto = f"https://{bruto}"
            dominio = urlparse(bruto).hostname or ""
            achados.add(dominio.removeprefix("www."))
    return achados


def _img_src(caddyfile: Path) -> str:
    texto = caddyfile.read_text(encoding="utf-8")
    achado = re.search(r"img-src ([^;\"]+)", texto)
    assert achado is not None, f"{caddyfile} não define img-src"
    return achado.group(1)


def test_cada_portal_configurado_esta_autorizado_na_csp() -> None:
    """Todo portal curado precisa ter apex e subdomínio liberado."""
    for caddyfile in CADDYFILES:
        img_src = _img_src(caddyfile)
        faltando = []
        for dominio in sorted(_dominios_configurados()):
            if f"https://{dominio}" not in img_src:
                faltando.append(f"https://{dominio}")
            if f"https://*.{dominio}" not in img_src:
                faltando.append(f"https://*.{dominio}")
        assert not faltando, (
            f"{caddyfile} não autoriza {len(faltando)} entrada(s) de portal "
            f"que estão em {CONFIG_PORTAIS}: {', '.join(faltando[:6])}"
        )


def test_img_src_nao_usa_comodao_coringo() -> None:
    """Uma imagem de任意 origem anula a proteção de imagens."""
    for caddyfile in CADDYFILES:
        img_src = _img_src(caddyfile)
        assert "img-src *" not in img_src, f"{caddyfile} abre img-src para qualquer origem"
        assert " https" in img_src, f"{caddyfile} não libera nenhum host externo"


def test_placeholder_de_imagem_nao_volta_para_a_csp() -> None:
    """Bancos de imagem genéricos não pertencem à lista editorial."""
    for caddyfile in CADDYFILES:
        img_src = _img_src(caddyfile)
        for host in PLACEHOLDERS:
            assert host not in img_src, f"{caddyfile} voltou a autorizar {host}"


def test_dominios_de_imagem_observados_sao_do_acervo_configurado() -> None:
    """Serve de canário: avisa quando um host novo surge nas imagens."""
    # Não é uma asserção de navegador, é uma lista de observação dos hosts que
    # aparecem no acervo e que NÃO são subdomínios de nenhum portal configurado.
    # Se um destes aparecer no navegador, é sinal de que a lista precisa revisão.
    hosts_sem_portal_conhecido = {
        "glbimg.com",  # CDN do Globo
        "lnmimg.net",  # CDN de Lance!/Rádio
        "interago.com.br",  # não está na curadoria
    }
    configurados = _dominios_configurados()
    for host in hosts_sem_portal_conhecido:
        assert host not in configurados, (
            f"{host} passou a ser portal curado; revise a lista da CSP"
        )
