import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Startup, Task, FileUploadData } from '../types';

// Determinar ambiente e URL base correspondente
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.REACT_APP_ENV === 'test';

// URL base da API
let API_URL = '';

// Em desenvolvimento, usar a API implantada
if (isDevelopment) {
  // Usar diretamente a API implantada em vez do servidor proxy local
  API_URL = process.env.REACT_APP_API_URL || 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';
} else if (process.env.REACT_APP_API_URL) {
  // Em produção, usar a URL definida na variável de ambiente
  API_URL = process.env.REACT_APP_API_URL;
} else {
  // Fallback para a raiz, que pode usar o proxy configurado no package.json
  API_URL = '/';
}

console.log(`Ambiente: ${process.env.NODE_ENV}, API URL: ${API_URL}, ENV: ${process.env.REACT_APP_ENV}`);

// Configuração do Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Desabilitar credenciais para evitar preflight
});

// Adicionar um interceptor para configurar cabeçalhos CORS
api.interceptors.request.use(config => {
  // Não devemos adicionar cabeçalhos CORS do lado do cliente
  // esses cabeçalhos devem vir apenas do servidor
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para lidar com as respostas da API
api.interceptors.response.use(
  (response) => {
    // Se a resposta tem um campo 'body' que é uma string, provavelmente é uma resposta do API Gateway
    if (response.data && typeof response.data.body === 'string') {
      try {
        response.data = JSON.parse(response.data.body);
      } catch (e) {
        console.warn('Falha ao parsear resposta da API:', e);
      }
    }
    return response;
  },
  (error) => {
    // Log detalhado de erros para diagnóstico
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um código de status
      // que não está no intervalo 2xx
      console.error('Erro de resposta do servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição que acionou um erro
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    if (error.config) {
      console.log('Configuração da requisição que falhou:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        timeout: error.config.timeout
      });
    }
    
    return Promise.reject(error);
  }
);

// Função auxiliar para determinar se é um ambiente de teste ou não
const isTestEnvironment = () => {
  return window.location.href.includes('localhost:3002') || 
         window.location.href.includes('api-test');
};

// Função utilitária para verificar se estamos na página de teste
const isApiTestPage = (): boolean => {
  return window.location.href.includes('api-test');
};

// Função antiga que não é mais usada
const isDebugEnvironment = isApiTestPage;

// Tamanho máximo do chunk em bytes (2MB)
const MAX_CHUNK_SIZE = 2 * 1024 * 1024;

/**
 * Divide um arquivo base64 em chunks menores se necessário
 * @param base64Content Conteúdo do arquivo em base64
 */
function getChunkedContent(base64Content: string): string[] {
  // Verificar se o conteúdo é maior que o tamanho máximo
  const contentLength = base64Content.length;
  
  if (contentLength <= MAX_CHUNK_SIZE) {
    return [base64Content]; // Não precisa dividir
  }
  
  console.log(`Arquivo grande detectado (${contentLength} bytes), dividindo em chunks`);
  
  // Dividir o conteúdo em chunks
  const chunks: string[] = [];
  let position = 0;
  
  while (position < contentLength) {
    const chunkEnd = Math.min(position + MAX_CHUNK_SIZE, contentLength);
    const chunk = base64Content.substring(position, chunkEnd);
    chunks.push(chunk);
    position = chunkEnd;
  }
  
  console.log(`Arquivo dividido em ${chunks.length} chunks`);
  return chunks;
}

/**
 * Função para enviar arquivo em chunks se necessário
 * @param url URL para upload
 * @param data Dados do upload
 * @param headers Cabeçalhos HTTP
 */
async function uploadWithChunks(url: string, data: any, headers: any): Promise<any> {
  // Verificar se devemos dividir o conteúdo
  const chunks = getChunkedContent(data.fileContent);
  
  if (chunks.length === 1) {
    // Envio normal, sem chunks
    return axios.post(url, data, { headers, timeout: 60000 });
  }
  
  // Envio em chunks
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  const totalChunks = chunks.length;
  
  console.log(`Iniciando upload em chunks (${totalChunks} chunks) com ID: ${uniqueId}`);
  
  // Primeiro chunk com metadados
  const firstChunkData = {
    ...data,
    fileContent: chunks[0],
    chunkInfo: {
      chunkId: 0,
      totalChunks,
      uniqueId,
    }
  };
  
  // Enviar primeiro chunk
  const firstResponse = await axios.post(url, firstChunkData, { headers, timeout: 60000 });
  
  // Se houver apenas um chunk ou erro, retornar imediatamente
  if (totalChunks === 1 || !firstResponse.data.success) {
    return firstResponse;
  }
  
  // Enviar chunks restantes
  for (let i = 1; i < totalChunks; i++) {
    const chunkData = {
      ...data,
      fileContent: chunks[i],
      chunkInfo: {
        chunkId: i,
        totalChunks,
        uniqueId,
      }
    };
    
    await axios.post(url, chunkData, { headers, timeout: 60000 });
    console.log(`Chunk ${i+1}/${totalChunks} enviado`);
  }
  
  // Recuperar resposta final
  const finalResponse = await axios.get(
    `${url}/status?uniqueId=${uniqueId}`,
    { headers, timeout: 30000 }
  );
  
  return finalResponse;
}

// API de Startups
export const startupApi = {
  // Alias para manter compatibilidade
  getAll: async (): Promise<Startup[]> => {
    return await startupApi.getAllStartups();
  },
  
  // Listar todas as startups
  getAllStartups: async (): Promise<Startup[]> => {
    try {
      // Tentar acessar a API diretamente
      console.log('Obtendo startups diretamente da API...');
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const response = await api.get<ApiResponse<Startup[]>>(`/startups`);
      
      // Verificar se a resposta está no formato esperado
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // Se a resposta for diretamente um array, retorne-o
        return response.data;
      } else {
        console.error('Formato de resposta da API não reconhecido:', response.data);
        throw new Error('Formato de resposta não reconhecido');
      }
    } catch (error) {
      console.error('Erro ao obter lista de startups:', error);
      throw error;
    }
  },

  // Buscar uma startup por ID
  getById: async (id: string): Promise<Startup> => {
    try {
      const response = await api.get<ApiResponse<Startup>>(`/startups/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erro ao buscar startup com ID ${id}:`, error);
      throw new Error('Falha ao buscar detalhes da startup');
    }
  },

  // Criar uma nova startup
  create: async (startup: Omit<Startup, 'id' | 'createdAt'>): Promise<Startup> => {
    try {
      const response = await api.post<ApiResponse<Startup>>('/startups', startup);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao criar startup:', error);
      throw new Error('Falha ao criar startup');
    }
  },

  // Atualizar uma startup existente
  update: async (id: string, startup: Partial<Startup>): Promise<Startup> => {
    try {
      const response = await api.put<ApiResponse<Startup>>(`/startups/${id}`, startup);
      return response.data.data;
    } catch (error) {
      console.error(`Erro ao atualizar startup com ID ${id}:`, error);
      throw new Error('Falha ao atualizar startup');
    }
  },

  // Excluir uma startup
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/startups/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir startup com ID ${id}:`, error);
      throw new Error('Falha ao excluir startup');
    }
  }
};

// API de Upload
export const uploadApi = {
  // Fazer upload de um arquivo
  uploadFile: async (fileData: {
    fileName: string;
    fileType: string;
    fileContent: string;
    startupId: string;
  }): Promise<Task> => {
    try {
      console.log('Iniciando upload com os seguintes dados:', {
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        startupId: fileData.startupId,
        fileSize: fileData.fileContent.length
      });
      
      // Construir objeto de resposta padrão
      const createTaskFromResponse = (response: any): Task => {
        // Verifica se a resposta contém o formato esperado
        if (response.data && response.data.taskId) {
          return response.data as Task;
        } 
        // Verifica se temos o formato direto da Lambda
        else if (response.taskId) {
          return {
            taskId: response.taskId,
            startupId: response.startupId || fileData.startupId,
            fileType: response.fileType || fileData.fileType,
            fileName: fileData.fileName,
            fileUrl: '',  // Será preenchido pelo backend
            status: response.status || 'PROCESSING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Task;
        } 
        // Outro formato - tenta extrair as informações necessárias
        else {
          console.warn('Formato de resposta não reconhecido:', response);
          return {
            taskId: response.taskId || String(Date.now()),
            startupId: fileData.startupId,
            fileType: fileData.fileType,
            fileName: fileData.fileName,
            fileUrl: '',
            status: 'PROCESSING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Task;
        }
      };
      
      // Opções de upload na ordem de prioridade
      // 1. CloudFront API específico (novo)
      // 2. Servidor de depuração (proxy local)
      // 3. API Gateway diretamente
      
      console.log('Tentando upload pelo CloudFront API...');
      try {
        // Primeiro tentar o CloudFront específico para API
        const cfApiUrl = process.env.REACT_APP_API_CLOUDFRONT 
          ? `${process.env.REACT_APP_API_CLOUDFRONT}/upload`
          : 'https://d34fwpy973tn5i.cloudfront.net/upload';
        const headers = {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Accept': 'application/json',
        };
        
        try {
          const cfApiResponse = await uploadWithChunks(
            cfApiUrl,
            fileData,
            headers
          );
          
          console.log('Resposta recebida do CloudFront API:', cfApiResponse.status);
          console.log('Dados da resposta:', cfApiResponse.data);
          
          // Extrair os dados da resposta
          let responseData = cfApiResponse.data;
          
          // Se a resposta contém um body string, parseá-lo
          if (typeof responseData.body === 'string') {
            try {
              responseData = JSON.parse(responseData.body);
            } catch (e) {
              console.warn('Falha ao parsear resposta do CloudFront API:', e);
            }
          }
          
          return createTaskFromResponse(responseData);
        } catch (cfApiError) {
          console.error('Erro ao usar CloudFront API:', cfApiError);
          throw cfApiError; // Propagar erro para tentar a próxima abordagem
        }
      } catch (cfApiError) {
        console.log('Falha no CloudFront API, tentando pelo servidor de depuração...');
        // Se falhar com o CloudFront API, tenta com o servidor de depuração
        
        try {
          // Verificar se o proxy está disponível
          const proxyStatus = await axios.get(
            'http://localhost:3003/status', 
            { timeout: 2000 }
          ).catch(() => ({ status: 'offline' }));
          
          if (proxyStatus.status === 200 || (proxyStatus as any).data?.status === 'online') {
            console.log('Proxy de depuração disponível, encaminhando upload...');
            
            // Construindo o cabeçalho para evitar problemas de CORS
            const headers = {
              'Content-Type': 'application/json',
            };
            
            // Enviar para o servidor proxy
            const jsonResponse = await uploadWithChunks(
              'http://localhost:3003/debug-upload', 
              fileData,
              headers
            );
            
            console.log('Resposta recebida do proxy (JSON):', jsonResponse.status);
            console.log('Dados da resposta:', jsonResponse.data);
            
            // Extrair os dados da resposta (qualquer formato)
            let responseData = jsonResponse.data;
            
            // Se a resposta contém um body string, precisamos parseá-lo
            if (typeof responseData.body === 'string') {
              try {
                responseData = JSON.parse(responseData.body);
                console.log('Body parseado:', responseData);
              } catch (e) {
                console.warn('Falha ao parsear resposta do proxy:', e);
              }
            }
            
            // Criar objeto Task a partir da resposta
            return createTaskFromResponse(responseData);
          } else {
            throw new Error(`Servidor proxy retornou status inesperado: ${proxyStatus.status}`);
          }
        } catch (proxyError) {
          console.error('Erro ao usar servidor proxy:', proxyError);
          throw proxyError; // Propagar erro para tentar a próxima abordagem
        }
      }
      
      // Último recurso: enviar diretamente para a API Gateway
      console.log('Tentando upload diretamente com a API Gateway...');
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Accept': 'application/json',
        };

        const response = await uploadWithChunks(
          `${API_URL}/upload`,
          fileData,
          headers
        );
        console.log('Resposta da API Gateway:', response.data);
        return createTaskFromResponse(response.data);
      } catch (apiError: any) {
        console.error('Erro no upload via API Gateway:', apiError);
        throw new Error(`Falha ao enviar o arquivo para API: ${apiError?.message || 'Erro desconhecido'}`);
      }
    } catch (finalError: any) {
      console.error('Todas as abordagens de upload falharam:', finalError);
      throw new Error(`Falha ao enviar o arquivo: ${finalError?.message || 'Erro desconhecido'}`);
    }
  }
};

// API de Tarefas
export const taskApi = {
  // Listar todas as tarefas
  getAll: async (): Promise<Task[]> => {
    try {
      const response = await api.get<ApiResponse<Task[]>>('/tasks');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      throw new Error('Falha ao buscar a lista de tarefas');
    }
  },

  // Buscar uma tarefa por ID
  getById: async (id: string): Promise<Task> => {
    try {
      const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erro ao buscar tarefa com ID ${id}:`, error);
      throw new Error('Falha ao buscar detalhes da tarefa');
    }
  },

  // Buscar tarefas por ID da startup
  getByStartupId: async (startupId: string): Promise<Task[]> => {
    try {
      const response = await api.get<ApiResponse<Task[]>>(`/tasks/startup/${startupId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erro ao buscar tarefas para startup com ID ${startupId}:`, error);
      throw new Error('Falha ao buscar tarefas da startup');
    }
  }
};

// Interface para respostas da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export default api;
