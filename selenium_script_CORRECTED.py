"""
🔧 CORRECTED SELENIUM WEB SCRAPER - PRODUCTION READY
=====================================================
Fixed version with all critical issues resolved
- No multiprocessing Pool (was causing pickling errors)
- Proper webdriver management with webdriver-manager
- Better error handling and retry logic
- Proper resource cleanup
- Comprehensive logging
"""

import logging
import time
import sys
from dataclasses import dataclass, field
from typing import Optional, List, Dict
from urllib.parse import urlparse

# ─────────────────────────────────────────────────────────────────────────
# Dependency Check
# ─────────────────────────────────────────────────────────────────────────

def check_dependencies():
    """Verify all required packages are installed"""
    required = {
        'selenium': 'selenium>=4.10.0',
        'webdriver_manager': 'webdriver-manager>=4.0.0'
    }

    missing = []
    for package_name, pip_name in required.items():
        try:
            __import__(package_name)
        except ImportError:
            missing.append(pip_name)

    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        sys.exit(1)

check_dependencies()

# Now safe to import
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    StaleElementReferenceException
)
from webdriver_manager.chrome import ChromeDriverManager

# ─────────────────────────────────────────────────────────────────────────
# Logging Setup
# ─────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scraper.log')
    ]
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────
# Result Class
# ─────────────────────────────────────────────────────────────────────────

@dataclass
class Result:
    """Standardized result object for each operation"""
    success: bool
    button_index: int
    url: Optional[str] = None
    error: Optional[str] = None
    elapsed_time: float = 0.0
    logs: List[str] = field(default_factory=list)

    def add_log(self, message: str):
        """Add log message to result"""
        self.logs.append(message)
        logger.info(message)

    def __str__(self):
        if self.success:
            return f"✅ Button #{self.button_index + 1}: {self.url} ({self.elapsed_time:.2f}s)"
        else:
            return f"❌ Button #{self.button_index + 1}: {self.error} ({self.elapsed_time:.2f}s)"


# ─────────────────────────────────────────────────────────────────────────
# Chrome Configuration
# ─────────────────────────────────────────────────────────────────────────

