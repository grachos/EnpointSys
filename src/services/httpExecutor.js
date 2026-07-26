import { interpolateVariables } from './variableService';

/**
 * Executes HTTP requests cleanly with error handling, latency timing, size metrics, and proxy fallback.
 */
export async function executeHttpRequest(requestConfig, activeEnvironment = null) {
  const startTime = performance.now();

  try {
    // 1. Interpolate variables in URL
    let rawUrl = requestConfig.url || '';
    let interpolatedUrl = interpolateVariables(rawUrl, activeEnvironment);

    if (!interpolatedUrl.startsWith('http://') && !interpolatedUrl.startsWith('https://')) {
      interpolatedUrl = 'https://' + interpolatedUrl;
    }

    // 2. Build Query Parameters
    const urlObj = new URL(interpolatedUrl);
    if (Array.isArray(requestConfig.params)) {
      requestConfig.params.forEach(p => {
        if (p.enabled && p.key) {
          const key = interpolateVariables(p.key, activeEnvironment);
          const val = interpolateVariables(p.value || '', activeEnvironment);
          urlObj.searchParams.append(key, val);
        }
      });
    }

    // 3. Build Headers
    const headersMap = new Headers();
    if (Array.isArray(requestConfig.headers)) {
      requestConfig.headers.forEach(h => {
        if (h.enabled && h.key) {
          const key = interpolateVariables(h.key, activeEnvironment);
          const val = interpolateVariables(h.value || '', activeEnvironment);
          headersMap.append(key, val);
        }
      });
    }

    // 4. Handle Auth configuration
    const auth = requestConfig.auth || {};
    if (auth.type === 'bearer' && auth.bearerToken) {
      const token = interpolateVariables(auth.bearerToken, activeEnvironment);
      headersMap.set('Authorization', `Bearer ${token}`);
    } else if (auth.type === 'basic' && (auth.basicUser || auth.basicPass)) {
      const u = interpolateVariables(auth.basicUser || '', activeEnvironment);
      const p = interpolateVariables(auth.basicPass || '', activeEnvironment);
      const token = btoa(`${u}:${p}`);
      headersMap.set('Authorization', `Basic ${token}`);
    } else if (auth.type === 'apiKey' && auth.apiKeyKey && auth.apiKeyValue) {
      const key = interpolateVariables(auth.apiKeyKey, activeEnvironment);
      const val = interpolateVariables(auth.apiKeyValue, activeEnvironment);
      if (auth.apiKeyAddParams === 'query') {
        urlObj.searchParams.append(key, val);
      } else {
        headersMap.set(key, val);
      }
    }

    // 5. Build Request Body
    let bodyPayload = null;
    const method = (requestConfig.method || 'GET').toUpperCase();

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && requestConfig.body) {
      const { mode, rawContent, urlencoded, graphql } = requestConfig.body;

      if (mode === 'raw' && rawContent) {
        bodyPayload = interpolateVariables(rawContent, activeEnvironment);
        if (!headersMap.has('Content-Type')) {
          const rawType = requestConfig.body.rawType || 'json';
          if (rawType === 'json') headersMap.set('Content-Type', 'application/json');
          else if (rawType === 'xml') headersMap.set('Content-Type', 'application/xml');
          else if (rawType === 'html') headersMap.set('Content-Type', 'text/html');
          else headersMap.set('Content-Type', 'text/plain');
        }
      } else if (mode === 'x-www-form-urlencoded' && Array.isArray(urlencoded)) {
        const formDataParams = new URLSearchParams();
        urlencoded.forEach(item => {
          if (item.enabled && item.key) {
            formDataParams.append(
              interpolateVariables(item.key, activeEnvironment),
              interpolateVariables(item.value || '', activeEnvironment)
            );
          }
        });
        bodyPayload = formDataParams.toString();
        headersMap.set('Content-Type', 'application/x-www-form-urlencoded');
      } else if (mode === 'graphql' && graphql) {
        bodyPayload = JSON.stringify({
          query: interpolateVariables(graphql.query || '', activeEnvironment),
          variables: JSON.parse(interpolateVariables(graphql.variables || '{}', activeEnvironment))
        });
        headersMap.set('Content-Type', 'application/json');
      }
    }

    const finalTargetUrl = urlObj.toString();
    const fetchOptions = {
      method,
      headers: headersMap,
      body: bodyPayload,
      redirect: requestConfig.settings?.followRedirects === false ? 'manual' : 'follow'
    };

    // 6. Direct Fetch or CORS Proxy Fallback
    let response;
    let isProxied = false;

    try {
      response = await fetch(finalTargetUrl, fetchOptions);
    } catch (corsError) {
      // If CORS or Network Error occurs, fallback to CORS Proxy if enabled
      if (requestConfig.settings?.useCorsProxy !== false) {
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(finalTargetUrl)}`;
        response = await fetch(corsProxyUrl, fetchOptions);
        isProxied = true;
      } else {
        throw corsError;
      }
    }

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    // Extract Response Headers
    const responseHeaders = [];
    response.headers.forEach((val, key) => {
      responseHeaders.push({ key, value: val });
    });

    // Parse Body
    const rawText = await response.text();
    let parsedData = rawText;
    let contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      try {
        parsedData = JSON.parse(rawText);
      } catch (e) {
        parsedData = rawText;
      }
    }

    // Calculate Size in Bytes
    const sizeInBytes = new Blob([rawText]).size;

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      time: latencyMs,
      size: sizeInBytes,
      data: parsedData,
      rawText: rawText,
      headers: responseHeaders,
      isProxied: isProxied,
      url: finalTargetUrl
    };

  } catch (error) {
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    return {
      success: false,
      status: 0,
      statusText: 'Network / CORS Error',
      time: latencyMs,
      size: 0,
      data: {
        error: error.message || 'Network error occurred. The requested server may have blocked CORS headers or is unreachable.',
        tip: 'Ensure the target API endpoint allows Cross-Origin requests, or keep CORS Proxy enabled in Request Settings.'
      },
      rawText: String(error),
      headers: [],
      isProxied: false,
      url: requestConfig.url
    };
  }
}
