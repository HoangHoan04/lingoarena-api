import { DATA_SOURCE } from '~/common/constants/typeorm';
import { dataSource } from '~/typeorm';

export const databaseProvider = {
  provide: DATA_SOURCE,
  useFactory: async () => {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
      if (process.env.NODE_ENV == 'production') {
        try {
          await dataSource.runMigrations();
        } catch (error) {
          console.log(`Migrations Error: ${error}`);
        }
      }
      return dataSource;
    }
  },
};