def get_chrome_options() -> Options:
    """Configure Chrome options for headless operation"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    return options


# ─────────────────────────────────────────────────────────────────────────
# Browser Management (Context Manager)
# ─────────────────────────────────────────────────────────────────────────

class SafeDriver:
    """Context manager for safe Selenium WebDriver usage"""

    def __init__(self, options: Options = None):
        self.options = options or get_chrome_options()
        self.driver = None

    def __enter__(self):
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=self.options)
            logger.info("✓ Chrome driver initialized")
            return self.driver
        except Exception as e:
            logger.error(f"✗ Failed to initialize driver: {e}")
            raise

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.driver:
            try:
                self.driver.quit()
                logger.info("✓ Chrome driver closed")
            except Exception as e:
                logger.error(f"⚠ Error closing driver: {e}")


# ─────────────────────────────────────────────────────────────────────────
# Element Finding (Robust)
# ─────────────────────────────────────────────────────────────────────────

def find_element_safe(
    driver,
    text: str,
    element_types: List[str] = None,
    timeout: int = 10
):
    """
    Find element by text with multiple fallback strategies

    Args:
        driver: Selenium WebDriver
        text: Text to search for
        element_types: List of tag names ('a', 'button', etc)
        timeout: Timeout in seconds

    Returns:
        WebElement or None
    """
    if element_types is None:
        element_types = ['a', 'button', '[role="button"]']

    # Build selectors with different strategies
    strategies = [
        # Strategy 1: Exact text match with normalize-space
        f"//{' | //'.join([f'{t}[normalize-space()=\"{text}\"]' for t in element_types])}",

        # Strategy 2: Partial text match
        f"//{' | //'.join([f'{t}[contains(text(), \"{text}\")]' for t in element_types])}",

        # Strategy 3: Case-insensitive
        f"//*[self::{' or self::'.join(element_types)}][contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{text.lower()}')]",

        # Strategy 4: Loose match
        f"//*//*[contains(., '{text}')]"
    ]

    for idx, strategy in enumerate(strategies):
        try:
            logger.debug(f"Trying strategy {idx + 1}: {strategy}")
            element = WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.XPATH, strategy))
            )
            logger.info(f"✓ Found element using strategy {idx + 1}")
            return element
        except TimeoutException:
            continue
        except Exception as e:
            logger.debug(f"Strategy {idx + 1} failed: {e}")
            continue

    logger.warning(f"⚠ Could not find element with text: {text}")
    return None


def click_with_retry(driver, element, max_retries: int = 3) -> bool:
    """
    Click element with retry logic for stale elements

    Args:
        driver: Selenium WebDriver
        element: WebElement to click
        max_retries: Maximum retry attempts

    Returns:
        True if click succeeded, False otherwise
    """
    for attempt in range(max_retries):
        try:
            # Use JavaScript click (more reliable)
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
            time.sleep(0.5)
            driver.execute_script("arguments[0].click();", element)
            logger.info(f"✓ Clicked element on attempt {attempt + 1}")
            return True

        except StaleElementReferenceException:
            logger.warning(f"⚠ Stale element (attempt {attempt + 1}), retrying...")
            time.sleep(1)
            continue

        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"⚠ Click failed: {e}, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                logger.error(f"✗ Click failed after {max_retries} attempts: {e}")
                return False

    return False


# ─────────────────────────────────────────────────────────────────────────
# Window Management
# ─────────────────────────────────────────────────────────────────────────

def switch_to_new_window(driver, original_handles: set, timeout: int = 10) -> bool:
    """
    Switch to newly opened window with timeout

    Args:
        driver: Selenium WebDriver
        original_handles: Set of original window handles
        timeout: Timeout in seconds

    Returns:
        True if switched, False if no new window
    """
    logger.info(f"Waiting for new window (timeout: {timeout}s)...")
    start = time.time()

    while time.time() - start < timeout:
        new_handles = set(driver.window_handles) - original_handles

        if new_handles:
            new_handle = list(new_handles)[0]
            driver.switch_to.window(new_handle)
            logger.info(f"✓ Switched to new window")
            return True

        time.sleep(0.5)

    logger.warning(f"⚠ No new window opened after {timeout}s")
    return False


# ─────────────────────────────────────────────────────────────────────────
# Link Extraction
# ─────────────────────────────────────────────────────────────────────────

def extract_pepe_domain(driver) -> Optional[str]:
    """
    Dynamically extract the domain hosting pepe links

    Args:
        driver: Selenium WebDriver

    Returns:
        Domain URL (e.g., 'https://domain.com') or None
    """
    try:
        links = driver.find_elements(By.TAG_NAME, 'a')
        pepe_domains = set()

        for link in links:
            href = link.get_attribute('href')
            if href and '?go=pepe-' in href:
                parsed = urlparse(href)
                domain = f"{parsed.scheme}://{parsed.netloc}"
                pepe_domains.add(domain)

        if pepe_domains:
            domain = list(pepe_domains)[0]
            logger.info(f"✓ Found pepe domain: {domain}")
            return domain
        else:
            logger.warning("⚠ No pepe domain found")
            return None

    except Exception as e:
        logger.error(f"✗ Error extracting domain: {e}")
        return None


def find_final_link(driver, timeout: int = 10) -> Optional[str]:
    """
    Find and resolve final download link

    Args:
        driver: Selenium WebDriver
        timeout: Timeout in seconds

    Returns:
        Final resolved URL or None
    """
    logger.info("Searching for final download link...")
    time.sleep(2)

    # Try to find pepe link
    pepe_domain = extract_pepe_domain(driver)

    if pepe_domain:
        target_pattern = f"{pepe_domain}/?go=pepe-"
        logger.info(f"Looking for links matching: {target_pattern}...")

        try:
            links = WebDriverWait(driver, timeout).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, 'a'))
            )

            for link_element in links:
                href = link_element.get_attribute('href')
                if href and href.startswith(target_pattern):
                    logger.info(f"✓ Found pepe link: {href[:80]}...")
                    driver.get(href)
                    time.sleep(2)
                    final_url = driver.current_url
                    logger.info(f"✓ Final URL: {final_url}")
                    return final_url

        except TimeoutException:
            logger.warning("⚠ Timeout waiting for links")

    # Fallback: try any redirect link
    logger.info("Trying fallback redirect links...")
    try:
        links = driver.find_elements(By.TAG_NAME, 'a')
        for link_element in links:
            href = link_element.get_attribute('href')
            if href and ('?' in href or href.startswith('http')):
                try:
                    logger.debug(f"Trying fallback link: {href[:80]}...")
                    driver.get(href)
                    time.sleep(1)
                    final_url = driver.current_url
                    logger.info(f"✓ Fallback URL: {final_url}")
                    return final_url
                except Exception as e:
                    logger.debug(f"Fallback failed: {e}")
                    continue
    except Exception as e:
        logger.error(f"✗ Error finding fallback: {e}")

    return None


# ─────────────────────────────────────────────────────────────────────────
# Page Scanning
# ─────────────────────────────────────────────────────────────────────────

def scan_page_for_buttons(url: str, timeout: int = 15) -> List[Dict]:
    """
    Scan page and return available buttons

    Args:
        url: URL to scan
        timeout: Page load timeout in seconds

    Returns:
        List of button information dictionaries
    """
    logger.info(f"🔍 Scanning page: {url}")

    with SafeDriver() as driver:
        try:
            driver.get(url)

            # Wait for page to load
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            time.sleep(2)

            # Find buttons
            button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
            raw_buttons = []

            for text in button_texts:
                elements = find_element_safe(driver, text, timeout=5)
                if elements:
                    # If single element returned, convert to list
                    if not isinstance(elements, list):
                        raw_buttons.append(elements)
                    else:
                        raw_buttons.extend(elements)

            # Remove duplicates and sort
            unique_buttons = list(set(raw_buttons))
            unique_buttons.sort(key=lambda x: x.location.get('y', 0))

            logger.info(f"✅ Found {len(unique_buttons)} buttons")

            # Extract button info
            found_buttons = []
            for index, btn in enumerate(unique_buttons):
                try:
                    y_pos = btn.location.get('y', 0)
                    txt = btn.text or btn.get_attribute('textContent') or 'Unknown'
                    url_hint = btn.get_attribute('href')

                    found_buttons.append({
                        "id": index,
                        "text": txt.strip(),
                        "y": y_pos,
                        "url_hint": url_hint
                    })
                except Exception as e:
                    logger.warning(f"⚠ Could not extract button info: {e}")
                    continue

            return found_buttons

        except TimeoutException:
            logger.error("✗ Page load timeout")
            return []
        except Exception as e:
            logger.error(f"✗ Scan failed: {e}")
            return []


# ─────────────────────────────────────────────────────────────────────────
# Worker Function (SEQUENTIAL, NOT PARALLEL)
# ─────────────────────────────────────────────────────────────────────────

def process_button(
    target_url: str,
    button_index: int,
    all_buttons: List[Dict],
    timeout: int = 60
) -> Result:
    """
    Process single button click and link extraction

    Args:
        target_url: URL to process
        button_index: Index of button to click (0-based)
        all_buttons: List of all buttons from scan
        timeout: Operation timeout in seconds

    Returns:
        Result object with success status and URL or error
    """
    start = time.time()
    result = Result(success=False, button_index=button_index)

    try:
        result.add_log(f"Starting task for Button #{button_index + 1}")

        with SafeDriver() as driver:
            # Navigate to page
            driver.get(target_url)
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            time.sleep(2)

            # Re-scan and find button
            button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
            raw_buttons = []

            for text in button_texts:
                try:
                    element = find_element_safe(driver, text, timeout=5)
                    if element:
                        raw_buttons.append(element)
                except:
                    continue

            unique_buttons = list(set(raw_buttons))
            unique_buttons.sort(key=lambda x: x.location.get('y', 0))

            if button_index >= len(unique_buttons):
                result.error = f"Button index {button_index} no longer exists"
                return result

            target_btn = unique_buttons[button_index]

            # Click button
            result.add_log(f"Clicking button #{button_index + 1}")

            original_handles = set(driver.window_handles)
            if not click_with_retry(driver, target_btn):
                result.error = "Failed to click button"
                return result

            time.sleep(2)

            # Switch to new window if opened
            if len(driver.window_handles) > len(original_handles):
                switch_to_new_window(driver, original_handles, timeout=10)

            # Click "Fast Server" or "All Episodes Batch" if found
            result.add_log("Looking for server selection...")
            try:
                server_element = find_element_safe(
                    driver,
                    "Fast Server",
                    timeout=5
                )
                if server_element:
                    click_with_retry(driver, server_element)
                    time.sleep(2)
            except:
                logger.debug("Fast Server button not found (optional)")

            # Click verification buttons
            verification_texts = [
                "Start Verification",
                "Verify To Continue",
                "Click Here To Continue",
                "Go to download"
            ]

            result.add_log("Clicking verification buttons...")
            for verify_text in verification_texts:
                try:
                    verify_element = find_element_safe(driver, verify_text, timeout=5)
                    if verify_element:
                        click_with_retry(driver, verify_element)
                        result.add_log(f"✓ Clicked '{verify_text}'")
                        time.sleep(1)
                except:
                    logger.debug(f"'{verify_text}' not found (optional)")
                    continue

            time.sleep(3)

            # Find final link
            final_url = find_final_link(driver, timeout=10)

            if final_url:
                result.success = True
                result.url = final_url
                result.add_log(f"✓ SUCCESS: {final_url}")
            else:
                result.error = "Could not find final link"

    except TimeoutException:
        result.error = f"Operation timeout after {timeout}s"
        logger.error(result.error)
    except Exception as e:
        result.error = f"Error: {str(e)}"
        logger.error(result.error)

    finally:
        result.elapsed_time = time.time() - start

    return result


# ─────────────────────────────────────────────────────────────────────────
# Input Parsing
# ─────────────────────────────────────────────────────────────────────────

def parse_selection(selection: str, max_buttons: int) -> List[int]:
    """
    Parse user selection input

    Args:
        selection: User input (e.g., "1,3,5" or "2")
        max_buttons: Maximum button index

    Returns:
        List of valid button indices (0-based)
    """
    selected = []
    try:
        parts = selection.split(',')
        for part in parts:
            num = int(part.strip())
            idx = num - 1
            if 0 <= idx < max_buttons:
                selected.append(idx)
            else:
                logger.warning(f"⚠ Button #{num} out of range (1-{max_buttons})")
    except ValueError:
        logger.error("❌ Invalid input format. Use numbers separated by commas (e.g., '1,3,5')")

    return selected


# ─────────────────────────────────────────────────────────────────────────
# Main Execution
# ─────────────────────────────────────────────────────────────────────────

def main():
    """Main execution function"""
    print("\n" + "="*60)
    print("🐍 SELENIUM WEB SCRAPER - CORRECTED VERSION")
    print("="*60)

    # Get URL from user
    start_url = input("\n📍 Paste your link here and press Enter: ").strip()

    if not start_url:
        logger.error("No URL provided")
        return

    # Scan page
    buttons = scan_page_for_buttons(start_url)

    if not buttons:
        logger.error("❌ No buttons found on this page")
        return

    # Display buttons
    print("\n" + "="*60)
    print("👇 AVAILABLE BUTTONS FOUND 👇")
    print("="*60)

    for btn in buttons:
        print(f"[{btn['id'] + 1}] {btn['text']:30s} (Y-Pos: {btn['y']})")

    print("="*60)

    # Get selection
    selection = input("\n📝 Enter button numbers (e.g., 1,3,5 or just 2): ").strip()

    if not selection:
        logger.error("No selection made")
        return

    selected_indices = parse_selection(selection, len(buttons))

    if not selected_indices:
        logger.error("No valid buttons selected")
        return

    # Process buttons SEQUENTIALLY (NOT in parallel)
    print("\n" + "="*60)
    print(f"🚀 Processing {len(selected_indices)} button(s)...")
    print("="*60 + "\n")

    results = []
    for idx in selected_indices:
        print(f"\n[{idx + 1}/{len(selected_indices)}] Processing button #{idx + 1}...")
        result = process_button(start_url, idx, buttons, timeout=60)
        results.append(result)
        print(result)

    # Display final results
    print("\n" + "="*60)
    print("📊 FINAL RESULTS")
    print("="*60)

    for result in results:
        print(result)

    # Summary
    successful = sum(1 for r in results if r.success)
    print(f"\n✅ Success: {successful}/{len(results)}")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\n⛔ Interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)