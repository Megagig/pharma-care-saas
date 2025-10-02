import { SecurityMonitoringService } from '../../services/SecurityMonitoringService';
import { SecuritySettings } from '../../models/SecuritySettings';
import { UserSession } from '../../models/UserSession';
import { SecurityAuditLog } from '../../models/SecurityAuditLog';
import { User } from '../../models/User';
import { RedisCacheService } from '../../services/RedisCacheService';
import { AuditService } from '../../services/auditService';

// Mock dependencies
jest.mock('../../models/SecuritySettings');
jest.mock('../../models/UserSession');
jest.mock('../../models/SecurityAuditLog');
jest.mock('../../models/User');
jest.mock('../../services/RedisCacheService');
jest.mock('../../services/auditService');
jest.mock('../../utils/logger');
jest.mock('bcrypt');
jest.mock('crypto');

describe('SecurityMonitoringService', () => {
  let service: SecurityMonitoringService;
  let mockCacheService: jest.Mocked<RedisCacheService>;
  let mockAuditService: jest.Mocked<typeof AuditService>;

  const mockSecuritySettings = {
    _id: 'settings123',
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5
    },
    sessionSettings: {
      maxDuration: 480,
      idleTimeout: 30,
      maxConcurrentSessions: 3,
      requireReauthentication: false
    },
    accountLockout: {
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      autoUnlock: true,
      notifyOnLockout: true
    },
    twoFactorAuth: {
      enforced: false,
      methods: ['email'],
      gracePeriod: 7,
      backupCodes: true
    },
    isActive: true,
    save: jest.fn()
  };

  const mockUserSession = {
    _id: 'session123',
    userId: {
      _id: 'user123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    location: 'New York, US',
    loginTime: new Date(),
    lastActivity: new Date(),
    isActive: true,
    deviceInfo: {
      browser: 'Chrome',
      os: 'Windows',
      device: 'Desktop'
    },
    save: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock RedisCacheService
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    } as any;

    // Mock AuditService
    mockAuditService = {
      createAuditLog: jest.fn(),
    } as any;

    // Mock static getInstance methods
    (RedisCacheService.getInstance as jest.Mock).mockReturnValue(mockCacheService);
    (AuditService as any) = mockAuditService;

    service = SecurityMonitoringService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SecurityMonitoringService.getInstance();
      const instance2 = SecurityMonitoringService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getSecuritySettings', () => {
    it('should return cached settings if available', async () => {
      mockCacheService.get.mockResolvedValue(mockSecuritySettings);

      const result = await service.getSecuritySettings();

      expect(mockCacheService.get).toHaveBeenCalledWith('security:settings');
      expect(result).toEqual(mockSecuritySettings);
    });

    it('should fetch and cache settings if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      (SecuritySettings.findOne as jest.Mock).mockResolvedValue(mockSecuritySettings);

      const result = await service.getSecuritySettings();

      expect(SecuritySettings.findOne).toHaveBeenCalledWith({ isActive: true });
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'security:settings',
        mockSecuritySettings,
        5 * 60 * 1000
      );
      expect(result).toEqual(mockSecuritySettings);
    });

    it('should create default settings if none exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      (SecuritySettings.findOne as jest.Mock).mockResolvedValue(null);

      const mockDefaultSettings = { ...mockSecuritySettings, save: jest.fn().mockResolvedValue(true) };
      (SecuritySettings as any).mockImplementation(() => mockDefaultSettings);

      const result = await service.getSecuritySettings();

      expect(mockDefaultSettings.save).toHaveBeenCalled();
      expect(result).toEqual(mockDefaultSettings);
    });

    it('should handle errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.getSecuritySettings()).rejects.toThrow('Failed to retrieve security settings');
    });
  });

  describe('updatePasswordPolicy', () => {
    it('should successfully update password policy', async () => {
      const newPolicy = {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 60,
        preventReuse: 3
      };

      jest.spyOn(service, 'getSecuritySettings').mockResolvedValue(mockSecuritySettings as any);

      await service.updatePasswordPolicy(newPolicy, 'admin123');

      expect(mockSecuritySettings.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith('security:settings');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_POLICY_UPDATED',
          userId: 'admin123'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      jest.spyOn(service, 'getSecuritySettings').mockRejectedValue(new Error('Settings error'));

      await expect(service.updatePasswordPolicy({} as any, 'admin123')).rejects.toThrow('Settings error');
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions', async () => {
      const mockSessions = [mockUserSession];

      (UserSession.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSessions)
      });

      const result = await service.getActiveSessions(100);

      expect(UserSession.find).toHaveBeenCalledWith({ isActive: true });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sessionId: 'session123',
        userId: 'user123',
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        location: 'New York, US',
        loginTime: mockUserSession.loginTime,
        lastActivity: mockUserSession.lastActivity,
        isActive: true,
        deviceInfo: mockUserSession.deviceInfo
      });
    });

    it('should handle errors gracefully', async () => {
      (UserSession.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getActiveSessions()).rejects.toThrow('Failed to retrieve active sessions');
    });
  });

  describe('terminateSession', () => {
    it('should successfully terminate session', async () => {
      (UserSession.findById as jest.Mock).mockResolvedValue(mockUserSession);

      await service.terminateSession('session123', 'admin123');

      expect(mockUserSession.save).toHaveBeenCalled();
      expect(mockUserSession.isActive).toBe(false);
      expect(mockUserSession.terminationReason).toBe('Admin terminated');
      expect(mockCacheService.del).toHaveBeenCalledWith('session:user123:session123');
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SESSION_TERMINATED',
          userId: 'admin123'
        })
      );
    });

    it('should throw error if session not found', async () => {
      (UserSession.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.terminateSession('nonexistent')).rejects.toThrow('Session not found');
    });

    it('should handle errors gracefully', async () => {
      (UserSession.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.terminateSession('session123')).rejects.toThrow('Database error');
    });
  });

  describe('getLoginHistory', () => {
    it('should return login history with pagination', async () => {
      const mockLogs = [{
        _id: 'log123',
        userId: {
          _id: 'user123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true,
        timestamp: new Date(),
        details: {}
      }];

      (SecurityAuditLog.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs)
      });

      (SecurityAuditLog.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getLoginHistory({ page: 1, limit: 50 });

      expect(result).toEqual({
        history: [{
          id: 'log123',
          userId: 'user123',
          userEmail: 'user@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: true,
          timestamp: mockLogs[0].timestamp,
          failureReason: undefined,
          location: undefined
        }],
        total: 1,
        page: 1,
        pages: 1
      });
    });

    it('should handle errors gracefully', async () => {
      (SecurityAuditLog.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getLoginHistory()).rejects.toThrow('Failed to retrieve login history');
    });
  });

  describe('lockAccount', () => {
    it('should successfully lock account', async () => {
      const mockUser = { _id: 'user123', email: 'user@example.com' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(service, 'getSecuritySettings').mockResolvedValue(mockSecuritySettings as any);
      (UserSession.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      await service.lockAccount('user123', 'Too many failed attempts', 'admin123');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'lockout:user123',
        expect.objectContaining({
          userId: 'user123',
          isLocked: true,
          reason: 'Too many failed attempts'
        }),
        expect.any(Number)
      );

      expect(UserSession.updateMany).toHaveBeenCalledWith(
        { userId: 'user123', isActive: true },
        {
          isActive: false,
          terminatedAt: expect.any(Date),
          terminationReason: 'Account locked'
        }
      );
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.lockAccount('nonexistent', 'reason')).rejects.toThrow('User not found');
    });
  });

  describe('unlockAccount', () => {
    it('should successfully unlock account', async () => {
      const mockUser = { _id: 'user123', email: 'user@example.com' };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await service.unlockAccount('user123', 'admin123');

      expect(mockCacheService.del).toHaveBeenCalledWith('lockout:user123');
      expect(mockCacheService.del).toHaveBeenCalledWith('failed_attempts:user123');
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.unlockAccount('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('isAccountLocked', () => {
    it('should return lockout info if account is locked', async () => {
      const lockoutInfo = {
        userId: 'user123',
        isLocked: true,
        lockoutTime: new Date(),
        unlockTime: new Date(Date.now() + 30 * 60 * 1000),
        failedAttempts: 5,
        reason: 'Too many failed attempts'
      };

      mockCacheService.get.mockResolvedValue(lockoutInfo);

      const result = await service.isAccountLocked('user123');

      expect(result).toEqual(lockoutInfo);
    });

    it('should return unlocked status if no lockout info', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.isAccountLocked('user123');

      expect(result).toEqual({
        userId: 'user123',
        isLocked: false,
        failedAttempts: 0
      });
    });

    it('should auto-unlock if lockout has expired', async () => {
      const expiredLockoutInfo = {
        userId: 'user123',
        isLocked: true,
        lockoutTime: new Date(Date.now() - 60 * 60 * 1000),
        unlockTime: new Date(Date.now() - 30 * 60 * 1000), // Expired 30 minutes ago
        failedAttempts: 5,
        reason: 'Too many failed attempts'
      };

      mockCacheService.get.mockResolvedValue(expiredLockoutInfo);
      jest.spyOn(service, 'unlockAccount').mockResolvedValue();

      const result = await service.isAccountLocked('user123');

      expect(service.unlockAccount).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        userId: 'user123',
        isLocked: false,
        failedAttempts: 0
      });
    });
  });

  describe('recordFailedLoginAttempt', () => {
    it('should record failed attempt and lock account if max attempts reached', async () => {
      jest.spyOn(service, 'getSecuritySettings').mockResolvedValue(mockSecuritySettings as any);
      mockCacheService.get.mockResolvedValue(4); // 4 previous attempts
      jest.spyOn(service, 'lockAccount').mockResolvedValue();

      await service.recordFailedLoginAttempt('user123', '192.168.1.1', 'Mozilla/5.0', 'Invalid password');

      expect(mockCacheService.set).toHaveBeenCalledWith('failed_attempts:user123', 5, 60 * 60 * 1000);
      expect(service.lockAccount).toHaveBeenCalledWith('user123', 'Too many failed login attempts (5)');
    });

    it('should record failed attempt without locking if under max attempts', async () => {
      jest.spyOn(service, 'getSecuritySettings').mockResolvedValue(mockSecuritySettings as any);
      mockCacheService.get.mockResolvedValue(2); // 2 previous attempts
      jest.spyOn(service, 'lockAccount').mockResolvedValue();

      await service.recordFailedLoginAttempt('user123', '192.168.1.1', 'Mozilla/5.0', 'Invalid password');

      expect(mockCacheService.set).toHaveBeenCalledWith('failed_attempts:user123', 3, 60 * 60 * 1000);
      expect(service.lockAccount).not.toHaveBeenCalled();
    });
  });

  describe('recordSuccessfulLogin', () => {
    it('should record successful login and clear failed attempts', async () => {
      jest.spyOn(service, 'checkForSuspiciousActivity').mockResolvedValue();

      await service.recordSuccessfulLogin('user123', '192.168.1.1', 'Mozilla/5.0', 'session123');

      expect(mockCacheService.del).toHaveBeenCalledWith('failed_attempts:user123');
      expect(service.checkForSuspiciousActivity).toHaveBeenCalledWith('user123', '192.168.1.1', 'Mozilla/5.0');
    });
  });

  describe('validatePassword', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getSecuritySettings').mockResolvedValue(mockSecuritySettings as any);
    });

    it('should validate strong password', async () => {
      const result = await service.validatePassword('StrongP@ssw0rd123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
      expect(result.score).toBeGreaterThan(70);
    });

    it('should reject weak password', async () => {
      const result = await service.validatePassword('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
      expect(result.score).toBeLessThan(30);
    });

    it('should check minimum length requirement', async () => {
      const result = await service.validatePassword('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should check character requirements', async () => {
      const result = await service.validatePassword('nouppercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should detect common patterns', async () => {
      const result = await service.validatePassword('Password123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should not contain common patterns');
    });

    it('should detect repeated characters', async () => {
      const result = await service.validatePassword('Passsssword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password should not contain repeated characters');
    });

    it('should handle validation errors gracefully', async () => {
      jest.spyOn(service, 'getSecuritySettings').mockRejectedValue(new Error('Settings error'));

      const result = await service.validatePassword('password');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password validation failed');
      expect(result.strength).toBe('weak');
      expect(result.score).toBe(0);
    });
  });

  describe('getSecurityAuditLogs', () => {
    it('should return security audit logs with pagination', async () => {
      const mockLogs = [{
        _id: 'log123',
        action: 'LOGIN_SUCCESS',
        userId: {
          _id: 'user123',
          email: 'user@example.com'
        },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        success: true
      }];

      (SecurityAuditLog.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs)
      });

      (SecurityAuditLog.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getSecurityAuditLogs({ page: 1, limit: 50 });

      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
        page: 1,
        pages: 1
      });
    });

    it('should handle errors gracefully', async () => {
      (SecurityAuditLog.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.getSecurityAuditLogs()).rejects.toThrow('Failed to retrieve security audit logs');
    });
  });

  describe('clearCache', () => {
    it('should clear all security cache', async () => {
      await service.clearCache();

      expect(mockCacheService.del).toHaveBeenCalledWith('security:settings');
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('lockout:*');
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('failed_attempts:*');
      expect(mockCacheService.delPattern).toHaveBeenCalledWith('security:alert:*');
    });

    it('should handle errors gracefully', async () => {
      mockCacheService.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.clearCache()).rejects.toThrow('Failed to clear security cache');
    });
  });
});