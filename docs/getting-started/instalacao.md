# Instalação

O OmniSaber é uma aplicação web estática com uma camada Supabase. O frontend pode ser servido por qualquer servidor HTTP local.

## Objetivo

Preparar o ambiente para abrir as páginas sem depender de `file://`, que pode bloquear scripts e requisições.

## Estrutura

- Frontend: `frontend/`
- Backend e cliente Supabase: `backend/`
- Documentação: `docs/`

## Funcionamento

Use um servidor HTTP na raiz do repositório. Exemplo com Python:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080/`.

## Pontos de atenção

O projeto não possui bundler ou etapa de build frontend documentada. Dependências locais do backend ficam em `backend/package.json` e `backend/requirements-dev.txt`.
