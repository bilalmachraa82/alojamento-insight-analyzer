-- Ajustar políticas RLS para permitir submissões de guests e utilizadores autenticados

-- 1. Remover política de INSERT restritiva
DROP POLICY IF EXISTS "Authenticated users can insert own submissions" ON diagnostic_submissions;

-- 2. Criar política de INSERT que permite tanto guests como utilizadores autenticados
CREATE POLICY "Allow guest and authenticated submissions"
ON diagnostic_submissions FOR INSERT
WITH CHECK (
  -- Permitir se user_id é NULL (guest) OU se user_id corresponde ao auth.uid() (autenticado)
  user_id IS NULL OR auth.uid() = user_id
);

-- 3. Atualizar política de SELECT para permitir visualização por user_id
DROP POLICY IF EXISTS "Authenticated users can view own submissions" ON diagnostic_submissions;

CREATE POLICY "Authenticated users can view own submissions"
ON diagnostic_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Atualizar política de UPDATE para permitir apenas utilizadores autenticados nas suas próprias submissões
DROP POLICY IF EXISTS "Authenticated users can update own submissions" ON diagnostic_submissions;

CREATE POLICY "Authenticated users can update own submissions"
ON diagnostic_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- NOTA: Esta migration permite:
-- - Qualquer pessoa pode criar uma submissão (guest ou autenticado)
-- - Apenas utilizadores autenticados podem ver as suas próprias submissões
-- - Apenas utilizadores autenticados podem atualizar as suas próprias submissões
-- - Submissões de guests (user_id = NULL) não podem ser vistas por ninguém na interface
--   mas ficam na BD para processamento pelo sistema