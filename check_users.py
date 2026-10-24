from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()

print("=" * 50)
print(f"Total Users Found in Database: {len(users)}")
print("=" * 50)

for u in users:
    print(f"ID: {u.id} | Username: '{u.username}' | Role: '{u.role}' | Name: '{u.full_name}'")

print("=" * 50)
db.close()