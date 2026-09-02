export class UserDto {
  id: string;
  email?: string;
  phone?: string;
  username?: string;
  isAdmin?: boolean;
  status?: string;
  roles?: string[];
  permissions?: string[];
  name?: string;
  fullName?: string;
  avatarUrl?: string;
  profile?: any;
  sessionId?: string;
  tokenId?: string;
  employeeId?: string;
  employeeName?: string;
  employeeCode?: string;
  code?: string;
}
