// const BASE_URL = 'http://localhost:8000';

// /**
//  * Analyzes a GitHub repository and streams progress updates.
//  * @param {string} githubUrl - The URL of the repository to analyze.
//  * @param {Function} onProgress - Callback for progress updates: ({ value, message }) => void
//  * @returns {Promise<Object>} - The final analysis result.
//  */
// export async function analyzeRepoStream(githubUrl, onProgress) {
//   const payload = { github_url: githubUrl };
//   console.log("🌐 [api.js] Starting analysis for:", githubUrl);

//   // Mock initial progress
//   onProgress?.({ value: 10, message: 'Contacting server...' });

//   const response = await fetch(`${BASE_URL}/analyze`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
//     throw new Error(errorData.detail || `Server responded with ${response.status}`);
//   }

//   onProgress?.({ value: 50, message: 'Engine warming up...' });

//   const finalData = await response.json();
  
//   onProgress?.({ value: 100, message: 'Analysis complete!' });
//   return finalData;
// }

// /**
//  * Legacy support for non-streaming analysis.
//  */
// export async function analyzeRepo(githubUrl) {
//   return analyzeRepoStream(githubUrl, () => {});
// }

// /**
//  * Fetches detailed insights and graph data for a specific file.
//  * @param {string} repoId - The unique ID of the analyzed repository.
//  * @param {string} filePath - The path of the file to investigate.
//  * @returns {Promise<Object>} - The file details and AI insights.
//  */
// export async function fetchFileDetails(repoId, filePath) {
//   try {
//     const url = new URL(`${BASE_URL}/file-details/${repoId}`);
//     url.searchParams.append('file_path', filePath);

//     console.log("🌐 [api.js] Calling fetchFileDetails with URL:", url.toString());
    
//     const response = await fetch(url.toString(), {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//     });

//     console.log("📥 [api.js] Response received:", {
//       status: response.status,
//       ok: response.ok,
//       statusText: response.statusText
//     });

//     if (!response.ok) {
//       throw new Error(`Failed to fetch file details: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log("📦 [api.js] Decoded JSON data:", data);
//     return data;
//   } catch (err) {
//     console.error("🔥 [api.js] Caught error in fetchFileDetails:", err);
//     throw err;
//   }
// }
// /**
//  * Streams a global architectural query response from the backend.
//  * @param {string} repoId - The unique ID of the repository.
//  * @param {string} query - The natural language question.
//  * @param {Function} onChunk - Callback triggered for each received text chunk.
//  */
// export async function streamGlobalQuery(repoId, query, onChunk) {
//   console.log(`🌐 [api.js] Starting global query stream for ${repoId}: "${query}"`);

//   const response = await fetch(`${BASE_URL}/ask-global/${repoId}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ query }),
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({ detail: 'Query failed' }));
//     throw new Error(errorData.detail || `Server error: ${response.status}`);
//   }

//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();

//   try {
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;

//       const chunk = decoder.decode(value, { stream: true });
      
//       // FastAPI StreamingResponse yields 'data: <text>\n\n'
//       // We strip the prefix and suffix to get raw text
//       const cleanChunks = chunk
//         .split('\n\n')
//         .filter(line => line.startsWith('data: '))
//         .map(line => line.replace('data: ', ''))
//         .join('');

//       if (cleanChunks) {
//         onChunk(cleanChunks);
//       }
//     }
//   } catch (err) {
//     console.error("❌ [api.js] Stream reading error:", err);
//     throw err;
//   } finally {
//     reader.releaseLock();
//   }
// }


const BASE_URL = 'http://localhost:8000';

export async function analyzeRepoStream(githubUrl, onProgress) {
  const payload = { github_url: githubUrl };
  console.log("🌐 [api.js] Starting analysis for:", githubUrl);
  onProgress?.({ value: 10, message: 'Contacting server...' });

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
    throw new Error(errorData.detail || `Server responded with ${response.status}`);
  }

  onProgress?.({ value: 50, message: 'Engine warming up...' });
  const finalData = await response.json();
  onProgress?.({ value: 100, message: 'Analysis complete!' });
  return finalData;
}

export async function analyzeRepo(githubUrl) {
  return analyzeRepoStream(githubUrl, () => {});
}

export async function fetchFileDetails(repoId, filePath) {
  try {
    const url = new URL(`${BASE_URL}/file-details/${repoId}`);
    url.searchParams.append('file_path', filePath);
    console.log("🌐 [api.js] Calling fetchFileDetails with URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Failed to fetch file details: ${response.status}`);

    const data = await response.json();
    console.log("📦 [api.js] Decoded JSON data:", data);
    return data;
  } catch (err) {
    console.error("🔥 [api.js] Caught error in fetchFileDetails:", err);
    throw err;
  }
}

/**
 * Sends a specific list of file paths (ego-scoped from the clicked node)
 * to Groq and gets back AI-generated onboarding cards.
 * Called every time a node is clicked.
 *
 * @param {string} repoId
 * @param {string[]} filePaths - ordered list from the file-details onboarding_path
 * @returns {Promise<Array>} cards: [{ file, step, desc, why }]
 */
export async function fetchOnboardingPath(repoId, filePaths) {
  try {
    console.log("🗺️ [api.js] Fetching onboarding cards for:", filePaths);

    const response = await fetch(`${BASE_URL}/onboarding-path/${repoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_paths: filePaths }),
    });

    if (!response.ok) throw new Error(`Onboarding path fetch failed: ${response.status}`);

    const data = await response.json();
    console.log("✅ [api.js] Onboarding cards received:", data);
    return data.cards || [];
  } catch (err) {
    console.error("🔥 [api.js] fetchOnboardingPath error:", err);
    return [];
  }
}

export async function streamGlobalQuery(repoId, query, onChunk) {
  console.log(`🌐 [api.js] Starting global query stream for ${repoId}: "${query}"`);

  const response = await fetch(`${BASE_URL}/ask-global/${repoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const cleanChunks = chunk
        .split('\n\n')
        .filter(line => line.startsWith('data: '))
        .map(line => line.replace('data: ', ''))
        .join('');
      if (cleanChunks) onChunk(cleanChunks);
    }
  } catch (err) {
    console.error("❌ [api.js] Stream reading error:", err);
    throw err;
  } finally {
    reader.releaseLock();
  }
}