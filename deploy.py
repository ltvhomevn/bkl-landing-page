#!/usr/bin/env python3
"""Deploy to Netlify using their anonymous site creation API."""
import urllib.request
import json
import sys
import os
import hashlib
import glob

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
API_BASE = "https://api.netlify.com/api/v1"

def get_file_sha1(filepath):
    with open(filepath, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()

def get_all_files(directory):
    files = {}
    for root, dirs, filenames in os.walk(directory):
        for filename in filenames:
            if filename.startswith('.') or filename == 'deploy.py':
                continue
            filepath = os.path.join(root, filename)
            relpath = '/' + os.path.relpath(filepath, directory)
            files[relpath] = {
                'path': filepath,
                'sha1': get_file_sha1(filepath)
            }
    return files

def create_site_deploy(files):
    """Create a new site with file digest deploy."""
    file_hashes = {path: info['sha1'] for path, info in files.items()}
    payload = json.dumps({"files": file_hashes}).encode('utf-8')
    
    req = urllib.request.Request(
        f"{API_BASE}/sites",
        data=payload,
        headers={
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode('utf-8')}")
        return None

def upload_file(deploy_id, filepath, relpath):
    """Upload a single file to the deploy."""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    req = urllib.request.Request(
        f"{API_BASE}/deploys/{deploy_id}/files{relpath}",
        data=data,
        headers={
            'Content-Type': 'application/octet-stream',
        },
        method='PUT'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return True
    except urllib.error.HTTPError as e:
        print(f"  Error uploading {relpath}: {e.code}")
        return False

def main():
    print("🔍 Scanning files...")
    files = get_all_files(SITE_DIR)
    print(f"   Found {len(files)} files")
    for path in files:
        print(f"   - {path}")
    
    print("\n🚀 Creating site on Netlify...")
    result = create_site_deploy(files)
    
    if not result:
        print("❌ Failed to create site. Trying zip upload method...")
        # Try zip upload as fallback
        import subprocess
        zip_path = '/tmp/bkl-site.zip'
        subprocess.run(['zip', '-r', zip_path, '.', '-x', '.*', 'deploy.py'], 
                       cwd=SITE_DIR, capture_output=True)
        
        with open(zip_path, 'rb') as f:
            data = f.read()
        
        req = urllib.request.Request(
            f"{API_BASE}/sites",
            data=data,
            headers={'Content-Type': 'application/zip'},
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            print(f"❌ Zip upload also failed: {e.code} - {e.read().decode('utf-8')}")
            return
    
    site_url = result.get('ssl_url') or result.get('url') or result.get('deploy_ssl_url')
    site_id = result.get('site_id') or result.get('id')
    deploy_id = result.get('deploy_id') or result.get('id')
    
    print(f"\n✅ Site created!")
    print(f"   Site ID: {site_id}")
    print(f"   URL: {site_url}")
    
    # Upload required files
    required = result.get('required', [])
    if required:
        print(f"\n📤 Uploading {len(required)} files...")
        for path, info in files.items():
            if info['sha1'] in required:
                print(f"   Uploading {path}...")
                upload_file(deploy_id, info['path'], path)
        print("   Done!")
    
    print(f"\n🎉 DEPLOYMENT COMPLETE!")
    print(f"🌐 Your website is live at: {site_url}")

if __name__ == '__main__':
    main()
