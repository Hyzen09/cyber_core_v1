import { test, expect } from '@playwright/test';

test('Chat UI layout and mock interaction', async ({ page }) => {
  // 1. Intercept the outbound API call to the Python backend
  await page.route('**/api/chat', async route => {
    // Instantly return a mocked JSON payload to bypass the local LLM
    const json = { answer: "This is a lightning-fast mocked AI response." };
    await route.fulfill({ json });
  });

  // 1b. Bypass Supabase Authentication
  await page.addInitScript(() => {
    window.localStorage.setItem('PLAYWRIGHT_TEST', 'true');
  });

  // 2. Navigate to the chat app
  await page.goto('/chat');

  // 3. Target elements using data-testids
  const chatInput = page.getByTestId('chat-input');
  const sendButton = page.getByTestId('send-button');

  // 4. Perform UI Actions
  await chatInput.fill('Hello, mocked AI!');
  await sendButton.click();

  // 5. Assertions (Should happen instantly)
  const messages = page.getByTestId('message-bubble');
  
  // Wait for the user message and the mocked assistant message to appear
  await expect(messages).toHaveCount(2);
  await expect(messages.nth(1)).toContainText('This is a lightning-fast mocked AI response.');
});
