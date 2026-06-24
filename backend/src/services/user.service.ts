import { userRepository } from '../repositories/user.repository.js';
import { registerDriverSchema } from '../utils/validators.js';
import { sendEmail } from './mail.service.js';

export class UserService {
  /**
   * Registers a new CONDUCTOR driver under a JEFE manager.
   *
   * @param managerPubKey – The Stellar public key of the requesting manager.
   * @param data          – { name, stellarPubKey } for the new driver.
   * @returns The created driver record.
   */
  async registerDriver(
    managerPubKey: string,
    data: { name: string; stellarPubKey: string },
  ) {
    // 1. Validate request body
    const parsed = registerDriverSchema.safeParse(data);
    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join('; ');
      const err = new Error(messages) as Error & { status: number };
      err.status = 400;
      throw err;
    }

    // 2. Look up the requesting user and verify JEFE role
    const manager = await userRepository.findByStellarPubKey(managerPubKey);
    if (!manager) {
      const err = new Error('Manager not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }
    if (manager.role !== 'JEFE') {
      const err = new Error(
        'Only users with the JEFE role can register drivers',
      ) as Error & { status: number };
      err.status = 403;
      throw err;
    }

    // 3. Check for duplicate Stellar Public Key
    const existing = await userRepository.findByStellarPubKey(
      parsed.data.stellarPubKey,
    );
    if (existing) {
      const err = new Error(
        'A user with this Stellar Public Key already exists',
      ) as Error & { status: number };
      err.status = 409;
      throw err;
    }

    // 4. Create the driver linked to this manager
    const driver = await userRepository.create({
      name: parsed.data.name,
      stellarPubKey: parsed.data.stellarPubKey,
      email: `${parsed.data.stellarPubKey.slice(0, 8).toLowerCase()}@tanko.driver`,
      role: 'CONDUCTOR',
      managerId: manager.id,
    });

    // 5. Send welcome email to the manager (driver emails are auto-generated placeholders)
    if (manager.email) {
      sendEmail({
        to: manager.email,
        subject: `New driver registered: ${driver.name}`,
        template: 'welcome',
        context: {
          driverName: driver.name,
          managerName: manager.name,
        },
      });
    }

    return driver;
  }

  /**
   * Returns all drivers managed by the given manager id.
   */
  async getDriversByManagerId(managerId: string) {
    return userRepository.findDriversByManagerId(managerId);
  }
}

export const userService = new UserService();
