import { migrateToVersion, type MigrationStep, type VersionedDSL } from '../dsl-migration';

describe('DSL Migration', () => {
  interface TestDSL extends VersionedDSL {
    name: string;
    data?: any;
  }

  describe('migrateToVersion', () => {
    it('should migrate through single step', () => {
      const steps: MigrationStep<VersionedDSL>[] = [
        {
          from: '1.0.0',
          to: '2.0.0',
          migrate: (input: TestDSL) => ({
            ...input,
            version: '2.0.0',
            data: { migrated: true },
          }),
        },
      ];

      const input: TestDSL = {
        version: '1.0.0',
        name: 'Test',
      };

      const result = migrateToVersion(input, steps, '2.0.0') as TestDSL;

      expect(result.version).toBe('2.0.0');
      expect(result.data?.migrated).toBe(true);
    });

    it('should migrate through multiple steps', () => {
      const steps: MigrationStep<VersionedDSL>[] = [
        {
          from: '1.0.0',
          to: '1.1.0',
          migrate: (input: TestDSL) => ({
            ...input,
            version: '1.1.0',
            data: { step1: true },
          }),
        },
        {
          from: '1.1.0',
          to: '2.0.0',
          migrate: (input: TestDSL) => ({
            ...input,
            version: '2.0.0',
            data: { ...input.data, step2: true },
          }),
        },
      ];

      const input: TestDSL = {
        version: '1.0.0',
        name: 'Test',
      };

      const result = migrateToVersion(input, steps, '2.0.0') as TestDSL;

      expect(result.version).toBe('2.0.0');
      expect(result.data?.step1).toBe(true);
      expect(result.data?.step2).toBe(true);
    });

    it('should return input if already at target version', () => {
      const steps: MigrationStep<VersionedDSL>[] = [];

      const input: TestDSL = {
        version: '2.0.0',
        name: 'Test',
      };

      const result = migrateToVersion(input, steps, '2.0.0');

      expect(result).toEqual(input);
    });

    it('should throw error on missing migration step', () => {
      const steps: MigrationStep<VersionedDSL>[] = [
        {
          from: '1.0.0',
          to: '2.0.0',
          migrate: (input) => ({ ...input, version: '2.0.0' }),
        },
      ];

      const input: TestDSL = {
        version: '0.9.0',
        name: 'Test',
      };

      expect(() => {
        migrateToVersion(input, steps, '2.0.0');
      }).toThrow('No migration step found from version: 0.9.0');
    });

    it('should detect migration loops', () => {
      const steps: MigrationStep<VersionedDSL>[] = [
        {
          from: '1.0.0',
          to: '1.0.0', // Loop to itself
          migrate: (input) => input,
        },
      ];

      const input: TestDSL = {
        version: '1.0.0',
        name: 'Test',
      };

      expect(() => {
        migrateToVersion(input, steps, '2.0.0');
      }).toThrow('Migration loop detected at version: 1.0.0');
    });

    it('should handle real-world scenario: visible field migration', () => {
      // Scenario: visible changed from boolean to Expression
      interface DSLv1 extends VersionedDSL {
        visible: boolean;
      }

      interface DSLv2 extends VersionedDSL {
        visible: string; // Expression
      }

      const steps: MigrationStep<VersionedDSL>[] = [
        {
          from: '1.0.0',
          to: '2.0.0',
          migrate: (input: DSLv1) => ({
            version: '2.0.0',
            visible: input.visible ? 'true' : 'false',
          }),
        },
      ];

      const input: DSLv1 = {
        version: '1.0.0',
        visible: true,
      };

      const result = migrateToVersion(input, steps, '2.0.0') as DSLv2;

      expect(result.version).toBe('2.0.0');
      expect(result.visible).toBe('true');
      expect(typeof result.visible).toBe('string');
    });
  });
});
