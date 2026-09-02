import { Injectable, Logger } from '@nestjs/common';
import PQueue from 'p-queue';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private readonly queuePromise: any;

  constructor() {
    this.queuePromise = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 60000,
      timeout: 10000,
    });
  }

  private async getQueue() {
    return this.queuePromise;
  }

  async add<T>(task: () => Promise<T>) {
    const queue = await this.getQueue();

    return queue.add(async () => {
      try {
        return await task();
      } catch (error: any) {
        console.log(`error send email : `, error);
      }
    });
  }
}
