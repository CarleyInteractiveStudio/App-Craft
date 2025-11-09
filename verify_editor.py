import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    # Ensure the verification directory exists
    if not os.path.exists('verification'):
        os.makedirs('verification')

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Wait for the page to be fully loaded
        await page.wait_for_load_state('networkidle')

        # Capture a screenshot of the editor layout
        screenshot_path = 'verification/editor_layout.png'
        await page.screenshot(path=screenshot_path, full_page=True)

        print(f"Captured screenshot of the editor layout at '{screenshot_path}'")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
