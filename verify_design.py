import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    # Create the verification directory if it doesn't exist
    if not os.path.exists('verification'):
        os.makedirs('verification')

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Go to the local HTML file
        await page.goto('file://' + os.path.abspath('index.html'))

        # Take a screenshot of the main view
        await page.screenshot(path='verification/screenshot_main.png')

        # Click the "Empieza a crear" button
        await page.click('button#create-btn')

        # Wait for the project view to be visible
        await page.wait_for_selector('#project-view', state='visible')

        # Take a screenshot of the project view
        await page.screenshot(path='verification/screenshot_projects.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
