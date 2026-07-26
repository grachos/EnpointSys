/**
 * Executes Postman-style JavaScript test scripts safely in browser env.
 */
export function executeTestScript(scriptCode, responseData, activeEnvironment, setEnvironmentVar) {
  const testResults = [];
  const logs = [];

  if (!scriptCode || scriptCode.trim() === '') {
    return { testResults, logs };
  }

  // Safe console logger
  const customConsole = {
    log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
  };

  // Build pm object mockup
  const pm = {
    test: (testName, testFn) => {
      try {
        testFn();
        testResults.push({ name: testName, passed: true, error: null });
      } catch (err) {
        testResults.push({ name: testName, passed: false, error: err.message || String(err) });
      }
    },
    expect: (val) => {
      return {
        to: {
          be: {
            below: (expected) => {
              if (val >= expected) throw new Error(`Expected ${val} to be below ${expected}`);
            },
            above: (expected) => {
              if (val <= expected) throw new Error(`Expected ${val} to be above ${expected}`);
            },
            ok: (() => {
              if (!val) throw new Error(`Expected ${val} to be truthy`);
            })()
          },
          have: {
            status: (expectedStatus) => {
              if (responseData.status !== expectedStatus) {
                throw new Error(`Expected status ${expectedStatus} but got ${responseData.status}`);
              }
            }
          },
          eql: (expected) => {
            if (JSON.stringify(val) !== JSON.stringify(expected)) {
              throw new Error(`Expected ${JSON.stringify(val)} to equal ${JSON.stringify(expected)}`);
            }
          },
          exist: (() => {
            if (val === undefined || val === null) {
              throw new Error(`Expected value to exist`);
            }
          })()
        }
      };
    },
    response: {
      status: responseData.status,
      responseTime: responseData.time,
      json: () => {
        try {
          return typeof responseData.data === 'string' ? JSON.parse(responseData.data) : responseData.data;
        } catch (e) {
          throw new Error('Failed to parse response body as JSON');
        }
      },
      text: () => typeof responseData.data === 'string' ? responseData.data : JSON.stringify(responseData.data),
      to: {
        have: {
          status: (expectedStatus) => {
            if (responseData.status !== expectedStatus) {
              throw new Error(`Expected status ${expectedStatus} but got ${responseData.status}`);
            }
          }
        }
      }
    },
    environment: {
      get: (key) => {
        if (!activeEnvironment) return null;
        const v = activeEnvironment.variables.find(item => item.key === key && item.enabled);
        return v ? v.value : null;
      },
      set: (key, value) => {
        if (setEnvironmentVar) {
          setEnvironmentVar(key, String(value));
        }
      }
    }
  };

  try {
    // Run evaluation function with context
    const runner = new Function('pm', 'console', scriptCode);
    runner(pm, customConsole);
  } catch (err) {
    logs.push(`Script execution error: ${err.message}`);
  }

  return { testResults, logs };
}
