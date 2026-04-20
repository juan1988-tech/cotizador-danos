import { describe, it, expect } from 'vitest';
import { OptimisticLockError, NotFoundError } from '../../../shared/utils/errors';

describe('OptimisticLockError', () => {
  it('is an instance of Error', () => {
    const error = new OptimisticLockError('conflict');

    expect(error).toBeInstanceOf(Error);
  });

  it('sets the message correctly', () => {
    const error = new OptimisticLockError('version conflict');

    expect(error.message).toBe('version conflict');
  });

  it('sets name to OptimisticLockError', () => {
    const error = new OptimisticLockError('conflict');

    expect(error.name).toBe('OptimisticLockError');
  });
});

describe('NotFoundError', () => {
  it('is an instance of Error', () => {
    const error = new NotFoundError('not found');

    expect(error).toBeInstanceOf(Error);
  });

  it('sets the message correctly', () => {
    const error = new NotFoundError('resource not found');

    expect(error.message).toBe('resource not found');
  });

  it('sets name to NotFoundError', () => {
    const error = new NotFoundError('not found');

    expect(error.name).toBe('NotFoundError');
  });
});
