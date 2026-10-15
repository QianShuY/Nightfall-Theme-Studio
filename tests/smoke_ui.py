"""Optional local UI smoke test: pip install playwright; python -m playwright install chromium"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=shutil.which('chromium') or None, args=['--no-sandbox','--no-proxy-server'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((root/'studio/index.html').read_text(encoding='utf-8'))
    page.add_style_tag(content=(root/'studio/style.css').read_text(encoding='utf-8'))
    page.add_script_tag(content=(root/'shared/engine.js').read_text(encoding='utf-8'))
    page.add_script_tag(content=(root/'studio/app.js').read_text(encoding='utf-8'))
    assert page.locator('.theme-card').count()==6
    page.locator('[data-page="background"]').click()
    assert page.locator('#editor-title').inner_text()=='动态背景'
    page.locator('#background-kind').select_option('stars')
    assert page.locator('canvas').count()==1
    page.locator('[data-page="appearance"]').click()
    page.locator('input#color-accent').fill('#e66b75')
    assert page.locator('#preview').evaluate('(el) => el.style.getPropertyValue("--pv-accent")')=='#e66b75'
    page.locator('[data-page="intro"]').click()
    assert page.locator('#intro-style').count()==1
    page.locator('#intro-style').select_option('signal')
    page.locator('#intro-name').fill('NIGHTFALL TEST')
    page.locator('#intro-name').press('Tab')
    page.locator('#replay-intro').click()
    assert page.locator('.nf-intro').count()==1
    assert page.locator('.nf-intro__title').inner_text()=='NIGHTFALL TEST'
    page.locator('.nf-intro__skip').click()
    page.wait_for_timeout(450)
    assert page.locator('.nf-intro').count()==0
    # Book animation is tied to the theme preset: selecting the preset also changes the intro style.
    page.locator('[data-page="themes"]').click()
    page.locator('.theme-card[data-id="grimoire"]').click()
    page.locator('#replay-intro').click()
    assert page.locator('.nf-intro--grimoire').count()==1
    assert page.locator('.nfg-cover').count()==1
    assert page.locator('.nfg-leaf').count()==5
    assert page.locator('.nfg-ember').count()==34
    page.locator('.nf-intro__skip').click()
    page.wait_for_timeout(350)
    assert page.locator('.nf-intro').count()==0
    assert not errors,errors
    print('PASS: loaded, navigation, particles, color editing, startup intro')
    browser.close()
