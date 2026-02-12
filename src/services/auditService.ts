import type { AuditLog, AuditAction } from '@/models/AuditLog';

class AuditService {
  private logs: AuditLog[] = [];

  log(
    action: AuditAction,
    orderId: string,
    orderNumber: string,
    userId: string,
    userName: string,
    userRole: string,
    details?: string
  ): AuditLog {
    const logEntry: AuditLog = {
      id: `LOG${Date.now()}`,
      action,
      orderId,
      orderNumber,
      userId,
      userName,
      userRole,
      timestamp: new Date().toISOString(),
      details
    };

    this.logs.push(logEntry);
    return logEntry;
  }

  getAll(): AuditLog[] {
    return [...this.logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getByOrder(orderId: string): AuditLog[] {
    return this.logs.filter(l => l.orderId === orderId);
  }

  getTodayLogs(): AuditLog[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.logs.filter(l => {
      const logDate = new Date(l.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });
  }
}

export const auditService = new AuditService();
