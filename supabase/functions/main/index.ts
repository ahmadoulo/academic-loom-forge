// Main router for Edge Functions in self-hosted environment
// This file routes requests to the appropriate function based on URL path

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Import all function handlers
import { handler as authenticateUser } from '../authenticate-user/index.ts';
import { handler as validateSession } from '../validate-session/index.ts';
import { handler as createUserAccount } from '../create-user-account/index.ts';
import { handler as resetUserPassword } from '../reset-user-password/index.ts';
import { handler as changePassword } from '../change-password/index.ts';
import { handler as setupPassword } from '../setup-password/index.ts';
import { handler as setUserPassword } from '../set-user-password/index.ts';
import { handler as setStudentPassword } from '../set-student-password/index.ts';
import { handler as requestPasswordReset } from '../request-password-reset/index.ts';
import { handler as sendNotification } from '../send-notification/index.ts';
import { handler as sendAbsenceNotification } from '../send-absence-notification/index.ts';
import { handler as autoSendAbsenceNotifications } from '../auto-send-absence-notifications/index.ts';
import { handler as autoTransitionSemesters } from '../auto-transition-semesters/index.ts';
import { handler as sendTeacherInvitation } from '../send-teacher-invitation/index.ts';
import { handler as sendStudentInvitation } from '../send-student-invitation/index.ts';
import { handler as verifyTeacherAccount } from '../verify-teacher-account/index.ts';
import { handler as verifyStudentAccount } from '../verify-student-account/index.ts';
import { handler as getUserPermissions } from '../get-user-permissions/index.ts';
import { handler as listAppUsers } from '../list-app-users/index.ts';

const handlers: Record<string, (req: Request) => Promise<Response>> = {
  'authenticate-user': authenticateUser,
  'validate-session': validateSession,
  'create-user-account': createUserAccount,
  'reset-user-password': resetUserPassword,
  'change-password': changePassword,
  'setup-password': setupPassword,
  'set-user-password': setUserPassword,
  'set-student-password': setStudentPassword,
  'request-password-reset': requestPasswordReset,
  'send-notification': sendNotification,
  'send-absence-notification': sendAbsenceNotification,
  'auto-send-absence-notifications': autoSendAbsenceNotifications,
  'auto-transition-semesters': autoTransitionSemesters,
  'send-teacher-invitation': sendTeacherInvitation,
  'send-student-invitation': sendStudentInvitation,
  'verify-teacher-account': verifyTeacherAccount,
  'verify-student-account': verifyStudentAccount,
  'get-user-permissions': getUserPermissions,
  'list-app-users': listAppUsers,
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Get function name from path (e.g., /functions/v1/authenticate-user -> authenticate-user)
    // Or direct path like /authenticate-user
    let functionName = pathParts[pathParts.length - 1];
    
    // Handle /functions/v1/{function-name} pattern
    if (pathParts.includes('functions') && pathParts.includes('v1')) {
      const v1Index = pathParts.indexOf('v1');
      if (v1Index < pathParts.length - 1) {
        functionName = pathParts[v1Index + 1];
      }
    }

    console.log(`[Main Router] Request for function: ${functionName}, path: ${url.pathname}`);

    const handler = handlers[functionName];
    
    if (!handler) {
      console.error(`[Main Router] Function not found: ${functionName}`);
      return new Response(
        JSON.stringify({ 
          error: 'Function not found', 
          functionName,
          availableFunctions: Object.keys(handlers)
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return await handler(req);
  } catch (error) {
    console.error('[Main Router] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
