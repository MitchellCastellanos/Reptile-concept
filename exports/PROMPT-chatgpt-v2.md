# Prompt ChatGPT — completar chatgpt-v2.xlsx (solo filas vacías)

Usa este prompt con **`exports/chatgpt-v2.xlsx`**. Las ~303 filas con sugerencia `high`/`medium` ya vienen rellenadas en K/L/M; tu trabajo es **solo las filas restantes** donde K está vacío.

---

## PROMPT (copiar desde aquí)

Tienes el archivo Excel **`chatgpt-v2.xlsx`** de Reptile Concept (tienda de reptiles, Lachine QC).

### Tu tarea — SOLO esto

Completa **únicamente** las filas de la hoja `Sin categoría` donde la columna **K** (`→ ELEGIR categoria Clover`) está **vacía**.

En esas filas, llena **solo** estas 4 columnas:

| Columna | Header | Qué poner |
|---------|--------|------------|
| **K** | → ELEGIR categoria Clover | Una categoría Clover de la lista permitida |
| **L** | → ELEGIR categoria sitio | Solo si M = `product` (si no, déjala vacía) |
| **M** | → ELEGIR tipo | `product`, `animal` o `ignorar` |
| **N** | notas | Opcional: duda breve si no estás seguro |

### PROHIBIDO — no hagas esto

- **NO modifiques** columnas A–J (cloverItemId, name, price, sugerencias, confidence, reason).
- **NO modifiques** filas donde K **ya tiene valor** (auto-relleno v2).
- **NO agregues** columnas nuevas ni muevas datos de columna.
- **NO borres** filas.
- **NO cambies** la hoja `Lists` ni `INSTRUCCIONES`.
- **NO inventes** categorías Clover nuevas.

### Valores permitidos (texto exacto)

**K — Clover:**
Habitat | Substrat | Decoration | Roche Et Bois/Cork | Plante Vivant | Lumiere | Piece Remplacement/ Electronique | Insecte Vivant | Nourriture | Supplement | Serpent | Lezard | Rongeur | Amphibien | Isopod et Araignee et Fourmis

**L — Sitio (solo si M = product):**
terrarium | substrate | decor | lighting | equipment | food_live | food_frozen | food_packaged | supplement

**M — Tipo:**
- `product` → mercancía boutique
- `animal` → animal vivo (L vacía)
- `ignorar` → gift card, frais, gardiennage, servicios (L vacía)

### Cómo decidir (lee columna B `name`)

1. Usa F–I como pista si existen, pero **decide tú** si están vacías o dicen `review`/`low`.
2. SKU: `PT####` Exo Terra, `DR###` Repashy, `Z99` Zoo Med — **PT no siempre es terrario** (puede ser Lumiere o Supplement).
3. Animales vivos (morph, female/male, especies) → M=`animal`, K= Serpent/Lezard/Amphibien/Isopod…
4. Grillons, dubia, roaches vivos → K=`Insecte Vivant`, L=`food_live`, M=`product`
5. `Gift card`, `Gardiennage`, `Frais`, certificats → M=`ignorar`
6. Comida perro/Gentle Giants DOG → M=`ignorar` (fuera de catálogo reptil)

### Entrega

Devuélveme el **mismo archivo .xlsx** con K/L/M/N completas en todas las filas que tenían K vacío. Confirma cuántas filas completaste.

## FIN DEL PROMPT
