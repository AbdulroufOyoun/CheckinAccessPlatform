import { describe, expect, it } from 'vitest';
import { ApiError, formatApiMessage } from '../models/api-envelope';

describe('ApiError', () => {
  it('keeps status and body', () => {
    const err = new ApiError('Nope', 403, { success: false });
    expect(err.message).toBe('Nope');
    expect(err.status).toBe(403);
    expect(err.body).toEqual({ success: false });
  });
});

describe('formatApiMessage', () => {
  it('flattens laravel validation objects', () => {
    expect(
      formatApiMessage({
        mobile: ['The mobile has already been taken.'],
        email: ['The email has already been taken.'],
      }),
    ).toBe('The mobile has already been taken. The email has already been taken.');
  });

  it('keeps plain strings', () => {
    expect(formatApiMessage('Forbidden')).toBe('Forbidden');
  });
});
