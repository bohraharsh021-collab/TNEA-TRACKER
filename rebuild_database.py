import sqlite3
import csv
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tnea.db')
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tnea_cutoff_dataset.csv')

DUPLICATE_GROUPS = [
    ('AD', ['AT']),
    ('AU', ['AS']),
    ('BM', ['BY']),
    ('BT', ['BS']),
    ('CH', ['CL']),
    ('CE', ['CN']),
    ('CS', ['CM']),
    ('EE', ['EY']),
    ('EC', ['EM']),
    ('EV', ['EL']),
    ('FT', ['FY']),
    ('IB', ['IS']),
    ('IC', ['IY']),
    ('MC', ['MG', 'MZ']),
    ('ME', ['MF']),
    ('MH', ['MS']),
    ('MT', ['MY']),
    ('PH', ['PM']),
    ('PN', ['PR']),
    ('TX', ['TT'])
]

def clean_val(val, is_float=False):
    if val is None or val == "" or str(val).upper() == "NULL" or str(val) == "—":
        return None
    try:
        if is_float:
            return float(val)
        else:
            return int(val)
    except ValueError:
        return None

def map_institution_type(orig_type, college_name=''):
    orig = orig_type.upper().strip()
    name_upper = college_name.upper().strip()
    
    # Government colleges: check both type and name
    if any(k in orig for k in ['GOVERNMENT', 'CEG', 'ANNAMALAI', 'UNIV', 'CONSTITUENT', 'CENTRAL']):
        return 'Government Colleges'
    if any(k in name_upper for k in ['GOVERNMENT', 'CONSTITUENT', 'UNIVERSITY DEPARTMENTS']):
        return 'Government Colleges'
    
    # Autonomous colleges: check type tiers AND name for (Autonomous)
    if 'TIER 1' in orig or 'TIER 2' in orig:
        return 'Autonomous Colleges'
    if 'AUTONOMOUS' in orig or 'AUTONOMOUS' in name_upper:
        return 'Autonomous Colleges'
    
    # Everything else
    return 'Non-Autonomous Colleges'

