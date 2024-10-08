from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging

load_dotenv(".env.development.local")

DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_DATABASE = os.getenv('DB_DATABASE')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("migration.log"),
        logging.StreamHandler()
    ]
)

def get_mongo_connection():
    client = MongoClient(f'mongodb+srv://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/admin?replicaSet=replicaset&tls=true')
    db = client[f'{DB_DATABASE}']
    return db

def migrate_users(db):
    users_collection = db['users']
    sheets_collection = db['sheets']

    users_with_sheets = sheets_collection.distinct('voterId')

    for user_id in users_with_sheets:
        user = users_collection.find_one({'discordId': user_id})
        if user:
            user_sheets = sheets_collection.find({'voterId': user_id})
            for user_sheet in user_sheets:
                sheets_collection.update_one(
                    {'_id': user_sheet['_id']},
                    {'$set': {'name': user['name'], 'image': user['image']}}
                )
                logging.info(f"Updated sheet PR={user_sheet['prId']} for user={user['name']}: name={user['name']}, image={user['image']}")

if __name__ == "__main__":
    db = get_mongo_connection()
    migrate_users(db)
