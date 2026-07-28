import bcrypt from 'bcryptjs';
import { env } from '../../src/config/env';
import { User, UserRole } from '../../src/models';
import { signToken } from '../../src/services/token.service';

let counter = 0;

/** Creates a persisted user of the given role and returns a usable Bearer header value. */
export const createUserWithToken = async (
  role: UserRole = 'user',
): Promise<{ user: User; authHeader: string }> => {
  counter += 1;
  const user = await User.create({
    name: `${role} ${counter}`,
    email: `${role}${counter}@example.com`,
    passwordHash: await bcrypt.hash('sup3rsecret', env.bcryptSaltRounds),
    role,
  });

  return { user, authHeader: `Bearer ${signToken({ sub: user.id, role: user.role })}` };
};
