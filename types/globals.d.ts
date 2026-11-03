// Ambient declarations for the type check (tsconfig.json). The game scripts share one global scope in the browser;
// engine.js and i18n.js also export for Node through `module`, which only exists there.
declare var module: { exports: any } | undefined;
