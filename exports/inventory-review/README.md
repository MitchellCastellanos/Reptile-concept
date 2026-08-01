# Inventario Reptiles Concept — Export de revisión

Generado: 2026-08-01T01:22:06.336Z

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Pendientes total | 1182 |
| Sin categoría Clover | 588 |
| Sugerencia alta confianza | 788 |
| Sugerencia media confianza | 109 |
| Revisión manual (baja) | 285 |
| → Animales | 662 |
| → Productos | 234 |
| → Ignorar | 1 |
| → Revisar | 285 |
| Productos ya creados | 596 |
| Lotes sugeridos | 21 |

## Archivos

| Archivo | Para qué |
|---------|----------|
| `01-pending-with-suggestions.csv` | Todos los pendientes con sugerencias |
| `02-batch-triage-summary.csv` | **Empezar aquí** — lotes para acción masiva |
| `03-clover-to-site-mapping.csv` | Mapeo Clover ↔ sitio (cambios mínimos) |
| `04-existing-products-enrichment.csv` | 596 productos creados — qué falta enriquecer |
| `05-uncategorized-only.csv` | Solo los 588 sin categoría Clover |
| `06-manual-review-queue.csv` | Items que necesitan ojo humano |

## Estrategia recomendada (mínimo cambio en Clover)

1. **NO crear categorías nuevas en Clover** — usar las 15 existentes.
2. **Solo re-categorizar en Clover** los 588 items sin categoría (asignarles una existente).
3. **Mapeo 1:1** de categorías merchandise Clover → categoría sitio (ver 03).
4. **Animales** quedan en Clover como están; en el sitio van a `/animals`, no a boutique.
5. **Opcional en Clover**: mover feeders (ASF, grillons sueltos) de "Rongeur" → "Insecte Vivant" si quieren consistencia.

## Columnas clave

- `cloverChange`: qué hacer en Clover POS (idealmente solo "Asignar X" para sin categoría)
- `suggestedSiteCategory`: categoría en nuestro sitio
- `recordType`: animal | product | ignore | review
- `confidence`: high = aplicar en lote con confianza
