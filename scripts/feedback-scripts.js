$(document).ready(function() {
    const itemsPerPage = 30;
    let currentPage = 1;
    let feedbackData = []; // Inicializando o array para armazenar os dados do feedback

    function getScoreColor(score) {
        if (score >= 0 && score <= 6) {
            return 'hsl(0, 100%, 40%)'; // Vermelho
        } else if (score >= 7 && score <= 8) {
            return 'hsl(60, 100%, 40%)'; // Amarelo
        } else if (score >= 9 && score <= 10) {
            return 'hsl(120, 100%, 40%)'; // Verde
        }
    }

    //retorna resultado dos feedbacks
    function renderFeedbackList(data) {
        $('#feedbackList').empty();
        data.forEach(item => {
            const scoreColor = getScoreColor(item.rating); // Use o rating para a cor
            const formattedDate = new Date(item.created_at).toLocaleDateString('pt-BR'); // Formatar a data
            
            // Determinar o tipo de cliente com base na nota
            let customerType;
            if (item.rating >= 0 && item.rating <= 6) {
                customerType = 'Detrator';
            } else if (item.rating >= 7 && item.rating <= 8) {
                customerType = 'Neutro';
            } else if (item.rating >= 9 && item.rating <= 10) {
                customerType = 'Promotor';
            } else {
            }
    
            $('#feedbackList').append(`
                <div class="feedback-item" style="border-left-color: ${scoreColor};">
                    <h5>${item.name} <small class="text-muted">(Nota: ${item.rating} - ${customerType})</small></h5>
                    <p><strong>Telefone:</strong> ${item.phone}</p>
                    <p><strong>Email:</strong> ${item.email}</p>
                    <p><strong>Feedback:</strong> ${item.feedback}</p>
                    <p><strong>Data:</strong> ${formattedDate}</p> <!-- Usar a data formatada -->
                </div>
            `);
        });
    }  

    //filtra os resultados
    function filterAndSortData() {
        let filteredData = [...feedbackData];

        // filtra por nota
        const selectedScore = $('#scoreFilter').val();
        if (selectedScore !== 'all') {
            filteredData = filteredData.filter(item => item.rating === parseInt(selectedScore));
        }

        // filtra por telefone
        const phoneSearch = $('#phoneSearch').val().replace(/\D/g, '');
        if (phoneSearch) {
            filteredData = filteredData.filter(item => item.phone.replace(/\D/g, '').includes(phoneSearch));
        }

        // filtro pelo mais recente ou mais antigo
        const sortOrder = $('#sortOrder').val();
        filteredData.sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
            } else {
                return new Date(a.created_at) - new Date(b.created_at);
            }
        });

        return filteredData;
    }

    //função que cria paginação
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        $('#pagination').empty();

        if (totalPages > 1) {
            $('#pagination').append(`
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
                </li>
            `);

            for (let i = 1; i <= totalPages; i++) {
                $('#pagination').append(`
                    <li class="page-item ${currentPage === i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `);
            }

            $('#pagination').append(`
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Próxima</a>
                </li>
            `);
        }
    }

    //atualiza os resultados por pagina
    function updateResults() {
        const filteredData = filterAndSortData();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        renderFeedbackList(pageData);
        updatePagination(filteredData.length);
    }

    // Função para carregar dados do backend
    function loadFeedbackData() {
        $.ajax({
            url: '/feedback',
            method: 'GET',
            success: function(data) {
                console.log('Dados recebidos:', data); // Para verificar os dados recebidos
                feedbackData = data;
                updateResults(); 
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Erro ao carregar os dados de feedback:', textStatus, errorThrown);
                alert('Erro ao carregar os dados de feedback.');
            }
        });
    }
    
    $('#scoreFilter, #sortOrder').change(() => {
        currentPage = 1;
        updateResults();
    });
    $('#phoneSearch').on('input', () => {
        currentPage = 1;
        updateResults();
    });

    // resultados obtidos por pagina
    $('#pagination').on('click', 'a.page-link', function(e) {
        e.preventDefault();
        const newPage = $(this).data('page');
        if (newPage >= 1 && newPage <= Math.ceil(feedbackData.length / itemsPerPage)) {
            currentPage = newPage;
            updateResults();
        }
    });

    
    // Carregar os dados do feedback ao iniciar
    loadFeedbackData();
});

