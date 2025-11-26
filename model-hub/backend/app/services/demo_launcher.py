"""
Demo launcher service for managing Streamlit app instances.
Creates virtual environments and launches Streamlit apps on-demand.
"""

import os
import sys
import subprocess
import asyncio
import signal
from typing import Optional, Dict, Tuple
import logging
from datetime import datetime

from app.config import settings
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)


class DemoLauncher:
    """Service for launching and managing Streamlit demo instances."""
    
    # Track running demos: {project_id: {pid, port, started_at}}
    running_demos: Dict[str, Dict] = {}
    
    # Track used ports
    used_ports: set = set()
    
    def __init__(self):
        """Initialize the demo launcher."""
        self.base_path = settings.demo_environments_path
        os.makedirs(self.base_path, exist_ok=True)
    
    def get_project_path(self, project_id: str) -> str:
        """Get the local path for a project's environment."""
        return os.path.join(self.base_path, project_id)
    
    def get_venv_path(self, project_id: str) -> str:
        """Get the virtual environment path for a project."""
        return os.path.join(self.get_project_path(project_id), "venv")
    
    def get_files_path(self, project_id: str) -> str:
        """Get the project files path."""
        return os.path.join(self.get_project_path(project_id), "files")
    
    def get_available_port(self) -> Optional[int]:
        """
        Find an available port for the Streamlit app.
        
        Returns:
            An available port number or None if all ports are in use
        """
        for port in range(settings.demo_port_start, settings.demo_port_end + 1):
            if port not in self.used_ports:
                return port
        return None
    
    async def setup_environment(self, project_id: str) -> Tuple[bool, str]:
        """
        Set up the project environment: download files and create venv.
        
        Args:
            project_id: The project ID
            
        Returns:
            Tuple of (success, error_message)
        """
        project_path = self.get_project_path(project_id)
        venv_path = self.get_venv_path(project_id)
        files_path = self.get_files_path(project_id)
        
        try:
            # Create directories
            os.makedirs(project_path, exist_ok=True)
            os.makedirs(files_path, exist_ok=True)
            
            # Download project files from S3
            logger.info(f"Downloading project files for {project_id}")
            success = await s3_service.download_project(project_id, files_path)
            
            if not success:
                return False, "Failed to download project files from S3"
            
            # Create virtual environment
            logger.info(f"Creating virtual environment for {project_id}")
            result = subprocess.run(
                [sys.executable, "-m", "venv", venv_path],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return False, f"Failed to create venv: {result.stderr}"
            
            # Install requirements
            pip_path = os.path.join(venv_path, "bin", "pip") if os.name != 'nt' else os.path.join(venv_path, "Scripts", "pip.exe")
            requirements_path = os.path.join(files_path, "requirements.txt")
            
            if os.path.exists(requirements_path):
                logger.info(f"Installing requirements for {project_id}")
                result = subprocess.run(
                    [pip_path, "install", "-r", requirements_path],
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode != 0:
                    logger.warning(f"Some packages may have failed to install: {result.stderr}")
            
            # Always install streamlit
            subprocess.run(
                [pip_path, "install", "streamlit"],
                capture_output=True,
                text=True
            )
            
            logger.info(f"Environment setup complete for {project_id}")
            return True, ""
            
        except subprocess.TimeoutExpired:
            return False, "Timeout while installing dependencies"
        except Exception as e:
            logger.error(f"Error setting up environment: {e}")
            return False, str(e)
    
    async def launch_demo(self, project_id: str, app_file: str = "app.py") -> Tuple[bool, str, Optional[str], Optional[int]]:
        """
        Launch a Streamlit demo for a project.
        
        Args:
            project_id: The project ID
            app_file: The main Streamlit app file
            
        Returns:
            Tuple of (success, message, demo_url, port)
        """
        # Check if already running
        if project_id in self.running_demos:
            demo = self.running_demos[project_id]
            demo_url = f"{settings.demo_base_url}:{demo['port']}"
            return True, "Demo is already running", demo_url, demo['port']
        
        # Get available port
        port = self.get_available_port()
        if not port:
            return False, "No available ports. Please try again later.", None, None
        
        venv_path = self.get_venv_path(project_id)
        files_path = self.get_files_path(project_id)
        
        # Check if environment exists, if not set it up
        if not os.path.exists(venv_path):
            success, error = await self.setup_environment(project_id)
            if not success:
                return False, error, None, None
        
        try:
            # Get streamlit path
            streamlit_path = os.path.join(venv_path, "bin", "streamlit") if os.name != 'nt' else os.path.join(venv_path, "Scripts", "streamlit.exe")
            app_path = os.path.join(files_path, app_file)
            
            if not os.path.exists(app_path):
                return False, f"App file not found: {app_file}", None, None
            
            # Launch Streamlit
            logger.info(f"Launching Streamlit for {project_id} on port {port}")
            
            process = subprocess.Popen(
                [
                    streamlit_path, "run", app_path,
                    "--server.port", str(port),
                    "--server.address", "0.0.0.0",
                    "--server.headless", "true",
                    "--browser.gatherUsageStats", "false"
                ],
                cwd=files_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid if os.name != 'nt' else None
            )
            
            # Give it a moment to start
            await asyncio.sleep(2)
            
            # Check if process is still running
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                return False, f"Streamlit failed to start: {stderr.decode()}", None, None
            
            # Record the running demo
            self.running_demos[project_id] = {
                'pid': process.pid,
                'port': port,
                'process': process,
                'started_at': datetime.utcnow()
            }
            self.used_ports.add(port)
            
            demo_url = f"{settings.demo_base_url}:{port}"
            logger.info(f"Demo launched at {demo_url}")
            
            return True, "Demo launched successfully", demo_url, port
            
        except Exception as e:
            logger.error(f"Error launching demo: {e}")
            return False, str(e), None, None
    
    async def stop_demo(self, project_id: str) -> Tuple[bool, str]:
        """
        Stop a running demo.
        
        Args:
            project_id: The project ID
            
        Returns:
            Tuple of (success, message)
        """
        if project_id not in self.running_demos:
            return False, "Demo is not running"
        
        try:
            demo = self.running_demos[project_id]
            process = demo.get('process')
            
            if process:
                # Try graceful shutdown first
                if os.name != 'nt':
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                else:
                    process.terminate()
                
                # Wait for process to end
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Force kill
                    if os.name != 'nt':
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    else:
                        process.kill()
            
            # Release port
            self.used_ports.discard(demo['port'])
            
            # Remove from tracking
            del self.running_demos[project_id]
            
            logger.info(f"Demo stopped for {project_id}")
            return True, "Demo stopped successfully"
            
        except Exception as e:
            logger.error(f"Error stopping demo: {e}")
            return False, str(e)
    
    def get_demo_status(self, project_id: str) -> Dict:
        """
        Get the status of a demo.
        
        Args:
            project_id: The project ID
            
        Returns:
            Status dictionary
        """
        if project_id not in self.running_demos:
            return {
                'status': 'stopped',
                'demo_url': None,
                'message': 'Demo is not running'
            }
        
        demo = self.running_demos[project_id]
        process = demo.get('process')
        
        # Check if process is still running
        if process and process.poll() is not None:
            # Process has ended
            self.used_ports.discard(demo['port'])
            del self.running_demos[project_id]
            return {
                'status': 'stopped',
                'demo_url': None,
                'message': 'Demo has stopped'
            }
        
        return {
            'status': 'running',
            'demo_url': f"{settings.demo_base_url}:{demo['port']}",
            'port': demo['port'],
            'started_at': demo['started_at'].isoformat(),
            'message': 'Demo is running'
        }
    
    async def cleanup_environment(self, project_id: str) -> bool:
        """
        Clean up a project's environment (venv and files).
        
        Args:
            project_id: The project ID
            
        Returns:
            True if successful
        """
        # Stop demo first if running
        if project_id in self.running_demos:
            await self.stop_demo(project_id)
        
        project_path = self.get_project_path(project_id)
        
        try:
            if os.path.exists(project_path):
                import shutil
                shutil.rmtree(project_path)
                logger.info(f"Cleaned up environment for {project_id}")
            return True
        except Exception as e:
            logger.error(f"Error cleaning up environment: {e}")
            return False


# Global demo launcher instance
demo_launcher = DemoLauncher()
