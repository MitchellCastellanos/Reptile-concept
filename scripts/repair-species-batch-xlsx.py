"""Re-save ChatGPT xlsx files so ExcelJS/Node can read them reliably."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("pip install openpyxl")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
DIRS = [
    ROOT / "exports" / "species-batch-in",
    ROOT / "exports" / "species-batch-done",
]


def repair(path: Path) -> bool:
    try:
        wb = openpyxl.load_workbook(path)
        tmp = path.with_suffix(".tmp.xlsx")
        wb.save(tmp)
        tmp.replace(path)
        return True
    except Exception as e:
        print(f"FAIL {path.name}: {e}")
        return False


def main() -> None:
    ok = fail = 0
    for d in DIRS:
        if not d.exists():
            continue
        for path in sorted(d.glob("*.xlsx")):
            if path.name.startswith("~$"):
                continue
            if repair(path):
                print(f"OK {path.relative_to(ROOT)}")
                ok += 1
            else:
                fail += 1
    print(f"\nRepaired {ok}, failed {fail}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
