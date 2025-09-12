@echo off
REM Script de restore para voltar ao estado pre-expansao
REM Execute este script se precisar fazer rollback

echo Restaurando MySQL...
C:\xampp\mysql\bin\mysql.exe -u root -e "DROP DATABASE IF EXISTS cplp_raras;"
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
C:\xampp\mysql\bin\mysql.exe -u root cplp_raras < mysql-cplp-raras-pre-expansao.sql

echo Restaurando SQLite...
copy sqlite-cplp-raras-pre-expansao.db ..\..\prisma\database\cplp_raras_real.db

echo Restaurando Schema Prisma...
copy prisma-schema-v1-pre-expansao.prisma ..\..\prisma\schema.prisma

echo Executando Prisma...
cd ..\..
npx prisma db push

echo Restore concluido!
pause
