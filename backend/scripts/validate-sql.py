"""Validação estática dos arquivos PostgreSQL/Supabase do OminiSaber."""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from pglast import parse_sql
except ImportError:
    print("Dependência ausente. Execute: python -m pip install -r requirements-dev.txt")
    raise SystemExit(2)


BACKEND = Path(__file__).resolve().parents[1]
SQL_FILES = sorted(BACKEND.rglob("*.sql"))


def validate_file(path: Path) -> list[str]:
    sql = path.read_text(encoding="utf-8")
    errors: list[str] = []

    try:
        parse_sql(sql)
    except Exception as exc:  # pglast fornece posição e mensagem do PostgreSQL
        errors.append(f"sintaxe inválida: {exc}")

    if len(re.findall(r"(?im)^\s*begin\s*;", sql)) != 1:
        errors.append("deve possuir exatamente um BEGIN transacional")
    if len(re.findall(r"(?im)^\s*commit\s*;", sql)) != 1:
        errors.append("deve possuir exatamente um COMMIT transacional")

    if re.search(r"(?i)grant\s+execute\s+on\s+all\s+functions", sql):
        errors.append("GRANT EXECUTE ON ALL FUNCTIONS não é permitido")
    if re.search(r"(?i)grant\s+.+\s+on\s+all\s+tables", sql):
        errors.append("GRANT em todas as tabelas não é permitido")

    function_pattern = re.compile(
        r"create\s+or\s+replace\s+function\s+([\w.]+)\s*\((?P<args>[^;]*?)\)"
        r"(?P<body>.*?)\$\$\s*;",
        re.IGNORECASE | re.DOTALL,
    )
    for match in function_pattern.finditer(sql):
        body = match.group("body")
        function_name = match.group(1)
        source_match = re.search(r"\bas\s*\$\$(.*)", body, re.IGNORECASE | re.DOTALL)
        source = source_match.group(1) if source_match else ""
        declaration_match = re.match(
            r"\s*declare\s+(.*?)\bbegin\b",
            source,
            re.IGNORECASE | re.DOTALL,
        )
        declared: set[str] = set()
        if declaration_match:
            for declaration in declaration_match.group(1).split(";"):
                variable = re.match(r"\s*([a-z_][a-z0-9_]*)\s+", declaration, re.IGNORECASE)
                if variable:
                    declared.add(variable.group(1).lower())

        into_targets: set[str] = set()
        for statement in source.split(";"):
            if re.search(r"\breturning\b.*?\binto\s+([a-z_][a-z0-9_]*)", statement, re.IGNORECASE | re.DOTALL):
                target = re.search(r"\breturning\b.*?\binto\s+([a-z_][a-z0-9_]*)", statement, re.IGNORECASE | re.DOTALL)
                into_targets.add(target.group(1).lower())
            elif re.match(r"\s*select\b", statement, re.IGNORECASE):
                target = re.search(r"\binto\s+([a-z_][a-z0-9_]*)", statement, re.IGNORECASE)
                if target:
                    into_targets.add(target.group(1).lower())
        for target in sorted(into_targets - declared):
            errors.append(f"{function_name}: variável INTO '{target}' não declarada")

        if not re.search(r"security\s+definer", body, re.IGNORECASE):
            continue
        if not re.search(r"set\s+search_path\s*=\s*''", body, re.IGNORECASE):
            errors.append(f"{function_name}: SECURITY DEFINER sem search_path vazio")
        if not re.search(
            rf"revoke\s+all\s+on\s+function\s+{re.escape(function_name)}\s*\(",
            sql,
            re.IGNORECASE,
        ):
            errors.append(f"{function_name}: função privilegiada sem REVOKE explícito")

    return errors


def main() -> int:
    if not SQL_FILES:
        print("Nenhum arquivo SQL encontrado.")
        return 1

    failed = False
    for sql_file in SQL_FILES:
        errors = validate_file(sql_file)
        relative = sql_file.relative_to(BACKEND.parent).as_posix()
        if errors:
            failed = True
            print(f"ERRO {relative}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK   {relative}")

    combined_sql = "\n".join(path.read_text(encoding="utf-8") for path in SQL_FILES)
    public_tables = set(
        re.findall(
            r"create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)",
            combined_sql,
            re.IGNORECASE,
        )
    )
    rls_tables = set(
        re.findall(
            r"alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security",
            combined_sql,
            re.IGNORECASE,
        )
    )
    missing_rls = sorted(public_tables - rls_tables)
    if missing_rls:
        failed = True
        print(f"ERRO tabelas públicas sem RLS: {', '.join(missing_rls)}")
    else:
        print(f"OK   RLS habilitado em {len(public_tables)} tabelas públicas")

    project_root = BACKEND.parent
    client_files = [BACKEND / "ominisaber-supabase-client.js", *project_root.joinpath("frontend").rglob("*.js")]
    client_source = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in client_files
        if path.exists()
    )
    referenced_tables = set(
        re.findall(r"\.from\(\s*['\"]([a-z0-9_]+)['\"]\s*\)", client_source, re.IGNORECASE)
    )
    missing_tables = sorted(referenced_tables - public_tables)
    if missing_tables:
        failed = True
        print(f"ERRO tabelas usadas pelo frontend sem definição SQL: {', '.join(missing_tables)}")
    else:
        print(f"OK   {len(referenced_tables)} tabelas usadas pelo frontend possuem definição SQL")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
