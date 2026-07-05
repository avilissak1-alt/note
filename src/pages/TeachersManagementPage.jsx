import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button.jsx';
import { teachersAdminService } from '../services/teachersAdminService.js';

function TeachersManagementPage({ onBack, sessionContext, colonnesBoker, colonnesFormation }) {
  const allSubjects = useMemo(() => [...(colonnesBoker || []), ...(colonnesFormation || [])], [colonnesBoker, colonnesFormation]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: allSubjects[0]?.id || '', temporaryPassword: '' });
  const createFormRef = useRef(null);

  const subjectNames = useMemo(() => {
    return allSubjects.reduce((acc, subject) => {
      acc[subject.id] = subject.nom;
      return acc;
    }, {});
  }, [allSubjects]);

  const usedSubjects = useMemo(() => new Set(teachers.map((teacher) => teacher.subject).filter(Boolean)), [teachers]);

  const focusCreateForm = useCallback(() => {
    createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    createFormRef.current?.querySelector('input')?.focus();
  }, []);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let nextPassword = '';
    for (let index = 0; index < 14; index += 1) {
      nextPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((current) => ({ ...current, temporaryPassword: nextPassword }));
  }, []);

  const loadTeachers = useCallback(async () => {
    if (!sessionContext?.schoolId) return;
    setLoading(true);
    setError('');
    try {
      const data = await teachersAdminService.listTeachers(sessionContext.schoolId);
      setTeachers(data);
    } catch (loadError) {
      setError(loadError.message || 'Erreur lors du chargement des professeurs');
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.schoolId]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    if (!form.subject && allSubjects[0]?.id) {
      setForm((current) => ({ ...current, subject: allSubjects[0].id }));
    }
  }, [allSubjects, form.subject]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.subject || !form.temporaryPassword) {
      setError('Tous les champs sont requis.');
      return;
    }

    if (usedSubjects.has(form.subject)) {
      setError('Cette matière est déjà attribuée à un professeur.');
      return;
    }

    setSaving(true);
    try {
      await teachersAdminService.createTeacher({
        schoolId: sessionContext.schoolId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        subject: form.subject,
        temporaryPassword: form.temporaryPassword
      });
      setMessage('Professeur créé avec succès. Communiquez le mot de passe temporaire au professeur.');
      setForm({ firstName: '', lastName: '', email: '', subject: allSubjects[0]?.id || '', temporaryPassword: '' });
      await loadTeachers();
    } catch (createError) {
      setError(createError.message || 'Erreur lors de la création du professeur');
    } finally {
      setSaving(false);
    }
  };

  const handleSubjectChange = async (teacher, nextSubject) => {
    setMessage('');
    setError('');

    if (nextSubject !== teacher.subject && usedSubjects.has(nextSubject)) {
      setError('Cette matière est déjà attribuée à un professeur.');
      return;
    }

    setSaving(true);
    try {
      await teachersAdminService.updateSubject({ teacherId: teacher.id, schoolId: sessionContext.schoolId, subject: nextSubject });
      setMessage('Matière mise à jour.');
      await loadTeachers();
    } catch (updateError) {
      setError(updateError.message || 'Erreur lors de la mise à jour de la matière');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (teacher) => {
    if (!window.confirm(`Désactiver le professeur ${teacher.name} ?`)) return;
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await teachersAdminService.disableTeacher({ teacherId: teacher.id, schoolId: sessionContext.schoolId });
      setMessage('Professeur désactivé.');
      await loadTeachers();
    } catch (disableError) {
      setError(disableError.message || 'Erreur lors de la désactivation');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (teacher) => {
    const temporaryPassword = window.prompt(`Nouveau mot de passe temporaire pour ${teacher.name}`);
    if (!temporaryPassword) return;
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await teachersAdminService.resetPassword({ teacherId: teacher.id, schoolId: sessionContext.schoolId, temporaryPassword });
      setMessage('Mot de passe réinitialisé. Communiquez le nouveau mot de passe au professeur.');
    } catch (resetError) {
      setError(resetError.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px', fontFamily: 'Palatino, Palatino Linotype, serif' }}>
      <main style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
        <section style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Gestion des professeurs</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>Créer, modifier, désactiver et réinitialiser les accès professeurs.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={focusCreateForm} variant="premium" size="medium">+ Créer un professeur</Button>
            <Button onClick={onBack} variant="secondary" size="medium">← Retour</Button>
          </div>
        </section>

        {(message || error) && (
          <section style={{ padding: '1rem', borderRadius: '10px', border: `1px solid ${error ? 'rgba(239,68,68,.35)' : 'rgba(34,197,94,.35)'}`, backgroundColor: error ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)', color: error ? '#ef4444' : '#16a34a' }}>
            {error || message}
          </section>
        )}

        <section ref={createFormRef} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Créer un professeur</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} placeholder="Prénom" style={inputStyle} />
            <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} placeholder="Nom" style={inputStyle} />
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" style={inputStyle} />
            <select value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} style={inputStyle}>
              {allSubjects.map((subject) => <option key={subject.id} value={subject.id} disabled={usedSubjects.has(subject.id)}>{subject.nom}{usedSubjects.has(subject.id) ? ' — déjà attribuée' : ''}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={form.temporaryPassword} onChange={(event) => setForm({ ...form, temporaryPassword: event.target.value })} placeholder="Mot de passe temporaire" style={{ ...inputStyle, flex: 1 }} />
              <Button type="button" onClick={generatePassword} variant="secondary" size="small">Générer</Button>
            </div>
            <Button type="submit" disabled={saving} variant="premium" size="medium">Créer le professeur</Button>
          </form>
        </section>

        <section style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Professeurs de l’école</h2>
            <Button onClick={loadTeachers} disabled={loading} variant="secondary" size="small">Rafraîchir</Button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Chargement...</div>
          ) : teachers.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Aucun professeur configuré.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', color: '#2f2f2f', borderRadius: '10px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f4e4c1' }}>
                    <th style={thStyle}>Nom</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Matière</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td style={tdStyle}>{teacher.name}</td>
                      <td style={tdStyle}>{teacher.email}</td>
                      <td style={tdStyle}>
                        <select value={teacher.subject || ''} onChange={(event) => handleSubjectChange(teacher, event.target.value)} disabled={saving} style={{ ...inputStyle, color: '#2f2f2f', backgroundColor: '#fff' }}>
                          {allSubjects.map((subject) => <option key={subject.id} value={subject.id} disabled={subject.id !== teacher.subject && usedSubjects.has(subject.id)}>{subjectNames[subject.id] || subject.id}</option>)}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Button onClick={() => handleResetPassword(teacher)} disabled={saving} variant="secondary" size="small">Reset MDP</Button>
                          <Button onClick={() => handleDisable(teacher)} disabled={saving} variant="secondary" size="small">Désactiver</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--input-bg)',
  color: 'var(--input-text)',
  fontWeight: 'bold',
  boxSizing: 'border-box'
};

const thStyle = {
  padding: '12px',
  border: '1px solid #d4af37',
  textAlign: 'left'
};

const tdStyle = {
  padding: '12px',
  border: '1px solid #e8dcc0'
};

export default TeachersManagementPage;
