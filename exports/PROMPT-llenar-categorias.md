# Prompt para IA — clasificar inventario Reptile Concept

Copia y pega todo el bloque siguiente a otra IA (ChatGPT, Claude, etc.) junto con el archivo **`solo-sin-categoria.xlsx`**.

---

## INICIO DEL PROMPT (copiar desde aquí)

Eres un asistente de inventario para **Reptile Concept**, una tienda de reptiles en Lachine, Québec. Recibes un Excel con artículos de su POS **Clover** que **no tienen categoría asignada**. Tu trabajo es revisar cada fila y **llenar las columnas de decisión** basándote en el nombre del producto.

### Archivo

- Hoja principal: `Sin categoría (N)` — una fila por artículo.
- **NO modifiques** las columnas A–J (datos de referencia y sugerencias automáticas).
- **SÍ llena** estas columnas:
  - **K** — `→ ELEGIR categoria Clover`
  - **L** — `→ ELEGIR categoria sitio`
  - **M** — `→ ELEGIR tipo`
  - **N** — `notas` (opcional: duda, marca detectada, typo en nombre)

### Reglas estrictas

1. **Usa SOLO valores exactos** de las listas permitidas (mayúsculas, acentos y espacios incluidos). No inventes categorías nuevas en Clover.
2. **Categorías Clover permitidas** (columna K):
   - Habitat
   - Substrat
   - Decoration
   - Roche Et Bois/Cork
   - Plante Vivant
   - Lumiere
   - Piece Remplacement/ Electronique
   - Insecte Vivant
   - Nourriture
   - Supplement
   - Serpent
   - Lezard
   - Rongeur
   - Amphibien
   - Isopod et Araignee et Fourmis

3. **Categorías sitio** (columna L) — solo cuando tipo = `product`:
   - terrarium — cages, terrarios, faunariums, paludariums
   - substrate — sustratos, bedding, musgo, tierra
   - decor — hides, ramas, rocas, plantas decorativas, cork
   - lighting — bombillas UVB/UVA, heat, ceramic heaters, tapetes térmicos
   - equipment — bombas, filtros, termostatos, timers, repuestos electrónicos
   - food_live — grillons, dubia, mealworms, insectos vivos
   - food_frozen — alimento congelado
   - food_packaged — pellets, dietas Repashy/Mazuri, comida empaquetada
   - supplement — vitaminas, calcio, electrolitos

4. **Tipo** (columna M):
   - `product` — mercancía para vender en la tienda en línea
   - `animal` — animal vivo (serpiente, gecko, tarántula, isópodo, etc.) → **deja columna L vacía**
   - `ignorar` — certificados regalo, frais de livraison, depósitos, servicios → **deja L vacía**

5. **Prioridad de decisión:**
   - Lee el **nombre** (`name`). Muchos empiezan con SKU de proveedor: `PT####` = Exo Terra, `DR###` = Repashy, `Z99` = Zoo Med, `5TNL` = Mazuri.
   - Si las columnas F–I (`sugerencia_*`, `confidence`, `reason`) tienen valor **high**, úsalas salvo que el nombre contradiga claramente.
   - **PT#### no siempre es terrario**: muchos códigos PT de Exo Terra son **suplementos, lámparas o accesorios**, no Habitat. Lee el texto después del código.
   - Animales: nombres con morph/genética (het, super, female, male), especies (python, gecko, boa, tarantula) → tipo `animal` + categoría Clover de animal correspondiente.
   - Insectos/feeder vivos → Clover `Insecte Vivant`, sitio `food_live`.
   - Repashy / Mazuri / dietas → Clover `Nourriture`, sitio `food_packaged`.
   - UVB / heat / bulb / lamp → Clover `Lumiere`, sitio `lighting`.
   - Termostato / mister / pump / filter → Clover `Piece Remplacement/ Electronique`, sitio `equipment`.

6. **Cola (`queue_status`):**
   - `pending` = aún no está en el sitio web; categorizar en Clover es lo primero.
   - `created` = ya existe producto en el sitio pero sin categoría Clover; igual hay que asignar categoría en Clover.

7. Si no estás seguro (confidence baja o nombre ambiguo), **elige la mejor opción** y explica la duda brevemente en `notas`. Prefiere categoría merchandise sobre animal si es claramente un producto de marca (Exo Terra, Zoo Med, etc.).

### Formato de entrega

Devuelve el Excel completo con columnas K, L, M (y N si aplica) llenas para **todas las filas**. No elimines filas. No cambies cloverItemId ni name.

### Contexto de la tienda

- Idioma del inventario: francés/inglés mezclado (nombres tal como están en Clover).
- **No crear categorías nuevas en Clover** — solo las 15 listadas arriba.
- Objetivo: que el dueño pueda ir artículo por artículo (o por lote) en Clover POS y asignar la misma categoría que pusiste en columna K.

## FIN DEL PROMPT

---

## Después de que la IA llene el Excel

1. Revisa filas con `confidence = low` o notas con dudas.
2. En Clover POS / Dashboard → **Inventory → Items**, busca por nombre y asigna la categoría de columna K.
3. En el sitio: **Admin → Paramètres → Synchroniser Clover** (o espera ~10 min al cron).
4. Items `pending` con categoría ya asignada aparecerán en **Admin → Import Clover** agrupados por categoría para creación masiva.
5. Cuando tengas el Excel final validado, avisa al dev para aplicar columnas L/M al sitio en lote (script de importación).
