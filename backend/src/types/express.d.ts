import { Role } from './enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        name: string;
        role: Role;
      };
    }
  }
}
