"""
Archive service for extracting and validating ZIP/RAR files.
"""

import os
import zipfile
import shutil
import tempfile
from typing import Tuple, List, Dict, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Try to import rarfile, but it's optional
try:
    import rarfile
    RAR_SUPPORTED = True
except ImportError:
    RAR_SUPPORTED = False
    logger.warning("rarfile not installed, RAR support disabled")


class ArchiveService:
    """Service for handling archive extraction and validation."""
    
    # Required files in the bundle
    REQUIRED_FILES = ['requirements.txt']
    STREAMLIT_ENTRY_FILES = ['app.py', 'main.py', 'streamlit_app.py']
    
    # Model file extensions
    MODEL_EXTENSIONS = ['.pkl', '.pt', '.pth', '.h5', '.onnx', '.pb', '.weights', '.bin', '.model']
    
    # Blocked file extensions (security)
    BLOCKED_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.dll', '.so']
    
    @staticmethod
    def get_temp_dir() -> str:
        """Create and return a temporary directory."""
        return tempfile.mkdtemp(prefix="model_hub_")
    
    @staticmethod
    def cleanup_temp_dir(temp_dir: str) -> None:
        """Remove a temporary directory and its contents."""
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            logger.info(f"Cleaned up temp directory: {temp_dir}")
    
    @staticmethod
    def is_zip_file(file_path: str) -> bool:
        """Check if a file is a valid ZIP archive."""
        return zipfile.is_zipfile(file_path)
    
    @staticmethod
    def is_rar_file(file_path: str) -> bool:
        """Check if a file is a valid RAR archive."""
        if not RAR_SUPPORTED:
            return False
        return rarfile.is_rarfile(file_path)
    
    @staticmethod
    def extract_archive(file_path: str, dest_path: str) -> Tuple[bool, str]:
        """
        Extract a ZIP or RAR archive.
        
        Args:
            file_path: Path to the archive file
            dest_path: Destination directory for extraction
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            os.makedirs(dest_path, exist_ok=True)
            logger.info(f"=== Extracting archive ===")
            logger.info(f"  Source: {file_path}")
            logger.info(f"  Destination: {dest_path}")
            
            if ArchiveService.is_zip_file(file_path):
                logger.info("  Archive type: ZIP")
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    # Log contents before extraction
                    logger.info(f"  ZIP contents: {zip_ref.namelist()}")
                    
                    # Check for zip bombs (files that expand to huge sizes)
                    total_size = sum(info.file_size for info in zip_ref.infolist())
                    max_size = settings.max_upload_size_bytes * 10  # Allow 10x expansion
                    
                    logger.info(f"  Total uncompressed size: {total_size} bytes")
                    
                    if total_size > max_size:
                        return False, f"Archive expands to {total_size} bytes, exceeds limit"
                    
                    zip_ref.extractall(dest_path)
                    
            elif ArchiveService.is_rar_file(file_path):
                logger.info("  Archive type: RAR")
                with rarfile.RarFile(file_path, 'r') as rar_ref:
                    rar_ref.extractall(dest_path)
            else:
                logger.error("  Unsupported archive format!")
                return False, "Unsupported archive format. Please use ZIP or RAR."
            
            # Log what was extracted
            logger.info(f"  Extraction complete. Listing destination:")
            for root, dirs, files in os.walk(dest_path):
                level = root.replace(dest_path, '').count(os.sep)
                indent = ' ' * 2 * level
                logger.info(f"{indent}{os.path.basename(root)}/")
                subindent = ' ' * 2 * (level + 1)
                for file in files:
                    logger.info(f"{subindent}{file}")
            
            return True, ""
            
        except zipfile.BadZipFile:
            logger.error("Invalid or corrupted ZIP file!")
            return False, "Invalid or corrupted ZIP file"
        except Exception as e:
            logger.error(f"Error extracting archive: {e}")
            return False, f"Error extracting archive: {str(e)}"
    
    @staticmethod
    def get_file_list(extracted_path: str) -> List[str]:
        """
        Get list of all files in extracted directory.
        
        Args:
            extracted_path: Path to extracted content
            
        Returns:
            List of relative file paths
        """
        files = []
        logger.info(f"=== Scanning extracted directory: {extracted_path} ===")
        
        for root, dirs, filenames in os.walk(extracted_path):
            logger.info(f"  Directory: {root}")
            logger.info(f"  Subdirs: {dirs}")
            logger.info(f"  Files: {filenames}")
            
            for filename in filenames:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, extracted_path)
                files.append(relative_path)
                logger.info(f"    -> Found file: {relative_path}")
        
        logger.info(f"=== Total files found: {len(files)} ===")
        logger.info(f"=== All files: {files} ===")
        return files
    
    @staticmethod
    def find_streamlit_entry(extracted_path: str) -> Optional[str]:
        """
        Find the main Streamlit entry file.
        
        Args:
            extracted_path: Path to extracted content
            
        Returns:
            The entry file name or None if not found
        """
        files = ArchiveService.get_file_list(extracted_path)
        
        logger.info(f"=== Looking for Streamlit entry in files: {files} ===")
        
        # First look for standard entry files in root
        for entry_file in ArchiveService.STREAMLIT_ENTRY_FILES:
            if entry_file in files:
                logger.info(f"Found entry file in root: {entry_file}")
                return entry_file
        
        # Look for entry files in subdirectories (e.g., "ProjectName/app.py")
        for entry_file in ArchiveService.STREAMLIT_ENTRY_FILES:
            for file in files:
                if file.endswith('/' + entry_file) or file.endswith('\\' + entry_file):
                    logger.info(f"Found entry file in subdirectory: {file}")
                    return file
                # Also check if file basename matches
                if os.path.basename(file) == entry_file:
                    logger.info(f"Found entry file by basename: {file}")
                    return file
        
        # Then look for any .py file with 'streamlit' import (root level first)
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(extracted_path, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'import streamlit' in content or 'from streamlit' in content:
                            logger.info(f"Found streamlit import in: {file}")
                            return file
                except Exception as e:
                    logger.warning(f"Could not read {file}: {e}")
                    continue
        
        return None
    
    @staticmethod
    def validate_bundle(extracted_path: str) -> Tuple[bool, str, Dict]:
        """
        Validate the extracted bundle for required files and security.
        
        Args:
            extracted_path: Path to extracted content
            
        Returns:
            Tuple of (is_valid, error_message, file_info)
        """
        file_info = {
            'app_file': None,
            'model_files': [],
            'requirements_file': None,
            'other_files': []
        }
        
        logger.info(f"=== Starting bundle validation for: {extracted_path} ===")
        
        files = ArchiveService.get_file_list(extracted_path)
        
        if not files:
            logger.error("Archive is empty - no files found!")
            return False, "Archive is empty", file_info
        
        logger.info(f"=== Checking for blocked file types ===")
        # Check for blocked file types
        for file in files:
            _, ext = os.path.splitext(file.lower())
            if ext in ArchiveService.BLOCKED_EXTENSIONS:
                logger.error(f"Blocked file type found: {file}")
                return False, f"Blocked file type found: {file}", file_info
        
        logger.info(f"=== Looking for requirements.txt ===")
        # Find requirements.txt
        if 'requirements.txt' in files:
            file_info['requirements_file'] = 'requirements.txt'
            logger.info("Found requirements.txt in root")
        else:
            # Look in subdirectories
            for file in files:
                if file.endswith('requirements.txt'):
                    file_info['requirements_file'] = file
                    logger.info(f"Found requirements.txt at: {file}")
                    break
        
        if not file_info['requirements_file']:
            logger.error("requirements.txt NOT FOUND!")
            return False, "requirements.txt is required but not found", file_info
        
        logger.info(f"=== Looking for Streamlit entry file ===")
        logger.info(f"Checking for: {ArchiveService.STREAMLIT_ENTRY_FILES}")
        # Find Streamlit entry file
        entry_file = ArchiveService.find_streamlit_entry(extracted_path)
        if not entry_file:
            logger.error("No Streamlit entry file found!")
            return False, "No Streamlit entry file found (app.py, main.py, or streamlit_app.py)", file_info
        
        file_info['app_file'] = entry_file
        logger.info(f"Found Streamlit entry file: {entry_file}")
        
        logger.info(f"=== Categorizing remaining files ===")
        # Categorize files
        for file in files:
            _, ext = os.path.splitext(file.lower())
            
            if file == file_info['app_file']:
                continue
            elif file == file_info['requirements_file']:
                continue
            elif ext in ArchiveService.MODEL_EXTENSIONS:
                file_info['model_files'].append(file)
                logger.info(f"  Model file: {file}")
            else:
                file_info['other_files'].append(file)
                logger.info(f"  Other file: {file}")
        
        logger.info(f"=== Bundle validation SUCCESSFUL ===")
        logger.info(f"  App file: {file_info['app_file']}")
        logger.info(f"  Requirements: {file_info['requirements_file']}")
        logger.info(f"  Model files: {file_info['model_files']}")
        logger.info(f"  Other files: {file_info['other_files']}")
        return True, "", file_info
    
    @staticmethod
    def get_requirements_content(extracted_path: str, requirements_file: str) -> Optional[str]:
        """
        Read the contents of requirements.txt.
        
        Args:
            extracted_path: Path to extracted content
            requirements_file: Relative path to requirements file
            
        Returns:
            Contents of requirements.txt or None
        """
        try:
            file_path = os.path.join(extracted_path, requirements_file)
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading requirements: {e}")
            return None


# Global archive service instance
archive_service = ArchiveService()
