$(document).ready(function() {
    // Defina o locale do moment.js para português do Brasil
    moment.locale('pt-BR');

    // define intervalos entre datas
    $('#dateRange').daterangepicker({
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        maxDate: moment(), // Impede seleção de datas futuras
        locale: {
            format: 'DD/MM/YYYY' // Define o formato de data
        },
      ranges: {
         'Hoje': [moment(), moment()],
         'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
         'Últimos 7 Dias': [moment().subtract(6, 'days'), moment()],
         'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
         'Este Mês': [moment().startOf('month'), moment().endOf('month')],
         'Último Mês': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
         'Este Ano': [moment().startOf('year'), moment().endOf('year')],
         'Todo o Período': [moment().subtract(5, 'year'), moment()]
      }
    }, function(start, end) {
        // Formatar as datas no campo de entrada
        $('#dateRange').val(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
        updateDashboard(start, end);
    });

    // Inicia os graficos
    const scoreDistributionCtx = document.getElementById('scoreDistribution').getContext('2d');
    const scoreDistributionChart = new Chart(scoreDistributionCtx, {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [{
          label: 'Numero de respostas',
          data: Array(11).fill(0), // Inicializa com zero
          backgroundColor: [
            '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000',
            '#ff0000', '#ffd700', '#ffd700', '#008000', '#008000'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
            legend: {
                display: false // Remove a legenda
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0, // Você pode ajustar o mínimo se necessário
                max: 3, // Inicialmente 3, será atualizado depois
                ticks: {
                    precision: 0,
                    padding: 10 // Adiciona espaço entre as barras e os rótulos do eixo y
                }
            }
        }
    }
});

const scoreEvolutionCtx = document.getElementById('scoreEvolution').getContext('2d');
const scoreEvolutionChart = new Chart(scoreEvolutionCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Média de Notas',
            data: [],
            borderColor: '#007bff',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 10
            }
        }
    }
});
    //calcula a taxa de nps score
    function calculateNPSScore(data) {
        const totalResponses = data.length;
        let detractors = 0, promoters = 0;

        data.forEach(response => {
            if (response.rating >= 0 && response.rating <= 6) {
                detractors++;
            } else if (response.rating >= 9 && response.rating <= 10) {
                promoters++;
            }
        });

        const npsScore = totalResponses > 0 ? ((promoters - detractors) / totalResponses * 100).toFixed(2) : 0;
        return npsScore;
    }

    //atualiza posição do ponteiro
    function updateNPSGauge(npsScore) {
        const npsPointer = document.getElementById('npsPointer');
        const npsScoreText = document.getElementById('npsScoreText');

        npsScoreText.textContent = npsScore;

        const angle = (npsScore + 100) * (180 / 200); // Mapeia de -100 a 100 para 0 a 180
        npsPointer.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }

    // Função para calcular a quantidade e a porcentagem de detratores, neutros e promotores
    function calculateNPSPercentages(data) {
    const totalResponses = data.length;
    let detractors = 0, passives = 0, promoters = 0;

    // Calcula detratores, neutros (passivos) e promotores com base nas notas
    data.forEach(response => {
        if (response.rating >= 0 && response.rating <= 6) {
            detractors++;
        } else if (response.rating >= 7 && response.rating <= 8) {
            passives++;
        } else if (response.rating >= 9 && response.rating <= 10) {
            promoters++;
        }
    });

    // Calcula as porcentagens
    const detractorsPercentage = totalResponses > 0 ? ((detractors / totalResponses) * 100).toFixed(2) : '0.00';
    const passivesPercentage = totalResponses > 0 ? ((passives / totalResponses) * 100).toFixed(2) : '0.00';
    const promotersPercentage = totalResponses > 0 ? ((promoters / totalResponses) * 100).toFixed(2) : '0.00';

    // Atualiza o HTML com os números e as porcentagens
    $('#detractorsNumber').text(detractors);
    $('#detractorsPercentage').text(`(${detractorsPercentage}%)`);
    $('#passivesNumber').text(passives);
    $('#passivesPercentage').text(`(${passivesPercentage}%)`);
    $('#promotersNumber').text(promoters);
    $('#promotersPercentage').text(`(${promotersPercentage}%)`);
}

   // Função para calcular a média diária
   function calculateDailyAverages(data) {
    const averagesByDay = {};
    
    // Agrupa os dados por dia e calcula a média diária
    data.forEach(response => {
        const day = moment(response.created_at).format('DD/MM/YYYY');
        if (!averagesByDay[day]) {
            averagesByDay[day] = { totalScore: 0, count: 0 };
        }
        averagesByDay[day].totalScore += response.rating;
        averagesByDay[day].count++;
    });

    const labels = [];
    const averages = [];

    // Calcula a média para cada dia
    Object.keys(averagesByDay).forEach(day => {
        labels.push(day);
        const { totalScore, count } = averagesByDay[day];
        averages.push((totalScore / count).toFixed(2)); // Média diária
    });

    return { labels, averages };
}

