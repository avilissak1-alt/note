# Rapport d'analyse du schéma grades

Le modèle `grades` officiel est unique et définitif.

## Colonnes officielles

- `id`
- `user_id`
- `student_id`
- `subject`
- `grade`
- `created_at`
- `updated_at`

## Contrainte unique

```txt
user_id, student_id, subject
```

## État attendu du code

- Les écritures Supabase envoient `user_id`, `student_id`, `subject`, `grade`.
- Les suppressions filtrent par `user_id`, `student_id`, `subject`.
- Les lectures filtrent au minimum par `user_id`.
- Les upserts utilisent `onConflict: 'user_id,student_id,subject'`.

## Conclusion

Les anciennes variantes du modèle `grades` sont abandonnées. Le projet doit rester aligné sur ce schéma unique.
