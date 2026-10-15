# Nightfall v0.1 technical notes

## UX
- Three-column visual editor, working offline simulated ChatGPT layout, live backdrop engine, parameter controls, import/export.
- Presets use CSS token color system; themes are normalized to safe ranges.
- Browsers: content script renders a cosmetic layer on chatgpt.com; popup updates via chrome.storage.local without a page reload.
- Desktop: CommonJS renderer tweak for a third-party runtime, an experiment rather than a verified official theme API.

## Boundaries
- No API keys, login forms, data collection, analytics or outbound connections.
- Cosmetic DOM + styles only. Does not replace message-sending buttons or alter chat data.
- Content selectors are conservative to limit damage when the host changes.
- Reduced-motion preference is honored for stars animation and CSS animations.
- Background uploads use base64 data URIs for local persistence, not external URLs. Quotas apply.

## Next compatibility tests
- Identify exact installed Windows ChatGPT app version and package type.
- Establish whether the runtime supports its renderer; don't imply native compatibility before a successful smoke test.
- Test with both light/dark host, sidebar collapse, voice mode, conversation scroll, modal overlays, code blocks.
- Add screenshot-based per-version regression before shipping an installer.
