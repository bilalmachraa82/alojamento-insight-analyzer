-- PASSO 2.1: Adicionar coluna user_id à tabela diagnostic_submissions
ALTER TABLE diagnostic_submissions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_user_id 
ON diagnostic_submissions(user_id);

-- PASSO 2.2: Remover políticas públicas inseguras e criar políticas com autenticação

-- Proteger diagnostic_submissions
DROP POLICY IF EXISTS "Users can view own submissions by email" ON diagnostic_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON diagnostic_submissions;
DROP POLICY IF EXISTS "Anyone can update submissions" ON diagnostic_submissions;

CREATE POLICY "Authenticated users can view own submissions"
ON diagnostic_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own submissions"
ON diagnostic_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own submissions"
ON diagnostic_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- PASSO 2.3: Proteger dim_competitor
DROP POLICY IF EXISTS "Anyone can view competitors" ON dim_competitor;

CREATE POLICY "Authenticated users can view competitors"
ON dim_competitor FOR SELECT
TO authenticated
USING (true);

-- PASSO 2.4: Proteger dim_channel
DROP POLICY IF EXISTS "Anyone can view channels" ON dim_channel;

CREATE POLICY "Authenticated users can view channels"
ON dim_channel FOR SELECT
TO authenticated
USING (true);

-- PASSO 2.5: Proteger outras tabelas sensíveis
DROP POLICY IF EXISTS "Anyone can view properties" ON dim_property;

CREATE POLICY "Authenticated users can view own properties"
ON dim_property FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_system = true);

CREATE POLICY "Authenticated users can insert own properties"
ON dim_property FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own properties"
ON dim_property FOR UPDATE
TO authenticated
USING (user_id = auth.uid());