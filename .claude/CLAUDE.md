# BarcutX — Project Instructions

## Branch Strategy (OVERRIDE del global)

Este proyecto usa el flujo: `feature/* → testing → staging → main`

```
main      → producción (protected, solo PR desde staging)
staging   → pre-producción (protected, solo PR desde testing aprobado por QA)
testing   → integración y QA (protected, solo PR desde feature/*)
feature/* → desarrollo de cada issue
```

### Reglas obligatorias para todos los agentes

1. **Cada agente** crea su rama desde `testing`:
   ```bash
   git checkout testing && git pull origin testing
   git checkout -b feature/<issue-number>-<descripcion-corta>
   ```

2. **Al terminar**: abrir PR hacia `testing` (NO hacia main ni staging)
   ```bash
   gh pr create --base testing --head feature/<nombre>
   ```

3. **QA Engineer** revisa el PR en `testing`:
   - Verifica que los unit tests pasen en CI
   - Ejecuta tests E2E con Playwright
   - Si aprueba → hace merge a `testing`
   - Cuando `testing` está estable → abre PR de `testing → staging`
   - Aprueba el PR `testing → staging` tras validar
   - `staging → main` es responsabilidad del DevOps/PM

4. **Nunca** commit directo a `testing`, `staging` o `main`

## Naming de ramas

```
feature/1-monorepo-setup
feature/2-docker-compose
feature/8-auth-flow
hotfix/99-fix-queue-ttl
```

## Repositorio

- Owner: oclaw74-lang
- Repo: BarcutX
- GitHub: https://github.com/oclaw74-lang/BarcutX
