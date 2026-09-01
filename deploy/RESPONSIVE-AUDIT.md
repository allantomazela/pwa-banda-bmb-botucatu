# Auditoria de responsividade — BMB PWA (ago/2026)

## 1. Overflow horizontal indesejado

| Área | Problema | Severidade |
|------|----------|------------|
| `HomeHero` | Orbes decorativos com `left-[-8%]` / `right-[-6%]` | Baixa (section já usa `overflow-hidden`) |
| `BrandMark` (hero) | `tracking-[0.55em]` + títulos grandes em 320px | Média |
| `Header` desktop | Nav dinâmica (CMS) sem `min-w-0` — risco em telas médias | Média |
| `Footer` | Sem padding inferior no mobile — conteúdo fica atrás da bottom bar | **Alta** |
| Tiles home | `hover:scale-[1.02]` pode vazar sem `overflow-hidden` no pai | Baixa |
| Admin bottom bar | 8 itens — scroll horizontal intencional (`overflow-x-auto`) | OK |

**Mitigação global:** `overflow-x: clip` em `#root` + `min-w-0` nos flex children.

## 2. Larguras/alturas fixas rígidas

| Arquivo | Valor | Impacto |
|---------|-------|---------|
| `SponsorLogos` | `h-[230px]` cards | Proporção rígida em telas baixas |
| `DigitalIdCard` | `min-h-[560px]`, `max-w-[360px]` | OK (carteirinha); print separado |
| `Media.tsx` | `md:w-[360px]` tabs | OK |
| `Agenda` | `lg:grid-cols-[220px_1fr]` | OK com grid |
| Admin tables | `overflow-x-auto` wrappers | Padrão correto para tabelas |

## 3. Mídias sem contenção

| Arquivo | Status |
|---------|--------|
| `CmsSections` iframe | `aspect-video` + `w-full` — OK; falta `max-w-full` explícito |
| `CmsSections` img | `w-full max-h-[70vh]` — OK |
| `PhotoMasonryGrid` | `object-cover` + aspect — OK |
| `HomeGalleryShowcase` | `object-contain` — OK |
| `Layout` bg | `object-cover` fixed — OK |
| Vídeos `Media.tsx` | `aspect-video` — OK |

## 4. Nav, modais e touch targets

| Item | Problema |
|------|----------|
| `HomeHero` link agenda | `h-9 w-9` (36px) — **abaixo de 44px** |
| `HomeGalleryShowcase` | Botões `h-10 w-10` — limite; dots ~6px — **abaixo de 44px** |
| `BottomBarItem` | Altura ~3.85rem bar OK; área clicável estreita em labels longos |
| `MemberEditDialog` | `max-h-[90vh]` vs `90dvh` — inconsistência mobile |
| Sticky headers | Falta `pt-safe` para notch |
| `Header` mobile login | `size="sm"` — touch pequeno |

## 5. Viewport e Safe Area

| Item | Status |
|------|--------|
| `index.html` | `viewport-fit=cover` ✓ |
| `body` | `safe-area-inset-left/right` ✓ |
| `.pb-safe` / `.pt-safe` | Definidos em `main.css` ✓ |
| Headers sticky | **Sem `pt-safe`** |
| Login | **Sem `pb-safe`** |
| Footer mobile | **Sem espaço para bottom bar** |

---

Correções aplicadas nos commits seguintes a este documento.
