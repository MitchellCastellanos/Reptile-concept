# Manual Clover — categorizar inventario Reptile Concept

Guía para cuando tengas el **Clover frente a ti** (dashboard web o terminal). Objetivo: que cada artículo tenga la **categoría correcta** y un **nombre claro en el recibo**, y que el sitio web se sincronice después.

---

## Archivos que debes tener abiertos

| Archivo | Para qué |
|---------|----------|
| `exports/inventaire-final.xlsx` | Versión maestra validada (588 filas) |
| `exports/clover-checklist-master.csv` | Lista completa ordenada por categoría — **ábrelo en Excel o Google Sheets en el celular** |
| `exports/clover-checklist/*.csv` | Un CSV por categoría Clover — **trabaja lote por lote** |
| Este manual | Pasos en caja |

**No necesitas tocar los 16 items `ignorar`** (gift cards, gardiennage, comida perro, etc.) — no van a la boutique.

---

## Qué verá el cliente en el recibo (transacciones)

En Clover, el nombre que imprime el recibo es el **nombre del artículo** tal como está hoy en inventario (columna `nombre_actual_recibo` en el CSV).

Ejemplos actuales:
- `PT2192 Ampoule Solar Glo ET 125w` → el cliente ve el código PT + descripción
- `13731 Zilla Floating Turtle Trunk` → ve SKU numérico + producto

### ¿Hay que renombrar?

| Prioridad | Acción |
|-----------|--------|
| **Obligatorio ahora** | Asignar **categoría Clover** (columna `asignar_categoria_clover`) |
| **Opcional después** | Limpiar nombre para recibos más legibles |

El CSV incluye `nombre_sugerido_web` — nombre sin prefijo SKU, útil si quieres renombrar:
- Antes: `PT2192 Ampoule Solar Glo ET 125w`
- Sugerido: `Ampoule Solar Glo ET 125w`

**Consejo:** haz primero todas las **categorías** (impacto inmediato en reportes y sync web). Renombra solo productos de alto volumen o los que confunden en caja.

### Convención de nombre recomendada (cuando renombres)

```
[Marque] Description courte [taille]
```

Ejemplos:
- `Exo Terra Ampoule Solar Glo 125W`
- `Repashy Mango Superblend 6 oz`
- `Zilla Basking Hut 8"`

Mantén nombres **únicos** — Clover no permite duplicados exactos.

---

## Parte 1 — Clover Dashboard (web) — recomendado para lotes

Ideal para las **572 filas** con categoría asignada. Más rápido que en la terminal táctil.

### Acceso

