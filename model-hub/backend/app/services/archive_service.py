"""
Archive service for extracting and validating ZIP/RAR files.
"""

import os
import re
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
    
    # Hidden/system files and folders to ignore (macOS, Windows, Linux)
    IGNORED_PATTERNS = [
        '__MACOSX',           # macOS archive metadata folder
        '.DS_Store',          # macOS folder metadata
        '._',                 # macOS resource fork files
        '.Spotlight-V100',    # macOS Spotlight index
        '.Trashes',           # macOS trash
        '.fseventsd',         # macOS file system events
        'Thumbs.db',          # Windows thumbnail cache
        'desktop.ini',        # Windows folder settings
        '.git',               # Git repository
        '.svn',               # SVN repository
        '.hg',                # Mercurial repository
        '__pycache__',        # Python bytecode cache
        '.pytest_cache',      # Pytest cache
        '.mypy_cache',        # Mypy cache
        '.ipynb_checkpoints', # Jupyter checkpoints
        '.venv',              # Virtual environment
        'venv',               # Virtual environment
        'node_modules',       # Node.js modules
    ]
    
    @staticmethod
    def should_ignore(path: str) -> bool:
        """
        Check if a file or directory should be ignored.
        
        Args:
            path: File or directory path to check
            
        Returns:
            True if the path should be ignored
        """
        # Get all path components
        parts = path.replace('\\', '/').split('/')
        
        for part in parts:
            # Check exact matches
            if part in ArchiveService.IGNORED_PATTERNS:
                return True
            # Check prefix matches (e.g., ._ files on macOS)
            for pattern in ArchiveService.IGNORED_PATTERNS:
                if part.startswith(pattern):
                    return True
            # Check hidden files (starting with .)
            if part.startswith('.') and part not in ['.', '..']:
                # Allow some dotfiles that might be needed
                allowed_dotfiles = ['.env', '.env.example', '.gitignore', '.dockerignore']
                if part not in allowed_dotfiles:
                    return True
        
        return False
    
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
    def cleanup_hidden_files(directory: str) -> int:
        """
        Remove hidden/system files from an existing directory.
        Useful for cleaning up already-extracted archives.
        
        Args:
            directory: Path to the directory to clean
            
        Returns:
            Number of files/directories removed
        """
        removed_count = 0
        
        if not os.path.exists(directory):
            return 0
        
        logger.info(f"Cleaning hidden/system files from: {directory}")
        
        # First pass: collect items to remove
        items_to_remove = []
        
        for root, dirs, files in os.walk(directory, topdown=False):
            # Check files
            for filename in files:
                if ArchiveService.should_ignore(filename):
                    items_to_remove.append(os.path.join(root, filename))
            
            # Check directories
            for dirname in dirs:
                if ArchiveService.should_ignore(dirname):
                    items_to_remove.append(os.path.join(root, dirname))
        
        # Second pass: remove items
        for item_path in items_to_remove:
            try:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                    logger.info(f"  Removed file: {item_path}")
                    removed_count += 1
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                    logger.info(f"  Removed directory: {item_path}")
                    removed_count += 1
            except Exception as e:
                logger.warning(f"  Could not remove {item_path}: {e}")
        
        logger.info(f"Cleaned up {removed_count} hidden/system items")
        return removed_count
    
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
                    all_files = zip_ref.namelist()
                    logger.info(f"  ZIP contents (raw): {all_files}")
                    
                    # Filter out hidden/system files
                    filtered_files = [f for f in all_files if not ArchiveService.should_ignore(f)]
                    ignored_files = [f for f in all_files if ArchiveService.should_ignore(f)]
                    
                    if ignored_files:
                        logger.info(f"  Ignoring system/hidden files: {ignored_files}")
                    logger.info(f"  Files to extract: {filtered_files}")
                    
                    # Check for zip bombs (files that expand to huge sizes)
                    total_size = sum(
                        info.file_size for info in zip_ref.infolist() 
                        if not ArchiveService.should_ignore(info.filename)
                    )
                    max_size = settings.max_upload_size_bytes * 10  # Allow 10x expansion
                    
                    logger.info(f"  Total uncompressed size: {total_size} bytes")
                    
                    if total_size > max_size:
                        return False, f"Archive expands to {total_size} bytes, exceeds limit"
                    
                    # Extract only non-ignored files
                    for member in filtered_files:
                        zip_ref.extract(member, dest_path)
                    
            elif ArchiveService.is_rar_file(file_path):
                logger.info("  Archive type: RAR")
                with rarfile.RarFile(file_path, 'r') as rar_ref:
                    all_files = rar_ref.namelist()
                    filtered_files = [f for f in all_files if not ArchiveService.should_ignore(f)]
                    ignored_files = [f for f in all_files if ArchiveService.should_ignore(f)]
                    
                    if ignored_files:
                        logger.info(f"  Ignoring system/hidden files: {ignored_files}")
                    
                    # Extract only non-ignored files
                    for member in filtered_files:
                        rar_ref.extract(member, dest_path)
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
        Get list of all files in extracted directory, excluding hidden/system files.
        
        Args:
            extracted_path: Path to extracted content
            
        Returns:
            List of relative file paths (filtered)
        """
        files = []
        ignored_files = []
        logger.info(f"=== Scanning extracted directory: {extracted_path} ===")
        
        for root, dirs, filenames in os.walk(extracted_path):
            # Filter out ignored directories to prevent descending into them
            dirs[:] = [d for d in dirs if not ArchiveService.should_ignore(d)]
            
            logger.info(f"  Directory: {root}")
            logger.info(f"  Subdirs: {dirs}")
            logger.info(f"  Files: {filenames}")
            
            for filename in filenames:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, extracted_path)
                
                # Skip hidden/system files
                if ArchiveService.should_ignore(relative_path):
                    ignored_files.append(relative_path)
                    logger.info(f"    -> Ignoring: {relative_path}")
                    continue
                    
                files.append(relative_path)
                logger.info(f"    -> Found file: {relative_path}")
        
        if ignored_files:
            logger.info(f"=== Ignored {len(ignored_files)} hidden/system files ===")
        logger.info(f"=== Total valid files found: {len(files)} ===")
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
    def extract_model_paths_from_code(code_content: str) -> List[Dict[str, str]]:
        """
        Extract model file paths from Python code by analyzing loading patterns.
        
        Args:
            code_content: The Python source code to analyze
            
        Returns:
            List of dicts with 'path' and 'pattern' keys
        """
        model_paths = []
        
        # Model file extensions to look for
        model_ext_pattern = r'(?:pkl|pt|pth|h5|onnx|pb|weights|bin|model|safetensors)'
        
        # Common model loading patterns to look for
        patterns = [
            # YOLO('path/to/model.pt') - YOLOv8 ultralytics
            r"YOLO\s*\(\s*['\"]([^'\"]+)['\"]",
            # joblib.load('path/to/model.pkl')
            r"joblib\.load\s*\(\s*['\"]([^'\"]+)['\"]",
            # pickle.load(open('model.pkl', 'rb'))
            r"pickle\.load\s*\(\s*open\s*\(\s*['\"]([^'\"]+)['\"]",
            # Path('models/model.pkl')
            rf"Path\s*\(\s*['\"]([^'\"]+\.(?:{model_ext_pattern}))['\"]",
            # torch.load('model.pt')
            r"torch\.load\s*\(\s*['\"]([^'\"]+)['\"]",
            # tf.keras.models.load_model('model.h5')
            r"load_model\s*\(\s*['\"]([^'\"]+)['\"]",
            # load_weights('model.weights')
            r"load_weights\s*\(\s*['\"]([^'\"]+)['\"]",
            # onnxruntime.InferenceSession('model.onnx')
            r"InferenceSession\s*\(\s*['\"]([^'\"]+)['\"]",
            # open('model.pkl', 'rb')
            rf"open\s*\(\s*['\"]([^'\"]+\.(?:{model_ext_pattern}))['\"][^)]*['\"]rb['\"]",
            # with open('model.pkl', 'rb') as f:
            rf"with\s+open\s*\(\s*['\"]([^'\"]+\.(?:{model_ext_pattern}))['\"]",
            # MODEL_PATH = 'models/model.pkl' or model_path = '...'
            rf"(?:MODEL_PATH|model_path|MODEL_FILE|model_file|WEIGHTS_PATH|weights_path)\s*=\s*['\"]([^'\"]+\.(?:{model_ext_pattern}))['\"]",
            # pd.read_pickle('model.pkl')
            r"read_pickle\s*\(\s*['\"]([^'\"]+)['\"]",
            # Generic: any string that looks like a model path with extension
            rf"['\"]([^'\"]*(?:model|weight|checkpoint|best|last)[^'\"]*\.(?:{model_ext_pattern}))['\"]",
            # st.selectbox options or any list with model paths
            rf"['\"]([^'\"]+\.(?:{model_ext_pattern}))['\"]",
        ]
        
        for pattern in patterns:
            try:
                matches = re.findall(pattern, code_content, re.IGNORECASE)
                for match in matches:
                    # Clean up the path
                    path = match.strip()
                    # Skip if empty, too short, or looks like a URL
                    if not path or len(path) < 3 or path.startswith('http'):
                        continue
                    # Skip if it doesn't have a model extension
                    ext = os.path.splitext(path)[1].lower()
                    if ext not in ['.pkl', '.pt', '.pth', '.h5', '.onnx', '.pb', '.weights', '.bin', '.model', '.safetensors']:
                        continue
                    if path not in [p['path'] for p in model_paths]:
                        model_paths.append({
                            'path': path,
                            'pattern': pattern[:50] + '...'
                        })
                        logger.info(f"  Found model path in code: {path}")
            except Exception as e:
                logger.warning(f"  Pattern matching error: {e}")
                continue
        
        return model_paths
    
    @staticmethod
    def resolve_model_paths(extracted_path: str, app_file: str, model_files: List[str]) -> List[Dict[str, str]]:
        """
        Analyze the app file to find expected model paths and resolve mismatches.
        
        Args:
            extracted_path: Path to extracted content
            app_file: Relative path to the main app file
            model_files: List of model files found in the bundle
            
        Returns:
            List of actions taken (for logging)
        """
        actions = []
        
        if not model_files:
            logger.info("=== No model files to resolve ===")
            return actions
        
        logger.info(f"=== Resolving model paths ===")
        logger.info(f"  App file: {app_file}")
        logger.info(f"  Found model files: {model_files}")
        
        # Read the app file content
        app_file_path = os.path.join(extracted_path, app_file)
        try:
            with open(app_file_path, 'r', encoding='utf-8') as f:
                code_content = f.read()
        except Exception as e:
            logger.error(f"  Could not read app file: {e}")
            return actions
        
        # Extract expected model paths from code
        expected_paths = ArchiveService.extract_model_paths_from_code(code_content)
        
        if not expected_paths:
            logger.info("  No model loading patterns found in code")
            return actions
        
        logger.info(f"  Expected model paths from code: {[p['path'] for p in expected_paths]}")
        
        # Get the base directory of the app file (for relative path resolution)
        app_dir = os.path.dirname(app_file)
        
        # Pre-compute model files by extension for aggressive matching
        models_by_extension: Dict[str, List[str]] = {}
        for model_file in model_files:
            ext = os.path.splitext(model_file)[1].lower()
            if ext not in models_by_extension:
                models_by_extension[ext] = []
            models_by_extension[ext].append(model_file)
        
        logger.info(f"  Available models by extension: {models_by_extension}")
        
        # Try to match each expected path with available model files
        for expected in expected_paths:
            expected_path = expected['path']
            
            # Normalize the expected path
            expected_normalized = expected_path.replace('\\', '/')
            expected_filename = os.path.basename(expected_normalized)
            expected_extension = os.path.splitext(expected_filename)[1].lower()
            
            # Build the full expected path relative to extracted_path
            if app_dir:
                full_expected_path = os.path.join(app_dir, expected_normalized).replace('\\', '/')
            else:
                full_expected_path = expected_normalized
            
            # Check if this path already exists
            expected_full_path = os.path.join(extracted_path, full_expected_path)
            if os.path.exists(expected_full_path):
                logger.info(f"  ✓ Model already at expected location: {full_expected_path}")
                continue
            
            # AGGRESSIVE MATCHING: If there's only ONE model file with the same extension, just use it!
            same_ext_models = models_by_extension.get(expected_extension, [])
            if len(same_ext_models) == 1:
                best_match = same_ext_models[0]
                logger.info(f"  ⚡ Aggressive match: Only one {expected_extension} file found: {best_match}")
            else:
                # Find a matching model file using scoring
                best_match = None
                best_score = 0
                
                for model_file in model_files:
                    model_filename = os.path.basename(model_file)
                    model_extension = os.path.splitext(model_filename)[1].lower()
                    
                    # Check if already at expected location
                    if model_file.replace('\\', '/') == full_expected_path:
                        best_match = None  # Already correct
                        break
                    
                    score = 0
                    
                    # Same extension = must match
                    if model_extension == expected_extension:
                        score += 10
                    
                    # Same filename = high match
                    if model_filename.lower() == expected_filename.lower():
                        score += 20
                    
                    # Similar filename (contains key parts)
                    expected_name_parts = re.split(r'[_\-\s]', os.path.splitext(expected_filename)[0].lower())
                    model_name_parts = re.split(r'[_\-\s]', os.path.splitext(model_filename)[0].lower())
                    
                    for part in expected_name_parts:
                        if part in model_name_parts:
                            score += 5
                    
                    # Extension must match for it to be a valid candidate
                    if model_extension == expected_extension and score > best_score:
                        best_score = score
                        best_match = model_file
                
                # FALLBACK: If we have multiple models with same extension but none matched well,
                # and the expected filename is a common name like "best.pt" or "model.pt",
                # try to find any model with the same extension
                if best_match is None and expected_extension in models_by_extension:
                    common_names = ['best', 'model', 'weights', 'last', 'final', 'trained', 'checkpoint']
                    expected_base = os.path.splitext(expected_filename)[0].lower()
                    if expected_base in common_names or len(same_ext_models) > 0:
                        # Just use the first available model with matching extension
                        best_match = same_ext_models[0]
                        logger.info(f"  ⚡ Fallback match: Using first {expected_extension} file: {best_match}")
            
            if best_match:
                # Create the target directory if needed
                target_dir = os.path.dirname(expected_full_path)
                if target_dir:
                    os.makedirs(target_dir, exist_ok=True)
                
                # Move/copy the model file
                source_path = os.path.join(extracted_path, best_match)
                
                try:
                    # Copy instead of move to preserve the original
                    shutil.copy2(source_path, expected_full_path)
                    
                    action = {
                        'type': 'model_relocated',
                        'from': best_match,
                        'to': full_expected_path,
                        'reason': f"Code expects model at '{expected_path}'"
                    }
                    actions.append(action)
                    
                    logger.info(f"  ✓ Copied model: {best_match} -> {full_expected_path}")
                    logger.info(f"    Reason: Code expects '{expected_path}'")
                    
                except Exception as e:
                    logger.error(f"  ✗ Failed to copy model {best_match}: {e}")
            else:
                logger.warning(f"  ✗ No matching model file found for expected path: {expected_path}")
        
        return actions
    
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
        
        # === INTELLIGENT MODEL PATH RESOLUTION ===
        # Analyze the app file and automatically move/rename model files
        # to match the expected paths in the code
        if file_info['model_files'] and file_info['app_file']:
            logger.info(f"=== Starting intelligent model path resolution ===")
            actions = ArchiveService.resolve_model_paths(
                extracted_path, 
                file_info['app_file'], 
                file_info['model_files']
            )
            
            if actions:
                file_info['model_relocations'] = actions
                logger.info(f"  Performed {len(actions)} model file relocations")
                
                # Re-scan to update model_files list with new locations
                updated_files = ArchiveService.get_file_list(extracted_path)
                file_info['model_files'] = []
                for file in updated_files:
                    _, ext = os.path.splitext(file.lower())
                    if ext in ArchiveService.MODEL_EXTENSIONS:
                        if file not in file_info['model_files']:
                            file_info['model_files'].append(file)
        
        logger.info(f"=== Bundle validation SUCCESSFUL ===")
        logger.info(f"  App file: {file_info['app_file']}")
        logger.info(f"  Requirements: {file_info['requirements_file']}")
        logger.info(f"  Model files: {file_info['model_files']}")
        logger.info(f"  Other files: {file_info['other_files']}")
        if file_info.get('model_relocations'):
            logger.info(f"  Model relocations: {len(file_info['model_relocations'])}")
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
