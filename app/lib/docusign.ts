import docusign from "docusign-esign";

const jwtLifeSec = 10 * 60; // 10 minutes
const basePath = "https://demo.docusign.net/restapi";
const oAuthBasePath = "account-d.docusign.com";

export async function getDocusignClient() {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(basePath);
  apiClient.setOAuthBasePath(oAuthBasePath);

  // Estas variáveis devem ser configuradas no arquivo .env
  const rsaKey = process.env.DOCUSIGN_RSA_KEY || "";
  const clientId = process.env.DOCUSIGN_CLIENT_ID || ""; // Integration Key
  const userId = process.env.DOCUSIGN_USER_ID || ""; // Impersonated User ID GUID

  if (!rsaKey || !clientId || !userId) {
    console.warn("DocuSign: Credenciais ausentes no .env. Ignorando a integração real.");
    return null;
  }

  try {
    const results = await apiClient.requestJWTUserToken(
      clientId,
      userId,
      ["signature", "impersonation"],
      rsaKey,
      jwtLifeSec
    );

    apiClient.addDefaultHeader("Authorization", "Bearer " + results.body.access_token);
    return apiClient;
  } catch (error) {
    console.error("Erro na autenticação DocuSign:", error);
    throw error;
  }
}

export interface DocusignSigner {
  email: string;
  name: string;
  routingOrder: string;
  anchorString: string; // Ex: "Assinatura do Orientador"
}

export async function createEnvelope(
  pdfBuffers: { name: string; buffer: Buffer }[],
  signers: DocusignSigner[],
  subject: string
) {
  const apiClient = await getDocusignClient();
  
  if (!apiClient) {
    // Modo de simulação para desenvolvimento se faltar credenciais
    console.log("Simulando criação de envelope no DocuSign...");
    return "simulated-envelope-id-" + Date.now();
  }

  const envDef = new docusign.EnvelopeDefinition();
  envDef.emailSubject = subject;

  // Adicionando os documentos ao envelope
  envDef.documents = pdfBuffers.map((pdf, index) => {
    const doc = new docusign.Document();
    doc.documentBase64 = pdf.buffer.toString("base64");
    doc.name = pdf.name;
    doc.fileExtension = "pdf";
    doc.documentId = (index + 1).toString();
    return doc;
  });

  // Criando os signatários (quem vai assinar)
  const docusignSigners = signers.map((signer, index) => {
    const dSigner = new docusign.Signer();
    dSigner.email = signer.email;
    dSigner.name = signer.name;
    dSigner.recipientId = (index + 1).toString();
    dSigner.routingOrder = signer.routingOrder;

    // Configurando as abas de assinatura (SignHere) baseadas em texto-âncora
    const signHere = docusign.SignHere.constructFromObject({
      anchorString: signer.anchorString,
      anchorYOffset: "-20", // Ajuste para ficar um pouco acima do texto
      anchorUnits: "pixels",
      anchorXOffset: "0",
    });

    const tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [signHere],
    });
    dSigner.tabs = tabs;

    return dSigner;
  });

  const recipients = docusign.Recipients.constructFromObject({
    signers: docusignSigners,
  });

  envDef.recipients = recipients;
  envDef.status = "sent"; // "sent" envia imediatamente. "created" salva como rascunho.

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";
  
  try {
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition: envDef,
    });
    return results.envelopeId;
  } catch (error) {
    console.error("Erro ao criar envelope:", error);
    throw error;
  }
}

export async function downloadEnvelopeDocuments(envelopeId: string) {
  const apiClient = await getDocusignClient();
  if (!apiClient) return null;

  const envelopesApi = new docusign.EnvelopesApi(apiClient);
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";

  try {
    // Lista os documentos no envelope
    const docsList = await envelopesApi.listDocuments(accountId, envelopeId);
    if (!docsList.envelopeDocuments) return [];

    const downloadedDocs = [];

    for (const doc of docsList.envelopeDocuments) {
      if (doc.documentId && doc.documentId !== "certificate") { // Evita baixar o certificado de resumo se não quiser, ou baixa também
        const docStream = await envelopesApi.getDocument(accountId, envelopeId, doc.documentId);
        
        // A SDK Node do DocuSign retorna o arquivo como string binária
        const buffer = Buffer.isBuffer(docStream) 
          ? docStream 
          : Buffer.from(docStream as string, 'binary');

        downloadedDocs.push({
          documentId: doc.documentId,
          name: doc.name || `document_${doc.documentId}.pdf`,
          buffer: buffer
        });
      }
    }

    return downloadedDocs;
  } catch (error) {
    console.error("Erro ao baixar documentos do envelope:", error);
    throw error;
  }
}
