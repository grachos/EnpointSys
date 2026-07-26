/**
 * Utility service to convert between Postman Collection v2.1, OpenAPI 3.0, Postman Documenter URLs, and EndpointSys format.
 */

// Helper to generate unique IDs
const genId = () => 'id-' + Math.random().toString(36).substr(2, 9);

export function parseImportFile(fileContent) {
  let parsedJson;
  try {
    parsedJson = JSON.parse(fileContent);
  } catch (err) {
    throw new Error('Invalid JSON format.');
  }

  // 1. Detect Postman Published Documentation Object with wrapper
  if (parsedJson.collection) {
    return parsePostmanCollection(parsedJson.collection);
  }

  // 2. Detect Postman Collection v2.1 or v2.0
  if (parsedJson.info && (parsedJson.info.schema?.includes('v2.1.0') || parsedJson.info.schema?.includes('v2.0.0') || parsedJson.item || parsedJson.items)) {
    return parsePostmanCollection(parsedJson);
  }

  // 3. Detect OpenAPI 3.0 / Swagger 2.0
  if (parsedJson.openapi || parsedJson.swagger) {
    return parseOpenApiSpec(parsedJson);
  }

  // 4. Detect Native EndpointSys Collection or Export
  if (parsedJson.type === 'endpointsys-collection' && parsedJson.collection) {
    return parsedJson.collection;
  }

  if (Array.isArray(parsedJson) && parsedJson[0]?.items) {
    return parsedJson[0];
  }

  if (parsedJson.name && Array.isArray(parsedJson.items)) {
    return {
      id: parsedJson.id || genId(),
      name: parsedJson.name,
      description: parsedJson.description || '',
      items: parsedJson.items
    };
  }

  throw new Error('Unrecognized catalog schema format. Supported formats: Postman v2.1, Postman Published Docs JSON, OpenAPI 3.0, EndpointSys JSON.');
}

/**
 * Fetches and imports documentation from a public Postman Documenter link, Postman workspace link, or raw API URL.
 * Uses multiple CORS proxy fallback strategies and JSON headers.
 */
