export function serverEnv(name: string): string | undefined {
  return process.env[name] || import.meta.env?.[name];
}
