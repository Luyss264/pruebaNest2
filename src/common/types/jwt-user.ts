import { UserRole } from './enums';
export interface JwtUser {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
  mechanicId?: number | null;
}
