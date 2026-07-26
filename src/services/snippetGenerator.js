/**
 * Generates executable code snippets in target languages for any request configuration.
 */

export function generateCodeSnippet(request, language = 'curl') {
  if (!request) return '';

  const { method, url, headers, params, body, auth } = request;

  // Build full URL with query parameters
  let fullUrl = url || 'https://api.example.com/endpoint';
  const activeParams = (params || []).filter(p => p.enabled && p.key);
  if (activeParams.length > 0) {
    const queryString = activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
  }

  // Build active headers list
  const activeHeaders = (headers || []).filter(h => h.enabled && h.key).map(h => ({ key: h.key, value: h.value }));

  // Handle Auth additions
  if (auth?.type === 'bearer' && auth.bearerToken) {
    activeHeaders.push({ key: 'Authorization', value: `Bearer ${auth.bearerToken}` });
  } else if (auth?.type === 'basic' && (auth.basicUser || auth.basicPass)) {
    const encoded = btoa(`${auth.basicUser || ''}:${auth.basicPass || ''}`);
    activeHeaders.push({ key: 'Authorization', value: `Basic ${encoded}` });
  } else if (auth?.type === 'apiKey' && auth.apiKeyKey && auth.apiKeyValue) {
    if (auth.apiKeyAddParams === 'header') {
      activeHeaders.push({ key: auth.apiKeyKey, value: auth.apiKeyValue });
    }
  }

  // Body content
  let bodyContent = '';
  if (body?.mode === 'raw') {
    bodyContent = body.rawContent || '';
  } else if (body?.mode === 'x-www-form-urlencoded') {
    const activeForm = (body.urlencoded || []).filter(f => f.enabled && f.key);
    bodyContent = activeForm.map(f => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`).join('&');
  }

  switch (language) {
    case 'curl': {
      let snippet = `curl --location --request ${method} '${fullUrl}' \\\n`;
      activeHeaders.forEach(h => {
        snippet += `--header '${h.key}: ${h.value}' \\\n`;
      });
      if (bodyContent) {
        snippet += `--data-raw '${bodyContent.replace(/'/g, "'\\''")}'`;
      } else {
        snippet = snippet.slice(0, -3); // trim trailing space and slash
      }
      return snippet;
    }

    case 'fetch': {
      const headerObj = {};
      activeHeaders.forEach(h => { headerObj[h.key] = h.value; });

      let snippet = `fetch("${fullUrl}", {\n`;
      snippet += `  method: "${method}",\n`;
      snippet += `  headers: ${JSON.stringify(headerObj, null, 4)},\n`;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && bodyContent) {
        snippet += `  body: JSON.stringify(${bodyContent.startsWith('{') ? bodyContent : JSON.stringify(bodyContent)})\n`;
      }
      snippet += `})\n.then(response => response.json())\n.then(result => console.log(result))\n.catch(error => console.error('Error:', error));`;
      return snippet;
    }

    case 'python': {
      let snippet = `import requests\n\n`;
      snippet += `url = "${fullUrl}"\n\n`;

      const headerObj = {};
      activeHeaders.forEach(h => { headerObj[h.key] = h.value; });
      snippet += `headers = ${JSON.stringify(headerObj, null, 4)}\n\n`;

      if (bodyContent) {
        snippet += `payload = ${bodyContent.startsWith('{') ? bodyContent : `"${bodyContent}"`}\n\n`;
        snippet += `response = requests.request("${method}", url, headers=headers, data=payload)\n\n`;
      } else {
        snippet += `response = requests.request("${method}", url, headers=headers)\n\n`;
      }
      snippet += `print(response.status_code)\nprint(response.text)`;
      return snippet;
    }

    case 'axios': {
      let snippet = `const axios = require('axios');\n\n`;
      const headerObj = {};
      activeHeaders.forEach(h => { headerObj[h.key] = h.value; });

      snippet += `let config = {\n`;
      snippet += `  method: '${method.toLowerCase()}',\n`;
      snippet += `  url: '${fullUrl}',\n`;
      snippet += `  headers: ${JSON.stringify(headerObj, null, 4)}`;
      if (bodyContent) {
        snippet += `,\n  data: ${bodyContent.startsWith('{') ? bodyContent : JSON.stringify(bodyContent)}\n`;
      } else {
        snippet += `\n`;
      }
      snippet += `};\n\naxios.request(config)\n.then((response) => {\n  console.log(JSON.stringify(response.data));\n})\n.catch((error) => {\n  console.log(error);\n});`;
      return snippet;
    }

    case 'go': {
      let snippet = `package main\n\nimport (\n  "fmt"\n  "net/http"\n  "io/ioutil"\n`;
      if (bodyContent) snippet += `  "strings"\n`;
      snippet += `)\n\nfunc main() {\n`;
      snippet += `  url := "${fullUrl}"\n`;

      if (bodyContent) {
        snippet += `  payload := strings.NewReader(\`${bodyContent}\`)\n`;
        snippet += `  req, _ := http.NewRequest("${method}", url, payload)\n`;
      } else {
        snippet += `  req, _ := http.NewRequest("${method}", url, nil)\n`;
      }

      activeHeaders.forEach(h => {
        snippet += `  req.Header.Add("${h.key}", "${h.value}")\n`;
      });
      snippet += `\n  res, _ := http.DefaultClient.Do(req)\n  defer res.Body.Close()\n  body, _ := ioutil.ReadAll(res.Body)\n`;
      snippet += `  fmt.Println(res.StatusCode)\n  fmt.Println(string(body))\n}`;
      return snippet;
    }

    default:
      return '';
  }
}
