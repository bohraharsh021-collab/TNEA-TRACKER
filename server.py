import os
import json
import sqlite3
import urllib.parse
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

PORT = 8000
DB_PATH = os.path.join(os.path.dirname(__file__), 'tnea.db')

# Define the 100 Analytics Modules organized in 10 categories
MODULES_INVENTORY = {
    # 1. College Comparisons
    "col_comp_1": (
        "Top CSE Colleges (2025)", "Rankings of top 10 colleges for Computer Science Engineering based on closing ranks.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='CS' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_2": (
        "Top ECE Colleges (2025)", "Rankings of top 10 colleges for Electronics & Communication Engineering.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='EC' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_3": (
        "Top IT Colleges (2025)", "Rankings of top 10 colleges for Information Technology.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='IT' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_4": (
        "Top Artificial Intelligence & Data Science Colleges", "Compare the closing ranks of top colleges offering AI & DS.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='AD' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_5": (
        "Chennai vs Coimbatore Top Colleges", "Head-to-head comparison of top colleges in Chennai vs Coimbatore.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_6": (
        "Top Mechanical Engineering Colleges (2025)", "Rankings of top 10 colleges for Mechanical Engineering.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='ME' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_7": (
        "Top Civil Engineering Colleges (2025)", "Rankings of top 10 colleges for Civil Engineering.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='CE' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_8": (
        "Top Government Aided Private Colleges", "Compare closing ranks across top Government-Aided private colleges.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.college_name LIKE '%aided%' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "col_comp_9": (
        "Top University Departments (Anna University)", "Compare CEG, MIT, ACT, and SAP campus departments.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.college_code IN (1, 2, 4) AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC", "bar"
    ),
    "col_comp_10": (
        "Top Self-Financing Colleges (2025)", "Top 10 self-financing engineering colleges by closing rank.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),

    # 2. Branch Popularity
    "br_pop_1": (
        "Top 10 Branches by College Count", "Branches offered by the highest number of engineering colleges.",
        "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 GROUP BY branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "br_pop_2": (
        "CSE & Allied Branches Density", "Compare the number of colleges offering CSE, Cybersecurity, AI/ML, and Data Science.",
        "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND (branch_code LIKE 'CS%' OR branch_code='AD' OR branch_code='IT') GROUP BY branch_code ORDER BY value DESC", "bar"
    ),
    "br_pop_3": (
        "ECE and EEE Coverage", "Colleges offering Electronics & Communication vs Electrical & Electronics.",
        "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('EC', 'EE') GROUP BY branch_code", "bar"
    ),
    "br_pop_4": (
        "Core Engineering Branches College Count", "Comparison of college count offering Civil, Mechanical, EEE, and Chemical.",
        "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('CE', 'ME', 'EE', 'CH') GROUP BY branch_code ORDER BY value DESC", "bar"
    ),
    "br_pop_5": (
        "Emerging Technologies College Counts", "Offered counts of newly emerging technology courses.",
        "SELECT branch_code as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code IN ('AD', 'AL', 'SC', 'CY', 'CD') GROUP BY branch_code ORDER BY value DESC", "bar"
    ),
    "br_pop_6": (
        "Tamil Medium Branches Offering", "Offered counts of Tamil Medium courses in Civil and Mechanical.",
        "SELECT b.branch_name as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN branches b ON a.branch_code = b.branch_code WHERE a.year=2025 AND a.branch_code IN ('XC', 'XM') GROUP BY a.branch_code", "bar"
    ),
    "br_pop_7": (
        "Branch Popularity in Government Colleges", "Most common branches offered by Government Engineering Colleges.",
        "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "br_pop_8": (
        "Branch Popularity in Autonomous Colleges", "Most common branches offered by Autonomous Private Colleges.",
        "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "br_pop_9": (
        "Branch Popularity in Non-Autonomous Colleges", "Most common branches offered by Non-Autonomous Private Colleges.",
        "SELECT a.branch_code as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' GROUP BY a.branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "br_pop_10": (
        "AI & Data Science College Growth (2022-2025)", "Growth in number of colleges offering Artificial Intelligence and Data Science.",
        "SELECT year as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE branch_code='AD' GROUP BY year ORDER BY year ASC", "line"
    ),

    # 3. Seat Distribution
    "seat_dist_1": (
        "Colleges Offering 5+ Branches", "Count of colleges offering 5 or more distinct engineering courses.",
        "SELECT 'Colleges with 5+ Courses' as label, COUNT(*) as value FROM (SELECT college_code FROM admissions WHERE year=2025 GROUP BY college_code HAVING COUNT(DISTINCT branch_code) >= 5)", "bar"
    ),
    "seat_dist_2": (
        "Colleges Offering 10+ Branches", "Count of colleges offering 10 or more distinct engineering courses.",
        "SELECT 'Colleges with 10+ Courses' as label, COUNT(*) as value FROM (SELECT college_code FROM admissions WHERE year=2025 GROUP BY college_code HAVING COUNT(DISTINCT branch_code) >= 10)", "bar"
    ),
    "seat_dist_3": (
        "Branch Variety Count by District", "Count of unique courses offered in top 10 districts.",
        "SELECT c.district as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.district ORDER BY value DESC LIMIT 10", "bar"
    ),
    "seat_dist_4": (
        "Top 10 Colleges with Maximum Branch Variety", "Colleges offering the widest list of course options.",
        "SELECT c.college_name as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY a.college_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "seat_dist_5": (
        "Branch Density in Government vs Autonomous", "Average number of courses offered per college in Gov vs Autonomous.",
        "SELECT c.institution_type as label, COUNT(*) / COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.institution_type", "bar"
    ),
    "seat_dist_6": (
        "Colleges Offering CSE (CS)", "Total colleges offering Computer Science Engineering.",
        "SELECT 'Offering CSE' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='CS'", "bar"
    ),
    "seat_dist_7": (
        "Colleges Offering ECE (EC)", "Total colleges offering Electronics & Communication Engineering.",
        "SELECT 'Offering ECE' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='EC'", "bar"
    ),
    "seat_dist_8": (
        "Colleges Offering MECH (ME)", "Total colleges offering Mechanical Engineering.",
        "SELECT 'Offering MECH' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='ME'", "bar"
    ),
    "seat_dist_9": (
        "Colleges Offering CIVIL (CE)", "Total colleges offering Civil Engineering.",
        "SELECT 'Offering CIVIL' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='CE'", "bar"
    ),
    "seat_dist_10": (
        "Colleges Offering AI & DS (AD)", "Total colleges offering Artificial Intelligence and Data Science.",
        "SELECT 'Offering AI & DS' as label, COUNT(DISTINCT college_code) as value FROM admissions WHERE year=2025 AND branch_code='AD'", "bar"
    ),

    # 4. Rank Analysis
    "rank_ana_1": (
        "Courses Closing Under Rank 10,000", "Number of college-course options closing under general rank 10,000.",
        "SELECT 'Rank < 10k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank < 10000", "bar"
    ),
    "rank_ana_2": (
        "Courses Closing Between Ranks 10,000 & 50,000", "Number of options closing in the mid-high range.",
        "SELECT 'Rank 10k-50k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 10000 AND 50000", "bar"
    ),
    "rank_ana_3": (
        "Courses Closing Between Ranks 50,000 & 100,000", "Number of options closing in the mid range.",
        "SELECT 'Rank 50k-100k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 50000 AND 100000", "bar"
    ),
    "rank_ana_4": (
        "Courses Closing Above Rank 100,000", "Number of options closing in the high range.",
        "SELECT 'Rank > 100k' as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank > 100000", "bar"
    ),
    "rank_ana_5": (
        "Average Closing Rank by District", "Average closing general rank of all courses by district.",
        "SELECT c.district as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.closing_rank IS NOT NULL GROUP BY c.district ORDER BY value ASC LIMIT 15", "bar"
    ),
    "rank_ana_6": (
        "Average Closing Rank by Institution Type", "Average closing general rank in Gov vs Autonomous vs Non-Autonomous.",
        "SELECT c.institution_type as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.closing_rank IS NOT NULL GROUP BY c.institution_type ORDER BY value ASC", "bar"
    ),
    "rank_ana_7": (
        "Rank Spread (Min/Max) for CSE (2025)", "The lowest vs highest closing rank for Computer Science Engineering.",
        "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='CS' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='CS' AND closing_rank IS NOT NULL", "bar"
    ),
    "rank_ana_8": (
        "Rank Spread (Min/Max) for ECE (2025)", "The lowest vs highest closing rank for Electronics & Communication.",
        "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='EC' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='EC' AND closing_rank IS NOT NULL", "bar"
    ),
    "rank_ana_9": (
        "Rank Spread (Min/Max) for MECH (2025)", "The lowest vs highest closing rank for Mechanical Engineering.",
        "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='ME' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='ME' AND closing_rank IS NOT NULL", "bar"
    ),
    "rank_ana_10": (
        "Rank Spread (Min/Max) for CIVIL (2025)", "The lowest vs highest closing rank for Civil Engineering.",
        "SELECT 'Min Rank (Best)' as label, MIN(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code='CE' AND closing_rank IS NOT NULL UNION ALL SELECT 'Max Rank', MAX(closing_rank) FROM admissions WHERE year=2025 AND branch_code='CE' AND closing_rank IS NOT NULL", "bar"
    ),

    # 5. Historical Trends
    "hist_tr_1": (
        "CEG Campus CSE YoY Rank Shift", "Closing rank YoY shift for CSE at CEG Campus.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_2": (
        "MIT Campus ECE YoY Rank Shift", "Closing rank YoY shift for ECE at MIT Campus.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=4 AND branch_code='EC' ORDER BY year ASC", "line"
    ),
    "hist_tr_3": (
        "PSG Tech CSE YoY Rank Shift", "Closing rank YoY shift for CSE at PSG College of Technology.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2006 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_4": (
        "SSN CSE YoY Rank Shift", "Closing rank YoY shift for CSE at SSN College of Engineering.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1315 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_5": (
        "CIT Chennai CSE YoY Rank Shift", "Closing rank YoY shift for CSE at Chennai Institute of Technology.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1399 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_6": (
        "Kumaraguru CSE YoY Rank Shift", "Closing rank YoY shift for CSE at Kumaraguru College of Technology.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2712 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_7": (
        "GCT Coimbatore CSE YoY Rank Shift", "Closing rank YoY shift for CSE at Government College of Technology.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2005 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_8": (
        "Thiagarajar EEE YoY Rank Shift", "Closing rank YoY shift for EEE at Thiagarajar College of Engineering.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=5008 AND branch_code='EE' ORDER BY year ASC", "line"
    ),
    "hist_tr_9": (
        "Coimbatore Inst of Tech CSE YoY Rank Shift", "Closing rank YoY shift for CSE at Coimbatore Institute of Technology.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=2007 AND branch_code='CS' ORDER BY year ASC", "line"
    ),
    "hist_tr_10": (
        "Sri Venkateswara CSE YoY Rank Shift", "Closing rank YoY shift for CSE at Sri Venkateswara College of Engineering.",
        "SELECT year as label, closing_rank as value FROM admissions WHERE college_code=1219 AND branch_code='CS' ORDER BY year ASC", "line"
    ),

    # 6. Region-wise Analysis
    "reg_ana_1": (
        "Top 10 Colleges in Chennai District", "Top 10 colleges in Chennai district based on closing general rank (2025).",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='CHENNAI' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "reg_ana_2": (
        "Top 10 Colleges in Coimbatore District", "Top 10 colleges in Coimbatore district based on closing general rank.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='COIMBATORE' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "reg_ana_3": (
        "Top 10 Colleges in Madurai District", "Top 10 colleges in Madurai region.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='MADURAI' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "reg_ana_4": (
        "Top 10 Colleges in Trichy District", "Top 10 colleges in Tiruchirappalli region.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND (c.district='TIRUCHIRAPALLI' OR c.district='TRICHIRAPPALLI') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "reg_ana_5": (
        "Top 10 Colleges in Salem District", "Top 10 colleges in Salem region.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district='SALEM' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "reg_ana_6": (
        "Region-wise Average Closing Rank Comparison", "Compare average closing general ranks of top 8 engineering hubs.",
        "SELECT c.district as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE', 'MADURAI', 'SALEM', 'TIRUCHIRAPALLI', 'TRICHIRAPPALLI', 'KANCHEEPURAM', 'CHENGALPET') AND a.closing_rank IS NOT NULL GROUP BY c.district ORDER BY value ASC", "bar"
    ),
    "reg_ana_7": (
        "Colleges Count: Chennai vs Coimbatore", "Colleges count in Chennai vs Coimbatore districts.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('CHENNAI', 'COIMBATORE') GROUP BY c.district", "bar"
    ),
    "reg_ana_8": (
        "Colleges Count in Southern Districts", "Count of colleges in Madurai, Kanyakumari, Tirunelveli, and Tuticorin.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('MADURAI', 'KANYAKUMARI', 'TIRUNELVELI', 'TUTICORIN') GROUP BY c.district ORDER BY value DESC", "bar"
    ),
    "reg_ana_9": (
        "Colleges Count in Western Districts", "Count of colleges in Erode, Namakkal, Tiruppur, and Karur.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('ERODE', 'NAMAKKAL', 'TIRUPPUR', 'KARUR') GROUP BY c.district ORDER BY value DESC", "bar"
    ),
    "reg_ana_10": (
        "Colleges Count in Northern Districts", "Count of colleges in Thiruvallur, Kancheepuram, Chengalpet, and Vellore.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('THIRUVALLUR', 'KANCHEEPURAM', 'CHENGALPET', 'VELLORE') GROUP BY c.district ORDER BY value DESC", "bar"
    ),

    # 7. Institution-type Analysis
    "inst_ana_1": (
        "Government Colleges Minimum Closing Rank", "Top 10 Government engineering colleges by minimum closing rank.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "inst_ana_2": (
        "Autonomous Colleges Minimum Closing Rank", "Top 10 Autonomous private colleges by minimum closing rank.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "inst_ana_3": (
        "Non-Autonomous Colleges Minimum Closing Rank", "Top 10 Non-Autonomous private colleges by minimum closing rank.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "inst_ana_4": (
        "Government vs Autonomous Rank Range", "Compare average closing general ranks of Gov vs Autonomous.",
        "SELECT c.institution_type as label, AVG(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type IN ('Government Colleges', 'Autonomous Colleges') AND a.closing_rank IS NOT NULL GROUP BY c.institution_type", "bar"
    ),
    "inst_ana_5": (
        "Unique Branches Offered by Government Colleges", "Count of unique courses offered by Government colleges.",
        "SELECT 'Government Colleges' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges'", "bar"
    ),
    "inst_ana_6": (
        "Unique Branches Offered by Autonomous Colleges", "Count of unique courses offered by Autonomous colleges.",
        "SELECT 'Autonomous Colleges' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges'", "bar"
    ),
    "inst_ana_7": (
        "Unique Branches Offered by Non-Autonomous Colleges", "Count of unique courses offered by Non-Autonomous colleges.",
        "SELECT 'Non-Autonomous' as label, COUNT(DISTINCT a.branch_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges'", "bar"
    ),
    "inst_ana_8": (
        "Total Colleges Distribution by Type", "Total count of participating colleges in TNEA by type.",
        "SELECT c.institution_type as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 GROUP BY c.institution_type", "bar"
    ),
    "inst_ana_9": (
        "Top 10 Government College Ranks", "Compare ranks of top 10 Government college campuses.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "inst_ana_10": (
        "Top 10 Autonomous Private Ranks", "Compare ranks of top 10 Autonomous private colleges.",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Autonomous Colleges' AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),

    # 8. Branch Demand
    "br_dem_1": (
        "Top 10 Branches by Average Closing Rank (Demand)", "Branches with the lowest average closing general rank (highest demand).",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "br_dem_2": (
        "Average Closing Ranks for Computer Science Branches", "Compare average closing general ranks for CSE, AI, DS, and IT.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('CS', 'IT', 'AD', 'AL', 'CF') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_3": (
        "Average Closing Ranks for Information Technology (IT)", "Closing ranks of IT compared with CSE and Cyber Security.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('IT', 'CS', 'SC') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_4": (
        "Average Closing Ranks for ECE Branches", "Compare closing general ranks for ECE and advanced communication courses.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('EC', 'EA', 'ET') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_5": (
        "Average Closing Ranks for Electrical (EEE) Branches", "Compare EEE and associated instrumentation courses.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('EE', 'EI', 'IC') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_6": (
        "Average Closing Ranks for Biotechnology Branches", "Compare closing general ranks for Biotechnology and Biomedical.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('BT', 'BM', 'IB') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_7": (
        "Average Closing Ranks for AI & ML Branches", "Compare closing general ranks of AI/ML, AI/DS, and CSE(AI/ML).",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('AD', 'AL', 'AM', 'CG') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_8": (
        "Average Closing Ranks for Mech & Civil core Branches", "Compare Mechanical and Civil engineering closing general ranks.",
        "SELECT branch_code as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 AND branch_code IN ('ME', 'CE') AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value ASC", "bar"
    ),
    "br_dem_9": (
        "Branches with Biggest General Rank jumps YoY (2024-2025)", "Identify branches whose average closing rank improved significantly.",
        "SELECT c25.branch_code as label, (AVG(c24.closing_rank) - AVG(c25.closing_rank)) as value FROM admissions c25 JOIN admissions c24 ON c25.college_code=c24.college_code AND c25.branch_code=c24.branch_code WHERE c25.year=2025 AND c24.year=2024 AND c25.closing_rank IS NOT NULL AND c24.closing_rank IS NOT NULL GROUP BY c25.branch_code HAVING value > 0 ORDER BY value DESC LIMIT 10", "bar"
    ),
    "br_dem_10": (
        "Branches with Highest Variance in Closing Rank", "Branches that are offered across all tiers of colleges.",
        "SELECT branch_code as label, (MAX(closing_rank) - MIN(closing_rank)) as value FROM admissions WHERE year=2025 AND closing_rank IS NOT NULL GROUP BY branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),

    # 9. Admission Statistics
    "adm_stat_1": (
        "Participating Colleges count by Year", "Yearly trend of colleges participating in TNEA general academic counselling.",
        "SELECT year as label, COUNT(DISTINCT college_code) as value FROM admissions GROUP BY year ORDER BY year ASC", "line"
    ),
    "adm_stat_2": (
        "Unique Branch Codes Count by Year", "Yearly trend of unique branch codes listed in counselling.",
        "SELECT year as label, COUNT(DISTINCT branch_code) as value FROM admissions GROUP BY year ORDER BY year ASC", "line"
    ),
    "adm_stat_3": (
        "Ranks Count by Community (OC Academic)", "Count of records processed for General academic OC category.",
        "SELECT year as label, COUNT(*) as value FROM admissions GROUP BY year ORDER BY year ASC", "line"
    ),
    "adm_stat_4": (
        "Closing Rank 1 to 5,000 College Choices", "Most common branch choices chosen by top 5,000 general rank holders.",
        "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 1 AND 5000 GROUP BY branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "adm_stat_5": (
        "Closing Rank 5,000 to 20,000 College Choices", "Most common branch choices chosen by general rank 5,000 to 20,000.",
        "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 5000 AND 20000 GROUP BY branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "adm_stat_6": (
        "Closing Rank 20,000 to 50,000 College Choices", "Most common branch choices chosen by general rank 20,000 to 50,000.",
        "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank BETWEEN 20000 AND 50000 GROUP BY branch_code ORDER BY value DESC LIMIT 10", "bar"
    ),
    "adm_stat_7": (
        "Average District College Density (2025)", "The average number of engineering colleges per district hub.",
        "SELECT 'Average colleges per district' as label, COUNT(DISTINCT a.college_code) / COUNT(DISTINCT c.district) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025", "bar"
    ),
    "adm_stat_8": (
        "Number of Self-Financing Private Colleges by District", "Count of private self-financing colleges in engineering hubs.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Non-Autonomous Colleges' GROUP BY c.district ORDER BY value DESC LIMIT 10", "bar"
    ),
    "adm_stat_9": (
        "Number of Government engineering Colleges by District", "Count of Government engineering colleges in engineering hubs.",
        "SELECT c.district as label, COUNT(DISTINCT a.college_code) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.institution_type='Government Colleges' GROUP BY c.district ORDER BY value DESC LIMIT 10", "bar"
    ),
    "adm_stat_10": (
        "Total Database Admission Rows by Year", "Yearly count of general academic OC rows loaded in database.",
        "SELECT year as label, COUNT(*) as value FROM admissions GROUP BY year ORDER BY year ASC", "line"
    ),

    # 10. Other Meaningful Student Insights
    "stu_ins_1": (
        "Top 10 Colleges with Biggest General Rank Rise (Boom)", "Colleges whose closing rank improved/jumped the most from 2024 to 2025.",
        "SELECT col.college_name as label, (AVG(c24.closing_rank) - AVG(c25.closing_rank)) as value FROM admissions c25 JOIN admissions c24 ON c25.college_code = c24.college_code AND c25.branch_code = c24.branch_code JOIN colleges col ON c25.college_code = col.college_code WHERE c25.year = 2025 AND c24.year = 2024 AND c25.closing_rank IS NOT NULL AND c24.closing_rank IS NOT NULL GROUP BY c25.college_code HAVING value > 1000 ORDER BY value DESC LIMIT 10", "bar"
    ),
    "stu_ins_2": (
        "High-Demand Niche Courses (Ranks under 20k)", "Niche engineering branches (BioTech, Food, Marine) closing under rank 20,000.",
        "SELECT branch_code as label, COUNT(*) as value FROM admissions WHERE year=2025 AND closing_rank < 20000 AND branch_code IN ('BT', 'BM', 'FD', 'MR', 'PA') GROUP BY branch_code ORDER BY value DESC", "bar"
    ),
    "stu_ins_3": (
        "Ranks Comparison for Food Technology Branches", "Compare closing general ranks for Food Technology across colleges.",
        "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='FD' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_4": (
        "Ranks Comparison for Biomedical Engineering", "Compare closing general ranks for Biomedical Engineering across colleges.",
        "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='BM' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_5": (
        "Ranks Comparison for Agricultural Engineering", "Compare closing general ranks for Agricultural Engineering.",
        "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code='AG' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_6": (
        "Ranks Comparison for Textile Technology", "Compare closing general ranks for Textile and Fashion technology.",
        "SELECT c.college_name as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.branch_code IN ('TX', 'FT', 'TT') AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_7": (
        "Top Colleges for Sandwich Courses", "Sandwich engineering course ranks (5-year engineering programs).",
        "SELECT c.college_name || ' (' || a.branch_code || ')' as label, a.closing_rank as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code JOIN branches b ON a.branch_code = b.branch_code WHERE a.year=2025 AND b.branch_name LIKE '%sandwich%' AND a.closing_rank IS NOT NULL ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_8": (
        "Top Choices in Tier-2/Tier-3 Cities", "Compare ranks of top colleges in smaller cities (Karaikudi, Nagercoil, Tuticorin).",
        "SELECT c.college_name as label, MIN(a.closing_rank) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND c.district IN ('SIVAGANGAI', 'KANYAKUMARI', 'TUTICORIN') AND a.closing_rank IS NOT NULL GROUP BY a.college_code ORDER BY value ASC LIMIT 10", "bar"
    ),
    "stu_ins_9": (
        "Branch Count vs Average Closing Rank correlation", "Identify whether offering more courses correlates to better ranks.",
        "SELECT COUNT(DISTINCT branch_code) as label, AVG(closing_rank) as value FROM admissions WHERE year=2025 GROUP BY college_code ORDER BY label ASC LIMIT 15", "line"
    ),
    "stu_ins_10": (
        "Ranks Spread inside Top 5 Colleges", "Min vs Max closing rank ranges for top colleges (CEG, PSG, SSN, etc.).",
        "SELECT c.college_name as label, (MAX(a.closing_rank) - MIN(a.closing_rank)) as value FROM admissions a JOIN colleges c ON a.college_code = c.college_code WHERE a.year=2025 AND a.college_code IN (1, 2006, 1315, 2712, 1399) GROUP BY a.college_code", "bar"
    )
}

class TNEAApiHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Disable caching for all static assets and API responses
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        # Route API requests
        if path.startswith('/api/'):
            self.handle_api(path, query_params)
        else:
            # Fallback to serving static files from current directory
            super().do_GET()

    def handle_api(self, path, params):
        try:
            if path == '/api/filters':
                self.get_filters()
            elif path == '/api/colleges':
                self.get_colleges(params)
            elif path == '/api/branches':
                self.get_branches(params)
            elif path == '/api/branch-colleges':
                self.get_branch_colleges(params)
            elif path == '/api/predict':
                self.get_predictions(params)
            elif path == '/api/trends':
                self.get_trends(params)
            elif path == '/api/trend-colleges':
                self.get_trend_colleges()
            elif path == '/api/analytics':
                self.get_analytics(params)
            elif path == '/api/dash-summary':
                self.get_dash_summary()
            else:
                self.send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json({"error": str(e)}, 500)

    def send_json(self, data, status=200):
        try:
            response_bytes = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except BrokenPipeError:
            pass # Client disconnected early

    def get_db_connection(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Optimize performance
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.execute("PRAGMA cache_size=-64000")
        
        return conn

    # 1. API: Get Unique filters for dropdowns
    def get_filters(self):
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Districts
        cursor.execute("SELECT DISTINCT district FROM colleges WHERE district IS NOT NULL AND district != '' ORDER BY district")
        districts = [row['district'] for row in cursor.fetchall()]
        
        # Deduplicated Branches
        cursor.execute("""
            SELECT branch_code, branch_name 
            FROM branches 
            WHERE branch_code IS NOT NULL AND branch_code != '' 
            ORDER BY branch_code
        """)
        branches_raw = cursor.fetchall()
        branches_dict = {}
        for row in branches_raw:
            code = row['branch_code'].strip().upper()
            name = row['branch_name'].strip()
            if code not in branches_dict:
                branches_dict[code] = name
        
        branches = [{"code": code, "name": branches_dict[code]} for code in sorted(branches_dict.keys())]
        
        # Unique Institution Types (Government Colleges, Autonomous Colleges, Non-Autonomous Colleges)
        cursor.execute("SELECT DISTINCT institution_type FROM colleges WHERE institution_type IS NOT NULL AND institution_type != '' ORDER BY institution_type")
        tiers = [row['institution_type'] for row in cursor.fetchall()]
        
        conn.close()
        self.send_json({
            "districts": districts,
            "branches": branches,
            "tiers": tiers
        })

    # 2. API: Paginated & Filtered Colleges list
    def get_colleges(self, params):
        page = int(params.get('page', [1])[0])
        limit = int(params.get('limit', [25])[0])
        year = params.get('year', ['2025'])[0]
        district = params.get('district', ['All'])[0]
        branch = params.get('branch', ['All'])[0]
        tier = params.get('tier', ['All'])[0]
        sort_by = params.get('sortBy', ['rank-asc'])[0]
        search = params.get('search', [None])[0]

        offset = (page - 1) * limit

        conn = self.get_db_connection()
        cursor = conn.cursor()

        # Build query
        where_clauses = ["a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"]
        query_args = []

        if year != 'All':
            where_clauses.append("a.year = ?")
            query_args.append(int(year))

        if district != 'All':
            where_clauses.append("c.district = ?")
            query_args.append(district)

        if branch != 'All':
            where_clauses.append("a.branch_code = ?")
            query_args.append(branch)

        if tier != 'All':
            where_clauses.append("c.institution_type = ?")
            query_args.append(tier)

        if search:
            search_clean = search.strip()
            if search_clean.isdigit():
                where_clauses.append("a.college_code = ?")
                query_args.append(int(search_clean))
            else:
                where_clauses.append("LOWER(c.college_name) LIKE ?")
                query_args.append(f"%{search_clean.lower()}%")

        where_stmt = " AND ".join(where_clauses)

        # Count total matches
        count_query = f"""
            SELECT COUNT(*) as total 
            FROM admissions a
            JOIN colleges c ON a.college_code = c.college_code
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE {where_stmt}
        """
        cursor.execute(count_query, query_args)
        total_count = cursor.fetchone()['total']

        # Determine sorting
        order_stmt = "a.closing_rank ASC"
        if sort_by == 'rank-asc':
            order_stmt = "a.closing_rank ASC"
        elif sort_by == 'rank-desc':
            order_stmt = "a.closing_rank DESC"
        elif sort_by == 'name-asc':
            order_stmt = "c.college_name ASC"

        # Fetch records
        data_query = f"""
            SELECT a.year, a.college_code, c.college_name, a.branch_code, b.branch_name,
                   a.opening_cutoff, a.closing_cutoff, a.opening_rank, a.closing_rank, c.district, c.institution_type
            FROM admissions a
            JOIN colleges c ON a.college_code = c.college_code
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE {where_stmt}
            ORDER BY {order_stmt}
            LIMIT ? OFFSET ?
        """
        cursor.execute(data_query, query_args + [limit, offset])
        rows = cursor.fetchall()
        conn.close()

        data = []
        for row in rows:
            data.append({
                "Year": row['year'],
                "College Code": row['college_code'],
                "College Name": row['college_name'],
                "Branch Code": row['branch_code'],
                "Branch Name": row['branch_name'],
                "Opening Cutoff": row['opening_cutoff'],
                "Closing Cutoff": row['closing_cutoff'],
                "Opening Rank": row['opening_rank'],
                "Closing Rank": row['closing_rank'],
                "District": row['district'],
                "Institution Type": row['institution_type']
            })

        self.send_json({
            "total": total_count,
            "page": page,
            "limit": limit,
            "data": data
        })

    # 3. API: Course/Branch Card aggregation
    def get_branches(self, params):
        search = params.get('search', [''])[0].strip().lower()
        year = params.get('year', ['2025'])[0]

        conn = self.get_db_connection()
        cursor = conn.cursor()

        where_clauses = ["a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"]
        query_args = []

        if year != 'All':
            where_clauses.append("a.year = ?")
            query_args.append(int(year))

        if search:
            where_clauses.append("(LOWER(a.branch_code) LIKE ? OR LOWER(b.branch_name) LIKE ?)")
            search_param = f"%{search}%"
            query_args.extend([search_param, search_param])

        where_stmt = " AND ".join(where_clauses)

        query = f"""
            SELECT a.branch_code, b.branch_name,
                   COUNT(DISTINCT a.college_code) as college_count,
                   MIN(a.closing_rank) as min_rank,
                   MAX(a.closing_rank) as max_rank
            FROM admissions a
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE {where_stmt}
            GROUP BY a.branch_code
            ORDER BY college_count DESC
        """
        cursor.execute(query, query_args)
        rows = cursor.fetchall()
        conn.close()

        branches_dict = {}
        for r in rows:
            code = r['branch_code'].strip().upper()
            if code not in branches_dict:
                branches_dict[code] = {
                    "code": code,
                    "name": r['branch_name'].strip(),
                    "college_count": r['college_count'],
                    "min_rank": r['min_rank'],
                    "max_rank": r['max_rank']
                }

        data = list(branches_dict.values())
        self.send_json(data)

    # 4. API: Get all colleges offering a specific branch (Rank Sorted)
    def get_branch_colleges(self, params):
        code = params.get('code', [''])[0].strip()
        year = params.get('year', ['2025'])[0]
        
        if not code:
            return self.send_json({"error": "Branch code is required"}, 400)

        conn = self.get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT a.college_code, c.college_name, a.branch_code, b.branch_name,
                   a.opening_rank, a.closing_rank, c.district, c.institution_type
            FROM admissions a
            JOIN colleges c ON a.college_code = c.college_code
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE a.year = ? AND a.branch_code = ? AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
            ORDER BY a.closing_rank ASC
        """
        cursor.execute(query, [int(year), code])
        rows = cursor.fetchall()
        conn.close()

        data = []
        for row in rows:
            data.append({
                "College Code": row['college_code'],
                "College Name": row['college_name'],
                "Branch Code": row['branch_code'],
                "Branch Name": row['branch_name'],
                "Opening Rank": row['opening_rank'],
                "Closing Rank": row['closing_rank'],
                "District": row['district'],
                "Institution Type": row['institution_type']
            })

        self.send_json(data)

    # 5. API: Predictor chances using Rank or Cutoff calculations
    def get_predictions(self, params):
        rank = params.get('rank', [None])[0]
        cutoff = params.get('cutoff', [None])[0]
        district = params.get('district', ['All'])[0]
        branch = params.get('branch', ['All'])[0]
        tier = params.get('tier', ['All'])[0]

        if not rank and not cutoff:
            return self.send_json({"error": "Either Rank or Cutoff is required for predictions"}, 400)

        rank_val = None
        cutoff_val = None

        if rank and rank != 'null' and rank != '':
            try:
                rank_val = int(rank)
            except ValueError:
                pass

        if cutoff and cutoff != 'null' and cutoff != '':
            try:
                cutoff_val = float(cutoff)
            except ValueError:
                pass

        if rank_val is None and cutoff_val is None:
            return self.send_json({"error": "Invalid rank or cutoff value"}, 400)

        conn = self.get_db_connection()
        cursor = conn.cursor()

        where_clauses = ["a.year = 2025", "a.closing_rank IS NOT NULL", "a.closing_rank != 'NULL'"]
        query_args = []

        if district != 'All':
            where_clauses.append("c.district = ?")
            query_args.append(district)
        if branch != 'All':
            where_clauses.append("a.branch_code = ?")
            query_args.append(branch)
        if tier != 'All':
            where_clauses.append("c.institution_type = ?")
            query_args.append(tier)

        where_stmt = " AND ".join(where_clauses)
        query = f"""
            SELECT a.college_code, c.college_name, a.branch_code, b.branch_name,
                   a.opening_cutoff, a.closing_cutoff, a.opening_rank, a.closing_rank, c.district, c.institution_type
            FROM admissions a
            JOIN colleges c ON a.college_code = c.college_code
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE {where_stmt}
            ORDER BY a.closing_rank ASC
        """
        cursor.execute(query, query_args)
        rows = cursor.fetchall()

        safe = []
        moderate = []
        reach = []

        for row in rows:
            closing_rank = int(row['closing_rank']) if row['closing_rank'] is not None else None
            closing_cutoff = float(row['closing_cutoff']) if row['closing_cutoff'] is not None else None
            
            if closing_rank is None:
                continue

            # Decide classification based on input type
            is_match = False
            ratio = 999.0
            cutoff_diff = -999.0
            
            if rank_val is not None:
                ratio = rank_val / closing_rank
                is_match = ratio <= 1.30
                
                category = None
                if ratio <= 0.85:
                    category = 'safe'
                elif ratio <= 1.15:
                    category = 'moderate'
                elif ratio <= 1.30:
                    category = 'reach'
            else:
                # Use Cutoff
                if closing_cutoff is None:
                    continue
                cutoff_diff = cutoff_val - closing_cutoff
                is_match = cutoff_diff >= -5.0
                
                category = None
                if cutoff_diff >= 2.0:
                    category = 'safe'
                elif cutoff_diff >= -2.0:
                    category = 'moderate'
                elif cutoff_diff >= -5.0:
                    category = 'reach'

            if not is_match or category is None:
                continue

            item = {
                "College Code": row['college_code'],
                "College Name": row['college_name'],
                "Branch Code": row['branch_code'],
                "Branch Name": row['branch_name'],
                "Opening Cutoff": row['opening_cutoff'],
                "Closing Cutoff": closing_cutoff,
                "Opening Rank": row['opening_rank'],
                "Closing Rank": closing_rank,
                "District": row['district'],
                "Institution Type": row['institution_type']
            }

            if category == 'safe':
                safe.append(item)
            elif category == 'moderate':
                moderate.append(item)
            elif category == 'reach':
                reach.append(item)

        # Batch load history for the top 25 choices of each category
        top_safe = safe[:25]
        top_mod = moderate[:25]
        top_reach = reach[:25]
        all_top = top_safe + top_mod + top_reach

        history_map = {}
        if all_top:
            clauses = []
            args = []
            for item in all_top:
                clauses.append("(college_code = ? AND branch_code = ?)")
                args.extend([item["College Code"], item["Branch Code"]])
            
            history_query = f"""
                SELECT college_code, branch_code, year, closing_cutoff, closing_rank
                FROM admissions
                WHERE year IN (2023, 2024, 2025) AND ({' OR '.join(clauses)})
            """
            cursor.execute(history_query, args)
            hist_rows = cursor.fetchall()
            for hr in hist_rows:
                key = (hr['college_code'], hr['branch_code'])
                if key not in history_map:
                    history_map[key] = {}
                history_map[key][str(hr['year'])] = {
                    "cutoff": hr['closing_cutoff'],
                    "rank": hr['closing_rank']
                }

        # Add history map to choices
        for item in all_top:
            key = (item["College Code"], item["Branch Code"])
            item["History"] = history_map.get(key, {})

        conn.close()

        self.send_json({
            "rank": rank_val,
            "cutoff": cutoff_val,
            "safe": top_safe,
            "moderate": top_mod,
            "reach": top_reach
        })

    # 6. API: Get YoY closing rank trends
    def get_trends(self, params):
        college = params.get('college', [''])[0]
        branch = params.get('branch', [''])[0]

        if not college or not branch:
            return self.send_json({"error": "College and Branch are required"}, 400)

        conn = self.get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT a.year, a.closing_rank
            FROM admissions a
            JOIN branches b ON a.branch_code = b.branch_code
            WHERE a.college_code = ? AND b.branch_name = ? AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
            ORDER BY a.year ASC
        """
        cursor.execute(query, [int(college), branch])
        rows = cursor.fetchall()
        conn.close()

        trend_map = {row['year']: row['closing_rank'] for row in rows}
        years = [2021, 2022, 2023, 2024, 2025]
        data = [trend_map.get(y, None) for y in years]

        self.send_json({
            "years": years,
            "ranks": data
        })

    # 7. API: Get top 30 colleges in 2025 (trends dropdown)
    def get_trend_colleges(self):
        conn = self.get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT a.college_code, c.college_name, MIN(a.closing_rank) as min_rank
            FROM admissions a
            JOIN colleges c ON a.college_code = c.college_code
            WHERE a.year = 2025 AND a.closing_rank IS NOT NULL AND a.closing_rank != 'NULL'
            GROUP BY a.college_code
            ORDER BY min_rank ASC
            LIMIT 30
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()

        data = []
        for r in rows:
            data.append({
                "code": r['college_code'],
                "name": r['college_name']
            })

        self.send_json(data)

    # 8. API: Overhauled Analytics Queries (supports 100 modules inventory)
    def get_analytics(self, params):
        module_id = params.get('module', ['col_comp_1'])[0]
        
        if module_id not in MODULES_INVENTORY:
            return self.send_json({"error": "Invalid module ID in inventory"}, 400)

        module_name, description, query, chart_type = MODULES_INVENTORY[module_id]

        conn = self.get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            data_points = []
            for r in rows:
                data_points.append({
                    "label": str(r[0]),
                    "value": round(r[1], 2) if isinstance(r[1], float) else r[1]
                })
        except Exception as e:
            conn.close()
            return self.send_json({"error": f"SQL Query Error: {e}"}, 500)

        conn.close()

        self.send_json({
            "id": module_id,
            "name": module_name,
            "description": description,
            "chartType": chart_type,
            "data": data_points
        })

    def get_dash_summary(self):
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            # 1. Total counts
            cursor.execute("SELECT COUNT(*) FROM colleges")
            total_colleges = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM branches")
            total_branches = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT year) FROM admissions")
            total_years = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM admissions")
            total_admissions = cursor.fetchone()[0]
            
            # 2. Institution type counts
            cursor.execute("""
                SELECT institution_type, COUNT(*) 
                FROM colleges 
                WHERE institution_type IS NOT NULL AND institution_type != ''
                GROUP BY institution_type
                ORDER BY institution_type
            """)
            inst_type_data = [{"label": row[0], "value": row[1]} for row in cursor.fetchall()]
            
            # 3. Top districts by college count
            cursor.execute("""
                SELECT district, COUNT(*) 
                FROM colleges 
                WHERE district IS NOT NULL AND district != ''
                GROUP BY district 
                ORDER BY COUNT(*) DESC 
                LIMIT 10
            """)
            district_data = [{"label": row[0], "value": row[1]} for row in cursor.fetchall()]
            
            # 4. Top branches by college count in 2025
            cursor.execute("""
                SELECT branch_code, COUNT(DISTINCT college_code) 
                FROM admissions 
                WHERE year = 2025
                GROUP BY branch_code 
                ORDER BY COUNT(DISTINCT college_code) DESC 
                LIMIT 10
            """)
            branch_data = [{"label": row[0], "value": row[1]} for row in cursor.fetchall()]
            
            # 5. Average closing rank by district in 2025
            cursor.execute("""
                SELECT c.district, AVG(a.closing_rank) 
                FROM admissions a
                JOIN colleges c ON a.college_code = c.college_code
                WHERE a.year = 2025 AND a.closing_rank IS NOT NULL
                GROUP BY c.district
                ORDER BY AVG(a.closing_rank) ASC
                LIMIT 10
            """)
            rank_data = [{"label": row[0], "value": int(row[1])} for row in cursor.fetchall()]
            
            self.send_json({
                "metrics": {
                    "colleges": total_colleges,
                    "branches": total_branches,
                    "years": total_years,
                    "admissions": total_admissions
                },
                "instType": inst_type_data,
                "districts": district_data,
                "branches": branch_data,
                "ranks": rank_data
            })
        except Exception as e:
            self.send_json({"error": str(e)}, 500)
        finally:
            conn.close()

def run_server():
    server_address = ('', PORT)
    httpd = ThreadingTCPServer(server_address, TNEAApiHandler)
    print(f"Server starting on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
