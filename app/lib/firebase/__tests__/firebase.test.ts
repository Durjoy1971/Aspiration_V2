import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Client SDK
vi.mock('firebase/app', () => {
  const mockApp = { name: '[DEFAULT]', options: {} };
  return {
    initializeApp: vi.fn(() => mockApp),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => mockApp),
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ name: 'mock-auth' })),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ name: 'mock-firestore' })),
}));

// Mock Firebase Admin SDK
vi.mock('firebase-admin/app', () => {
  const mockAdminApp = { name: '[DEFAULT-ADMIN]' };
  return {
    initializeApp: vi.fn(() => mockAdminApp),
    getApps: vi.fn(() => []),
    cert: vi.fn((account) => account),
  };
});

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({ name: 'mock-admin-auth' })),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({ name: 'mock-admin-firestore' })),
}));

describe('Firebase Client App Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import and return the initialized client app services', async () => {
    // Dynamically import the clientApp to trigger initialization
    const { app, auth, db } = await import('../clientApp');

    expect(app).toBeDefined();
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });
});

describe('Firebase Admin SDK Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear env variables that could affect config
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  });

  it('should initialize admin app correctly when env vars are mocked', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      projectId: 'test-project',
      privateKey: '---PRIVATE-KEY---',
      clientEmail: 'test@test.com',
    });

    const { adminApp, adminAuth, adminDb } = await import('../adminApp');

    expect(adminApp).toBeDefined();
    expect(adminAuth).toBeDefined();
    expect(adminDb).toBeDefined();
  });
});
