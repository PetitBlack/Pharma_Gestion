import type { User } from '@/models/User';
import { mockUsers } from './mockData';

class UserService {
  private users: User[] = [...mockUsers];

  authenticate(username: string, password: string): User | null {
    const user = this.users.find(
      u => u.username === username && u.password === password
    );
    return user || null;
  }

  getAll(): User[] {
    return this.users.map(u => ({ ...u, password: '***' }));
  }

  getById(id: string): User | undefined {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return { ...user, password: '***' };
    }
    return undefined;
  }

  add(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `U${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return { ...newUser, password: '***' };
  }

  update(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...updates };
    return { ...this.users[index], password: '***' };
  }

  delete(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }
}

export const userService = new UserService();
