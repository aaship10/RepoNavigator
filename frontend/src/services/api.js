const BASE_URL = 'http://localhost:8000';

/**
 * Analyzes a GitHub repository using the backend API.
 * @param {string} githubUrl - The URL of the repository to analyze.
 * @param {number} timeoutMs - Timeout in milliseconds (default 60s).
 * @returns {Promise<Object>} - The analysis result.
 */
export async function analyzeRepo(githubUrl, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = { github_url: githubUrl };
    console.log("🌐 [api.js] Sending POST request to /analyze:", payload);

    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
      console.error("❌ [api.js] Server responded with error:", errorData);
      throw new Error(errorData.detail || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("📥 [api.js] Raw JSON response received:", data);
    
    // Validate that we found files
    if (!data.file_tree || data.file_tree.length === 0) {
      console.warn("⚠️ [api.js] API succeeded but file_tree is empty.");
      throw new Error('Repository is empty or unreadable.');
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("🔥 [api.js] Caught error in analyzeRepo:", err);
    if (err.name === 'AbortError') {
      throw new Error('Analysis timed out. The repository might be too large or the server is busy.');
    }
    throw err;
  }
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
