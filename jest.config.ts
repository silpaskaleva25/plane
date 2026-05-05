import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

const config = async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
});

export default config;
