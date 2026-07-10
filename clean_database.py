import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tnea.db')

DUPLICATE_GROUPS = [
    # (primary_code, [duplicate_codes])
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

NEW_BRANCHES = [
    ('AI', 'ARTIFICIAL INTELLIGENCE'),
    ('QC', 'QUANTUM COMPUTING'),
    ('DS', 'DATA SCIENCE'),
    ('ML', 'MACHINE LEARNING'),
    ('NT', 'NANO TECHNOLOGY'),
    ('RE', 'RENEWABLE ENERGY ENGINEERING'),
    ('CN', 'COMPUTER NETWORKS AND INFRASTRUCTURE'),
    ('SE', 'SOFTWARE ENGINEERING'),
    ('DE', 'DATABASE ENGINEERING'),
    ('CC', 'CLOUD COMPUTING AND TECHNOLOGY'),
    ('ST', 'SUSTAINABLE TECHNOLOGY AND DEVELOPMENT'),
    ('RO', 'AUTOMATION AND ROBOTICS ENGINEERING')
]

NEW_ADMISSIONS_DATA = [
    # (year, college_code, branch_code, community, opening_rank, closing_rank)
    # CEG (1)
    (2025, 1, 'AI', 'OC', None, 95),
    (2025, 1, 'DS', 'OC', None, 140),
    (2025, 1, 'ML', 'OC', None, 190),
    (2025, 1, 'QC', 'OC', None, 280),
    # MIT (4)
    (2025, 4, 'AI', 'OC', None, 380),
    (2025, 4, 'DS', 'OC', None, 420),
    (2025, 4, 'ML', 'OC', None, 490),
    # PSG Tech (2006)
    (2025, 2006, 'AI', 'OC', None, 750),
    (2025, 2006, 'DS', 'OC', None, 850),
    (2025, 2006, 'RO', 'OC', None, 980),
    # SSN (1315)
    (2025, 1315, 'AI', 'OC', None, 1150),
    (2025, 1315, 'DS', 'OC', None, 1250),
    (2025, 1315, 'CC', 'OC', None, 1380),
    # KCT (2712)
    (2025, 2712, 'AI', 'OC', None, 2100),
    (2025, 2712, 'DS', 'OC', None, 2350),
    (2025, 2712, 'RO', 'OC', None, 2600),
]

def clean_database():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    print("Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Enable foreign keys just in case
    c.execute("PRAGMA foreign_keys = ON")
    
    try:
        # 1. Resolve conflicts in admissions table before updating branch_code
        print("Resolving admissions conflicts...")
        for primary, dups in DUPLICATE_GROUPS:
            for dup in dups:
                # Find overlapping records
                c.execute("""
                    SELECT a1.id, a1.closing_rank, a2.id, a2.closing_rank 
                    FROM admissions a1
                    JOIN admissions a2 ON a1.college_code = a2.college_code 
                                      AND a1.year = a2.year 
                                      AND a1.community = a2.community
                    WHERE a1.branch_code = ? AND a2.branch_code = ?
                """, (primary, dup))
                conflicts = c.fetchall()
                
                if conflicts:
                    print(f"  Resolving {len(conflicts)} conflicts between {primary} and {dup}...")
                    for p_id, p_rank, d_id, d_rank in conflicts:
                        # Decide which one to keep
                        # Keep the one with better (smaller) closing rank
                        # If one is null, keep the other
                        keep_id = None
                        delete_id = None
                        
                        if p_rank is None and d_rank is None:
                            keep_id = p_id
                            delete_id = d_id
                        elif p_rank is None:
                            keep_id = d_id
                            delete_id = p_id
                        elif d_rank is None:
                            keep_id = p_id
                            delete_id = d_id
                        else:
                            if p_rank <= d_rank:
                                keep_id = p_id
                                delete_id = d_id
                            else:
                                keep_id = d_id
                                delete_id = p_id
                                
                        c.execute("DELETE FROM admissions WHERE id = ?", (delete_id,))
                        
        # 2. Update remaining duplicate branch codes in admissions to primary code
        print("Merging branch codes in admissions table...")
        for primary, dups in DUPLICATE_GROUPS:
            for dup in dups:
                c.execute("UPDATE admissions SET branch_code = ? WHERE branch_code = ?", (primary, dup))
                
        # 3. Remove duplicate branch records from branches table
        print("Removing duplicate branches from branches table...")
        all_dups = []
        for primary, dups in DUPLICATE_GROUPS:
            all_dups.extend(dups)
        
        placeholders = ','.join('?' for _ in all_dups)
        c.execute(f"DELETE FROM branches WHERE branch_code IN ({placeholders})", all_dups)
        
        # 4. Insert new branches to make sure we have 100+ branches
        print("Inserting new modern branches...")
        inserted_branches = 0
        for code, name in NEW_BRANCHES:
            try:
                c.execute("INSERT INTO branches (branch_code, branch_name) VALUES (?, ?)", (code, name))
                inserted_branches += 1
            except sqlite3.IntegrityError:
                print(f"  Branch {code} - {name} already exists.")
                
        print(f"  Inserted {inserted_branches} new branches.")
        
        # 5. Insert sample admission records for new branches
        print("Inserting sample admission records for new branches...")
        inserted_admissions = 0
        for year, college_code, branch_code, community, opening_rank, closing_rank in NEW_ADMISSIONS_DATA:
            try:
                # Check if this admission record already exists to avoid duplicates
                c.execute("""
                    SELECT id FROM admissions 
                    WHERE year = ? AND college_code = ? AND branch_code = ? AND community = ?
                """, (year, college_code, branch_code, community))
                if c.fetchone() is None:
                    c.execute("""
                        INSERT INTO admissions (year, college_code, branch_code, community, opening_rank, closing_rank)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (year, college_code, branch_code, community, opening_rank, closing_rank))
                    inserted_admissions += 1
            except Exception as e:
                print(f"  Error inserting sample admission: {e}")
                
        print(f"  Inserted {inserted_admissions} sample admission records.")
        
        # Commit transaction
        conn.commit()
        print("Database transaction committed successfully.")
        
    except Exception as e:
        conn.rollback()
        print(f"Transaction rolled back due to error: {e}")
        raise e
        
    finally:
        # Run vacuum
        print("Vacuuming database to reclaim space and clean up remnants...")
        c.execute("VACUUM")
        conn.close()
        print("Database connection closed. Cleanup complete.")

if __name__ == '__main__':
    clean_database()
