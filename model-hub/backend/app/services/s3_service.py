"""
AWS S3 service for file storage operations.
"""

import boto3
from botocore.exceptions import ClientError
from typing import Optional, List, BinaryIO
import os
import logging
import aiofiles
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.config import settings

logger = logging.getLogger(__name__)

# Thread pool for async S3 operations
executor = ThreadPoolExecutor(max_workers=4)


class S3Service:
    """Service for AWS S3 operations."""
    
    def __init__(self):
        """Initialize S3 client."""
        self.client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name = settings.s3_bucket_name
    
    def _upload_file_sync(self, file_path: str, s3_key: str, content_type: Optional[str] = None) -> bool:
        """
        Synchronously upload a file to S3.
        """
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.client.upload_file(
                file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args if extra_args else None
            )
            logger.info(f"Uploaded {file_path} to s3://{self.bucket_name}/{s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Error uploading to S3: {e}")
            return False
    
    async def upload_file(self, file_path: str, s3_key: str, content_type: Optional[str] = None) -> bool:
        """Asynchronously upload a file to S3."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._upload_file_sync,
            file_path,
            s3_key,
            content_type
        )
    
    def _upload_fileobj_sync(self, file_obj: BinaryIO, s3_key: str, content_type: Optional[str] = None) -> bool:
        """Synchronously upload a file object to S3."""
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args if extra_args else None
            )
            logger.info(f"Uploaded file object to s3://{self.bucket_name}/{s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Error uploading to S3: {e}")
            return False
    
    async def upload_fileobj(self, file_obj: BinaryIO, s3_key: str, content_type: Optional[str] = None) -> bool:
        """Asynchronously upload a file object to S3."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._upload_fileobj_sync,
            file_obj,
            s3_key,
            content_type
        )
    
    async def upload_directory(self, local_path: str, s3_prefix: str) -> List[str]:
        """Upload all files in a directory to S3."""
        uploaded_keys = []
        
        for root, dirs, files in os.walk(local_path):
            for filename in files:
                local_file = os.path.join(root, filename)
                relative_path = os.path.relpath(local_file, local_path)
                s3_key = f"{s3_prefix}/{relative_path}"
                
                if await self.upload_file(local_file, s3_key):
                    uploaded_keys.append(s3_key)
        
        return uploaded_keys
    
    def _download_file_sync(self, s3_key: str, local_path: str) -> bool:
        """Synchronously download a file from S3."""
        try:
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            self.client.download_file(
                self.bucket_name,
                s3_key,
                local_path
            )
            logger.info(f"Downloaded s3://{self.bucket_name}/{s3_key} to {local_path}")
            return True
        except ClientError as e:
            logger.error(f"Error downloading from S3: {e}")
            return False
    
    async def download_file(self, s3_key: str, local_path: str) -> bool:
        """Asynchronously download a file from S3."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._download_file_sync,
            s3_key,
            local_path
        )
    
    async def download_project(self, project_id: str, local_path: str) -> bool:
        """Download all project files from S3."""
        try:
            s3_prefix = f"projects/{project_id}"
            paginator = self.client.get_paginator('list_objects_v2')
            
            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=s3_prefix):
                if 'Contents' not in page:
                    continue
                    
                for obj in page['Contents']:
                    s3_key = obj['Key']
                    relative_path = s3_key[len(s3_prefix) + 1:]
                    local_file = os.path.join(local_path, relative_path)
                    await self.download_file(s3_key, local_file)
            
            return True
        except ClientError as e:
            logger.error(f"Error downloading project: {e}")
            return False
    
    def _delete_objects_sync(self, s3_prefix: str) -> bool:
        """Synchronously delete all objects with a prefix."""
        try:
            paginator = self.client.get_paginator('list_objects_v2')
            
            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=s3_prefix):
                if 'Contents' not in page:
                    continue
                
                objects = [{'Key': obj['Key']} for obj in page['Contents']]
                
                if objects:
                    self.client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={'Objects': objects}
                    )
            
            logger.info(f"Deleted all objects with prefix: {s3_prefix}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting from S3: {e}")
            return False
    
    async def delete_project(self, project_id: str) -> bool:
        """Delete all project files from S3."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            self._delete_objects_sync,
            f"projects/{project_id}"
        )
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """Generate a presigned URL for downloading a file."""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            return None


# Global S3 service instance
s3_service = S3Service()
