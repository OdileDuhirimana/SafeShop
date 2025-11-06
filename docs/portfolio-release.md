# Portfolio Release Checklist

Use this before publishing the project as a portfolio artifact.

## 1) Rotate Secrets First
If any real secrets were ever committed, rotate them immediately:
- database credentials
- JWT secret
- Stripe keys
- any cloud/service tokens

## 2) Rewrite Git History
Install `git-filter-repo` and remove sensitive or heavy paths from all commits.

```bash
pip install git-filter-repo
git checkout main
git branch backup/pre-portfolio-clean
git filter-repo --force --path backend/.env --path frontend/node_modules --invert-paths
```

## 3) Verify History Is Clean

```bash
git log -- backend/.env
git ls-files | grep node_modules
```

Expected:
- no history for `backend/.env`
- no tracked `node_modules` files

## 4) Create a Clean, Readable Commit Story
Recommended sequence:
1. `feat(concierge): add goal + budget recommendation flow`
2. `feat(alerts): add price watch alerts and triggered checks`
3. `feat(checkout): add savings optimizer endpoint and UI`
4. `feat(metrics): add seller trust score + inventory forecast`
5. `chore(repo): untrack node_modules and update docs`

## 5) Push Clean Branch

```bash
git push --force-with-lease origin main
```

If you want to keep old remote history, push to a new branch first:

```bash
git push origin main:portfolio/main-clean
```
