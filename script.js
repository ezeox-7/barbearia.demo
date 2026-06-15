// Global: durações e buffer
const DURACOES = {
    'Corte': 30,
    'Barba': 15,
    'Sobrancelha': 10,
    'Luzes': 90,
    'Hidratacao': 40,
    'Progressiva': 120
};
const BUFFER_MIN = 15; // minutos de folga entre atendimentos

function inferDuracaoFromLabels(labels) {
    let minutos = 0;
    labels.forEach(l => {
        if (/corte/i.test(l)) minutos += DURACOES['Corte'] || 30;
        else if (/barba/i.test(l)) minutos += DURACOES['Barba'] || 15;
        else if (/sobrancelha/i.test(l)) minutos += DURACOES['Sobrancelha'] || 10;
        else if (/luzes/i.test(l)) minutos += DURACOES['Luzes'] || 90;
        else if (/hidrata/i.test(l) || /hidrataç/i.test(l)) minutos += DURACOES['Hidratacao'] || 40;
        else if (/progressiva/i.test(l)) minutos += DURACOES['Progressiva'] || 120;
        else minutos += 30;
    });
    return minutos;
}

document.addEventListener('DOMContentLoaded', function() {
// ===== PÁGINA DE SERVIÇOS (Orçamento + Agendamento) =====
try {
    const btnCalcular = document.getElementById('btn-calcular');
    const btnLimpar = document.getElementById('btn-limpar');
    const checkboxes = document.querySelectorAll('.servico-checkbox');
    const orcamentoResultado = document.getElementById('orcamento-resultado');
    const valorTotal = document.getElementById('valor-total');
    const servicosSelecionados = document.getElementById('servicos-selecionados');

    // Novo método: controlar botão Agendar diretamente
    const btnAgendar = document.getElementById('btn-agendar');
    function enableAgendar() { if (btnAgendar) btnAgendar.disabled = false; }
    function disableAgendar() { if (btnAgendar) btnAgendar.disabled = true; }
    if (btnAgendar) btnAgendar.disabled = true; // padrão: desabilitado

    // exige clique em "Confirmar" antes de permitir agendar
    let orcamentoConfirmado = false;

    function calcularOrcamento() {
        let total = 0;
        let servicos = [];
        checkboxes.forEach(cb => {
            if (cb.checked) {
                total += parseFloat(cb.getAttribute('data-preco')) || 0;
                servicos.push(cb.parentElement.textContent.trim());
            }
        });
        return { total, servicos };
    }

    function calcularDuracaoSelecionados() {
        let minutos = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const key = cb.getAttribute('data-servico');
                if (DURACOES[key]) minutos += DURACOES[key];
            }
        });
        return minutos;
    }

    // handler nomeado para calcular (reutilizável)
    function handleCalcularClick() {
        const resultado = calcularOrcamento();
        // bloquear quando nenhum serviço selecionado
        if (!resultado.servicos || resultado.servicos.length === 0 || resultado.total === 0) {
            alert('Selecione pelo menos um serviço antes de confirmar o orçamento!');
            return;
        }
        const duracaoMinutos = calcularDuracaoSelecionados();
        if (valorTotal) valorTotal.textContent = 'R$ ' + resultado.total.toFixed(2).replace('.', ',');
        if (servicosSelecionados) servicosSelecionados.innerHTML = '<strong>Serviços selecionados:</strong><br>' + resultado.servicos.join('<br>');
        if (orcamentoResultado) orcamentoResultado.style.display = 'block';
        const duracaoTotalEl = document.getElementById('duracao-total'); if (duracaoTotalEl) duracaoTotalEl.textContent = 'Duração: ' + duracaoMinutos + ' min';
        const servicosHidden = document.getElementById('servicos-hidden'); const totalHidden = document.getElementById('total-hidden');
        if (servicosHidden && totalHidden) { servicosHidden.value = JSON.stringify(resultado.servicos); totalHidden.value = resultado.total; }
        localStorage.setItem('orcamento', JSON.stringify({ total: resultado.total, servicos: resultado.servicos }));
        // habilitar botão agendar apenas após confirmação
        enableAgendar();
    }

    if (btnCalcular) {
        btnCalcular.addEventListener('click', handleCalcularClick);
    } else {
        // fallback por delegação
        document.addEventListener('click', function(e) {
            const target = e.target.closest && e.target.closest('#btn-calcular');
            if (target) handleCalcularClick();
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            checkboxes.forEach(cb => cb.checked = false);
            if (orcamentoResultado) orcamentoResultado.style.display = 'none';
            const duracaoTotalEl = document.getElementById('duracao-total'); if (duracaoTotalEl) duracaoTotalEl.textContent = 'Duração: 0 min';
            const servicosHidden = document.getElementById('servicos-hidden'); const totalHidden = document.getElementById('total-hidden');
            if (servicosHidden) servicosHidden.value = '';
            if (totalHidden) totalHidden.value = '';
            localStorage.removeItem('orcamento');
            disableAgendar();
        });
    }

    // invalidar confirmação se usuário alterar seleção após confirmar
    checkboxes.forEach(cb => cb.addEventListener('change', function() { disableAgendar(); }));

    // formulário de agendamento
    const form = document.getElementById('form-servicos');

    function handleFormSubmit(e) {
        if (e) e.preventDefault();
        // garantir confirmação via habilitação do botão
        if (btnAgendar && btnAgendar.disabled) { alert('Por favor, confirme o orçamento antes de agendar.'); return; }
        const nome = document.getElementById('nome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const data = document.getElementById('data').value;
        const hora = document.getElementById('hora').value;
        const servicosHiddenEl = document.getElementById('servicos-hidden');
        const totalHiddenEl = document.getElementById('total-hidden');
        let servicosHiddenVal = servicosHiddenEl ? servicosHiddenEl.value : '';
        let totalHidden = totalHiddenEl ? (parseFloat(totalHiddenEl.value) || 0) : 0;

        // se o usuário não clicou em "Confirmar", preencher a partir da seleção atual
        if (!servicosHiddenVal || servicosHiddenVal.trim() === '' || totalHidden === 0) {
            const resultadoInter = calcularOrcamento();
            servicosHiddenVal = JSON.stringify(resultadoInter.servicos);
            totalHidden = resultadoInter.total;
            if (servicosHiddenEl) servicosHiddenEl.value = servicosHiddenVal;
            if (totalHiddenEl) totalHiddenEl.value = totalHidden;
        }

        if (!nome) { alert('Por favor, digite seu nome!'); return; }
        if (!telefone || telefone.length < 10) { alert('Por favor, digite um telefone válido!'); return; }
        if (!data) { alert('Por favor, selecione uma data!'); return; }
        if (!hora) { alert('Por favor, selecione um horário!'); return; }
        const duracaoMinutos = calcularDuracaoSelecionados();
        if (duracaoMinutos === 0) { alert('Selecione ao menos um serviço antes de agendar!'); return; }
        const dataInicio = new Date(data + 'T' + hora);
        if (isNaN(dataInicio.getTime()) || dataInicio <= new Date()) { alert('Selecione uma data futura!'); return; }
        const duracaoTotalMin = duracaoMinutos + BUFFER_MIN;
        const dataFim = new Date(dataInicio.getTime() + duracaoTotalMin * 60000);
        let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
        const conflito = agendamentos.find(a => {
            const inicioExist = a.inicioISO ? new Date(a.inicioISO) : new Date(a.data + 'T' + a.hora);
            let fimExist;
            if (a.fimISO) fimExist = new Date(a.fimISO);
            else {
                const durExist = (typeof a.duracao === 'number' && a.duracao > 0) ? a.duracao : inferDuracaoFromLabels(a.servicos || []);
                fimExist = new Date(inicioExist.getTime() + (durExist + BUFFER_MIN) * 60000);
            }
            return (dataInicio < fimExist) && (inicioExist < dataFim);
        });
        if (conflito) { alert('Horário indisponível. Existe um agendamento conflitante:\n\n' + 'Nome: ' + conflito.nome + '\nData: ' + new Date(conflito.data).toLocaleDateString('pt-BR') + ' às ' + conflito.hora); return; }
        const servicos = servicosHiddenVal ? JSON.parse(servicosHiddenVal) : [];
        const agendamento = { id: Date.now(), nome, telefone, servicos, total: totalHidden, data, hora, duracao: duracaoMinutos, inicioISO: dataInicio.toISOString(), fimISO: dataFim.toISOString(), criadoEm: new Date().toLocaleString('pt-BR') };
        agendamentos.push(agendamento);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        alert('✓ Agendamento efetuado!\n\nNome: ' + nome + '\nServiços: ' + servicos.join(', ') + '\nTotal: R$ ' + agendamento.total.toFixed(2).replace('.', ',') + '\nData: ' + data.split('-').reverse().join('/') + '\nHora: ' + hora + '\nDuração: ' + duracaoMinutos + ' min');
        if (form) form.reset(); checkboxes.forEach(cb => cb.checked = false); if (orcamentoResultado) orcamentoResultado.style.display = 'none';
    }

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        // fallback por delegação para botão de agendar
        document.addEventListener('click', function(e) {
            const target = e.target.closest && e.target.closest('#btn-agendar');
            if (target) {
                // tentar submeter formulário via delegação
                const f = document.getElementById('form-servicos');
                if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit'));
            }
        });
    }
} catch (err) { console.error('Erro inicializando página de serviços:', err); }

