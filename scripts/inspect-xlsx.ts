import ExcelJS from "exceljs";

async function inspect(path: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  for (const ws of wb.worksheets) {
    console.log("---", ws.name, "rows", ws.rowCount);
    const h: unknown[] = [];
    ws.getRow(1).eachCell((c, i) => {
      h[i] = c.value;
    });
    console.log("Headers:", JSON.stringify(h.filter(Boolean)));
    if (ws.rowCount > 1) {
      for (const ri of [2, 3, 100, 500]) {
        if (ri > ws.rowCount) continue;
        const r: unknown[] = [];
        ws.getRow(ri).eachCell({ includeEmpty: true }, (c, i) => {
          r[i] = c.value;
        });
        console.log(`Row${ri} (${r.filter((x) => x != null && x !== "").length} cells):`, JSON.stringify(r.slice(0, 15)));
      }
    }
  }
}

inspect(process.argv[2] ?? "exports/chatgpt.xlsx").catch(console.error);
