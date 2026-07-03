# autotest_package/autotest/db/seed_csv.py
import csv
import os
# Import explicitly from the exact sub-modules, bypassing __init__.py
from autotest.db.database import SessionLocal, init_db
from autotest.tables.test_case_data import TestCase

def seed_from_csv(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: Target path missing: {csv_path}")
        return

    init_db()
    session = SessionLocal()
    
    try:
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing = session.query(TestCase).filter_by(step_name=row['Step']).first()
                if not existing:
                    test_case = TestCase(
                        step_name=row['Step'],
                        action_description=row['Action'],
                        verification_criteria=row['Verification'],
                        status="pending"
                    )
                    session.add(test_case)
            session.commit()
            print("Successfully initialized and seeded Antigravity verification steps.")
    except Exception as e:
        session.rollback()
        print(f"Migration seeding error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    # If executing from the autotest_package root directory
    seed_from_csv("Test Cases for Onboarding.csv")