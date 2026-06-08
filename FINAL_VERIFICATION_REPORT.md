# Rapport de vérification finale du schéma grades

## Schéma officiel

La table `grades` utilise uniquement :

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

## Flux applicatif attendu

### Lecture

Les notes sont chargées depuis `grades` avec un filtre `user_id`.

### Écriture

Les notes sont enregistrées avec :

- `user_id`
- `student_id`
- `subject`
- `grade`

### Suppression

Les notes sont supprimées avec :

- `user_id`
- `student_id`
- `subject`

### Conflit d'upsert

```txt
user_id,student_id,subject
```

## Conclusion

Le code et les scripts doivent rester cohérents avec ce modèle unique.
