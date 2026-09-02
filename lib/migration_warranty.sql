-- Adiciona a coluna de garantia na tabela de registros
alter table service_records
  add column if not exists warranty_until date;
