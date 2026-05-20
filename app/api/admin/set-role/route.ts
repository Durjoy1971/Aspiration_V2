import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Lazy load Firebase Admin to avoid initialization issues
    let adminAuth, adminDb;
    try {
      const adminModule = await import('../../../lib/firebase/adminApp');
      adminAuth = adminModule.adminAuth;
      adminDb = adminModule.adminDb;
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin:', initError);
      return NextResponse.json({ error: 'Firebase Admin initialization failed. Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' }, { status: 500 });
    }

    // Get request body
    const body = await request.json();
    const { targetUserId, newRole } = body;

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'Missing targetUserId or newRole' }, { status: 400 });
    }

    // Validate role
    if (!['learner', 'admin', 'superAdmin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the session token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const decodedToken = await adminAuth.verifyIdToken(token);
    const requesterId = decodedToken.uid;

    // Get requester's role from Firestore
    const requesterDoc = await adminDb.collection('users').doc(requesterId).get();
    if (!requesterDoc.exists) {
      return NextResponse.json({ error: 'Requester not found' }, { status: 404 });
    }

    const requesterData = requesterDoc.data();
    const requesterRole = requesterData?.role;

    // Only superAdmin can change roles
    if (requesterRole !== 'superAdmin') {
      console.warn(`User ${requesterId} with role ${requesterRole} attempted to change role of ${targetUserId} to ${newRole}`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update the target user's role in Firestore
    await adminDb.collection('users').doc(targetUserId).update({
      role: newRole,
      updatedAt: new Date().toISOString(),
    });

    // Log the action for audit trail
    console.log(`Role change: User ${requesterId} (${requesterRole}) changed role of ${targetUserId} to ${newRole}`);

    return NextResponse.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Failed to update user role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
