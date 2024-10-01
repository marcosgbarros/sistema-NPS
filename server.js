const express = require('express');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const moment = require('moment-timezone');

// Configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL ou SUPABASE_KEY não estão definidos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// Servir o arquivo HTML (survey.html)
app.use(express.static(path.join(__dirname))); // Serve arquivos estáticos da pasta atual

// Endpoint para salvar os dados da pesquisa
app.post('/submit-survey', async (req, res) => {
  const { name, email, phone, rating, feedback } = req.body;

  // Obter a data e hora atuais em São Paulo
  const createdAt = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

  try {
    const { data, error } = await supabase
      .from('satisfaction_survey')
      .insert([{ created_at: createdAt, name, email, phone, rating, feedback }]);

    if (error) {
      console.error('Erro ao salvar dados:', error);
      return res.status(400).json({ error: 'Erro ao salvar dados' });
    }

    res.status(200).json({ message: 'Resposta salva com sucesso' });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ error: 'Erro inesperado ao salvar os dados' });
  }
});

app.get('/dashboard-v2', async (req, res) => {
    const { start_date, end_date } = req.query;

    // Ajusta a data final para incluir o último segundo do dia (para garantir que registros no fim do dia sejam incluídos)
    const adjustedEndDate = moment(end_date).endOf('day').format('YYYY-MM-DD HH:mm:ss');

    try {
        // Busca os dados no intervalo de datas no banco de dados Supabase
        const { data: rows, error } = await supabase
            .from('satisfaction_survey')
            .select('*')
            .gte('created_at', start_date) // Greater than or equal to the start date
            .lte('created_at', adjustedEndDate); // Less than or equal to the end date

        if (error) {
            console.error('Erro ao buscar dados:', error);
            return res.status(500).send('Erro ao buscar dados');
        }

        console.log('Dados retornados:', rows);

        // Retorna os dados diretamente para o frontend processar
        res.json(rows);
    } catch (err) {
        console.error('Erro inesperado:', err);
        res.status(500).send('Erro inesperado ao buscar dados');
    }
});

// Endpoint para buscar dados da pesquisa
app.get('/feedback', async (req, res) => {
  try {
    // Busca todos os dados na tabela satisfaction_survey
    const { data: rows, error } = await supabase
      .from('satisfaction_survey')
      .select('*');

    if (error) {
      console.error('Erro ao buscar dados:', error);
      return res.status(500).send('Erro ao buscar dados');
    }

    // Retorna os dados diretamente para o frontend processar
    res.json(rows);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).send('Erro inesperado ao buscar dados');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