// ===== PÁGINA DE AGENDAMENTOS (listagem + remoção) =====
try {
    const lista = document.getElementById('lista-agendamentos');
    if (lista) {
        function renderizarAgendamentos() {
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
            if (agendamentos.length === 0) { lista.innerHTML = '<p>Nenhum agendamento ainda.</p>'; return; }
            lista.innerHTML = '';
            agendamentos.forEach(a => {
                const div = document.createElement('div');
                div.className = 'agendamento-item';
                const dur = a.duracao || inferDuracaoFromLabels(a.servicos || []);
                div.innerHTML = `
                    <p><strong>${a.nome}</strong> — ${new Date(a.data).toLocaleDateString('pt-BR')} às ${a.hora} (duração: ${dur} min)</p>
                    <p>Serviços: ${a.servicos.join(', ')}</p>
                    <p>Total: R$ ${a.total.toFixed(2).replace('.',',')}</p>
                    <p style="font-size:0.8rem;color:#999">Agendado em: ${a.criadoEm}</p>
                    <nav style="margin-top:8px;"><button class="botao btn-remover" data-id="${a.id}">Remover</button></nav>
                    <div class="senha-prompt" style="display:none;margin-top:8px;">
                        <input type="password" class="senha-input" placeholder="Senha para remover" style="padding:6px;border-radius:6px;border:none;margin-right:8px;">
                        <button class="botao btn-confirm-remove" data-id="${a.id}">Confirmar</button>
                        <button class="botao btn-cancel-remove">Cancelar</button>
                    </div>
                    <hr>
                `;
                lista.appendChild(div);
            });

            // mostrar prompt ao clicar em remover
            lista.querySelectorAll('.btn-remover').forEach(btn => {
                btn.addEventListener('click', function() {
                    const container = this.closest('.agendamento-item');
                    const prompt = container.querySelector('.senha-prompt');
                    if (prompt) prompt.style.display = 'block';
                    const input = container.querySelector('.senha-input'); if (input) input.focus();
                });
            });

            // cancelar remoção
            lista.querySelectorAll('.btn-cancel-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    const container = this.closest('.agendamento-item');
                    const prompt = container.querySelector('.senha-prompt');
                    if (prompt) prompt.style.display = 'none';
                });
            });

            // confirmar remoção — exige senha '123'
            lista.querySelectorAll('.btn-confirm-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    const container = this.closest('.agendamento-item');
                    const input = container.querySelector('.senha-input');
                    const senha = input ? input.value : '';
                    if (senha === '123') {
                        let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
                        agendamentos = agendamentos.filter(x => x.id !== id);
                        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
                        renderizarAgendamentos();
                    } else {
                        alert('Senha incorreta!');
                        if (input) { input.value = ''; input.focus(); }
                    }
                });
            });
        }
        renderizarAgendamentos();
    }
} catch (err) { console.error('Erro renderizando agendamentos:', err); }

});