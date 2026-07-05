import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Configuration Supabase Edge Function incomplète.');
    }

    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('Session absente.');
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Session invalide.');
    }

    const body = await req.json();
    const { action, schoolId } = body;

    const { data: directorProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !directorProfile || directorProfile.role !== 'director') {
      throw new Error('Action réservée aux directeurs.');
    }

    if (!schoolId || schoolId !== directorProfile.school_id) {
      throw new Error('École non autorisée.');
    }

    if (action === 'create') {
      const firstName = String(body.firstName || '').trim();
      const lastName = String(body.lastName || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const subject = String(body.subject || '').trim();
      const temporaryPassword = String(body.temporaryPassword || '');
      const fullName = `${firstName} ${lastName}`.trim();

      if (!firstName || !lastName || !email || !subject || !temporaryPassword) {
        throw new Error('Tous les champs professeur sont requis.');
      }

      const { data: existingSubject } = await adminClient
        .from('teachers')
        .select('id')
        .eq('school_id', schoolId)
        .eq('subject', subject)
        .maybeSingle();

      if (existingSubject) {
        throw new Error('Cette matière est déjà attribuée à un professeur.');
      }

      const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: 'teacher' }
      });

      if (createUserError || !createdUser?.user) {
        throw createUserError || new Error('Compte professeur non créé.');
      }

      const teacherUserId = createdUser.user.id;

      const { error: profileInsertError } = await adminClient
        .from('profiles')
        .insert({ id: teacherUserId, school_id: schoolId, role: 'teacher', full_name: fullName, email });

      if (profileInsertError) {
        await adminClient.auth.admin.deleteUser(teacherUserId);
        throw profileInsertError;
      }

      const { data: teacher, error: teacherInsertError } = await adminClient
        .from('teachers')
        .insert({ school_id: schoolId, user_id: teacherUserId, name: fullName, subject, email, created_by: userData.user.id })
        .select('id, school_id, user_id, name, subject, email, created_at, updated_at')
        .single();

      if (teacherInsertError) {
        await adminClient.from('profiles').delete().eq('id', teacherUserId);
        await adminClient.auth.admin.deleteUser(teacherUserId);
        throw teacherInsertError;
      }

      return json({ teacher }, 200);
    }

    if (action === 'updateSubject') {
      const teacherId = String(body.teacherId || '');
      const subject = String(body.subject || '').trim();

      if (!teacherId || !subject) {
        throw new Error('Professeur et matière requis.');
      }

      const { data: existingSubject } = await adminClient
        .from('teachers')
        .select('id')
        .eq('school_id', schoolId)
        .eq('subject', subject)
        .neq('id', teacherId)
        .maybeSingle();

      if (existingSubject) {
        throw new Error('Cette matière est déjà attribuée à un professeur.');
      }

      const { data: teacher, error: updateError } = await adminClient
        .from('teachers')
        .update({ subject })
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .select('id, school_id, user_id, name, subject, email, created_at, updated_at')
        .single();

      if (updateError) throw updateError;
      return json({ teacher }, 200);
    }

    if (action === 'disable') {
      const teacherId = String(body.teacherId || '');
      const { data: teacher, error: teacherError } = await adminClient
        .from('teachers')
        .select('id, user_id')
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      if (teacherError || !teacher) {
        throw new Error('Professeur introuvable.');
      }

      if (teacher.user_id) {
        const { error: disableError } = await adminClient.auth.admin.updateUserById(teacher.user_id, { ban_duration: '876000h' });
        if (disableError) throw disableError;
      }

      return json({ disabled: true }, 200);
    }

    if (action === 'resetPassword') {
      const teacherId = String(body.teacherId || '');
      const temporaryPassword = String(body.temporaryPassword || '');

      if (!temporaryPassword) {
        throw new Error('Nouveau mot de passe requis.');
      }

      const { data: teacher, error: teacherError } = await adminClient
        .from('teachers')
        .select('id, user_id')
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      if (teacherError || !teacher?.user_id) {
        throw new Error('Compte professeur introuvable.');
      }

      const { error: resetError } = await adminClient.auth.admin.updateUserById(teacher.user_id, { password: temporaryPassword });
      if (resetError) throw resetError;

      return json({ reset: true }, 200);
    }

    throw new Error('Action inconnue.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.';
    return json({ error: message }, 400);
  }
});

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
