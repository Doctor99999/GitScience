#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
gitscience_importer.py — Автоматический импорт научных статей из arXiv API
"""

import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, Any

class GitScienceImporter:
    @staticmethod
    def fetch_arxiv(arxiv_id: str) -> Dict[str, Any]:
        """
        Выкачивает метаданные и аннотацию статьи из arXiv по её ID (например: '2104.08821' или '2303.08774')
        """
        clean_id = arxiv_id.strip().replace("arXiv:", "")
        url = f"http://export.arxiv.org/api/query?id_list={clean_id}"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'GitScience/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                xml_data = response.read()
        except Exception as e:
            raise RuntimeError(f"Не удалось связаться с arXiv API: {e}")

        # Разбор XML ответа
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        entry = root.find('atom:entry', namespace)

        if entry is None:
            raise ValueError(f"Статья с ID '{clean_id}' не найдена в системе arXiv.")

        title = entry.find('atom:title', namespace).text.strip().replace('\n', ' ')
        summary = entry.find('atom:summary', namespace).text.strip()
        authors = [author.find('atom:name', namespace).text for author in entry.findall('atom:author', namespace)]

        # Формирование текста статьи в формате Markdown
        markdown_content = f"""# {title}

**Авторы:** {', '.join(authors)}  
**Идентификатор источника:** arXiv:{clean_id}  
**Статус:** Автоматически импортировано в GitScience™  

## Аннотация (Abstract)
{summary}

## Скомпилированная модель
Base_Risk = 10.0
Risk_Score = Base_Risk * 1.5
"""

        return {
            "title": title,
            "authors": authors,
            "arxiv_id": clean_id,
            "content": markdown_content
        }