def rebuild_db():
    print(f"Rebuilding database at: {DB_PATH}")
    
    # Remove existing DB to start fresh
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print("  Removed existing database file.")
        except Exception as e:
            print(f"  Warning: could not delete DB file: {e}")
            
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Enable foreign keys
    c.execute("PRAGMA foreign_keys = ON")
    
    # Create Tables
    print("Creating tables...")
    c.execute("""
        CREATE TABLE colleges (
            college_code INTEGER PRIMARY KEY,
            college_name TEXT,
            district TEXT,
            institution_type TEXT
        )
    """)
    
    c.execute("""
        CREATE TABLE branches (
            branch_code TEXT PRIMARY KEY,
            branch_name TEXT
        )
    """)
    
    c.execute("""
        CREATE TABLE admissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER,
            college_code INTEGER,
            branch_code TEXT,
            community TEXT,
            opening_cutoff REAL,
            closing_cutoff REAL,
            opening_rank INTEGER,
            closing_rank INTEGER,
            FOREIGN KEY (college_code) REFERENCES colleges(college_code),
            FOREIGN KEY (branch_code) REFERENCES branches(branch_code)
        )
    """)
    
    # Read CSV and load data
    print(f"Loading data from CSV: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return
        
    colleges_data = {}
    branches_data = {}
    admissions_rows = []
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            c_code = int(row['College Code'])
            c_name = row['College Name'].strip()
            district = row['District'].strip()
            inst_type = map_institution_type(row['Institution Type'].strip(), c_name)
            
            b_code = row['Branch Code'].strip()
            b_name = row['Branch Name'].strip()
            
            # Collect unique colleges
            if c_code not in colleges_data:
                colleges_data[c_code] = (c_name, district, inst_type)
                
            # Collect unique branches
            if b_code not in branches_data:
                branches_data[b_code] = b_name
                
            # Collect admissions record
            year = int(row['Year'])
            comm = row['Community'].strip()
            op_cut = clean_val(row['Opening Cutoff'], is_float=True)
            cl_cut = clean_val(row['Closing Cutoff'], is_float=True)
            op_rank = clean_val(row['Opening Rank'], is_float=False)
            cl_rank = clean_val(row['Closing Rank'], is_float=False)
            
            admissions_rows.append((year, c_code, b_code, comm, op_cut, cl_cut, op_rank, cl_rank))
            
    # Insert Colleges
    print(f"Inserting {len(colleges_data)} colleges...")
    for c_code, (c_name, district, inst_type) in colleges_data.items():
        c.execute("""
            INSERT INTO colleges (college_code, college_name, district, institution_type)
            VALUES (?, ?, ?, ?)
        """, (c_code, c_name, district, inst_type))
        
    # Insert Branches
    print(f"Inserting {len(branches_data)} branches...")
    for b_code, b_name in branches_data.items():
        c.execute("""
            INSERT INTO branches (branch_code, branch_name)
            VALUES (?, ?)
        """, (b_code, b_name))
        
    # Insert Admissions
    print(f"Inserting {len(admissions_rows)} admissions...")
    c.executemany("""
        INSERT INTO admissions (year, college_code, branch_code, community, opening_cutoff, closing_cutoff, opening_rank, closing_rank)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, admissions_rows)
    
    # ----------------------------------------------------
    # Apply Deduplication Logic
    # ----------------------------------------------------
    print("Resolving admissions conflicts (retaining better rank/cutoff)...")
    for primary, dups in DUPLICATE_GROUPS:
        for dup in dups:
            c.execute("""
                SELECT a1.id, a1.closing_rank, a1.closing_cutoff, a2.id, a2.closing_rank, a2.closing_cutoff
                FROM admissions a1
                JOIN admissions a2 ON a1.college_code = a2.college_code 
                                  AND a1.year = a2.year 
                                  AND a1.community = a2.community
                WHERE a1.branch_code = ? AND a2.branch_code = ?
            """, (primary, dup))
            conflicts = c.fetchall()
            
            if conflicts:
                print(f"  Resolving {len(conflicts)} conflicts between {primary} and {dup}...")
                for p_id, p_rank, p_cut, d_id, d_rank, d_cut in conflicts:
                    delete_id = None
                    if p_rank is None and d_rank is None:
                        delete_id = d_id
                    elif p_rank is None:
                        delete_id = p_id
                    elif d_rank is None:
                        delete_id = d_id
                    else:
                        if p_rank <= d_rank:
                            delete_id = d_id
                        else:
                            delete_id = p_id
                    c.execute("DELETE FROM admissions WHERE id = ?", (delete_id,))
                    
    print("Merging duplicate branch codes in admissions table...")
    for primary, dups in DUPLICATE_GROUPS:
        for dup in dups:
            c.execute("UPDATE admissions SET branch_code = ? WHERE branch_code = ?", (primary, dup))
            
    print("Removing duplicate branches from branches table...")
    all_dups = [d for p, dups in DUPLICATE_GROUPS for d in dups]
    placeholders = ','.join('?' for _ in all_dups)
    c.execute(f"DELETE FROM branches WHERE branch_code IN ({placeholders})", all_dups)
    
    # ----------------------------------------------------
    # Index Creation
    # ----------------------------------------------------
    print("Creating database indexes for query optimization...")
    c.execute("CREATE INDEX idx_admissions_year ON admissions(year)")
    c.execute("CREATE INDEX idx_admissions_college ON admissions(college_code)")
    c.execute("CREATE INDEX idx_admissions_branch ON admissions(branch_code)")
    c.execute("CREATE INDEX idx_admissions_closing_rank ON admissions(closing_rank)")
    c.execute("CREATE INDEX idx_admissions_closing_cutoff ON admissions(closing_cutoff)")
    c.execute("CREATE INDEX idx_admissions_lookup ON admissions(year, college_code, branch_code)")
    c.execute("CREATE INDEX idx_colleges_district ON colleges(district)")
    c.execute("CREATE INDEX idx_colleges_tier ON colleges(institution_type)")
    
    conn.commit()
    print("Database built and committed successfully.")
    
    # Run VACUUM
    print("Vacuuming database...")
    c.execute("VACUUM")
    conn.close()
    print("Database rebuild complete.")

if __name__ == '__main__':
    rebuild_db()
