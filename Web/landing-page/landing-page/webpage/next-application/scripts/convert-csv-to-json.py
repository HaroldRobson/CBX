#!/usr/bin/env python3
"""
Convert partitioned CSV files to a single JSON file for Next.js static serving.
This script:
1. Reads all partitioned CSV files from ../../algorithm/data/partitioned/
2. Combines them into a single JSON array
3. Saves to public/data/allprojects.json
4. Creates a search index for fast lookups
"""

import csv
import json
import os
import glob
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
PARTITIONED_DIR = PROJECT_ROOT.parent.parent / "algorithm" / "data" / "partitioned"
PUBLIC_DATA_DIR = PROJECT_ROOT / "public" / "data"

def main():
    print("🔄 Converting CSV files to JSON...")
    
    # Create public/data directory if it doesn't exist
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    all_projects = []
    processed_ids = set()
    
    # Find all CSV files in partitioned directory
    csv_files = glob.glob(str(PARTITIONED_DIR / "projects_*.csv"))
    csv_files.sort()
    
    print(f"📁 Found {len(csv_files)} CSV files to process")
    
    for csv_file in csv_files:
        print(f"  Processing: {os.path.basename(csv_file)}")
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                project_id = row.get('ID', '').strip()
                
                # Skip if we've already processed this ID (avoid duplicates)
                if project_id in processed_ids:
                    continue
                
                if project_id:  # Only add if ID exists
                    # Clean up the data
                    project = {
                        'id': project_id,
                        'name': row.get('Name', '').strip(),
                        'proponent': row.get('Proponent', '').strip(),
                        'projectType': row.get('Project Type', '').strip(),
                        'afolzuActivities': row.get('AFOLU Activities', '').strip(),
                        'methodology': row.get('Methodology', '').strip(),
                        'status': row.get('Status', '').strip(),
                        'country': row.get('Country/Area', '').strip(),
                        'estimatedEmissions': row.get('Estimated Annual Emission Reductions', '').strip(),
                        'region': row.get('Region', '').strip(),
                        'registrationDate': row.get('Project Registration Date', '').strip(),
                        'creditingPeriodStart': row.get('Crediting Period Start Date', '').strip(),
                        'creditingPeriodEnd': row.get('Crediting Period End Date', '').strip(),
                        'score': float(row.get('our score', 0)) if row.get('our score', '').strip() else 0
                    }
                    
                    all_projects.append(project)
                    processed_ids.add(project_id)
    
    # Sort by ID for consistent output
    all_projects.sort(key=lambda x: int(x['id']) if x['id'].isdigit() else float('inf'))
    
    print(f"✅ Processed {len(all_projects)} unique projects")
    
    # Save main projects file
    projects_file = PUBLIC_DATA_DIR / "allprojects.json"
    with open(projects_file, 'w', encoding='utf-8') as f:
        json.dump(all_projects, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Saved to: {projects_file}")
    
    # Create a search index for faster lookups (optional optimization)
    search_index = {
        'projects': {project['id']: {
            'name': project['name'],
            'score': project['score'],
            'country': project['country'],
            'status': project['status']
        } for project in all_projects},
        'total': len(all_projects),
        'lastUpdated': '2024-01-01'  # You can update this programmatically
    }
    
    index_file = PUBLIC_DATA_DIR / "search-index.json"
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(search_index, f, ensure_ascii=False, indent=2)
    
    print(f"🔍 Created search index: {index_file}")
    
    # Print summary statistics
    scores = [p['score'] for p in all_projects if p['score'] > 0]
    if scores:
        print(f"\n📊 Score Statistics:")
        print(f"   Total projects with scores: {len(scores)}")
        print(f"   Average score: {sum(scores)/len(scores):.2f}")
        print(f"   Min score: {min(scores):.2f}")
        print(f"   Max score: {max(scores):.2f}")
    
    print(f"\n🎉 Conversion complete! JSON files ready for Next.js")
    print(f"   Projects file: public/data/allprojects.json ({len(all_projects)} projects)")
    print(f"   Search index: public/data/search-index.json")

if __name__ == "__main__":
    main() 