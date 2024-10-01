$(document).ready(function() {
    $('#phone').mask('(00) 00000-0000'); // Aplica a máscara no campo de telefone

    let selectedRating = null;
    //configuração de botão
    $('.nps-button').click(function () {
        $('.nps-button').removeClass('active');
        $(this).addClass('active');
        selectedRating = $(this).data('value');
    });

    //coleta dados formulário
    $('#npsForm').submit(function (e) {
        e.preventDefault();

        const name = $('#name').val();
        const email = $('#email').val();
        const phone = $('#phone').val();
        const feedback = $('#feedback').val();

        if (selectedRating === null) {
            alert('Por favor, selecione uma nota de 0 a 10.');
            return;
        }

        // Faz o envio dos dados para o back-end
        $.ajax({
            url: '/submit-survey',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                name,
                email,
                phone,
                rating: selectedRating,
                feedback
            }),
            success: function(response) {
                alert('Obrigado por participar da nossa pesquisa!');
                $('#npsForm')[0].reset();
                $('.nps-button').removeClass('active');
                selectedRating = null;
            },
            error: function(xhr, status, error) {
                console.error('Erro ao salvar dados:', error);
                alert('Ocorreu um erro ao enviar sua resposta. Tente novamente.');
            }
        });
    });
});
