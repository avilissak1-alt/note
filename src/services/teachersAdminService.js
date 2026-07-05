import { supabase } from '../lib/supabase';

export const teachersAdminService = {
  async listTeachers(schoolId) {
    let query = supabase
      .from('teachers')
      .select('id, school_id, user_id, name, subject, email, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async invoke(action, payload = {}) {
    const { data, error } = await supabase.functions.invoke('manage-teachers', {
      body: { action, ...payload }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async createTeacher(payload) {
    return this.invoke('create', payload);
  },

  async updateSubject(payload) {
    return this.invoke('updateSubject', payload);
  },

  async disableTeacher(payload) {
    return this.invoke('disable', payload);
  },

  async resetPassword(payload) {
    return this.invoke('resetPassword', payload);
  }
};
