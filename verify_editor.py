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

        # --- Test File Browser Functionality ---

        # 1. Expand "Assets" to begin
        await page.click('//span[text()="Assets"]')
        await page.wait_for_timeout(200)

        # 2. Create a new folder inside "Assets"
        page.once('dialog', lambda dialog: dialog.accept('Test Folder'))
        await page.click('//span[text()="Assets"]', button='right')
        await page.click('#create-folder')
        await page.wait_for_timeout(500) # Wait for re-render

        # 3. Re-expand "Assets" to find the new folder
        await page.click('//span[text()="Assets"]')
        await page.wait_for_timeout(200)

        # 4. Create a script inside "Test Folder"
        page.once('dialog', lambda dialog: dialog.accept('InnerScript.acs'))
        await page.click('//span[text()="Test Folder"]', button='right')
        await page.click('#create-script')
        await page.wait_for_timeout(500) # Wait for re-render

        # 5. Expand the tree to the final state for the screenshot
        await page.click('//span[text()="Assets"]')
        await page.wait_for_timeout(200)
        await page.click('//span[text()="Test Folder"]')
        await page.wait_for_timeout(200)

        # 6. Capture a screenshot of the final state
        screenshot_path = 'verification/file_browser_expanded.png'
        await page.screenshot(path=screenshot_path, full_page=True)

        print(f"Captured screenshot of the expanded file browser at '{screenshot_path}'")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
