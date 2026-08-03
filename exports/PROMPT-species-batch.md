# Prompt ChatGPT — llenar fichas d'espèces (lot)

Usa **el mismo prompt** para cada archivo Excel que te den. Sube el .xlsx a ChatGPT (Premium) y pide que devuelva **el mismo archivo** con las columnas de ficha completadas.

Archivo actual: **`species-batch-N-of-10.xlsx (~35 espèces max)`** (35 espèces)

---

## PROMPT (copiar desde aquí)

Tienes el archivo Excel **`species-batch-N-of-10.xlsx (~35 espèces max)`** de Reptile Concept (tienda de reptiles, Lachine QC).

### Tu tarea

Para **cada fila** de la hoja `Espèces`, completa **todas** las columnas desde `commonNameFr` hasta `handlingEn`.

**NO modifiques** las columnas de entrada: `row_id`, `scientificName`, `category`, `animalCount`, `exampleNames`, `notes`.

### Reglas de contenido

- Idiomas: **francés** en columnas `*Fr`, **inglés** en columnas `*En`.
- `experienceLevel`: exactamente `beginner`, `intermediate` o `advanced`.
- Descripciones: 2–4 frases, tono tienda de reptiles, para aficionados.
- Tamaños, temperaturas, humedad: unidades claras (cm, °C, %).
- `category` ya está elegida — **no la cambies**.
- Si `scientificName` parece nombre comercial (no latín), infiere la especie desde `exampleNames`.
- La ficha es a nivel **especie**, no individuo (ignora morph/sexe en exampleNames).

### Columnas a llenar

| Columna | Qué poner |
|---------|-----------|
| commonNameFr / commonNameEn | Nombre común bilingüe |
| experienceLevel | beginner / intermediate / advanced |
| descriptionFr / descriptionEn | Descripción general |
| adultSizeFr / adultSizeEn | Tamaño adulto |
| lifespanFr / lifespanEn | Esperanza de vida en cautiverio |
| temperamentFr / temperamentEn | Temperamento |
| dietFr / dietEn | Dieta |
| humidity | Rango % RH |
| tempDay / tempNight | °C día / noche |
| uvbNeeds | Requisitos UVB |
| enclosureMinSize | Terrario mínimo |
| substrate | Sustrato |
| feedingFrequency | Frecuencia alimentación |
| handlingFr / handlingEn | Manipulación |

### PROHIBIDO

- No borres filas ni agregues columnas.
- No modifiques `Lists` ni `INSTRUCCIONES`.
- No dejes celdas vacías en columnas de ficha.

### Entrega

Devuélveme el **mismo .xlsx** completo. Confirma cuántas especies llenaste.

## FIN DEL PROMPT

---

## Después (para Mitch / el dev)

1. Guarda cada archivo llenado en `exports/species-batch-in/` **con el mismo nombre** (ej. `species-batch-2-of-3.xlsx`)
2. Avisa cuando estén los 3 → `npm run inventory:import-species-batch`
3. Luego: `npm run inventory:link-animals-species`
