import sqlite3
import hashlib
import logging
import json

logger = logging.getLogger("autotest.db.cache")

class AgentCache:
    """
    Raw SQLite Performance Cache Interface for E2E Automation Testing.
    
    This class bypasses the SQLAlchemy ORM layer to execute low-overhead SHA-256 
    fingerprinting checks on raw HTML pages. It determines if a targeted web UI 
    layout has changed structurally since the last run. If unchanged, the agent 
    intercepts the workflow and reads directly from the cache, preventing redundant 
    and expensive upstream LLM tokens during execution cycles.
    """

    def __init__(self, db_path: str):
        """
        Initializes the cache engine using the unified package database path.
        
        Args:
            db_path (str): Absolute file path to the target SQLite database (e.g., autotest.db).
        """
        self.db_path = db_path
        self.create_tables()

    def create_tables(self):
        """
        Creates the low-level `page_cache` index structure if it does not exist.
        
        Schema Layout:
            - page_hash (TEXT PRIMARY KEY): Unique SHA-256 string computed from the DOM source.
            - metadata (TEXT): Compressed JSON payload detailing discovered forms, inputs, and URLs.
            - test_cases (TEXT): Raw string or JSON array representing generated Selenium code steps.
        """
        try:
            with sqlite3.connect(self.db_path, timeout=10.0) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS page_cache (
                        page_hash TEXT PRIMARY KEY,
                        metadata TEXT,
                        test_cases TEXT
                    )
                """)
                conn.commit()
                logger.debug("SQLite structural page_cache table verified or created.")
        except sqlite3.Error as e:
            logger.error(f"Critical failure initializing raw SQLite cache schema: {e}")
            raise

    def get_cached_page(self, html_source: str) -> tuple:
        """
        Computes a cryptographic fingerprint of the provided DOM string to inspect the cache.
        
        Args:
            html_source (str): The raw, uncompressed outer HTML page source from the Selenium session.
            
        Returns:
            tuple: (metadata_text, test_cases_text) if a cache match is hit.
            None: If the layout has evolved or has never been registered before.
        """
        if not html_source:
            logger.warning("Empty HTML payload passed to cache lookup engine.")
            return None

        # Compute SHA-256 to isolate structural drift instantly
        page_hash = hashlib.sha256(html_source.encode('utf-8')).hexdigest()
        
        try:
            with sqlite3.connect(self.db_path, timeout=5.0) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT metadata, test_cases FROM page_cache WHERE page_hash = ?", 
                    (page_hash,)
                )
                result = cursor.fetchone()
                
                if result:
                    logger.info(f"Cache Hit! Layout matched page hash: {page_hash}")
                    return result
                
                logger.debug(f"Cache Miss. Unique layout registered under hash: {page_hash}")
                return None
        except sqlite3.Error as e:
            logger.error(f"Error querying raw SQLite database cache index: {e}")
            return None

    def save_page_cache(self, html_source: str, metadata: dict, test_cases: list or str):
        """
        Commits an analyzed page snapshot directly to the persistent store.
        
        Converts programmatic dictionary tracking shapes and test metrics into strings 
        before persisting to comply with strict SQLite atomic types.
        
        Args:
            html_source (str): The raw text markup used to rebuild the hash identifier.
            metadata (dict): Structural layout metrics (interactive elements, actions).
            test_cases (list or str): Final output payload consisting of scripts or operational step codes.
        """
        if not html_source:
            return

        page_hash = hashlib.sha256(html_source.encode('utf-8')).hexdigest()
        
        # Normalize dynamic content definitions to strict database text structures
        metadata_str = json.dumps(metadata) if isinstance(metadata, dict) else str(metadata)
        test_cases_str = json.dumps(test_cases) if isinstance(test_cases, (list, dict)) else str(test_cases)

        try:
            with sqlite3.connect(self.db_path, timeout=10.0) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO page_cache (page_hash, metadata, test_cases)
                    VALUES (?, ?, ?)
                """, (page_hash, metadata_str, test_cases_str))
                conn.commit()
                logger.info(f"Successfully cached structural signature for page hash: {page_hash}")
        except sqlite3.Error as e:
            logger.error(f"Failed to upsert row execution records to page_cache: {e}")

    def clear_cache(self):
        """
        Purges all cached optimization data to force a hard execution pass 
        across the entire testing sweep.
        """
        try:
            with sqlite3.connect(self.db_path, timeout=5.0) as conn:
                conn.execute("DELETE FROM page_cache")
                conn.commit()
                logger.warning("Structural page_cache truncated successfully.")
        except sqlite3.Error as e:
            logger.error(f"Failed to truncate cache table: {e}")