1. Entra a [clover.com](https://www.clover.com) → **Log in**
2. **Inventory** → **Items** (Inventaire → Articles)

### Por lote (usa los CSV por categoría)

1. Abre por ejemplo `exports/clover-checklist/Habitat.csv`
2. En Clover, filtra items **sin categoría** o busca por nombre
3. Para cada fila del CSV:
   - Busca el artículo por **nombre** (columna `nombre_actual_recibo`)
   - Abre el item → **Category** → elige exactamente la del CSV (`asignar_categoria_clover`)
   - **Save**
4. Repite con el siguiente CSV (`Lumiere.csv`, `Nourriture.csv`, etc.)

### Orden sugerido (de más fácil a más delicado)

1. **Decoration**, **Substrat**, **Supplement** — poco ambiguo
2. **Lumiere**, **Piece Remplacement/ Electronique**
3. **Nourriture**, **Insecte Vivant**
4. **Habitat**
5. **Animales** (Serpent, Lezard, Amphibien, Isopod…, Rongeur) — revisa uno por uno
6. **Plante Vivant** — plantas vivas / bromelias

### Checklist rápido por item

```
☐ Busqué el nombre en Clover
☐ Categoría = la del CSV (texto exacto, incluyendo acentos)
☐ Guardé
☐ (Opcional) Renombré si el recibo se ve mal
```

---

## Parte 2 — Terminal Clover (en la tienda)

Si prefieres hacerlo en el dispositivo:

1. **More** (⋯) → **Inventory** → **Items**
2. Busca el producto (por nombre o escaneando si tiene barcode)
3. Toca el item → **Edit**
4. **Category** → elige la del CSV
5. **Save**

Mismo criterio: **categoría primero**, nombre después.

---

## Parte 3 — Items `ignorar` (16 filas)

No asignes categoría ni publiques en la web:

- Gift card / Certificat Cadeau
- Gardiennage (semana, jour, mois)
- Gentle Giants DOG (comida perro)
- Imprime 3D, Intérêt, Mood Ring, ITEM CORRECTIF, MZM livre

Pueden quedarse sin categoría en Clover o en una categoría interna si ya usan una para servicios.

---

## Parte 4 — Animales (98 filas)

En Clover, asigna categoría de animal según CSV:
- Serpent, Lezard, Amphibien, Isopod et Araignee et Fourmis, Rongeur

En el **sitio web** van al pipeline **`/animals`**, no a la boutique de productos.

**En transacciones:** el nombre suele incluir morph/género (ej. `Boa Male Napalm`) — **está bien dejarlo así** para trazabilidad interna. Opcional: formato `Espèce — Morph — Sex` si quieren más claridad.

---

## Parte 5 — Después de Clover: sincronizar el sitio

1. Entra al admin del sitio (con contraseña staff): `reptiles-concept.ca/admin`
2. **Paramètres** → **Synchroniser Clover** (botón manual)
3. O espera ~10 min (cron automático)

### Qué pasa al sincronizar

| En Clover hiciste | En el sitio |
|-------------------|-------------|
| Asignaste categoría a item pending | Aparece en **Import Clover** agrupado por categoría |
| Item ya era producto en sitio | Se actualiza categoría + precio/stock |
| Reglas auto_product guardadas | Futuros items de esa categoría Clover se crean solos |

4. Revisa **Admin → Produits** — productos nuevos vienen **no publicados**
5. Publica manualmente cuando la ficha esté lista (foto, descripción)

---

## Parte 6 — Verificar que todo quedó bien

### En Clover

- **Reports** → **Inventory** → filtra por categoría → cuenta items
- Haz una **venta de prueba** (modo test o $0.01) de un item recién categorizado → verifica que el **nombre en el recibo** sea correcto

### En el sitio

- **Admin → Import Clover** → pending debería bajar
- **Boutique** → solo ves productos `published`

### Comparar conteos (aproximado)

| Tipo | Cantidad en Excel final |
|------|-------------------------|
| product | 474 |
| animal | 98 |
| ignorar | 16 (no sync boutique) |

---

## Parte 7 — Comandos técnicos (Mitchell / dev)

Ya ejecutados o disponibles en el repo:

```bash
# Generar inventaire-final + CSVs (corrige PT####)
npm run inventory:finalize

# Simular aplicación a la base de datos
npm run inventory:apply-triage

# Aplicar de verdad a Neon
npm run inventory:apply-triage -- --apply
```

El script `--apply` hace en la BD:
- Marca `ignorar` como ignored
- Actualiza categoría sitio de productos existentes
- Crea productos pending que faltaban
- Guarda reglas auto-import por categoría merchandise

**Importante:** la categoría en Clover POS la pones **tú manualmente** con este manual. La BD ya tiene el plan; cuando Clover sincronice, debe coincidir.

---

## Resumen en 5 pasos

```
1. Abrir clover-checklist/{Categoria}.csv en el celular
2. En Clover Inventory → buscar item → asignar categoría del CSV
3. (Opcional) Renombrar para recibo más claro
4. Admin sitio → Synchroniser Clover
5. Revisar boutique + hacer venta prueba
```

---

## Preguntas frecuentes

**¿Puedo cambiar categorías después?**  
Sí. Cambia en Clover → sync → el sitio sigue.

**¿El código PT/DR en el nombre molesta en caja?**  
En caja ayuda a buscar rápido. En recibo al cliente, considera renombrar los más vendidos.

**¿Qué pasa si un item no lo encuentro?**  
Busca por las primeras palabras del nombre. Usa `cloverItemId` del CSV si contactas soporte Clover.

**¿Publico todo de una vez?**  
No. Publica por categoría cuando tengas fotos/descripciones mínimas.

---

*Generado: inventaire-final.xlsx — Reptile Concept, Lachine QC*
