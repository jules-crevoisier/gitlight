# Améliorations – GitLight

## ✅ Implémenté

- **1. Recherche de repos** – RepositoryListWithSearch filtre par nom/owner/description.
- **2. Compteur PR sidebar** – openPRCount chargé dans le layout, affiché dans la sidebar.
- **3. API branches isDefault** – `/branches` retourne `{ name, isDefault }[]`.
- **4. Console.log** – Supprimés (DiffViewer, git.ts).
- **5. Page Team** – Liste des repos où l'utilisateur collabore + collaborateurs par repo.
- **6. Responsive mobile** – Menu hamburger + MobileSidebar (drawer).
- **7. Toasts** – ToastProvider + useToast (création repo, merge PR, close PR, copy).
- **8. Gestion erreurs** – Messages d'erreur dans l'UI (toasts, setError).
- **9. Loading / Skeleton** – Composant Skeleton créé (utilisable dans listes/modales).
- **10. Recherche dans le code** – API `/search` + RepoSearch (raccourci `/`).
- **11. SEO / meta** – generateMetadata sur repo, commit, PR.
- **12. Favicon** – favicon.svg (GL).
- **13. Thème sombre** – CSS variables + ThemeToggle dans UserProfile.
- **14. Raccourcis** – `/` pour recherche repo, Esc pour fermer modales (CreateRepoButton).
- **15. Pagination** – Commits/PRs limit 50; "Load more" non ajouté.
- **16. Rate limiting** – apiLimiter sur POST /api/repos et POST /api/settings/tokens.
- **17. Validation** – Zod déjà utilisé (register, repos, tokens, settings).
- **18. Cache** – revalidate = 60 sur la page repo.

---

## Pistes futures

- Pagination "Load more" pour commits et PRs.
- Rate limiting sur login (Auth.js) et APIs Git.
- Dark mode : étendre les classes `dark:` à tous les composants (sidebar, header, etc.).
