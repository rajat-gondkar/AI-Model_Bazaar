"""
File validation utilities.
"""

import os
from typing import Tuple, List
from app.config import settings


def validate_file_extension(filename: str) -> Tuple[bool, str]:
    """
    Validate that a file has an allowed extension.
    
    Args:
        filename: The filename to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not filename:
        return False, "Filename is required"
    
    _, ext = os.path.splitext(filename.lower())
    
    # Check if it's an archive (always allowed for upload)
    if ext in ['.zip', '.rar']:
        return True, ""
    
    # Check against allowed extensions
    if ext not in settings.allowed_extensions_list:
        return False, f"File extension {ext} is not allowed"
    
    return True, ""


def validate_file_size(file_size: int) -> Tuple[bool, str]:
    """
    Validate that a file is within the size limit.
    
    Args:
        file_size: File size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size = settings.max_upload_size_bytes
    
    if file_size > max_size:
        max_mb = settings.max_upload_size_mb
        actual_mb = file_size / (1024 * 1024)
        return False, f"File size ({actual_mb:.2f} MB) exceeds maximum allowed ({max_mb} MB)"
    
    return True, ""


def validate_archive_extension(filename: str) -> Tuple[bool, str]:
    """
    Validate that a file is a ZIP or RAR archive.
    
    Args:
        filename: The filename to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not filename:
        return False, "Filename is required"
    
    _, ext = os.path.splitext(filename.lower())
    
    if ext not in ['.zip', '.rar']:
        return False, "Only ZIP and RAR archives are accepted"
    
    return True, ""


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and other issues.
    
    Args:
        filename: The filename to sanitize
        
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['..', '/', '\\', '\x00', '~']
    for char in dangerous_chars:
        filename = filename.replace(char, '')
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    
    return filename


def get_content_type(filename: str) -> str:
    """
    Get the content type for a file based on its extension.
    
    Args:
        filename: The filename
        
    Returns:
        Content type string
    """
    ext = os.path.splitext(filename.lower())[1]
    
    content_types = {
        '.py': 'text/x-python',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.csv': 'text/csv',
        '.pkl': 'application/octet-stream',
        '.pt': 'application/octet-stream',
        '.pth': 'application/octet-stream',
        '.h5': 'application/octet-stream',
        '.onnx': 'application/octet-stream',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
    }
    
    return content_types.get(ext, 'application/octet-stream')
