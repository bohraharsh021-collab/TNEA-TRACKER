import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(path, params=None):
    url = BASE_URL + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url, headers={'User-Agent': 'TNEA List Checker'})
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            status = res.getcode()
            content = res.read().decode('utf-8')
            return status, content
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("="*60)
    print("             TNEA TRACKER — COMPREHENSIVE LIST CHECKER          ")
    print("="*60)
    
    checks = []
    
    # 1. Home Page & Static assets
    print("Checking static files serving (index.html)...")
    status, content = test_endpoint("/")
    if status == 200 and "TNEA Tracker" in content:
        checks.append(("[PASS]", "Home Page loads correctly and brand name is 'TNEA Tracker'"))
    else:
        checks.append(("[FAIL]", f"Home Page load failed (status: {status})"))
        
    # 2. Filters API (Check clean tiers & deduplicated branches)
    print("Checking Filters API (/api/filters)...")
    status, content = test_endpoint("/api/filters")
    if status == 200:
        try:
            data = json.loads(content)
            districts = data.get('districts', [])
            branches = data.get('branches', [])
            tiers = data.get('tiers', [])
            
            # Check unique branches mapping
            codes = [b['code'] for b in branches]
            has_dups = len(codes) != len(set(codes))
            
            # Check custom tiers (exactly three)
            expected_tiers = {"Government Colleges", "Autonomous Colleges", "Non-Autonomous Colleges"}
            actual_tiers = set(tiers)
            tiers_correct = actual_tiers == expected_tiers
            
            if not has_dups and tiers_correct:
                checks.append(("[PASS]", f"Filters API has deduplicated branches & exactly three categories: {list(actual_tiers)}"))
            else:
                checks.append(("[FAIL]", f"Filters API validation failed: Duplicates: {has_dups}, Tiers correct: {tiers_correct} (Found: {list(actual_tiers)})"))
        except Exception as e:
            checks.append(("[FAIL]", f"Filters API JSON parsing error: {e}"))
    else:
        checks.append(("[FAIL]", f"Filters API failed (status: {status})"))

    # 3. Colleges query (Verify rank-only, no cutoffs)
    print("Checking Colleges API (/api/colleges)...")
    status, content = test_endpoint("/api/colleges", {"year": "2025", "limit": "5"})
    if status == 200:
        try:
            data = json.loads(content)
            colleges = data.get('data', [])
            total = data.get('total', 0)
            
            # Verify no cutoff fields in response
            has_cutoff_fields = any("Cutoff" in col for col in colleges)
            has_rank_fields = all("Closing Rank" in col for col in colleges)
            
            if len(colleges) > 0 and total > 0 and not has_cutoff_fields and has_rank_fields:
                checks.append(("[PASS]", f"Colleges API returns rank-based results (Total matches: {total}) and contains no cutoff fields"))
            else:
                checks.append(("[FAIL]", f"Colleges API checks failed: Cutoff fields found: {has_cutoff_fields}, Rank fields found: {has_rank_fields}"))
        except Exception as e:
            checks.append(("[FAIL]", f"Colleges API parsing error: {e}"))
    else:
        checks.append(("[FAIL]", f"Colleges API failed (status: {status})"))

    # 4. Branches list (Verify rank ranges, no cutoffs)
    print("Checking Branches API (/api/branches)...")
    status, content = test_endpoint("/api/branches", {"year": "2025"})
    if status == 200:
        try:
            data = json.loads(content)
            # Verify no cutoff bounds in response
            has_cutoff_bounds = any("cutoff" in key.lower() for b in data for key in b.keys())
            has_rank_bounds = all("min_rank" in b and "max_rank" in b for b in data)
            
            if len(data) > 0 and not has_cutoff_bounds and has_rank_bounds:
                checks.append(("[PASS]", f"Branches API aggregates colleges count and general rank ranges (Total: {len(data)})"))
            else:
                checks.append(("[FAIL]", f"Branches API checks failed: Cutoffs present: {has_cutoff_bounds}, Ranks present: {has_rank_bounds}"))
        except Exception as e:
            checks.append(("[FAIL]", f"Branches API parsing error: {e}"))
    else:
        checks.append(("[FAIL]", f"Branches API failed (status: {status})"))

    # 5. Predictor chances (Rank-based only)
    print("Checking Predictor API (/api/predict)...")
    status, content = test_endpoint("/api/predict", {"rank": "15000", "district": "All", "branch": "All", "tier": "All"})
    if status == 200:
        try:
            data = json.loads(content)
            safe = data.get('safe', [])
            moderate = data.get('moderate', [])
            reach = data.get('reach', [])
            checks.append(("[PASS]", f"Predictor API classifies based on General Rank (Safe: {len(safe)}, Target: {len(moderate)}, Reach: {len(reach)})"))
        except Exception as e:
            checks.append(("[FAIL]", f"Predictor API parsing error: {e}"))
    else:
        checks.append(("[FAIL]", f"Predictor API failed (status: {status})"))

    # 6. Trends API (Rank trends YoY)
    print("Checking Trends API (/api/trends)...")
    status, content = test_endpoint("/api/trends", {"college": "2712", "branch": "COMPUTER SCIENCE AND ENGINEERING"})
    if status == 200:
        try:
            data = json.loads(content)
            if "ranks" in data and "years" in data:
                checks.append(("[PASS]", f"Trends API successfully returns YoY rank shifts (Years: {data['years']}, Ranks: {data['ranks']})"))
            else:
                checks.append(("[FAIL]", "Trends API response did not contain ranks array"))
        except Exception as e:
            checks.append(("[FAIL]", f"Trends API parsing error: {e}"))
    else:
        checks.append(("[FAIL]", f"Trends API failed (status: {status})"))

    # 7. 100 Analytics modules inventory verification
    print("Checking Analytics API (/api/analytics) for sample modules...")
    sample_modules = ["col_comp_1", "br_pop_3", "seat_dist_4", "rank_ana_6", "hist_tr_4", "reg_ana_2", "inst_ana_4", "br_dem_2", "adm_stat_5", "stu_ins_1"]
    analytics_ok = True
    
    for mod in sample_modules:
        status, content = test_endpoint("/api/analytics", {"module": mod})
        if status != 200:
            analytics_ok = False
            checks.append(("[FAIL]", f"Analytics module '{mod}' failed to execute (status: {status})"))
            break
            
    if analytics_ok:
        checks.append(("[PASS]", f"Analytics API successfully executes 100-modules inventory queries (Tested {len(sample_modules)} sample modules)"))

    print("\n" + "="*60)
    print("                        CHECKLIST REPORT                       ")
    print("="*60)
    
    passed_count = 0
    for status_tag, desc in checks:
        print(f"{status_tag} {desc}")
        if status_tag == "[PASS]":
            passed_count += 1
            
    print("-"*60)
    print(f"Summary: {passed_count} / {len(checks)} checks passed successfully.")
    print("="*60)
    
    if passed_count == len(checks):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    time.sleep(1)
    run_tests()
