import { test, expect } from '@playwright/test';

test('End-to-End Local AI Generation', async ({ page }) => {
  // 1. Bypass Supabase Authentication
  await page.addInitScript(() => {
    window.localStorage.setItem('PLAYWRIGHT_TEST', 'true');
  });

  // 2. Navigate to the app (No routing/mocking)
  await page.goto('/chat');

  const chatInput = page.getByTestId('chat-input');
  const sendButton = page.getByTestId('send-button');

  // 2. Trigger the real LLM inference
  await chatInput.fill('Provide a 2 sentence summary of quantum computing.');
  await sendButton.click();

  // 3. Await the specific slow API response
  // We use waitForResponse instead of a sleep/timeout to wait exactly as long as the AI takes
  const response = await page.waitForResponse(
    res => res.url().includes('/api/chat') && res.status() === 200,
    { timeout: 90000 } // Wait up to 90 seconds for local generation
  );
  
  const responseData = await response.json();
  expect(responseData.answer).toBeTruthy();

  // 4. Assert the UI properly rendered the final output
  const lastMessage = page.getByTestId('message-bubble').last();
  await expect(lastMessage).toBeVisible({ timeout: 10000 });
  await expect(lastMessage).not.toContainText('PROCESSING COMPUTATION...');
});
