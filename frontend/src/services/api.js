const BASE_URL = 'http://localhost:8000';

/**
 * Analyzes a GitHub repository and streams progress updates.
 * @param {string} githubUrl - The URL of the repository to analyze.
 * @param {Function} onProgress - Callback for progress updates: ({ value, message }) => void
 * @returns {Promise<Object>} - The final analysis result.
 */
export async function analyzeRepoStream(githubUrl, onProgress) {
  const payload = { github_url: githubUrl };
  console.log("🌐 [api.js] Starting analysis stream for:", githubUrl);

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
    throw new Error(errorData.detail || `Server responded with ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalData = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep partial line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const rawJson = line.replace('data: ', '').trim();
        if (!rawJson) continue;
        try {
          const event = JSON.parse(rawJson);
          if (event.type === 'progress') {
            onProgress?.({ value: event.value, message: event.message });
          } else if (event.type === 'data') {
            finalData = event.payload;
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        } catch (e) {
          console.error("❌ [api.js] Failed to parse SSE line:", line, e);
        }
      }
    }
  }

  if (!finalData) throw new Error("Stream closed without receiving final analysis data.");
  return finalData;
}

/**
 * Legacy support for non-streaming analysis.
 */
export async function analyzeRepo(githubUrl) {
  return analyzeRepoStream(githubUrl, () => {});
}

/**
 * Fetches detailed insights and graph data for a specific file.
 * @param {string} repoId - The unique ID of the analyzed repository.
 * @param {string} filePath - The path of the file to investigate.
 * @returns {Promise<Object>} - The file details and AI insights.
 */
export async function fetchFileDetails(repoId, filePath) {
  try {
    const url = new URL(`${BASE_URL}/file-details/${repoId}`);
    url.searchParams.append('file_path', filePath);

    console.log("🌐 [api.js] Calling fetchFileDetails with URL:", url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log("📥 [api.js] Response received:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file details: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 [api.js] Decoded JSON data:", data);
    return data;
  } catch (err) {
    console.error("🔥 [api.js] Caught error in fetchFileDetails:", err);
    throw err;
  }
}
