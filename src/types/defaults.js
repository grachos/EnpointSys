export const DEFAULT_ENVIRONMENTS = [
  {
    id: 'env-development',
    name: 'Development',
    variables: [
      { key: 'baseUrl', value: 'https://jsonplaceholder.typicode.com', enabled: true, isSecret: false },
      { key: 'reqresUrl', value: 'https://reqres.in/api', enabled: true, isSecret: false },
      { key: 'geotabHost', value: 'my.geotab.com', enabled: true, isSecret: false },
      { key: 'geotabUser', value: 'ggomez@elogia.com.co', enabled: true, isSecret: false },
      { key: 'geotabDatabase', value: 'construproyect', enabled: true, isSecret: false },
      { key: 'geotabSessionId', value: '', enabled: true, isSecret: true },
      { key: 'authToken', value: 'bearer_token_xyz_98765', enabled: true, isSecret: true },
      { key: 'apiKey', value: 'dev-secret-key-12345', enabled: true, isSecret: true }
    ]
  },
  {
    id: 'env-production',
    name: 'Production',
    variables: [
      { key: 'baseUrl', value: 'https://jsonplaceholder.typicode.com', enabled: true, isSecret: false },
      { key: 'reqresUrl', value: 'https://reqres.in/api', enabled: true, isSecret: false },
      { key: 'geotabHost', value: 'my.geotab.com', enabled: true, isSecret: false },
      { key: 'authToken', value: 'prod_live_token_abc_123', enabled: true, isSecret: true },
      { key: 'apiKey', value: 'prod-live-key-99999', enabled: true, isSecret: true }
    ]
  }
];

export const INITIAL_REQUEST = {
  id: 'req-new',
  name: 'Untitled Request',
  method: 'GET',
  url: '{{baseUrl}}/posts/1',
  params: [
    { id: '1', key: '_limit', value: '5', enabled: true, description: 'Limit number of results' },
    { id: '2', key: 'sort', value: 'asc', enabled: false, description: 'Sorting order' }
  ],
  auth: {
    type: 'none',
    bearerToken: '',
    basicUser: '',
    basicPass: '',
    apiKeyKey: 'X-API-Key',
    apiKeyValue: '{{apiKey}}',
    apiKeyAddParams: 'header'
  },
  headers: [
    { id: '1', key: 'Accept', value: 'application/json', enabled: true },
    { id: '2', key: 'User-Agent', value: 'EndpointSys/1.0', enabled: true }
  ],
  body: {
    mode: 'none',
    rawType: 'json',
    rawContent: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
    formData: [
      { id: '1', key: 'file', value: '', type: 'text', enabled: true }
    ],
    urlencoded: [
      { id: '1', key: 'username', value: 'john_doe', enabled: true }
    ],
    graphql: {
      query: 'query GetPost($id: ID!) {\n  post(id: $id) {\n    id\n    title\n  }\n}',
      variables: '{\n  "id": "1"\n}'
    }
  },
  scripts: {
    preRequest: '// Execute JavaScript before request is sent\n// Example: pm.environment.set("timestamp", Date.now());',
    test: '// Test assertions after response is received\npm.test("Status code is 200", function () {\n  pm.response.to.have.status(200);\n});\n\npm.test("Response time is less than 2000ms", function () {\n  pm.expect(pm.response.responseTime).to.be.below(2000);\n});'
  },
  settings: {
    timeout: 0,
    followRedirects: true,
    useCorsProxy: true
  }
};

