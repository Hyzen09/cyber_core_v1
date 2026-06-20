import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Override global timeout for API tests
test.setTimeout(180000);

const baseURL = 'http://localhost:8000';

test.describe('Backend API Concurrency & Edge Cases', () => {

  test('Layer 1: Functional & Contract Testing', async ({ request }) => {
    // Test POST /api/chat
    const payload = {
      user_id: 'test-user-1',
      session_id: 'test-session-1',
      message: 'State 1 interesting fact about networking.'
    };

    const response = await request.post(`${baseURL}/api/chat`, {
      data: payload,
      timeout: 120000
    });

    // Contract validation
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('answer');
    expect(typeof body.answer).toBe('string');
    expect(body.answer.length).toBeGreaterThan(0);
  });

  test('Layer 2: Edge Case & Negative Testing (422 Unprocessable Entity)', async ({ request }) => {
    // Sending empty payload to trigger Pydantic validation failure
    const response = await request.post(`${baseURL}/api/chat`, {
      data: {}
    });

    expect(response.ok()).toBeFalsy();
    // FastAPI automatically returns 422 for missing required Pydantic fields
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body).toHaveProperty('detail');
  });

  test('Layer 2: Security & Edge Case (SQLi Simulation)', async ({ request }) => {
    const payload = {
      user_id: 'test-user',
      session_id: "DROP TABLE users; --",
      message: "' OR 1=1; --"
    };

    const response = await request.post(`${baseURL}/api/chat`, {
      data: payload,
      timeout: 60000
    });

    // Should return 200 without database corruption (since it's a vector DB / Qdrant handling it)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('answer');
  });

  test('Layer 3: Stateful Operations (Upload Invalid Type -> Catch 500)', async ({ request }) => {
    // The current backend uses pdfplumber. Uploading a random text file should fail.
    const response = await request.post(`${baseURL}/api/upload-pdf`, {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('This is not a PDF.')
        },
        user_id: 'test-user',
        session_id: 'test-session'
      }
    });

    // We anticipate a 500 because the python backend has no explicit 400 validation for mime type
    expect(response.status()).toBe(500);
  });

  test('Layer 4: Performance & Resilience Basics (Concurrent Connections)', async ({ request }) => {
    const payload = {
      user_id: 'load-test',
      session_id: 'load-session',
      message: 'Hello'
    };

    // Fire 3 simultaneous API requests to test localized load (Ollama)
    const requests = Array.from({ length: 3 }).map(() =>
      request.post(`${baseURL}/api/chat`, { data: payload, timeout: 120000 })
    );

    const responses = await Promise.all(requests);

    for (const res of responses) {
      // The backend should either return 200 OK or 429 Rate Limit (or 500 if Ollama queues fail)
      // We are testing to see exactly how it behaves under load!
      const status = res.status();
      expect([200, 429, 500]).toContain(status);
    }
  });

});
