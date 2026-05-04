"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";

const NOTEBOOK_CODE = `# =========================================
# 1. Install required packages
# =========================================
!pip install -q selenium

# =========================================
# 2. Imports
# =========================================
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from multiprocessing import Pool
from urllib.parse import urlparse
import time

# =========================================
# 3. Chrome options
# =========================================
def chrome_options():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    return options

# =========================================
# 4. Scanner Helper (Finds all options)
# =========================================
def scan_page_for_buttons(url):
    print(f"🔍 Scanning page: {url} ...")
    driver = webdriver.Chrome(options=chrome_options())
    found_buttons = []
    
    try:
        driver.get(url)
        time.sleep(4)

        button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
        raw_buttons = []
        for text in button_texts:
            elems = driver.find_elements(By.XPATH, f"//a[normalize-space()='{text}'] | //button[normalize-space()='{text}']")
            raw_buttons.extend(elems)

        unique_buttons = list(set(raw_buttons))
        unique_buttons.sort(key=lambda x: x.location['y'])

        print(f"✅ Found {len(unique_buttons)} buttons. Analyzing locations...")

        for index, btn in enumerate(unique_buttons):
            try:
                y_pos = btn.location['y']
                txt = btn.text
                found_buttons.append({
                    "id": index,
                    "text": txt,
                    "y": y_pos,
                    "url_hint": btn.get_attribute('href')
                })
            except:
                pass
                
    finally:
        driver.quit()
        
    return found_buttons

# =========================================
# 5. Extract domain from pepe links
# =========================================
def extract_pepe_domain(driver):
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
            return list(pepe_domains)[0]
    except:
        pass
    
    return None

# =========================================
# 6. Worker function (Executes Selection)
# =========================================
def worker(task):
    target_url, button_index_to_click = task
    print(f"🚀 [Worker] Starting task for Button #{button_index_to_click + 1}...")

    driver = webdriver.Chrome(options=chrome_options())
    wait = WebDriverWait(driver, 25)

    try:
        driver.get(target_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(3)

        button_texts = ["Download Links", "Episode Links", "Batch/Zip File"]
        raw_buttons = []
        for text in button_texts:
            elems = driver.find_elements(By.XPATH, f"//a[normalize-space()='{text}'] | //button[normalize-space()='{text}']")
            raw_buttons.extend(elems)
            
        unique_buttons = list(set(raw_buttons))
        unique_buttons.sort(key=lambda x: x.location['y'])

        if button_index_to_click >= len(unique_buttons):
            return f"❌ [Worker] Button index {button_index_to_click} no longer exists."

        target_btn = unique_buttons[button_index_to_click]
        
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", target_btn)
        time.sleep(1)
        
        current_handles = set(driver.window_handles)
        target_btn.click()
        print(f"✅ [Worker] Clicked button #{button_index_to_click + 1}")
        time.sleep(5)

        new_handles = set(driver.window_handles) - current_handles
        if new_handles:
            driver.switch_to.window(new_handles.pop())
        
        try:
            server_btn = wait.until(EC.presence_of_element_located((
                By.XPATH, "//*[contains(text(), 'Fast Server') or contains(text(), 'All Episodes Batch')]"
            )))
            driver.execute_script("arguments[0].click();", server_btn)
            time.sleep(3)
            if len(driver.window_handles) > len(current_handles) + 1:
                driver.switch_to.window(driver.window_handles[-1])
        except:
            pass

        def click_verify(txt):
            try:
                xpath = f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{txt.lower()}')]"
                el = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
                driver.execute_script("arguments[0].click();", el)
                print(f"[Worker] Clicked '{txt}'")
                return True
            except:
                return False

        click_verify('Start Verification')
        time.sleep(2)
        click_verify('Verify To Continue')
        print(f"[Worker] Waiting 5s...")
        time.sleep(5)
        click_verify('Click Here To Continue')
        time.sleep(2)
        click_verify('Go to download')

        print(f"[Worker] Searching for final pepe link...")
        time.sleep(5)
        
        pepe_domain = extract_pepe_domain(driver)
        
        if not pepe_domain:
            return f"❌ [Worker] Failed: Could not find pepe domain on page"
        
        print(f"[Worker] Detected pepe domain: {pepe_domain}")
        target_pattern = f"{pepe_domain}/?go=pepe-"
        
        found_link = None
        links = driver.find_elements(By.TAG_NAME, 'a')
        for link_element in links:
            href = link_element.get_attribute('href')
            if href and href.startswith(target_pattern):
                found_link = href
                break
        
        if found_link:
            driver.get(found_link)
            time.sleep(3)
            final_resolved_url = driver.current_url
            print(f"🎯 [Worker] FINAL RESULT: {final_resolved_url}")
            return final_resolved_url
        else:
            return f"❌ [Worker] Failed: No matching pepe link found"

    except Exception as e:
        return f"❌ Error [Worker]: {str(e)}"

    finally:
        driver.quit()

# =========================================
# 7. Main execution (INTERACTIVE)
# =========================================
start_url = input("Paste your link here and press Enter: ").strip()

if not start_url:
    print("No URL provided")
else:
    buttons = scan_page_for_buttons(start_url)
    
    if not buttons:
        print("❌ No buttons found on this page.")
    else:
        print("\\n" + "="*40)
        print("👇 AVAILABLE BUTTONS FOUND 👇")
        print("="*40)
        
        for btn in buttons:
            print(f"[{btn['id'] + 1}] {btn['text']}  (Y-Pos: {btn['y']})")
        
        print("="*40)
        print("Which buttons do you want to click?")
        print("Type numbers separated by commas (e.g., '1, 3' or just '2')")
        
        selection = input("Enter selection: ").strip()
        
        selected_indices = []
        try:
            parts = selection.split(',')
            for p in parts:
                num = int(p.strip())
                idx = num - 1
                if 0 <= idx < len(buttons):
                    selected_indices.append(idx)
                else:
                    print(f"⚠️ Skipping invalid number: {num}")
        except:
            print("❌ Invalid input format.")

        if not selected_indices:
            print("No valid buttons selected. Exiting.")
        else:
            tasks = [(start_url, idx) for idx in selected_indices]
            
            print(f"\\n🚀 Launching {len(tasks)} parallel workers...")
            
            try:
                with Pool(processes=len(tasks)) as pool:
                    results = pool.map(worker, tasks)

                print("\\n" + "="*60)
                print("--- FINAL RESULTS ---")
                print("="*60)
                for i, r in enumerate(results, 1):
                    print(f"[{i}] {r}")
                print("="*60)
            except Exception as e:
                print(f"❌ Execution Error: {e}")
`;

