// TNEA Tracker - Client-side SQLite API Router using sql.js
// Automatically intercepts fetch() requests to '/api/' and routes them to tnea.db in-browser.

(function() {
  'use strict';

  const DB_PATH = 'tnea.db';
  const MODULES_INVENTORY = {
  "col_comp_1": {
    "name": "Top CSE Colleges (2025)",
    "description": "Rankings of top 10 colleges for Computer Science Engineering based on closing ranks.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='CS' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_2": {
    "name": "Top ECE Colleges (2025)",
    "description": "Rankings of top 10 colleges for Electronics & Communication Engineering.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='EC' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_3": {
    "name": "Top IT Colleges (2025)",
    "description": "Rankings of top 10 colleges for Information Technology.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='IT' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_4": {
    "name": "Top Artificial Intelligence & Data Science Colleges",
    "description": "Compare the closing ranks of top colleges offering AI & DS.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='AD' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_5": {
    "name": "Chennai vs Coimbatore Top Colleges",
    "description": "Head-to-head comparison of top colleges in Chennai vs Coimbatore.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_6": {
    "name": "Top Mechanical Engineering Colleges (2025)",
    "description": "Rankings of top 10 colleges for Mechanical Engineering.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='ME' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_7": {
    "name": "Top Civil Engineering Colleges (2025)",
    "description": "Rankings of top 10 colleges for Civil Engineering.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='CE' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_8": {
    "name": "Top Government Aided Private Colleges",
    "description": "Compare closing ranks across top Government-Aided private colleges.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.college_name LIKE '%aided%' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "col_comp_9": {
    "name": "Top University Departments (Anna University)",
    "description": "Compare CEG, MIT, ACT, and SAP campus departments.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.college_code IN (1, 2, 4) AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "col_comp_10": {
    "name": "Top Self-Financing Colleges (2025)",
    "description": "Top 10 self-financing engineering colleges by closing rank.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "br_pop_1": {
    "name": "Top 10 Branches by College Count",
    "description": "Branches offered by the highest number of engineering colleges.",
    "query": "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 GROUP BY branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "br_pop_2": {
    "name": "CSE & Allied Branches Density",
    "description": "Compare the number of colleges offering CSE, Cybersecurity, AI/ML, and Data Science.",
    "query": "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND (branch_code LIKE 'CS%' OR branch_code='AD' OR branch_code='IT') GROUP BY branch_code ORDER BY value DESC",
    "chartType": "bar"
  },
  "br_pop_3": {
    "name": "ECE and EEE Coverage",
    "description": "Colleges offering Electronics & Communication vs Electrical & Electronics.",
    "query": "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('EC', 'EE') GROUP BY branch_code",
    "chartType": "bar"
  },
  "br_pop_4": {
    "name": "Core Engineering Branches College Count",
    "description": "Comparison of college count offering Civil, Mechanical, EEE, and Chemical.",
    "query": "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('CE', 'ME', 'EE', 'CH') GROUP BY branch_code ORDER BY value DESC",
    "chartType": "bar"
  },
  "br_pop_5": {
    "name": "Emerging Technologies College Counts",
    "description": "Offered counts of newly emerging technology courses.",
    "query": "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('AD', 'AL', 'SC', 'CY', 'CD') GROUP BY branch_code ORDER BY value DESC",
    "chartType": "bar"
  },
  "br_pop_6": {
    "name": "Tamil Medium Branches Offering",
    "description": "Offered counts of Tamil Medium courses in Civil and Mechanical.",
    "query": "SELECT b.branch_name as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN branches b ON a.branch_code = b.branch_code WHERE a.year=2025 AND a.branch_code IN ('XC', 'XM') GROUP BY a.branch_code",
    "chartType": "bar"
  },
  "br_pop_7": {
    "name": "Branch Popularity in Government Colleges",
    "description": "Most common branches offered by Government Engineering Colleges.",
    "query": "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "br_pop_8": {
    "name": "Branch Popularity in Autonomous Colleges",
    "description": "Most common branches offered by Autonomous Private Colleges.",
    "query": "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "br_pop_9": {
    "name": "Branch Popularity in Non-Autonomous Colleges",
    "description": "Most common branches offered by Non-Autonomous Private Colleges.",
    "query": "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "br_pop_10": {
    "name": "AI & Data Science College Growth (2022-2025)",
    "description": "Growth in number of colleges offering Artificial Intelligence and Data Science.",
    "query": "SELECT year as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE branch_code='AD' GROUP BY year ORDER BY year ASC",
    "chartType": "line"
  },
  "seat_dist_1": {
    "name": "Colleges Offering 5+ Branches",
    "description": "Count of colleges offering 5 or more distinct engineering courses.",
    "query": "SELECT 'Colleges with 5+ Courses' as label, COUNT(*) as value FROM (SELECT college_code FROM admissions WHERE year=2025 GROUP BY college_code HAVING COUNT(DISTINCT branch_code) >= 5)",
    "chartType": "bar"
  },
  "seat_dist_2": {
    "name": "Colleges Offering 10+ Branches",
    "description": "Count of colleges offering 10 or more distinct engineering courses.",
    "query": "SELECT 'Colleges with 10+ Courses' as label, COUNT(*) as value FROM (SELECT college_code FROM admissions WHERE year=2025 GROUP BY college_code HAVING COUNT(DISTINCT branch_code) >= 10)",
    "chartType": "bar"
  },
  "seat_dist_3": {
    "name": "Branch Variety Count by District",
    "description": "Count of unique courses offered in top 10 districts.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.district ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "seat_dist_4": {
    "name": "Top 10 Colleges with Maximum Branch Variety",
    "description": "Colleges offering the widest list of course options.",
    "query": "SELECT c.college_name as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY a.college_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "seat_dist_5": {
    "name": "Branch Density in Government vs Autonomous",
    "description": "Average number of courses offered per college in Gov vs Autonomous.",
    "query": "SELECT c.institution_type as label, COUNT(*) / COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.institution_type",
    "chartType": "bar"
  },
  "seat_dist_6": {
    "name": "Colleges Offering CSE (CS)",
    "description": "Total colleges offering Computer Science Engineering.",
    "query": "SELECT 'Offering CSE' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='CS'",
    "chartType": "bar"
  },
  "seat_dist_7": {
    "name": "Colleges Offering ECE (EC)",
    "description": "Total colleges offering Electronics & Communication Engineering.",
    "query": "SELECT 'Offering ECE' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='EC'",
    "chartType": "bar"
  },
  "seat_dist_8": {
    "name": "Colleges Offering MECH (ME)",
    "description": "Total colleges offering Mechanical Engineering.",
    "query": "SELECT 'Offering MECH' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='ME'",
    "chartType": "bar"
  },
  "seat_dist_9": {
    "name": "Colleges Offering CIVIL (CE)",
    "description": "Total colleges offering Civil Engineering.",
    "query": "SELECT 'Offering CIVIL' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='CE'",
    "chartType": "bar"
  },
  "seat_dist_10": {
    "name": "Colleges Offering AI & DS (AD)",
    "description": "Total colleges offering Artificial Intelligence and Data Science.",
    "query": "SELECT 'Offering AI & DS' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='AD'",
    "chartType": "bar"
  },
  "rank_ana_1": {
    "name": "Courses Closing Under Rank 10,000",
    "description": "Number of college-course options closing under general rank 10,000.",
    "query": "SELECT 'Rank < 10k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank < 10000",
    "chartType": "bar"
  },
  "rank_ana_2": {
    "name": "Courses Closing Between Ranks 10,000 & 50,000",
    "description": "Number of options closing in the mid-high range.",
    "query": "SELECT 'Rank 10k-50k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 10000 AND 50000",
    "chartType": "bar"
  },
  "rank_ana_3": {
    "name": "Courses Closing Between Ranks 50,000 & 100,000",
    "description": "Number of options closing in the mid range.",
    "query": "SELECT 'Rank 50k-100k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 50000 AND 100000",
    "chartType": "bar"
  },
  "rank_ana_4": {
    "name": "Courses Closing Above Rank 100,000",
    "description": "Number of options closing in the high range.",
    "query": "SELECT 'Rank > 100k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank > 100000",
    "chartType": "bar"
  },
  "rank_ana_5": {
    "name": "Average Closing Rank by District",
    "description": "Average closing general rank of all courses by district.",
    "query": "SELECT c.district as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.closing_rank IS NOT NULL GROUP BY c.district ORDER BY value ASC LIMIT 15",
    "chartType": "bar"
  },
  "rank_ana_6": {
    "name": "Average Closing Rank by Institution Type",
    "description": "Average closing general rank in Gov vs Autonomous vs Non-Autonomous.",
    "query": "SELECT c.institution_type as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.closing_rank IS NOT NULL GROUP BY c.institution_type ORDER BY value ASC",
    "chartType": "bar"
  },
  "rank_ana_7": {
    "name": "Rank Spread (Min/Max) for CSE (2025)",
    "description": "The lowest vs highest closing rank for Computer Science Engineering.",
    "query": "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='CS' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='CS' AND closing_rank IS NOT NULL",
    "chartType": "bar"
  },
  "rank_ana_8": {
    "name": "Rank Spread (Min/Max) for ECE (2025)",
    "description": "The lowest vs highest closing rank for Electronics & Communication.",
    "query": "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='EC' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='EC' AND closing_rank IS NOT NULL",
    "chartType": "bar"
  },
  "rank_ana_9": {
    "name": "Rank Spread (Min/Max) for MECH (2025)",
    "description": "The lowest vs highest closing rank for Mechanical Engineering.",
    "query": "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='ME' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='ME' AND closing_rank IS NOT NULL",
    "chartType": "bar"
  },
  "rank_ana_10": {
    "name": "Rank Spread (Min/Max) for CIVIL (2025)",
    "description": "The lowest vs highest closing rank for Civil Engineering.",
    "query": "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='CE' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='CE' AND closing_rank IS NOT NULL",
    "chartType": "bar"
  },
  "hist_tr_1": {
    "name": "CEG Campus CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at CEG Campus.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_2": {
    "name": "MIT Campus ECE YoY Rank Shift",
    "description": "Closing rank YoY shift for ECE at MIT Campus.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=4 AND branch_code='EC' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_3": {
    "name": "PSG Tech CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at PSG College of Technology.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2006 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_4": {
    "name": "SSN CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at SSN College of Engineering.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1315 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_5": {
    "name": "CIT Chennai CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at Chennai Institute of Technology.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1399 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_6": {
    "name": "Kumaraguru CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at Kumaraguru College of Technology.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2712 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_7": {
    "name": "GCT Coimbatore CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at Government College of Technology.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2005 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_8": {
    "name": "Thiagarajar EEE YoY Rank Shift",
    "description": "Closing rank YoY shift for EEE at Thiagarajar College of Engineering.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=5008 AND branch_code='EE' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_9": {
    "name": "Coimbatore Inst of Tech CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at Coimbatore Institute of Technology.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2007 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "hist_tr_10": {
    "name": "Sri Venkateswara CSE YoY Rank Shift",
    "description": "Closing rank YoY shift for CSE at Sri Venkateswara College of Engineering.",
    "query": "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1219 AND branch_code='CS' ORDER BY year ASC",
    "chartType": "line"
  },
  "reg_ana_1": {
    "name": "Top 10 Colleges in Chennai District",
    "description": "Top 10 colleges in Chennai district based on closing general rank (2025).",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='CHENNAI' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "reg_ana_2": {
    "name": "Top 10 Colleges in Coimbatore District",
    "description": "Top 10 colleges in Coimbatore district based on closing general rank.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='COIMBATORE' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "reg_ana_3": {
    "name": "Top 10 Colleges in Madurai District",
    "description": "Top 10 colleges in Madurai region.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='MADURAI' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "reg_ana_4": {
    "name": "Top 10 Colleges in Trichy District",
    "description": "Top 10 colleges in Tiruchirappalli region.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND (c.district='TIRUCHIRAPALLI' OR c.district='TRICHIRAPPALLI') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "reg_ana_5": {
    "name": "Top 10 Colleges in Salem District",
    "description": "Top 10 colleges in Salem region.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='SALEM' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "reg_ana_6": {
    "name": "Region-wise Average Closing Rank Comparison",
    "description": "Compare average closing general ranks of top 8 engineering hubs.",
    "query": "SELECT c.district as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE', 'MADURAI', 'SALEM', 'TIRUCHIRAPALLI', 'TRICHIRAPPALLI', 'KANCHEEPURAM', 'CHENGALPET') AND a.closing_rank IS NOT NULL GROUP BY c.district ORDER BY value ASC",
    "chartType": "bar"
  },
  "reg_ana_7": {
    "name": "Colleges Count: Chennai vs Coimbatore",
    "description": "Colleges count in Chennai vs Coimbatore districts.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE') GROUP BY c.district",
    "chartType": "bar"
  },
  "reg_ana_8": {
    "name": "Colleges Count in Southern Districts",
    "description": "Count of colleges in Madurai, Kanyakumari, Tirunelveli, and Tuticorin.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('MADURAI', 'KANYAKUMARI', 'TIRUNELVELI', 'TUTICORIN') GROUP BY c.district ORDER BY value DESC",
    "chartType": "bar"
  },
  "reg_ana_9": {
    "name": "Colleges Count in Western Districts",
    "description": "Count of colleges in Erode, Namakkal, Tiruppur, and Karur.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('ERODE', 'NAMAKKAL', 'TIRUPPUR', 'KARUR') GROUP BY c.district ORDER BY value DESC",
    "chartType": "bar"
  },
  "reg_ana_10": {
    "name": "Colleges Count in Northern Districts",
    "description": "Count of colleges in Thiruvallur, Kancheepuram, Chengalpet, and Vellore.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('THIRUVALLUR', 'KANCHEEPURAM', 'CHENGALPET', 'VELLORE') GROUP BY c.district ORDER BY value DESC",
    "chartType": "bar"
  },
  "inst_ana_1": {
    "name": "Government Colleges Minimum Closing Rank",
    "description": "Top 10 Government engineering colleges by minimum closing rank.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "inst_ana_2": {
    "name": "Autonomous Colleges Minimum Closing Rank",
    "description": "Top 10 Autonomous private colleges by minimum closing rank.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "inst_ana_3": {
    "name": "Non-Autonomous Colleges Minimum Closing Rank",
    "description": "Top 10 Non-Autonomous private colleges by minimum closing rank.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "inst_ana_4": {
    "name": "Government vs Autonomous Rank Range",
    "description": "Compare average closing general ranks of Gov vs Autonomous.",
    "query": "SELECT c.institution_type as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type IN ('Government Colleges', 'Autonomous Colleges') AND a.closing_rank IS NOT NULL GROUP BY c.institution_type",
    "chartType": "bar"
  },
  "inst_ana_5": {
    "name": "Unique Branches Offered by Government Colleges",
    "description": "Count of unique courses offered by Government colleges.",
    "query": "SELECT 'Government Colleges' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges'",
    "chartType": "bar"
  },
  "inst_ana_6": {
    "name": "Unique Branches Offered by Autonomous Colleges",
    "description": "Count of unique courses offered by Autonomous colleges.",
    "query": "SELECT 'Autonomous Colleges' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges'",
    "chartType": "bar"
  },
  "inst_ana_7": {
    "name": "Unique Branches Offered by Non-Autonomous Colleges",
    "description": "Count of unique courses offered by Non-Autonomous colleges.",
    "query": "SELECT 'Non-Autonomous' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges'",
    "chartType": "bar"
  },
  "inst_ana_8": {
    "name": "Total Colleges Distribution by Type",
    "description": "Total count of participating colleges in TNEA by type.",
    "query": "SELECT c.institution_type as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.institution_type",
    "chartType": "bar"
  },
  "inst_ana_9": {
    "name": "Top 10 Government College Ranks",
    "description": "Compare ranks of top 10 Government college campuses.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "inst_ana_10": {
    "name": "Top 10 Autonomous Private Ranks",
    "description": "Compare ranks of top 10 Autonomous private colleges.",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "br_dem_1": {
    "name": "Top 10 Branches by Average Closing Rank (Demand)",
    "description": "Branches with the lowest average closing general rank (highest demand).",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "br_dem_2": {
    "name": "Average Closing Ranks for Computer Science Branches",
    "description": "Compare average closing general ranks for CSE, AI, DS, and IT.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('CS', 'IT', 'AD', 'AL', 'CF') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_3": {
    "name": "Average Closing Ranks for Information Technology (IT)",
    "description": "Closing ranks of IT compared with CSE and Cyber Security.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('IT', 'CS', 'SC') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_4": {
    "name": "Average Closing Ranks for ECE Branches",
    "description": "Compare closing general ranks for ECE and advanced communication courses.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('EC', 'EA', 'ET') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_5": {
    "name": "Average Closing Ranks for Electrical (EEE) Branches",
    "description": "Compare EEE and associated instrumentation courses.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('EE', 'EI', 'IC') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_6": {
    "name": "Average Closing Ranks for Biotechnology Branches",
    "description": "Compare closing general ranks for Biotechnology and Biomedical.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('BT', 'BM', 'IB') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_7": {
    "name": "Average Closing Ranks for AI & ML Branches",
    "description": "Compare closing general ranks of AI/ML, AI/DS, and CSE(AI/ML).",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('AD', 'AL', 'AM', 'CG') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_8": {
    "name": "Average Closing Ranks for Mech & Civil core Branches",
    "description": "Compare Mechanical and Civil engineering closing general ranks.",
    "query": "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('ME', 'CE') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC",
    "chartType": "bar"
  },
  "br_dem_9": {
    "name": "Branches with Biggest General Rank jumps YoY (2024-2025)",
    "description": "Identify branches whose average closing rank improved significantly.",
    "query": "SELECT c25.branch_code as label, (AVG(c24.closing_rank) - AVG(c25.closing_rank)) as value FROM admissions c25 JOIN admissions c24 ON c25.college_code=c24.college_code AND c25.branch_code=c24.branch_code WHERE c25.year=2025 AND c24.year=2024 AND c25.closing_rank IS NOT NULL AND c24.closing_rank IS NOT NULL GROUP BY c25.branch_code HAVING value > 0 ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "br_dem_10": {
    "name": "Branches with Highest Variance in Closing Rank",
    "description": "Branches that are offered across all tiers of colleges.",
    "query": "SELECT branch_code as label, (MAX(closing_rank) - MIN(closing_rank)) as value FROM admissions WHERE year=2025 AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_1": {
    "name": "Participating Colleges count by Year",
    "description": "Yearly trend of colleges participating in TNEA general academic counselling.",
    "query": "SELECT year as label, COUNT(DISTINCT college_code) as value FROM admissions GROUP BY year ORDER BY year ASC",
    "chartType": "line"
  },
  "adm_stat_2": {
    "name": "Unique Branch Codes Count by Year",
    "description": "Yearly trend of unique branch codes listed in counselling.",
    "query": "SELECT year as label, COUNT(DISTINCT branch_code) as value FROM admissions GROUP BY year ORDER BY year ASC",
    "chartType": "line"
  },
  "adm_stat_3": {
    "name": "Ranks Count by Community (OC Academic)",
    "description": "Count of records processed for General academic OC category.",
    "query": "SELECT year as label, COUNT(*) as value FROM admissions GROUP BY year ORDER BY year ASC",
    "chartType": "line"
  },
  "adm_stat_4": {
    "name": "Closing Rank 1 to 5,000 College Choices",
    "description": "Most common branch choices chosen by top 5,000 general rank holders.",
    "query": "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 1 AND 5000 GROUP BY branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_5": {
    "name": "Closing Rank 5,000 to 20,000 College Choices",
    "description": "Most common branch choices chosen by general rank 5,000 to 20,000.",
    "query": "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 5000 AND 20000 GROUP BY branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_6": {
    "name": "Closing Rank 20,000 to 50,000 College Choices",
    "description": "Most common branch choices chosen by general rank 20,000 to 50,000.",
    "query": "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 20000 AND 50000 GROUP BY branch_code ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_7": {
    "name": "Average District College Density (2025)",
    "description": "The average number of engineering colleges per district hub.",
    "query": "SELECT 'Average colleges per district' as label, COUNT(DISTINCT a.college_code) / COUNT(DISTINCT c.district) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025",
    "chartType": "bar"
  },
  "adm_stat_8": {
    "name": "Number of Self-Financing Private Colleges by District",
    "description": "Count of private self-financing colleges in engineering hubs.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' GROUP BY c.district ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_9": {
    "name": "Number of Government engineering Colleges by District",
    "description": "Count of Government engineering colleges in engineering hubs.",
    "query": "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' GROUP BY c.district ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "adm_stat_10": {
    "name": "Total Database Admission Rows by Year",
    "description": "Yearly count of general academic OC rows loaded in database.",
    "query": "SELECT year as label, COUNT(*) as value FROM admissions GROUP BY year ORDER BY year ASC",
    "chartType": "line"
  },
  "stu_ins_1": {
    "name": "Top 10 Colleges with Biggest General Rank Rise (Boom)",
    "description": "Colleges whose closing rank improved/jumped the most from 2024 to 2025.",
    "query": "SELECT col.college_name as label, (AVG(c24.closing_rank) - AVG(c25.closing_rank)) as value FROM admissions c25 JOIN admissions c24 ON c25.college_code = c24.college_code AND c25.branch_code = c24.branch_code JOIN colleges col ON c25.college_code = col.college_code WHERE c25.year = 2025 AND c24.year = 2024 AND c25.closing_rank IS NOT NULL AND c24.closing_rank IS NOT NULL GROUP BY c25.college_code HAVING value > 1000 ORDER BY value DESC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_2": {
    "name": "High-Demand Niche Courses (Ranks under 20k)",
    "description": "Niche engineering branches (BioTech, Food, Marine) closing under rank 20,000.",
    "query": "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank < 20000 AND branch_code IN ('BT', 'BM', 'FD', 'MR', 'PA') GROUP BY branch_code ORDER BY value DESC",
    "chartType": "bar"
  },
  "stu_ins_3": {
    "name": "Ranks Comparison for Food Technology Branches",
    "description": "Compare closing general ranks for Food Technology across colleges.",
    "query": "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='FD' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_4": {
    "name": "Ranks Comparison for Biomedical Engineering",
    "description": "Compare closing general ranks for Biomedical Engineering across colleges.",
    "query": "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='BM' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_5": {
    "name": "Ranks Comparison for Agricultural Engineering",
    "description": "Compare closing general ranks for Agricultural Engineering.",
    "query": "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='AG' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_6": {
    "name": "Ranks Comparison for Textile Technology",
    "description": "Compare closing general ranks for Textile and Fashion technology.",
    "query": "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code IN ('TX', 'FT', 'TT') AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_7": {
    "name": "Top Colleges for Sandwich Courses",
    "description": "Sandwich engineering course ranks (5-year engineering programs).",
    "query": "SELECT c.college_name || ' (' || a.branch_code || ')' as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code JOIN branches b ON a.branch_code = b.branch_code WHERE a.year=2025 AND b.branch_name LIKE '%sandwich%' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_8": {
    "name": "Top Choices in Tier-2/Tier-3 Cities",
    "description": "Compare ranks of top colleges in smaller cities (Karaikudi, Nagercoil, Tuticorin).",
    "query": "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('SIVAGANGAI', 'KANYAKUMARI', 'TUTICORIN') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10",
    "chartType": "bar"
  },
  "stu_ins_9": {
    "name": "Branch Count vs Average Closing Rank correlation",
    "description": "Identify whether offering more courses correlates to better ranks.",
    "query": "SELECT COUNT(DISTINCT branch_code) as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 GROUP BY college_code ORDER BY label ASC LIMIT 15",
    "chartType": "line"
  },
  "stu_ins_10": {
    "name": "Ranks Spread inside Top 5 Colleges",
    "description": "Min vs Max closing rank ranges for top colleges (CEG, PSG, SSN, etc.).",
    "query": "SELECT c.college_name as label, (MAX(a.closing_rank) - MIN(a.closing_rank)) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.college_code IN (1, 2006, 1315, 2712, 1399) GROUP BY a.college_code",
    "chartType": "bar"
  }
};

  let db = null;
  let dbReadyPromise = null;

  // Set up loading indicator in DOM
  function showDatabaseLoader() {
    let loader = document.getElementById('db-loading-overlay');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'db-loading-overlay';
      loader.innerHTML = `
        <div class="db-loader-content" style="
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.95);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          font-family: 'Inter', sans-serif;
        ">
          <div class="spinner" style="
            width: 50px;
            height: 50px;
            border: 4px solid rgba(99, 102, 241, 0.1);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1.5rem;
          "></div>
          <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700;">Initializing SQLite Engine...</h2>
          <p style="margin: 0; color: #9ca3af; font-size: 0.95rem;">Downloading database (1.7 MB). Please wait a moment.</p>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
      document.body.appendChild(loader);
    }
  }

  function hideDatabaseLoader() {
    const loader = document.getElementById('db-loading-overlay');
    if (loader) {
      loader.style.transition = 'opacity 0.4s ease';
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 400);
    }
  }

  // Initialize sql.js and load database
  async function initDatabase() {
    // Check if running on file:// scheme
    if (window.location.protocol === 'file:') {
      showFileSchemeWarning();
      return;
    }
    showDatabaseLoader();
    try {
      // Load sql.js WebAssembly
      const config = {
        locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${filename}`
      };
      const SQL = await initSqlJs(config);
      
      // Fetch database binary
      const res = await originalFetch(DB_PATH);
      if (!res.ok) throw new Error('Failed to download database binary (' + DB_PATH + ')');
      
      const buffer = await res.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buffer));
      console.log('SQLite WebAssembly Engine loaded successfully');
    } catch (err) {
      console.error('Failed to initialize local SQLite database:', err);
      alert('Error loading database. Please make sure you are running a local server or hosting on GitHub Pages.');
    } finally {
      hideDatabaseLoader();
    }
  }

  // Helper to show a warning when loaded directly via file://
  function showFileSchemeWarning() {
    let loader = document.getElementById('db-loading-overlay');
    if (loader) loader.remove();
    
    const warning = document.createElement('div');
    warning.id = 'db-loading-overlay';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.98);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        font-family: 'Inter', sans-serif;
        padding: 2rem;
        text-align: center;
      ">
        <div style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
        <h2 style="margin: 0 0 1rem 0; font-size: 1.75rem; font-weight: 700; color: #f43f5e;">Browser Security Restriction</h2>
        <p style="margin: 0 0 1.5rem 0; color: #cbd5e1; font-size: 1.05rem; max-width: 550px; line-height: 1.6;">
          You opened the file by double-clicking <strong>index.html</strong>. Modern browsers block database loading on <code>file://</code> URLs for security reasons (CORS).
        </p>
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 1.25rem; max-width: 550px; text-align: left; margin-bottom: 2rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #38bdf8;">How to see your website working:</h4>
          <ol style="margin: 0; padding-left: 1.25rem; color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">
            <li><strong>Host it on GitHub Pages:</strong> Upload these files to GitHub. It will run perfectly online!</li>
            <li><strong>Run your local server:</strong> Keep Python running and visit <a href="http://localhost:8000" target="_blank" style="color: #6366f1; text-decoration: underline; font-weight: 600;">http://localhost:8000</a> in your browser.</li>
          </ol>
        </div>
      </div>
    `;
    document.body.appendChild(warning);
  }

  // Execute SQL statement and return rows as list of objects
  function dbQuery(sql, params = []) {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }
    try {
      const res = db.exec(sql, params);
      if (res.length === 0) return [];
      const { columns, values } = res[0];
      return values.map(row => {
        const obj = {};
        columns.forEach((col, idx) => {
          // Strip any table prefix (e.g. "a.college_code" becomes "college_code")
          const cleanCol = col.includes('.') ? col.split('.').pop() : col;
          obj[cleanCol] = row[idx];
        });
        return obj;
      });
    } catch (e) {
      console.error('SQL Execution Error:', e, 'Query:', sql, 'Params:', params);
      return [];
    }
  }

  // Start initialization immediately
  dbReadyPromise = initDatabase();

  // Intercept native fetch()
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    const urlStr = typeof url === 'string' ? url : (url.url || '');
    
    if (urlStr.includes('/api/')) {
      await dbReadyPromise;
      try {
        return await handleLocalApiRequest(urlStr, options);
      } catch (err) {
        console.error('Local API route error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return originalFetch(url, options);
  };

  // Client-side API Route Handlers
  async function handleLocalApiRequest(urlStr, options) {
    const urlObj = new URL(urlStr, window.location.origin);
    const path = urlObj.pathname;
    const params = urlObj.searchParams;

    let resData = null;
    let status = 200;

    if (path === '/api/filters') {
      const districtsRows = dbQuery("SELECT DISTINCT district FROM colleges WHERE district IS NOT NULL AND district != '' ORDER BY district");
      const branchesRows = dbQuery("SELECT branch_code, branch_name FROM branches WHERE branch_code IS NOT NULL AND branch_code != '' ORDER BY branch_code");
      const tiersRows = dbQuery("SELECT DISTINCT institution_type FROM colleges WHERE institution_type IS NOT NULL AND institution_type != '' ORDER BY institution_type");

      resData = {
        districts: districtsRows.map(r => r.district),
        branches: branchesRows.map(r => ({ code: r.branch_code.trim().toUpperCase(), name: r.branch_name.trim() })),
        tiers: tiersRows.map(r => r.institution_type)
      };

    } else if (path === '/api/colleges') {
      const page = parseInt(params.get('page') || '1', 10);
      const limit = parseInt(params.get('limit') || '25', 10);
      const year = params.get('year') || '2025';
      const district = params.get('district') || 'All';
      const branch = params.get('branch') || 'All';
      const tier = params.get('tier') || 'All';
      const sortBy = params.get('sortBy') || 'rank-asc';
      const search = params.get('search');

      const offset = (page - 1) * limit;
      const whereClauses = ["a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"];
      const queryArgs = [];

      if (year !== 'All') {
        whereClauses.push("a.year = ?");
        queryArgs.push(parseInt(year, 10));
      }
      if (district !== 'All') {
        whereClauses.push("c.district = ?");
        queryArgs.push(district);
      }
      if (branch !== 'All') {
        whereClauses.push("a.branch_code = ?");
        queryArgs.push(branch);
      }
      if (tier !== 'All') {
        whereClauses.push("c.institution_type = ?");
        queryArgs.push(tier);
      }
      if (search) {
        const searchClean = search.strip ? search.strip() : search.trim();
        if (/^\d+$/.test(searchClean)) {
          whereClauses.push("a.college_code = ?");
          queryArgs.push(parseInt(searchClean, 10));
        } else {
          whereClauses.push("LOWER(c.college_name) LIKE ?");
          queryArgs.push(`%${searchClean.toLowerCase()}%`);
        }
      }

      const whereStmt = whereClauses.join(" AND ");
      
      // Count total matches
      const countSql = `
        SELECT COUNT(*) as total 
        FROM admissions a
        JOIN colleges c ON a.college_code = c.college_code
        JOIN branches b ON a.branch_code = b.branch_code
        WHERE ${whereStmt}
      `;
      const countRes = dbQuery(countSql, queryArgs);
      const totalCount = countRes.length > 0 ? countRes[0].total : 0;

      // Determine sorting
      let orderStmt = "a.closing_rank ASC";
      if (sortBy === 'rank-asc') orderStmt = "a.closing_rank ASC";
      else if (sortBy === 'rank-desc') orderStmt = "a.closing_rank DESC";
      else if (sortBy === 'name-asc') orderStmt = "c.college_name ASC";

      // Fetch records
      const dataSql = `
        SELECT a.year, a.college_code, c.college_name, a.branch_code, b.branch_name,
               a.opening_cutoff, a.closing_cutoff, a.opening_rank, a.closing_rank, c.district, c.institution_type
        FROM admissions a
        JOIN colleges c ON a.college_code = c.college_code
        JOIN branches b ON a.branch_code = b.branch_code
        WHERE ${whereStmt}
        ORDER BY ${orderStmt}
        LIMIT ? OFFSET ?
      `;
      const dataRes = dbQuery(dataSql, [...queryArgs, limit, offset]);

      const data = dataRes.map(row => ({
        "Year": row.year,
        "College Code": row.college_code,
        "College Name": row.college_name,
        "Branch Code": row.branch_code,
        "Branch Name": row.branch_name,
        "Opening Cutoff": row.opening_cutoff,
        "Closing Cutoff": row.closing_cutoff,
        "Opening Rank": row.opening_rank,
        "Closing Rank": row.closing_rank,
        "District": row.district,
        "Institution Type": row.institution_type
      }));

      resData = {
        total: totalCount,
        page: page,
        limit: limit,
        data: data
      };

    } else if (path === '/api/branches') {
      const search = params.get('search') || '';
      const year = params.get('year') || '2025';

      const whereClauses = ["a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"];
      const queryArgs = [];

      if (year !== 'All') {
        whereClauses.push("a.year = ?");
        queryArgs.push(parseInt(year, 10));
      }
      if (search.trim()) {
        whereClauses.push("(LOWER(a.branch_code) LIKE ? OR LOWER(b.branch_name) LIKE ?)");
        const s = `%${search.trim().toLowerCase()}%`;
        queryArgs.push(s, s);
      }

      const whereStmt = whereClauses.join(" AND ");
      const sql = `
        SELECT a.branch_code, b.branch_name,
               COUNT(DISTINCT a.college_code) as college_count,
               MIN(a.closing_rank) as min_rank,
               MAX(a.closing_rank) as max_rank
        FROM admissions a
        JOIN branches b ON a.branch_code = b.branch_code
        WHERE ${whereStmt}
        GROUP BY a.branch_code
        ORDER BY college_count DESC
      `;
      const rows = dbQuery(sql, queryArgs);
      
      const branchesDict = {};
      rows.forEach(r => {
        const code = r.branch_code.trim().toUpperCase();
        if (!branchesDict[code]) {
          branchesDict[code] = {
            code: code,
            name: r.branch_name.trim(),
            college_count: r.college_count,
            min_rank: r.min_rank,
            max_rank: r.max_rank
          };
        }
      });
      resData = Object.values(branchesDict);

    } else if (path === '/api/branch-colleges') {
      const code = params.get('code') || '';
      const year = params.get('year') || '2025';

      if (!code) {
        status = 400;
        resData = { error: "Branch code is required" };
      } else {
        const sql = `
          SELECT a.college_code, c.college_name, a.branch_code, b.branch_name,
                 a.opening_rank, a.closing_rank, c.district, c.institution_type
          FROM admissions a
          JOIN colleges c ON a.college_code = c.college_code
          JOIN branches b ON a.branch_code = b.branch_code
          WHERE a.year = ? AND a.branch_code = ? AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
          ORDER BY a.closing_rank ASC
        `;
        const rows = dbQuery(sql, [parseInt(year, 10), code]);
        resData = rows.map(row => ({
          "College Code": row.college_code,
          "College Name": row.college_name,
          "Branch Code": row.branch_code,
          "Branch Name": row.branch_name,
          "Opening Rank": row.opening_rank,
          "Closing Rank": row.closing_rank,
          "District": row.district,
          "Institution Type": row.institution_type
        }));
      }

    } else if (path === '/api/predict') {
      const rank = params.get('rank');
      const cutoff = params.get('cutoff');
      const district = params.get('district') || 'All';
      const branch = params.get('branch') || 'All';
      const tier = params.get('tier') || 'All';

      let rankVal = null;
      let cutoffVal = null;

      if (rank && rank !== 'null' && rank.trim() !== '') rankVal = parseInt(rank, 10);
      if (cutoff && cutoff !== 'null' && cutoff.trim() !== '') cutoffVal = parseFloat(cutoff);

      if (rankVal === null && cutoffVal === null) {
        status = 400;
        resData = { error: "Either Rank or Cutoff is required for predictions" };
      } else {
        const whereClauses = ["a.year = 2025", "a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"];
        const queryArgs = [];

        if (district !== 'All') {
          whereClauses.push("c.district = ?");
          queryArgs.push(district);
        }
        if (branch !== 'All') {
          whereClauses.push("a.branch_code = ?");
          queryArgs.push(branch);
        }
        if (tier !== 'All') {
          whereClauses.push("c.institution_type = ?");
          queryArgs.push(tier);
        }

        const whereStmt = whereClauses.join(" AND ");
        const sql = `
          SELECT a.college_code, c.college_name, a.branch_code, b.branch_name,
                 a.opening_cutoff, a.closing_cutoff, a.opening_rank, a.closing_rank, c.district, c.institution_type
          FROM admissions a
          JOIN colleges c ON a.college_code = c.college_code
          JOIN branches b ON a.branch_code = b.branch_code
          WHERE ${whereStmt}
          ORDER BY a.closing_rank ASC
        `;
        const rows = dbQuery(sql, queryArgs);

        const safe = [];
        const moderate = [];
        const reach = [];

        rows.forEach(row => {
          const closing_rank = row.closing_rank;
          const closing_cutoff = row.closing_cutoff;

          if (closing_rank === null) return;

          let isMatch = false;
          let category = null;

          if (rankVal !== null) {
            const ratio = rankVal / closing_rank;
            isMatch = ratio <= 1.30;
            if (ratio <= 0.85) category = 'safe';
            else if (ratio <= 1.15) category = 'moderate';
            else if (ratio <= 1.30) category = 'reach';
          } else {
            if (closing_cutoff === null) return;
            const diff = cutoffVal - closing_cutoff;
            isMatch = diff >= -5.0;
            if (diff >= 2.0) category = 'safe';
            else if (diff >= -2.0) category = 'moderate';
            else if (diff >= -5.0) category = 'reach';
          }

          if (!isMatch || !category) return;

          const item = {
            "College Code": row.college_code,
            "College Name": row.college_name,
            "Branch Code": row.branch_code,
            "Branch Name": row.branch_name,
            "Opening Cutoff": row.opening_cutoff,
            "Closing Cutoff": closing_cutoff,
            "Opening Rank": row.opening_rank,
            "Closing Rank": closing_rank,
            "District": row.district,
            "Institution Type": row.institution_type
          };

          if (category === 'safe') safe.push(item);
          else if (category === 'moderate') moderate.push(item);
          else if (category === 'reach') reach.push(item);
        });

        const topSafe = safe.slice(0, 25);
        const topMod = moderate.slice(0, 25);
        const topReach = reach.slice(0, 25);
        const allTop = [...topSafe, ...topMod, ...topReach];

        // Fetch YoY History
        const historyMap = {};
        if (allTop.length > 0) {
          const clauses = [];
          const args = [];
          allTop.forEach(item => {
            clauses.push("(college_code = ? AND branch_code = ?)");
            args.push(item["College Code"], item["Branch Code"]);
          });

          const histSql = `
            SELECT college_code, branch_code, year, closing_cutoff, closing_rank
            FROM admissions
            WHERE year IN (2023, 2024, 2025) AND (${clauses.join(' OR ')})
          `;
          const histRows = dbQuery(histSql, args);
          histRows.forEach(hr => {
            const key = `${hr.college_code}|${hr.branch_code}`;
            if (!historyMap[key]) historyMap[key] = {};
            historyMap[key][String(hr.year)] = {
              cutoff: hr.closing_cutoff,
              rank: hr.closing_rank
            };
          });
        }

        allTop.forEach(item => {
          const key = `${item["College Code"]}|${item["Branch Code"]}`;
          item["History"] = historyMap[key] || {};
        });

        resData = {
          rank: rankVal,
          cutoff: cutoffVal,
          safe: topSafe,
          moderate: topMod,
          reach: topReach
        };
      }

    } else if (path === '/api/trends') {
      const college = params.get('college') || '';
      const branchName = params.get('branch') || '';

      if (!college || !branchName) {
        status = 400;
        resData = { error: "College and Branch are required" };
      } else {
        const sql = `
          SELECT a.year, a.closing_rank
          FROM admissions a
          JOIN branches b ON a.branch_code = b.branch_code
          WHERE a.college_code = ? AND b.branch_name = ? AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
          ORDER BY a.year ASC
        `;
        const rows = dbQuery(sql, [parseInt(college, 10), branchName]);
        resData = {
          years: rows.map(r => r.year),
          ranks: rows.map(r => r.closing_rank)
        };
      }

    } else if (path === '/api/trend-colleges') {
      const sql = `
        SELECT a.college_code, c.college_name, MIN(a.closing_rank) as min_rank
        FROM admissions a
        JOIN colleges c ON a.college_code = c.college_code
        WHERE a.year = 2025 AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
        GROUP BY a.college_code
        ORDER BY min_rank ASC
        LIMIT 30
      `;
      const rows = dbQuery(sql);
      resData = rows.map(row => ({
        code: row.college_code,
        name: row.college_name
      }));

    } else if (path === '/api/analytics') {
      const moduleId = params.get('module') || 'col_comp_1';
      if (!MODULES_INVENTORY[moduleId]) {
        status = 400;
        resData = { error: "Invalid module ID in inventory" };
      } else {
        const module = MODULES_INVENTORY[moduleId];
        const rows = dbQuery(module.query);
        const dataPoints = rows.map(r => {
          const keys = Object.keys(r);
          return {
            label: String(r[keys[0]]),
            value: typeof r[keys[1]] === 'number' ? Math.round(r[keys[1]] * 100) / 100 : r[keys[1]]
          };
        });

        resData = {
          id: moduleId,
          name: module.name,
          description: module.description,
          chartType: module.chartType,
          data: dataPoints
        };
      }

    } else if (path === '/api/dash-summary') {
      // 1. Total counts
      const totalColleges = dbQuery("SELECT COUNT(*) as cnt FROM colleges")[0].cnt;
      const totalBranches = dbQuery("SELECT COUNT(*) as cnt FROM branches")[0].cnt;
      const totalYears = dbQuery("SELECT COUNT(DISTINCT year) as cnt FROM admissions")[0].cnt;
      const totalAdmissions = dbQuery("SELECT COUNT(*) as cnt FROM admissions")[0].cnt;

      // 2. Institution Type counts
      const instTypeRows = dbQuery(`
        SELECT institution_type, COUNT(*) as cnt
        FROM colleges 
        WHERE institution_type IS NOT NULL AND institution_type != ''
        GROUP BY institution_type
        ORDER BY institution_type
      `);
      const instTypeData = instTypeRows.map(r => ({ label: r.institution_type, value: r.cnt }));

      // 3. Top districts by college count
      const districtRows = dbQuery(`
        SELECT district, COUNT(*) as cnt
        FROM colleges 
        WHERE district IS NOT NULL AND district != ''
        GROUP BY district 
        ORDER BY cnt DESC 
        LIMIT 10
      `);
      const districtData = districtRows.map(r => ({ label: r.district, value: r.cnt }));

      // 4. Top branches by college count in 2025
      const branchRows = dbQuery(`
        SELECT branch_code, COUNT(DISTINCT college_code) as cnt
        FROM admissions 
        WHERE year = 2025
        GROUP BY branch_code 
        ORDER BY cnt DESC 
        LIMIT 10
      `);
      const branchData = branchRows.map(r => ({ label: r.branch_code, value: r.cnt }));

      // 5. Average closing rank by district in 2025
      const rankRows = dbQuery(`
        SELECT c.district, AVG(a.closing_rank) as avg_rank
        FROM admissions a
        JOIN colleges c ON a.college_code = c.college_code
        WHERE a.year = 2025 AND a.closing_rank IS NOT NULL
        GROUP BY c.district
        ORDER BY avg_rank ASC
        LIMIT 10
      `);
      const rankData = rankRows.map(r => ({ label: r.district, value: Math.round(r.avg_rank) }));

      resData = {
        metrics: {
          colleges: totalColleges,
          branches: totalBranches,
          years: totalYears,
          admissions: totalAdmissions
        },
        instType: instTypeData,
        districts: districtData,
        branches: branchData,
        ranks: rankData
      };
    }

    return new Response(JSON.stringify(resData), {
      status: status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }

  // Expose the ready promise
  window.dbReadyPromise = dbReadyPromise;

})();
