#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_core.py — Системный Git-движок и управление репозиториями """
import os
import logging
from pathlib import Path
from typing import Optional, List, Tuple

try:
    import git
    from git import Repo
except ImportError:
    raise ImportError("Требуется GitPython: pip install GitPython")

logger = logging.getLogger("GitScienceCore")

class GitScienceCore:
    def __init__(self, base_repo_dir: Path):
        self.base_dir = Path(base_repo_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.repo_path = self.base_dir / "main_repo"
        if not (self.repo_path / ".git").exists():
            self.repo = Repo.init(self.repo_path)
            logger.info(f"Инициализирован репозиторий: {self.repo_path}")
        else:
            self.repo = Repo(self.repo_path)

    def commit_changes(self, message: str) -> str:
        self.repo.git.add(A=True)
        commit = self.repo.index.commit(message)
        return commit.hexsha