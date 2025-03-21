import { beforeAll, afterAll } from '@jest/globals';
import { sequelize } from '../models';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
}); 