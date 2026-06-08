# Audit critique du schéma grades

## Schéma officiel

La table `grades` doit rester alignée sur les colonnes suivantes :

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

## Règles d'accès aux notes

- Lire les notes par `user_id`.
- Écrire les notes avec `user_id`, `student_id`, `subject`, `grade`.
- Mettre à jour les notes avec la contrainte unique `user_id, student_id, subject`.
- Supprimer les notes avec `user_id`, `student_id`, `subject`.

## Conclusion

Le modèle grades est unique. Toute nouvelle logique doit respecter strictement ce schéma.