// Função para buscar dados do período anterior até o final do período selecionado
function updateDashboard(start, end) {
    const today = moment(); 
    const finalEndDate = end;

    let previousStart = start; // Ajuste o início do período
    
    // Ajuste para garantir que, se o período for "Ontem", não pegue o dia anterior
    if (start.isSame(moment().subtract(1, 'days'), 'day')) {
        previousStart = start; // Usar apenas o dia selecionado
    } else if (start.isSame(today, 'day')) {
        previousStart = start; // Usar o próprio dia selecionado sem incluir o anterior
    } else {
        previousStart = start; // Período anterior se não for o dia atual
    }

    $.ajax({
        url: 'http://localhost:3000/dashboard-v2',
        method: 'GET',
        data: {
            start_date: previousStart.format('YYYY-MM-DD'), // Período anterior
            end_date: finalEndDate.format('YYYY-MM-DD') // Até o final do período selecionado
        },
        success: function(data) {
            if (!data || data.length === 0) {
                // Alerta caso não tenha dados cadastrados
                alert('Nenhum dado disponível para o período selecionado.');

                // zera as porcentagens de detratores, neutros e promotores
                $('#detractorsPercentage').text('0.00%');
                $('#passivesPercentage').text('0.00%');
                $('#promotersPercentage').text('0.00%');
                $('#detractorsNumber').text('0');
                $('#passivesNumber').text('0');
                $('#promotersNumber').text('0');

                // Reseta o NPS Score e esconde o ponteiro
                $('#npsScoreText').text('0');
                $('#npsPointer').hide();
                
                // Sem dados no período selecionado
                $('#totalResponses').text('0');
                $('#averageScore').text('0.00');
                scoreDistributionChart.data.datasets[0].data = Array(11).fill(0); // Zera distribuição
                scoreDistributionChart.options.scales.y.max = 3; // Reseta o máximo
                scoreDistributionChart.update();
                scoreEvolutionChart.data.labels = []; // Limpa rótulos
                scoreEvolutionChart.data.datasets[0].data = []; // Limpa dados
                scoreEvolutionChart.update();
                $('#customerFeedback').empty().append(`
                    <div class="list-group-item">
                        <p class="text-center">Nenhum dado para o período selecionado.</p>
                    </div>
                `);
            } else {
                // Atualize as métricas com os dados do período selecionado
                $('#totalResponses').text(data.length);

                //mostra o ponteiro
                $('#npsPointer').show();
                
                // Calcula a média das notas
                const totalScore = data.reduce((acc, response) => acc + response.rating, 0);
                const averageScore = (data.length > 0) ? (totalScore / data.length).toFixed(2) : '0.00';
                $('#averageScore').text(averageScore);

                // Atualiza a distribuição das notas
                const scoreCounts = new Array(11).fill(0);
                data.forEach(response => {
                    scoreCounts[response.rating]++;
                });
                scoreDistributionChart.data.datasets[0].data = scoreCounts;

                // Calcule o valor máximo das barras e ajuste o topo
                const maxCount = Math.max(...scoreCounts);
                scoreDistributionChart.options.scales.y.max = maxCount + 3; // Adiciona um espaço no topo

                scoreDistributionChart.update();

                const npsScore = calculateNPSScore(data); ///
                updateNPSGauge(npsScore); ///

                // Adiciona feedbacks dos clientes (apenas os últimos 5)
                $('#customerFeedback').empty();
                const latestFeedbacks = data.slice(-5); // Obtém os últimos 5 comentários
                latestFeedbacks.forEach(response => {
                    $('#customerFeedback').append(`
                        <div class="list-group-item">
                            <h6 class="mb-1">${response.name} <small class="text-muted">${response.phone}</small></h6>
                            <p class="mb-1">Nota: ${response.rating} - "${response.feedback || ''}"</p>
                        </div>
                    `);
                });

                // Calcula médias diárias
                const { labels, averages } = calculateDailyAverages(data);
                scoreEvolutionChart.data.labels = labels;
                scoreEvolutionChart.data.datasets[0].data = averages;
                scoreEvolutionChart.update();

                // Chama a função para calcular as porcentagens de detratores, neutros e promotores
                calculateNPSPercentages(data);
            }
        },

        error: function(err) {
            console.error('Erro ao buscar dados:', err);
            $('#customerFeedback').empty().append(`
                <div class="list-group-item">
                    <p class="text-center">Erro ao buscar dados. Tente novamente mais tarde.</p>
                </div>
            `);
        }
    });
}

// Atualização inicial
updateDashboard($('#dateRange').data('daterangepicker').startDate, $('#dateRange').data('daterangepicker').endDate);
});
