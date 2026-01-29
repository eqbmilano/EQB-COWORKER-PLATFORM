-- Aggiorna la password dell'admin user con il hash corretto
UPDATE "User" 
SET "password" = '$2b$10$nU3uLAyuEcMaW061Q1ipd.cQZmjMncEwCsF3E362WY3qQkfYHp76S'
WHERE "email" = 'admin@eqb.it';

-- Verifica che l'update sia riuscito
SELECT "email", "password" FROM "User" WHERE "email" = 'admin@eqb.it';
