<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Management app lives under `/app/*` inside the `_authenticated` layout; unbuilt modules route through `app.m.$section.tsx`. Why: one gated shell, sidebar always resolves.
- Sensitive operations (lead conversion, stage moves) are SECURITY DEFINER SQL functions with role checks; roles live only in `user_roles`. Why: authorization enforced in the database, not the UI.
- Sidebar visibility comes from `SECTION_ACCESS` in `src/lib/roles.ts`, which is UX only; RLS is the boundary.
