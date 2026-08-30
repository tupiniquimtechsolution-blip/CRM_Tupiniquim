// O runtime Windows desta máquina não expõe os.userInfo() ao tsx. Em POSIX,
// o geteuid nativo é preservado; no Windows, fornecemos apenas o identificador
// temporário de que o carregador precisa para compilar TypeScript.
if (typeof process.geteuid !== "function") {
  Object.defineProperty(process, "geteuid", { value: () => 0 });
}

await import("../node_modules/tsx/dist/cli.mjs");
