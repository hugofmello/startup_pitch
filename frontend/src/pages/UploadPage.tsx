import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadApi, startupApi } from '../services/api';
import { Startup } from '../types';
import { toast } from 'react-toastify';
import './UploadPage.css';
import axios from 'axios'; // Import axios

// Definir o tipo FileType localmente
type FileType = 'PDF' | 'EXCEL' | 'TXT';

// Interface para gerenciar o estado interno do componente
interface UploadPageState {
  startups: Startup[];
  selectedStartupId: string;
  isLoading: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  selectedFileType: FileType;
  errorMessage: string | null;
  loadingMessages: string[];
  uploadProgress: number;
  success: boolean;
  startupOptions: { id: string; label: string }[];
}

// Componente para depuração
const DebugConsole: React.FC<{ messages: string[] }> = ({ messages }) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="debug-console">
      <h4>Console de Depuração</h4>
      <div className="console-content" ref={consoleRef}>
        {messages.map((msg, index) => (
          <div key={index} className="console-line">{msg}</div>
        ))}
      </div>
    </div>
  );
};

// Componente principal
const UploadPage: React.FC = () => {
  // Recuperar o ID da startup da URL
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();

  // Estado inicial
  const [state, setState] = useState<UploadPageState>({
    startups: [],
    selectedStartupId: startupId || '',
    isLoading: true,
    isUploading: false,
    selectedFile: null,
    selectedFileType: 'PDF',
    errorMessage: null,
    loadingMessages: [],
    uploadProgress: 0,
    success: false,
    startupOptions: []
  });

  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obter a lista de startups quando o componente for montado
  useEffect(() => {
    const fetchStartups = async () => {
      try {
        addLogMessage('Buscando lista de startups...');
        
        // Mostrar mensagem de depuração explícita
        console.log('Iniciando busca de startups na API');
        
        // Não tentar o proxy local, usar diretamente a API implantada
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await startupApi.getAllStartups();
        addLogMessage(`${response.length} startups encontradas via API direta`);
        
        // Atualizar o estado
        setState(prevState => ({ 
          ...prevState, 
          startupOptions: response.map((s: Startup) => ({ id: s.id, label: s.name })),
          isLoading: false
        }));
      } catch (error) {
        console.error('Erro ao buscar startups:', error);
        addLogMessage(`Erro ao buscar startups: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setState(prevState => ({ 
          ...prevState, 
          errorMessage: 'Não foi possível carregar a lista de startups',
          isLoading: false
        }));
      }
    };

    // Iniciar o carregamento
    setState(prevState => ({ ...prevState, isLoading: true }));
    fetchStartups();
  }, []);

  // Função para adicionar mensagens de log
  const addLogMessage = (message: string) => {
    setState(prev => ({
      ...prev,
      loadingMessages: [...prev.loadingMessages, `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  };

  // Manipulador para seleção de arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Verificar tamanho do arquivo (limite de 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, errorMessage: 'Arquivo muito grande. O limite é de 10MB.' }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      selectedFile: file,
      errorMessage: null
    }));
    
    addLogMessage(`Arquivo selecionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  };

  // Manipulador para alteração do tipo de arquivo
  const handleFileTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ 
      ...prev, 
      selectedFileType: event.target.value as FileType,
      selectedFile: null // Limpa o arquivo selecionado quando muda o tipo
    }));
    addLogMessage(`Tipo de arquivo alterado para: ${event.target.value}`);
  };

  // Manipulador para alteração da startup selecionada
  const handleStartupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ 
      ...prev, 
      selectedStartupId: event.target.value,
      errorMessage: null
    }));
    addLogMessage(`Startup selecionada: ID ${event.target.value}`);
  };

  // Função para mapear o tipo de arquivo para o formato adequado para a API
  const mapFileType = (fileType: FileType): string => {
    switch (fileType) {
      case 'PDF': return 'pitch-pdf';
      case 'EXCEL': return 'pl-xlsx';
      case 'TXT': return 'pitch-txt';
      default: return 'pitch-pdf';
    }
  };
  
  // Função para preparar o arquivo para upload (convertendo para base64)
  const prepareFileForUpload = (file: File): Promise<string> => {
    addLogMessage(`Preparando arquivo ${file.name} para upload...`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target || typeof event.target.result !== 'string') {
            throw new Error('Falha ao ler arquivo');
          }
          
          // Remover "data:application/pdf;base64," do início da string
          const base64Content = event.target.result.split(',')[1];
          resolve(base64Content);
        } catch (error) {
          addLogMessage('Erro ao processar o arquivo');
          reject(new Error('Falha ao converter arquivo para base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Função para enviar o arquivo
  const handleUpload = async () => {
    if (!state.selectedFile || !state.selectedStartupId || !state.selectedFileType) {
      setState(prev => ({ ...prev, errorMessage: 'Por favor selecione uma startup, um tipo de arquivo e um arquivo para upload.' }));
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, errorMessage: null }));
    addLogMessage('Iniciando processo de upload...');

    try {
      // Converter o arquivo para base64
      addLogMessage('Convertendo arquivo para base64...');
      const fileContent = await prepareFileForUpload(state.selectedFile);
      
      addLogMessage(`Arquivo convertido: ${fileContent.substring(0, 50)}...`);
      addLogMessage(`Preparando dados para upload (startupId: ${state.selectedStartupId}, fileType: ${mapFileType(state.selectedFileType)})`);

      // Fazer upload do arquivo
      addLogMessage('Iniciando upload para API...');
      const task = await uploadApi.uploadFile({
        fileContent,
        fileName: state.selectedFile.name,
        fileType: mapFileType(state.selectedFileType),
        startupId: state.selectedStartupId
      });

      addLogMessage('Upload concluído com sucesso!');
      addLogMessage(`ID da tarefa: ${task?.taskId || 'Não disponível'}`);
      
      setState(prev => ({ ...prev, success: true }));
      setState(prev => ({ ...prev, selectedFile: null }));
      setState(prev => ({ ...prev, fileInputKey: Date.now().toString() })); // Resetar o input file
      
      // Redirecionar para a página da startup após 2 segundos
      setTimeout(() => {
        navigate(`/startups/${state.selectedStartupId}`);
      }, 2000);

    } catch (error: unknown) {
      console.error('Erro durante o upload:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorStatus = error.response.status;
          const errorData = error.response.data as any;
          const errorMessage = errorData.message || 'Erro ao processar o upload';
          
          addLogMessage(`Erro ${errorStatus}: ${JSON.stringify(errorData)}`);
          setState(prev => ({ ...prev, errorMessage: `Erro ${errorStatus}: ${errorMessage}` }));
        } else if (error.request) {
          const errorMsg = error.message;
          addLogMessage(`Erro de requisição: ${errorMsg}`);
          setState(prev => ({ ...prev, errorMessage: `Erro de requisição: ${errorMsg}` }));
        } else {
          const errorMsg = error.message;
          addLogMessage(`Erro de configuração: ${errorMsg}`);
          setState(prev => ({ ...prev, errorMessage: `Erro de configuração: ${errorMsg}` }));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        addLogMessage(`Erro desconhecido: ${errorMessage}`);
        setState(prev => ({ ...prev, errorMessage: `Erro ao enviar arquivo: ${errorMessage}` }));
      }
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Função para acionar o seletor de arquivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Encontrar a startup selecionada
  const selectedStartup = state.startups.find(s => s.id === state.selectedStartupId);

  return (
    <div className="upload-page">
      <h1>Upload de Documentos</h1>
      
      {state.errorMessage && (
        <div className="error-message">
          <span>⚠️</span> {state.errorMessage}
        </div>
      )}
      
      <div className="upload-container">
        {state.isLoading ? (
          <div className="loading-spinner">
            <div className="spinner">🔄</div>
            <p>Carregando startups...</p>
          </div>
        ) : (
          <>
            <div className="startup-info">
              <p><strong>Startup</strong></p>
              <select 
                value={state.selectedStartupId} 
                onChange={handleStartupChange}
                disabled={state.isUploading}
              >
                <option value="">Selecione uma startup</option>
                {state.startupOptions.map(startup => (
                  <option key={startup.id} value={startup.id}>
                    {startup.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="file-type-selector">
              <p><strong>Tipo de Arquivo</strong></p>
              <select 
                value={state.selectedFileType} 
                onChange={handleFileTypeChange}
                disabled={state.isUploading}
              >
                <option value="PDF">Pitch (PDF)</option>
                <option value="EXCEL">Financeiro (Excel)</option>
                <option value="TXT">Descrição (TXT)</option>
              </select>
            </div>
            
            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept={state.selectedFileType === 'PDF' ? '.pdf' : 
                       state.selectedFileType === 'EXCEL' ? '.xlsx,.xls' : '.txt'}
                disabled={state.isUploading}
              />
              
              <div className="file-drop-zone" onClick={triggerFileInput}>
                {state.selectedFile ? (
                  <div className="selected-file-info">
                    <div className="file-icon">📄</div>
                    <p>Arquivo selecionado: {state.selectedFile.name}</p>
                    <p className="file-size">Tamanho: {(state.selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="drop-instructions">
                    <div className="upload-icon">📤</div>
                    <p>SELECIONAR ARQUIVO</p>
                  </div>
                )}
              </div>
              
              <button 
                className="upload-button"
                onClick={handleUpload}
                disabled={!state.selectedStartupId || !state.selectedFile || state.isUploading}
              >
                {state.isUploading ? (
                  <>
                    <span className="button-icon">🔄</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="button-icon">📤</span>
                    Enviar Arquivo
                  </>
                )}
              </button>
            </div>
            
            {state.isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${state.uploadProgress}%` }}
                  ></div>
                </div>
                <p>{state.uploadProgress}%</p>
              </div>
            )}
            
            {selectedStartup && (
              <div className="startup-details">
                <h3>Detalhes da Startup</h3>
                <div className="startup-detail-item">
                  <strong>Nome:</strong> {selectedStartup.name}
                </div>
                <div className="startup-detail-item">
                  <strong>Setor:</strong> {selectedStartup.sector || 'Não informado'}
                </div>
                {selectedStartup.description && (
                  <div className="startup-detail-item">
                    <strong>Descrição:</strong> {selectedStartup.description}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <DebugConsole messages={state.loadingMessages} />
    </div>
  );
};

export default UploadPage;
