# Troubleshooting

## Extension does not load

- Run `pnpm install`.
- Run `pnpm build`.
- Verify that `dist/manifest.json` exists.
- Load the `dist` directory from `chrome://extensions` in Developer mode.

## Popup does not appear

- Ensure the `action.default_popup` is set correctly.
- Check the extension console for runtime errors.

## Content script not running

- Confirm the site matches the manifest `host_permissions`.
- Check the browser console for injection errors.

## Build errors

- Run `pnpm typecheck` and `pnpm lint` to isolate TypeScript or ESLint issues.
- Confirm dependency installation is complete.
