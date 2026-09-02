import { Controller, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { NO_CONTENT_ROUTES } from './common/constants';
import { DefGet } from './common/core/decorator';
import { dataSource } from './typeorm';

@ApiTags('Root')
@Controller({ path: '/', version: '1.00' })
export class AppController {
  @DefGet()
  root() {
    return { message: 'API is running' };
  }

  @DefGet('health')
  async health() {
    let database = 'down';
    try {
      if (dataSource.isInitialized) {
        await dataSource.query('SELECT 1');
        database = 'up';
      }
    } catch {
      database = 'down';
    }
    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      redisConfigured: Boolean(process.env.REDIS_HOST),
      timestamp: new Date().toISOString(),
    };
  }

  @DefGet(NO_CONTENT_ROUTES)
  noContent(@Res() res: Response) {
    res.status(204).send();
  }
}