const COLAB_URL =
  "https://colab.research.google.com/github/eoftisreal/eoftisreal.github.io/blob/main/notebooks/link_resolver_pro.ipynb";

const cells = [
  { label: "Cell 1", title: "Install packages", lines: [0, 2] },
  { label: "Cell 2", title: "Imports", lines: [3, 14] },
  { label: "Cell 3", title: "Chrome options", lines: [15, 23] },
  { label: "Cell 4", title: "Scanner helper", lines: [24, 50] },
  { label: "Cell 5", title: "Pepe domain extractor", lines: [51, 66] },
  { label: "Cell 6", title: "Worker function", lines: [67, 142] },
  { label: "Cell 7", title: "Main execution", lines: [143, 9999] },
];

export default function LinkResolverPage() {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(NOTEBOOK_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const codeLines = NOTEBOOK_CODE.split("\n");

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Link2 className="w-7 h-7 text-green-400 shrink-0" />
            <h1 className="text-3xl font-bold">Link Resolver Pro</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <a
              href={COLAB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Colab
            </a>
          </div>
        </div>

        <p className="text-slate-400 mb-8 max-w-2xl">
          Automated multi-threaded link resolver using Selenium. Run this notebook in Google Colab — paste a URL, pick
          the buttons to click, and the script resolves the final download links in parallel.
        </p>

        {/* Notebook-style code display */}
        <div className="space-y-3">
          {cells.map((cell, ci) => {
            const start = cell.lines[0];
            const end = Math.min(cell.lines[1], codeLines.length - 1);
            const snippet = codeLines.slice(start, end + 1).join("\n");
            return (
              <div key={ci} className="glass-panel rounded-2xl overflow-hidden">
                {/* Cell header */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-xs font-mono text-slate-500">[{ci + 1}]</span>
                  <span className="text-xs text-slate-400 font-medium">{cell.title}</span>
                </div>
                {/* Code */}
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-slate-300 whitespace-pre">
                  {snippet}
                </pre>
              </div>
            );
          })}
        </div>

        {/* Colab CTA */}
        <div className="mt-10 glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-1">Ready to run?</p>
            <p className="text-sm text-slate-400">Open the notebook in Google Colab and execute each cell in order.</p>
          </div>
          <a
            href={COLAB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Colab
          </a>
        </div>
      </div>
    </div>
  );
}
