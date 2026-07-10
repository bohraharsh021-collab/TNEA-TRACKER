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
