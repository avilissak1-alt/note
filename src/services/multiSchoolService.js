import { supabase } from '../lib/supabase';

export const multiSchoolService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, school_id, role, full_name, email, schools(id, name, logo_url)')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getTeacher(userId) {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, school_id, user_id, name, subject, email')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async buildSessionContext(userId, expectedRole) {
    const profile = await this.getProfile(userId);

    if (!profile || profile.role !== expectedRole) {
      throw new Error(expectedRole === 'director' ? 'Ce compte n’est pas un compte directeur.' : 'Ce compte n’est pas un compte professeur.');
    }

    if (expectedRole === 'teacher') {
      const teacher = await this.getTeacher(userId);

      if (!teacher || teacher.school_id !== profile.school_id) {
        throw new Error('Profil professeur incomplet ou rattaché à une autre école.');
      }

      return {
        userId,
        role: profile.role,
        schoolId: profile.school_id,
        school: profile.schools || null,
        profile,
        teacher,
        teacherId: teacher.id,
        teacherSubject: teacher.subject
      };
    }

    return {
      userId,
      role: profile.role,
      schoolId: profile.school_id,
      school: profile.schools || null,
      profile,
      teacher: null,
      teacherId: null,
      teacherSubject: null
    };
  }
};
