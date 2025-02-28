document.addEventListener('DOMContentLoaded', function() {
    // Constantes
    const API_ENDPOINT = 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';
    
    // Elementos do DOM
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const tasksList = document.getElementById('tasksList');
    const refreshTasks = document.getElementById('refreshTasks');
    const listStartups = document.getElementById('listStartups');
    const addStartupBtn = document.getElementById('addStartupBtn');
    const startupsList = document.getElementById('startupsList');
    const saveStartup = document.getElementById('saveStartup');
    const startupModal = new bootstrap.Modal(document.getElementById('startupModal'));
    
    // Event Listeners
    uploadForm.addEventListener('submit', handleFileUpload);
    refreshTasks.addEventListener('click', fetchTasks);
    listStartups.addEventListener('click', fetchStartups);
    addStartupBtn.addEventListener('click', () => {
        document.getElementById('startupForm').reset();
        document.getElementById('startupEditId').value = '';
        document.getElementById('startupModalTitle').textContent = 'Adicionar Startup';
        startupModal.show();
    });
    saveStartup.addEventListener('click', saveStartupData);
    
    // Funções
    async function handleFileUpload(e) {
        e.preventDefault();
        
        const startupId = document.getElementById('startupId').value;
        const fileType = document.getElementById('fileType').value;
        const fileInput = document.getElementById('file');
        const file = fileInput.files[0];
        
        if (!file) {
            showUploadStatus('Selecione um arquivo para enviar', 'danger');
            return;
        }
        
        try {
            showUploadStatus('Preparando arquivo para upload...', 'info');
            
            // Ler e codificar o arquivo em base64
            const fileContent = await readFileAsBase64(file);
            
            showUploadStatus('Enviando arquivo...', 'info');
            
            // Enviar para a API
            const response = await fetch(`${API_ENDPOINT}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_name: file.name,
                    file_type: fileType,
                    startup_id: startupId,
                    file_content: fileContent
                })
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const data = await response.json();
            
            showUploadStatus(`Arquivo enviado com sucesso. ID da tarefa: ${data.taskId}`, 'success');
            uploadForm.reset();
            
            // Atualizar a lista de tarefas após upload bem-sucedido
            setTimeout(fetchTasks, 1000);
            
        } catch (error) {
            console.error('Erro durante upload:', error);
            showUploadStatus(`Erro: ${error.message}`, 'danger');
        }
    }
    
    function showUploadStatus(message, type) {
        uploadStatus.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }
    
    async function fetchTasks() {
        try {
            tasksList.innerHTML = '<p>Carregando tarefas...</p>';
            
            const response = await fetch(`${API_ENDPOINT}/tasks`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const tasks = await response.json();
            
            if (tasks.length === 0) {
                tasksList.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
                return;
            }
            
            let tasksHTML = '';
            tasks.forEach(task => {
                let statusClass = 'processing';
                let statusText = 'Processando';
                
                if (task.status === 'COMPLETED') {
                    statusClass = 'success';
                    statusText = 'Concluído';
                } else if (task.status === 'FAILED') {
                    statusClass = 'error';
                    statusText = 'Falha';
                }
                
                tasksHTML += `
                    <div class="task-item ${statusClass}">
                        <div><strong>ID:</strong> ${task.task_id}</div>
                        <div><strong>Startup:</strong> ${task.startup_id}</div>
                        <div><strong>Arquivo:</strong> ${task.file_name}</div>
                        <div><strong>Tipo:</strong> ${task.file_type}</div>
                        <div><strong>Status:</strong> ${statusText}</div>
                        <div><strong>Data:</strong> ${new Date(task.created_at).toLocaleString()}</div>
                        ${task.result_url ? `<div><a href="${task.result_url}" target="_blank" class="btn btn-sm btn-primary mt-2">Ver Resultado</a></div>` : ''}
                    </div>
                `;
            });
            
            tasksList.innerHTML = tasksHTML;
            
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            tasksList.innerHTML = `<div class="alert alert-danger">Erro ao buscar tarefas: ${error.message}</div>`;
        }
    }
    
    async function fetchStartups() {
        try {
            startupsList.innerHTML = '<p>Carregando startups...</p>';
            
            const response = await fetch(`${API_ENDPOINT}/startups`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const startups = await response.json();
            
            if (startups.length === 0) {
                startupsList.innerHTML = '<p>Nenhuma startup encontrada.</p>';
                return;
            }
            
            let startupsHTML = '';
            startups.forEach(startup => {
                startupsHTML += `
                    <div class="startup-item">
                        <div><strong>ID:</strong> ${startup.startup_id}</div>
                        <div><strong>Nome:</strong> ${startup.name}</div>
                        <div><strong>Setor:</strong> ${startup.sector || 'Não informado'}</div>
                        <div><strong>Estágio:</strong> ${startup.stage || 'Não informado'}</div>
                        <div class="startup-actions mt-2">
                            <button class="btn btn-sm btn-outline-primary edit-startup" data-id="${startup.startup_id}">Editar</button>
                            <button class="btn btn-sm btn-outline-danger delete-startup" data-id="${startup.startup_id}">Excluir</button>
                        </div>
                    </div>
                `;
            });
            
            startupsList.innerHTML = startupsHTML;
            
            // Adicionar event listeners para os botões de edição e exclusão
            document.querySelectorAll('.edit-startup').forEach(button => {
                button.addEventListener('click', (e) => editStartup(e.target.getAttribute('data-id')));
            });
            
            document.querySelectorAll('.delete-startup').forEach(button => {
                button.addEventListener('click', (e) => deleteStartup(e.target.getAttribute('data-id')));
            });
            
        } catch (error) {
            console.error('Erro ao buscar startups:', error);
            startupsList.innerHTML = `<div class="alert alert-danger">Erro ao buscar startups: ${error.message}</div>`;
        }
    }
    
    async function editStartup(startupId) {
        try {
            const response = await fetch(`${API_ENDPOINT}/startups/${startupId}`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const startup = await response.json();
            
            // Preencher o formulário com os dados da startup
            document.getElementById('startupEditId').value = startup.startup_id;
            document.getElementById('startupName').value = startup.name || '';
            document.getElementById('startupDescription').value = startup.description || '';
            document.getElementById('startupSector').value = startup.sector || '';
            document.getElementById('startupStage').value = startup.stage || '';
            
            // Atualizar título do modal
            document.getElementById('startupModalTitle').textContent = 'Editar Startup';
            
            // Exibir modal
            startupModal.show();
            
        } catch (error) {
            console.error('Erro ao buscar detalhes da startup:', error);
            alert(`Erro: ${error.message}`);
        }
    }
    
    async function saveStartupData() {
        const startupId = document.getElementById('startupEditId').value;
        const isEditing = startupId !== '';
        
        const startupData = {
            name: document.getElementById('startupName').value,
            description: document.getElementById('startupDescription').value,
            sector: document.getElementById('startupSector').value,
            stage: document.getElementById('startupStage').value
        };
        
        try {
            let url = `${API_ENDPOINT}/startups`;
            let method = 'POST';
            
            if (isEditing) {
                url = `${API_ENDPOINT}/startups/${startupId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(startupData)
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            // Fechar modal
            startupModal.hide();
            
            // Atualizar lista de startups
            fetchStartups();
            
        } catch (error) {
            console.error('Erro ao salvar startup:', error);
            alert(`Erro: ${error.message}`);
        }
    }
    
    async function deleteStartup(startupId) {
        if (!confirm(`Tem certeza que deseja excluir a startup ${startupId}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_ENDPOINT}/startups/${startupId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            // Atualizar lista de startups
            fetchStartups();
            
        } catch (error) {
            console.error('Erro ao excluir startup:', error);
            alert(`Erro: ${error.message}`);
        }
    }
    
    // Função para ler arquivo e converter para base64
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Extrai a parte base64 da string (remove o prefixo data:*/*;base64,)
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    // Carregar dados iniciais
    fetchTasks();
});