export const DEFAULT_COLLECTIONS = [
  {
    id: 'col-jsonplaceholder',
    name: 'JSONPlaceholder API',
    description: 'Sample public REST API for testing and prototyping',
    items: [
      {
        id: 'folder-posts',
        name: 'Posts',
        isFolder: true,
        items: [
          {
            id: 'req-get-post',
            name: 'Get Single Post',
            method: 'GET',
            url: '{{baseUrl}}/posts/1',
            params: [],
            auth: { type: 'none' },
            headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
            body: { mode: 'none', rawType: 'json', rawContent: '' },
            scripts: {
              preRequest: '',
              test: 'pm.test("Status is 200 OK", function() {\n  pm.response.to.have.status(200);\n});\n\npm.test("Post ID is 1", function() {\n  var jsonData = pm.response.json();\n  pm.expect(jsonData.id).to.eql(1);\n});'
            },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          },
          {
            id: 'req-create-post',
            name: 'Create Post',
            method: 'POST',
            url: '{{baseUrl}}/posts',
            params: [],
            auth: { type: 'none' },
            headers: [
              { id: 'h1', key: 'Content-Type', value: 'application/json; charset=UTF-8', enabled: true }
            ],
            body: {
              mode: 'raw',
              rawType: 'json',
              rawContent: '{\n  "title": "Testing EndpointSys",\n  "body": "Creating requests with variables and scripts",\n  "userId": 1\n}'
            },
            scripts: {
              preRequest: '',
              test: 'pm.test("Created status 201", function() {\n  pm.response.to.have.status(201);\n});'
            },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          },
          {
            id: 'req-update-post',
            name: 'Update Post (PUT)',
            method: 'PUT',
            url: '{{baseUrl}}/posts/1',
            params: [],
            auth: { type: 'none' },
            headers: [
              { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
            ],
            body: {
              mode: 'raw',
              rawType: 'json',
              rawContent: '{\n  "id": 1,\n  "title": "Updated Title",\n  "body": "Updated Body Content",\n  "userId": 1\n}'
            },
            scripts: { preRequest: '', test: '' },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          },
          {
            id: 'req-delete-post',
            name: 'Delete Post',
            method: 'DELETE',
            url: '{{baseUrl}}/posts/1',
            params: [],
            auth: { type: 'none' },
            headers: [],
            body: { mode: 'none', rawType: 'json', rawContent: '' },
            scripts: { preRequest: '', test: '' },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          }
        ]
      },
      {
        id: 'folder-users',
        name: 'Users',
        isFolder: true,
        items: [
          {
            id: 'req-get-users',
            name: 'List All Users',
            method: 'GET',
            url: '{{baseUrl}}/users',
            params: [],
            auth: { type: 'none' },
            headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
            body: { mode: 'none', rawType: 'json', rawContent: '' },
            scripts: { preRequest: '', test: '' },
            settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
          }
        ]
      }
    ]
  },
  {
    id: 'col-reqres',
    name: 'ReqRes API',
    description: 'Hosted REST API for testing authentication and user management',
    items: [
      {
        id: 'req-reqres-users',
        name: 'Get Users List (Page 2)',
        method: 'GET',
        url: '{{reqresUrl}}/users',
        params: [
          { id: 'p1', key: 'page', value: '2', enabled: true, description: 'Page number' }
        ],
        auth: { type: 'none' },
        headers: [],
        body: { mode: 'none', rawType: 'json', rawContent: '' },
        scripts: {
          preRequest: '',
          test: 'pm.test("Status code is 200", function() {\n  pm.response.to.have.status(200);\n});\npm.test("Contains user data array", function() {\n  var json = pm.response.json();\n  pm.expect(json.data.length).to.be.above(0);\n});'
        },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      },
      {
        id: 'req-reqres-login',
        name: 'User Login (Post)',
        method: 'POST',
        url: '{{reqresUrl}}/login',
        params: [],
        auth: { type: 'none' },
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
        ],
        body: {
          mode: 'raw',
          rawType: 'json',
          rawContent: '{\n  "email": "eve.holt@reqres.in",\n  "password": "cityslicka"\n}'
        },
        scripts: {
          preRequest: '',
          test: 'pm.test("Successful Login", function() {\n  pm.response.to.have.status(200);\n  var json = pm.response.json();\n  pm.expect(json.token).to.exist;\n});'
        },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      }
    ]
  },
  {
    id: 'col-geotab',
    name: 'Geotab API',
    description: 'Geotab Fleet Management JSON-RPC 2.0 API',
    items: [
      {
        id: 'req-geotab-auth',
        name: 'Auth',
        method: 'POST',
        url: 'https://{{geotabHost}}/apiv1',
        params: [],
        auth: { type: 'none' },
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
        ],
        body: {
          mode: 'raw',
          rawType: 'json',
          rawContent: '{\n  "method": "Authenticate",\n  "params": {\n    "database": "{{geotabDatabase}}",\n    "userName": "{{geotabUser}}",\n    "password": "{{geotabPassword}}"\n  }\n}'
        },
        scripts: { 
          preRequest: '', 
          test: 'const result = pm.response.json().result;\nif (result) {\n  pm.environment.set("geotabHost", result.path === "ThisServer" ? "my.geotab.com" : result.path);\n  if (result.credentials) {\n    pm.environment.set("geotabDatabase", result.credentials.database);\n    pm.environment.set("geotabUser", result.credentials.userName);\n    pm.environment.set("geotabSessionId", result.credentials.sessionId);\n  }\n}' 
        },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      },
      {
        id: 'req-geotab-vehicles',
        name: 'List vehicles',
        method: 'POST',
        url: 'https://{{geotabHost}}/apiv1',
        params: [],
        auth: { type: 'none' },
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }
        ],
        body: {
          mode: 'raw',
          rawType: 'json',
          rawContent: '{\n  "method": "Get",\n  "params": {\n    "typeName": "Device",\n    "resultsLimit": 10,\n    "credentials": {\n      "database": "{{geotabDatabase}}",\n      "userName": "{{geotabUser}}",\n      "sessionId": "{{geotabSessionId}}"\n    }\n  }\n}'
        },
        scripts: { preRequest: '', test: '' },
        settings: { timeout: 0, followRedirects: true, useCorsProxy: true }
      }
    ]
  }
];
