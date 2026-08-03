import type { SpeciesCandidate } from "../src/lib/species-candidates";
import { ANIMAL_CATEGORIES } from "../src/lib/animal-categories";
import ExcelJS from "exceljs";

export const FILL_HEADERS = [
  "commonNameFr",
  "commonNameEn",
  "experienceLevel",
  "descriptionFr",
  "descriptionEn",
  "adultSizeFr",
  "adultSizeEn",
  "lifespanFr",
  "lifespanEn",
  "temperamentFr",
  "temperamentEn",
  "dietFr",
  "dietEn",
  "humidity",
  "tempDay",
  "tempNight",
  "uvbNeeds",
  "enclosureMinSize",
  "substrate",
  "feedingFrequency",
  "handlingFr",
  "handlingEn",
] as const;

export const INPUT_HEADERS = [
  "row_id",
  "scientificName",
  "category",
  "animalCount",
  "exampleNames",
  "notes",
] as const;

export function splitCandidates(candidates: SpeciesCandidate[], parts: number): SpeciesCandidate[][] {
  if (parts <= 1) return [candidates];
  const chunks: SpeciesCandidate[][] = Array.from({ length: parts }, () => []);
  candidates.forEach((c, i) => {
    chunks[i % parts].push(c);
  });
  return chunks.filter((c) => c.length > 0);
}

export async function writeSpeciesWorkbook(
  candidates: SpeciesCandidate[],
  outPath: string,
  partLabel?: string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Reptile Concept";
  wb.created = new Date();

  const ws = wb.addWorksheet("Espèces");
  const instructions = wb.addWorksheet("INSTRUCCIONES");
  const lists = wb.addWorksheet("Lists");
  lists.state = "veryHidden";

  ANIMAL_CATEGORIES.forEach((v, i) => {
    lists.getCell(`A${i + 1}`).value = v;
  });
  ["beginner", "intermediate", "advanced"].forEach((v, i) => {
    lists.getCell(`B${i + 1}`).value = v;
  });

  const allHeaders = [...INPUT_HEADERS, ...FILL_HEADERS];
  ws.addRow(allHeaders);
  ws.getRow(1).font = { bold: true };

  candidates.forEach((c, i) => {
    ws.addRow([
      i + 1,
      c.scientificName,
      c.category,
      c.animalCount,
      c.exampleNames.join(" | "),
      c.source === "common" ? "Nom commercial — vérifier le taxon" : "",
      ...FILL_HEADERS.map(() => ""),
    ]);
  });

  const catCol = INPUT_HEADERS.indexOf("category") + 1;
  const expCol = INPUT_HEADERS.length + FILL_HEADERS.indexOf("experienceLevel") + 1;
  for (let row = 2; row <= candidates.length + 1; row++) {
    ws.getCell(row, catCol).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`Lists!$A$1:$A$${ANIMAL_CATEGORIES.length}`],
    };
    ws.getCell(row, expCol).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`Lists!$B$1:$B$3`],
    };
  }

  ws.columns.forEach((col) => {
    col.width = 18;
  });
  ws.getColumn(5).width = 40;

  instructions.addRow(["Export species-batch — Reptile Concept"]);
  if (partLabel) instructions.addRow([partLabel]);
  instructions.addRow([""]);
  instructions.addRow(["1. Sube este .xlsx a ChatGPT Premium"]);
  instructions.addRow(["2. Usa el prompt en exports/PROMPT-species-batch.md"]);
  instructions.addRow(["3. Guarda la respuesta en exports/species-batch-in/ (mismo nombre)"]);
  instructions.addRow(["4. npm run inventory:import-species-batch"]);

  await wb.xlsx.writeFile(outPath);
}

export function buildPromptMarkdown(fileLabel: string, speciesCount: number) {
  return `# Prompt ChatGPT — llenar fichas d'espèces (lot)

Usa **el mismo prompt** para cada archivo Excel que te den. Sube el .xlsx a ChatGPT (Premium) y pide que devuelva **el mismo archivo** con las columnas de ficha completadas.

Archivo actual: **\`${fileLabel}\`** (${speciesCount} espèces)

---

## PROMPT (copiar desde aquí)

Tienes el archivo Excel **\`${fileLabel}\`** de Reptile Concept (tienda de reptiles, Lachine QC).

### Tu tarea

Para **cada fila** de la hoja \`Espèces\`, completa **todas** las columnas desde \`commonNameFr\` hasta \`handlingEn\`.

**NO modifiques** las columnas de entrada: \`row_id\`, \`scientificName\`, \`category\`, \`animalCount\`, \`exampleNames\`, \`notes\`.

### Reglas de contenido

- Idiomas: **francés** en columnas \`*Fr\`, **inglés** en columnas \`*En\`.
- \`experienceLevel\`: exactamente \`beginner\`, \`intermediate\` o \`advanced\`.
- Descripciones: 2–4 frases, tono tienda de reptiles, para aficionados.
- Tamaños, temperaturas, humedad: unidades claras (cm, °C, %).
- \`category\` ya está elegida — **no la cambies**.
- Si \`scientificName\` parece nombre comercial (no latín), infiere la especie desde \`exampleNames\`.
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
- No modifiques \`Lists\` ni \`INSTRUCCIONES\`.
- No dejes celdas vacías en columnas de ficha.

### Entrega

Devuélveme el **mismo .xlsx** completo. Confirma cuántas especies llenaste.

## FIN DEL PROMPT

---

## Después (para Mitch / el dev)

1. Guarda cada archivo llenado en \`exports/species-batch-in/\` **con el mismo nombre** (ej. \`species-batch-2-of-3.xlsx\`)
2. Avisa cuando estén los 3 → \`npm run inventory:import-species-batch\`
3. Luego: \`npm run inventory:link-animals-species\`
`;
}
