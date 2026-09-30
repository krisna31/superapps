import { describe, it, expect } from 'vitest';
import { RegisterDto, LoginDto } from '../modules/auth/dto/auth.dto';
import { validate } from 'class-validator';

describe('Auth DTO Validation', () => {
  it('should validate a valid RegisterDto', async () => {
    const dto = new RegisterDto();
    dto.email = 'agent@superapps.local';
    dto.username = 'agentai';
    dto.password = 'SuperSecurePass123!';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid email in RegisterDto', async () => {
    const dto = new RegisterDto();
    dto.email = 'not-an-email';
    dto.username = 'agentai';
    dto.password = '123456';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject short passwords (< 6 chars)', async () => {
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'agentai';
    dto.password = '123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
