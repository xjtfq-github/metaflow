export type Version = string;

export interface VersionedDSL {
  version: Version;
}

export type MigrationFn<TIn extends VersionedDSL, TOut extends VersionedDSL> = (
  input: TIn,
) => TOut;

export type MigrationStep<T extends VersionedDSL> = {
  from: Version;
  to: Version;
  migrate: MigrationFn<any, any>;
};

export function migrateToVersion<T extends VersionedDSL>(
  input: T,
  steps: Array<MigrationStep<VersionedDSL>>,
  targetVersion: Version,
): VersionedDSL {
  let current: VersionedDSL = input;

  const visited = new Set<string>();
  while (current.version !== targetVersion) {
    const key = current.version;
    if (visited.has(key)) {
      throw new Error(`Migration loop detected at version: ${key}`);
    }
    visited.add(key);

    const step = steps.find((s) => s.from === current.version);
    if (!step) {
      throw new Error(`No migration step found from version: ${current.version}`);
    }
    current = step.migrate(current);
  }

  return current;
}