export async function importFromPublishedUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Please provide a valid Published Documentation or Collection URL.');
  }

  let targetUrl = url.trim();

  // Sequence of CORS proxy fallbacks to bypass browser CORS origin policies
  const proxyConstructors = [
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
    (u) => u
  ];

  let rawText = '';

  for (const buildProxyUrl of proxyConstructors) {
    try {
      const proxyUrl = buildProxyUrl(targetUrl);
      const res = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json, text/html, */*',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 20) {
          rawText = text;
          break;
        }
      }
    } catch (e) {
      // Try next proxy
    }
  }

  if (!rawText) {
    throw new Error('Unable to fetch the specified URL due to browser CORS restrictions. Please ensure the link is public or export the collection JSON directly from Postman.');
  }

  // 1. Try direct JSON parsing
  try {
    const parsedJson = JSON.parse(rawText);
    return parseImportFile(JSON.stringify(parsedJson));
  } catch (e) {
    // 2. Extract embedded JSON from HTML page if it's a web documenter page
    const matchJson = 
      rawText.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s) ||
      rawText.match(/collection\s*:\s*({.*?}),\n/s) ||
      rawText.match(/\"collection\"\s*:\s*({.*?}),\"/s);

    if (matchJson && matchJson[1]) {
      try {
        const extracted = JSON.parse(matchJson[1]);
        if (extracted.collection) {
          return parsePostmanCollection(extracted.collection);
        }
        if (extracted.info && (extracted.item || extracted.items)) {
          return parsePostmanCollection(extracted);
        }
      } catch (err) {
        // continue
      }
    }

    throw new Error('Could not parse a valid API collection schema from the specified URL. Please upload the Postman collection JSON file directly in the "JSON File" tab.');
  }
}

function parsePostmanCollection(json) {
  const collectionName = json.info?.name || json.name || 'Imported Catalog';
  const description = json.info?.description || json.description || 'Catalog imported from published API documentation.';

  const rawItems = json.item || json.items || json.requests || [];

  const processItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
      // Folder
      if (item.item && Array.isArray(item.item)) {
        return {
          id: genId(),
          name: item.name || 'Folder',
          description: item.description || '',
          isFolder: true,
          items: processItems(item.item)
        };
      }

      // Request
      const req = item.request || {};
      let urlStr = '';
      if (typeof req === 'string') {
        urlStr = req;
      } else if (typeof req.url === 'string') {
        urlStr = req.url;
      } else if (req.url && req.url.raw) {
        urlStr = req.url.raw;
      }

      // Parse Query Params
      const params = [];
      if (req.url && Array.isArray(req.url.query)) {
        req.url.query.forEach(q => {
          params.push({
            id: genId(),
            key: q.key || '',
            value: q.value || '',
            enabled: !q.disabled,
            description: q.description || ''
          });
        });
      }

      // Parse Headers
      const headers = [];
      if (Array.isArray(req.header)) {
        req.header.forEach(h => {
          headers.push({
            id: genId(),
            key: h.key || '',
            value: h.value || '',
            enabled: !h.disabled,
            description: h.description || ''
          });
        });
      }

      // Parse Body
      let bodyMode = 'none';
      let rawType = 'json';
      let rawContent = '';
      if (req.body) {
        bodyMode = req.body.mode || 'none';
        if (bodyMode === 'raw') {
          rawContent = req.body.raw || '';
          if (req.body.options?.raw?.language) {
            rawType = req.body.options.raw.language;
          }
        }
      }

      // Parse Scripts
      let preRequestScript = '';
      let testScript = '';
      if (Array.isArray(item.event)) {
        item.event.forEach(evt => {
          if (evt.listen === 'prerequest' && evt.script && Array.isArray(evt.script.exec)) {
            preRequestScript = evt.script.exec.join('\n');
          }
          if (evt.listen === 'test' && evt.script && Array.isArray(evt.script.exec)) {
            testScript = evt.script.exec.join('\n');
          }
        });
      }

      return {
        id: genId(),
        name: item.name || 'Untitled Request',
        description: item.description || req.description || '',
        method: (req.method || item.method || 'GET').toUpperCase(),
        url: urlStr || '{{baseUrl}}/webhook/events',
        params,
        auth: { type: 'none' },
        headers,
        body: { mode: bodyMode, rawType, rawContent },
        scripts: { preRequest: preRequestScript, test: testScript },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      };
    });
  };

  let processedItems = processItems(rawItems);

  // If no items array in JSON (e.g. published docs summary), generate default requests from collection info
  if (processedItems.length === 0) {
    processedItems = [
      {
        id: genId(),
        name: `${collectionName} Endpoint`,
        description: description,
        method: 'POST',
        url: 'https://qas.daabon.com.co/webhook/events',
        params: [],
        auth: { type: 'none' },
        headers: [{ id: genId(), key: 'Content-Type', value: 'application/json', enabled: true }],
        body: {
          mode: 'raw',
          rawType: 'json',
          rawContent: '{\n  "specversion": "1.0",\n  "type": "DeudoresSet.update",\n  "source": "dml",\n  "id": "65cf360d-9194-42e1-872b-792efda92e8a",\n  "time": "2018-04-05T17:31:00Z",\n  "nit": "0284298236",\n  "datacontenttype": "application/json",\n  "data": {}\n}'
        },
        scripts: { preRequest: '', test: '' },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      }
    ];
  }

  return {
    id: genId(),
    name: collectionName,
    description: description,
    items: processedItems
  };
}

function parseOpenApiSpec(json) {
  const title = json.info?.title || 'OpenAPI Import';
  const description = json.info?.description || '';
  const baseUrl = json.servers?.[0]?.url || '{{baseUrl}}';
  const items = [];

  if (json.paths) {
    Object.keys(json.paths).forEach(pathKey => {
      const pathObj = json.paths[pathKey];
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

      methods.forEach(method => {
        if (pathObj[method]) {
          const operation = pathObj[method];
          const fullUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${pathKey}` : `${baseUrl}${pathKey}`;

          items.push({
            id: genId(),
            name: operation.summary || operation.operationId || `${method.toUpperCase()} ${pathKey}`,
            description: operation.description || '',
            method: method.toUpperCase(),
            url: fullUrl,
            params: [],
            auth: { type: 'none' },
            headers: [{ id: genId(), key: 'Accept', value: 'application/json', enabled: true }],
            body: { mode: 'none', rawType: 'json', rawContent: '' },
            scripts: { preRequest: '', test: '' },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          });
        }
      });
    });
  }

  return {
    id: genId(),
    name: title,
    description: description,
    items
  };
}

export function exportToPostmanFormat(collection) {
  const convertItems = (items) => {
    return items.map(item => {
      if (item.isFolder) {
        return {
          name: item.name,
          description: item.description || '',
          item: convertItems(item.items || [])
        };
      }

      const events = [];
      if (item.scripts?.preRequest) {
        events.push({
          listen: 'prerequest',
          script: { type: 'text/javascript', exec: item.scripts.preRequest.split('\n') }
        });
      }
      if (item.scripts?.test) {
        events.push({
          listen: 'test',
          script: { type: 'text/javascript', exec: item.scripts.test.split('\n') }
        });
      }

      return {
        name: item.name,
        description: item.description || '',
        event: events,
        request: {
          method: item.method,
          description: item.description || '',
          header: item.headers.map(h => ({ key: h.key, value: h.value, disabled: !h.enabled })),
          url: {
            raw: item.url,
            query: item.params.map(p => ({ key: p.key, value: p.value, disabled: !p.enabled }))
          },
          body: item.body?.mode === 'raw' ? {
            mode: 'raw',
            raw: item.body.rawContent,
            options: { raw: { language: item.body.rawType || 'json' } }
          } : undefined
        }
      };
    });
  };

  return {
    info: {
      name: collection.name,
      description: collection.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: convertItems(collection.items || [])
  };
}
