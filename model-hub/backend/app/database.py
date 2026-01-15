"""
MongoDB database connection and utilities.
Uses Motor for async MongoDB operations.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, Any
import logging
import certifi

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None  # type: ignore
    database: Optional[AsyncIOMotorDatabase] = None  # type: ignore
    
    async def connect(self):
        """Establish connection to MongoDB."""
        try:
            # Use certifi for SSL certificate verification with MongoDB Atlas
            self.client = AsyncIOMotorClient(
                settings.mongodb_url,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=20000,
                socketTimeoutMS=20000
            )
            self.database = self.client[settings.database_name]
            
            # Verify connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {settings.database_name}")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def _create_indexes(self):
        """Create necessary database indexes."""
        if self.database is None:
            return
            
        try:
            # User indexes
            users_collection = self.database["users"]
            await users_collection.create_index("email", unique=True)
            await users_collection.create_index("username", unique=True)
            
            # Project indexes
            projects_collection = self.database["projects"]
            await projects_collection.create_index("name")
            await projects_collection.create_index("tags")
            await projects_collection.create_index("created_by")
            await projects_collection.create_index("status")
            await projects_collection.create_index([
                ("name", "text"),
                ("description", "text"),
                ("author_name", "text")
            ])
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")
    
    def get_collection(self, name: str) -> Any:
        """Get a collection by name."""
        if self.database is None:
            raise RuntimeError("Database not connected")
        return self.database[name]


# Global database instance
mongodb = MongoDB()


async def get_database() -> AsyncIOMotorDatabase:  # type: ignore
    """Dependency to get the database instance."""
    if mongodb.database is None:
        raise RuntimeError("Database not connected")
    return mongodb.database
