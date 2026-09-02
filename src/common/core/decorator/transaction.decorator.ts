import { IsolationLevel, Propagation, Transactional } from 'typeorm-transactional';

export function DefTransaction(options?: {
  connectionName?: string;
  propagation?: Propagation;
  isolationLevel?: IsolationLevel;
}): MethodDecorator {
  if (!options) {
    return Transactional();
  }

  const { connectionName, propagation, isolationLevel } = options;

  return Transactional({
    connectionName,
    propagation,
    isolationLevel,
  });
}
