const save = async (value: string): Promise<string> => {
  await Promise.resolve();
  return value;
};

const logFailure = (error: unknown): void => {
  globalThis.reportError(error);
};

export const saveLater = (value: string): void => {
  save(value).catch(logFailure);
};
