import sqlite3

# Connect to the original database
conn = sqlite3.connect('cache.db')
cursor = conn.cursor()

table_name='conditionv1100'
db_name='conditionv1'

# Get the schema of the table 'conditionv2'
cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
schema = cursor.fetchone()[0]

# Print the schema (optional, for your verification)
print(f"Schema for '{table_name}':", schema)

# Retrieve data from the table for later insertion
cursor.execute(f"SELECT * FROM {table_name}")
rows = cursor.fetchall()

# Close the original database connection
conn.close()


# Connect to a new database (this will create the database if it doesn't exist)
new_conn = sqlite3.connect(f'{db_name}.db')
new_cursor = new_conn.cursor()

# Create a new table using the extracted schema
new_cursor.execute(schema)

# Insert the data into the new table
new_cursor.executemany(f"INSERT INTO {table_name} VALUES (" + ",".join(["?"]*len(rows[0])) + ")", rows)
new_conn.commit()

# Close the new connection
new_conn.close()
