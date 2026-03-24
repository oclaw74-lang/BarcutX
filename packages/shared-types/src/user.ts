export type UserRole = 'customer' | 'barber' | 'shop_owner' | 'platform_admin'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  authId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatarUrl?: string
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface UserWithRoles extends User {
  roles: UserRole[]
}
