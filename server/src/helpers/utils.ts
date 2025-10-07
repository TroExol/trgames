export function getProcessArg(name: string): string | undefined {
  const processArgs = process.argv.slice(2);
  const index = processArgs.indexOf(name);

  if (index === -1) {
    return;
  }

  return processArgs[index + 1];
}

export function sleep(timeMs: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeMs);
  });
}
