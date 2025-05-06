import sqlite3

def init_db():
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()

    # Create PDF documents table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pdf_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        filename TEXT UNIQUE,
        total_pages INTEGER,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by TEXT
    )
    ''')

    # Create PDF chunks table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS pdf_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        page_number INTEGER,
        content TEXT,
        FOREIGN KEY (document_id) REFERENCES pdf_documents (id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Database tables created successfully!") 