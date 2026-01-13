export async function GET() {
  return Response.json({
    hasFirebaseAdminJson: !!process.env.FIREBASE_ADMIN_JSON,
    length: process.env.FIREBASE_ADMIN_JSON ? process.env.FIREBASE_ADMIN_JSON.length : 0,
  });
}
